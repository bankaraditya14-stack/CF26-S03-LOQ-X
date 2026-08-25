import { ServiceNode, DependencyEdge, SimulationEvent, NodeStatus } from '../types';

export interface CausalTreeNode {
  id: string;
  name: string;
  shortName?: string;
  sector: string;
  state: NodeStatus;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  failureTime?: number;
  formattedTime?: string;
  isRootFailure: boolean;
  parentIds: string[];
  parentNames: string[];
  causeReason?: string;
  depth: number;
  children: CausalTreeNode[];
  downstreamCount: number;
}

export interface CausalTreeEdge {
  id: string;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  isActiveCascade: boolean;
  propagationDelay: number;
  eventTime?: number;
}

export interface CausalTreeData {
  roots: CausalTreeNode[];
  allNodesMap: Map<string, CausalTreeNode>;
  levels: CausalTreeNode[][];
  edges: CausalTreeEdge[];
  totalAffected: number;
  maxDepth: number;
  hasCascade: boolean;
  rootNodeIds: string[];
}

/**
 * Pure deterministic builder that constructs a causal dependency tree
 * from the actual SimulationEngine event stream and graph structure.
 */
export function buildCausalCascadeTree(
  nodes: ServiceNode[],
  edges: DependencyEdge[],
  events: SimulationEvent[] = [],
  runtimeStates?: Record<string, { state: NodeStatus; health?: number; load?: number }>
): CausalTreeData {
  const nodeMap = new Map<string, ServiceNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // 1. Extract failure injection & propagation events in chronological order
  const failureEvents = events.filter(
    (e) =>
      e.type === 'FAILURE_INJECTED' ||
      e.type === 'FAILURE_PROPAGATED' ||
      e.type === 'STATE_CHANGED' ||
      e.type === 'RECOVERY_STARTED' ||
      e.type === 'RECOVERY_COMPLETED'
  );

  // Map to track earliest failure event per node
  const nodeEarliestEvent = new Map<string, SimulationEvent>();
  // Map to track current/latest state per node from events
  const nodeLatestState = new Map<string, NodeStatus>();
  // Set of root failure node IDs
  const rootNodeIdSet = new Set<string>();

  failureEvents.forEach((ev) => {
    nodeLatestState.set(ev.targetNode, ev.newState);

    if (!nodeEarliestEvent.has(ev.targetNode)) {
      nodeEarliestEvent.set(ev.targetNode, ev);
    }

    if (
      ev.type === 'FAILURE_INJECTED' ||
      ev.cause?.type === 'INITIAL_FAILURE' ||
      !ev.cause?.sourceNodeId
    ) {
      if (ev.newState === 'FAILED' || ev.newState === 'DEGRADED') {
        rootNodeIdSet.add(ev.targetNode);
      }
    }
  });

  const hasCascade = rootNodeIdSet.size > 0 || failureEvents.length > 0;

  // 2. Build adjacency for graph edges (from -> to)
  const outgoingMap = new Map<string, DependencyEdge[]>();
  const incomingMap = new Map<string, DependencyEdge[]>();

  edges.forEach((edge) => {
    if (!outgoingMap.has(edge.from)) outgoingMap.set(edge.from, []);
    if (!incomingMap.has(edge.to)) incomingMap.set(edge.to, []);

    outgoingMap.get(edge.from)!.push(edge);
    incomingMap.get(edge.to)!.push(edge);
  });

  // 3. If no cascade has occurred, return empty/ready structure
  if (!hasCascade) {
    return {
      roots: [],
      allNodesMap: new Map(),
      levels: [],
      edges: [],
      totalAffected: 0,
      maxDepth: 0,
      hasCascade: false,
      rootNodeIds: [],
    };
  }

  // 4. Calculate Depth for each affected node using BFS from roots
  const nodeDepthMap = new Map<string, number>();
  const nodeParentsMap = new Map<string, Set<string>>();
  const nodeCauseReasonMap = new Map<string, string>();

  // Initialize roots at depth 0
  const queue: string[] = [];
  rootNodeIdSet.forEach((rootId) => {
    nodeDepthMap.set(rootId, 0);
    nodeParentsMap.set(rootId, new Set());
    const rootEv = nodeEarliestEvent.get(rootId);
    nodeCauseReasonMap.set(
      rootId,
      rootEv?.cause?.reason || 'Primary root disruption injected directly at simulation start.'
    );
    queue.push(rootId);
  });

  // Also examine event cause parent links
  failureEvents.forEach((ev) => {
    if (ev.cause?.sourceNodeId && nodeMap.has(ev.cause.sourceNodeId)) {
      const parentId = ev.cause.sourceNodeId;
      const childId = ev.targetNode;

      // Ensure root nodes and self-references are not assigned as parents
      if (parentId !== childId && !rootNodeIdSet.has(childId)) {
        if (!nodeParentsMap.has(childId)) {
          nodeParentsMap.set(childId, new Set());
        }
        nodeParentsMap.get(childId)!.add(parentId);
      }

      if (ev.cause.reason && (!nodeCauseReasonMap.has(childId) || rootNodeIdSet.has(childId))) {
        nodeCauseReasonMap.set(childId, ev.cause.reason);
      }
    }
  });

  // BFS to assign hierarchy depth and propagate through active cascade paths
  const visited = new Set<string>(rootNodeIdSet);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentDepth = nodeDepthMap.get(currentId) ?? 0;

    // Check outgoing edges to find downstream nodes that were affected or linked
    const outEdges = outgoingMap.get(currentId) || [];
    for (const edge of outEdges) {
      const childId = edge.to;

      // Do not re-assign or push root nodes to deeper levels
      if (rootNodeIdSet.has(childId)) {
        continue;
      }

      const childEvent = nodeEarliestEvent.get(childId);
      const isChildAffected =
        childEvent !== undefined ||
        (runtimeStates &&
          (runtimeStates[childId]?.state === 'FAILED' ||
            runtimeStates[childId]?.state === 'DEGRADED'));

      // If child was affected or triggered in event sequence
      if (isChildAffected) {
        if (!nodeParentsMap.has(childId)) {
          nodeParentsMap.set(childId, new Set());
        }
        nodeParentsMap.get(childId)!.add(currentId);

        const existingDepth = nodeDepthMap.get(childId);
        const newDepth = currentDepth + 1;

        if (existingDepth === undefined || newDepth > existingDepth) {
          nodeDepthMap.set(childId, newDepth);
        }

        if (!visited.has(childId)) {
          visited.add(childId);
          queue.push(childId);
        }
      }
    }
  }

  // Also include any other nodes that have failure events even if disjoint
  nodeEarliestEvent.forEach((ev, nodeId) => {
    if (!nodeDepthMap.has(nodeId)) {
      const parent = ev.cause?.sourceNodeId;
      const parentDepth = parent ? nodeDepthMap.get(parent) : undefined;
      const depth = parentDepth !== undefined ? parentDepth + 1 : 1;
      nodeDepthMap.set(nodeId, depth);
    }
  });

  // 5. Build CausalTreeNode instances for all affected/included nodes
  const allNodesMap = new Map<string, CausalTreeNode>();
  let maxDepth = 0;
  let totalAffected = 0;

  nodeDepthMap.forEach((depth, nodeId) => {
    const rawNode = nodeMap.get(nodeId);
    if (!rawNode) return;

    if (depth > maxDepth) maxDepth = depth;

    const earliestEv = nodeEarliestEvent.get(nodeId);
    const failureTime = earliestEv?.timestamp;

    const currentState: NodeStatus =
      runtimeStates?.[nodeId]?.state ||
      nodeLatestState.get(nodeId) ||
      earliestEv?.newState ||
      rawNode.initialState ||
      'HEALTHY';

    if (currentState === 'FAILED' || currentState === 'DEGRADED') {
      totalAffected++;
    }

    const parentIds = Array.from(nodeParentsMap.get(nodeId) || []);
    const parentNames = parentIds.map((pId) => nodeMap.get(pId)?.name || pId);

    const isRoot = rootNodeIdSet.has(nodeId) || depth === 0;

    let causeReason = nodeCauseReasonMap.get(nodeId);
    if (!causeReason) {
      if (isRoot) {
        causeReason = 'Primary initial disruption injected at T+0s';
      } else if (parentNames.length > 0) {
        causeReason = `Cascaded dependency failure triggered by ${parentNames.join(', ')}`;
      } else {
        causeReason = 'Secondary infrastructure load and service degradation';
      }
    }

    const treeNode: CausalTreeNode = {
      id: nodeId,
      name: rawNode.name,
      shortName: rawNode.name.replace(/^(Central |Metropolitan |North-East |South-West )/i, ''),
      sector: rawNode.type,
      state: currentState,
      criticality: (rawNode.criticality as any) || 'HIGH',
      failureTime,
      formattedTime: failureTime !== undefined ? `T+${failureTime}s` : 'T+0s',
      isRootFailure: isRoot,
      parentIds,
      parentNames,
      causeReason,
      depth,
      children: [],
      downstreamCount: 0,
    };

    allNodesMap.set(nodeId, treeNode);
  });

  // 6. Connect Parent-Child Tree relationships
  allNodesMap.forEach((treeNode) => {
    treeNode.parentIds.forEach((parentId) => {
      const parentNode = allNodesMap.get(parentId);
      if (parentNode && !parentNode.children.some((c) => c.id === treeNode.id)) {
        parentNode.children.push(treeNode);
        parentNode.downstreamCount++;
      }
    });
  });

  // 7. Group Nodes into Hierarchy Levels (Level 0 = Roots, Level 1 = Direct, etc.)
  const levels: CausalTreeNode[][] = [];
  for (let d = 0; d <= maxDepth; d++) {
    levels.push([]);
  }

  allNodesMap.forEach((treeNode) => {
    const d = Math.min(treeNode.depth, maxDepth);
    levels[d].push(treeNode);
  });

  // Sort each level by failureTime then name
  levels.forEach((lvl) => {
    lvl.sort((a, b) => {
      const tA = a.failureTime ?? 9999;
      const tB = b.failureTime ?? 9999;
      if (tA !== tB) return tA - tB;
      return a.name.localeCompare(b.name);
    });
  });

  // 8. Construct Causal Tree Edges between known tree nodes
  const treeEdges: CausalTreeEdge[] = [];
  const addedEdgeIds = new Set<string>();

  edges.forEach((edge) => {
    const fromNode = allNodesMap.get(edge.from);
    const toNode = allNodesMap.get(edge.to);

    if (fromNode && toNode) {
      const edgeKey = `${edge.from}->${edge.to}`;
      if (!addedEdgeIds.has(edgeKey)) {
        addedEdgeIds.add(edgeKey);

        const toEvent = nodeEarliestEvent.get(edge.to);
        const isActiveCascade =
          fromNode.state === 'FAILED' ||
          fromNode.state === 'DEGRADED' ||
          toNode.state === 'FAILED' ||
          toNode.state === 'DEGRADED';

        treeEdges.push({
          id: edge.id || edgeKey,
          from: edge.from,
          to: edge.to,
          fromName: fromNode.name,
          toName: toNode.name,
          isActiveCascade,
          propagationDelay: edge.propagationDelay,
          eventTime: toEvent?.timestamp,
        });
      }
    }
  });

  // Collect root nodes
  const roots = levels[0] || [];

  return {
    roots,
    allNodesMap,
    levels,
    edges: treeEdges,
    totalAffected,
    maxDepth,
    hasCascade: roots.length > 0,
    rootNodeIds: Array.from(rootNodeIdSet),
  };
}
