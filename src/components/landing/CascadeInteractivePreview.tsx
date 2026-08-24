import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Droplets,
  Radio,
  Car,
  HeartPulse,
  PhoneCall,
  Activity,
} from 'lucide-react';

interface PreviewStep {
  timeLabel: string;
  timeMinutes: number;
  depth: number;
  affectedCount: number;
  activeEvent: string;
  cause: string;
  nodes: {
    [key: string]: {
      state: 'HEALTHY' | 'AT_RISK' | 'DEGRADED' | 'FAILED';
      reason?: string;
    };
  };
}

const PREVIEW_STEPS: PreviewStep[] = [
  {
    timeLabel: 'T+00:00',
    timeMinutes: 0,
    depth: 0,
    affectedCount: 0,
    activeEvent: 'Substation Trip — Central Power Grid (400kV) offline.',
    cause: 'Initial root disruption at primary electrical node.',
    nodes: {
      'power-grid': { state: 'FAILED', reason: 'Initial root disruption' },
      'water-pump': { state: 'HEALTHY' },
      'water-dist': { state: 'HEALTHY' },
      'telecom': { state: 'HEALTHY' },
      'traffic': { state: 'HEALTHY' },
      'dispatch': { state: 'HEALTHY' },
      'hospital': { state: 'HEALTHY' },
    },
  },
  {
    timeLabel: 'T+05:00',
    timeMinutes: 5,
    depth: 1,
    affectedCount: 1,
    activeEvent: 'Turbine Halts — Water Pumping Station loses grid feed.',
    cause: 'Power dependency required for high-pressure intake pumps.',
    nodes: {
      'power-grid': { state: 'FAILED', reason: 'Initial root disruption' },
      'water-pump': { state: 'FAILED', reason: 'Loss of electric feed from Power Grid' },
      'water-dist': { state: 'HEALTHY' },
      'telecom': { state: 'HEALTHY' },
      'traffic': { state: 'HEALTHY' },
      'dispatch': { state: 'HEALTHY' },
      'hospital': { state: 'HEALTHY' },
    },
  },
  {
    timeLabel: 'T+10:00',
    timeMinutes: 10,
    depth: 2,
    affectedCount: 2,
    activeEvent: 'Pressure Drops — Municipal Water Distribution degrades.',
    cause: 'Intake pumps offline; header tank hydrostatic pressure falling.',
    nodes: {
      'power-grid': { state: 'FAILED', reason: 'Initial root disruption' },
      'water-pump': { state: 'FAILED', reason: 'Loss of electric feed from Power Grid' },
      'water-dist': { state: 'DEGRADED', reason: 'Intake pump supply halted' },
      'telecom': { state: 'HEALTHY' },
      'traffic': { state: 'HEALTHY' },
      'dispatch': { state: 'HEALTHY' },
      'hospital': { state: 'HEALTHY' },
    },
  },
  {
    timeLabel: 'T+15:00',
    timeMinutes: 15,
    depth: 2,
    affectedCount: 3,
    activeEvent: 'Cellular Congestion — Telecom Core Tower experiences power drop.',
    cause: 'Grid power severed; telecom switches operating on battery backup.',
    nodes: {
      'power-grid': { state: 'FAILED', reason: 'Initial root disruption' },
      'water-pump': { state: 'FAILED', reason: 'Loss of electric feed from Power Grid' },
      'water-dist': { state: 'DEGRADED', reason: 'Intake pump supply halted' },
      'telecom': { state: 'DEGRADED', reason: 'Running on finite auxiliary batteries' },
      'traffic': { state: 'HEALTHY' },
      'dispatch': { state: 'HEALTHY' },
      'hospital': { state: 'HEALTHY' },
    },
  },
  {
    timeLabel: 'T+20:00',
    timeMinutes: 20,
    depth: 3,
    affectedCount: 4,
    activeEvent: 'Signal Grid Freeze — Traffic Control Network signals default to dark.',
    cause: 'Telecom latency & local power disruption disable automated sequencing.',
    nodes: {
      'power-grid': { state: 'FAILED', reason: 'Initial root disruption' },
      'water-pump': { state: 'FAILED', reason: 'Loss of electric feed from Power Grid' },
      'water-dist': { state: 'DEGRADED', reason: 'Intake pump supply halted' },
      'telecom': { state: 'DEGRADED', reason: 'Running on finite auxiliary batteries' },
      'traffic': { state: 'FAILED', reason: 'Telecom link lost & electric feed offline' },
      'dispatch': { state: 'HEALTHY' },
      'hospital': { state: 'HEALTHY' },
    },
  },
  {
    timeLabel: 'T+25:00',
    timeMinutes: 25,
    depth: 4,
    affectedCount: 5,
    activeEvent: 'Emergency Delay — Central Emergency 112 Dispatch response stalled.',
    cause: 'Arterial gridlock from failed traffic lights blocks ambulance routes.',
    nodes: {
      'power-grid': { state: 'FAILED', reason: 'Initial root disruption' },
      'water-pump': { state: 'FAILED', reason: 'Loss of electric feed from Power Grid' },
      'water-dist': { state: 'DEGRADED', reason: 'Intake pump supply halted' },
      'telecom': { state: 'DEGRADED', reason: 'Running on finite auxiliary batteries' },
      'traffic': { state: 'FAILED', reason: 'Telecom link lost & electric feed offline' },
      'dispatch': { state: 'FAILED', reason: 'Urban transit gridlock stalls response units' },
      'hospital': { state: 'AT_RISK', reason: 'Operating on generator with delayed supplies' },
    },
  },
];

