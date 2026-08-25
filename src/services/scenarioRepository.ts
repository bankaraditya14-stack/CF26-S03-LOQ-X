import { Scenario, ScenarioRow, ScenarioInsert } from '../types';
import { getSupabaseClient } from './supabaseClient';
import { StorageService } from './storageService';
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
 * Maps a database ScenarioRow to the application's domain Scenario model.
 */
export function scenarioRowToDomain(row: ScenarioRow): Scenario {
  return {
    id: row.id,
    name: SecurityValidator.sanitizeString(row.name, 100, 'Custom Scenario'),
    description: SecurityValidator.sanitizeString(row.description, 500, ''),
    graphVersion: SecurityValidator.sanitizeString(row.graph_version, 50, 'city-v1'),
    initialFailures: row.initial_failures ?? [],
    parameters: row.parameters ?? {
      maxSimulationTime: 60,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 10,
    },
    recoveryActions: row.recovery_actions ?? [],
  };
}

/**
 * Maps a domain Scenario model to a database insert payload.
 */
export function domainToScenarioInsert(
  scenario: Scenario,
  userId: string | null = null
): ScenarioInsert {
  const validUserId = SecurityValidator.isValidUserId(userId) ? userId : null;
  return {
    id: SecurityValidator.sanitizeString(scenario.id, 64, `sc-${Date.now()}`),
    user_id: validUserId,
    name: SecurityValidator.sanitizeString(scenario.name, 100, 'Custom Scenario'),
    description: SecurityValidator.sanitizeString(scenario.description, 500, ''),
    graph_version: SecurityValidator.sanitizeString(scenario.graphVersion, 50, 'city-v1'),
    initial_failures: scenario.initialFailures ?? [],
    parameters: scenario.parameters ?? {
      maxSimulationTime: 60,
      defaultPropagationDelay: 5,
      defaultRecoveryDuration: 10,
    },
    recovery_actions: scenario.recoveryActions ?? [],
  };
}

/**
 * Repository interface for managing Scenarios with user-scoped Supabase remote persistence
 * (PRIMARY) and seamless fallback to localStorage (OFFLINE/UNAVAILABLE).
 */
export class ScenarioRepository {
  /**
   * Retrieves all custom/cloud scenarios for the current user or local storage.
   */
  public static async listScenarios(userId?: string | null): Promise<Scenario[]> {
    const supabase = getSupabaseClient();
    const localScenarios = StorageService.getCustomScenarios();

    if (!supabase) {
      return localScenarios;
    }

    try {
      let query = supabase
        .from('scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId && SecurityValidator.isValidUserId(userId)) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      } else {
        // Unauthenticated or non-alphanumeric userId: query public system templates only
        query = query.is('user_id', null);
      }

      const { data, error } = await executeWithTimeout(query);

      if (error || !data) {
        console.warn('Failed to fetch scenarios from Supabase; using localStorage fallback:', error);
        return localScenarios;
      }

      const cloudScenarios = data.map(scenarioRowToDomain);

      // Merge cloud and local scenarios, avoiding duplicate IDs
      const cloudIds = new Set(cloudScenarios.map(s => s.id));
      const remainingLocal = localScenarios.filter(s => !cloudIds.has(s.id));

      return [...cloudScenarios, ...remainingLocal];
    } catch (e) {
      console.warn('Supabase query failed or timed out; using localStorage fallback:', e);
      return localScenarios;
    }
  }

  /**
   * Retrieves a single scenario by its ID.
   */
  public static async getScenario(id: string): Promise<Scenario | null> {
    const sanitizedId = SecurityValidator.sanitizeString(id, 64);
    const local = StorageService.getCustomScenarios().find(s => s.id === sanitizedId);

    const supabase = getSupabaseClient();
    if (!supabase) {
      return local ?? null;
    }

    try {
      const { data, error } = await executeWithTimeout(
        supabase
          .from('scenarios')
          .select('*')
          .eq('id', sanitizedId)
          .maybeSingle()
      );

      if (error || !data) {
        return local ?? null;
      }

      return scenarioRowToDomain(data as ScenarioRow);
    } catch (e) {
      console.warn('Supabase query failed; checking localStorage fallback:', e);
      return local ?? null;
    }
  }

  /**
   * Creates or updates a scenario in persistent storage.
   */
  public static async createScenario(scenario: Scenario, userId: string | null = null): Promise<Scenario> {
    const validUserId = SecurityValidator.isValidUuid(userId) ? userId : null;
    const validated = SecurityValidator.validateScenario(scenario);
    const safeScenario = validated.valid && validated.sanitized ? validated.sanitized : scenario;

    // 1. Always persist to localStorage for offline reliability
    StorageService.saveCustomScenario(safeScenario);

    const supabase = getSupabaseClient();
    if (!supabase) {
      return safeScenario;
    }

    // 2. Persist to Supabase if available
    try {
      const insertPayload = domainToScenarioInsert(safeScenario, validUserId);
      const { data, error } = await executeWithTimeout(
        supabase
          .from('scenarios')
          .upsert(insertPayload)
          .select()
          .single()
      );

      if (error || !data) {
        console.warn('Failed to persist scenario to Supabase, saved to localStorage only:', error);
        return safeScenario;
      }

      return scenarioRowToDomain(data as ScenarioRow);
    } catch (e) {
      console.warn('Supabase insert failed or timed out, retained in localStorage:', e);
      return safeScenario;
    }
  }

  /**
   * Deletes a scenario by ID.
   */
  public static async deleteScenario(id: string): Promise<void> {
    const sanitizedId = SecurityValidator.sanitizeString(id, 64);
    // 1. Delete from local storage
    StorageService.deleteCustomScenario(sanitizedId);

    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    // 2. Delete from Supabase
    try {
      const { error } = await executeWithTimeout(
        supabase
          .from('scenarios')
          .delete()
          .eq('id', sanitizedId)
      );

      if (error) {
        console.warn('Failed to delete scenario from Supabase:', error);
      }
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }
}

