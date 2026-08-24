import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import {
  Zap,
  Droplets,
  Radio,
  TrafficCone,
  HeartPulse,
  Siren,
  Flame,
  Building2,
  TrainFront,
  BatteryCharging,
  ShieldAlert,
} from 'lucide-react';
import { ServiceType, NodeRuntimeState, ServiceNode } from '../../types';
import { getStatusColor, getCriticalityBadge } from '../../utils/formatters';

export type ServiceNodeData = {
  node: ServiceNode;
  runtime: NodeRuntimeState;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  [key: string]: unknown;
};

export type CustomServiceNode = Node<ServiceNodeData, 'serviceNode'>;

const ServiceIconMap: Record<ServiceType, React.ElementType> = {
  POWER: Zap,
  WATER: Droplets,
  TELECOM: Radio,
  TRAFFIC: TrafficCone,
  HOSPITAL: HeartPulse,
  EMERGENCY: Siren,
  SEWAGE: Droplets,
  TRANSPORT: TrainFront,
  FUEL: Flame,
  MUNICIPAL: Building2,
};

export const ServiceNodeCard: React.FC<NodeProps<CustomServiceNode>> = memo(({ data }) => {
  const { node, runtime, isSelected, onSelect } = data;

  const IconComponent = ServiceIconMap[node.type] || Building2;
  const statusStyles = getStatusColor(runtime.state);
  const critStyles = getCriticalityBadge(node.criticality);

  const isFailed = runtime.state === 'FAILED';
  const isRecovering = runtime.state === 'RECOVERING';
  const isDegraded = runtime.state === 'DEGRADED';

  let pulseClass = '';
  if (isFailed) pulseClass = 'animate-pulse-red';
  else if (isRecovering) pulseClass = 'animate-pulse-cyan';
  else if (isDegraded) pulseClass = 'animate-pulse-amber';

  return (
    <div
      onClick={() => onSelect(node.id)}
      className={`relative min-w-[210px] max-w-[230px] rounded-xl border transition-all duration-300 cursor-pointer select-none p-3.5 bg-slate-900/90 backdrop-blur-md shadow-xl ${
        statusStyles.border
      } ${statusStyles.glow} ${pulseClass} ${
        isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-105' : 'hover:scale-[1.02]'
      }`}
      style={{
        background: isFailed
          ? 'linear-gradient(135deg, rgba(20,10,15,0.95), rgba(76,5,25,0.85))'
          : isRecovering
          ? 'linear-gradient(135deg, rgba(8,25,35,0.95), rgba(8,51,68,0.85))'
          : isDegraded
          ? 'linear-gradient(135deg, rgba(25,18,8,0.95), rgba(69,26,3,0.85))'
          : 'linear-gradient(135deg, rgba(10,18,35,0.95), rgba(15,23,42,0.9))',
      }}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-cyan-500 !border-2 !border-slate-950"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="w-2.5 h-2.5 !bg-cyan-500 !border-2 !border-slate-950"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-sky-400 !border-2 !border-slate-950"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="w-2.5 h-2.5 !bg-sky-400 !border-2 !border-slate-950"
      />

      {/* Header Row: Category Icon + Badges */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div
            className={`p-1.5 rounded-lg ${
              isFailed
                ? 'bg-rose-500/20 text-rose-400'
                : isRecovering
                ? 'bg-cyan-500/20 text-cyan-400'
                : isDegraded
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-cyan-500/10 text-cyan-400'
            }`}
          >
            <IconComponent className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold">
            {node.type}
          </span>
        </div>

        <span
          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${critStyles.bg} ${critStyles.text} ${critStyles.border}`}
        >
          {node.criticality}
        </span>
      </div>

      {/* Node Name */}
      <div className="text-xs font-semibold text-slate-100 leading-snug mb-2 line-clamp-2">
        {node.name}
      </div>

      {/* Zone & State Badges */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[95px]">
          {node.zone}
        </span>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${statusStyles.badge}`}
        >
          {runtime.state}
        </span>
      </div>

      {/* Active Mitigations */}
      {(runtime.hasBackupPower || runtime.isIsolated || runtime.isNetworkRestored) && (
        <div className="flex items-center space-x-1.5 mt-2 pt-1 border-t border-slate-800/60">
          {runtime.hasBackupPower && (
            <span className="flex items-center space-x-1 text-[9px] font-mono bg-cyan-500/15 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
              <BatteryCharging className="w-3 h-3" />
              <span>GEN ACTIVE</span>
            </span>
          )}
          {runtime.isIsolated && (
            <span className="flex items-center space-x-1 text-[9px] font-mono bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
              <ShieldAlert className="w-3 h-3" />
              <span>ISOLATED</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
});
