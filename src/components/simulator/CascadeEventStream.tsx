import React from 'react';
import { Terminal } from 'lucide-react';
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
        return 'bg-red-100 text-red-700 border-red-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'recovery':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'info':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-charcoal-900/15 shadow-command select-none space-y-3 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-charcoal-900/10">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cream-200 text-charcoal-800">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider">
              CASCADE EVENT STREAM
            </h3>
            <span className="text-[10px] text-charcoal-500">Discrete Event Causal Feed</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-charcoal-500 font-bold">Simulated Time:</span>
          <span className="px-2.5 py-0.5 rounded bg-cream-100 border border-charcoal-900/10 font-bold text-charcoal-900">
            {currentTimeLabel}
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Event Flow */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-thin">
        {events.map((event) => (
          <div
            key={event.id}
            className="min-w-[260px] max-w-[300px] p-3.5 rounded-xl bg-cream-50 border border-charcoal-900/10 space-y-2 shrink-0 hover:border-charcoal-900/30 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-charcoal-900 bg-white border border-charcoal-900/10">
                {event.timeLabel}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${getBadgeStyle(
                  event.severity
                )}`}
              >
                {event.category || event.severity}
              </span>
            </div>

            <div className="text-xs font-bold text-charcoal-900 truncate">
              {event.title}
            </div>

            <div className="text-[11px] text-charcoal-500 leading-snug line-clamp-2">
              {event.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
