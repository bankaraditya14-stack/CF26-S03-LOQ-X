import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { InterventionType, InterventionOption } from './types';

interface InterventionPanelProps {
  onSelectIntervention: (intervention: InterventionType) => void;
  selectedIntervention: InterventionType | null;
  isDeployed: boolean;
  disabled?: boolean;
}

const INTERVENTIONS: InterventionOption[] = [
  {
    id: 'generator',
    title: 'DEPLOY BACKUP GENERATOR',
    tagline: 'Emergency Auxiliary Power',
    description: 'Restore critical power to healthcare infrastructure and raw water pumping turbines.',
    projectedStats: {
      populationAffected: { before: '42,500', after: '15,800' },
      servicesAffected: { before: '68%', after: '24%' },
      recoveryTime: { before: '37 min', after: '18 min' },
      cascadeDepth: { before: '5 nodes', after: '2 nodes' },
      risk: { before: 'CRITICAL', after: 'MODERATE' },
      improvementPct: 64,
    },
  },
  {
    id: 'reroute',
    title: 'REROUTE POWER',
    tagline: 'Grid Grid-Switching & Bus Transfer',
    description: 'Redirect available electrical capacity from North-East Substation through Sector B bypass.',
    projectedStats: {
      populationAffected: { before: '42,500', after: '18,200' },
      servicesAffected: { before: '68%', after: '29%' },
      recoveryTime: { before: '37 min', after: '21 min' },
      cascadeDepth: { before: '5 nodes', after: '2 nodes' },
      risk: { before: 'CRITICAL', after: 'MODERATE' },
      improvementPct: 58,
    },
  },
  {
    id: 'hospital',
    title: 'PRIORITIZE HOSPITAL',
    tagline: 'Selective Islanding Protocol',
    description: 'Preserve Apex Hospital operations at the expense of lower-priority commercial and transit services.',
    projectedStats: {
      populationAffected: { before: '42,500', after: '21,000' },
      servicesAffected: { before: '68%', after: '35%' },
      recoveryTime: { before: '37 min', after: '24 min' },
      cascadeDepth: { before: '5 nodes', after: '3 nodes' },
      risk: { before: 'CRITICAL', after: 'ELEVATED' },
      improvementPct: 52,
    },
  },
  {
    id: 'none',
    title: 'NO INTERVENTION',
    tagline: 'Passive Observation',
    description: 'Allow the cascade to run unmitigated across all interconnected dependencies.',
    projectedStats: {
      populationAffected: { before: '42,500', after: '42,500' },
      servicesAffected: { before: '68%', after: '68%' },
      recoveryTime: { before: '37 min', after: '37 min' },
      cascadeDepth: { before: '5 nodes', after: '5 nodes' },
      risk: { before: 'CRITICAL', after: 'CRITICAL' },
      improvementPct: 0,
    },
  },
];

export const InterventionPanel: React.FC<InterventionPanelProps> = ({
  onSelectIntervention,
  selectedIntervention,
  isDeployed,
  disabled,
}) => {
  const [hoveredIntervention, setHoveredIntervention] = useState<InterventionType | null>(null);

  const activeOption =
    INTERVENTIONS.find((i) => i.id === (hoveredIntervention || selectedIntervention)) ||
    INTERVENTIONS[0];

  return (
    <div className="w-full glass-panel-glow rounded-2xl p-5 border border-cyan-500/40 select-none space-y-5 animate-in fade-in">
      {/* Top Banner Alert */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
              INTERVENTION REQUIRED
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Critical infrastructure degradation detected. Choose an operational response strategy.
            </p>
          </div>
        </div>

        {isDeployed && (
          <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold flex items-center space-x-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>INTERVENTION DEPLOYED</span>
          </span>
        )}
      </div>

      {/* Decision Buttons Grid + Live Impact Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: 4 Decision Action Buttons */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INTERVENTIONS.map((item) => {
            const isSelected = selectedIntervention === item.id;
            const isHovered = hoveredIntervention === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setHoveredIntervention(item.id)}
                onMouseLeave={() => setHoveredIntervention(null)}
                onClick={() => onSelectIntervention(item.id)}
                disabled={disabled || isDeployed}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
                    : isHovered
                    ? 'bg-slate-900 border-cyan-500/50 shadow-md'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wide">
                      {item.title}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-cyan-400 font-semibold">
                    {item.id === 'none' ? '0% Change' : `+${item.projectedStats.improvementPct}% Protected`}
                  </span>
                  <span className="text-slate-500 uppercase">Click to Deploy →</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Real-Time Decision Impact Preview */}
        <div className="lg:col-span-5 bg-slate-950/90 rounded-xl p-4 border border-cyan-500/30 space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase text-cyan-400 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4" />
              <span>PROJECTED IMPACT PREVIEW</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {activeOption.title}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Stat 1: Population Affected */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400">Population affected:</span>
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-rose-400">{activeOption.projectedStats.populationAffected.before}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-emerald-400">{activeOption.projectedStats.populationAffected.after}</span>
              </div>
            </div>

            {/* Stat 2: Services Affected */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400">Services affected:</span>
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-rose-400">{activeOption.projectedStats.servicesAffected.before}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-emerald-400">{activeOption.projectedStats.servicesAffected.after}</span>
              </div>
            </div>

            {/* Stat 3: Recovery Time */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400">Recovery time:</span>
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-rose-400">{activeOption.projectedStats.recoveryTime.before}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-emerald-400">{activeOption.projectedStats.recoveryTime.after}</span>
              </div>
            </div>

            {/* Stat 4: Cascade Depth */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400">Cascade depth:</span>
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-rose-400">{activeOption.projectedStats.cascadeDepth.before}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-emerald-400">{activeOption.projectedStats.cascadeDepth.after}</span>
              </div>
            </div>

            {/* Stat 5: Risk Level */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
              <span className="text-slate-400">Risk:</span>
              <div className="flex items-center space-x-1.5 font-bold text-[11px]">
                <span className="text-rose-400">{activeOption.projectedStats.risk.before}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-emerald-400">{activeOption.projectedStats.risk.after}</span>
              </div>
            </div>
          </div>

          {/* Improvement Highlight Banner */}
          <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-center text-xs font-bold text-cyan-300">
            {activeOption.id === 'none'
              ? 'NO INTERVENTION APPLIED'
              : `PROJECTED IMPROVEMENT: ${activeOption.projectedStats.improvementPct}%`}
          </div>
        </div>
      </div>
    </div>
  );
};
