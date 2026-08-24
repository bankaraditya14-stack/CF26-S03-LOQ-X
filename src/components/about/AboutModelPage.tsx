import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Network,
  Calculator,
} from 'lucide-react';
import { SYNTHETIC_CITY_GRAPH } from '../../data/cityGraph';
import { navigate } from '../../utils/router';

export const AboutModelPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-charcoal-900 font-sans selection:bg-mutedpurple-300 selection:text-white">
      {/* Top Header */}
      <header className="w-full bg-cream-100/95 backdrop-blur-md border-b border-charcoal-900/10 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 px-2.5 rounded-xl bg-white hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-700 hover:text-charcoal-900 transition-all flex items-center space-x-1.5 text-xs font-mono font-bold cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">OVERVIEW</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-base font-bold tracking-tight text-charcoal-900 font-heading">
              CASCADE CITY
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mutedpurple-100 text-mutedpurple-700 border border-mutedpurple-300 font-bold">
              MODEL SPECIFICATION
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/simulator')}
          className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-xs font-mono tracking-wider transition-all flex items-center space-x-2 cursor-pointer shadow-command"
        >
          <span>OPEN SIMULATOR</span>
          <ArrowRight className="w-4 h-4 text-cream-100" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Title & Introduction */}
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-charcoal-900/10 text-charcoal-700 font-mono text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-softblue-500"></span>
            <span>SYNTHETIC URBAN RESILIENCE ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 font-heading">
            Simulation Model & Mathematical Specifications
          </h1>
          <p className="text-charcoal-600 text-sm sm:text-base leading-relaxed">
            Cascade City (JanNagar Resilience Grid v1) models cross-sector cascading infrastructure failure dynamics as a directed acyclic dependency graph evaluated through discrete priority event queues.
          </p>
        </div>

        {/* Explicit Synthetic Disclaimer */}
        <div className="p-5 rounded-2xl bg-white border border-charcoal-900/15 text-charcoal-700 text-xs leading-relaxed space-y-2 shadow-command">
          <div className="font-bold flex items-center space-x-2 uppercase tracking-wider text-charcoal-900">
            <ShieldCheck className="w-4 h-4 text-softblue-700" />
            <span>Synthetic Infrastructure Model Notice</span>
          </div>
          <p>
            All 13 infrastructure nodes, 22 dependency edges, propagation latency constants, and recovery functions are synthetic simulation parameters created for demonstration and resilience research. This software does NOT connect to live municipal SCADA systems, power utilities, or government networks.
          </p>
        </div>

        {/* Section 1: Discrete Node State Model */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-charcoal-900/15 shadow-command space-y-4">
          <h2 className="text-lg font-bold text-charcoal-900 font-mono uppercase tracking-wider flex items-center space-x-2">
            <Activity className="w-5 h-5 text-mutedpurple-600" />
            <span>1. Discrete Node State Transition Machine</span>
          </h2>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Each infrastructure asset exists in one of five mutually exclusive discrete states. Transitions occur strictly upon event resolution from upstream dependency evaluations or operator mitigations:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-cream-50 border border-softblue-300">
              <span className="font-bold text-softblue-700 block mb-1">HEALTHY</span>
              <span className="text-[11px] text-charcoal-600">100% capacity, all required feeds intact.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-400">
              <span className="font-bold text-charcoal-800 block mb-1">AT_RISK</span>
              <span className="text-[11px] text-charcoal-600">Upstream dependency is degraded or capacity &gt;80%.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-cream-50 border border-dustybrown-300">
              <span className="font-bold text-dustybrown-400 block mb-1">DEGRADED</span>
              <span className="text-[11px] text-charcoal-600">Primary feed lost; running on backup buffer.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-dustybrown-50 border border-dustybrown-400">
              <span className="font-bold text-dustybrown-400 block mb-1">FAILED</span>
              <span className="text-[11px] text-charcoal-600">Total outage. Dependent feeds starve.</span>
            </div>
            <div className="p-3.5 rounded-xl bg-cream-50 border border-mutedpurple-300">
              <span className="font-bold text-mutedpurple-700 block mb-1">RECOVERING</span>
              <span className="text-[11px] text-charcoal-600">Mitigation engaged. Restoring towards Healthy.</span>
            </div>
          </div>
        </div>

        {/* Section 2: Mathematical Metric Definitions */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-charcoal-900/15 shadow-command space-y-4">
          <h2 className="text-lg font-bold text-charcoal-900 font-mono uppercase tracking-wider flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-mutedpurple-600" />
            <span>2. Core Resilience Metrics Formulas</span>
          </h2>

          <div className="space-y-4 text-xs text-charcoal-700 leading-relaxed font-mono">
            <div className="bg-cream-50 p-4 rounded-xl border border-charcoal-900/10 space-y-1.5">
              <div className="text-charcoal-900 font-bold uppercase">Cascade Depth (Hops)</div>
              <p className="text-charcoal-600 font-sans">
                Calculated as the maximum length path in the causal directed acyclic propagation subgraph from initial root failure nodes:
              </p>
              <div className="p-3 rounded-lg bg-white border border-charcoal-900/10 text-charcoal-900 font-mono font-bold">
                Depth = max( causal_path_length(root_node → terminal_failed_node) )
              </div>
            </div>

            <div className="bg-cream-50 p-4 rounded-xl border border-charcoal-900/10 space-y-1.5">
              <div className="text-dustybrown-400 font-bold uppercase">Affected Services Count</div>
              <p className="text-charcoal-600 font-sans">
                The distinct count of downstream nodes that experienced a non-healthy state transition, strictly excluding the root nodes:
              </p>
              <div className="p-3 rounded-lg bg-white border border-charcoal-900/10 text-dustybrown-400 font-mono font-bold">
                AffectedServices = count( distinct(affected_nodes) \ root_failure_nodes )
              </div>
            </div>

            <div className="bg-cream-50 p-4 rounded-xl border border-charcoal-900/10 space-y-1.5">
              <div className="text-softblue-700 font-bold uppercase">Recovery Duration (Minutes)</div>
              <p className="text-charcoal-600 font-sans">
                Simulated minutes elapsed between the start of operator recovery action and complete stabilization of all downstream nodes:
              </p>
              <div className="p-3 rounded-lg bg-white border border-charcoal-900/10 text-softblue-700 font-mono font-bold">
                RecoveryTime = max( event_timestamp_stabilized ) - min( recovery_action_timestamp )
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Topology Inventory */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-charcoal-900/15 shadow-command space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-900/10">
            <h2 className="text-lg font-bold text-charcoal-900 font-mono uppercase tracking-wider flex items-center space-x-2">
              <Network className="w-5 h-5 text-mutedpurple-600" />
              <span>3. JanNagar Graph Topology (13 Services, 22 Edges)</span>
            </h2>
            <span className="text-xs font-mono font-bold text-charcoal-500">city-v1</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SYNTHETIC_CITY_GRAPH.nodes.map((node) => (
              <div
                key={node.id}
                className="p-3.5 rounded-xl bg-cream-50 border border-charcoal-900/10 space-y-1.5 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-charcoal-900">{node.name}</span>
                  <span className="px-2 py-0.5 rounded bg-white text-[10px] text-charcoal-700 border border-charcoal-900/10 font-bold">
                    {node.type}
                  </span>
                </div>
                <div className="text-[11px] text-charcoal-500">{node.description}</div>
                <div className="text-[10px] text-charcoal-400 pt-1 border-t border-charcoal-900/5">
                  Sector: {node.zone} • Criticality: {node.criticality} • Recovery Rate: {node.recoveryTime}m
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Determinism Guarantee */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-charcoal-900/15 shadow-command space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-softblue-700" />
            <h2 className="text-lg font-bold text-charcoal-900 font-mono uppercase tracking-wider">
              4. Strict Deterministic Replay Specification
            </h2>
          </div>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            The simulation engine is built in pure TypeScript with zero random number generators or wall-clock references. Simultaneous events at identical timestamps ($T_i$) are sorted in a strictly ordered priority queue (Root Failures → Propagations → Mitigations → Stabilizations).
          </p>
          <div className="p-3.5 rounded-xl bg-cream-50 border border-charcoal-900/10 text-xs font-mono text-softblue-700 font-bold">
            ✓ 100% Bitwise Event Log Identity across repeated scenario runs verified with DJB2 hashes.
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-4 pb-8 space-y-4">
          <button
            onClick={() => navigate('/simulator')}
            className="px-8 py-4 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-sm font-mono tracking-wider transition-all inline-flex items-center space-x-2.5 shadow-command cursor-pointer"
          >
            <span>LAUNCH MISSION CONTROL SIMULATOR</span>
            <ArrowRight className="w-4 h-4 text-cream-100" />
          </button>
        </div>
      </main>
    </div>
  );
};
