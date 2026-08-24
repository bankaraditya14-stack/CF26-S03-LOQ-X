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
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            LOW
          </span>
        );
      case 'ELEVATED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
            ELEVATED
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
            CRITICAL
          </span>
        );
      case 'CONTAINED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            CONTAINED
          </span>
        );
    }
  };

  const isHealthy = telemetry.systemHealth >= 80;
  const isDegraded = telemetry.systemHealth >= 40 && telemetry.systemHealth < 80;
  const isCritical = telemetry.systemHealth < 40;

  const healthColor = isHealthy
    ? 'text-emerald-700'
    : isDegraded
    ? 'text-amber-700'
    : 'text-red-700';

  const healthBarFill = isHealthy
    ? 'bg-emerald-500'
    : isDegraded
    ? 'bg-amber-500'
    : 'bg-red-600';

  return (
    <div className="bg-white rounded-2xl p-5 border border-charcoal-900/15 shadow-command flex flex-col justify-between space-y-4 select-none">
      {/* Panel Header */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-charcoal-900/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cream-200 text-charcoal-900">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold font-mono text-charcoal-900 uppercase tracking-wider">
                LIVE SYSTEM TELEMETRY
              </h2>
              <span className="text-[10px] text-charcoal-500 font-mono">Real-Time Resilience Metrics</span>
            </div>
          </div>

          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-cream-100 border border-charcoal-900/10 text-[10px] font-mono text-charcoal-900 font-bold">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isCritical ? 'bg-red-600' : isDegraded ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            ></span>
            <span>ACTIVE</span>
          </span>
        </div>

        {/* Telemetry Grid */}
        <div className="space-y-3 font-mono">
          {/* 1. System Health */}
          <div className="p-3.5 rounded-xl bg-cream-50 border border-charcoal-900/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-charcoal-500 font-bold">
              <span className="uppercase tracking-wider">SYSTEM HEALTH INDEX</span>
              <HeartPulse className={`w-3.5 h-3.5 ${healthColor}`} />
            </div>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-extrabold ${healthColor}`}>
                {telemetry.systemHealth}%
              </span>
              <span className="text-[10px] text-charcoal-500">
                {isHealthy ? 'Nominal: Safe' : isDegraded ? 'Degraded: Warning' : 'Critical: At Risk'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-cream-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${healthBarFill}`}
                style={{ width: `${telemetry.systemHealth}%` }}
              ></div>
            </div>
          </div>

          {/* 2. Active Nodes vs Affected Nodes */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-cream-50 border border-charcoal-900/10">
              <div className="text-[10px] text-charcoal-500 font-bold uppercase tracking-wider">ACTIVE NODES</div>
              <div className="text-lg font-extrabold text-emerald-700 mt-1">
                {telemetry.activeNodes} / {totalNodes}
              </div>
              <div className="text-[9px] text-charcoal-400 mt-0.5">Operational</div>
            </div>

            <div className="p-3 rounded-xl bg-cream-50 border border-charcoal-900/10">
              <div className="text-[10px] text-charcoal-500 font-bold uppercase tracking-wider">AFFECTED NODES</div>
              <div
                className={`text-lg font-extrabold mt-1 ${
                  telemetry.affectedNodes === 0
                    ? 'text-emerald-700'
                    : telemetry.affectedNodes <= 2
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {telemetry.affectedNodes}
              </div>
              <div className="text-[9px] text-charcoal-400 mt-0.5">Degraded / down</div>
            </div>
          </div>

          {/* 3. Population At Risk */}
          <div className="p-3 rounded-xl bg-cream-50 border border-charcoal-900/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-charcoal-500 font-bold uppercase tracking-wider">
                POPULATION AT RISK
              </div>
              <div
                className={`text-lg font-extrabold mt-0.5 ${
                  telemetry.populationAtRisk > 0 ? 'text-red-700' : 'text-charcoal-900'
                }`}
              >
                {telemetry.populationAtRisk > 0
                  ? telemetry.populationAtRisk.toLocaleString()
                  : '0'}
              </div>
            </div>
            <div
              className={`p-2 rounded-lg ${
                telemetry.populationAtRisk > 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-cream-200 text-charcoal-800'
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
          </div>

          {/* 4. Cascade Risk & Est Recovery */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-cream-50 border border-charcoal-900/10">
              <div className="text-[10px] text-charcoal-500 font-bold uppercase tracking-wider">CASCADE RISK</div>
              <div className="mt-1.5">{getRiskBadge(telemetry.cascadeRisk)}</div>
            </div>

            <div className="p-3 rounded-xl bg-cream-50 border border-charcoal-900/10">
              <div className="text-[10px] text-charcoal-500 font-bold uppercase tracking-wider">EST. RECOVERY</div>
              <div className="text-sm font-extrabold text-charcoal-900 mt-1 flex items-center space-x-1">
                <Timer className="w-3.5 h-3.5 text-charcoal-500" />
                <span>{telemetry.estRecoveryMin ? `${telemetry.estRecoveryMin} min` : '— min'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Metric Footer */}
      <div className="pt-3 border-t border-charcoal-900/10 flex items-center justify-between text-[10px] font-mono text-charcoal-500 font-bold">
        <span>CASCADE DEPTH: <strong className="text-charcoal-900">{telemetry.cascadeDepth} HOPS</strong></span>
        <span>SERVICES PROTECTED: <strong className="text-emerald-700">{telemetry.servicesProtectedPct}%</strong></span>
      </div>
    </div>
  );
};
