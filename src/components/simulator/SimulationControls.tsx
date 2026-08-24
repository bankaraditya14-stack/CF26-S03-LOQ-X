import React from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface SimulationControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  playbackSpeed: 1 | 2 | 4;
  onSetSpeed: (speed: 1 | 2 | 4) => void;
  simTimeFormatted: string;
  maxTimeFormatted: string;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  playbackSpeed,
  onSetSpeed,
  simTimeFormatted,
  maxTimeFormatted,
}) => {
  return (
    <div className="w-full bg-white rounded-2xl p-4 px-6 border border-charcoal-900/15 shadow-command flex flex-wrap items-center justify-between gap-4 font-mono select-none">
      {/* Controls: Play/Pause/Reset */}
      <div className="flex items-center space-x-2.5">
        {isPlaying ? (
          <button
            onClick={onPause}
            className="px-4 py-2 rounded-xl bg-dustybrown-300 hover:bg-dustybrown-400 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-command"
          >
            <Pause className="w-4 h-4" />
            <span>PAUSE</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            className="px-5 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-command"
          >
            <Play className="w-4 h-4 fill-cream-100" />
            <span>START SIMULATION</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-700 hover:text-charcoal-900 transition-all cursor-pointer"
          title="Reset Simulation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Speed Selectors: 1x / 2x / 4x */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-charcoal-500 font-bold">SPEED:</span>
        {([1, 2, 4] as const).map((spd) => (
          <button
            key={spd}
            onClick={() => onSetSpeed(spd)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              playbackSpeed === spd
                ? 'bg-charcoal-900 text-cream-100 shadow-sm'
                : 'bg-cream-100 text-charcoal-500 hover:bg-cream-200 border border-charcoal-900/10'
            }`}
          >
            {spd}×
          </button>
        ))}
      </div>

      {/* Clock Telemetry: 00:18 / 00:37 */}
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1.5 text-charcoal-500 font-bold">
          <Clock className="w-4 h-4 text-mutedpurple-600" />
          <span>SIMULATION TIME</span>
        </div>
        <div className="px-3 py-1 rounded-lg bg-cream-100 border border-charcoal-900/10 text-sm font-extrabold text-charcoal-900">
          {simTimeFormatted} / {maxTimeFormatted}
        </div>
      </div>
    </div>
  );
};
