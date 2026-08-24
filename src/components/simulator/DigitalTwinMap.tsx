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
import { DigitalTwinNode, DependencyLink, NodeStatus } from './types';

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

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case 'ONLINE':
        return {
          bg: 'bg-white border-softblue-300 text-charcoal-900',
          badge: 'bg-softblue-100 text-softblue-700 border-softblue-300',
          dot: 'bg-softblue-400',
          glow: 'shadow-command hover:border-softblue-500',
          bar: 'bg-softblue-400',
          iconBg: 'bg-softblue-50 text-softblue-700',
        };
      case 'WARNING':
        return {
          bg: 'bg-white border-cream-400 text-charcoal-900',
          badge: 'bg-cream-200 text-charcoal-700 border-cream-400',
          dot: 'bg-dustybrown-300',
          glow: 'shadow-command hover:border-cream-500',
          bar: 'bg-cream-400',
          iconBg: 'bg-cream-100 text-charcoal-700',
        };
      case 'DEGRADED':
        return {
          bg: 'bg-cream-100 border-dustybrown-300 text-charcoal-900',
          badge: 'bg-cream-300 text-dustybrown-400 border-dustybrown-300',
          dot: 'bg-dustybrown-400',
          glow: 'shadow-command hover:border-dustybrown-400',
          bar: 'bg-dustybrown-300',
          iconBg: 'bg-cream-200 text-dustybrown-400',
        };
      case 'CRITICAL':
        return {
          bg: 'bg-dustybrown-50 border-dustybrown-400 text-charcoal-900',
          badge: 'bg-dustybrown-100 text-dustybrown-400 border-dustybrown-400',
          dot: 'bg-dustybrown-400 animate-ping',
          glow: 'shadow-glow-brown',
          bar: 'bg-dustybrown-400',
          iconBg: 'bg-dustybrown-200 text-dustybrown-400',
        };
      case 'RECOVERING':
        return {
          bg: 'bg-white border-mutedpurple-300 text-charcoal-900',
          badge: 'bg-mutedpurple-100 text-mutedpurple-600 border-mutedpurple-300',
          dot: 'bg-mutedpurple-400 animate-pulse',
          glow: 'shadow-glow-purple',
          bar: 'bg-mutedpurple-400',
          iconBg: 'bg-mutedpurple-50 text-mutedpurple-600',
        };
    }
  };

  return (
    <div className="w-full h-full min-h-[480px] lg:min-h-[540px] rounded-2xl bg-cream-50 border border-charcoal-900/15 shadow-command-lg relative overflow-hidden flex flex-col select-none">
      {/* Top Map Header Telemetry Bar */}
      <div className="p-3.5 px-4 bg-white/90 backdrop-blur-md border-b border-charcoal-900/10 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-cream-100 border border-charcoal-900/10 text-charcoal-900 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-softblue-500"></span>
            <span>DIGITAL-TWIN INFRASTRUCTURE MAP</span>
          </div>
          <span className="text-xs font-mono text-charcoal-500 hidden sm:inline">
            JanNagar Grid • 8 Connected Sectors
          </span>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center space-x-2">
          {isCascadeActive && (
            <span className="px-2.5 py-0.5 rounded-lg bg-dustybrown-100 border border-dustybrown-300 text-dustybrown-400 text-[11px] font-mono font-bold animate-pulse flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-dustybrown-400 animate-ping"></span>
              <span>CASCADE ACTIVE</span>
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-lg bg-cream-100 border border-charcoal-900/10 text-charcoal-700 text-[10px] font-mono font-bold">
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
                {/* Background Line */}
                <line
                  x1={`${fromNode.x}%`}
                  y1={`${fromNode.y}%`}
                  x2={`${toNode.x}%`}
                  y2={`${toNode.y}%`}
                  stroke={isFailingEdge ? '#946D6D' : '#B0CDE6'}
                  strokeWidth={isFailingEdge ? 2.5 : 1.5}
                  strokeDasharray={isFailingEdge ? '6,4' : undefined}
                />

                {/* Animated Flow Vector */}
                {isFailingEdge ? (
                  <circle r="3.5" fill="#946D6D" filter="url(#glowFilter)">
                    <animateMotion
                      path={`M ${fromNode.x * 6} ${fromNode.y * 4} L ${toNode.x * 6} ${toNode.y * 4}`}
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                ) : (
                  <circle r="2" fill="#8FB9DE" opacity="0.8">
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
              className={`absolute z-10 w-44 sm:w-48 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                styles.bg
              } ${styles.glow} ${
                isSelected
                  ? 'ring-2 ring-charcoal-900 shadow-command-lg scale-105 z-30'
                  : 'hover:scale-105 hover:z-20'
              }`}
            >
              {/* Header: Icon + Status Badge */}
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
                  <span>{node.status}</span>
                </span>
              </div>

              {/* Node Name */}
              <div className="font-bold text-xs text-charcoal-900 font-heading truncate">
                {node.name}
              </div>

              {/* Health Bar + Percentage */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-charcoal-500 font-bold">HEALTH</span>
                  <span className="font-bold text-charcoal-900">{node.health}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-cream-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-xl bg-white border border-dustybrown-400 shadow-command-lg flex items-center space-x-3">
            <div className="p-1 rounded-lg bg-dustybrown-100 text-dustybrown-400">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-dustybrown-400">
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
