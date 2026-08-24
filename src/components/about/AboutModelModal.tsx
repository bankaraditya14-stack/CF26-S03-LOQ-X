import React from 'react';
import {
  X,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface AboutModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModelModal: React.FC<AboutModelModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="glass-panel-glow w-full max-w-2xl rounded-2xl p-6 border border-cyan-500/30 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-heading">
                About Simulation Architecture & Data Model
              </h3>
              <p className="text-xs text-slate-400">
                Problem S-03 • Deterministic Urban Infrastructure Cascade Simulator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Synthetic Disclaimer */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-cyan-300">
            <strong className="block font-bold text-xs uppercase tracking-wider mb-1 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 inline" />
              <span>Synthetic Infrastructure Simulation Model</span>
            </strong>
            This simulator operates strictly on a fictional synthetic urban model
            (<strong>JanNagar Resilience Grid</strong>). All dependency relationships,
            propagation delays, failure thresholds, and recovery rates are synthetic
            simulation parameters. <em>This software is NOT connected to live municipal SCADA or government APIs.</em>
          </div>

          {/* Node State Model */}
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider text-cyan-400">
              1. Deterministic Node State Model
            </h4>
            <p>Every urban service transitions through discrete deterministic states:</p>
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                HEALTHY
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-bold">
                AT_RISK
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                DEGRADED
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
                FAILED
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                RECOVERING
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                HEALTHY
              </span>
            </div>
          </div>

          {/* Metrics Definitions */}
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider text-cyan-400">
              2. Core Resilience Metrics
            </h4>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
              <li>
                <strong className="text-slate-100 font-mono">Cascade Depth:</strong> The length of the longest causal chain of failure propagation originating from initial root disruptions (Root = Depth 0).
              </li>
              <li>
                <strong className="text-slate-100 font-mono">Affected Services:</strong> Total count of downstream services that transitioned to a non-healthy state, strictly excluding the root failed nodes themselves.
              </li>
              <li>
                <strong className="text-slate-100 font-mono">Recovery Duration:</strong> Simulated minutes elapsed between operator mitigation initiation and complete system restoration.
              </li>
            </ul>
          </div>

          {/* Determinism & Replay */}
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider text-cyan-400">
              3. Strict Replay Determinism
            </h4>
            <p>
              The simulation engine is pure TypeScript with ZERO random number generators (<code className="font-mono text-cyan-400">Math.random()</code>) or wall-clock dependencies. All simultaneous events are processed in deterministic sorted priority batches.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 mt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono tracking-wider transition-all cursor-pointer"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};
