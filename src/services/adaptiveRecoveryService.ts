import { SYNTHETIC_CITY_GRAPH } from '../data/cityGraph';
import { SimulationEngine } from '../engine/SimulationEngine';
import {
  AiSimulationContext,
  AiGeminiResponse,
  AiRecoveryAnalysis,
  ValidatedStrategyResult,
  AiRawStrategy,
  ResidualRisk,
} from '../types/adaptiveRecovery';
import { RecoveryAction, RecoveryActionType, SimulationState } from '../types';
import {
  InterventionRecommendationService,
  FailureContext,
} from './interventionRecommendationService';
import { AiRecoveryRepository } from './aiRecoveryRepository';
import { SecurityValidator } from '../utils/securityValidator';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Demographic weights per infrastructure node in Cascade City
const NODE_POPULATION_SERVED: Record<string, number> = {
  'power-grid-main': 75000,
  'power-grid-sub': 32000,
  'telecom-core': 68000,
  'water-treatment-pump': 62000,
  'water-distribution': 58000,
  'traffic-control': 44000,
  'telecom-tower-north': 18000,
  'sewage-treatment': 35000,
  'metro-rail': 42000,
  'hospital-apex': 55000,
  'emergency-dispatch': 70000,
  'strategic-fuel-depot': 28000,
  'municipal-command': 65000,
};

export class AdaptiveRecoveryService {
  // In-memory cache keyed by simulationHash
  private static memoryCache = new Map<string, AiRecoveryAnalysis>();

  /**
   * Constructs the structured AI simulation context from the active simulation engine state.
   */
  public static buildSimulationContext(
    rootFailureNodeId: string,
    failureType: string = 'Equipment Failure',
    engineState?: SimulationState,
    simTimeSec: number = 0
  ): AiSimulationContext {
    const rootNode = SYNTHETIC_CITY_GRAPH.nodes.find((n) => n.id === rootFailureNodeId);
    const rootName = rootNode?.name || rootFailureNodeId;
    const rootSector = rootNode?.type || 'POWER';

    const failedNodes = engineState
      ? Object.keys(engineState.nodes).filter((id) => engineState.nodes[id].state === 'FAILED')
      : [rootFailureNodeId];

    const degradedNodes = engineState
      ? Object.keys(engineState.nodes).filter(
          (id) =>
            engineState.nodes[id].state === 'DEGRADED' || engineState.nodes[id].state === 'AT_RISK'
        )
      : [];

    const allAffected = Array.from(new Set([...failedNodes, ...degradedNodes]));

    const criticalNodes = allAffected.filter((id) => {
      const n = SYNTHETIC_CITY_GRAPH.nodes.find((node) => node.id === id);
      return n?.criticality === 'HIGH' || id === 'hospital-apex' || id === 'emergency-dispatch';
    });

    const metrics = engineState?.metrics;
    const cascadeDepth = metrics?.cascadeDepth ?? Math.max(1, allAffected.length - 1);
    
    // Accurate population calculation based on affected nodes
    const populationAffected = allAffected.reduce(
      (sum, id) => sum + (NODE_POPULATION_SERVED[id] || 10000),
      0
    ) || (NODE_POPULATION_SERVED[rootFailureNodeId] || 45000);

    const timeToRecovery = (metrics?.recoveryTime && metrics.recoveryTime > 0)
      ? metrics.recoveryTime
      : (20 + cascadeDepth * 6);

    const dependencyChain = (engineState?.events || [])
      .filter((e) => e.type === 'STATE_CHANGED' && e.cause.sourceNodeId)
      .map((e) => ({
        from: e.cause.sourceNodeId!,
        to: e.targetNode,
        reason: e.cause.reason,
      }));

    const simulationHash = this.computeSimulationHash(
      rootFailureNodeId,
      failureType,
      failedNodes,
      cascadeDepth,
      populationAffected
    );

    return {
      rootFailureNodeId,
      rootFailureNodeName: rootName,
      rootSector,
      failureType,
      failedNodeIds: failedNodes,
      degradedNodeIds: degradedNodes,
      allAffectedNodeIds: allAffected,
      dependencyChain,
      cascadeDepth,
      affectedServicesCount: allAffected.length,
      totalServicesCount: SYNTHETIC_CITY_GRAPH.nodes.length,
      populationAffected,
      criticalServicesAffected: criticalNodes,
      timeToTotalFailure: (metrics?.timeToStabilization && metrics.timeToStabilization > 0) ? metrics.timeToStabilization : 15,
      timeToRecovery,
      simulationHash,
      graphVersion: SYNTHETIC_CITY_GRAPH.version,
      simTimeSec,
      availableNodes: SYNTHETIC_CITY_GRAPH.nodes.map((n) => ({
        id: n.id,
        name: n.name,
        sector: n.type,
        criticality: n.criticality,
      })),
    };
  }

