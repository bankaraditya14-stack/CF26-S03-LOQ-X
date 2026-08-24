import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Layers,
  CheckCircle2,
  FileText,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  DigitalTwinNode,
  DependencyLink,
  TelemetryState,
  CascadeStreamEvent,
  FailureSeverity,
  FailureType,
  InterventionType,
} from './types';
import { DigitalTwinMap } from './DigitalTwinMap';
import { FailureInjectionPanel } from './FailureInjectionPanel';
import { LiveTelemetryPanel } from './LiveTelemetryPanel';
import { InterventionPanel } from './InterventionPanel';
import { CascadeEventStream } from './CascadeEventStream';
import { ImpactRecoveryReportModal } from './ImpactRecoveryReportModal';
import { navigate } from '../../utils/router';

// 8 Core Infrastructure Nodes with 2D Map Coordinates (percentage x, y)
const INITIAL_NODES: DigitalTwinNode[] = [
  {
    id: 'power-grid',
    name: 'POWER GRID',
    shortName: 'Power Grid',
    sector: 'POWER',
    x: 22,
    y: 22,
    status: 'ONLINE',
    health: 100,
    load: 72,
    connections: ['water-pump', 'telecom', 'industry'],
    description: 'Central 400kV Power Substation and Distribution Grid.',
  },
  {
    id: 'water-pump',
    name: 'WATER PUMP',
    shortName: 'Water Pump',
    sector: 'WATER',
    x: 50,
    y: 22,
    status: 'ONLINE',
    health: 100,
    load: 65,
    connections: ['water-dist'],
    description: 'Raw Water Turbine Intake and High-Pressure Booster.',
  },
  {
    id: 'water-dist',
    name: 'WATER DISTRIBUTION',
    shortName: 'Water Dist',
    sector: 'WATER',
    x: 78,
    y: 22,
    status: 'ONLINE',
    health: 100,
    load: 60,
    connections: ['hospital', 'residential'],
    description: 'Potable Water Distribution Mains and Pressure Reserves.',
  },
  {
    id: 'telecom',
    name: 'TELECOM',
    shortName: 'Telecom',
    sector: 'TELECOM',
    x: 22,
    y: 65,
    status: 'ONLINE',
    health: 100,
    load: 55,
    connections: ['emergency', 'hospital'],
    description: 'Metropolitan Fiber Core and Cellular Network Backbone.',
  },
  {
    id: 'emergency',
    name: 'EMERGENCY SERVICES',
    shortName: 'Emergency',
    sector: 'EMERGENCY',
    x: 50,
    y: 65,
    status: 'ONLINE',
    health: 100,
    load: 40,
    connections: ['hospital'],
    description: '112 Integrated Dispatch, CAD, and First Responders.',
  },
  {
    id: 'hospital',
    name: 'HOSPITAL',
    shortName: 'Hospital',
    sector: 'HEALTHCARE',
    x: 78,
    y: 65,
    status: 'ONLINE',
    health: 100,
    load: 85,
    connections: [],
    description: 'Civil Apex Trauma Center, Surgical Suites & ICU.',
  },
  {
    id: 'industry',
    name: 'INDUSTRIAL ZONE',
    shortName: 'Industry',
    sector: 'INDUSTRY',
    x: 36,
    y: 44,
    status: 'ONLINE',
    health: 100,
    load: 50,
    connections: ['residential'],
    description: 'Heavy Manufacturing and Municipal Logistics Hub.',
  },
  {
    id: 'residential',
    name: 'RESIDENTIAL DISTRICT',
    shortName: 'Residential',
    sector: 'RESIDENTIAL',
    x: 64,
    y: 44,
    status: 'ONLINE',
    health: 100,
    load: 68,
    connections: [],
    description: 'Urban Residential Sectors and Civic Utility Feeds.',
  },
];

