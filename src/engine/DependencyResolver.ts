import {
  ServiceNode,
  DependencyEdge,
  NodeRuntimeState,
  NodeStatus,
} from '../types';

export interface EvaluatedNodeImpact {
  targetState: NodeStatus;
  failedUpstreams: string[];
  reasons: string[];
}

export class DependencyResolver {
  private nodesMap: Map<string, ServiceNode> = new Map();
  private incomingEdges: Map<string, DependencyEdge[]> = new Map();
  private outgoingEdges: Map<string, DependencyEdge[]> = new Map();

  constructor(nodes: ServiceNode[], edges: DependencyEdge[]) {
    nodes.forEach(n => {
      this.nodesMap.set(n.id, n);
      this.incomingEdges.set(n.id, []);
      this.outgoingEdges.set(n.id, []);
    });

    edges.forEach(edge => {
      this.incomingEdges.get(edge.to)?.push(edge);
      this.outgoingEdges.get(edge.from)?.push(edge);
    });
  }

  public getIncomingEdges(nodeId: string): DependencyEdge[] {
    return this.incomingEdges.get(nodeId) || [];
  }

  public getOutgoingEdges(nodeId: string): DependencyEdge[] {
    return this.outgoingEdges.get(nodeId) || [];
  }

  public getDownstreamNodes(nodeId: string): string[] {
    const edges = this.getOutgoingEdges(nodeId);
    return Array.from(new Set(edges.map(e => e.to))).sort();
  }

  public getUpstreamNodes(nodeId: string): string[] {
    const edges = this.getIncomingEdges(nodeId);
    return Array.from(new Set(edges.map(e => e.from))).sort();
  }

  /**
   * Evaluates the resulting state of targetNode given the current runtime states of its upstreams.
   */
  public evaluateState(
    nodeId: string,
    runtimeNodes: Record<string, NodeRuntimeState>
  ): EvaluatedNodeImpact {
    const targetRuntime = runtimeNodes[nodeId];
    const incoming = this.getIncomingEdges(nodeId);

    // If node is explicitly isolated by operator, it ignores incoming cascade
    if (targetRuntime?.isIsolated) {
      return {
        targetState: targetRuntime.state === 'FAILED' ? 'FAILED' : 'HEALTHY',
        failedUpstreams: [],
        reasons: ['Service isolated by operator mitigation action.'],
      };
    }

    if (incoming.length === 0) {
      // Independent root node
      return {
        targetState: targetRuntime?.state ?? 'HEALTHY',
        failedUpstreams: [],
        reasons: [],
      };
    }

    const failedUpstreams: string[] = [];
    const reasons: string[] = [];
    let requiredFailuresCount = 0;
    let requiredDegradedCount = 0;
    let optionalFailuresCount = 0;
    let hasFailImpact = false;

    for (const edge of incoming) {
      const upstreamState = runtimeNodes[edge.from]?.state ?? 'HEALTHY';
      const upstreamName = this.nodesMap.get(edge.from)?.name || edge.from;

      // Check mitigation overrides (e.g. Backup Power for power dependency)
      if (edge.dependencyKind === 'POWER' && targetRuntime?.hasBackupPower) {
        continue; // Protected by active auxiliary generator!
      }
      if (edge.dependencyKind === 'NETWORK' && targetRuntime?.isNetworkRestored) {
        continue; // Protected by secondary emergency network link!
      }

      if (upstreamState === 'FAILED') {
        failedUpstreams.push(edge.from);
        if (edge.dependencyType === 'REQUIRED') {
          requiredFailuresCount++;
          if (edge.failureImpact === 'FAIL') {
            hasFailImpact = true;
          }
          reasons.push(`Required dependency "${upstreamName}" is FAILED.`);
        } else {
          optionalFailuresCount++;
          reasons.push(`Auxiliary dependency "${upstreamName}" is FAILED.`);
        }
      } else if (upstreamState === 'DEGRADED') {
        failedUpstreams.push(edge.from);
        if (edge.dependencyType === 'REQUIRED') {
          requiredDegradedCount++;
          reasons.push(`Required dependency "${upstreamName}" is DEGRADED.`);
        } else {
          optionalFailuresCount++;
          reasons.push(`Auxiliary dependency "${upstreamName}" is DEGRADED.`);
        }
      }
    }

    // Determine target state based on multi-dependency evaluation rule
    let targetState: NodeStatus = 'HEALTHY';

    if (requiredFailuresCount > 0) {
      if (hasFailImpact || requiredFailuresCount >= 2) {
        targetState = 'FAILED';
      } else {
        targetState = 'DEGRADED';
      }
    } else if (requiredDegradedCount > 0) {
      targetState = 'DEGRADED';
    } else if (optionalFailuresCount > 0) {
      targetState = 'AT_RISK';
    } else {
      // All upstreams healthy / mitigated
      if (targetRuntime?.state === 'RECOVERING') {
        targetState = 'RECOVERING';
      } else {
        targetState = 'HEALTHY';
      }
    }

    // Root direct failure preservation: if node is already FAILED as an initial root failure, keep FAILED
    if (
      targetRuntime?.state === 'FAILED' &&
      targetRuntime?.causes.length === 0 &&
      !targetRuntime?.activeRecoveryType
    ) {
      targetState = 'FAILED';
    }

    return {
      targetState,
      failedUpstreams: Array.from(new Set(failedUpstreams)).sort(),
      reasons,
    };
  }

  /**
   * Computes the complete upstream causal chain path for a given node.
   */
  public getUpstreamDependencyChain(
    nodeId: string,
    runtimeNodes: Record<string, NodeRuntimeState>
  ): string[][] {
    const chains: string[][] = [];

    const buildChains = (current: string, currentPath: string[]) => {
      const causes = runtimeNodes[current]?.causes || [];
      if (causes.length === 0) {
        chains.push(currentPath);
        return;
      }

      for (const parentId of causes) {
        if (!currentPath.includes(parentId)) {
          buildChains(parentId, [parentId, ...currentPath]);
        }
      }
    };

    buildChains(nodeId, [nodeId]);
    return chains.length > 0 ? chains : [[nodeId]];
  }
}
