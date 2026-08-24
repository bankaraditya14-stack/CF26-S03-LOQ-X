import React from 'react';
import {
  Zap,
  RotateCcw,
} from 'lucide-react';
import { FailureSeverity, FailureType, DigitalTwinNode } from './types';

interface FailureInjectionPanelProps {
  nodes: DigitalTwinNode[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  severity: FailureSeverity;
  onChangeSeverity: (severity: FailureSeverity) => void;
  failureType: FailureType;
  onChangeFailureType: (type: FailureType) => void;
  probability: number;
  onChangeProbability: (prob: number) => void;
  onInjectFailure: () => void;
  onReset: () => void;
  isSimulationRunning: boolean;
  hasInjected: boolean;
}

export const FailureInjectionPanel: React.FC<FailureInjectionPanelProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  severity,
  onChangeSeverity,
  failureType,
  onChangeFailureType,
  probability,
  onChangeProbability,
  onInjectFailure,
  onReset,
  isSimulationRunning,
  hasInjected,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-charcoal-900/15 shadow-command flex flex-col justify-between space-y-4 select-none">
      {/* Panel Header */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-charcoal-900/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-dustybrown-100 text-dustybrown-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold font-mono text-charcoal-900 uppercase tracking-wider">
                FAILURE INJECTION
              </h2>
              <span className="text-[10px] text-charcoal-500 font-mono">Disruption Parameters</span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cream-100 border border-charcoal-900/10 text-charcoal-900">
            P-01
          </span>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {/* 1. Select Target Infrastructure */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-charcoal-500 uppercase tracking-wider font-bold block">
              SELECT INFRASTRUCTURE
            </label>
            <select
              value={selectedNodeId}
              onChange={(e) => onSelectNode(e.target.value)}
              disabled={isSimulationRunning || hasInjected}
              className="w-full bg-cream-50 border border-charcoal-900/15 rounded-xl px-3 py-2 text-charcoal-900 font-mono text-xs focus:outline-none focus:border-charcoal-900 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Failure Severity */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-charcoal-500 uppercase tracking-wider font-bold block">
              FAILURE SEVERITY
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['LOW', 'MEDIUM', 'CRITICAL'] as FailureSeverity[]).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => onChangeSeverity(sev)}
                  disabled={isSimulationRunning || hasInjected}
                  className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    severity === sev
                      ? sev === 'CRITICAL'
                        ? 'bg-red-600 text-white shadow-command'
                        : sev === 'MEDIUM'
                        ? 'bg-amber-500 text-white shadow-command'
                        : 'bg-emerald-600 text-white shadow-command'
                      : 'bg-cream-100 text-charcoal-500 hover:bg-cream-200 border border-charcoal-900/10'
                  } disabled:opacity-50`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Failure Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-charcoal-500 uppercase tracking-wider font-bold block">
              FAILURE TYPE
            </label>
            <select
              value={failureType}
              onChange={(e) => onChangeFailureType(e.target.value as FailureType)}
              disabled={isSimulationRunning || hasInjected}
              className="w-full bg-cream-50 border border-charcoal-900/15 rounded-xl px-3 py-2 text-charcoal-900 font-mono text-xs focus:outline-none focus:border-charcoal-900 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <option value="Equipment Failure">Equipment Failure</option>
              <option value="Cyber Attack">Cyber Attack</option>
              <option value="Physical Disruption">Physical Disruption</option>
              <option value="Extreme Weather Event">Extreme Weather Event</option>
            </select>
          </div>

          {/* 4. Failure Probability */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-charcoal-500 uppercase tracking-wider font-bold block">
                FAILURE PROBABILITY
              </label>
              <span className="text-xs font-bold text-charcoal-900 bg-cream-100 px-2 py-0.5 rounded border border-charcoal-900/10">
                {probability}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={probability}
              onChange={(e) => onChangeProbability(Number(e.target.value))}
              disabled={isSimulationRunning || hasInjected}
              className="w-full h-1.5 bg-cream-300 rounded-lg appearance-none cursor-pointer accent-red-600 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2 border-t border-charcoal-900/10">
        <button
          onClick={onInjectFailure}
          disabled={hasInjected && !isSimulationRunning}
          className={`w-full py-3 rounded-xl font-bold font-mono text-xs tracking-wider transition-all flex items-center justify-center space-x-2 shadow-command cursor-pointer ${
            hasInjected
              ? 'bg-cream-200 text-charcoal-400 border border-charcoal-900/10 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>⚡ INJECT FAILURE</span>
        </button>

        <p className="text-[10px] text-charcoal-500 font-mono text-center leading-relaxed">
          "Simulation will propagate failure through connected infrastructure dependencies."
        </p>

        <button
          onClick={onReset}
          className="w-full py-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-900 font-mono text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-charcoal-500" />
          <span>RESET SIMULATION</span>
        </button>
      </div>
    </div>
  );
};