const INITIAL_LINKS: DependencyLink[] = [
  { from: 'power-grid', to: 'water-pump', label: 'POWER FEED', delaySec: 3 },
  { from: 'power-grid', to: 'telecom', label: 'GRID POWER', delaySec: 4 },
  { from: 'power-grid', to: 'industry', label: 'HV FEED', delaySec: 5 },
  { from: 'water-pump', to: 'water-dist', label: 'RAW INTAKE', delaySec: 4 },
  { from: 'water-dist', to: 'hospital', label: 'POTABLE WATER', delaySec: 3 },
  { from: 'water-dist', to: 'residential', label: 'WATER MAINS', delaySec: 5 },
  { from: 'telecom', to: 'emergency', label: '112 TRUNK', delaySec: 3 },
  { from: 'telecom', to: 'hospital', label: 'TELEMETRY', delaySec: 5 },
  { from: 'emergency', to: 'hospital', label: 'TRAUMA DISPATCH', delaySec: 3 },
  { from: 'industry', to: 'residential', label: 'LOGISTICS', delaySec: 6 },
];

const INITIAL_EVENTS: CascadeStreamEvent[] = [
  {
    id: 'evt-0',
    timeSec: 0,
    timeLabel: 'T+00:00',
    title: 'Simulation initialized',
    description: 'Digital-Twin city grid standing by. All 8 sectors healthy.',
    severity: 'info',
  },
  {
    id: 'evt-1',
    timeSec: 5,
    timeLabel: 'T+00:05',
    title: 'Waiting for failure event...',
    description: 'Select an infrastructure asset and click Inject Failure to begin.',
    severity: 'info',
  },
];

interface MissionControlScreenProps {
  scenarioId?: string;
}

