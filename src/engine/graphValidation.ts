import { ServiceNode, DependencyEdge, Scenario } from '../types';

export interface GraphValidationReport {
  valid: boolean;
  version: string;
  nodeCount: number;
  edgeCount: number;
  errors: string[];
  warnings: string[];
}

export class GraphValidator {
  public static validate(
    nodes: ServiceNode[],
    edges: DependencyEdge[],
    scenario?: Scenario,
    graphVersion = 'city-v1'
  ): GraphValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    const nodeMap = new Map<string, ServiceNode>();

    // 1. Validate Node IDs are unique and non-empty
    for (const node of nodes) {
      if (!node.id || node.id.trim() === '') {
        errors.push('Node found with empty ID');
        continue;
      }
      if (nodeMap.has(node.id)) {
        errors.push(`Duplicate node ID detected: "${node.id}"`);
      }
      nodeMap.set(node.id, node);
    }

    // 2. Validate Edge references, self-loops, and duplicate IDs
    const edgeIds = new Set<string>();
    const adjacency = new Map<string, string[]>();
    nodes.forEach((n) => adjacency.set(n.id, []));

    for (const edge of edges) {
      if (!edge.id || edge.id.trim() === '') {
        errors.push('Edge found with empty ID');
        continue;
      }

      if (edgeIds.has(edge.id)) {
        errors.push(`Duplicate edge ID detected: "${edge.id}"`);
      }
      edgeIds.add(edge.id);

      if (!nodeMap.has(edge.from)) {
        errors.push(
          `Edge "${edge.id}" references non-existent source node: "${edge.from}"`
        );
      }
      if (!nodeMap.has(edge.to)) {
        errors.push(
          `Edge "${edge.id}" references non-existent target node: "${edge.to}"`
        );
      }

      if (edge.from === edge.to) {
        errors.push(`Self-loop detected on node "${edge.from}" in edge "${edge.id}"`);
      }

      if (edge.propagationDelay < 0) {
        errors.push(
          `Edge "${edge.id}" has invalid negative propagation delay: ${edge.propagationDelay}`
        );
      }

      if (nodeMap.has(edge.from) && nodeMap.has(edge.to) && edge.from !== edge.to) {
        adjacency.get(edge.from)?.push(edge.to);
      }
    }

    // 3. Circular Dependency / Cycle Detection via DFS
    const visited = new Map<string, 'UNVISITED' | 'VISITING' | 'VISITED'>();
    nodes.forEach((n) => visited.set(n.id, 'UNVISITED'));
    const path: string[] = [];

    const dfs = (u: string) => {
      visited.set(u, 'VISITING');
      path.push(u);

      const neighbors = adjacency.get(u) || [];
      for (const v of neighbors) {
        if (visited.get(v) === 'VISITING') {
          const cycleStartIndex = path.indexOf(v);
          const cyclePath = [...path.slice(cycleStartIndex), v].join(' → ');
          errors.push(`Circular dependency detected in graph: ${cyclePath}`);
        } else if (visited.get(v) === 'UNVISITED') {
          dfs(v);
        }
      }

      path.pop();
      visited.set(u, 'VISITED');
    };

    for (const node of nodes) {
      if (visited.get(node.id) === 'UNVISITED') {
        dfs(node.id);
      }
    }

    // 4. Validate Scenario Initial Failures & Recovery Actions
    if (scenario) {
      if (!scenario.initialFailures || scenario.initialFailures.length === 0) {
        warnings.push(`Scenario "${scenario.name}" has no initial failures specified.`);
      }

      for (const failure of scenario.initialFailures || []) {
        if (!nodeMap.has(failure.nodeId)) {
          errors.push(
            `Scenario specifies non-existent initial failure node: "${failure.nodeId}"`
          );
        }
        if (failure.time < 0) {
          errors.push(
            `Scenario specifies negative failure timestamp: ${failure.time}`
          );
        }
      }

      for (const recovery of scenario.recoveryActions || []) {
        if (!nodeMap.has(recovery.nodeId)) {
          errors.push(
            `Recovery action references non-existent node: "${recovery.nodeId}"`
          );
        }
        if (recovery.duration <= 0) {
          errors.push(
            `Recovery action has non-positive duration: ${recovery.duration}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      version: graphVersion,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      errors,
      warnings,
    };
  }
}
