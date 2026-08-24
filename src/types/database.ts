import { InitialFailure, SimulationParameters } from './scenario';
import { RecoveryAction } from './recovery';
import { SimulationEvent } from './event';
import { SimulationMetrics } from './simulation';

/**
 * Raw database row shape for the `scenarios` table.
 */
export interface ScenarioRow {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  graph_version: string;
  initial_failures: InitialFailure[];
  parameters: SimulationParameters | null;
  recovery_actions: RecoveryAction[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Payload for inserting a new row into `scenarios`.
 */
export interface ScenarioInsert {
  id?: string;
  user_id?: string | null;
  name: string;
  description?: string | null;
  graph_version: string;
  initial_failures: InitialFailure[];
  parameters?: SimulationParameters | null;
  recovery_actions?: RecoveryAction[] | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Raw database row shape for the `simulation_runs` table.
 */
export interface SimulationRunRow {
  id: string;
  user_id: string | null;
  scenario_id: string | null;
  graph_version: string;
  initial_failures: InitialFailure[];
  metrics: SimulationMetrics;
  event_log: SimulationEvent[];
  deterministic_hash: string;
  created_at: string;
}

/**
 * Payload for inserting a new row into `simulation_runs`.
 */
export interface SimulationRunInsert {
  id?: string;
  user_id?: string | null;
  scenario_id?: string | null;
  graph_version: string;
  initial_failures: InitialFailure[];
  metrics: SimulationMetrics;
  event_log: SimulationEvent[];
  deterministic_hash: string;
  created_at?: string;
}

/**
 * Supabase Database definition schema.
 */
export interface Database {
  public: {
    Tables: {
      scenarios: {
        Row: ScenarioRow;
        Insert: ScenarioInsert;
        Update: Partial<ScenarioInsert>;
      };
      simulation_runs: {
        Row: SimulationRunRow;
        Insert: SimulationRunInsert;
        Update: Partial<SimulationRunInsert>;
      };
    };
  };
}
