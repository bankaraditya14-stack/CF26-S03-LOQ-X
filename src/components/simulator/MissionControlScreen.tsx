import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Bookmark,
  Sliders,
  Info,
} from 'lucide-react';
import { Scenario } from '../../types';
import {
  DigitalTwinNode,
  DependencyLink,
  TelemetryState,
  CascadeStreamEvent,
  FailureSeverity,
  FailureType,
} from './types';
import {
  InterventionRecommendationService,
  InterventionRecommendation,
  FailureContext,
} from '../../services/interventionRecommendationService';
import { AdaptiveRecoveryService } from '../../services/adaptiveRecoveryService';
import { AiSimulationContext, ValidatedStrategyResult } from '../../types/adaptiveRecovery';
import { SimulationEngine } from '../../engine/SimulationEngine';
import { SYNTHETIC_CITY_GRAPH } from '../../data/cityGraph';
import { PREDEFINED_SCENARIOS } from '../../data/scenarios';
import { GraphValidator } from '../../engine/graphValidation';
import { DigitalTwinMap } from './DigitalTwinMap';
import { FailureInjectionPanel } from './FailureInjectionPanel';
import { CustomScenarioBuilder } from './CustomScenarioBuilder';
import { LiveTelemetryPanel } from './LiveTelemetryPanel';
import { InterventionPanel } from './InterventionPanel';
import { AdaptiveRecoveryPanel } from './AdaptiveRecoveryPanel';
import { CascadeEventStream } from './CascadeEventStream';
import { SimulationControls } from './SimulationControls';
import { ImpactRecoveryReportModal } from './ImpactRecoveryReportModal';
import { WhyDidThisFailModal } from './WhyDidThisFailModal';
import { ScenarioLibraryModal } from './ScenarioLibraryModal';
import { SimulationHistoryModal } from './SimulationHistoryModal';
import { AuthModal } from '../auth/AuthModal';
import { JudgeExplanationCard } from './JudgeExplanationCard';
import { navigate } from '../../utils/router';
import { useAuth } from '../../hooks/useAuth';
import { SimulationRunRepository } from '../../services/simulationRunRepository';
import { Cloud, HardDrive, History, User as UserIcon, LogIn, LogOut } from 'lucide-react';

// 8 Core Infrastructure Assets on the Visual 2D Canvas
const INITIAL_NODES: DigitalTwinNode[] = [
  {
    id: 'power-grid-main',
    name: 'POWER GRID',
    shortName: 'Power Grid',
    sector: 'POWER',
    x: 20,
    y: 20,
    status: 'ONLINE',
    health: 100,
    load: 72,
    connections: ['water-treatment-pump', 'telecom-core', 'hospital-apex', 'sewage-treatment', 'public-transit'],
    description: 'Central 400kV High-Voltage Power Substation.',
  },
  {
    id: 'water-treatment-pump',
    name: 'WATER PUMP',
    shortName: 'Water Pump',
    sector: 'WATER',
    x: 50,
    y: 20,
    status: 'ONLINE',
    health: 100,
    load: 65,
    connections: ['water-distribution'],
    description: 'Raw Water Turbine Intake and High-Pressure Booster.',
  },
  {
    id: 'water-distribution',
    name: 'WATER DISTRIBUTION',
    shortName: 'Water Dist',
    sector: 'WATER',
    x: 80,
    y: 20,
    status: 'ONLINE',
    health: 100,
    load: 60,
    connections: ['hospital-apex'],
    description: 'Potable Water Distribution Mains and Pressure System.',
  },
  {
    id: 'telecom-core',
    name: 'TELECOM',
    shortName: 'Telecom',
    sector: 'TELECOM',
    x: 20,
    y: 65,
    status: 'ONLINE',
    health: 100,
    load: 55,
    connections: ['emergency-dispatch', 'hospital-apex'],
    description: 'Metropolitan Fiber Core and Cellular Network Backbone.',
  },
  {
    id: 'emergency-dispatch',
    name: 'EMERGENCY SERVICES',
    shortName: 'Emergency',
    sector: 'EMERGENCY',
    x: 50,
    y: 65,
    status: 'ONLINE',
    health: 100,
    load: 40,
    connections: ['hospital-apex'],
    description: '112 Integrated Dispatch, CAD, and First Responders.',
  },
  {
    id: 'hospital-apex',
    name: 'HOSPITAL',
    shortName: 'Hospital',
    sector: 'HEALTHCARE',
    x: 80,
    y: 65,
    status: 'ONLINE',
    health: 100,
    load: 85,
    connections: ['emergency-dispatch'],
    description: 'Civil Apex Trauma Center, Surgical Suites & ICU.',
  },
  {
    id: 'sewage-treatment',
    name: 'INDUSTRIAL ZONE',
    shortName: 'Industry',
    sector: 'INDUSTRY',
    x: 35,
    y: 42,
    status: 'ONLINE',
    health: 100,
    load: 50,
    connections: [],
    description: 'Heavy Manufacturing and Municipal Logistics Hub.',
  },
  {
    id: 'traffic-control',
    name: 'RESIDENTIAL DISTRICT',
    shortName: 'Residential',
    sector: 'RESIDENTIAL',
    x: 65,
    y: 42,
    status: 'ONLINE',
    health: 100,
    load: 68,
    connections: [],
    description: 'Urban Residential Sectors and Civic Utility Feeds.',
  },
];

