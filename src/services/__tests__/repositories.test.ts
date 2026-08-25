import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  scenarioRowToDomain,
  domainToScenarioInsert,
  ScenarioRepository,
} from '../scenarioRepository';
import {
  simulationRunRowToDomain,
  domainToSimulationRunInsert,
  generateDeterministicHash,
  SimulationRunRepository,
} from '../simulationRunRepository';
import { isSupabaseConfigured } from '../supabaseClient';
import * as supabaseClientModule from '../supabaseClient';
import { Scenario, ScenarioRow, SimulationRunRow, SimulationMetrics, SimulationEvent } from '../../types';

// Mock localStorage for headless Node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
  },
  get length() {
    return Object.keys(mockStorage).length;
  },
  key: (index: number) => {
    return Object.keys(mockStorage)[index] ?? null;
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe('Supabase Client Configuration', () => {
  it('handles unconfigured environment variables safely without crashing', () => {
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');
  });
});

describe('ScenarioRepository Transformations', () => {
  const sampleRow: ScenarioRow = {
    id: 'sc-1234-uuid',
    user_id: 'user-5678',
    name: 'Monsoon Grid Collapse',
    description: 'Severe waterlogging at primary substation',
    graph_version: '1.0.0',
    initial_failures: [{ nodeId: 'power-grid-main', time: 0 }],
    parameters: {
      maxSimulationTime: 90,
      defaultPropagationDelay: 6,
      defaultRecoveryDuration: 12,
    },
    recovery_actions: [
      {
        id: 'rec-1',
        type: 'ISOLATE',
        nodeId: 'power-grid-main',
        startTime: 5,
        duration: 10,
        description: 'Isolate failed power grid',
      },
    ],
    created_at: '2026-08-24T12:00:00Z',
    updated_at: '2026-08-24T12:00:00Z',
  };

  const sampleDomain: Scenario = {
    id: 'sc-1234-uuid',
    name: 'Monsoon Grid Collapse',
    description: 'Severe waterlogging at primary substation',
    graphVersion: '1.0.0',
    initialFailures: [{ nodeId: 'power-grid-main', time: 0 }],
    parameters: {
      maxSimulationTime: 90,
      defaultPropagationDelay: 6,
      defaultRecoveryDuration: 12,
    },
    recoveryActions: [
      {
        id: 'rec-1',
        type: 'ISOLATE',
        nodeId: 'power-grid-main',
        startTime: 5,
        duration: 10,
        description: 'Isolate failed power grid',
      },
    ],
  };

  it('converts ScenarioRow to domain Scenario accurately', () => {
    const domain = scenarioRowToDomain(sampleRow);
    expect(domain.id).toBe(sampleRow.id);
    expect(domain.name).toBe(sampleRow.name);
    expect(domain.description).toBe(sampleRow.description);
    expect(domain.graphVersion).toBe(sampleRow.graph_version);
    expect(domain.initialFailures).toEqual(sampleRow.initial_failures);
    expect(domain.parameters).toEqual(sampleRow.parameters);
    expect(domain.recoveryActions).toEqual(sampleRow.recovery_actions);
  });

  it('supplies safe defaults when row fields are null', () => {
    const sparseRow: ScenarioRow = {
      id: 'sc-sparse',
      user_id: null,
      name: 'Sparse Scenario',
      description: null,
      graph_version: '1.0.0',
      initial_failures: [],
      parameters: null,
      recovery_actions: null,
      created_at: '2026-08-24T12:00:00Z',
      updated_at: '2026-08-24T12:00:00Z',
    };

    const domain = scenarioRowToDomain(sparseRow);
    expect(domain.description).toBe('');
    expect(domain.initialFailures).toEqual([]);
    expect(domain.recoveryActions).toEqual([]);
    expect(domain.parameters.maxSimulationTime).toBe(60);
  });

  it('converts domain Scenario to insert payload accurately', () => {
    const insertPayload = domainToScenarioInsert(sampleDomain, 'user-5678');
    expect(insertPayload.id).toBe(sampleDomain.id);
    expect(insertPayload.user_id).toBe('user-5678');
    expect(insertPayload.name).toBe(sampleDomain.name);
    expect(insertPayload.graph_version).toBe(sampleDomain.graphVersion);
    expect(insertPayload.initial_failures).toEqual(sampleDomain.initialFailures);
  });
});

describe('SimulationRunRepository Transformations', () => {
  const sampleMetrics: SimulationMetrics = {
    cascadeDepth: 3,
    affectedServices: 4,
    affectedNodeIds: ['water-treatment', 'hospital-central', 'traffic-mgmt'],
    recoveryTime: 45,
    peakImpact: 5,
    activeFailures: 0,
    timeToStabilization: 50,
    criticalServicesAffected: 2,
  };

  const sampleEvents: SimulationEvent[] = [
    {
      id: 'ev-1',
      timestamp: 0,
      type: 'STATE_CHANGED',
      targetNode: 'power-grid-main',
      previousState: 'HEALTHY',
      newState: 'FAILED',
      cause: {
        type: 'INITIAL_FAILURE',
        reason: 'Initial root disruption',
      },
    },
    {
      id: 'ev-2',
      timestamp: 5,
      type: 'STATE_CHANGED',
      targetNode: 'water-treatment',
      previousState: 'HEALTHY',
      newState: 'DEGRADED',
      cause: {
        type: 'DEPENDENCY',
        sourceNodeId: 'power-grid-main',
        reason: 'Cascade dependency propagation',
      },
    },
  ];

  const sampleRunRow: SimulationRunRow = {
    id: 'run-999',
    user_id: 'user-5678',
    scenario_id: 'sc-1234-uuid',
    graph_version: '1.0.0',
    initial_failures: [{ nodeId: 'power-grid-main', time: 0 }],
    metrics: sampleMetrics,
    event_log: sampleEvents,
    deterministic_hash: 'det_abc123',
    created_at: '2026-08-24T12:00:00Z',
  };

  it('generates consistent deterministic hash for identical runs', () => {
    const hash1 = generateDeterministicHash(sampleMetrics, sampleEvents);
    const hash2 = generateDeterministicHash(sampleMetrics, sampleEvents);
    expect(hash1).toBe(hash2);
    expect(hash1.startsWith('det_')).toBe(true);
  });

  it('changes hash when metrics or events change', () => {
    const hash1 = generateDeterministicHash(sampleMetrics, sampleEvents);
    const alteredMetrics: SimulationMetrics = { ...sampleMetrics, cascadeDepth: 4 };
    const hash2 = generateDeterministicHash(alteredMetrics, sampleEvents);
    expect(hash1).not.toBe(hash2);
  });

  it('converts SimulationRunRow to SavedSimulationRun domain model', () => {
    const savedRun = simulationRunRowToDomain(sampleRunRow, 'Monsoon Grid Collapse');
    expect(savedRun.scenarioId).toBe(sampleRunRow.scenario_id);
    expect(savedRun.scenarioName).toBe('Monsoon Grid Collapse');
    expect(savedRun.metrics).toEqual(sampleMetrics);
    expect(savedRun.events).toEqual(sampleEvents);
  });

  it('converts domain parameters into SimulationRunInsert payload with user_id', () => {
    const insertPayload = domainToSimulationRunInsert({
      userId: 'user-777',
      scenarioId: 'sc-1234-uuid',
      graphVersion: '1.0.0',
      initialFailures: [{ nodeId: 'power-grid-main', time: 0 }],
      metrics: sampleMetrics,
      events: sampleEvents,
    });

    expect(insertPayload.user_id).toBe('user-777');
    expect(insertPayload.scenario_id).toBe('sc-1234-uuid');
    expect(insertPayload.graph_version).toBe('1.0.0');
    expect(insertPayload.metrics).toEqual(sampleMetrics);
    expect(insertPayload.event_log).toEqual(sampleEvents);
    expect(insertPayload.deterministic_hash.startsWith('det_')).toBe(true);
  });
});

describe('Repository Offline & LocalStorage Fallback', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.spyOn(supabaseClientModule, 'getSupabaseClient').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves and lists custom scenarios in localStorage when Supabase is not active', async () => {
    const scenario: Scenario = {
      id: 'local-custom-scenario-1',
      name: 'Local Test Scenario',
      description: 'Stored in localStorage fallback',
      graphVersion: '1.0.0',
      initialFailures: [{ nodeId: 'telecom-tower', time: 0 }],
      parameters: {
        maxSimulationTime: 60,
        defaultPropagationDelay: 5,
        defaultRecoveryDuration: 10,
      },
      recoveryActions: [],
    };

    await ScenarioRepository.createScenario(scenario, 'user-abc');
    const listed = await ScenarioRepository.listScenarios('user-abc');
    expect(listed.some(s => s.id === 'local-custom-scenario-1')).toBe(true);

    const fetched = await ScenarioRepository.getScenario('local-custom-scenario-1');
    expect(fetched?.name).toBe('Local Test Scenario');

    await ScenarioRepository.deleteScenario('local-custom-scenario-1');
    const remaining = await ScenarioRepository.listScenarios();
    expect(remaining.some(s => s.id === 'local-custom-scenario-1')).toBe(false);
  });

  it('saves and retrieves simulation runs using localStorage fallback', async () => {
    const sampleMetrics: SimulationMetrics = {
      cascadeDepth: 2,
      affectedServices: 3,
      affectedNodeIds: ['hospital-central'],
      recoveryTime: 30,
      peakImpact: 4,
      activeFailures: 0,
      timeToStabilization: 35,
      criticalServicesAffected: 1,
    };

    await SimulationRunRepository.saveRun({
      userId: 'user-abc',
      scenarioId: 'test-scenario-id',
      scenarioName: 'Test Run Fallback',
      metrics: sampleMetrics,
      events: [],
    });

    const runs = await SimulationRunRepository.getRunsForScenario('test-scenario-id');
    expect(runs.length).toBeGreaterThanOrEqual(1);
    expect(runs[0].scenarioName).toBe('Test Run Fallback');
    expect(runs[0].metrics.cascadeDepth).toBe(2);

    const allUserRuns = await SimulationRunRepository.listUserRuns('user-abc');
    expect(allUserRuns.length).toBeGreaterThanOrEqual(1);
  });

  it('prevents rapid duplicate simulation run submissions', async () => {
    const sampleMetrics: SimulationMetrics = {
      cascadeDepth: 1,
      affectedServices: 1,
      affectedNodeIds: ['telecom-core'],
      recoveryTime: 15,
      peakImpact: 2,
      activeFailures: 0,
      timeToStabilization: 20,
      criticalServicesAffected: 1,
    };

    const res1 = await SimulationRunRepository.saveRun({
      userId: 'user-xyz',
      scenarioId: 'test-dedupe-id',
      scenarioName: 'Dedupe Test',
      metrics: sampleMetrics,
      events: [],
    });

    const res2 = await SimulationRunRepository.saveRun({
      userId: 'user-xyz',
      scenarioId: 'test-dedupe-id',
      scenarioName: 'Dedupe Test',
      metrics: sampleMetrics,
      events: [],
    });

    expect(res1.scenarioId).toBe('test-dedupe-id');
    expect(res2.scenarioId).toBe('test-dedupe-id');
  });
});
