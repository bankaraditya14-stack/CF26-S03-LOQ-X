export type NodeStatus =
  | 'HEALTHY'
  | 'AT_RISK'
  | 'DEGRADED'
  | 'FAILED'
  | 'RECOVERING';

export type ServiceType =
  | 'POWER'
  | 'WATER'
  | 'TELECOM'
  | 'TRAFFIC'
  | 'HOSPITAL'
  | 'EMERGENCY'
  | 'SEWAGE'
  | 'TRANSPORT'
  | 'FUEL'
  | 'MUNICIPAL';

export type Criticality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ServiceNode {
  id: string;
  name: string;
  type: ServiceType;
  zone: string;
  criticality: Criticality;
  initialState: NodeStatus;
  recoveryTime: number; // Duration in simulated minutes
  position: {
    x: number;
    y: number;
  };
  description?: string;
}
