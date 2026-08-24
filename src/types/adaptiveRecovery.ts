import { RecoveryAction, RecoveryActionType } from './recovery';

export type StrategyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AiConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type ResidualRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AiSimulationContext {
  rootFailureNodeId: string;
  rootFailureNodeName: string;
  rootSector: string;
  failureType: string;
  failedNodeIds: string[];
  degradedNodeIds: string[];
  allAffectedNodeIds: string[];
  dependencyChain: Array<{ from: string; to: string; delay?: number; reason?: string }>;
  cascadeDepth: number;
  affectedServicesCount: number;
  totalServicesCount: number;
  populationAffected: number;
  criticalServicesAffected: string[];
  timeToTotalFailure: number;
  timeToRecovery: number;
  simulationHash: string;
  graphVersion: string;
  simTimeSec: number;
  availableNodes: Array<{ id: string; name: string; sector: string; criticality: string }>;
}

export interface AiRawStrategy {
  name: string;
  priority: StrategyPriority;
  reason: string;
  target_nodes: string[];
  actions: string[];
  action_type?: RecoveryActionType;
  required_resources?: string;
}

export interface AiGeminiResponse {
  incident_summary: string;
  priority_targets: string[];
  recommended_strategy: AiRawStrategy;
  alternative_strategies: AiRawStrategy[];
  explanation: string;
  confidence: AiConfidence;
  isFallback?: boolean;
}

export interface ValidatedStrategyResult {
  id: string;
  name: string;
  tagline: string;
  priority: StrategyPriority;
  reason: string;
  targetNodeIds: string[];
  interventionType: RecoveryActionType;
  requiredResources: string;
  actions: RecoveryAction[];
  isAiRecommended: boolean;
  isBaseline: boolean;

  // Independent Deterministic Simulation Metrics
  metrics: {
    populationAffected: number;
    citizensProtected: number;
    servicesProtectedCount: number;
    servicesStillAffectedCount: number;
    totalServicesCount: number;
    cascadeDepth: number;
    recoveryTimeMin: number;
    timeSavedMin: number;
    residualRisk: ResidualRisk;
    healthPct: number;
    criticalInfrastructureProtected: string[];
    criticalServicesStillAffected: string[];
  };

  // Comparison & Normalized Score
  baselineComparison: {
    populationSaved: number;
    cascadeHopsReduced: number;
    recoveryTimeSavedMin: number;
    impactReductionPct: number;
  };

  recoveryScore: number; // 0–100 Multi-Factor Deterministic Recovery Score
  rank: number;
  whyThisRank: string;
}

export interface AiRecoveryAnalysis {
  id: string;
  simulationHash: string;
  incidentSummary: string;
  priorityTargets: string[];
  recommendedStrategy: AiRawStrategy;
  alternativeStrategies: AiRawStrategy[];
  explanation: string;
  confidence: AiConfidence;
  validatedResults: ValidatedStrategyResult[];
  bestStrategy: ValidatedStrategyResult;
  source: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK';
  createdAt: string;
  causalChainTrace?: {
    rootCause: string;
    criticalDependency: string;
    vulnerableNode: string;
    intervention: string;
    measuredOutcome: string;
  };
}
