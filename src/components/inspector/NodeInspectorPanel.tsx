import React from 'react';
import {
  Info,
  Layers,
  ArrowDown,
  Wrench,
  AlertOctagon,
  ShieldCheck,
  Zap,
  Radio,
  Droplets,
  TrafficCone,
  HeartPulse,
  Siren,
  Building2,
  TrainFront,
  Flame,
} from 'lucide-react';
import {
  ServiceNode,
  DependencyEdge,
  NodeRuntimeState,
  ServiceType,
} from '../../types';
import {
  formatSimTime,
  getStatusColor,
  getCriticalityBadge,
} from '../../utils/formatters';

interface NodeInspectorPanelProps {
  selectedNodeId: string | null;
  nodes: ServiceNode[];
  edges: DependencyEdge[];
  runtimeNodes: Record<string, NodeRuntimeState>;
  onOpenRecoveryForNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
}

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

export const NodeInspectorPanel: React.FC<NodeInspectorPanelProps> = ({
  selectedNodeId,
  nodes,
  edges,
  runtimeNodes,
  onOpenRecoveryForNode,
  onSelectNode,
}) => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;
  const runtime = selectedNodeId ? runtimeNodes[selectedNodeId] : null;

  if (!selectedNode || !runtime) {
    return (
      <div className="glass-panel rounded-2xl p-4 flex flex-col items-center justify-center h-full text-center text-slate-500 select-none">
        <Info className="w-8 h-8 text-slate-700 mb-2" />
        <p className="text-xs font-mono font-semibold text-slate-400">
          No Service Selected
        </p>
        <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">
          Click any node in the infrastructure graph or timeline to inspect its causal chain.
        </p>
      </div>
    );
  }

  const IconComponent = ServiceIconMap[selectedNode.type] || Building2;
  const statusStyles = getStatusColor(runtime.state);
  const critStyles = getCriticalityBadge(selectedNode.criticality);

  // Upstream incoming dependencies
  const incomingEdges = edges.filter(e => e.to === selectedNode.id);
  // Downstream outgoing dependencies
  const outgoingEdges = edges.filter(e => e.from === selectedNode.id);

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col h-full overflow-y-auto select-none space-y-4">
      {/* Header: Service Name + Icon */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div className="flex items-start space-x-3">
          <div
            className={`p-2.5 rounded-xl border ${statusStyles.bg} ${statusStyles.border} ${statusStyles.text}`}
          >
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              {selectedNode.type} • {selectedNode.zone}
            </div>
            <h3 className="text-sm font-bold text-slate-100 font-heading leading-tight mt-0.5">
              {selectedNode.name}
            </h3>
          </div>
        </div>

        <span
          className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold ${critStyles.bg} ${critStyles.text} ${critStyles.border}`}
        >
          {selectedNode.criticality} CRITICALITY
        </span>
      </div>

      {/* Status & Timing Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            Current Status
          </div>
          <div className="flex items-center space-x-1.5 mt-1">
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${statusStyles.badge}`}
            >
              {runtime.state}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            Last Transition
          </div>
          <div className="text-xs font-mono font-bold text-slate-200 mt-1">
            {formatSimTime(runtime.stateChangedAt)}
          </div>
        </div>
      </div>

      {/* Description */}
      {selectedNode.description && (
        <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
          {selectedNode.description}
        </div>
      )}

      {/* Upstream Causal Chain & Direct Causes */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-mono font-semibold text-slate-300">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Upstream Causal Dependency Chain</span>
        </div>

        {runtime.causes.length === 0 ? (
          <div className="text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded-xl flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Operating normally. No upstream disruptions.</span>
          </div>
        ) : (
          <div className="bg-rose-950/20 border border-rose-500/30 p-2.5 rounded-xl space-y-2">
            <div className="flex items-center space-x-1.5 text-rose-400 text-[11px] font-semibold">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Direct Root/Cascading Cause(s):</span>
            </div>

            <div className="space-y-1">
              {runtime.causes.map(causeId => {
                const causeNode = nodeMap.get(causeId);
                const causeRuntime = runtimeNodes[causeId];
                return (
                  <div
                    key={causeId}
                    onClick={() => onSelectNode(causeId)}
                    className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono cursor-pointer transition-all"
                  >
                    <span className="text-slate-300 font-semibold truncate">
                      {causeNode?.name || causeId}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded border uppercase text-[8px] font-bold ${
                        getStatusColor(causeRuntime?.state || 'HEALTHY').badge
                      }`}
                    >
                      {causeRuntime?.state || 'UNKNOWN'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* All Incoming Dependencies */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
          Incoming Dependencies ({incomingEdges.length})
        </div>
        <div className="space-y-1">
          {incomingEdges.map(edge => {
            const fromNode = nodeMap.get(edge.from);
            const fromRuntime = runtimeNodes[edge.from];
            const isFailed = fromRuntime?.state === 'FAILED' || fromRuntime?.state === 'DEGRADED';

            return (
              <div
                key={edge.id}
                onClick={() => onSelectNode(edge.from)}
                className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  isFailed
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="text-[10px] font-mono text-cyan-400">
                    +{edge.propagationDelay}m
                  </span>
                  <span className="truncate font-medium">
                    {fromNode?.name || edge.from}
                  </span>
                </div>
                <span className="text-[9px] font-mono uppercase text-slate-400">
                  {edge.dependencyKind || edge.dependencyType}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Downstream Impacted Services */}
      <div className="space-y-1.5">
        <div className="flex items-center space-x-1 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
          <ArrowDown className="w-3 h-3 text-cyan-400" />
          <span>Downstream Dependents ({outgoingEdges.length})</span>
        </div>
        <div className="space-y-1">
          {outgoingEdges.map(edge => {
            const toNode = nodeMap.get(edge.to);
            const toRuntime = runtimeNodes[edge.to];
            return (
              <div
                key={edge.id}
                onClick={() => onSelectNode(edge.to)}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 cursor-pointer transition-all"
              >
                <span className="truncate font-medium">{toNode?.name || edge.to}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-semibold ${
                    getStatusColor(toRuntime?.state || 'HEALTHY').badge
                  }`}
                >
                  {toRuntime?.state || 'HEALTHY'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer: Intervene on this Node */}
      <div className="pt-3 border-t border-slate-800 mt-auto">
        <button
          onClick={() => onOpenRecoveryForNode(selectedNode.id)}
          className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5 fill-slate-950" />
          <span>DEPLOY RECOVERY ON THIS NODE</span>
        </button>
      </div>
    </div>
  );
};
