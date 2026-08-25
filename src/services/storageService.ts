import { Scenario, SimulationEvent, SimulationMetrics } from '../types';

export interface SavedSimulationRun {
  scenarioId: string;
  scenarioName: string;
  timestamp: number;
  events: SimulationEvent[];
  metrics: SimulationMetrics;
}

const CUSTOM_SCENARIOS_KEY = 'cascade_city_custom_scenarios';
const SAVED_RUNS_KEY = 'cascade_city_saved_runs';

// Universal storage wrapper with seamless in-memory fallback for SSR/tests
const memoryStore = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return memoryStore.get(key) ?? null;
      }
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {}
    }
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
    memoryStore.delete(key);
  },
};

export class StorageService {
  public static getCustomScenarios(): Scenario[] {
    try {
      const data = safeStorage.getItem(CUSTOM_SCENARIOS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveCustomScenario(scenario: Scenario): void {
    try {
      const existing = this.getCustomScenarios().filter(s => s.id !== scenario.id);
      existing.push(scenario);
      safeStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save scenario to localStorage', e);
    }
  }

  public static deleteCustomScenario(scenarioId: string): void {
    try {
      const existing = this.getCustomScenarios().filter(s => s.id !== scenarioId);
      safeStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to delete scenario', e);
    }
  }

  public static getSavedRun(scenarioId: string): SavedSimulationRun | null {
    try {
      const data = safeStorage.getItem(`${SAVED_RUNS_KEY}_${scenarioId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public static saveRun(scenarioId: string, scenarioName: string, events: SimulationEvent[], metrics: SimulationMetrics): void {
    try {
      const run: SavedSimulationRun = {
        scenarioId,
        scenarioName,
        timestamp: Date.now(),
        events,
        metrics,
      };
      safeStorage.setItem(`${SAVED_RUNS_KEY}_${scenarioId}`, JSON.stringify(run));
    } catch (e) {
      console.error('Failed to save simulation run', e);
    }
  }
}
