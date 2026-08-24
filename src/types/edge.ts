export type DependencyType = 'REQUIRED' | 'OPTIONAL';

export type DependencyKind =
  | 'POWER'
  | 'NETWORK'
  | 'WATER'
  | 'OPERATIONAL'
  | 'FUEL';

export type FailureImpact = 'DEGRADE' | 'FAIL';

export interface DependencyEdge {
  id: string;
  from: string; // source / upstream node ID
  to: string; // target / dependent node ID
  dependencyType: DependencyType;
  dependencyKind?: DependencyKind;
  propagationDelay: number; // simulated minutes before effect propagates
  failureImpact: FailureImpact;
  description?: string;
}
