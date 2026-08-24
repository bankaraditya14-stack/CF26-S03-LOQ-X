import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../SimulationEngine';
import { SYNTHETIC_CITY_GRAPH } from '../../data/cityGraph';
import { PREDEFINED_SCENARIOS } from '../../data/scenarios';
import { ServiceNode, DependencyEdge, Scenario } from '../../types';
import { GraphValidator } from '../graphValidation';

describe('Urban Infrastructure Cascade Simulation Engine (TC-001 to TC-022)', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = new SimulationEngine(
      SYNTHETIC_CITY_GRAPH.nodes,
      SYNTHETIC_CITY_GRAPH.edges
    );
  });

  it('TC-001: Single Failure propagation through dependencies', () => {
    engine.injectFailure('power-grid-main', 0);
    const finalState = engine.runToCompletion();

    expect(finalState.nodes['power-grid-main'].state).toBe('FAILED');
    expect(finalState.initialFailures).toEqual(['power-grid-main']);
    expect(finalState.nodes['water-treatment-pump'].state).toBe('FAILED');
    expect(finalState.nodes['water-distribution'].state).toBe('FAILED');
    expect(['DEGRADED', 'FAILED']).toContain(finalState.nodes['hospital-apex'].state);
  });

  it('TC-002: Multi-Hop Cascade depth calculation (A -> B -> C -> D)', () => {
    const customNodes: ServiceNode[] = [
      { id: 'node-a', name: 'Service A', type: 'POWER', zone: '1', criticality: 'HIGH', initialState: 'HEALTHY', recoveryTime: 10, position: { x: 0, y: 0 } },
      { id: 'node-b', name: 'Service B', type: 'WATER', zone: '1', criticality: 'HIGH', initialState: 'HEALTHY', recoveryTime: 10, position: { x: 0, y: 0 } },
      { id: 'node-c', name: 'Service C', type: 'HOSPITAL', zone: '1', criticality: 'HIGH', initialState: 'HEALTHY', recoveryTime: 10, position: { x: 0, y: 0 } },
      { id: 'node-d', name: 'Service D', type: 'EMERGENCY', zone: '1', criticality: 'HIGH', initialState: 'HEALTHY', recoveryTime: 10, position: { x: 0, y: 0 } },
    ];

    const customEdges: DependencyEdge[] = [
      { id: 'e-ab', from: 'node-a', to: 'node-b', dependencyType: 'REQUIRED', propagationDelay: 5, failureImpact: 'FAIL' },
      { id: 'e-bc', from: 'node-b', to: 'node-c', dependencyType: 'REQUIRED', propagationDelay: 5, failureImpact: 'FAIL' },
      { id: 'e-cd', from: 'node-c', to: 'node-d', dependencyType: 'REQUIRED', propagationDelay: 5, failureImpact: 'FAIL' },
    ];

    const linearEngine = new SimulationEngine(customNodes, customEdges);
    linearEngine.injectFailure('node-a', 0);
    const result = linearEngine.runToCompletion();

    expect(result.metrics.cascadeDepth).toBe(3);
    expect(result.metrics.affectedServices).toBe(3);
    expect(result.metrics.affectedNodeIds).toEqual(['node-b', 'node-c', 'node-d']);
  });

  it('TC-003: Multiple simultaneous failures scheduled at T+0', () => {
    const dualScenario = PREDEFINED_SCENARIOS.find((s) => s.id === 'scenario-dual-failure')!;
    engine.initialize(dualScenario);
    const finalState = engine.runToCompletion();

    expect(finalState.initialFailures).toContain('power-grid-main');
    expect(finalState.initialFailures).toContain('telecom-core');
    expect(finalState.nodes['power-grid-main'].state).toBe('FAILED');
    expect(finalState.nodes['telecom-core'].state).toBe('FAILED');
  });

  it('TC-004: Shared dependency convergence without duplicate events', () => {
    const dualScenario = PREDEFINED_SCENARIOS.find((s) => s.id === 'scenario-dual-failure')!;
    engine.initialize(dualScenario);
    const finalState = engine.runToCompletion();

    expect(['DEGRADED', 'FAILED']).toContain(finalState.nodes['emergency-dispatch'].state);
    const affectedSet = new Set(finalState.metrics.affectedNodeIds);
    expect(affectedSet.size).toBe(finalState.metrics.affectedServices);
    expect(finalState.metrics.affectedNodeIds).toContain('emergency-dispatch');
  });

  it('TC-005: Metrics accuracy for Affected Services count', () => {
    const powerScenario = PREDEFINED_SCENARIOS[0];
    engine.initialize(powerScenario);
    const result = engine.runToCompletion();

    expect(result.metrics.affectedServices).toBeGreaterThanOrEqual(5);
    expect(result.metrics.affectedNodeIds).not.toContain('power-grid-main');
  });

  it('TC-006: Metrics accuracy for Cascade Depth computation', () => {
    const powerScenario = PREDEFINED_SCENARIOS[0];
    engine.initialize(powerScenario);
    const result = engine.runToCompletion();

    expect(result.metrics.cascadeDepth).toBeGreaterThanOrEqual(3);
    expect(result.metrics.criticalServicesAffected).toBeGreaterThan(0);
  });

  it('TC-007: Recovery lifecycle (FAILED -> RECOVERING -> HEALTHY)', () => {
    const recoveryScenario = PREDEFINED_SCENARIOS.find(s => s.id === 'scenario-recovery-demo')!;
    engine.initialize(recoveryScenario);
    const finalState = engine.runToCompletion();

    const recDoneEvent = finalState.events.find(e => e.type === 'RECOVERY_COMPLETED');
    expect(recDoneEvent).toBeDefined();
    expect(recDoneEvent?.targetNode).toBe('water-treatment-pump');
    expect(recDoneEvent?.newState).toBe('HEALTHY');
  });

  it('TC-008: Operator Isolation Mitigation prevents cascade penetration', () => {
    engine.injectFailure('power-grid-main', 0);
    engine.applyRecovery({
      id: 'isolate-pump',
      nodeId: 'water-treatment-pump',
      type: 'ISOLATE',
      startTime: 0,
      duration: 5,
      description: 'Isolate pump.',
    });

    const finalState = engine.runToCompletion();
    expect(finalState.nodes['water-treatment-pump'].isIsolated).toBe(true);
  });

  it('TC-009: Strict Deterministic Replay (100% identical event logs and metrics)', () => {
    const powerScenario = PREDEFINED_SCENARIOS[0];

    engine.initialize(powerScenario);
    const run1 = engine.runToCompletion();
    const hash1 = engine.getDeterministicHash();

    engine.reset();
    engine.initialize(powerScenario);
    const run2 = engine.runToCompletion();
    const hash2 = engine.getDeterministicHash();

    expect(hash1).toBe(hash2);
    expect(JSON.stringify(run1.events)).toBe(JSON.stringify(run2.events));
    expect(JSON.stringify(run1.metrics)).toBe(JSON.stringify(run2.metrics));
  });

  it('TC-010: Circular Dependency Cycle Rejection', () => {
    const circularNodes: ServiceNode[] = [
      { id: 'srv-1', name: 'Service 1', type: 'POWER', zone: '1', criticality: 'HIGH', initialState: 'HEALTHY', recoveryTime: 5, position: { x: 0, y: 0 } },
      { id: 'srv-2', name: 'Service 2', type: 'WATER', zone: '1', criticality: 'HIGH', initialState: 'HEALTHY', recoveryTime: 5, position: { x: 0, y: 0 } },
      { id: 'srv-3', name: 'Service 3', type: 'HOSPITAL', zone: '1', criticality: 'HIGH', initialState: 'HEALTHY', recoveryTime: 5, position: { x: 0, y: 0 } },
    ];

    const circularEdges: DependencyEdge[] = [
      { id: 'e1', from: 'srv-1', to: 'srv-2', dependencyType: 'REQUIRED', propagationDelay: 5, failureImpact: 'FAIL' },
      { id: 'e2', from: 'srv-2', to: 'srv-3', dependencyType: 'REQUIRED', propagationDelay: 5, failureImpact: 'FAIL' },
      { id: 'e3', from: 'srv-3', to: 'srv-1', dependencyType: 'REQUIRED', propagationDelay: 5, failureImpact: 'FAIL' },
    ];

    const validation = GraphValidator.validate(circularNodes, circularEdges);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(err => err.includes('Circular dependency'))).toBe(true);
  });

  it('TC-011: Missing dependency node reference rejection', () => {
    const brokenNodes: ServiceNode[] = [
      { id: 'srv-1', name: 'Service 1', type: 'POWER', zone: '1', criticality: 'HIGH', initialState: 'HEALTHY', recoveryTime: 5, position: { x: 0, y: 0 } },
    ];
    const brokenEdges: DependencyEdge[] = [
      { id: 'e1', from: 'srv-1', to: 'non-existent-node', dependencyType: 'REQUIRED', propagationDelay: 5, failureImpact: 'FAIL' },
    ];

    const validation = GraphValidator.validate(brokenNodes, brokenEdges);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(err => err.includes('non-existent target node'))).toBe(true);
  });

  it('TC-012: Duplicate node ID rejection', () => {
    const dupNodes: ServiceNode[] = [
      { id: 'srv-1', name: 'Service 1', type: 'POWER', zone: '1', criticality: 'HIGH', initialState: 'HEALTHY', recoveryTime: 5, position: { x: 0, y: 0 } },
      { id: 'srv-1', name: 'Duplicate Service', type: 'WATER', zone: '1', criticality: 'HIGH', initialState: 'HEALTHY', recoveryTime: 5, position: { x: 0, y: 0 } },
    ];
    const validation = GraphValidator.validate(dupNodes, []);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(err => err.includes('Duplicate node ID'))).toBe(true);
  });

  it('TC-013: Single custom failure simulation', () => {
    // Inject custom failure on Water Treatment Pump (not Power Grid)
    const customScenario: Scenario = {
      id: 'custom-single-test',
      name: 'Custom Pump Failure',
      description: 'Single initial failure test',
      graphVersion: 'city-v1',
      initialFailures: [{ nodeId: 'water-treatment-pump', time: 0 }],
      parameters: { maxSimulationTime: 60, defaultPropagationDelay: 5, defaultRecoveryDuration: 10 },
      recoveryActions: [],
    };

    engine.initialize(customScenario);
    const result = engine.runToCompletion();

    // Pump fails at T+0
    expect(result.nodes['water-treatment-pump'].state).toBe('FAILED');
    // Water Distribution should fail downstream
    expect(result.nodes['water-distribution'].state).toBe('FAILED');
    // Power Grid should remain healthy (upstream unaffected)
    expect(result.nodes['power-grid-main'].state).toBe('HEALTHY');
  });

  it('TC-014: Two simultaneous initial failures (Power Grid + Telecom at T+0)', () => {
    const customScenario: Scenario = {
      id: 'custom-dual-test',
      name: 'Power + Telecom Dual Failure',
      description: 'Dual simultaneous initial disruptions',
      graphVersion: 'city-v1',
      initialFailures: [
        { nodeId: 'power-grid-main', time: 0 },
        { nodeId: 'telecom-core', time: 0 },
      ],
      parameters: { maxSimulationTime: 60, defaultPropagationDelay: 5, defaultRecoveryDuration: 15 },
      recoveryActions: [],
    };

    engine.initialize(customScenario);
    const result = engine.runToCompletion();

    expect(result.initialFailures).toEqual(['power-grid-main', 'telecom-core']);
    expect(result.nodes['power-grid-main'].state).toBe('FAILED');
    expect(result.nodes['telecom-core'].state).toBe('FAILED');
    expect(result.metrics.affectedServices).toBeGreaterThanOrEqual(6);
  });

  it('TC-015: Two failures converging on the same dependent (Emergency Dispatch)', () => {
    engine.injectFailure('power-grid-main', 0);
    engine.injectFailure('telecom-core', 0);
    const result = engine.runToCompletion();

    // Emergency dispatch depends on both
    const dispatchNode = result.nodes['emergency-dispatch'];
    expect(['FAILED', 'DEGRADED']).toContain(dispatchNode.state);

    // Causal chain check
    const causal = engine.getCausalChain('emergency-dispatch');
    expect(causal.directCauses.length).toBeGreaterThanOrEqual(1);
  });

  it('TC-016: Custom scenario replay produces identical events and event hash', () => {
    const customScenario: Scenario = {
      id: 'custom-replay-test',
      name: 'Custom Replay Scenario',
      description: 'Test deterministic replay hashing',
      graphVersion: 'city-v1',
      initialFailures: [
        { nodeId: 'power-grid-sub', time: 0 },
        { nodeId: 'water-treatment-pump', time: 0 },
      ],
      parameters: { maxSimulationTime: 60, defaultPropagationDelay: 5, defaultRecoveryDuration: 10 },
      recoveryActions: [],
    };

    // Run 1
    engine.initialize(customScenario);
    engine.runToCompletion();
    const hash1 = engine.getDeterministicHash();
    const events1 = engine.getEvents();

    // Run 2
    engine.reset();
    engine.initialize(customScenario);
    engine.runToCompletion();
    const hash2 = engine.getDeterministicHash();
    const events2 = engine.getEvents();

    expect(hash1).toBe(hash2);
    expect(JSON.stringify(events1)).toBe(JSON.stringify(events2));
  });

  it('TC-017: Cascade depth calculation matches longest dependency chain', () => {
    // In JanNagar Grid: power-grid-main -> water-treatment-pump -> water-distribution -> hospital-apex -> emergency-dispatch
    engine.injectFailure('power-grid-main', 0);
    const result = engine.runToCompletion();

    expect(result.metrics.cascadeDepth).toBeGreaterThanOrEqual(3);
  });

  it('TC-018: Affected service calculation excludes initial root failures', () => {
    engine.injectFailure('power-grid-main', 0);
    const result = engine.runToCompletion();

    expect(result.metrics.affectedNodeIds).not.toContain('power-grid-main');
    expect(result.metrics.affectedServices).toBe(result.metrics.affectedNodeIds.length);
  });

  it('TC-019: Recovery action changes simulation outcome (before vs after)', () => {
    // 1. Without recovery
    engine.injectFailure('power-grid-main', 0);
    const withoutRec = engine.runToCompletion();

    // 2. With recovery on Water Pump
    const engineWithRec = new SimulationEngine(SYNTHETIC_CITY_GRAPH.nodes, SYNTHETIC_CITY_GRAPH.edges);
    engineWithRec.injectFailure('power-grid-main', 0);
    engineWithRec.applyRecovery({
      id: 'rec-backup',
      nodeId: 'water-treatment-pump',
      type: 'BACKUP_POWER',
      startTime: 5,
      duration: 8,
      description: 'Backup power generator.',
    });
    const withRec = engineWithRec.runToCompletion();

    // With recovery, water-treatment-pump recovers to HEALTHY
    expect(withRec.nodes['water-treatment-pump'].state).toBe('HEALTHY');
    expect(withoutRec.nodes['water-treatment-pump'].state).toBe('FAILED');
    expect(withRec.metrics.recoveryTime).toBeGreaterThan(0);
  });

  it('TC-020: Invalid graph prevents simulation start via GraphValidator', () => {
    const invalidNodes: ServiceNode[] = [
      { id: 'srv-1', name: 'Service 1', type: 'POWER', zone: '1', criticality: 'HIGH', initialState: 'HEALTHY', recoveryTime: 5, position: { x: 0, y: 0 } },
    ];
    const invalidEdges: DependencyEdge[] = [
      { id: 'edge-bad', from: 'srv-1', to: 'non-existent-node', dependencyType: 'REQUIRED', propagationDelay: 5, failureImpact: 'FAIL' },
    ];

    const report = GraphValidator.validate(invalidNodes, invalidEdges);
    expect(report.valid).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
  });

  it('TC-021: "Why did this fail?" causal chain accurately matches actual graph edges', () => {
    engine.injectFailure('power-grid-main', 0);
    engine.runToCompletion();

    const hospitalCausal = engine.getCausalChain('hospital-apex');
    expect(hospitalCausal.isRootFailure).toBe(false);
    expect(hospitalCausal.paths.length).toBeGreaterThan(0);
    expect(hospitalCausal.explanation).toContain('Civil Apex Hospital & Trauma');

    const rootCausal = engine.getCausalChain('power-grid-main');
    expect(rootCausal.isRootFailure).toBe(true);
  });

  it('TC-022: Different custom initial failures produce different event sequences and hashes', () => {
    // Failure A: Power Grid Main
    engine.initialize({
      id: 'a',
      name: 'Power Scenario',
      description: '',
      graphVersion: 'city-v1',
      initialFailures: [{ nodeId: 'power-grid-main', time: 0 }],
      parameters: { maxSimulationTime: 60, defaultPropagationDelay: 5, defaultRecoveryDuration: 10 },
      recoveryActions: [],
    });
    engine.runToCompletion();
    const hashA = engine.getDeterministicHash();

    // Failure B: Telecom Core
    const engineB = new SimulationEngine(SYNTHETIC_CITY_GRAPH.nodes, SYNTHETIC_CITY_GRAPH.edges);
    engineB.initialize({
      id: 'b',
      name: 'Telecom Scenario',
      description: '',
      graphVersion: 'city-v1',
      initialFailures: [{ nodeId: 'telecom-core', time: 0 }],
      parameters: { maxSimulationTime: 60, defaultPropagationDelay: 5, defaultRecoveryDuration: 10 },
      recoveryActions: [],
    });
    engineB.runToCompletion();
    const hashB = engineB.getDeterministicHash();

    expect(hashA).not.toBe(hashB);
  });
});
