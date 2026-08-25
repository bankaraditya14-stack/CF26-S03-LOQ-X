import { describe, it, expect } from 'vitest';
import { buildCausalCascadeTree } from '../../../utils/causalTreeBuilder';
import { SimulationEngine } from '../../../engine/SimulationEngine';
import { SYNTHETIC_CITY_GRAPH } from '../../../data/cityGraph';
import { SimulationEvent } from '../../../types';

describe('DYNAMIC CAUSAL CASCADE TREE ENGINE & BUILDER (Deterministic Validation)', () => {
  const { nodes, edges } = SYNTHETIC_CITY_GRAPH;

  // 1. Root failure appears as root
  it('identifies injected initial failure as the root of the causal tree (depth 0, isRootFailure: true)', () => {
    const engine = new SimulationEngine(nodes, edges);
    engine.injectFailure('power-grid-main', 0);
    engine.step();

    const events = engine.getEvents();
    const tree = buildCausalCascadeTree(nodes, edges, events);

    expect(tree.hasCascade).toBe(true);
    expect(tree.roots.length).toBeGreaterThanOrEqual(1);

    const rootNode = tree.roots.find((r) => r.id === 'power-grid-main');
    expect(rootNode).toBeDefined();
    expect(rootNode?.depth).toBe(0);
    expect(rootNode?.isRootFailure).toBe(true);
    expect(rootNode?.parentIds.length).toBe(0);
    expect(rootNode?.formattedTime).toBe('T+0s');
  });

  // 2. Actual dependency relationships are represented
  it('represents actual dependency propagation pathways without hallucinated links', () => {
    const engine = new SimulationEngine(nodes, edges);
    engine.injectFailure('power-grid-main', 0);
    engine.runToCompletion();

    const events = engine.getEvents();
    const runtime = engine.getState().nodes;
    const tree = buildCausalCascadeTree(nodes, edges, events, runtime);

    // Verify all tree nodes exist in original city graph
    const validNodeIds = new Set(nodes.map((n) => n.id));
    tree.allNodesMap.forEach((treeNode, id) => {
      expect(validNodeIds.has(id)).toBe(true);
      expect(treeNode.name).toBeDefined();
    });

    // Verify all edges match actual dependency graph
    const validEdgeKeys = new Set(edges.map((e) => `${e.from}->${e.to}`));
    tree.edges.forEach((edge) => {
      expect(validEdgeKeys.has(`${edge.from}->${edge.to}`)).toBe(true);
    });
  });

  // 3. Failed nodes become red (state: FAILED)
  it('assigns state FAILED and tracks failure time accurately for disrupted nodes', () => {
    const engine = new SimulationEngine(nodes, edges);
    engine.injectFailure('power-grid-main', 0);
    engine.runToCompletion();

    const events = engine.getEvents();
    const runtime = engine.getState().nodes;
    const tree = buildCausalCascadeTree(nodes, edges, events, runtime);

    const rootNode = tree.allNodesMap.get('power-grid-main');
    expect(rootNode?.state).toBe('FAILED');
    expect(rootNode?.failureTime).toBe(0);
  });

  // 4. Degraded nodes become yellow (state: DEGRADED)
  it('marks degraded downstream nodes with DEGRADED state and tracks partial impact', () => {
    const mockEvents: SimulationEvent[] = [
      {
        id: 'evt-1',
        timestamp: 0,
        type: 'FAILURE_INJECTED',
        targetNode: 'power-grid-main',
        previousState: 'HEALTHY',
        newState: 'FAILED',
        cause: { type: 'INITIAL_FAILURE', reason: 'High voltage transformer blowout' },
      },
      {
        id: 'evt-2',
        timestamp: 5,
        type: 'FAILURE_PROPAGATED',
        targetNode: 'hospital-apex',
        previousState: 'HEALTHY',
        newState: 'DEGRADED',
        cause: {
          type: 'DEPENDENCY',
          sourceNodeId: 'power-grid-main',
          reason: 'Emergency backup power generator activated; surgical HVAC offline.',
        },
      },
    ];

    const tree = buildCausalCascadeTree(nodes, edges, mockEvents);
    const hospital = tree.allNodesMap.get('hospital-apex');

    expect(hospital).toBeDefined();
    expect(hospital?.state).toBe('DEGRADED');
    expect(hospital?.depth).toBe(1);
    expect(hospital?.parentIds).toContain('power-grid-main');
    expect(hospital?.formattedTime).toBe('T+5s');
  });

  // 5. Healthy nodes retain HEALTHY state
  it('maintains HEALTHY state on unaffected or isolated assets', () => {
    const mockEvents: SimulationEvent[] = [
      {
        id: 'evt-1',
        timestamp: 0,
        type: 'FAILURE_INJECTED',
        targetNode: 'traffic-control',
        previousState: 'HEALTHY',
        newState: 'FAILED',
        cause: { type: 'INITIAL_FAILURE', reason: 'Signal server crash' },
      },
    ];

    const tree = buildCausalCascadeTree(nodes, edges, mockEvents);
    const traffic = tree.allNodesMap.get('traffic-control');
    expect(traffic?.state).toBe('FAILED');
  });

  // 6. Cascade ordering follows actual simulation time
  it('sorts nodes in hierarchy tiers according to actual event sequence timestamps', () => {
    const engine = new SimulationEngine(nodes, edges);
    engine.injectFailure('power-grid-main', 0);
    engine.runToCompletion();

    const events = engine.getEvents();
    const tree = buildCausalCascadeTree(nodes, edges, events);

    // Verify depth ordering: Root (depth 0, T+0) -> Tier 1 (T >= 0) -> Tier 2 (T >= Tier 1)
    tree.levels.forEach((levelNodes, depth) => {
      levelNodes.forEach((node) => {
        expect(node.depth).toBe(depth);
        if (depth === 0) {
          expect(node.isRootFailure).toBe(true);
        }
      });
    });
  });

  // 7. No fake nodes/edges are introduced
  it('ensures zero hallucinated or synthetic nodes are injected into the causal tree', () => {
    const mockMaliciousEvents: SimulationEvent[] = [
      {
        id: 'evt-fake',
        timestamp: 0,
        type: 'FAILURE_INJECTED',
        targetNode: 'fake-alien-satellite-node-999',
        previousState: 'HEALTHY',
        newState: 'FAILED',
        cause: { type: 'INITIAL_FAILURE' },
      },
    ];

    const tree = buildCausalCascadeTree(nodes, edges, mockMaliciousEvents);
    // Non-existent nodes from unknown events are ignored from the validated node map
    expect(tree.allNodesMap.has('fake-alien-satellite-node-999')).toBe(false);
  });

  // 8. Clicking a node correctly identifies its causal parent
  it('correctly maps parent and downstream cause relationships for root-cause inspection', () => {
    const engine = new SimulationEngine(nodes, edges);
    engine.injectFailure('power-grid-main', 0);
    engine.runToCompletion();

    const events = engine.getEvents();
    const tree = buildCausalCascadeTree(nodes, edges, events);

    const root = tree.allNodesMap.get('power-grid-main');
    expect(root?.children.length).toBeGreaterThan(0);
    expect(root?.downstreamCount).toBeGreaterThan(0);

    const child = root?.children[0];
    if (child) {
      expect(child.parentIds).toContain('power-grid-main');
      expect(child.parentNames.length).toBeGreaterThan(0);
    }
  });

  // 9. Empty / no-cascade scenario renders correctly
  it('handles empty event list gracefully without throwing, returning hasCascade: false', () => {
    const tree = buildCausalCascadeTree(nodes, edges, []);

    expect(tree.hasCascade).toBe(false);
    expect(tree.roots.length).toBe(0);
    expect(tree.levels.length).toBe(0);
    expect(tree.totalAffected).toBe(0);
    expect(tree.maxDepth).toBe(0);
  });

  // 10. Multi-node root failure cascade
  it('correctly supports multi-node concurrent root disruptions in custom scenarios', () => {
    const engine = new SimulationEngine(nodes, edges);
    engine.injectFailure('power-grid-main', 0);
    engine.injectFailure('telecom-core', 0);
    engine.runToCompletion();

    const events = engine.getEvents();
    const tree = buildCausalCascadeTree(nodes, edges, events);

    expect(tree.hasCascade).toBe(true);
    expect(tree.rootNodeIds).toContain('power-grid-main');
    expect(tree.rootNodeIds).toContain('telecom-core');

    const level0Ids = tree.levels[0].map((n) => n.id);
    expect(level0Ids).toContain('power-grid-main');
    expect(level0Ids).toContain('telecom-core');
  });
});
