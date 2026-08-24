import React, { useState } from 'react';
import {
  X,
  Wrench,
  BatteryCharging,
  Radio,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  ServiceNode,
  NodeRuntimeState,
  RecoveryAction,
  RecoveryActionType,
} from '../../types';

interface RecoveryActionModalProps {
  isOpen: boolean;
  nodes: ServiceNode[];
  runtimeNodes: Record<string, NodeRuntimeState>;
  selectedNodeId: string | null;
  currentTime: number;
  onClose: () => void;
  onApplyRecovery: (action: RecoveryAction) => void;
}

const RECOVERY_TYPES: {
  type: RecoveryActionType;
  label: string;
  desc: string;
  icon: React.ElementType;
  duration: number;
}[] = [
  {
    type: 'BACKUP_POWER',
    label: 'Deploy Backup Generator',
    desc: 'Bypasses electric grid failure by provisioning emergency auxiliary diesel/solar power.',
    icon: BatteryCharging,
    duration: 8,
  },
  {
    type: 'REPAIR',
    label: 'Rapid Infrastructure Repair',
    desc: 'Dispatches municipal engineering repair crews to restore normal operations.',
    icon: Wrench,
    duration: 12,
  },
  {
    type: 'RESTORE_NETWORK',
    label: 'Emergency Satellite / Mesh Link',
    desc: 'Activates redundant satellite backhaul for telecom and dispatch networks.',
    icon: Radio,
    duration: 6,
  },
  {
    type: 'ISOLATE',
    label: 'Service Isolation & Containment',
    desc: 'Electrically / hydraulically decouples service to arrest cascade propagation.',
    icon: ShieldCheck,
    duration: 5,
  },
];

export const RecoveryActionModal: React.FC<RecoveryActionModalProps> = ({
  isOpen,
  nodes,
  runtimeNodes,
  selectedNodeId,
  currentTime,
  onClose,
  onApplyRecovery,
}) => {
  const [targetNodeId, setTargetNodeId] = useState<string>(
    selectedNodeId || nodes[0]?.id || ''
  );
  const [selectedType, setSelectedType] = useState<RecoveryActionType>('BACKUP_POWER');

  if (!isOpen) return null;

  const handleApply = () => {
    const strategy = RECOVERY_TYPES.find(r => r.type === selectedType);
    const action: RecoveryAction = {
      id: `rec-${selectedType.toLowerCase()}-${Date.now()}`,
      nodeId: targetNodeId,
      type: selectedType,
      startTime: currentTime,
      duration: strategy?.duration || 10,
      description: strategy?.desc,
    };
    onApplyRecovery(action);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="glass-panel-glow w-full max-w-xl rounded-2xl p-6 border border-cyan-500/40 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-heading">
                Deploy Recovery & Mitigation Action
              </h3>
              <p className="text-xs text-slate-400">
                Intervene during simulation to alter the cascade trajectory
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

        {/* 1. Target Service Selection */}
        <div className="mb-4">
          <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Target Service:
          </label>
          <select
            value={targetNodeId}
            onChange={e => setTargetNodeId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-500 transition-all"
          >
            {nodes.map(node => {
              const runtime = runtimeNodes[node.id];
              return (
                <option key={node.id} value={node.id}>
                  {node.name} ({runtime?.state || 'HEALTHY'} - {node.zone})
                </option>
              );
            })}
          </select>
        </div>

        {/* 2. Recovery Strategy Options */}
        <div className="mb-5">
          <label className="block text-xs font-mono font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            Select Mitigation Strategy:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {RECOVERY_TYPES.map(strategy => {
              const isSelected = selectedType === strategy.type;
              const Icon = strategy.icon;

              return (
                <div
                  key={strategy.type}
                  onClick={() => setSelectedType(strategy.type)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        {strategy.label}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                    {strategy.desc}
                  </p>

                  <div className="text-[10px] font-mono text-cyan-400/90 font-semibold pt-1 border-t border-slate-800/80">
                    Est. Duration: {strategy.duration} sim min
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs font-mono text-slate-400">
            Dispatch Time: <span className="text-cyan-300 font-bold">T+{currentTime} min</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold font-mono tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 fill-slate-950" />
              <span>APPLY ACTION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
