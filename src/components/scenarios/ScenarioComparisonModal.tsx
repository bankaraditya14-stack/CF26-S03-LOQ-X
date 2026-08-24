import React from 'react';
import { X, BarChart2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ScenarioComparisonResult } from '../../hooks/useSimulation';

interface ScenarioComparisonModalProps {
  isOpen: boolean;
  comparisonData: ScenarioComparisonResult | null;
  onClose: () => void;
}

export const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  isOpen,
  comparisonData,
  onClose,
}) => {
  if (!isOpen || !comparisonData) return null;

  const { scenarioName, withoutRecovery, withRecovery } = comparisonData;

  const depthDelta = withoutRecovery.metrics.cascadeDepth - withRecovery.metrics.cascadeDepth;
  const affectedDelta = withoutRecovery.metrics.affectedServices - withRecovery.metrics.affectedServices;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in select-none font-mono">
      <div className="bg-white w-full max-w-3xl rounded-3xl p-6 sm:p-7 border border-charcoal-900/15 shadow-command-lg relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-charcoal-900/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-mutedpurple-100 text-mutedpurple-700">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-charcoal-500 font-bold">
                SIMULATION RESULTS & INTERVENTION ANALYSIS
              </div>
              <h3 className="text-base font-bold text-charcoal-900 font-heading">
                Scenario Comparison — {scenarioName}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-charcoal-500 hover:text-charcoal-900 hover:bg-cream-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Summary Callout */}
        <div className="mb-5 p-4 rounded-2xl bg-cream-50 border border-charcoal-900/10 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-6 h-6 text-softblue-700 shrink-0" />
            <div>
              <div className="text-xs font-bold text-charcoal-900">
                Intervention Mitigated Downstream Propagation
              </div>
              <div className="text-[11px] text-charcoal-600 font-sans mt-0.5">
                Recovery intervention reduced affected services by{' '}
                <strong className="text-softblue-700 font-mono font-bold">
                  {Math.max(0, affectedDelta)}
                </strong>{' '}
                and curtailed cascade depth by{' '}
                <strong className="text-charcoal-900 font-mono font-bold">
                  {Math.max(0, depthDelta)} hops
                </strong>
                .
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Matrix */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Column 1: WITHOUT RECOVERY */}
          <div className="rounded-2xl border border-dustybrown-300 bg-cream-50 p-4 flex flex-col justify-between space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-dustybrown-200">
              <AlertTriangle className="w-4 h-4 text-dustybrown-400" />
              <h4 className="text-xs font-bold tracking-wider uppercase text-dustybrown-400">
                WITHOUT RECOVERY
              </h4>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-charcoal-900/10 shadow-sm">
                <span className="text-xs text-charcoal-500 font-bold">Cascade Depth:</span>
                <span className="text-base font-bold text-dustybrown-400">
                  {withoutRecovery.metrics.cascadeDepth} hops
                </span>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-charcoal-900/10 shadow-sm">
                <span className="text-xs text-charcoal-500 font-bold">Affected Services:</span>
                <span className="text-base font-bold text-dustybrown-400">
                  {withoutRecovery.metrics.affectedServices}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-charcoal-900/10 shadow-sm">
                <span className="text-xs text-charcoal-500 font-bold">Recovery Duration:</span>
                <span className="text-xs font-bold text-charcoal-400">
                  -- (Unmitigated)
                </span>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-charcoal-900/10 shadow-sm">
                <span className="text-xs text-charcoal-500 font-bold">Peak Impact:</span>
                <span className="text-sm font-bold text-dustybrown-400">
                  {withoutRecovery.metrics.peakImpact} nodes
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: WITH RECOVERY */}
          <div className="rounded-2xl border border-softblue-300 bg-cream-50 p-4 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 pb-2 border-b border-softblue-200">
              <CheckCircle2 className="w-4 h-4 text-softblue-700" />
              <h4 className="text-xs font-bold tracking-wider uppercase text-softblue-700">
                WITH RECOVERY (MITIGATED)
              </h4>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-charcoal-900/10 shadow-sm">
                <span className="text-xs text-charcoal-500 font-bold">Cascade Depth:</span>
                <span className="text-base font-bold text-softblue-700 flex items-center space-x-1">
                  <span>{withRecovery.metrics.cascadeDepth} hops</span>
                  {depthDelta > 0 && (
                    <span className="text-xs text-softblue-700">
                      (-{depthDelta})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-charcoal-900/10 shadow-sm">
                <span className="text-xs text-charcoal-500 font-bold">Affected Services:</span>
                <span className="text-base font-bold text-softblue-700 flex items-center space-x-1">
                  <span>{withRecovery.metrics.affectedServices}</span>
                  {affectedDelta > 0 && (
                    <span className="text-xs text-softblue-700">
                      (-{affectedDelta})
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-charcoal-900/10 shadow-sm">
                <span className="text-xs text-charcoal-500 font-bold">Recovery Duration:</span>
                <span className="text-sm font-bold text-charcoal-900">
                  {withRecovery.metrics.recoveryTime} min
                </span>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-charcoal-900/10 shadow-sm">
                <span className="text-xs text-charcoal-500 font-bold">Peak Impact:</span>
                <span className="text-sm font-bold text-softblue-700">
                  {withRecovery.metrics.peakImpact} nodes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-charcoal-900/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 text-xs font-bold transition-all cursor-pointer shadow-command"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
