import React from 'react';
import {
  TrendingDown,
  AlertTriangle,
  Timer,
  Activity,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { SimulationMetrics } from '../../types';

interface MetricsDashboardProps {
  metrics: SimulationMetrics;
  totalServices: number;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics,
  totalServices,
}) => {
  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 px-6 py-3 select-none">
      {/* 1. Cascade Depth (Mandatory P0) */}
      <div className="glass-panel rounded-xl p-3 border-l-4 border-l-cyan-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
            Cascade Depth
          </span>
          <TrendingDown className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-cyan-300">
            {metrics.cascadeDepth}
          </span>
          <span className="text-xs text-slate-400 font-mono">hops</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-1">
          Max causal dependency length
        </div>
      </div>

      {/* 2. Affected Services (Mandatory P0) */}
      <div className="glass-panel rounded-xl p-3 border-l-4 border-l-rose-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
            Affected Services
          </span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-rose-400">
            {metrics.affectedServices}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            / {totalServices - 1} downstream
          </span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-1">
          Excludes initial root disruption
        </div>
      </div>

      {/* 3. Recovery Time (Mandatory P0) */}
      <div className="glass-panel rounded-xl p-3 border-l-4 border-l-sky-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
            Recovery Duration
          </span>
          <Timer className="w-4 h-4 text-sky-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-sky-300">
            {metrics.recoveryTime > 0 ? `${metrics.recoveryTime}` : '--'}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {metrics.recoveryTime > 0 ? 'min' : ''}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-1">
          Simulated mitigation window
        </div>
      </div>

      {/* 4. Active Disruptions Right Now */}
      <div className="glass-panel rounded-xl p-3 border-l-4 border-l-amber-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
            Active Failures
          </span>
          <Activity className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-amber-300">
            {metrics.activeFailures}
          </span>
          <span className="text-xs text-slate-400 font-mono">nodes</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-1">
          Currently degraded or failed
        </div>
      </div>

      {/* 5. Peak System Impact */}
      <div className="glass-panel rounded-xl p-3 border-l-4 border-l-red-600 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
            Peak Impact
          </span>
          <Flame className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-red-400">
            {metrics.peakImpact}
          </span>
          <span className="text-xs text-slate-400 font-mono">simultaneous</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-1">
          Maximum concurrent loss
        </div>
      </div>

      {/* 6. Critical Services at Risk */}
      <div className="glass-panel rounded-xl p-3 border-l-4 border-l-indigo-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
            High Criticality
          </span>
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-indigo-300">
            {metrics.criticalServicesAffected}
          </span>
          <span className="text-xs text-slate-400 font-mono">impacted</span>
        </div>
        <div className="text-[10px] text-slate-400 truncate mt-1">
          Healthcare, 112, Municipal
        </div>
      </div>
    </div>
  );
};
