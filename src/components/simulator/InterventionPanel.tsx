import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Play,
  Zap,
  ShieldCheck,
  HeartPulse,
  Sliders,
  Info,
  Clock,
  Users,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  InterventionRecommendation,
  InterventionStrategyCategory,
  InterventionPriority,
} from './types';

interface InterventionPanelProps {
  recommendations: InterventionRecommendation[];
  selectedInterventionId: string;
  onSelectIntervention: (id: string) => void;
  onDeployIntervention: () => void;
  isDeployed: boolean;
  disabled?: boolean;
  failureNodeName?: string;
  failureType?: string;
}

export const InterventionPanel: React.FC<InterventionPanelProps> = ({
  recommendations,
  selectedInterventionId,
  onSelectIntervention,
  onDeployIntervention,
  isDeployed,
  disabled,
  failureNodeName = 'Infrastructure Grid',
  failureType,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Active selected or hovered option
  const activeOption: InterventionRecommendation | undefined =
    recommendations.find((r) => r.id === (hoveredId || selectedInterventionId)) ||
    recommendations[0];

  if (!activeOption) {
    return null;
  }

  const getStrategyBadge = (cat: InterventionStrategyCategory) => {
    switch (cat) {
      case 'FASTEST':
        return {
          label: 'FASTEST RECOVERY',
          bg: 'bg-softblue-100 text-softblue-800 border-softblue-300',
          icon: Clock,
        };
      case 'MAX_PROTECTION':
        return {
          label: 'MAX POPULATION SHIELD',
          bg: 'bg-cream-200 text-charcoal-900 border-cream-400',
          icon: Users,
        };
      case 'CRITICAL_FIRST':
        return {
          label: 'CRITICAL INFRASTRUCTURE FIRST',
          bg: 'bg-mutedpurple-100 text-mutedpurple-800 border-mutedpurple-300',
          icon: HeartPulse,
        };
      case 'LOW_RESOURCE':
        return {
          label: 'LOW-RESOURCE PROTOCOL',
          bg: 'bg-cream-100 text-charcoal-700 border-charcoal-900/15',
          icon: Sliders,
        };
      case 'BASELINE':
      default:
        return {
          label: 'PASSIVE BASELINE',
          bg: 'bg-charcoal-100 text-charcoal-600 border-charcoal-900/15',
          icon: Info,
        };
    }
  };

  const getPriorityBadge = (p: InterventionPriority) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-dustybrown-100 text-dustybrown-400 border-dustybrown-300 font-bold';
      case 'HIGH':
        return 'bg-cream-300 text-charcoal-900 border-cream-500 font-bold';
      case 'MEDIUM':
        return 'bg-softblue-100 text-softblue-700 border-softblue-300';
      case 'LOW':
      default:
        return 'bg-cream-100 text-charcoal-500 border-charcoal-900/10';
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-5 sm:p-6 border border-charcoal-900/15 shadow-command-lg select-none space-y-5 animate-in fade-in font-sans">
      {/* Top Banner Alert */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-charcoal-900/10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-dustybrown-100 text-dustybrown-400 border border-dustybrown-300 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-mutedpurple-100 text-mutedpurple-700 border border-mutedpurple-300 uppercase tracking-wider">
                RECOMMENDED FOR THIS FAILURE
              </span>
              {failureType && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream-200 text-charcoal-700 border border-charcoal-900/10">
                  {failureType}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold font-heading text-charcoal-900 mt-0.5">
              Context-Aware Recovery Matrix • Incident at {failureNodeName}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isDeployed && (
            <span className="px-3.5 py-1.5 rounded-xl bg-softblue-100 border border-softblue-300 text-softblue-700 font-mono text-xs font-bold flex items-center space-x-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-softblue-700" />
              <span>INTERVENTION DEPLOYED & ACTIVE</span>
            </span>
          )}
        </div>
      </div>

      {/* Decision Buttons Grid + Live Impact Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Dynamic Strategy Action Cards (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-charcoal-500 pb-1">
            <span>AVAILABLE RECOVERY STRATEGIES ({recommendations.length})</span>
            <span className="text-[11px] text-mutedpurple-600 font-bold">
              Ranked by Multi-Criteria Impact Score
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.map((item) => {
              const isSelected = selectedInterventionId === item.id;
              const isHovered = hoveredId === item.id;
              const strategyMeta = getStrategyBadge(item.strategyCategory);
              const StrategyIcon = strategyMeta.icon;
              const isBaseline = item.strategyCategory === 'BASELINE';

              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectIntervention(item.id)}
                  disabled={disabled || isDeployed}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                    isSelected
                      ? 'bg-mutedpurple-50 border-mutedpurple-500 shadow-command ring-2 ring-mutedpurple-400'
                      : isHovered
                      ? 'bg-cream-100 border-charcoal-900/30 shadow-sm'
                      : 'bg-cream-50/70 border-charcoal-900/10 hover:border-charcoal-900/25'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <div className="space-y-2">
                    {/* Strategy Category & Score Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full border flex items-center space-x-1 ${strategyMeta.bg}`}
                      >
                        <StrategyIcon className="w-2.5 h-2.5 shrink-0" />
                        <span>{strategyMeta.label}</span>
                      </span>

                      {!isBaseline && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white border border-charcoal-900/10 text-charcoal-700 font-bold">
                          SCORE: {item.score}
                        </span>
                      )}
                    </div>

                    {/* Title & Selection Marker */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold font-mono text-charcoal-900 leading-tight">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-charcoal-500 font-mono block mt-0.5">
                          {item.tagline}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-mutedpurple-600 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <p className="text-[11px] text-charcoal-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Footer Meta: Addressed path & stats */}
                  <div className="pt-2.5 border-t border-charcoal-900/10 flex flex-col space-y-1.5 text-[10px] font-mono">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-1.5 py-0.5 rounded border text-[9px] ${getPriorityBadge(
                          item.priority
                        )}`}
                      >
                        PRIORITY: {item.priority}
                      </span>
                      <span className="text-charcoal-900 font-extrabold">
                        {isBaseline
                          ? '0% Protection'
                          : `+${item.projectedStats.improvementPct}% Shielded`}
                      </span>
                    </div>

                    <div className="text-[9px] text-charcoal-500 truncate" title={item.addressedCausalPath}>
                      <strong className="text-charcoal-700">Addresses:</strong> {item.addressedCausalPath}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Live Impact Preview & Explainability (5 cols) */}
        <div className="lg:col-span-5 bg-cream-50 rounded-2xl p-4 sm:p-5 border border-charcoal-900/15 space-y-3.5 font-mono shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-charcoal-900/10">
            <span className="text-xs font-bold uppercase text-charcoal-900 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-mutedpurple-600" />
              <span>PROJECTED IMPACT ANALYSIS</span>
            </span>
            <span className="text-[10px] text-charcoal-500 font-bold">
              Before → After
            </span>
          </div>

          {/* Metric Comparison Table */}
          <div className="space-y-2 text-xs">
            {/* Stat 1: Population Protected */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-charcoal-900/10 shadow-sm">
              <div className="flex items-center space-x-1.5 text-charcoal-600">
                <Users className="w-3.5 h-3.5 text-softblue-600" />
                <span>Population at risk:</span>
              </div>
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-dustybrown-400">
                  {activeOption.projectedStats.populationAffected.before}
                </span>
                <ArrowRight className="w-3 h-3 text-charcoal-400" />
                <span className="text-softblue-700">
                  {activeOption.projectedStats.populationAffected.after}
                </span>
              </div>
            </div>

            {/* Stat 2: Services Affected */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-charcoal-900/10 shadow-sm">
              <div className="flex items-center space-x-1.5 text-charcoal-600">
                <Layers className="w-3.5 h-3.5 text-mutedpurple-600" />
                <span>Services affected:</span>
              </div>
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-dustybrown-400">
                  {activeOption.projectedStats.servicesAffected.before}
                </span>
                <ArrowRight className="w-3 h-3 text-charcoal-400" />
                <span className="text-softblue-700">
                  {activeOption.projectedStats.servicesAffected.after}
                </span>
              </div>
            </div>

            {/* Stat 3: Recovery Time */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-charcoal-900/10 shadow-sm">
              <div className="flex items-center space-x-1.5 text-charcoal-600">
                <Clock className="w-3.5 h-3.5 text-charcoal-700" />
                <span>Est. recovery time:</span>
              </div>
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-dustybrown-400">
                  {activeOption.projectedStats.recoveryTime.before}
                </span>
                <ArrowRight className="w-3 h-3 text-charcoal-400" />
                <span className="text-softblue-700">
                  {activeOption.projectedStats.recoveryTime.after}
                </span>
              </div>
            </div>

            {/* Stat 4: Cascade Depth */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-charcoal-900/10 shadow-sm">
              <div className="flex items-center space-x-1.5 text-charcoal-600">
                <ShieldCheck className="w-3.5 h-3.5 text-softblue-600" />
                <span>Cascade depth:</span>
              </div>
              <div className="flex items-center space-x-1.5 font-bold">
                <span className="text-dustybrown-400">
                  {activeOption.projectedStats.cascadeDepth.before}
                </span>
                <ArrowRight className="w-3 h-3 text-charcoal-400" />
                <span className="text-softblue-700">
                  {activeOption.projectedStats.cascadeDepth.after}
                </span>
              </div>
            </div>
          </div>

          {/* Explainability Box: "WHY THIS ACTION?" */}
          <div className="p-3.5 rounded-xl bg-white border border-mutedpurple-300 text-xs space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-[10px] text-mutedpurple-700 font-bold uppercase tracking-wider">
              <span className="flex items-center space-x-1">
                <HelpCircle className="w-3.5 h-3.5 text-mutedpurple-600" />
                <span>WHY THIS RECOVERY ACTION?</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-mutedpurple-100 text-mutedpurple-800">
                RISK: {activeOption.risk}
              </span>
            </div>
            <p className="text-charcoal-800 text-[11px] font-sans leading-relaxed">
              {activeOption.rationale}
            </p>
          </div>

          {/* Improvement Summary Banner */}
          <div className="p-2.5 rounded-xl bg-charcoal-900 text-cream-100 text-center text-xs font-bold flex items-center justify-center space-x-2 shadow-command">
            <Zap className="w-3.5 h-3.5 text-softblue-300" />
            <span>
              TOTAL PROJECTED IMPROVEMENT: +{activeOption.projectedStats.improvementPct}%
            </span>
          </div>

          {/* Primary CTA to Deploy */}
          {!isDeployed ? (
            <button
              onClick={onDeployIntervention}
              disabled={disabled}
              className="w-full py-3.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-xs font-mono tracking-wider transition-all flex items-center justify-center space-x-2 shadow-command cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-cream-100" />
              <span>▶ DEPLOY STRATEGY: {activeOption.title}</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-softblue-50 border border-softblue-300 text-softblue-800 text-center text-xs font-mono font-bold flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-softblue-600" />
              <span>INTERVENTION DISPATCHED TO ENGINE</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
