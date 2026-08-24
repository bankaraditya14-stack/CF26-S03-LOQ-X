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
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col justify-between space-y-4 select-none">
      {/* Panel Header */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider">
                FAILURE INJECTION
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Disruption Parameters</span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-cyan-400">
            P-01
          </span>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {/* 1. Select Target Infrastructure */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
              SELECT INFRASTRUCTURE
            </label>
            <select
              value={selectedNodeId}
              onChange={(e) => onSelectNode(e.target.value)}
              disabled={isSimulationRunning || hasInjected}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} ({n.sector})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Failure Severity */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
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
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        : sev === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/60'
                      : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:bg-slate-800'
                  } disabled:opacity-50`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Failure Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
              FAILURE TYPE
            </label>
            <select
              value={failureType}
              onChange={(e) => onChangeFailureType(e.target.value as FailureType)}
              disabled={isSimulationRunning || hasInjected}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 cursor-pointer"
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
              <label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                FAILURE PROBABILITY
              </label>
              <span className="text-xs font-bold text-cyan-400">{probability}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="10"
              value={probability}
              onChange={(e) => onChangeProbability(Number(e.target.value))}
              disabled={isSimulationRunning || hasInjected}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800">
        <button
          onClick={onInjectFailure}
          disabled={hasInjected && !isSimulationRunning}
          className={`w-full py-3 rounded-xl font-bold font-mono text-xs tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer ${
            hasInjected
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>⚡ INJECT FAILURE</span>
        </button>

        <p className="text-[10px] text-slate-400 font-mono text-center leading-relaxed">
          "Simulation will propagate failure through connected infrastructure dependencies."
        </p>

        <button
          onClick={onReset}
          className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET SIMULATION</span>
        </button>
      </div>
    </div>
  );
};
