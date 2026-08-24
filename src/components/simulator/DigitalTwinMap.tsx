import React, { useMemo } from 'react';
import {
  Zap,
  Droplets,
  Radio,
  HeartPulse,
  Siren,
  Factory,
  Home,
  AlertTriangle,
  Car,
} from 'lucide-react';
import { DigitalTwinNode, DependencyLink } from './types';

interface DigitalTwinMapProps {
  nodes: DigitalTwinNode[];
  links: DependencyLink[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  isCascadeActive: boolean;
  activeCascadeCount: number;
}

const SectorIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  POWER: Zap,
  WATER: Droplets,
  TELECOM: Radio,
  HEALTHCARE: HeartPulse,
  EMERGENCY: Siren,
  INDUSTRY: Factory,
  RESIDENTIAL: Home,
  TRANSIT: Car,
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

  const getNodeTheme = (node: DigitalTwinNode) => {
    const { health, status } = node;

    // 🔴 RED — FAILED / CRITICAL (0 - 39% or FAILED/CRITICAL state)
    if (health === 0 || status === 'CRITICAL') {
      const isFailed = health === 0;
      return {
        colorCategory: 'RED' as const,
        displayStatus: isFailed ? 'FAILED' : 'CRITICAL',
        bg: 'bg-red-50/80 border-red-500 text-charcoal-900',
        badge: 'bg-red-100 text-red-700 border-red-300',
        dot: 'bg-red-600 animate-ping',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.35)] ring-1 ring-red-400',
        barBg: 'bg-red-200',
        barFill: 'bg-red-600',
        iconBg: 'bg-red-100 text-red-700',
      };
    }

    // 🟡 YELLOW — DEGRADED / WARNING (40 - 79% or DEGRADED/WARNING state)
    if (health < 80 || status === 'DEGRADED' || status === 'WARNING') {
      const isWarning = status === 'WARNING';
      return {
        colorCategory: 'YELLOW' as const,
        displayStatus: isWarning ? 'WARNING' : 'DEGRADED',
        bg: 'bg-amber-50/80 border-amber-400 text-charcoal-900',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        dot: 'bg-amber-500 animate-pulse',
        glow: 'shadow-[0_0_14px_rgba(245,158,11,0.25)] ring-1 ring-amber-300',
        barBg: 'bg-amber-200',
        barFill: 'bg-amber-500',
        iconBg: 'bg-amber-100 text-amber-800',
      };
    }

    // 🟢 GREEN — RECOVERING (80 - 100% in active recovery)
    if (status === 'RECOVERING') {
      return {
        colorCategory: 'GREEN' as const,
        displayStatus: 'RECOVERING',
        bg: 'bg-emerald-50/70 border-emerald-400 text-charcoal-900',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500 animate-pulse',
        glow: 'shadow-[0_0_14px_rgba(16,185,129,0.25)] ring-1 ring-emerald-300',
        barBg: 'bg-emerald-200',
        barFill: 'bg-emerald-500',
        iconBg: 'bg-emerald-100 text-emerald-800',
      };
    }

    // 🟢 GREEN — HEALTHY / ONLINE (80 - 100%)
    return {
      colorCategory: 'GREEN' as const,
      displayStatus: 'ONLINE',
      bg: 'bg-white border-emerald-300/80 text-charcoal-900',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      glow: 'shadow-command hover:border-emerald-400',
      barBg: 'bg-emerald-100',
      barFill: 'bg-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-700',
    };
  };

  return (
    <div className="w-full h-full min-h-[480px] lg:min-h-[540px] rounded-2xl bg-cream-50 border border-charcoal-900/15 shadow-command-lg relative overflow-hidden flex flex-col select-none">
      {/* Top Map Header Telemetry Bar */}
      <div className="p-3.5 px-4 bg-white/90 backdrop-blur-md border-b border-charcoal-900/10 flex flex-wrap items-center justify-between gap-2 z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-cream-100 border border-charcoal-900/10 text-charcoal-900 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>DIGITAL-TWIN INFRASTRUCTURE MAP</span>
          </div>
          <span className="text-xs font-mono text-charcoal-500 hidden sm:inline">
            JanNagar Grid • 8 Connected Sectors
          </span>
        </div>

        {/* Live Traffic Light Operational Status Legend */}
        <div className="flex items-center space-x-2 font-mono text-[10px] font-bold">
          <div className="hidden md:flex items-center space-x-3 px-2.5 py-0.5 rounded-lg bg-cream-100 border border-charcoal-900/10 text-charcoal-700">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>ONLINE</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>DEGRADED</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>FAILED</span>
            </span>
          </div>

          {isCascadeActive && (
            <span className="px-2.5 py-0.5 rounded-lg bg-red-100 border border-red-300 text-red-700 text-[11px] font-bold animate-pulse flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              <span>CASCADE ACTIVE</span>
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-lg bg-cream-100 border border-charcoal-900/10 text-charcoal-700 text-[10px]">
            SCALE: 1:50,000
          </span>
        </div>
      </div>

      {/* Interactive 2D Digital Twin Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[420px] bg-cream-grid">
        {/* SVG Dependency Link Vectors & Animated Pulses */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Draw Dependency Links with Data-Driven Traffic Light Colors */}
          {links.map((link, idx) => {
            const fromNode = nodeMap.get(link.from);
            const toNode = nodeMap.get(link.to);
            if (!fromNode || !toNode) return null;

            const fromTheme = getNodeTheme(fromNode);
            const toTheme = getNodeTheme(toNode);

            // Determine active edge status:
            // 🔴 RED: If either node is FAILED / CRITICAL
            // 🟡 YELLOW: If either node is DEGRADED / WARNING
            // 🟢 GREEN: If both nodes are ONLINE / HEALTHY or RECOVERING
            let edgeStroke = '#10b981'; // Green
            let edgeOpacity = 0.5;
            let edgeWidth = 1.5;
            let edgeDash: string | undefined = undefined;
            let pulseFill = '#10b981';
            let pulseSize = 2.2;
            let pulseSpeed = '4s';

            if (fromTheme.colorCategory === 'RED' || toTheme.colorCategory === 'RED') {
              edgeStroke = '#ef4444'; // Red failure line
              edgeOpacity = 0.95;
              edgeWidth = 2.5;
              edgeDash = '6,4';
              pulseFill = '#dc2626';
              pulseSize = 3.5;
              pulseSpeed = '1.6s';
            } else if (fromTheme.colorCategory === 'YELLOW' || toTheme.colorCategory === 'YELLOW') {
              edgeStroke = '#f59e0b'; // Amber warning line
              edgeOpacity = 0.85;
              edgeWidth = 2.0;
              edgeDash = '5,3';
              pulseFill = '#d97706';
              pulseSize = 3.0;
              pulseSpeed = '2.2s';
            } else if (fromTheme.displayStatus === 'RECOVERING' || toTheme.displayStatus === 'RECOVERING') {
              edgeStroke = '#10b981'; // Emerald recovery line
              edgeOpacity = 0.85;
              edgeWidth = 2.0;
              pulseFill = '#059669';
              pulseSize = 2.8;
              pulseSpeed = '2.5s';
            }

            return (
              <g key={`link-${idx}`}>
                {/* Dependency Edge Line */}
                <line
                  x1={`${fromNode.x}%`}
                  y1={`${fromNode.y}%`}
                  x2={`${toNode.x}%`}
                  y2={`${toNode.y}%`}
                  stroke={edgeStroke}
                  strokeOpacity={edgeOpacity}
                  strokeWidth={edgeWidth}
                  strokeDasharray={edgeDash}
                />

                {/* Flow Vector Pulse */}
                <circle r={pulseSize} fill={pulseFill} filter="url(#glowFilter)">
                  <animateMotion
                    path={`M ${fromNode.x * 6} ${fromNode.y * 4} L ${toNode.x * 6} ${toNode.y * 4}`}
                    dur={pulseSpeed}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </svg>

        {/* 2D Node Cards */}
        {nodes.map((node) => {
          const Icon = SectorIconMap[node.sector] || Zap;
          const styles = getNodeTheme(node);
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
              className={`absolute z-10 w-44 sm:w-48 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                styles.bg
              } ${styles.glow} ${
                isSelected
                  ? 'ring-2 ring-charcoal-900 shadow-command-lg scale-105 z-30'
                  : 'hover:scale-105 hover:z-20'
              }`}
            >
              {/* Header: Icon + Traffic Light Status Badge */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <div className={`p-1 rounded-lg ${styles.iconBg}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-charcoal-500 font-bold">
                    {node.sector}
                  </span>
                </div>

                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border flex items-center space-x-1 ${styles.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
                  <span>{styles.displayStatus}</span>
                </span>
              </div>

              {/* Node Name */}
              <div className="font-bold text-xs text-charcoal-900 font-heading truncate">
                {node.name}
              </div>

              {/* Health Bar + Percentage with Traffic Light Fill */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-charcoal-500 font-bold">HEALTH</span>
                  <span className="font-bold text-charcoal-900">{node.health}%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full ${styles.barBg} overflow-hidden`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${styles.barFill}`}
                    style={{ width: `${node.health}%` }}
                  ></div>
                </div>
              </div>

              {/* Auxiliary Flags (Backup Generator, Isolated) */}
              {(node.hasBackupPower || node.isIsolated) && (
                <div className="mt-1.5 pt-1 border-t border-charcoal-900/10 flex items-center space-x-1 text-[9px] font-mono text-mutedpurple-600 font-bold">
                  {node.hasBackupPower && <span>⚡ BACKUP GEN</span>}
                  {node.isIsolated && <span>🛡 ISOLATED</span>}
                </div>
              )}
            </div>
          );
        })}

        {/* Floating Cascade Propagation Banner */}
        {isCascadeActive && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-xl bg-white border border-red-400 shadow-command-lg flex items-center space-x-3">
            <div className="p-1 rounded-lg bg-red-100 text-red-600">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-red-600">
                ⚠ CASCADE PROPAGATION DETECTED
              </div>
              <div className="text-xs font-bold text-charcoal-900">
                Failure spreading across {activeCascadeCount} dependent infrastructure nodes.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
