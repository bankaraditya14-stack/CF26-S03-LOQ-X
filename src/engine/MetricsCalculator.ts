import {
  SimulationMetrics,
  SimulationEvent,
  NodeRuntimeState,
  ServiceNode,
} from '../types';

export class MetricsCalculator {
  public static calculate(
    runtimeNodes: Record<string, NodeRuntimeState>,
    initialFailureNodeIds: string[],
    eventHistory: SimulationEvent[],
    nodes: ServiceNode[]
  ): SimulationMetrics {
    const initialSet = new Set(initialFailureNodeIds);
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // 1. Identify all downstream nodes that ever entered non-healthy state
    const affectedNodeSet = new Set<string>();
    for (const evt of eventHistory) {
      if (
        (evt.newState === 'FAILED' ||
          evt.newState === 'DEGRADED' ||
          evt.newState === 'AT_RISK') &&
        !initialSet.has(evt.targetNode)
      ) {
        affectedNodeSet.add(evt.targetNode);
      }
    }

    const affectedNodeIds = Array.from(affectedNodeSet).sort();
    const affectedServices = affectedNodeIds.length;

    // 2. Cascade Depth Calculation
    // Build causal parent graph from event history and node causes
    const depthMap = new Map<string, number>();
    initialFailureNodeIds.forEach(id => depthMap.set(id, 0));

    // Trace depths through event history
    for (const evt of eventHistory) {
      if (evt.type === 'FAILURE_PROPAGATED' || evt.type === 'STATE_CHANGED') {
        const sources = evt.cause.sourceNodeIds || (evt.cause.sourceNodeId ? [evt.cause.sourceNodeId] : []);
        let maxParentDepth = -1;
        for (const src of sources) {
          if (depthMap.has(src)) {
            maxParentDepth = Math.max(maxParentDepth, depthMap.get(src)!);
          }
        }
        if (maxParentDepth >= 0) {
          const currentDepth = depthMap.get(evt.targetNode) ?? 0;
          depthMap.set(evt.targetNode, Math.max(currentDepth, maxParentDepth + 1));
        }
      }
    }

    let cascadeDepth = 0;
    for (const [nodeId, depth] of depthMap.entries()) {
      if (!initialSet.has(nodeId)) {
        cascadeDepth = Math.max(cascadeDepth, depth);
      }
    }

    // 3. Recovery Time Calculation
    let firstRecoveryStart = Infinity;
    let lastRecoveryEnd = 0;
    let hasRecoveries = false;

    for (const evt of eventHistory) {
      if (evt.type === 'RECOVERY_STARTED') {
        hasRecoveries = true;
        firstRecoveryStart = Math.min(firstRecoveryStart, evt.timestamp);
      } else if (evt.type === 'RECOVERY_COMPLETED') {
        hasRecoveries = true;
        lastRecoveryEnd = Math.max(lastRecoveryEnd, evt.timestamp);
      }
    }

    const recoveryTime = hasRecoveries && lastRecoveryEnd >= firstRecoveryStart
      ? lastRecoveryEnd - firstRecoveryStart
      : 0;

    // 4. Peak Impact Calculation (max simultaneous non-healthy nodes across event timeline)
    let peakImpact = 0;
    const timelineStates: Record<string, string> = {};
    nodes.forEach(n => (timelineStates[n.id] = n.initialState));

    for (const evt of eventHistory) {
      timelineStates[evt.targetNode] = evt.newState;
      const nonHealthyCount = Object.values(timelineStates).filter(
        st => st === 'FAILED' || st === 'DEGRADED' || st === 'AT_RISK'
      ).length;
      peakImpact = Math.max(peakImpact, nonHealthyCount);
    }

    // 5. Active Failures right now
    const activeFailures = Object.values(runtimeNodes).filter(
      r => r.state === 'FAILED' || r.state === 'DEGRADED' || r.state === 'AT_RISK'
    ).length;

    // 6. Time to Stabilization (timestamp of last state event)
    const timeToStabilization = eventHistory.length > 0
      ? eventHistory[eventHistory.length - 1].timestamp
      : 0;

    // 7. Critical Services Affected
    let criticalServicesAffected = 0;
    for (const id of affectedNodeIds) {
      if (nodeMap.get(id)?.criticality === 'HIGH') {
        criticalServicesAffected++;
      }
    }

    return {
      cascadeDepth,
      affectedServices,
      affectedNodeIds,
      recoveryTime,
      peakImpact,
      activeFailures,
      timeToStabilization,
      criticalServicesAffected,
    };
  }
}
