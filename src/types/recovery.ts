export type RecoveryActionType =
  | 'REPAIR'
  | 'BACKUP_POWER'
  | 'RESTORE_NETWORK'
  | 'ISOLATE';

export interface RecoveryAction {
  id: string;
  nodeId: string;
  type: RecoveryActionType;
  startTime: number; // Simulated timestamp when action was dispatched
  duration: number; // Simulated minutes needed to complete recovery
  description?: string;
}
