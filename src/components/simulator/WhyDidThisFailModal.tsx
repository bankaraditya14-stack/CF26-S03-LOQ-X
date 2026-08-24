import React from 'react';
import {
  X,
  GitCommit,
  ArrowRight,
  ShieldAlert,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface CausalPathStep {
  id: string;
  name: string;
  state: string;
}

interface WhyDidThisFailModalProps {
  isOpen: boolean;
  onClose: () => void;
  causalInfo: {
    targetNodeId: string;
    targetNodeName: string;
    targetState: string;
    isRootFailure: boolean;
    directCauses: string[];
    paths: CausalPathStep[][];
    explanation: string;
  } | null;
}

export const WhyDidThisFailModal: React.FC<WhyDidThisFailModalProps> = ({
  isOpen,
  onClose,
  causalInfo,
}) => {
  if (!isOpen || !causalInfo) return null;

  const isHealthy = causalInfo.targetState === 'HEALTHY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in select-none font-mono">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-7 border border-charcoal-900/15 shadow-command-lg relative max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-charcoal-900/10">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isHealthy
                  ? 'bg-softblue-100 text-softblue-700 border-softblue-300'
                  : 'bg-dustybrown-100 text-dustybrown-400 border-dustybrown-300 animate-pulse'
              }`}
            >
              {isHealthy ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-charcoal-900 font-heading">
                  WHY DID THIS SERVICE FAIL?
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    causalInfo.targetState === 'FAILED'
                      ? 'bg-dustybrown-100 text-dustybrown-400 border-dustybrown-300'
                      : causalInfo.targetState === 'DEGRADED'
                      ? 'bg-cream-200 text-charcoal-800 border-cream-400'
                      : 'bg-softblue-100 text-softblue-700 border-softblue-300'
                  }`}
                >
                  {causalInfo.targetState}
                </span>
              </div>
              <p className="text-xs text-charcoal-500">
                Root-Cause Dependency Trace • {causalInfo.targetNodeName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-charcoal-500 hover:text-charcoal-900 hover:bg-cream-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Causal Explanation Box */}
        <div className="p-4 rounded-2xl bg-cream-50 border border-charcoal-900/10 space-y-2 text-xs">
          <div className="text-[10px] text-mutedpurple-600 font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>ROOT CAUSE EXPLANATION</span>
          </div>
          <p className="text-charcoal-900 text-sm font-sans leading-relaxed">
            "{causalInfo.explanation}"
          </p>
        </div>

        {/* Direct Causes Summary */}
        {!causalInfo.isRootFailure && causalInfo.directCauses.length > 0 && (
          <div className="space-y-2 text-xs">
            <div className="text-charcoal-500 uppercase font-bold text-[11px]">
              Direct Failed Dependencies ({causalInfo.directCauses.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {causalInfo.directCauses.map((cause, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-dustybrown-100 border border-dustybrown-300 text-dustybrown-400 font-bold text-xs"
                >
                  {cause}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Causal Chain Visualization */}
        <div className="space-y-3 text-xs">
          <div className="text-charcoal-700 font-bold uppercase text-[11px] flex items-center space-x-1.5">
            <GitCommit className="w-4 h-4 text-mutedpurple-600" />
            <span>CAUSAL DEPENDENCY CHAINS</span>
          </div>

          <div className="space-y-2">
            {causalInfo.paths.map((path, pIdx) => (
              <div
                key={pIdx}
                className="p-3.5 rounded-xl bg-cream-50 border border-charcoal-900/10 flex flex-wrap items-center gap-2"
              >
                {path.map((step, sIdx) => {
                  const isLast = sIdx === path.length - 1;
                  const isFirst = sIdx === 0;

                  return (
                    <React.Fragment key={step.id}>
                      <div
                        className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                          isFirst
                            ? 'bg-dustybrown-100 border-dustybrown-300 text-dustybrown-400 shadow-sm'
                            : isLast
                            ? 'bg-mutedpurple-100 border-mutedpurple-300 text-mutedpurple-700'
                            : 'bg-white border-charcoal-900/10 text-charcoal-700'
                        }`}
                      >
                        <span>{step.name}</span>
                        <span className="ml-1.5 text-[9px] font-mono text-charcoal-400">
                          [{step.state}]
                        </span>
                      </div>

                      {!isLast && (
                        <ArrowRight className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-charcoal-900/10 text-xs">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-900 font-bold transition-all cursor-pointer shadow-sm"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