  /**
   * Deterministic Hash for deduplication and caching.
   */
  public static computeSimulationHash(
    rootId: string,
    failureType: string,
    failedNodes: string[],
    depth: number,
    pop: number
  ): string {
    const raw = `${rootId}|${failureType}|${failedNodes.sort().join(',')}|${depth}|${Math.round(pop / 1000)}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash-${Math.abs(hash).toString(16)}`;
  }

  /**
   * Main entry point: Performs Gemini AI analysis and executes deterministic engine validation.
   */
  public static async analyzeAndValidate(
    context: AiSimulationContext,
    scenarioId: string = 'predefined',
    userId?: string
  ): Promise<AiRecoveryAnalysis> {
    // 1. Check in-memory cache
    if (this.memoryCache.has(context.simulationHash)) {
      return this.memoryCache.get(context.simulationHash)!;
    }

    // 2. Check persistence repository cache
    const existing = await AiRecoveryRepository.getAnalysisByHash(context.simulationHash);
    if (existing) {
      this.memoryCache.set(context.simulationHash, existing);
      return existing;
    }

    // 3. Request Gemini AI Analysis from server-side layer (Edge Function or dev proxy)
    let aiResponse: AiGeminiResponse | null = null;
    let source: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK' = 'GEMINI_AI';

    // 3a. First attempt: Supabase Edge Function (Production architecture)
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
          'gemini-recovery-analysis',
          { body: context }
        );
        if (!edgeError && edgeData?.success && edgeData?.data) {
          aiResponse = SecurityValidator.sanitizeGeminiOutput(edgeData.data, context);
        }
      } catch (e) {
        console.warn('[AdaptiveRecoveryService] Edge Function invoke failed, attempting server proxy fallback:', e);
      }
    }

    // 3b. Second attempt: Local server proxy endpoint (/api/gemini/recovery-analysis)
    if (!aiResponse) {
      try {
        const response = await fetch('/api/gemini/recovery-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(context),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            aiResponse = SecurityValidator.sanitizeGeminiOutput(result.data, context);
          }
        }
      } catch (e) {
        // Expected when running in test runners or offline
        console.warn('[AdaptiveRecoveryService] Server AI proxy unavailable, engaging deterministic fallback:', e);
      }
    }

    // 4. If AI is unavailable or returned invalid output, use deterministic fallback
    if (!aiResponse) {
      aiResponse = this.generateDeterministicFallbackResponse(context);
      source = 'DETERMINISTIC_FALLBACK';
    }

    // 5. "GEMINI PROPOSES. CASCADE CITY VERIFIES."
    // Run the actual deterministic SimulationEngine for every strategy and measure real numbers
    const validatedResults = this.validateStrategiesWithSimulationEngine(context, aiResponse);

    const bestStrategy = validatedResults[0] || null;

    const analysis: AiRecoveryAnalysis = {
      id: `ai-analysis-${Date.now()}`,
      simulationHash: context.simulationHash,
      incidentSummary: aiResponse.incident_summary,
      priorityTargets: aiResponse.priority_targets,
      recommendedStrategy: aiResponse.recommended_strategy,
      alternativeStrategies: aiResponse.alternative_strategies,
      explanation: aiResponse.explanation,
      confidence: aiResponse.confidence || 'HIGH',
      validatedResults,
      bestStrategy,
      source,
      createdAt: new Date().toISOString(),
      causalChainTrace: {
        rootCause: `${context.rootFailureNodeName} (${context.rootSector}) suffered ${context.failureType}`,
        criticalDependency: `Propagated through ${context.cascadeDepth} dependency hops affecting ${context.affectedServicesCount} services`,
        vulnerableNode: (context.criticalServicesAffected[0] || context.allAffectedNodeIds[0] || 'Hospital Apex'),
        intervention: bestStrategy ? bestStrategy.name : aiResponse.recommended_strategy.name,
        measuredOutcome: bestStrategy
          ? `${bestStrategy.baselineComparison.impactReductionPct}% impact reduction with ${bestStrategy.metrics.citizensProtected.toLocaleString()} citizens protected (Score: ${bestStrategy.recoveryScore}/100)`
          : 'Pending engine verification',
      },
    };

    // 6. Cache and persist analysis
    this.memoryCache.set(context.simulationHash, analysis);
    try {
      await AiRecoveryRepository.saveAnalysis(analysis, scenarioId, userId);
    } catch (err) {
      console.warn('[AdaptiveRecoveryService] Background persistence warning:', err);
    }

    return analysis;
  }

  /**
   * Sanitizes and validates Gemini JSON output to prevent hallucinations or invalid node IDs.
   * Delegates to centralized SecurityValidator.
   */
  public static validateGeminiResponse(
    raw: any,
    context: AiSimulationContext
  ): AiGeminiResponse {
    return SecurityValidator.sanitizeGeminiOutput(raw, context);
  }

  /**
   * Converts and executes every AI strategy in the deterministic SimulationEngine to measure real numbers.
   * Every intervention is independently simulated against the exact same initial failure baseline.
   */
  public static validateStrategiesWithSimulationEngine(
    context: AiSimulationContext,
    aiResponse: AiGeminiResponse
  ): ValidatedStrategyResult[] {
    const totalNodesCount = SYNTHETIC_CITY_GRAPH.nodes.length;
    const getNodeName = (id: string) => SYNTHETIC_CITY_GRAPH.nodes.find((n) => n.id === id)?.name || id;

    // 1. Establish UNMITIGATED BASELINE on fresh simulation engine
    const baselineEngine = new SimulationEngine(SYNTHETIC_CITY_GRAPH.nodes, SYNTHETIC_CITY_GRAPH.edges);
    baselineEngine.injectFailure(context.rootFailureNodeId, 0);
    baselineEngine.runToCompletion();
    const baseState = baselineEngine.getState();
    const baseMetrics = baseState.metrics;

    const baseNonHealthySet = new Set(
      Object.keys(baseState.nodes).filter((k) => baseState.nodes[k].state !== 'HEALTHY')
    );
    const baseNonHealthyList = Array.from(baseNonHealthySet);

    const basePop = baseNonHealthyList.reduce(
      (sum, id) => sum + (NODE_POPULATION_SERVED[id] || 10000),
      0
    ) || (NODE_POPULATION_SERVED[context.rootFailureNodeId] || 45000);

    const baseDepth = baseMetrics.cascadeDepth || context.cascadeDepth || 3;
    const baseRecoveryTime = (baseMetrics.recoveryTime && baseMetrics.recoveryTime > 0) ? baseMetrics.recoveryTime : 45;
    const baseCriticalAffectedList = baseNonHealthyList.filter((id) => {
      const n = SYNTHETIC_CITY_GRAPH.nodes.find((node) => node.id === id);
      return n?.criticality === 'HIGH' || id === 'hospital-apex' || id === 'emergency-dispatch';
    });

    const allStrategies: Array<{ raw: AiRawStrategy; isRecommended: boolean }> = [
      { raw: aiResponse.recommended_strategy, isRecommended: true },
      ...aiResponse.alternative_strategies.map((alt) => ({ raw: alt, isRecommended: false })),
    ];

    const validated: ValidatedStrategyResult[] = [];

    // 2. Independently simulate EACH strategy
    allStrategies.forEach((item, idx) => {
      const s = item.raw;
      const strategyId = `ai-strat-${idx + 1}`;
      const actionType = s.action_type || this.inferActionType(s.name, s.target_nodes[0]);
      const requiredResources = s.required_resources || this.inferResourceString(actionType);

      const recoveryActions: RecoveryAction[] = s.target_nodes.map((nodeId, actionIdx) => ({
        id: `rec-${strategyId}-${nodeId}-${actionIdx}`,
        nodeId,
        type: actionType,
        startTime: context.simTimeSec,
        duration: actionType === 'BACKUP_POWER' ? 6 : actionType === 'ISOLATE' ? 4 : 10,
        description: s.actions[actionIdx] || `${s.name} on ${nodeId}`,
      }));

      // Run fresh independent simulation with THIS strategy applied
      const engine = new SimulationEngine(SYNTHETIC_CITY_GRAPH.nodes, SYNTHETIC_CITY_GRAPH.edges);
      engine.injectFailure(context.rootFailureNodeId, 0);
      for (const action of recoveryActions) {
        engine.applyRecovery(action);
      }
      engine.runToCompletion();
      const measuredState = engine.getState();
      const measuredMetrics = measuredState.metrics;

      // Extract accurate, non-reused node outcome states
      const measuredNonHealthySet = new Set(
        Object.keys(measuredState.nodes).filter((k) => measuredState.nodes[k].state !== 'HEALTHY')
      );
      const measuredNonHealthyList = Array.from(measuredNonHealthySet);

      const measuredHealthyList = Object.keys(measuredState.nodes).filter(
        (k) => measuredState.nodes[k].state === 'HEALTHY'
      );

      // Distinct nodes saved by this intervention
      const nodesSaved = baseNonHealthyList.filter((id) => !measuredNonHealthySet.has(id));

      const citizensProtected = nodesSaved.reduce(
        (sum, id) => sum + (NODE_POPULATION_SERVED[id] || 10000),
        0
      );

      const measuredPop = measuredNonHealthyList.reduce(
        (sum, id) => sum + (NODE_POPULATION_SERVED[id] || 10000),
        0
      );

      const servicesProtectedCount = measuredHealthyList.length;
      const servicesStillAffectedCount = measuredNonHealthyList.length;
      const measuredDepth = measuredMetrics.cascadeDepth;
      
      const measuredRecoveryTime = (measuredMetrics.recoveryTime && measuredMetrics.recoveryTime > 0)
        ? measuredMetrics.recoveryTime
        : Math.max(8, baseRecoveryTime - nodesSaved.length * 7);

      const timeSavedMin = Math.max(0, baseRecoveryTime - measuredRecoveryTime);
      const cascadeHopsReduced = Math.max(0, baseDepth - measuredDepth);

      const criticalInfrastructureProtected = baseCriticalAffectedList
        .filter((id) => !measuredNonHealthySet.has(id))
        .map(getNodeName);

      const criticalServicesStillAffected = baseCriticalAffectedList
        .filter((id) => measuredNonHealthySet.has(id))
        .map(getNodeName);

      // Calculate percentage reductions
      const popSavedPct = basePop > 0 ? (citizensProtected / basePop) * 100 : 0;
      const servicesSavedPct = baseNonHealthyList.length > 0
        ? (nodesSaved.length / baseNonHealthyList.length) * 100
        : 0;
      const timeSavedPct = baseRecoveryTime > 0 ? (timeSavedMin / baseRecoveryTime) * 100 : 0;

      const impactReductionPct = Math.min(
        98,
        Math.max(
          5,
          Math.round(popSavedPct * 0.40 + servicesSavedPct * 0.35 + timeSavedPct * 0.25)
        )
      );

      // Determine residual risk
      let residualRisk: ResidualRisk = 'HIGH';
      if (servicesStillAffectedCount <= 1 && criticalServicesStillAffected.length === 0) {
        residualRisk = 'LOW';
      } else if (servicesStillAffectedCount <= 3 && criticalServicesStillAffected.length <= 1) {
        residualRisk = 'MEDIUM';
      }

      // Multi-factor transparent Recovery Score (0–100)
      // 1. Population Protection (30%)
      const scorePop = Math.min(100, popSavedPct);
      // 2. Critical Infrastructure Protection (25%)
      const scoreCrit = baseCriticalAffectedList.length > 0
        ? (criticalInfrastructureProtected.length / baseCriticalAffectedList.length) * 100
        : 100;
      // 3. Cascade Depth Reduction (20%)
      const scoreDepth = baseDepth > 0 ? (cascadeHopsReduced / baseDepth) * 100 : 80;
      // 4. Recovery Time Acceleration (15%)
      const scoreTime = timeSavedPct;
      // 5. Resource Feasibility (10%)
      const scoreRes = actionType === 'ISOLATE' ? 95 : actionType === 'BACKUP_POWER' ? 90 : actionType === 'RESTORE_NETWORK' ? 85 : 80;

      const rawRecoveryScore = Math.round(
        scorePop * 0.30 +
        scoreCrit * 0.25 +
        scoreDepth * 0.20 +
        scoreTime * 0.15 +
        scoreRes * 0.10
      );

      const recoveryScore = Math.min(98, Math.max(8, rawRecoveryScore));

      validated.push({
        id: strategyId,
        name: s.name,
        tagline: s.actions[0] || 'Targeted Intervention',
        priority: s.priority,
        reason: s.reason,
        targetNodeIds: s.target_nodes,
        interventionType: actionType,
        requiredResources,
        actions: recoveryActions,
        isAiRecommended: item.isRecommended,
        isBaseline: false,
        metrics: {
          populationAffected: measuredPop,
          citizensProtected,
          servicesProtectedCount,
          servicesStillAffectedCount,
          totalServicesCount: totalNodesCount,
          cascadeDepth: measuredDepth,
          recoveryTimeMin: measuredRecoveryTime,
          timeSavedMin,
          residualRisk,
          healthPct: Math.round((servicesProtectedCount / totalNodesCount) * 100),
          criticalInfrastructureProtected,
          criticalServicesStillAffected,
        },
        baselineComparison: {
          populationSaved: citizensProtected,
          cascadeHopsReduced,
          recoveryTimeSavedMin: timeSavedMin,
          impactReductionPct,
        },
        recoveryScore,
        rank: 0,
        whyThisRank: '',
      });
    });

    // 3. Dynamic Ranking based strictly on the deterministic recoveryScore
    validated.sort((a, b) => b.recoveryScore - a.recoveryScore || b.baselineComparison.impactReductionPct - a.baselineComparison.impactReductionPct);
    
    validated.forEach((v, index) => {
      v.rank = index + 1;
      if (index === 0) {
        v.whyThisRank = `Highest composite recovery score (${v.recoveryScore}/100) with +${v.baselineComparison.impactReductionPct}% impact reduction. Shields ${v.metrics.citizensProtected.toLocaleString()} citizens and ${v.metrics.criticalInfrastructureProtected.length > 0 ? v.metrics.criticalInfrastructureProtected.join(', ') : 'essential networks'} with ${v.metrics.timeSavedMin} min faster recovery.`;
      } else {
        v.whyThisRank = `Ranked #${index + 1} (Score: ${v.recoveryScore}/100). Protects ${v.metrics.citizensProtected.toLocaleString()} citizens with ${v.metrics.servicesProtectedCount}/${totalNodesCount} services online. Leaves ${v.metrics.servicesStillAffectedCount} assets in ${v.metrics.residualRisk} residual risk.`;
      }
    });

    // 4. Append Baseline Option for Comparison
    const baselineStrategy: ValidatedStrategyResult = {
      id: 'baseline-no-op',
      name: 'NO INTERVENTION (BASELINE)',
      tagline: 'Passive Failure Propagation',
      priority: 'LOW',
      reason: 'Allow failure to propagate unrestricted across all dependencies.',
      targetNodeIds: [],
      interventionType: 'REPAIR',
      requiredResources: 'None',
      actions: [],
      isAiRecommended: false,
      isBaseline: true,
      metrics: {
        populationAffected: basePop,
        citizensProtected: 0,
        servicesProtectedCount: totalNodesCount - baseNonHealthyList.length,
        servicesStillAffectedCount: baseNonHealthyList.length,
        totalServicesCount: totalNodesCount,
        cascadeDepth: baseDepth,
        recoveryTimeMin: baseRecoveryTime,
        timeSavedMin: 0,
        residualRisk: 'CRITICAL',
        healthPct: Math.round(((totalNodesCount - baseNonHealthyList.length) / totalNodesCount) * 100),
        criticalInfrastructureProtected: [],
        criticalServicesStillAffected: baseCriticalAffectedList.map(getNodeName),
      },
      baselineComparison: {
        populationSaved: 0,
        cascadeHopsReduced: 0,
        recoveryTimeSavedMin: 0,
        impactReductionPct: 0,
      },
      recoveryScore: 0,
      rank: validated.length + 1,
      whyThisRank: 'Unmitigated failure propagation without recovery intervention.',
    };

    return [...validated, baselineStrategy];
  }

  /**
   * Infers concrete RecoveryActionType from strategy name or target node type.
   */
  public static inferActionType(
    strategyName: string = '',
    targetNodeId: string = ''
  ): RecoveryActionType {
    const text = (strategyName + ' ' + targetNodeId).toUpperCase();
    if (text.includes('GENERATOR') || text.includes('POWER') || text.includes('BATTERY') || text.includes('TURBINE') || text.includes('SOLAR')) {
      return 'BACKUP_POWER';
    }
    if (text.includes('NETWORK') || text.includes('TELECOM') || text.includes('BYPASS') || text.includes('FIBER') || text.includes('RADIO') || text.includes('MICROWAVE') || text.includes('SATELLITE')) {
      return 'RESTORE_NETWORK';
    }
    if (text.includes('ISOLAT') || text.includes('SHED') || text.includes('THROTTL') || text.includes('AIRGAP') || text.includes('QUARANTINE') || text.includes('DIVERT')) {
      return 'ISOLATE';
    }
    return 'REPAIR';
  }

  /**
   * Returns human-readable required resource estimate.
   */
  public static inferResourceString(type: RecoveryActionType): string {
    switch (type) {
      case 'BACKUP_POWER':
        return '2x Mobile 500kVA Diesel Gensets + Fuel Logistics';
      case 'RESTORE_NETWORK':
        return '1x Emergency Microwave Relay + Optical Bypass Team';
      case 'ISOLATE':
        return 'Automated SCADA Breaker Isolation + Grid Operators';
      case 'REPAIR':
      default:
        return 'Rapid Maintenance Crew + Component Spares';
    }
  }

  /**
   * Deterministic Fallback generator using sector templates from InterventionRecommendationService.
   */
  public static generateDeterministicFallbackResponse(
    context: AiSimulationContext
  ): AiGeminiResponse {
    const failureContext: FailureContext = {
      rootFailureNodeId: context.rootFailureNodeId,
      rootFailureNodeName: context.rootFailureNodeName,
      rootSector: context.rootSector,
      failureType: context.failureType,
      activeFailedNodeIds: context.failedNodeIds,
      activeDegradedNodeIds: context.degradedNodeIds,
      allAffectedNodeIds: context.allAffectedNodeIds,
      cascadeDepth: context.cascadeDepth,
      populationAtRisk: context.populationAffected,
      totalServicesCount: context.totalServicesCount,
      simTimeSec: context.simTimeSec,
      criticalNodesAffected: context.criticalServicesAffected,
    };

    const recs = InterventionRecommendationService.getRecommendations(failureContext);
    const primary = recs[0];
    const alts = recs.slice(1, 4);

    return {
      incident_summary: `Cascade detected originating at ${context.rootFailureNodeName} (${context.rootSector}) causing ${context.cascadeDepth} hops of downstream degradation.`,
      priority_targets: context.criticalServicesAffected.length > 0 ? context.criticalServicesAffected : [context.rootFailureNodeName],
      recommended_strategy: {
        name: primary?.title || 'ISOLATE & ACTIVATE BACKUP CIRCUITS',
        priority: primary?.priority || 'CRITICAL',
        reason: primary?.rationale || 'Mitigates root cause power & network deficits.',
        target_nodes: primary?.addressedNodeIds || [context.rootFailureNodeId],
        actions: primary?.actions.map((a) => a.description) || ['Deploy localized backup power.'],
        action_type: primary?.actions[0]?.type || 'BACKUP_POWER',
        required_resources: this.inferResourceString(primary?.actions[0]?.type || 'BACKUP_POWER'),
      },
      alternative_strategies: alts.map((alt) => ({
        name: alt.title,
        priority: alt.priority,
        reason: alt.rationale,
        target_nodes: alt.addressedNodeIds,
        actions: alt.actions.map((a) => a.description),
        action_type: alt.actions[0]?.type || 'REPAIR',
        required_resources: this.inferResourceString(alt.actions[0]?.type || 'REPAIR'),
      })),
      explanation: `Root Failure (${context.rootFailureNodeName}) -> Sector Strain (${context.rootSector}) -> Priority Intervention shields essential lifelines.`,
      confidence: 'HIGH',
      isFallback: true,
    };
  }
}
