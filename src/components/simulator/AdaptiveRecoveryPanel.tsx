import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Play,
  CheckCircle2,
  Cpu,
  ArrowRight,
  RefreshCw,
  Info,
  Award,
  GitBranch,
} from 'lucide-react';
import {
  AiSimulationContext,
  AiRecoveryAnalysis,
  ValidatedStrategyResult,
} from '../../types/adaptiveRecovery';
import { AdaptiveRecoveryService } from '../../services/adaptiveRecoveryService';

interface AdaptiveRecoveryPanelProps {
  context: AiSimulationContext;
  onDeployStrategy: (strategy: ValidatedStrategyResult) => void;
  isDeployed: boolean;
  disabled?: boolean;
}

export const AdaptiveRecoveryPanel: React.FC<AdaptiveRecoveryPanelProps> = ({
  context,
  onDeployStrategy,
  isDeployed,
  disabled,
}) => {
  const [analysis, setAnalysis] = useState<AiRecoveryAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COMPARISON' | 'EXPLAINABILITY'>('OVERVIEW');

  // Trigger analysis when simulation state changes or on mount
  useEffect(() => {
    let isCancelled = false;
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const result = await AdaptiveRecoveryService.analyzeAndValidate(context);
        if (!isCancelled) {
          setAnalysis(result);
          if (result.bestStrategy) {
            setSelectedStrategyId(result.bestStrategy.id);
          }
        }
      } catch (err) {
        console.error('[AdaptiveRecoveryPanel] Error:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchAnalysis();
    return () => {
      isCancelled = true;
    };
  }, [context.simulationHash]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await AdaptiveRecoveryService.analyzeAndValidate(context);
      setAnalysis(result);
      if (result.bestStrategy) {
        setSelectedStrategyId(result.bestStrategy.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const activeStrategy =
    analysis?.validatedResults.find((s) => s.id === selectedStrategyId) ||
    analysis?.bestStrategy ||
    analysis?.validatedResults[0];

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM':
        return 'bg-cream-200 text-charcoal-800 border-cream-400';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-charcoal-900/15 shadow-command-lg space-y-5 font-mono select-none">
      {/* 1. Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-charcoal-900/10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-charcoal-900 text-cream-100 shadow-command flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cream-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-extrabold text-charcoal-900 uppercase tracking-wider font-heading">
                ADAPTIVE RECOVERY INTELLIGENCE
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-mutedpurple-100 text-mutedpurple-700 border border-mutedpurple-300 flex items-center space-x-1">
                <Cpu className="w-3 h-3" />
                <span>✦ GEMINI AI</span>
              </span>
            </div>
            <p className="text-[11px] text-charcoal-500 font-sans mt-0.5">
              "Gemini proposes. Cascade City verifies with deterministic simulation."
            </p>
          </div>
        </div>

        {/* View Switcher Tabs & Re-Analyze Button */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-cream-100 rounded-xl p-1 border border-charcoal-900/10 text-xs">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'bg-charcoal-900 text-cream-100 shadow-sm'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              AI PROPOSALS
            </button>
            <button
              onClick={() => setActiveTab('COMPARISON')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'COMPARISON'
                  ? 'bg-charcoal-900 text-cream-100 shadow-sm'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              WHAT-IF MATRIX
            </button>
            <button
              onClick={() => setActiveTab('EXPLAINABILITY')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'EXPLAINABILITY'
                  ? 'bg-charcoal-900 text-cream-100 shadow-sm'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              EXPLAINABILITY
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-charcoal-900/10 text-charcoal-700 transition-all cursor-pointer"
            title="Re-run AI Recovery Analysis"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Fallback Banner if Offline */}
      {analysis?.source === 'DETERMINISTIC_FALLBACK' && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center space-x-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Deterministic Analysis Mode:</strong> Operating with verified mathematical recovery models while Gemini cloud connectivity stands by.
          </span>
        </div>
      )}

      {/* 2. Real-Time Incident Context Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-2xl bg-cream-50 border border-charcoal-900/10">
          <span className="text-[10px] text-charcoal-500 font-bold uppercase tracking-wider block">
            ROOT CAUSE
          </span>
          <span className="font-extrabold text-charcoal-900 truncate block mt-0.5">
            {context.rootFailureNodeName}
          </span>
          <span className="text-[9px] text-charcoal-400">{context.rootSector} • {context.failureType}</span>
        </div>

        <div className="p-3 rounded-2xl bg-cream-50 border border-charcoal-900/10">
          <span className="text-[10px] text-charcoal-500 font-bold uppercase tracking-wider block">
            CASCADE DEPTH
          </span>
          <span className="font-extrabold text-charcoal-900 text-base block mt-0.5">
            {context.cascadeDepth} HOPS
          </span>
          <span className="text-[9px] text-charcoal-400">{context.affectedServicesCount} services affected</span>
        </div>

        <div className="p-3 rounded-2xl bg-cream-50 border border-charcoal-900/10">
          <span className="text-[10px] text-charcoal-500 font-bold uppercase tracking-wider block">
            POPULATION AT RISK
          </span>
          <span className="font-extrabold text-red-700 text-base block mt-0.5">
            {context.populationAffected.toLocaleString()}
          </span>
          <span className="text-[9px] text-charcoal-400">Baseline without recovery</span>
        </div>

        <div className="p-3 rounded-2xl bg-cream-50 border border-charcoal-900/10">
          <span className="text-[10px] text-charcoal-500 font-bold uppercase tracking-wider block">
            AI CONFIDENCE
          </span>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-extrabold text-emerald-700">{analysis?.confidence || 'HIGH'}</span>
          </div>
          <span className="text-[9px] text-charcoal-400">Deterministic verification 100%</span>
        </div>
      </div>

      {/* 3. Main Content Views */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-charcoal-900 border-t-transparent animate-spin"></div>
          <span className="text-xs font-bold text-charcoal-700">
            Gemini is analyzing causal topology and validating with Cascade Engine...
          </span>
        </div>
      ) : activeTab === 'OVERVIEW' ? (
        /* TAB 1: AI PROPOSALS & INTERVENTIONS */
        <div className="space-y-4">
          {/* Incident Summary */}
          {analysis?.incidentSummary && (
            <div className="p-3.5 rounded-2xl bg-cream-50 border border-charcoal-900/10 text-xs font-sans">
              <span className="text-[10px] font-mono font-bold text-charcoal-500 uppercase tracking-wider block mb-1">
                AI INCIDENT ASSESSMENT
              </span>
              <p className="text-charcoal-900 leading-relaxed font-medium">
                "{analysis.incidentSummary}"
              </p>
            </div>
          )}

          {/* Strategies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {analysis?.validatedResults
              .filter((s) => !s.isBaseline)
              .map((strat) => {
                const isSelected = selectedStrategyId === strat.id;
                const isTopRanked = strat.rank === 1;

                return (
                  <div
                    key={strat.id}
                    onClick={() => setSelectedStrategyId(strat.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-charcoal-900 bg-cream-50 shadow-command ring-2 ring-charcoal-900'
                        : 'border-charcoal-900/15 bg-white hover:bg-cream-50/50 hover:border-charcoal-900/40 shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getPriorityBadge(
                            strat.priority
                          )}`}
                        >
                          {strat.priority}
                        </span>

                        {isTopRanked && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                            <Award className="w-3 h-3" />
                            <span>RANK #1 OPTIMAL</span>
                          </span>
                        )}
                      </div>

                      {/* Strategy Title */}
                      <h3 className="text-xs font-extrabold text-charcoal-900 uppercase font-heading leading-snug">
                        {strat.name}
                      </h3>

                      {/* AI Rationale */}
                      <p className="text-[11px] text-charcoal-600 font-sans mt-2 line-clamp-3 leading-relaxed">
                        {strat.reason}
                      </p>
                    </div>

                    {/* Engine Verified Impact Metrics */}
                    <div className="pt-2.5 border-t border-charcoal-900/10 space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between text-charcoal-500 font-bold">
                        <span>ENGINE VERIFIED IMPACT:</span>
                        <strong className="text-emerald-700 text-xs">
                          +{strat.baselineComparison.impactReductionPct}% REDUCTION
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-charcoal-600">
                        <span>Citizens Protected:</span>
                        <strong className="text-charcoal-900">
                          {strat.baselineComparison.populationSaved.toLocaleString()}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-charcoal-600">
                        <span>Recovery Time:</span>
                        <strong className="text-charcoal-900">
                          {strat.metrics.recoveryTimeMin} min (Saved {strat.baselineComparison.recoveryTimeSavedMin} min)
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Action Bar */}
          {activeStrategy && (
            <div className="p-4 rounded-2xl bg-cream-100 border border-charcoal-900/15 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-charcoal-900 text-cream-100">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-charcoal-500 font-bold uppercase block">
                    SELECTED INTERVENTION:
                  </span>
                  <span className="text-xs font-extrabold text-charcoal-900 uppercase">
                    {activeStrategy.name} ({activeStrategy.baselineComparison.impactReductionPct}% Impact Reduction)
                  </span>
                </div>
              </div>

              <button
                onClick={() => onDeployStrategy(activeStrategy)}
                disabled={disabled}
                className="px-5 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-xs tracking-wider transition-all flex items-center space-x-2 shadow-command cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-cream-100" />
                <span>{isDeployed ? 'RE-DEPLOY AI STRATEGY' : 'DEPLOY VERIFIED RECOVERY'}</span>
              </button>
            </div>
          )}
        </div>
      ) : activeTab === 'COMPARISON' ? (
        /* TAB 2: WHAT-IF SIMULATION COMPARISON MATRIX */
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-charcoal-900/15 shadow-sm">
            <table className="w-full text-left text-xs border-collapse bg-white">
              <thead>
                <tr className="bg-cream-100 text-charcoal-900 font-bold border-b border-charcoal-900/15 text-[11px] uppercase tracking-wider">
                  <th className="p-3.5">Rank</th>
                  <th className="p-3.5">Recovery Strategy</th>
                  <th className="p-3.5">Population Impact</th>
                  <th className="p-3.5">Cascade Depth</th>
                  <th className="p-3.5">Recovery Time</th>
                  <th className="p-3.5">Services Impact</th>
                  <th className="p-3.5">Verified Reduction</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-900/10">
                {analysis?.validatedResults.map((s) => (
                  <tr
                    key={s.id}
                    className={`transition-colors ${
                      s.isBaseline
                        ? 'bg-red-50/50'
                        : selectedStrategyId === s.id
                        ? 'bg-cream-50 font-bold'
                        : 'hover:bg-cream-50/40'
                    }`}
                  >
                    <td className="p-3.5">
                      {s.isBaseline ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                          BASELINE
                        </span>
                      ) : (
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                            s.rank === 1
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-cream-200 text-charcoal-700'
                          }`}
                        >
                          #{s.rank}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="font-extrabold text-charcoal-900 uppercase">{s.name}</div>
                      <div className="text-[10px] text-charcoal-500 font-sans font-normal truncate max-w-xs">
                        {s.reason}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <strong className={s.isBaseline ? 'text-red-700' : 'text-charcoal-900'}>
                        {s.metrics.populationAffected.toLocaleString()}
                      </strong>
                      {!s.isBaseline && (
                        <span className="text-[10px] text-emerald-700 block">
                          (-{s.baselineComparison.populationSaved.toLocaleString()})
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <strong>{s.metrics.cascadeDepth} hops</strong>
                      {!s.isBaseline && s.baselineComparison.cascadeHopsReduced > 0 && (
                        <span className="text-[10px] text-emerald-700 block">
                          (-{s.baselineComparison.cascadeHopsReduced} hops)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <strong>{s.metrics.recoveryTimeMin} min</strong>
                      {!s.isBaseline && s.baselineComparison.recoveryTimeSavedMin > 0 && (
                        <span className="text-[10px] text-emerald-700 block">
                          (-{s.baselineComparison.recoveryTimeSavedMin} min)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <strong>{s.metrics.servicesAffectedPct}%</strong>
                    </td>
                    <td className="p-3.5">
                      {s.isBaseline ? (
                        <span className="text-charcoal-400 font-normal">0% (Unmitigated)</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300">
                          +{s.baselineComparison.impactReductionPct}%
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {!s.isBaseline && (
                        <button
                          onClick={() => {
                            setSelectedStrategyId(s.id);
                            onDeployStrategy(s);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 text-[10px] font-bold tracking-wider cursor-pointer"
                        >
                          DEPLOY
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 3: EXPLAINABILITY & CAUSAL CHAIN TRACE */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cream-50 border border-charcoal-900/10 space-y-3">
            <div className="text-xs font-bold text-charcoal-900 uppercase flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-charcoal-900" />
              <span>AI Causal Chain Explanation</span>
            </div>
            <p className="text-xs text-charcoal-700 font-sans leading-relaxed">
              {analysis?.explanation || 'Root cause mitigation terminates active cascade loops and preserves vital downstream public utility lifelines.'}
            </p>
          </div>

          {/* Step-by-Step Causal Trace */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center text-xs">
            <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900">
              <span className="text-[9px] font-bold text-red-700 uppercase block">1. ROOT CAUSE</span>
              <strong className="text-xs block mt-0.5">{context.rootFailureNodeName}</strong>
              <span className="text-[10px] text-red-800">{context.rootSector} Failure</span>
            </div>

            <div className="hidden md:flex justify-center text-charcoal-400">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="p-3 rounded-xl bg-amber-100 border border-amber-300 text-amber-900">
              <span className="text-[9px] font-bold text-amber-800 uppercase block">2. PROPAGATION</span>
              <strong className="text-xs block mt-0.5">{context.cascadeDepth} Cascade Hops</strong>
              <span className="text-[10px] text-amber-800">{context.affectedServicesCount} Services Affected</span>
            </div>

            <div className="hidden md:flex justify-center text-charcoal-400">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900">
              <span className="text-[9px] font-bold text-emerald-800 uppercase block">3. VERIFIED OUTCOME</span>
              <strong className="text-xs block mt-0.5">+{activeStrategy?.baselineComparison.impactReductionPct || 50}% Shield</strong>
              <span className="text-[10px] text-emerald-800">{activeStrategy?.baselineComparison.populationSaved.toLocaleString()} Citizens Safe</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
