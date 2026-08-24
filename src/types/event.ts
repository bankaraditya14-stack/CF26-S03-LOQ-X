import { NodeStatus } from './node';

export type EventType =
  | 'SCENARIO_STARTED'
  | 'FAILURE_INJECTED'
  | 'STATE_CHANGED'
  | 'FAILURE_PROPAGATED'
  | 'RECOVERY_STARTED'
  | 'RECOVERY_COMPLETED'
  | 'SCENARIO_COMPLETED'
  | 'SCENARIO_RESET';

export interface EventCause {
  type: 'INITIAL_FAILURE' | 'DEPENDENCY' | 'RECOVERY_ACTION' | 'RESTORATION';
  sourceNodeId?: string;
  sourceNodeIds?: string[];
  reason?: string;
}

export interface SimulationEvent {
  id: string;
  timestamp: number; // Simulated timestamp
  type: EventType;
  targetNode: string; // Affected Node ID
  previousState: NodeStatus;
  newState: NodeStatus;
  cause: EventCause;
}
