import React, { useMemo } from 'react';
import {
  Zap,
  Droplets,
  Radio,
  HeartPulse,
  Siren,
  Factory,
  Home,
  Flame,
} from 'lucide-react';
import { DigitalTwinNode, DependencyLink, NodeStatus } from './types';

interface DigitalTwinMapProps {
  nodes: DigitalTwinNode[];
  links: DependencyLink[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  isCascadeActive: boolean;
  activeCascadeCount: number;
  highlightedEdges?: string[];
}

const SectorIconMap = {
  POWER: Zap,
  WATER: Droplets,
  TELECOM: Radio,
  HEALTHCARE: HeartPulse,
  EMERGENCY: Siren,
  INDUSTRY: Factory,
  RESIDENTIAL: Home,
};

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  nodes,
  links,
  selectedNodeId,
  onSelectNode,
  isCascadeActive,
  activeCascadeCount,
}) => {
  const nodeMap = useMemo(() => {
    const map = new Map<string, DigitalTwinNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case 'ONLINE':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          dot: 'bg-emerald-400',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
          bar: 'bg-emerald-500',
        };
      case 'WARNING':
        return {
          bg: 'bg-yellow-950/70 border-yellow-500/50 text-yellow-400',
          badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
          dot: 'bg-yellow-400',
          glow: 'shadow-[0_0_18px_rgba(234,179,8,0.25)]',
          bar: 'bg-yellow-500',
        };
      case 'DEGRADED':
        return {
          bg: 'bg-amber-950/80 border-amber-500/60 text-amber-400',
          badge: 'bg-amber-500/25 text-amber-300 border-amber-500/60',
          dot: 'bg-amber-400',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
          bar: 'bg-amber-500',
        };
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/90 border-rose-500/70 text-rose-400',
          badge: 'bg-rose-500/30 text-rose-300 border-rose-500/70',
          dot: 'bg-rose-500 animate-ping',
          glow: 'shadow-[0_0_25px_rgba(244,63,94,0.45)]',
          bar: 'bg-rose-500',
        };
      case 'RECOVERING':
        return {
          bg: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-400',
          badge: 'bg-cyan-500/25 text-cyan-300 border-cyan-500/60',
          dot: 'bg-cyan-400 animate-pulse',
          glow: 'shadow-[0_0_20px_rgba(6,182,212,0.35)]',
          bar: 'bg-cyan-400',
        };
    }
  };

  return (
    <div className="w-full h-full min-h-[460px] lg:min-h-[520px] rounded-2xl glass-panel-glow border border-cyan-500/30 relative overflow-hidden flex flex-col select-none bg-command-grid">
      {/* Top Map Header Telemetry Bar */}
      <div className="p-3.5 px-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/90 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>DIGITAL-TWIN 2D TOPOLOGY</span>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            JanNagar Resilience Map • 8 Critical Assets
          </span>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center space-x-2">
          {isCascadeActive && (
            <span className="px-2.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 text-[11px] font-mono font-bold animate-pulse">
              ⚡ ACTIVE CASCADE PROPAGATING
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono">
            SCALE: 1:50,000
          </span>
        </div>
      </div>

      {/* Interactive 2D Digital Twin Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[400px]">
        {/* Subtle SVG Grid Background and Dependency Link Vectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="linkGradientHealthy" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.15" />
            </linearGradient>

            <linearGradient id="linkGradientCascade" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.3" />
            </linearGradient>

            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Draw Dependency Links */}
          {links.map((link, idx) => {
            const fromNode = nodeMap.get(link.from);
            const toNode = nodeMap.get(link.to);
            if (!fromNode || !toNode) return null;

            const isSourceFailed =
              fromNode.status === 'CRITICAL' || fromNode.status === 'DEGRADED';
            const isTargetAffected = toNode.status !== 'ONLINE';
            const isFailingEdge = isSourceFailed && isTargetAffected;

            return (
              <g key={`link-${idx}`}>
                {/* Background Shadow Line */}
                <line
                  x1={`${fromNode.x}%`}
                  y1={`${fromNode.y}%`}
                  x2={`${toNode.x}%`}
                  y2={`${toNode.y}%`}
                  stroke={isFailingEdge ? '#f43f5e' : 'rgba(14, 165, 233, 0.15)'}
                  strokeWidth={isFailingEdge ? 3 : 1.5}
                  strokeDasharray={isFailingEdge ? '6,4' : undefined}
                  className={isFailingEdge ? 'animate-pulse' : ''}
                />

                {/* Animated Flow Dots */}
                {isFailingEdge ? (
                  <circle r="4" fill="#f43f5e" filter="url(#glowEffect)">
                    <animateMotion
                      path={`M ${fromNode.x * 6} ${fromNode.y * 4} L ${toNode.x * 6} ${toNode.y * 4}`}
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                ) : (
                  <circle r="2" fill="#38bdf8" opacity="0.6">
                    <animateMotion
                      path={`M ${fromNode.x * 6} ${fromNode.y * 4} L ${toNode.x * 6} ${toNode.y * 4}`}
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* 2D Node Cards */}
        {nodes.map((node) => {
          const Icon = SectorIconMap[node.sector] || Zap;
          const styles = getStatusColor(node.status);
          const isSelected = selectedNodeId === node.id;

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute z-10 w-44 sm:w-48 p-2.5 sm:p-3 rounded-xl border backdrop-blur-md transition-all duration-300 cursor-pointer ${
                styles.bg
              } ${styles.glow} ${
                isSelected
                  ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-105 z-30'
                  : 'hover:scale-105 hover:z-20'
              }`}
            >
              {/* Header: Icon + Status Badge */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <div className="p-1 rounded bg-slate-900/90 text-cyan-400 border border-slate-700">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                    {node.sector}
                  </span>
                </div>

                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border flex items-center space-x-1 ${styles.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
                  <span>{node.status}</span>
                </span>
              </div>

              {/* Node Name */}
              <div className="font-bold text-xs text-slate-100 font-heading truncate">
                {node.name}
              </div>

              {/* Health Bar + Percentage */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">HEALTH</span>
                  <span className="font-bold text-slate-200">{node.health}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900/90 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
                    style={{ width: `${node.health}%` }}
                  ></div>
                </div>
              </div>

              {/* Auxiliary Flags (Backup Generator, Isolated) */}
              {(node.hasBackupPower || node.isIsolated) && (
                <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center space-x-1 text-[9px] font-mono text-cyan-300">
                  {node.hasBackupPower && <span>⚡ BACKUP GEN</span>}
                  {node.isIsolated && <span>🛡 ISOLATED</span>}
                </div>
              )}
            </div>
          );
        })}

        {/* Floating Bottom Cascade Banner */}
        {isCascadeActive && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-slate-950/90 backdrop-blur-md border border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center space-x-3">
            <div className="p-1 rounded bg-rose-500/20 text-rose-400">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-rose-400">
                CASCADE PROPAGATION
              </div>
              <div className="text-xs font-semibold text-slate-200">
                Failure spreading through {activeCascadeCount} connected infrastructure nodes.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
