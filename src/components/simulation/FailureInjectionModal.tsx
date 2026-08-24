import React, { useState } from 'react';
import { X, AlertTriangle, CheckSquare, Square, Zap } from 'lucide-react';
import { ServiceNode, NodeRuntimeState } from '../../types';

interface FailureInjectionModalProps {
  isOpen: boolean;
  nodes: ServiceNode[];
  runtimeNodes: Record<string, NodeRuntimeState>;
  onClose: () => void;
  onInjectFailures: (nodeIds: string[]) => void;
}

export const FailureInjectionModal: React.FC<FailureInjectionModalProps> = ({
  isOpen,
  nodes,
  runtimeNodes,
  onClose,
  onInjectFailures,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleInject = () => {
    if (selectedIds.length === 0) return;
    onInjectFailures(selectedIds);
    setSelectedIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="glass-panel-glow w-full max-w-lg rounded-2xl p-6 border border-rose-500/30 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-heading">
                Inject Infrastructure Disruption
              </h3>
              <p className="text-xs text-slate-400">
                Select one or multiple simultaneous services to trigger cascade
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-select Node List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {nodes.map(node => {
            const isSelected = selectedIds.includes(node.id);
            const runtime = runtimeNodes[node.id];
            const isAlreadyFailed = runtime?.state === 'FAILED';

            return (
              <div
                key={node.id}
                onClick={() => !isAlreadyFailed && toggleSelect(node.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isAlreadyFailed
                    ? 'opacity-40 bg-slate-900/40 border-slate-800 cursor-not-allowed'
                    : isSelected
                    ? 'bg-rose-950/40 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-slate-400">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {node.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {node.zone} • {node.type}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                    isAlreadyFailed
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {runtime?.state || 'HEALTHY'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-800">
          <div className="text-xs font-mono text-slate-400">
            Selected:{' '}
            <span className="font-bold text-rose-400">
              {selectedIds.length}
            </span>{' '}
            services
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleInject}
              disabled={selectedIds.length === 0}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold font-mono tracking-wider transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>INJECT FAILURES</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
