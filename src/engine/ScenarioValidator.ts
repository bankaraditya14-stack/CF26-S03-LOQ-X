import { ServiceNode, DependencyEdge, Scenario } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ScenarioValidator {
  public static validate(
    nodes: ServiceNode[],
    edges: DependencyEdge[],
    scenario?: Scenario
  ): ValidationResult {
    const errors: string[] = [];
    const nodeMap = new Map<string, ServiceNode>();

    // 1. Check duplicate node IDs
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

    // 2. Check edge references and duplicate edge IDs
    const edgeIds = new Set<string>();
    const adjacency = new Map<string, string[]>();
    nodes.forEach(n => adjacency.set(n.id, []));

    for (const edge of edges) {
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

      if (typeof edge.propagationDelay !== 'number' || Number.isNaN(edge.propagationDelay) || edge.propagationDelay < 0) {
        errors.push(
          `Edge "${edge.id}" has invalid negative or non-numeric propagation delay: ${edge.propagationDelay}`
        );
      }

      if (nodeMap.has(edge.from) && nodeMap.has(edge.to) && edge.from !== edge.to) {
        adjacency.get(edge.from)?.push(edge.to);
      }
    }

    // 3. Cycle / Circular Dependency Detection via DFS
    const visited = new Map<string, 'UNVISITED' | 'VISITING' | 'VISITED'>();
    nodes.forEach(n => visited.set(n.id, 'UNVISITED'));

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

    // 4. Validate scenario initial failures if scenario provided
    if (scenario) {
      for (const failure of scenario.initialFailures || []) {
        if (!nodeMap.has(failure.nodeId)) {
          errors.push(
            `Scenario "${scenario.name}" specifies non-existent initial failure node: "${failure.nodeId}"`
          );
        }
        if (typeof failure.time !== 'number' || Number.isNaN(failure.time) || failure.time < 0) {
          errors.push(
            `Scenario specifies invalid or negative failure timestamp: ${failure.time}`
          );
        }
      }

      for (const recovery of scenario.recoveryActions || []) {
        if (!nodeMap.has(recovery.nodeId)) {
          errors.push(
            `Recovery action references non-existent node: "${recovery.nodeId}"`
          );
        }
        if (typeof recovery.duration !== 'number' || Number.isNaN(recovery.duration) || recovery.duration <= 0) {
          errors.push(
            `Recovery action has non-positive or invalid duration: ${recovery.duration}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
