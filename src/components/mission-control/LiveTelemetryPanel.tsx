import React from 'react';
import {
  Activity,
  HeartPulse,
  Users,
  Timer,
} from 'lucide-react';
import { TelemetryState } from './types';

interface LiveTelemetryPanelProps {
  telemetry: TelemetryState;
  totalNodes: number;
}

export const LiveTelemetryPanel: React.FC<LiveTelemetryPanelProps> = ({
  telemetry,
  totalNodes,
}) => {
  const getRiskBadge = (risk: TelemetryState['cascadeRisk']) => {
    switch (risk) {
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            LOW
          </span>
        );
      case 'ELEVATED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
            ELEVATED
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/25 text-rose-400 border border-rose-500/60 animate-pulse-red">
            CRITICAL
          </span>
        );
      case 'CONTAINED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            CONTAINED
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col justify-between space-y-4 select-none">
      {/* Panel Header */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider">
                LIVE SYSTEM TELEMETRY
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Real-Time Grid Status</span>
            </div>
          </div>

          <span className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ONLINE</span>
          </span>
        </div>

        {/* Telemetry Grid */}
        <div className="space-y-3 font-mono">
          {/* 1. System Health */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="uppercase tracking-wider">SYSTEM HEALTH</span>
              <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-100">{telemetry.systemHealth}%</span>
              <span className="text-[10px] text-slate-400">Nominal Target: 100%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  telemetry.systemHealth > 75
                    ? 'bg-emerald-500'
                    : telemetry.systemHealth > 40
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${telemetry.systemHealth}%` }}
              ></div>
            </div>
          </div>

          {/* 2. Active Nodes vs Affected Nodes */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">ACTIVE NODES</div>
              <div className="text-lg font-bold text-cyan-300 mt-1">
                {telemetry.activeNodes} / {totalNodes}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Operational assets</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">AFFECTED NODES</div>
              <div className="text-lg font-bold text-rose-400 mt-1">
                {telemetry.affectedNodes}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Degraded / down</div>
            </div>
          </div>

          {/* 3. Population At Risk */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                POPULATION AT RISK
              </div>
              <div className="text-lg font-bold text-amber-300 mt-0.5">
                {telemetry.populationAtRisk > 0
                  ? telemetry.populationAtRisk.toLocaleString()
                  : '0'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>

          {/* 4. Cascade Risk & Est Recovery */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">CASCADE RISK</div>
              <div className="mt-1.5">{getRiskBadge(telemetry.cascadeRisk)}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">EST. RECOVERY</div>
              <div className="text-sm font-bold text-sky-300 mt-1 flex items-center space-x-1">
                <Timer className="w-3.5 h-3.5 text-sky-400" />
                <span>{telemetry.estRecoveryMin ? `${telemetry.estRecoveryMin} min` : '— min'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Metric Footer */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>MAX CASCADE DEPTH: <strong className="text-cyan-300">{telemetry.cascadeDepth} HOPS</strong></span>
        <span>SERVICES PROTECTED: <strong className="text-emerald-400">{telemetry.servicesProtectedPct}%</strong></span>
      </div>
    </div>
  );
};
