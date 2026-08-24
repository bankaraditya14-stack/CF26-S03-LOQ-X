import React from 'react';
import { Clock, ArrowRight, Shield, AlertCircle, Wrench, CheckCircle } from 'lucide-react';
import { SimulationEvent, ServiceNode } from '../../types';
import { formatSimTime, getStatusColor } from '../../utils/formatters';

interface EventTimelineProps {
  events: SimulationEvent[];
  nodes: ServiceNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  nodes,
  selectedNodeId,
  onSelectNode,
}) => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const getEventIcon = (event: SimulationEvent) => {
    switch (event.type) {
      case 'FAILURE_INJECTED':
      case 'FAILURE_PROPAGATED':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'RECOVERY_STARTED':
        return <Wrench className="w-3.5 h-3.5 text-cyan-400" />;
      case 'RECOVERY_COMPLETED':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col h-full select-none">
      {/* Timeline Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-tight text-slate-200 font-heading">
            Chronological Event Timeline
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          {events.length} events logged
        </span>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 max-h-[320px]">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
            <Clock className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs font-mono">No simulation events recorded yet.</p>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Press RUN or Inject a Failure to start the cascade.
            </p>
          </div>
        ) : (
          events.map((evt, idx) => {
            const targetNode = nodeMap.get(evt.targetNode);
            const targetName = targetNode?.name || evt.targetNode;
            const isSelected = selectedNodeId === evt.targetNode;
            const newStatusStyle = getStatusColor(evt.newState);
            const prevStatusStyle = getStatusColor(evt.previousState);

            return (
              <div
                key={evt.id || idx}
                onClick={() => onSelectNode(evt.targetNode)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Timestamp, Node Name, Event Type Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      {formatSimTime(evt.timestamp)}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors">
                      {targetName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {getEventIcon(evt)}
                    <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                      {evt.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* State Transition Badges */}
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className={`px-1.5 py-0.5 rounded border ${prevStatusStyle.badge}`}>
                    {evt.previousState}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className={`px-1.5 py-0.5 rounded border font-bold ${newStatusStyle.badge}`}>
                    {evt.newState}
                  </span>
                </div>

                {/* Cause Description */}
                {evt.cause.reason && (
                  <div className="text-[11px] text-slate-400 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/50 leading-relaxed font-sans">
                    {evt.cause.reason}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
