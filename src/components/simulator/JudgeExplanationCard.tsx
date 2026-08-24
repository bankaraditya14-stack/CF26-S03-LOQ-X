import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu } from 'lucide-react';

export const JudgeExplanationCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="w-full rounded-2xl bg-white border border-charcoal-900/15 shadow-command overflow-hidden font-mono select-none">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3.5 px-5 flex items-center justify-between text-left hover:bg-cream-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-mutedpurple-100 text-mutedpurple-700">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-charcoal-900 uppercase tracking-wide">
              HOW DOES THE SIMULATOR DECIDE WHAT FAILS?
            </span>
            <span className="block text-[10px] text-charcoal-500 font-normal">
              Engine Mechanics & Dependency Graph Propagation Rules
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-charcoal-900 font-bold">
          <span className="text-[11px]">{isExpanded ? 'COLLAPSE' : 'EXPLAIN'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-5 pt-3 border-t border-charcoal-900/10 bg-cream-50 space-y-4 text-xs animate-in fade-in">
          {/* Key Message Callout */}
          <div className="p-3.5 rounded-xl bg-white border border-charcoal-900/10 text-charcoal-900 font-sans text-xs leading-relaxed shadow-sm">
            <strong className="text-charcoal-900">Key Architecture Guarantee:</strong> "We don't pre-script every possible failure. The scenario only defines the initial disruption. The dependency graph and deterministic simulation engine calculate the entire downstream cascade."
          </div>

          {/* 7 Step Pipeline */}
          <div className="space-y-2">
            <div className="text-[10px] text-charcoal-500 uppercase font-bold tracking-wider">
              7-Step Simulation Engine Pipeline:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-white border border-charcoal-900/10 flex items-start space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-cream-200 text-charcoal-900 font-bold text-[10px]">
                  01
                </span>
                <span className="text-charcoal-700">
                  <strong className="text-charcoal-900">Disruption Definition:</strong> Operator injects root disruption(s) at T+00.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-charcoal-900/10 flex items-start space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-cream-200 text-charcoal-900 font-bold text-[10px]">
                  02
                </span>
                <span className="text-charcoal-700">
                  <strong className="text-charcoal-900">Graph Structure:</strong> Graph contains 13 services & 22 typed dependencies.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-charcoal-900/10 flex items-start space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-cream-200 text-charcoal-900 font-bold text-[10px]">
                  03
                </span>
                <span className="text-charcoal-700">
                  <strong className="text-charcoal-900">State Evaluation:</strong> DependencyResolver inspects upstreams & mitigation states.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-charcoal-900/10 flex items-start space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-cream-200 text-charcoal-900 font-bold text-[10px]">
                  04
                </span>
                <span className="text-charcoal-700">
                  <strong className="text-charcoal-900">Failure Propagation:</strong> Calculates propagation delays and queues future events.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-charcoal-900/10 flex items-start space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-cream-200 text-charcoal-900 font-bold text-[10px]">
                  05
                </span>
                <span className="text-charcoal-700">
                  <strong className="text-charcoal-900">Event Queue:</strong> Priority discrete event queue advances simulated clock.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-charcoal-900/10 flex items-start space-x-2">
                <span className="px-1.5 py-0.5 rounded bg-cream-200 text-charcoal-900 font-bold text-[10px]">
                  06
                </span>
                <span className="text-charcoal-700">
                  <strong className="text-charcoal-900">Service Transitions:</strong> Updates runtime nodes (Healthy → Degraded → Failed).
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-charcoal-900/10 flex items-start space-x-2 sm:col-span-2">
                <span className="px-1.5 py-0.5 rounded bg-cream-200 text-charcoal-900 font-bold text-[10px]">
                  07
                </span>
                <span className="text-charcoal-700">
                  <strong className="text-charcoal-900">Deterministic Metrics:</strong> Calculates cascade depth, stabilization time & verification hash.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
