export type NodeStatus = 'ONLINE' | 'WARNING' | 'DEGRADED' | 'CRITICAL' | 'RECOVERING';

export type FailureSeverity = 'LOW' | 'MEDIUM' | 'CRITICAL';

export type FailureType =
  | 'Equipment Failure'
  | 'Cyber Attack'
  | 'Physical Disruption'
  | 'Extreme Weather Event';

export type InterventionType =
  | 'generator'
  | 'reroute'
  | 'hospital'
  | 'none';

export interface DigitalTwinNode {
  id: string;
  name: string;
  shortName: string;
  sector: 'POWER' | 'WATER' | 'TELECOM' | 'HEALTHCARE' | 'EMERGENCY' | 'INDUSTRY' | 'RESIDENTIAL';
  x: number; // percentage in map coordinate system (0 to 100)
  y: number; // percentage in map coordinate system (0 to 100)
  status: NodeStatus;
  health: number; // 0 to 100%
  load: number; // percentage
  connections: string[]; // target node IDs
  isIsolated?: boolean;
  hasBackupPower?: boolean;
  description: string;
}

export interface DependencyLink {
  from: string;
  to: string;
  label?: string;
  delaySec: number;
}

export interface TelemetryState {
  systemHealth: number; // 0 - 100%
  activeNodes: number; // e.g. 8 / 8
  affectedNodes: number; // 0 to 8
  populationAtRisk: number; // e.g. 42,500
  cascadeRisk: 'LOW' | 'ELEVATED' | 'CRITICAL' | 'CONTAINED';
  estRecoveryMin: number | null; // e.g. 37 or 18 or null
  cascadeDepth: number;
  servicesProtectedPct: number;
}

export interface CascadeStreamEvent {
  id: string;
  timeSec: number;
  timeLabel: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'recovery';
  targetNodeId?: string;
}

export interface InterventionOption {
  id: InterventionType;
  title: string;
  tagline: string;
  description: string;
  projectedStats: {
    populationAffected: { before: string; after: string };
    servicesAffected: { before: string; after: string };
    recoveryTime: { before: string; after: string };
    cascadeDepth: { before: string; after: string };
    risk: { before: string; after: string };
    improvementPct: number;
  };
}
