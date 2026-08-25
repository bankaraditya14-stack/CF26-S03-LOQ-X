import {
  SimulationEvent,
  SimulationMetrics,
  InitialFailure,
  SimulationRunRow,
  SimulationRunInsert,
} from '../types';
import { getSupabaseClient } from './supabaseClient';
import { StorageService, SavedSimulationRun } from './storageService';
import { SecurityValidator } from '../utils/securityValidator';

const DB_TIMEOUT_MS = 2500;

async function executeWithTimeout<T>(promise: PromiseLike<T>, timeoutMs = DB_TIMEOUT_MS): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Database operation timed out')), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result as T;
  } catch (err) {
    clearTimeout(timeoutHandle!);
    throw err;
  }
}

/**
 * In-memory deduplication cache to prevent duplicate database writes
 * for identical run completions within a short window.
 */
const recentSavedKeys = new Set<string>();

/**
 * Parameters required to record a completed simulation run.
 */
export interface SaveSimulationRunParams {
  userId?: string | null;
  scenarioId: string;
  scenarioName?: string;
  graphVersion?: string;
  initialFailures?: InitialFailure[];
  metrics: SimulationMetrics;
  events: SimulationEvent[];
  deterministicHash?: string;
}

/**
 * Helper to safely query local storage for saved runs.
 */
function getLocalSavedRuns(): SavedSimulationRun[] {
  const localRuns: SavedSimulationRun[] = [];
  try {
    if (typeof localStorage === 'undefined') return [];

    const keys = new Set<string>();

    // 1. Iterate using standard Storage API length/key
    if (typeof localStorage.length === 'number') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cascade_city_saved_runs_')) {
          keys.add(k);
        }
      }
    }

    // 2. Iterate using Object.keys
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('cascade_city_saved_runs_')) {
        keys.add(k);
      }
    }

    for (const k of keys) {
      try {
        const item = localStorage.getItem(k);
        if (item) {
          localRuns.push(JSON.parse(item));
        }
      } catch {}
    }
  } catch {}

  return localRuns.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Generates a deterministic hash summary from metrics and event logs.
 */
export function generateDeterministicHash(metrics: SimulationMetrics, events: SimulationEvent[]): string {
  const payload = JSON.stringify({
    affectedServices: metrics.affectedServices,
    cascadeDepth: metrics.cascadeDepth,
    recoveryTime: metrics.recoveryTime,
    peakImpact: metrics.peakImpact,
    timeToStabilization: metrics.timeToStabilization,
    eventCount: events.length,
    lastEventTime: events[events.length - 1]?.timestamp ?? 0,
  });

  // Fast DJB2 hash converted to hex string
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }
  return `det_${(hash >>> 0).toString(16)}`;
}

/**
 * Maps a database SimulationRunRow to the domain SavedSimulationRun format.
 */
export function simulationRunRowToDomain(
  row: SimulationRunRow,
  scenarioName = 'Simulation Run'
): SavedSimulationRun {
  return {
    scenarioId: row.scenario_id ?? 'custom',
    scenarioName,
    timestamp: new Date(row.created_at).getTime(),
    events: row.event_log ?? [],
    metrics: row.metrics,
  };
}

/**
 * Maps simulation run domain data to a database insert payload.
 */
export function domainToSimulationRunInsert(
  params: SaveSimulationRunParams
): SimulationRunInsert {
  const validUserId = SecurityValidator.isValidUserId(params.userId) ? params.userId : null;
  return {
    user_id: validUserId,
    scenario_id: params.scenarioId === 'custom' ? null : SecurityValidator.sanitizeString(params.scenarioId, 64),
    graph_version: SecurityValidator.sanitizeString(params.graphVersion, 50, '1.0.0'),
    initial_failures: params.initialFailures ?? [],
    metrics: params.metrics,
    event_log: params.events,
    deterministic_hash:
      params.deterministicHash ??
      generateDeterministicHash(params.metrics, params.events),
  };
}

/**
 * Repository interface for persisting and querying simulation run outcomes.
 * Supabase PostgreSQL serves as the PRIMARY persistence layer with localStorage fallback.
 */
