import React from 'react';
import { Layers, PlayCircle, ShieldCheck } from 'lucide-react';
import { Scenario } from '../../types';
import { PREDEFINED_SCENARIOS } from '../../data/scenarios';

interface ScenarioSelectorProps {
  activeScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  activeScenario,
  onSelectScenario,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col select-none space-y-3">
      <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
        <Layers className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-bold text-slate-200 font-heading">
          Predefined Simulation Scenarios
        </h3>
      </div>

      <div className="space-y-2">
        {PREDEFINED_SCENARIOS.map(sc => {
          const isSelected = activeScenario.id === sc.id;

          return (
            <div
              key={sc.id}
              onClick={() => onSelectScenario(sc)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PlayCircle
                    className={`w-4 h-4 ${
                      isSelected ? 'text-cyan-400' : 'text-slate-500'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-cyan-200' : 'text-slate-200'
                    }`}
                  >
                    {sc.name}
                  </span>
                </div>

                {sc.recoveryActions.length > 0 && (
                  <span className="flex items-center space-x-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>MITIGATED</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                {sc.description}
              </p>

              <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                <span>
                  Initial Failures:{' '}
                  <strong className="text-slate-300">
                    {sc.initialFailures.length}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Recoveries:{' '}
                  <strong className="text-slate-300">
                    {sc.recoveryActions.length}
                  </strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