export const CascadeInteractivePreview: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeHoverNode, setActiveHoverNode] = useState<string | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % PREVIEW_STEPS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const step = PREVIEW_STEPS[currentStep];

  const getNodeVisual = (state: string) => {
    switch (state) {
      case 'FAILED':
        return {
          bg: 'bg-red-600',
          border: 'border-red-500',
          cardBg: 'bg-red-50/80 border-red-400 shadow-[0_0_16px_rgba(239,68,68,0.3)]',
          text: 'text-red-700',
          pillBg: 'bg-red-100 text-red-700 border border-red-300',
          dot: 'bg-red-600',
          iconBg: 'bg-red-600 text-white',
          statusText: 'CRITICAL FAILURE',
          glow: 'shadow-[0_0_16px_rgba(239,68,68,0.35)]',
        };
      case 'DEGRADED':
        return {
          bg: 'bg-amber-500',
          border: 'border-amber-400',
          cardBg: 'bg-amber-50/80 border-amber-300 shadow-sm',
          text: 'text-amber-800',
          pillBg: 'bg-amber-100 text-amber-800 border border-amber-300',
          dot: 'bg-amber-500',
          iconBg: 'bg-amber-500 text-white',
          statusText: 'DEGRADED',
          glow: 'shadow-none',
        };
      case 'AT_RISK':
        return {
          bg: 'bg-amber-400',
          border: 'border-amber-300',
          cardBg: 'bg-amber-50/60 border-amber-300 shadow-sm',
          text: 'text-amber-800',
          pillBg: 'bg-amber-100 text-amber-800 border border-amber-300',
          dot: 'bg-amber-500',
          iconBg: 'bg-amber-500 text-white',
          statusText: 'AT RISK',
          glow: 'shadow-none',
        };
      case 'HEALTHY':
      default:
        return {
          bg: 'bg-emerald-500',
          border: 'border-emerald-300',
          cardBg: 'bg-white border-emerald-200/80',
          text: 'text-emerald-700',
          pillBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
          dot: 'bg-emerald-500',
          iconBg: 'bg-emerald-50 text-emerald-700',
          statusText: 'OPERATIONAL',
          glow: 'shadow-none',
        };
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-charcoal-900/15 shadow-command-lg overflow-hidden flex flex-col font-sans">
      {/* Header bar */}
      <div className="bg-cream-100 border-b border-charcoal-900/10 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${step.affectedCount > 0 ? 'bg-dustybrown-300 opacity-75' : 'bg-softblue-400 opacity-75'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${step.affectedCount > 0 ? 'bg-dustybrown-300' : 'bg-softblue-400'}`}></span>
          </span>
          <span className="font-mono text-xs font-bold text-charcoal-900 uppercase tracking-wider">
            Cascade Engine Live Simulation Preview
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded bg-mutedpurple-100 text-mutedpurple-700 font-mono font-semibold border border-mutedpurple-300">
            {step.timeLabel}
          </span>
        </div>

        {/* Telemetry quick metrics */}
        <div className="flex items-center space-x-6 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="text-charcoal-500">CASCADE DEPTH:</span>
            <span className="font-bold text-charcoal-900 bg-white px-2 py-0.5 rounded border border-charcoal-900/10">
              {step.depth}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-charcoal-500">DOWNSTREAM IMPACT:</span>
            <span className="font-bold text-dustybrown-400 bg-white px-2 py-0.5 rounded border border-charcoal-900/10">
              {step.affectedCount} NODES
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Diagram Canvas */}
      <div className="p-6 md:p-8 bg-cream-50 relative min-h-[380px] flex flex-col justify-between">
        {/* Background Network Topology Grid */}
        <div className="absolute inset-0 bg-cream-dots opacity-40 pointer-events-none"></div>

        {/* Node Layout Graph */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 my-auto items-center">
          {/* Column 1: Primary Power & Telecom */}
          <div className="space-y-5">
            <div
              onMouseEnter={() => setActiveHoverNode('power-grid')}
              onMouseLeave={() => setActiveHoverNode(null)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeHoverNode === 'power-grid' ? 'ring-2 ring-charcoal-900 shadow-command' : ''
              } ${getNodeVisual(step.nodes['power-grid'].state).cardBg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg ${getNodeVisual(step.nodes['power-grid'].state).iconBg}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-charcoal-900">400kV Central Substation</h4>
                    <span className="text-[10px] text-charcoal-500 font-mono">SECTOR: POWER</span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${getNodeVisual(step.nodes['power-grid'].state).pillBg}`}>
                  {getNodeVisual(step.nodes['power-grid'].state).statusText}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-500 line-clamp-1">
                {step.nodes['power-grid'].reason ?? 'Supplies high-voltage feeder circuits.'}
              </p>
            </div>

            <div
              onMouseEnter={() => setActiveHoverNode('telecom')}
              onMouseLeave={() => setActiveHoverNode(null)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeHoverNode === 'telecom' ? 'ring-2 ring-charcoal-900 shadow-command' : ''
              } ${getNodeVisual(step.nodes['telecom'].state).cardBg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg ${getNodeVisual(step.nodes['telecom'].state).iconBg}`}>
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-charcoal-900">North Tower Telecom Core</h4>
                    <span className="text-[10px] text-charcoal-500 font-mono">SECTOR: TELECOM</span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${getNodeVisual(step.nodes['telecom'].state).pillBg}`}>
                  {getNodeVisual(step.nodes['telecom'].state).statusText}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-500 line-clamp-1">
                {step.nodes['telecom'].reason ?? 'Transmits scada telemetry & city mobile voice.'}
              </p>
            </div>
          </div>

          {/* Column 2: Water & Traffic Systems */}
          <div className="space-y-5">
            <div
              onMouseEnter={() => setActiveHoverNode('water-pump')}
              onMouseLeave={() => setActiveHoverNode(null)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeHoverNode === 'water-pump' ? 'ring-2 ring-charcoal-900 shadow-command' : ''
              } ${getNodeVisual(step.nodes['water-pump'].state).cardBg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg ${getNodeVisual(step.nodes['water-pump'].state).iconBg}`}>
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-charcoal-900">Intake Water Pumping Station</h4>
                    <span className="text-[10px] text-charcoal-500 font-mono">SECTOR: WATER</span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${getNodeVisual(step.nodes['water-pump'].state).pillBg}`}>
                  {getNodeVisual(step.nodes['water-pump'].state).statusText}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-500 line-clamp-1">
                {step.nodes['water-pump'].reason ?? 'Requires electrical turbine pressure.'}
              </p>
            </div>

            <div
              onMouseEnter={() => setActiveHoverNode('traffic')}
              onMouseLeave={() => setActiveHoverNode(null)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeHoverNode === 'traffic' ? 'ring-2 ring-charcoal-900 shadow-command' : ''
              } ${getNodeVisual(step.nodes['traffic'].state).cardBg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg ${getNodeVisual(step.nodes['traffic'].state).iconBg}`}>
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-charcoal-900">Arterial Traffic Signals</h4>
                    <span className="text-[10px] text-charcoal-500 font-mono">SECTOR: TRANSIT</span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${getNodeVisual(step.nodes['traffic'].state).pillBg}`}>
                  {getNodeVisual(step.nodes['traffic'].state).statusText}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-500 line-clamp-1">
                {step.nodes['traffic'].reason ?? 'Controls 14 core arterial urban junctions.'}
              </p>
            </div>
          </div>

          {/* Column 3: Critical Healthcare & Dispatch */}
          <div className="space-y-5">
            <div
              onMouseEnter={() => setActiveHoverNode('dispatch')}
              onMouseLeave={() => setActiveHoverNode(null)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeHoverNode === 'dispatch' ? 'ring-2 ring-charcoal-900 shadow-command' : ''
              } ${getNodeVisual(step.nodes['dispatch'].state).cardBg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg ${getNodeVisual(step.nodes['dispatch'].state).iconBg}`}>
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-charcoal-900">112 Emergency Dispatch</h4>
                    <span className="text-[10px] text-charcoal-500 font-mono">SECTOR: EMERGENCY</span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${getNodeVisual(step.nodes['dispatch'].state).pillBg}`}>
                  {getNodeVisual(step.nodes['dispatch'].state).statusText}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-500 line-clamp-1">
                {step.nodes['dispatch'].reason ?? 'Dispatches ambulances & rapid response vehicles.'}
              </p>
            </div>

            <div
              onMouseEnter={() => setActiveHoverNode('hospital')}
              onMouseLeave={() => setActiveHoverNode(null)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeHoverNode === 'hospital' ? 'ring-2 ring-charcoal-900 shadow-command' : ''
              } ${getNodeVisual(step.nodes['hospital'].state).cardBg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg ${getNodeVisual(step.nodes['hospital'].state).iconBg}`}>
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-charcoal-900">City General Trauma Center</h4>
                    <span className="text-[10px] text-charcoal-500 font-mono">SECTOR: HEALTHCARE</span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${getNodeVisual(step.nodes['hospital'].state).pillBg}`}>
                  {getNodeVisual(step.nodes['hospital'].state).statusText}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-500 line-clamp-1">
                {step.nodes['hospital'].reason ?? 'ICU & emergency departments reliant on clean power & water.'}
              </p>
            </div>
          </div>
        </div>

        {/* Live event propagation banner */}
        <div className="mt-6 bg-white border border-charcoal-900/10 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-lg bg-mutedpurple-100 text-mutedpurple-700">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-charcoal-500 block uppercase">
                Active Failure Propagation:
              </span>
              <span className="text-xs font-bold text-charcoal-900">
                {step.activeEvent}
              </span>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-charcoal-500 font-mono">
            <span>Causal Link:</span>
            <span className="text-dustybrown-400 font-semibold">{step.cause}</span>
          </div>
        </div>
      </div>

      {/* Playback Controls & Step Scrubber */}
      <div className="bg-cream-100 border-t border-charcoal-900/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 rounded-lg bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>PLAY</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              setCurrentStep(0);
              setIsPlaying(true);
            }}
            className="p-1.5 rounded-lg hover:bg-cream-200 text-charcoal-500 hover:text-charcoal-900 transition-colors cursor-pointer"
            title="Reset Simulation Preview"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center space-x-1.5">
          {PREVIEW_STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentStep(idx);
                setIsPlaying(false);
              }}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentStep
                  ? 'w-8 bg-charcoal-900'
                  : 'w-2.5 bg-charcoal-900/20 hover:bg-charcoal-900/40'
              }`}
              title={`Step ${idx + 1}: ${s.timeLabel}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
