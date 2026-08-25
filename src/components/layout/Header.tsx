import React from 'react';
import {
  CheckCircle2,
  HelpCircle,
  BarChart2,
  Clock,
  Layers,
  ShieldCheck,
  Cloud,
  HardDrive,
  User as UserIcon,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Scenario, SimulationState } from '../../types';
import { formatSimTime } from '../../utils/formatters';
import { navigate } from '../../utils/router';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  scenario: Scenario;
  state: SimulationState;
  deterministicMatch: boolean | null;
  onOpenAbout: () => void;
  onOpenComparison: () => void;
  onVerifyDeterministic: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenario,
  state,
  deterministicMatch,
  onOpenAbout,
  onOpenComparison,
  onVerifyDeterministic,
}) => {
  const { user, isCloudConnected, openAuthModal, signOut } = useAuth();

  const getStatusBadge = () => {
    switch (state.status) {
      case 'IDLE':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cream-100 text-charcoal-700 border border-charcoal-900/10">
            <span className="w-2 h-2 rounded-full bg-softblue-500"></span>
            <span>READY</span>
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-mutedpurple-100 text-mutedpurple-700 border border-mutedpurple-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-mutedpurple-500 animate-ping"></span>
            <span>RUNNING</span>
          </span>
        );
      case 'PAUSED':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cream-200 text-charcoal-800 border border-cream-400">
            <span className="w-2 h-2 rounded-full bg-dustybrown-300"></span>
            <span>PAUSED</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-softblue-100 text-softblue-700 border border-softblue-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-softblue-600"></span>
            <span>STABILIZED</span>
          </span>
        );
    }
  };

  return (
    <header className="w-full bg-cream-100/95 backdrop-blur-md border-b border-charcoal-900/10 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 select-none z-30 sticky top-0 font-mono">
      {/* Left: Brand & Overview Link */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 px-2.5 rounded-xl bg-white hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-700 hover:text-charcoal-900 transition-all flex items-center space-x-1.5 text-xs font-bold cursor-pointer shadow-sm"
          title="Back to Landing Page / Product Overview"
        >
          <span>OVERVIEW</span>
        </button>

        <div
          onClick={() => navigate('/')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-command border border-charcoal-900/15 flex-shrink-0 bg-charcoal-950 flex items-center justify-center p-0.5 transition-transform group-hover:scale-105">
            <img src="/cascade-city-logo.png" alt="Cascade City" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-charcoal-900 font-heading">
                CASCADE CITY
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-mutedpurple-100 text-mutedpurple-700 border border-mutedpurple-300 font-bold">
                S-03
              </span>
            </div>
            <p className="text-xs text-charcoal-500 font-medium font-sans">
              Urban Infrastructure Resilience Simulator
            </p>
          </div>
        </div>
      </div>

      {/* Center: Scenario Info & Clock */}
      <div className="flex items-center space-x-4 bg-white border border-charcoal-900/15 rounded-xl px-4 py-2 shadow-sm">
        <div className="flex items-center space-x-2 border-r border-charcoal-900/10 pr-4">
          <Layers className="w-4 h-4 text-mutedpurple-600" />
          <div className="max-w-[200px] truncate">
            <div className="text-[10px] uppercase text-charcoal-500 font-bold tracking-wider">
              Active Scenario
            </div>
            <div className="text-xs font-bold text-charcoal-900 truncate">
              {scenario.name}
            </div>
          </div>
        </div>

        {/* Virtual Clock */}
        <div className="flex items-center space-x-2.5">
          <Clock className="w-4 h-4 text-mutedpurple-600" />
          <div>
            <div className="text-[10px] uppercase text-charcoal-500 font-bold tracking-wider">
              Simulation Time
            </div>
            <div className="text-sm font-extrabold text-charcoal-900 tracking-wider">
              {formatSimTime(state.currentTime)}
            </div>
          </div>
        </div>

        <div className="pl-2 border-l border-charcoal-900/10">
          {getStatusBadge()}
        </div>
      </div>

      {/* Right: Actions, Cloud Status, Account, Deterministic Badge, Compare */}
      <div className="flex items-center space-x-2.5">
        {/* Cloud Status Indicator */}
        {isCloudConnected ? (
          <div
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white border border-softblue-400 text-charcoal-900 text-[10px] shadow-sm font-bold"
            title="Connected to Supabase PostgreSQL Database"
          >
            <Cloud className="w-3.5 h-3.5 text-softblue-600" />
            <span>CLOUD CONNECTED</span>
          </div>
        ) : (
          <div
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white border border-charcoal-900/15 text-charcoal-500 text-[10px] shadow-sm font-bold"
            title="Cloud storage unavailable. Your local scenarios remain available."
          >
            <HardDrive className="w-3.5 h-3.5 text-charcoal-400" />
            <span>LOCAL MODE</span>
          </div>
        )}

        {/* Account UI */}
        {user ? (
          <div className="flex items-center space-x-1.5 bg-white border border-charcoal-900/15 rounded-xl px-3 py-1 text-xs shadow-sm font-bold">
            <UserIcon className="w-3.5 h-3.5 text-mutedpurple-600" />
            <span className="text-charcoal-900 max-w-[120px] truncate text-[11px]">
              {user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="p-1 rounded hover:bg-cream-200 text-charcoal-400 hover:text-dustybrown-400 transition-colors ml-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-cream-100 border border-charcoal-900/15 text-charcoal-900 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5 text-mutedpurple-600" />
            <span>SIGN IN</span>
          </button>
        )}

        {/* Deterministic Replay Verification */}
        {deterministicMatch === true ? (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-softblue-100 border border-softblue-300 text-softblue-700 text-xs font-bold shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-softblue-700" />
            <span>✓ DETERMINISTIC</span>
          </div>
        ) : (
          <button
            onClick={onVerifyDeterministic}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-cream-100 border border-charcoal-900/15 text-charcoal-800 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Verify deterministic reproducibility"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-mutedpurple-600" />
            <span>Verify</span>
          </button>
        )}

        <button
          onClick={onOpenComparison}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-cream-100 border border-charcoal-900/15 text-charcoal-800 text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <BarChart2 className="w-3.5 h-3.5 text-softblue-600" />
          <span>Compare</span>
        </button>

        <button
          onClick={onOpenAbout}
          className="flex items-center space-x-1 p-2 rounded-xl bg-white hover:bg-cream-100 border border-charcoal-900/15 text-charcoal-700 hover:text-charcoal-900 text-xs transition-all shadow-sm cursor-pointer"
          title="About Synthetic City & Simulation Model"
        >
          <HelpCircle className="w-4 h-4 text-charcoal-500" />
        </button>
      </div>
    </header>
  );
};
