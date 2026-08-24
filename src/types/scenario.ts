import { RecoveryAction } from './recovery';

export interface InitialFailure {
  nodeId: string;
  time: number; // usually 0
}

export interface SimulationParameters {
  maxSimulationTime: number; // e.g. 60 or 120 minutes
  defaultPropagationDelay: number; // e.g. 5 minutes
  defaultRecoveryDuration: number; // e.g. 10 minutes
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  graphVersion: string;
  initialFailures: InitialFailure[];
  parameters: SimulationParameters;
  recoveryActions: RecoveryAction[];
}