const INITIAL_LINKS: DependencyLink[] = [
  { from: 'power-grid-main', to: 'water-treatment-pump', label: 'POWER FEED', delaySec: 5 },
  { from: 'power-grid-main', to: 'telecom-core', label: 'GRID POWER', delaySec: 5 },
  { from: 'power-grid-main', to: 'traffic-control', label: 'PRIMARY FEED', delaySec: 4 },
  { from: 'power-grid-main', to: 'sewage-treatment', label: 'HV FEED', delaySec: 6 },
  { from: 'water-treatment-pump', to: 'water-distribution', label: 'RAW INTAKE', delaySec: 5 },
  { from: 'water-distribution', to: 'hospital-apex', label: 'POTABLE WATER', delaySec: 5 },
  { from: 'telecom-core', to: 'emergency-dispatch', label: '112 TRUNK', delaySec: 5 },
  { from: 'telecom-core', to: 'hospital-apex', label: 'MEDICAL FIBER', delaySec: 5 },
  { from: 'hospital-apex', to: 'emergency-dispatch', label: 'TRAUMA DISPATCH', delaySec: 5 },
];

interface MissionControlScreenProps {
  scenarioId?: string;
}

export const MissionControlScreen: React.FC<MissionControlScreenProps> = ({ scenarioId }) => {
  // Scenario Mode: 'PREDEFINED' | 'CUSTOM'
  const [scenarioMode, setScenarioMode] = useState<'PREDEFINED' | 'CUSTOM'>('PREDEFINED');

  // Active Scenario
  const [activeScenario, setActiveScenario] = useState<Scenario>(() => {
    if (scenarioId) {
      const found = PREDEFINED_SCENARIOS.find((s) => s.id === scenarioId);
      if (found) return found;
    }
    return PREDEFINED_SCENARIOS[0];
  });

  // Engine Instance in ref
  const engineRef = useRef<SimulationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new SimulationEngine(
      SYNTHETIC_CITY_GRAPH.nodes,
      SYNTHETIC_CITY_GRAPH.edges
    );
    engineRef.current.initialize(activeScenario);
  }

  // Visual Node States
  const [nodes, setNodes] = useState<DigitalTwinNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('power-grid-main');
  const [severity, setSeverity] = useState<FailureSeverity>('CRITICAL');
  const [failureType, setFailureType] = useState<FailureType>('Equipment Failure');
  const [probability, setProbability] = useState<number>(100);

  // Playback State
  const [simTimeSec, setSimTimeSec] = useState<number>(0);
  const maxTimeSec = 60;
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasInjected, setHasInjected] = useState<boolean>(false);

  // Interventions & Adaptive Recovery Intelligence
  const [selectedInterventionId, setSelectedInterventionId] = useState<string>('');
  const [isInterventionDeployed, setIsInterventionDeployed] = useState<boolean>(false);
  const [recoveryViewTab, setRecoveryViewTab] = useState<'AI' | 'MANUAL'>('AI');

  // Auth & Cloud State
  const { user, isCloudConnected, openAuthModal, isAuthModalOpen, closeAuthModal, signOut } = useAuth();

  // Modals & Replay State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isWhyModalOpen, setIsWhyModalOpen] = useState<boolean>(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [causalInfo, setCausalInfo] = useState<any>(null);
  const [replayHashInfo, setReplayHashInfo] = useState<{ run1Hash: string; run2Hash: string; match: boolean } | null>(null);

  // Graph Validation Report
  const validationReport = React.useMemo(() => {
    return GraphValidator.validate(
      SYNTHETIC_CITY_GRAPH.nodes,
      SYNTHETIC_CITY_GRAPH.edges,
      activeScenario,
      SYNTHETIC_CITY_GRAPH.version
    );
  }, [activeScenario]);

  // Sync Visual Map with Real Engine State
  const syncMapFromEngine = useCallback(() => {
    if (!engineRef.current) return;
    const engineState = engineRef.current.getState();

    setNodes((prevNodes) =>
      prevNodes.map((n) => {
        const runtime = engineState.nodes[n.id];
        if (!runtime) return n;

        let status = n.status;
        let health = 100;

        switch (runtime.state) {
          case 'FAILED':
            status = 'CRITICAL';
            health = 0;
            break;
          case 'DEGRADED':
            status = 'DEGRADED';
            health = 45;
            break;
          case 'AT_RISK':
            status = 'WARNING';
            health = 70;
            break;
          case 'RECOVERING':
            status = 'RECOVERING';
            health = 85;
            break;
          case 'HEALTHY':
          default:
            status = 'ONLINE';
            health = 100;
            break;
        }

        return {
          ...n,
          status,
          health,
          isIsolated: runtime.isIsolated,
          hasBackupPower: runtime.hasBackupPower,
        };
      })
    );
  }, []);

  // Format Time Clock
  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Convert Engine Events to CascadeStreamEvent
  const events: CascadeStreamEvent[] = React.useMemo(() => {
    if (!engineRef.current) return [];
    const engineEvents = engineRef.current.getEvents();

    if (engineEvents.length === 0) {
      return [
        {
          id: 'evt-init',
          timeSec: 0,
          timeLabel: 'T+00:00',
          category: 'SYSTEM',
          title: 'Simulation standing by',
          description: 'Digital-Twin city grid operational. Ready for disruption test.',
          severity: 'info',
        },
      ];
    }

    return engineEvents.map((evt) => {
      let severityType: CascadeStreamEvent['severity'] = 'info';
      if (evt.newState === 'FAILED') severityType = 'critical';
      else if (evt.newState === 'DEGRADED' || evt.newState === 'AT_RISK') severityType = 'warning';
      else if (evt.type === 'RECOVERY_STARTED' || evt.type === 'RECOVERY_COMPLETED') severityType = 'recovery';

      const targetNodeObj = SYNTHETIC_CITY_GRAPH.nodes.find((n) => n.id === evt.targetNode);

      return {
        id: evt.id,
        timeSec: evt.timestamp,
        timeLabel: `T+${formatClock(evt.timestamp)}`,
        category: targetNodeObj?.type || 'SYSTEM',
        title: `${targetNodeObj?.name || evt.targetNode} → ${evt.newState}`,
        description: evt.cause?.reason || `State transition occurred.`,
        severity: severityType,
        targetNodeId: evt.targetNode,
      };
    });
  }, [simTimeSec, hasInjected]);

  // Telemetry Calculation from Real Engine
  const telemetry: TelemetryState = React.useMemo(() => {
    if (!engineRef.current) {
      return {
        systemHealth: 100,
        activeNodes: 8,
        affectedNodes: 0,
        populationAtRisk: 0,
        cascadeRisk: 'LOW',
        estRecoveryMin: null,
        cascadeDepth: 0,
        servicesProtectedPct: 100,
      };
    }

    const metrics = engineRef.current.getMetrics();
    const engineState = engineRef.current.getState();
    const totalNodesCount = SYNTHETIC_CITY_GRAPH.nodes.length;
    const affectedCount = metrics.affectedServices;
    const initialFailuresCount = engineState.initialFailures.length;
    const nonHealthyCount = metrics.activeFailures;
    const activeCount = Math.max(0, totalNodesCount - nonHealthyCount);
    const systemHealth = Math.max(
      0,
      Math.round(((totalNodesCount - nonHealthyCount) / totalNodesCount) * 100)
    );

    let risk: TelemetryState['cascadeRisk'] = 'LOW';
    if (isInterventionDeployed && (engineState.status === 'COMPLETED' || affectedCount <= 2)) {
      risk = 'CONTAINED';
    } else if (metrics.criticalServicesAffected >= 3 || systemHealth < 50) {
      risk = 'CRITICAL';
    } else if (affectedCount > 0 || initialFailuresCount > 0) {
      risk = 'ELEVATED';
    }

    return {
      systemHealth,
      activeNodes: Math.min(8, Math.round((activeCount / totalNodesCount) * 8)),
      affectedNodes: Math.min(8, affectedCount),
      populationAtRisk:
        affectedCount === 0 && initialFailuresCount === 0
          ? 0
          : isInterventionDeployed
          ? 15800
          : Math.min(42500, (affectedCount + initialFailuresCount) * 7500),
      cascadeRisk: risk,
      estRecoveryMin:
        affectedCount === 0 && initialFailuresCount === 0
          ? null
          : isInterventionDeployed
          ? 18
          : 37,
      cascadeDepth: metrics.cascadeDepth,
      servicesProtectedPct: Math.round(
        ((totalNodesCount - affectedCount - initialFailuresCount) / totalNodesCount) * 100
      ),
    };
  }, [simTimeSec, isInterventionDeployed, hasInjected]);

  // Dynamic Failure Context for Context-Aware Recommendations
  const failureContext: FailureContext = React.useMemo(() => {
    const rootNodeObj = SYNTHETIC_CITY_GRAPH.nodes.find((n) => n.id === selectedNodeId);
    const engineState = engineRef.current?.getState();
    const allAffected = engineState
      ? Object.keys(engineState.nodes).filter(
          (id) => engineState.nodes[id].state !== 'HEALTHY'
        )
      : [selectedNodeId];

    const failedNodes = engineState
      ? Object.keys(engineState.nodes).filter(
          (id) => engineState.nodes[id].state === 'FAILED'
        )
      : [selectedNodeId];

    const degradedNodes = engineState
      ? Object.keys(engineState.nodes).filter(
          (id) =>
            engineState.nodes[id].state === 'DEGRADED' ||
            engineState.nodes[id].state === 'AT_RISK'
        )
      : [];

    const criticalNodes = allAffected.filter(
      (id) => SYNTHETIC_CITY_GRAPH.nodes.find((n) => n.id === id)?.criticality === 'HIGH'
    );

    return {
      rootFailureNodeId: selectedNodeId,
      rootFailureNodeName: rootNodeObj?.name || selectedNodeId,
      rootSector: rootNodeObj?.type || 'POWER',
      failureType,
      activeFailedNodeIds: failedNodes,
      activeDegradedNodeIds: degradedNodes,
      allAffectedNodeIds: allAffected,
      cascadeDepth: telemetry.cascadeDepth,
      populationAtRisk: telemetry.populationAtRisk,
      totalServicesCount: SYNTHETIC_CITY_GRAPH.nodes.length,
      simTimeSec,
      criticalNodesAffected: criticalNodes,
    };
  }, [selectedNodeId, failureType, simTimeSec, telemetry.cascadeDepth, telemetry.populationAtRisk, hasInjected]);

  // Dynamic, Scored & Dependency-Aware Recommendations
  const recommendations: InterventionRecommendation[] = React.useMemo(() => {
    return InterventionRecommendationService.getRecommendations(failureContext);
  }, [failureContext]);

  // Automatically keep selected intervention synchronized to valid recommendations
  useEffect(() => {
    if (recommendations.length > 0) {
      const exists = recommendations.some((r) => r.id === selectedInterventionId);
      if (!exists) {
        setSelectedInterventionId(recommendations[0].id);
      }
    }
  }, [recommendations, selectedInterventionId]);

  const activeSelectedRecommendation = React.useMemo(() => {
    return (
      recommendations.find((r) => r.id === selectedInterventionId) ||
      recommendations[0]
    );
  }, [recommendations, selectedInterventionId]);

  // Step Simulation via Real Engine
  const handleStepEngine = useCallback(() => {
    if (!engineRef.current) return;
    const nextState = engineRef.current.step();
    setSimTimeSec(nextState.currentTime);
    syncMapFromEngine();

    if (nextState.status === 'COMPLETED') {
      setIsPlaying(false);
      // Automatically record run in repository
      SimulationRunRepository.saveRun({
        userId: user?.id,
        scenarioId: activeScenario.id,
        scenarioName: activeScenario.name,
        graphVersion: activeScenario.graphVersion,
        initialFailures: activeScenario.initialFailures,
        metrics: nextState.metrics,
        events: nextState.events,
      }).catch((e) => console.warn('Background run save:', e));
    }
  }, [syncMapFromEngine, user, activeScenario]);

  // Run Custom Scenario
  const handleRunCustomScenario = (scenario: Scenario) => {
    if (!engineRef.current) return;
    setActiveScenario(scenario);
    setHasInjected(true);
    setIsInterventionDeployed(false);
    setReplayHashInfo(null);
    setSimTimeSec(0);

    engineRef.current.initialize(scenario);
    syncMapFromEngine();
    setIsPlaying(true);
  };

  // Inject Failure from Predefined Controls
  const handleInjectPredefinedFailure = () => {
    if (!engineRef.current) return;
    setHasInjected(true);
    setIsInterventionDeployed(false);
    setReplayHashInfo(null);

    engineRef.current.injectFailure(selectedNodeId, 0);
    syncMapFromEngine();
    setIsPlaying(true);
  };

  // Deploy Intervention (Engine-Driven Recovery Action)
  const handleDeployIntervention = () => {
    if (!engineRef.current) return;
    setIsInterventionDeployed(true);

    const chosenRec = recommendations.find((r) => r.id === selectedInterventionId);
    if (chosenRec && chosenRec.actions && chosenRec.actions.length > 0) {
      chosenRec.actions.forEach((action) => {
        engineRef.current?.applyRecovery({
          id: `${action.id}-${Date.now()}`,
          nodeId: action.nodeId,
          type: action.type,
          startTime: simTimeSec,
          duration: action.duration,
          description: action.description,
        });
      });
    }

    syncMapFromEngine();
  };

  // Compute rich AI simulation context for Gemini
  const aiContext: AiSimulationContext = React.useMemo(() => {
    const engineState = engineRef.current?.getState();
    return AdaptiveRecoveryService.buildSimulationContext(
      selectedNodeId,
      failureType,
      engineState,
      simTimeSec
    );
  }, [selectedNodeId, failureType, simTimeSec, hasInjected]);

  // Deploy AI-Generated Strategy (Deterministic Execution)
  const handleDeployAiStrategy = (strategy: ValidatedStrategyResult) => {
    if (!engineRef.current) return;
    setIsInterventionDeployed(true);

    strategy.actions.forEach((action) => {
      engineRef.current?.applyRecovery({
        id: `${action.id}-${Date.now()}`,
        nodeId: action.nodeId,
        type: action.type,
        startTime: simTimeSec,
        duration: action.duration,
        description: action.description,
      });
    });

    syncMapFromEngine();
  };

  // Reset Simulation
  const handleReset = () => {
    setIsPlaying(false);
    setHasInjected(false);
    setIsInterventionDeployed(false);
    setSimTimeSec(0);
    setReplayHashInfo(null);

    if (engineRef.current) {
      engineRef.current.reset();
      syncMapFromEngine();
    }
  };

  // Deterministic Replay Action
  const handleReplayScenario = () => {
    if (!engineRef.current) return;

    // Run 1 Hash
    const hash1 = engineRef.current.getDeterministicHash();

    // Run 2 on fresh engine
    const freshEngine = new SimulationEngine(
      SYNTHETIC_CITY_GRAPH.nodes,
      SYNTHETIC_CITY_GRAPH.edges
    );
    freshEngine.initialize(activeScenario);
    freshEngine.runToCompletion();
    const hash2 = freshEngine.getDeterministicHash();

    setReplayHashInfo({
      run1Hash: hash1,
      run2Hash: hash2,
      match: hash1 === hash2,
    });
  };

  // Open "Why Did This Fail?" Causal Inspector
  const handleInspectCausalChain = (nodeId: string) => {
    if (!engineRef.current) return;
    const chain = engineRef.current.getCausalChain(nodeId);
    setCausalInfo(chain);
    setIsWhyModalOpen(true);
  };

  // Clock Playback Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.floor(1000 / playbackSpeed);
    const timer = setInterval(() => {
      handleStepEngine();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, handleStepEngine]);

  // Overall Status Badge
  const getHeaderStatus = () => {
    if (telemetry.cascadeRisk === 'CONTAINED' || (simTimeSec >= 30 && isInterventionDeployed)) {
      return (
        <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>CASCADE CONTAINED</span>
        </span>
      );
    }

    if (hasInjected && telemetry.affectedNodes >= 2 && !isInterventionDeployed) {
      return (
        <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>INTERVENTION REQUIRED</span>
        </span>
      );
    }

    if (isPlaying) {
      const isCritical = telemetry.affectedNodes >= 2;
      return (
        <span
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-sm ${
            isCritical
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full animate-ping ${
              isCritical ? 'bg-red-600' : 'bg-amber-500'
            }`}
          ></span>
          <span>SIMULATION RUNNING</span>
        </span>
      );
    }

    return (
      <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>● SIMULATION READY</span>
      </span>
    );
  };

  const isFinalState =
    telemetry.cascadeRisk === 'CONTAINED' ||
    simTimeSec >= maxTimeSec ||
    (isInterventionDeployed && simTimeSec >= 25);

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-charcoal-900 font-sans selection:bg-mutedpurple-300 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="w-full bg-cream-100/95 backdrop-blur-md border-b border-charcoal-900/10 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 select-none">
        {/* Left: Brand, Overview Link, Scenario Library Button */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 px-2.5 rounded-xl bg-white hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-700 hover:text-charcoal-900 transition-all flex items-center space-x-1.5 text-xs font-mono font-bold cursor-pointer shadow-sm"
            title="Back to Landing Page"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">OVERVIEW</span>
          </button>

          <div
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-command border border-charcoal-900/10 flex-shrink-0 bg-charcoal-950 flex items-center justify-center p-0.5 transition-transform group-hover:scale-105">
              <img src="/cascade-city-logo.png" alt="Cascade City" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-charcoal-900 font-heading">
                  MISSION CONTROL
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mutedpurple-100 text-mutedpurple-700 border border-mutedpurple-300 font-bold">
                  LIVE DIGITAL-TWIN
                </span>
              </div>
              <p className="text-xs text-charcoal-500 font-medium hidden md:block">
                Simulate infrastructure failures. Observe cascading effects. Deploy interventions.
              </p>
            </div>
          </div>
        </div>

        {/* Center: Active Scenario & Mode Switch */}
        <div className="flex items-center space-x-1 bg-white border border-charcoal-900/15 rounded-xl p-1 font-mono text-xs shadow-sm">
          <button
            onClick={() => setScenarioMode('PREDEFINED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              scenarioMode === 'PREDEFINED'
                ? 'bg-charcoal-900 text-cream-100 shadow-command'
                : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            PREDEFINED BENCHMARKS
          </button>
          <button
            onClick={() => setScenarioMode('CUSTOM')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              scenarioMode === 'CUSTOM'
                ? 'bg-charcoal-900 text-cream-100 shadow-command'
                : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>CUSTOM DISRUPTION</span>
          </button>
        </div>

        {/* Right: Cloud Status, Graph Validation, History, Library, Status Badge, Account */}
        <div className="flex items-center space-x-2">
          {/* Cloud Status */}
          {isCloudConnected ? (
            <div
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white border border-softblue-400 text-charcoal-900 text-[10px] font-mono shadow-sm"
              title="Connected to Supabase PostgreSQL Database"
            >
              <Cloud className="w-3.5 h-3.5 text-softblue-600" />
              <span className="font-bold">CLOUD CONNECTED</span>
            </div>
          ) : (
            <div
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white border border-charcoal-900/15 text-charcoal-500 text-[10px] font-mono shadow-sm"
              title="Cloud storage unavailable. Your local scenarios remain available."
            >
              <HardDrive className="w-3.5 h-3.5 text-charcoal-400" />
              <span>LOCAL MODE</span>
            </div>
          )}

          <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white border border-charcoal-900/15 text-[10px] font-mono text-charcoal-700 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-softblue-600" />
            <span>
              GRAPH: <strong className="text-charcoal-900">{validationReport.valid ? 'VALID' : 'INVALID'}</strong> ({validationReport.nodeCount}N • {validationReport.edgeCount}E)
            </span>
          </div>

          {/* Audit History Modal Button */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-cream-100 border border-charcoal-900/15 text-charcoal-900 font-mono text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
            title="View simulation audit trail and past runs"
          >
            <History className="w-3.5 h-3.5 text-mutedpurple-600" />
            <span className="hidden md:inline">AUDIT HISTORY</span>
          </button>

          {/* Scenario Library Button */}
          <button
            onClick={() => setIsLibraryModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-cream-100 border border-charcoal-900/15 text-charcoal-900 font-mono text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Bookmark className="w-3.5 h-3.5 text-softblue-600" />
            <span className="hidden sm:inline">LIBRARY</span>
          </button>

          {/* Account Control */}
          {user ? (
            <div className="flex items-center space-x-1.5 bg-white border border-charcoal-900/15 rounded-xl px-3 py-1 text-xs font-mono shadow-sm">
              <UserIcon className="w-3.5 h-3.5 text-mutedpurple-600" />
              <span className="text-charcoal-900 max-w-[100px] truncate text-[11px] font-medium">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="p-1 rounded hover:bg-cream-200 text-charcoal-400 hover:text-dustybrown-400 transition-colors ml-0.5 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-cream-100 border border-charcoal-900/15 text-charcoal-900 text-xs font-bold font-mono transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-mutedpurple-600" />
              <span>SIGN IN</span>
            </button>
          )}

          {getHeaderStatus()}

          <button
            onClick={() => navigate('/about-model')}
            className="p-2 rounded-xl bg-white hover:bg-cream-100 border border-charcoal-900/15 text-charcoal-700 hover:text-charcoal-900 transition-all text-xs cursor-pointer shadow-sm"
            title="Model Architecture & Spec"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Judge Educational Helper Card */}
        <JudgeExplanationCard />

        {/* 3-Column Command Center Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Predefined Failure Injection OR Custom Scenario Builder (3 cols) */}
          <section className="lg:col-span-3 flex flex-col">
            {scenarioMode === 'CUSTOM' ? (
              <CustomScenarioBuilder
                nodes={SYNTHETIC_CITY_GRAPH.nodes}
                onRunCustomScenario={handleRunCustomScenario}
                onReset={handleReset}
                isSimulationRunning={isPlaying}
                activeScenarioId={activeScenario.id}
              />
            ) : (
              <FailureInjectionPanel
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                severity={severity}
                onChangeSeverity={setSeverity}
                failureType={failureType}
                onChangeFailureType={setFailureType}
                probability={probability}
                onChangeProbability={setProbability}
                onInjectFailure={handleInjectPredefinedFailure}
                onReset={handleReset}
                isSimulationRunning={isPlaying}
                hasInjected={hasInjected}
              />
            )}
          </section>

          {/* Center Column: 2D Digital-Twin Infrastructure Map (6 cols) */}
          <section className="lg:col-span-6 flex flex-col h-[520px] lg:h-auto min-h-[500px]">
            <DigitalTwinMap
              nodes={nodes}
              links={INITIAL_LINKS}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => {
                setSelectedNodeId(id);
                // Also enable checking causal chain directly
                handleInspectCausalChain(id);
              }}
              isCascadeActive={hasInjected && !isInterventionDeployed}
              activeCascadeCount={telemetry.affectedNodes}
            />
          </section>

          {/* Right Column: Live System Telemetry (3 cols) */}
          <section className="lg:col-span-3 flex flex-col space-y-3">
            <LiveTelemetryPanel
              telemetry={telemetry}
              totalNodes={nodes.length}
            />

            {/* "Why Did This Service Fail?" Trigger Card */}
            <div className="bg-white rounded-2xl p-4 border border-charcoal-900/15 shadow-command font-mono text-xs space-y-2.5">
              <div className="flex items-center justify-between text-charcoal-500 font-bold">
                <span className="text-[10px] uppercase tracking-wider">
                  ROOT-CAUSE EXPLAINABILITY
                </span>
                <Info className="w-3.5 h-3.5 text-mutedpurple-600" />
              </div>
              <p className="text-[11px] text-charcoal-600 font-sans leading-relaxed">
                Inspect causal dependency chains generated by the simulation engine.
              </p>
              <button
                onClick={() => handleInspectCausalChain(selectedNodeId)}
                className="w-full py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-900 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              >
                <span>WHY DID THIS FAIL? →</span>
              </button>
            </div>
          </section>
        </div>

        {/* 3. Real-Time Intervention & Adaptive Recovery Section */}
        {(hasInjected || isInterventionDeployed) && (
          <section className="w-full space-y-3">
            {/* Mode Switcher */}
            <div className="flex items-center justify-between bg-cream-100 p-1.5 rounded-2xl border border-charcoal-900/10 font-mono text-xs">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setRecoveryViewTab('AI')}
                  className={`px-4 py-2 rounded-xl font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
                    recoveryViewTab === 'AI'
                      ? 'bg-charcoal-900 text-cream-100 shadow-command'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  <span>✦ ADAPTIVE RECOVERY INTELLIGENCE</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-mutedpurple-100 text-mutedpurple-700 border border-mutedpurple-300 font-bold">
                    GEMINI AI
                  </span>
                </button>

                <button
                  onClick={() => setRecoveryViewTab('MANUAL')}
                  className={`px-4 py-2 rounded-xl font-extrabold transition-all cursor-pointer ${
                    recoveryViewTab === 'MANUAL'
                      ? 'bg-charcoal-900 text-cream-100 shadow-command'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  MANUAL INTERVENTION MATRIX
                </button>
              </div>

              <span className="hidden sm:inline-block text-[11px] text-charcoal-500 font-sans pr-2">
                {recoveryViewTab === 'AI'
                  ? '"Gemini proposes. Cascade City verifies."'
                  : 'Rule-based mitigation matrix'}
              </span>
            </div>

            {/* Active Panel View */}
            {recoveryViewTab === 'AI' ? (
              <AdaptiveRecoveryPanel
                context={aiContext}
                onDeployStrategy={handleDeployAiStrategy}
                isDeployed={isInterventionDeployed}
                disabled={simTimeSec >= maxTimeSec}
              />
            ) : (
              <InterventionPanel
                recommendations={recommendations}
                selectedInterventionId={selectedInterventionId}
                onSelectIntervention={setSelectedInterventionId}
                onDeployIntervention={handleDeployIntervention}
                isDeployed={isInterventionDeployed}
                disabled={simTimeSec >= maxTimeSec}
                failureNodeName={
                  nodes.find((n) => n.id === selectedNodeId)?.name || 'Central Infrastructure'
                }
                failureType={failureType}
              />
            )}
          </section>
        )}

        {/* 4. Final State Banner & Deterministic Replay Section */}
        {isFinalState && (
          <div className="w-full rounded-2xl p-5 border border-emerald-300 bg-white shadow-command-lg flex flex-wrap items-center justify-between gap-4 font-mono select-none animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-extrabold text-charcoal-900">
                    ✓ SIMULATION COMPLETE — CASCADE CONTAINED
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-500 mt-1">
                  <span>Recovery: <strong className="text-charcoal-900">18 minutes</strong></span>
                  <span>•</span>
                  <span>Services protected: <strong className="text-emerald-700">76%</strong></span>
                  <span>•</span>
                  <span>Population protected: <strong className="text-charcoal-900">26,700</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={handleReplayScenario}
                className="px-4 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-900 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                title="Verify deterministic replay"
              >
                <RotateCcw className="w-4 h-4 text-charcoal-600" />
                <span>REPLAY SCENARIO</span>
              </button>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-xs tracking-wider transition-all flex items-center space-x-2 shadow-command cursor-pointer"
              >
                <FileText className="w-4 h-4 text-cream-100" />
                <span>VIEW IMPACT REPORT</span>
              </button>
            </div>
          </div>
        )}

        {/* Deterministic Replay Hash Verification Banner */}
        {replayHashInfo && (
          <div className="w-full p-3.5 rounded-2xl bg-white border border-charcoal-900/15 shadow-command flex flex-wrap items-center justify-between gap-3 font-mono text-xs animate-in fade-in">
            <div className="flex items-center space-x-4">
              <span className="text-charcoal-500">
                RUN #1 EVENT HASH: <strong className="text-charcoal-900">{replayHashInfo.run1Hash}</strong>
              </span>
              <span className="text-charcoal-500">
                RUN #2 EVENT HASH: <strong className="text-charcoal-900">{replayHashInfo.run2Hash}</strong>
              </span>
            </div>
            <span className="px-2.5 py-1 rounded bg-softblue-100 text-softblue-700 font-bold border border-softblue-300">
              ✓ DETERMINISTIC RUN VERIFIED
            </span>
          </div>
        )}

        {/* 5. Bottom Cascade Event Stream Timeline */}
        <section className="w-full">
          <CascadeEventStream
            events={events}
            currentTimeLabel={`T+${formatClock(simTimeSec)}`}
          />
        </section>

        {/* 6. Simulation Playback Controls Bar */}
        <SimulationControls
          isPlaying={isPlaying}
          onPlay={() => {
            if (simTimeSec >= maxTimeSec) {
              handleReset();
            }
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onReset={handleReset}
          playbackSpeed={playbackSpeed}
          onSetSpeed={setPlaybackSpeed}
          simTimeFormatted={formatClock(simTimeSec)}
          maxTimeFormatted={formatClock(maxTimeSec)}
        />
      </main>

      {/* Modals */}
      <ImpactRecoveryReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReplay={handleReset}
        telemetry={telemetry}
        intervention={selectedInterventionId}
        interventionRecommendation={activeSelectedRecommendation}
        failureNodeName={
          nodes.find((n) => n.id === selectedNodeId)?.name || 'Central Infrastructure'
        }
        scenarioName={activeScenario.name}
      />

      <WhyDidThisFailModal
        isOpen={isWhyModalOpen}
        onClose={() => setIsWhyModalOpen(false)}
        causalInfo={causalInfo}
      />

      <ScenarioLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onSelectScenario={(scenario) => {
          handleRunCustomScenario(scenario);
        }}
        activeScenarioId={activeScenario.id}
      />

      <SimulationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />
    </div>
  );
};
