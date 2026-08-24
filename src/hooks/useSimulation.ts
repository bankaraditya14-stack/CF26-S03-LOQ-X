import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scenario,
  SimulationState,
  SimulationMetrics,
  RecoveryAction,
  SimulationEvent,
} from '../types';
import { SimulationEngine } from '../engine/SimulationEngine';
import { SYNTHETIC_CITY_GRAPH } from '../data/cityGraph';
import { PREDEFINED_SCENARIOS } from '../data/scenarios';
import { StorageService } from '../services/storageService';

export interface ScenarioComparisonResult {
  scenarioName: string;
  withoutRecovery: {
    metrics: SimulationMetrics;
    events: SimulationEvent[];
  };
  withRecovery: {
    metrics: SimulationMetrics;
    events: SimulationEvent[];
  };
}

export function useSimulation(initialScenarioId?: string) {
  const getInitialScenario = (): Scenario => {
    if (initialScenarioId) {
      const allScenarios = [...PREDEFINED_SCENARIOS, ...StorageService.getCustomScenarios()];
      const found = allScenarios.find(s => s.id === initialScenarioId);
      if (found) return found;
    }
    return PREDEFINED_SCENARIOS[0];
  };

  const [activeScenario, setActiveScenario] = useState<Scenario>(getInitialScenario);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('power-grid-main');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [deterministicMatch, setDeterministicMatch] = useState<boolean | null>(null);

  // Maintain stable engine instance in a ref
  const engineRef = useRef<SimulationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new SimulationEngine(
      SYNTHETIC_CITY_GRAPH.nodes,
      SYNTHETIC_CITY_GRAPH.edges
    );
    engineRef.current.initialize(getInitialScenario());
  }

  const [state, setState] = useState<SimulationState>(
    engineRef.current.getState()
  );

  const updateState = useCallback(() => {
    if (engineRef.current) {
      setState(engineRef.current.getState());
    }
  }, []);

  // Sync if initialScenarioId changes externally
  useEffect(() => {
    if (initialScenarioId && initialScenarioId !== activeScenario.id) {
      const allScenarios = [...PREDEFINED_SCENARIOS, ...StorageService.getCustomScenarios()];
      const found = allScenarios.find(s => s.id === initialScenarioId);
      if (found) {
        setIsPlaying(false);
        setDeterministicMatch(null);
        setActiveScenario(found);
        if (engineRef.current) {
          engineRef.current.initialize(found);
          updateState();
        }
      }
    }
  }, [initialScenarioId, activeScenario.id, updateState]);

  // Step simulation forward
  const step = useCallback(() => {
    if (!engineRef.current) return;
    const newState = engineRef.current.step();
    setState({ ...newState });
    if (newState.status === 'COMPLETED') {
      setIsPlaying(false);
    }
  }, []);

  // Load a scenario
  const loadScenario = useCallback(
    (scenario: Scenario) => {
      setIsPlaying(false);
      setDeterministicMatch(null);
      setActiveScenario(scenario);
      if (engineRef.current) {
        engineRef.current.initialize(scenario);
        updateState();
      }
    },
    [updateState]
  );

  // Play / Pause controls
  const start = useCallback(() => {
    if (state.status === 'COMPLETED') {
      if (engineRef.current) {
        engineRef.current.initialize(activeScenario);
        updateState();
      }
    }
    setIsPlaying(true);
  }, [state.status, activeScenario, updateState]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setDeterministicMatch(null);
    if (engineRef.current) {
      engineRef.current.initialize(activeScenario);
      updateState();
    }
  }, [activeScenario, updateState]);

  // Inject failure interactively
  const injectFailure = useCallback(
    (nodeId: string) => {
      if (!engineRef.current) return;
      engineRef.current.injectFailure(nodeId, state.currentTime);
      updateState();
    },
    [state.currentTime, updateState]
  );

  // Apply recovery action interactively
  const applyRecovery = useCallback(
    (action: RecoveryAction) => {
      if (!engineRef.current) return;
      engineRef.current.applyRecovery(action);
      updateState();
    },
    [updateState]
  );

  // Select node
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Timer loop for simulation playback
  useEffect(() => {
    if (!isPlaying) return;

    // Interval inversely proportional to speed (1x = 1000ms, 2x = 500ms, 4x = 250ms)
    const intervalMs = Math.max(100, Math.floor(1000 / playbackSpeed));
    const timer = setInterval(() => {
      if (engineRef.current) {
        const nextState = engineRef.current.step();
        setState({ ...nextState });
        if (nextState.status === 'COMPLETED') {
          setIsPlaying(false);
        }
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  // Verify Deterministic Replay
  const verifyDeterministicReplay = useCallback((): boolean => {
    if (!engineRef.current) return false;

    // Run 1: execute current scenario to completion on temporary engine
    const tempEngine1 = new SimulationEngine(
      SYNTHETIC_CITY_GRAPH.nodes,
      SYNTHETIC_CITY_GRAPH.edges
    );
    tempEngine1.initialize(activeScenario);
    const run1 = tempEngine1.runToCompletion();

    // Run 2: execute exact same scenario on second fresh engine
    const tempEngine2 = new SimulationEngine(
      SYNTHETIC_CITY_GRAPH.nodes,
      SYNTHETIC_CITY_GRAPH.edges
    );
    tempEngine2.initialize(activeScenario);
    const run2 = tempEngine2.runToCompletion();

    const log1 = JSON.stringify(run1.events);
    const log2 = JSON.stringify(run2.events);
    const metrics1 = JSON.stringify(run1.metrics);
    const metrics2 = JSON.stringify(run2.metrics);

    const matches = log1 === log2 && metrics1 === metrics2;
    setDeterministicMatch(matches);

    // Save to storage
    StorageService.saveRun(
      activeScenario.id,
      activeScenario.name,
      run1.events,
      run1.metrics
    );

    return matches;
  }, [activeScenario]);

  // Run Before / After Comparison
  const runScenarioComparison = useCallback((): ScenarioComparisonResult => {
    // 1. Without Recovery
    const scenarioWithoutRecovery: Scenario = {
      ...activeScenario,
      recoveryActions: [],
    };
    const engineWithout = new SimulationEngine(
      SYNTHETIC_CITY_GRAPH.nodes,
      SYNTHETIC_CITY_GRAPH.edges
    );
    engineWithout.initialize(scenarioWithoutRecovery);
    const withoutResult = engineWithout.runToCompletion();

    // 2. With Recovery (ensure default recovery if current scenario has none)
    const recoveries =
      activeScenario.recoveryActions.length > 0
        ? activeScenario.recoveryActions
        : [
            {
              id: 'auto-backup-power',
              nodeId: 'water-treatment-pump',
              type: 'BACKUP_POWER' as const,
              startTime: 10,
              duration: 8,
              description: 'Deploy backup generator at T+10.',
            },
          ];

    const scenarioWithRecovery: Scenario = {
      ...activeScenario,
      recoveryActions: recoveries,
    };
    const engineWith = new SimulationEngine(
      SYNTHETIC_CITY_GRAPH.nodes,
      SYNTHETIC_CITY_GRAPH.edges
    );
    engineWith.initialize(scenarioWithRecovery);
    const withResult = engineWith.runToCompletion();

    return {
      scenarioName: activeScenario.name,
      withoutRecovery: {
        metrics: withoutResult.metrics,
        events: withoutResult.events,
      },
      withRecovery: {
        metrics: withResult.metrics,
        events: withResult.events,
      },
    };
  }, [activeScenario]);

  return {
    state,
    activeScenario,
    selectedNodeId,
    playbackSpeed,
    isPlaying,
    deterministicMatch,
    graph: SYNTHETIC_CITY_GRAPH,
    actions: {
      loadScenario,
      start,
      pause,
      step,
      reset,
      setPlaybackSpeed,
      injectFailure,
      applyRecovery,
      selectNode,
      verifyDeterministicReplay,
      runScenarioComparison,
    },
  };
}
