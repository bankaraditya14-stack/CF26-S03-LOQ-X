import { NodeStatus } from './node';
import { RecoveryAction, RecoveryActionType } from './recovery';
import { SimulationEvent } from './event';

export interface NodeRuntimeState {
  id: string;
  state: NodeStatus;
  previousState: NodeStatus;
  stateChangedAt: number;
  failedAt: number | null;
  recoveryStartedAt: number | null;
  recoveredAt: number | null;
  activeRecoveryType: RecoveryActionType | null;
  causes: string[]; // Upstream node IDs that contributed to non-healthy status
  cascadeDepth: number;
  isIsolated?: boolean;
  hasBackupPower?: boolean;
  isNetworkRestored?: boolean;
}

export interface SimulationMetrics {
  cascadeDepth: number; // Longest causal dependency path from initial disruption
  affectedServices: number; // Count of downstream non-healthy nodes (excluding initial root failures)
  affectedNodeIds: string[];
  recoveryTime: number; // Total simulated time to recovery or active recovery duration
  peakImpact: number; // Maximum count of simultaneously non-healthy nodes
  activeFailures: number; // Current count of failed/degraded nodes
  timeToStabilization: number; // Timestamp when no further state changes occur
  criticalServicesAffected: number; // Count of HIGH criticality services affected
}

export type SimulationStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface SimulationState {
  currentTime: number; // Simulated timestamp
  status: SimulationStatus;
  nodes: Record<string, NodeRuntimeState>;
  events: SimulationEvent[];
  metrics: SimulationMetrics;
  activeScenarioId: string;
  initialFailures: string[];
  appliedRecoveries: RecoveryAction[];
  highlightedEdgeIds: string[];
  highlightedNodeIds: string[];
}
