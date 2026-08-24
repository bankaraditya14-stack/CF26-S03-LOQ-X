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

export class StorageService {
  public static getCustomScenarios(): Scenario[] {
    try {
      const data = localStorage.getItem(CUSTOM_SCENARIOS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveCustomScenario(scenario: Scenario): void {
    try {
      const existing = this.getCustomScenarios().filter(s => s.id !== scenario.id);
      existing.push(scenario);
      localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save scenario to localStorage', e);
    }
  }

  public static deleteCustomScenario(scenarioId: string): void {
    try {
      const existing = this.getCustomScenarios().filter(s => s.id !== scenarioId);
      localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to delete scenario', e);
    }
  }

  public static getSavedRun(scenarioId: string): SavedSimulationRun | null {
    try {
      const data = localStorage.getItem(`${SAVED_RUNS_KEY}_${scenarioId}`);
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
      localStorage.setItem(`${SAVED_RUNS_KEY}_${scenarioId}`, JSON.stringify(run));
    } catch (e) {
      console.error('Failed to save simulation run', e);
    }
  }
}
