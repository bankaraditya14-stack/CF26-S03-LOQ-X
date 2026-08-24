import React from 'react';
import { Clock } from 'lucide-react';
import { CascadeStreamEvent } from './types';

interface CascadeEventStreamProps {
  events: CascadeStreamEvent[];
  currentTimeLabel: string;
}

export const CascadeEventStream: React.FC<CascadeEventStreamProps> = ({
  events,
  currentTimeLabel,
}) => {
  const getBadgeStyle = (severity: CascadeStreamEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'warning':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'recovery':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'info':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 select-none space-y-3 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              CASCADE EVENT STREAM
            </h3>
            <span className="text-[10px] text-slate-400">Chronological Causal Sequence</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-400">Current Sim Time:</span>
          <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-bold text-cyan-400">
            {currentTimeLabel}
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Event Flow or Stack */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-thin">
        {events.map((event) => (
          <div
            key={event.id}
            className="min-w-[240px] max-w-[280px] p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 shrink-0 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30">
                {event.timeLabel}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getBadgeStyle(
                  event.severity
                )}`}
              >
                {event.severity}
              </span>
            </div>

            <div className="text-xs font-bold text-slate-200 truncate">
              {event.title}
            </div>

            <div className="text-[11px] text-slate-400 leading-snug line-clamp-2">
              {event.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
