import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  PlusCircle,
  Wrench,
  FastForward,
} from 'lucide-react';
import { SimulationStatus } from '../../types';

interface SimulationControlsProps {
  status: SimulationStatus;
  playbackSpeed: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSetSpeed: (speed: number) => void;
  onOpenInjectModal: () => void;
  onOpenRecoveryModal: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  status,
  playbackSpeed,
  isPlaying,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSetSpeed,
  onOpenInjectModal,
  onOpenRecoveryModal,
}) => {
  return (
    <div className="glass-panel rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Primary Play / Pause / Step / Reset Actions */}
      <div className="flex items-center space-x-2">
        {isPlaying ? (
          <button
            onClick={onPause}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
          >
            <Pause className="w-4 h-4 fill-slate-950" />
            <span>PAUSE</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RUN</span>
          </button>
        )}

        <button
          onClick={onStep}
          disabled={isPlaying || status === 'COMPLETED'}
          className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-semibold font-mono border border-slate-700 transition-all cursor-pointer"
          title="Advance simulation by 1 discrete batch step"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>STEP</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold font-mono border border-slate-700 transition-all cursor-pointer"
          title="Reset simulation to initial clean state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>

      {/* Speed Multiplier Controls */}
      <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1">
        <FastForward className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1" />
        {[1, 2, 4].map(speed => (
          <button
            key={speed}
            onClick={() => onSetSpeed(speed)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
              playbackSpeed === speed
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Interactive Interventions: Failure Injection & Recovery */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenInjectModal}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/50 text-rose-300 text-xs font-semibold transition-all cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.2)]"
        >
          <PlusCircle className="w-4 h-4 text-rose-400" />
          <span>+ INJECT FAILURE</span>
        </button>

        <button
          onClick={onOpenRecoveryModal}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/50 text-cyan-300 text-xs font-semibold transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
        >
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span>APPLY RECOVERY</span>
        </button>
      </div>
    </div>
  );
};