export class SimulationRunRepository {
  /**
   * Saves a simulation run to Supabase PostgreSQL (primary) and localStorage (fallback).
   */
  public static async saveRun(params: SaveSimulationRunParams): Promise<SavedSimulationRun> {
    const scenarioName = SecurityValidator.sanitizeString(params.scenarioName, 100, 'Simulation Run');
    const validScenarioId = SecurityValidator.sanitizeString(params.scenarioId, 64, 'custom');
    const hash =
      params.deterministicHash ??
      generateDeterministicHash(params.metrics, params.events);
    const dedupeKey = `${validScenarioId}_${hash}`;

    const savedLocal: SavedSimulationRun = {
      scenarioId: validScenarioId,
      scenarioName,
      timestamp: Date.now(),
      events: params.events,
      metrics: params.metrics,
    };

    // Prevent duplicate database insertions within a 10s cooldown
    if (recentSavedKeys.has(dedupeKey)) {
      return savedLocal;
    }
    recentSavedKeys.add(dedupeKey);
    setTimeout(() => recentSavedKeys.delete(dedupeKey), 10000);

    // 1. Sync to local storage for offline continuity
    StorageService.saveRun(
      validScenarioId,
      scenarioName,
      params.events,
      params.metrics
    );

    const supabase = getSupabaseClient();
    if (!supabase || !SecurityValidator.isValidUserId(params.userId)) {
      return savedLocal;
    }

    // 2. Persist to Supabase PostgreSQL as PRIMARY for authenticated users
    try {
      const insertPayload = domainToSimulationRunInsert({
        ...params,
        scenarioId: validScenarioId,
        scenarioName,
        deterministicHash: hash,
      });

      const { error } = await executeWithTimeout(
        supabase
          .from('simulation_runs')
          .insert(insertPayload)
      );

      if (error) {
        console.warn('Failed to save simulation run to Supabase; run kept in localStorage:', error);
      }
    } catch (e) {
      console.warn('Supabase insert failed or timed out for simulation run:', e);
    }

    return savedLocal;
  }

  /**
   * Retrieves all simulation runs for a user (querying Supabase primary, localStorage fallback).
   */
  public static async listUserRuns(userId?: string | null): Promise<SavedSimulationRun[]> {
    const supabase = getSupabaseClient();
    if (!supabase || !userId || !SecurityValidator.isValidUserId(userId)) {
      return getLocalSavedRuns();
    }

    try {
      const query = supabase
        .from('simulation_runs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data, error } = await executeWithTimeout(query);
      if (error || !data || data.length === 0) {
        return getLocalSavedRuns();
      }

      return data.map((row) => simulationRunRowToDomain(row as SimulationRunRow));
    } catch (e) {
      console.warn('Supabase query failed or timed out, falling back to localStorage:', e);
      return getLocalSavedRuns();
    }
  }

  /**
   * Retrieves simulation runs associated with a given scenario from Supabase (primary).
   */
  public static async getRunsForScenario(scenarioId: string): Promise<SavedSimulationRun[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const local = StorageService.getSavedRun(scenarioId);
      return local ? [local] : [];
    }

    try {
      const { data, error } = await executeWithTimeout(
        supabase
          .from('simulation_runs')
          .select('*')
          .eq('scenario_id', scenarioId)
          .order('created_at', { ascending: false })
      );

      if (error || !data || data.length === 0) {
        const local = StorageService.getSavedRun(scenarioId);
        return local ? [local] : [];
      }

      return data.map((row) => simulationRunRowToDomain(row as SimulationRunRow));
    } catch (e) {
      console.warn('Supabase query failed or timed out, falling back to localStorage:', e);
      const local = StorageService.getSavedRun(scenarioId);
      return local ? [local] : [];
    }
  }

  /**
   * Retrieves a single simulation run by ID.
   */
  public static async getRun(id: string): Promise<SavedSimulationRun | null> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return null;
    }

    try {
      const { data, error } = await executeWithTimeout(
        supabase
          .from('simulation_runs')
          .select('*')
          .eq('id', id)
          .maybeSingle()
      );

      if (error || !data) {
        return null;
      }

      return simulationRunRowToDomain(data as SimulationRunRow);
    } catch (e) {
      console.warn('Supabase query failed:', e);
      return null;
    }
  }
}