export const MissionControlScreen: React.FC<MissionControlScreenProps> = ({ scenarioId }) => {
  // State
  const [nodes, setNodes] = useState<DigitalTwinNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('power-grid');
  const [severity, setSeverity] = useState<FailureSeverity>('CRITICAL');
  const [failureType, setFailureType] = useState<FailureType>('Equipment Failure');
  const [probability, setProbability] = useState<number>(100);

  const [simTimeSec, setSimTimeSec] = useState<number>(0);
  const maxTimeSec = 37;
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasInjected, setHasInjected] = useState<boolean>(false);

  const [selectedIntervention, setSelectedIntervention] = useState<InterventionType | null>(null);
  const [isInterventionDeployed, setIsInterventionDeployed] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  const [events, setEvents] = useState<CascadeStreamEvent[]>(INITIAL_EVENTS);

  // Telemetry Calculation
  const telemetry: TelemetryState = React.useMemo(() => {
    const total = nodes.length;
    const affected = nodes.filter((n) => n.status !== 'ONLINE').length;
    const active = total - nodes.filter((n) => n.status === 'CRITICAL').length;
    const avgHealth = Math.round(
      nodes.reduce((acc, n) => acc + n.health, 0) / total
    );

    let risk: TelemetryState['cascadeRisk'] = 'LOW';
    if (isInterventionDeployed && (simTimeSec >= 24 || affected <= 2)) {
      risk = 'CONTAINED';
    } else if (affected >= 4 || avgHealth < 50) {
      risk = 'CRITICAL';
    } else if (affected >= 1) {
      risk = 'ELEVATED';
    }

    const popAtRisk =
      affected === 0
        ? 0
        : isInterventionDeployed
        ? 15800
        : Math.min(42500, affected * 9500);

    const estRecovery =
      affected === 0
        ? null
        : isInterventionDeployed
        ? 18
        : 37;

    const cascadeDepth = Math.min(5, Math.max(0, affected));
    const servicesProtectedPct = Math.round(((total - affected) / total) * 100);

    return {
      systemHealth: avgHealth,
      activeNodes: active,
      affectedNodes: affected,
      populationAtRisk: popAtRisk,
      cascadeRisk: risk,
      estRecoveryMin: estRecovery,
      cascadeDepth,
      servicesProtectedPct,
    };
  }, [nodes, isInterventionDeployed, simTimeSec]);

  // Format Time (00:18 / 00:37)
  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Inject Failure Action
  const handleInjectFailure = () => {
    setHasInjected(true);
    setIsPlaying(true);
    setSimTimeSec(0);

    // Initial root node failure
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNodeId
          ? { ...n, status: 'CRITICAL', health: 0 }
          : n
      )
    );

    const target = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

    setEvents([
      {
        id: `evt-${Date.now()}-1`,
        timeSec: 0,
        timeLabel: 'T+00:00',
        title: `${target.name} failure detected`,
        description: `Primary ${severity.toLowerCase()} ${failureType.toLowerCase()} triggered at central substation.`,
        severity: 'critical',
        targetNodeId: target.id,
      },
    ]);
  };

  // Select and Deploy Intervention
  const handleSelectIntervention = (intervention: InterventionType) => {
    setSelectedIntervention(intervention);
    setIsInterventionDeployed(true);

    const timeLabel = `T+${formatClock(simTimeSec)}`;

    if (intervention === 'generator') {
      setEvents((prev) => [
        ...prev,
        {
          id: `evt-rec-${Date.now()}`,
          timeSec: simTimeSec,
          timeLabel,
          title: 'DEPLOY BACKUP GENERATOR Engaged',
          description: 'Emergency auxiliary diesel generators deployed to Water Pump and Trauma Hospital.',
          severity: 'recovery',
        },
      ]);

      // Protect and recover Hospital and Water Pump
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === 'hospital' || n.id === 'water-pump') {
            return {
              ...n,
              status: 'RECOVERING',
              health: Math.min(100, n.health + 45),
              hasBackupPower: true,
            };
          }
          return n;
        })
      );
    } else if (intervention === 'reroute') {
      setEvents((prev) => [
        ...prev,
        {
          id: `evt-rec-${Date.now()}`,
          timeSec: simTimeSec,
          timeLabel,
          title: 'REROUTE POWER Grid Transfer Active',
          description: 'Redirected available bus capacity through Sector B bypass to restore water grid.',
          severity: 'recovery',
        },
      ]);
      setNodes((prev) =>
        prev.map((n) =>
          n.id === 'water-dist' || n.id === 'water-pump'
            ? { ...n, status: 'RECOVERING', health: 80 }
            : n
        )
      );
    } else if (intervention === 'hospital') {
      setEvents((prev) => [
        ...prev,
        {
          id: `evt-rec-${Date.now()}`,
          timeSec: simTimeSec,
          timeLabel,
          title: 'PRIORITIZE HOSPITAL Islanding Deployed',
          description: 'Hospital prioritized; residential & industrial loads shed.',
          severity: 'recovery',
        },
      ]);
      setNodes((prev) =>
        prev.map((n) =>
          n.id === 'hospital'
            ? { ...n, status: 'ONLINE', health: 100, isIsolated: true }
            : n
        )
      );
    } else {
      setEvents((prev) => [
        ...prev,
        {
          id: `evt-rec-${Date.now()}`,
          timeSec: simTimeSec,
          timeLabel,
          title: 'NO INTERVENTION Strategy Logged',
          description: 'Passive monitoring selected. Propagation continues unabated.',
          severity: 'warning',
        },
      ]);
    }
  };

  // Reset Simulation
  const handleReset = () => {
    setIsPlaying(false);
    setHasInjected(false);
    setIsInterventionDeployed(false);
    setSelectedIntervention(null);
    setSimTimeSec(0);
    setNodes(INITIAL_NODES);
    setEvents(INITIAL_EVENTS);
  };

  // Simulation Clock Tick Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.floor(1000 / playbackSpeed);
    const timer = setInterval(() => {
      setSimTimeSec((prev) => {
        const next = prev + 1;

        // Cascade Stage Transitions based on elapsed simulated seconds
        if (hasInjected && !isInterventionDeployed) {
          // T+03: Water Pump losing power
          if (next === 3) {
            setNodes((curr) =>
              curr.map((n) =>
                n.id === 'water-pump' ? { ...n, status: 'WARNING', health: 65 } : n
              )
            );
            setEvents((e) => [
              ...e,
              {
                id: `evt-prop-3`,
                timeSec: 3,
                timeLabel: 'T+00:03',
                title: 'Water Pump losing power',
                description: 'Voltage drop detected from main substation feeder.',
                severity: 'warning',
                targetNodeId: 'water-pump',
              },
            ]);
          }

          // T+07: Water Distribution degradation detected
          if (next === 7) {
            setNodes((curr) =>
              curr.map((n) =>
                n.id === 'water-pump'
                  ? { ...n, status: 'CRITICAL', health: 0 }
                  : n.id === 'water-dist'
                  ? { ...n, status: 'DEGRADED', health: 40 }
                  : n
              )
            );
            setEvents((e) => [
              ...e,
              {
                id: `evt-prop-7`,
                timeSec: 7,
                timeLabel: 'T+00:07',
                title: 'Water Distribution degradation detected',
                description: 'Main reservoir booster pressure falling below nominal thresholds.',
                severity: 'warning',
                targetNodeId: 'water-dist',
              },
            ]);
          }

          // T+10: Hospital backup systems activated
          if (next === 10) {
            setNodes((curr) =>
              curr.map((n) =>
                n.id === 'hospital' ? { ...n, status: 'WARNING', health: 70 } : n
              )
            );
            setEvents((e) => [
              ...e,
              {
                id: `evt-prop-10`,
                timeSec: 10,
                timeLabel: 'T+00:10',
                title: 'Hospital backup systems activated',
                description: 'Potable water supply loss threatening surgical sterilization units.',
                severity: 'warning',
                targetNodeId: 'hospital',
              },
            ]);
          }

          // T+13: Emergency Services risk increased
          if (next === 13) {
            setNodes((curr) =>
              curr.map((n) =>
                n.id === 'emergency' ? { ...n, status: 'DEGRADED', health: 50 } : n
              )
            );
            setEvents((e) => [
              ...e,
              {
                id: `evt-prop-13`,
                timeSec: 13,
                timeLabel: 'T+00:13',
                title: 'Emergency Services risk increased',
                description: 'Call queues surging due to concurrent multi-sector alerts.',
                severity: 'critical',
                targetNodeId: 'emergency',
              },
            ]);
          }
        }

        // Post-Intervention Stabilization Curve
        if (isInterventionDeployed) {
          if (next >= 24 && next < maxTimeSec) {
            setNodes((curr) =>
              curr.map((n) => {
                if (n.id === 'hospital') return { ...n, status: 'ONLINE', health: 100 };
                if (n.id === 'water-pump' && selectedIntervention === 'generator')
                  return { ...n, status: 'ONLINE', health: 90 };
                if (n.id === 'emergency') return { ...n, status: 'ONLINE', health: 95 };
                return n;
              })
            );
          }
        }

        // Completion
        if (next >= maxTimeSec) {
          setIsPlaying(false);
          return maxTimeSec;
        }

        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, hasInjected, isInterventionDeployed, selectedIntervention, maxTimeSec]);

  // Overall Status Badge
  const getHeaderStatus = () => {
    if (simTimeSec >= maxTimeSec && hasInjected) {
      return (
        <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>CASCADE CONTAINED</span>
        </span>
      );
    }

    if (hasInjected && !isInterventionDeployed && telemetry.affectedNodes >= 2) {
      return (
        <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/90 text-amber-400 border border-amber-500/60 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.3)]">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>INTERVENTION REQUIRED</span>
        </span>
      );
    }

    if (isPlaying) {
      return (
        <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/90 text-cyan-400 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>SIMULATION RUNNING</span>
        </span>
      );
    }

    return (
      <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>● SIMULATION READY</span>
      </span>
    );
  };

  const isFinalState = simTimeSec >= maxTimeSec || (isInterventionDeployed && simTimeSec >= 24);

  return (
    <div className="min-h-screen flex flex-col bg-command-grid text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* 1. Header Navigation Bar */}
      <header className="w-full bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 select-none">
        {/* Left: Brand & S-03 */}
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 transition-all flex items-center space-x-1.5 text-xs font-mono cursor-pointer"
            title="Back to Landing Page"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">OVERVIEW</span>
          </button>

          <div
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-600/10 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:border-cyan-400 transition-all">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 font-heading group-hover:text-cyan-300 transition-colors">
                  MISSION CONTROL
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden md:block">
                Simulate infrastructure failures. Observe cascading effects. Deploy interventions.
              </p>
            </div>
          </div>
        </div>

        {/* Center: Active Scenario & Mode */}
        <div className="hidden lg:flex items-center space-x-4 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-1.5 font-mono text-xs">
          <div className="flex items-center space-x-2 border-r border-slate-800 pr-4">
            <Layers className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[9px] uppercase text-slate-500">Scenario</div>
              <div className="font-semibold text-slate-200">
                {scenarioId === 'scenario-telecom-failure'
                  ? 'Metropolitan Telecom Failure'
                  : scenarioId === 'scenario-dual-failure'
                  ? 'Dual Infrastructure Disruption'
                  : 'Regional Power Grid Failure'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <div>
              <div className="text-[9px] uppercase text-slate-500">Simulation Mode</div>
              <div className="font-semibold text-emerald-400">LIVE DIGITAL-TWIN</div>
            </div>
          </div>
        </div>

        {/* Right: Status Badge & Links */}
        <div className="flex items-center space-x-2.5">
          {getHeaderStatus()}

          <button
            onClick={() => navigate('/about-model')}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-all text-xs cursor-pointer"
            title="Model Architecture & Spec"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Top 3-Column Command Center Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Failure Injection Panel (3 cols) */}
          <section className="lg:col-span-3 flex flex-col">
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
              onInjectFailure={handleInjectFailure}
              onReset={handleReset}
              isSimulationRunning={isPlaying}
              hasInjected={hasInjected}
            />
          </section>

          {/* Center Column: 2D Digital-Twin Infrastructure Map (6 cols, ~60%) */}
          <section className="lg:col-span-6 flex flex-col h-[520px] lg:h-auto min-h-[500px]">
            <DigitalTwinMap
              nodes={nodes}
              links={INITIAL_LINKS}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              isCascadeActive={hasInjected && !isInterventionDeployed}
              activeCascadeCount={telemetry.affectedNodes}
            />
          </section>

          {/* Right Column: Live System Telemetry (3 cols) */}
          <section className="lg:col-span-3 flex flex-col">
            <LiveTelemetryPanel
              telemetry={telemetry}
              totalNodes={nodes.length}
            />
          </section>
        </div>

        {/* 3. Real-Time Intervention Decision Panel (Appears when cascade occurs or is active) */}
        {(hasInjected || isInterventionDeployed) && (
          <section className="w-full">
            <InterventionPanel
              onSelectIntervention={handleSelectIntervention}
              selectedIntervention={selectedIntervention}
              isDeployed={isInterventionDeployed}
              disabled={simTimeSec >= maxTimeSec}
            />
          </section>
        )}

        {/* 4. Final State Completion Banner */}
        {isFinalState && (
          <div className="w-full glass-panel-glow rounded-2xl p-5 border border-emerald-500/50 bg-emerald-950/30 flex flex-wrap items-center justify-between gap-4 font-mono select-none animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-100">
                    SIMULATION COMPLETE — CASCADE CONTAINED
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                  <span>Recovery: <strong className="text-sky-300">18 minutes</strong></span>
                  <span>•</span>
                  <span>Services protected: <strong className="text-emerald-400">76%</strong></span>
                  <span>•</span>
                  <span>Population protected: <strong className="text-cyan-300">26,700</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider transition-all flex items-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>VIEW IMPACT REPORT</span>
            </button>
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
        <div className="w-full glass-panel rounded-2xl p-3.5 px-6 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono select-none">
          {/* Controls: Play/Pause/Reset */}
          <div className="flex items-center space-x-2.5">
            {isPlaying ? (
              <button
                onClick={() => setIsPlaying(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              >
                <Pause className="w-4 h-4" />
                <span>PAUSE</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (simTimeSec >= maxTimeSec) {
                    handleReset();
                  }
                  setIsPlaying(true);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                <Play className="w-4 h-4" />
                <span>START SIMULATION</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selectors: 1x / 2x / 4x */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">SPEED:</span>
            {([1, 2, 4] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {spd}×
              </button>
            ))}
          </div>

          {/* Clock Telemetry: 00:18 / 00:37 */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>SIMULATION TIME</span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sm font-bold text-cyan-300">
              {formatClock(simTimeSec)} / {formatClock(maxTimeSec)}
            </div>
          </div>
        </div>
      </main>

      {/* Impact & Recovery Report Modal */}
      <ImpactRecoveryReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReplay={handleReset}
        telemetry={telemetry}
        intervention={selectedIntervention}
        failureNodeName={
          nodes.find((n) => n.id === selectedNodeId)?.name || 'POWER GRID'
        }
      />
    </div>
  );
};
