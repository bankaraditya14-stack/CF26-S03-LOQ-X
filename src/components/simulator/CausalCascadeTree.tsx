import React, { useMemo } from 'react';
import {
  GitBranch,
  ArrowRight,
  Clock,
  Zap,
  Droplet,
  Radio,
  HeartPulse,
  Flame,
  Train,
  Building2,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react';
import { ServiceNode, DependencyEdge, SimulationEvent, NodeStatus } from '../../types';
import { buildCausalCascadeTree } from '../../utils/causalTreeBuilder';

interface CausalCascadeTreeProps {
  nodes: ServiceNode[];
  edges: DependencyEdge[];
  events: SimulationEvent[];
  runtimeStates?: Record<string, { state: NodeStatus; health?: number; load?: number }>;
  onSelectNode?: (nodeId: string) => void;
  onInspectCausalChain?: (nodeId: string) => void;
  isCascadeActive?: boolean;
}

// Map sector type to color styles and icons
const getSectorIcon = (sector: string) => {
  const s = sector.toUpperCase();
  if (s.includes('POWER') || s.includes('ENERGY')) return <Zap className="w-3.5 h-3.5 text-amber-600" />;
  if (s.includes('WATER')) return <Droplet className="w-3.5 h-3.5 text-softblue-600" />;
  if (s.includes('TELECOM') || s.includes('COMM')) return <Radio className="w-3.5 h-3.5 text-indigo-600" />;
  if (s.includes('HEALTH') || s.includes('HOSPITAL')) return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
  if (s.includes('EMERGENCY') || s.includes('FIRE')) return <Flame className="w-3.5 h-3.5 text-orange-600" />;
  if (s.includes('TRANSIT') || s.includes('TRANSPORT')) return <Train className="w-3.5 h-3.5 text-purple-600" />;
  return <Building2 className="w-3.5 h-3.5 text-charcoal-600" />;
};

const getLevelTitle = (depth: number, isLast: boolean): string => {
  if (depth === 0) return 'ROOT DISRUPTION';
  if (depth === 1) return 'DIRECT IMPACT';
  if (depth === 2) return 'DOWNSTREAM CASCADE';
  if (depth === 3) return 'SECONDARY SPREAD';
  if (isLast) return 'FINAL AFFECTED';
  return `CASCADE TIER ${depth}`;
};

export const CausalCascadeTree: React.FC<CausalCascadeTreeProps> = ({
  nodes,
  edges,
  events,
  runtimeStates,
  onSelectNode,
  onInspectCausalChain,
  isCascadeActive = false,
}) => {
  // 1. Build Causal Tree data deterministically from actual engine events
  const treeData = useMemo(() => {
    return buildCausalCascadeTree(nodes, edges, events, runtimeStates);
  }, [nodes, edges, events, runtimeStates]);

  const handleNodeClick = (nodeId: string) => {
    if (onSelectNode) onSelectNode(nodeId);
    if (onInspectCausalChain) onInspectCausalChain(nodeId);
  };

  // Status badge style helper
  const getNodeCardStyles = (state: NodeStatus, isRoot: boolean) => {
    if (state === 'FAILED') {
      return {
        cardBg: 'bg-red-50/90 hover:bg-red-100/90 border-red-300 hover:border-red-400',
        badgeBg: 'bg-red-100 text-red-700 border-red-300',
        glow: isRoot ? 'ring-2 ring-red-400 ring-offset-1' : '',
        dot: 'bg-red-600 animate-pulse',
      };
    }
    if (state === 'DEGRADED') {
      return {
        cardBg: 'bg-amber-50/90 hover:bg-amber-100/90 border-amber-300 hover:border-amber-400',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        glow: '',
        dot: 'bg-amber-500 animate-ping',
      };
    }
    if (state === 'RECOVERING') {
      return {
        cardBg: 'bg-blue-50/90 hover:bg-blue-100/90 border-blue-300 hover:border-blue-400',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
        glow: '',
        dot: 'bg-blue-500 animate-pulse',
      };
    }
    return {
      cardBg: 'bg-emerald-50/60 hover:bg-emerald-100/60 border-emerald-300 hover:border-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      glow: '',
      dot: 'bg-emerald-500',
    };
  };

  return (
    <div className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-charcoal-900/15 shadow-command font-mono select-none space-y-4">
      {/* Header & Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-charcoal-900/10">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-charcoal-900 text-cream-100 shadow-sm">
            <GitBranch className="w-4 h-4 text-cream-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm font-bold text-charcoal-900 uppercase tracking-tight font-heading">
                CAUSAL CASCADE PROPAGATION TREE
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-mutedpurple-100 text-mutedpurple-700 border border-mutedpurple-300">
                DYNAMIC GRAPH
              </span>
            </div>
            <p className="text-[11px] text-charcoal-500 font-sans">
              Deterministic dependency propagation generated from actual simulation events.
            </p>
          </div>
        </div>

        {/* Legend & Stats */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Status Legend */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-cream-50 border border-charcoal-900/10 text-[11px]">
            <span className="flex items-center space-x-1 text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>HEALTHY</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-amber-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>DEGRADED</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-red-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>FAILED</span>
            </span>
          </div>

          {/* Depth / Impact Metric Pill */}
          {treeData.hasCascade && (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-charcoal-900 text-cream-100 font-bold text-[11px] shadow-sm">
              <Layers className="w-3.5 h-3.5 text-mutedpurple-300" />
              <span>DEPTH: {treeData.maxDepth + 1} TIERS</span>
              <span>|</span>
              <span className="text-red-400">{treeData.totalAffected} IMPACTED</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Cascade Tree Visualization Container */}
      {!treeData.hasCascade || treeData.levels.length === 0 ? (
        <div className="py-8 px-4 rounded-xl bg-cream-50 border border-dashed border-charcoal-900/15 flex flex-col items-center justify-center text-center space-y-2">
          <Activity className="w-8 h-8 text-charcoal-400 animate-pulse" />
          <h4 className="text-xs font-bold text-charcoal-700 uppercase">
            AWAITING SIMULATION FAILURE INJECTION
          </h4>
          <p className="text-[11px] text-charcoal-500 font-sans max-w-md">
            Inject a disruption on the left panel or run a predefined benchmark. The causal tree
            will trace the live failure propagation pathway tier-by-tier.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-charcoal-300 scrollbar-track-cream-100">
          <div className="flex items-stretch space-x-3 min-w-max py-1">
            {treeData.levels.map((levelNodes, depth) => {
              const isLastLevel = depth === treeData.levels.length - 1;

              return (
                <React.Fragment key={depth}>
                  {/* Level Column */}
                  <div className="flex flex-col space-y-2.5 min-w-[210px] max-w-[250px]">
                    {/* Tier Column Header */}
                    <div className="px-3 py-1.5 rounded-lg bg-cream-50 border border-charcoal-900/10 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-charcoal-700 tracking-wider">
                        {getLevelTitle(depth, isLastLevel)}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white text-charcoal-600 font-bold border border-charcoal-900/10">
                        L{depth} • {levelNodes.length}
                      </span>
                    </div>

                    {/* Nodes in this level */}
                    <div className="flex flex-col space-y-2.5 flex-1 justify-start">
                      {levelNodes.map((treeNode) => {
                        const style = getNodeCardStyles(treeNode.state, treeNode.isRootFailure);

                        return (
                          <div
                            key={treeNode.id}
                            onClick={() => handleNodeClick(treeNode.id)}
                            className={`p-3 rounded-xl border ${style.cardBg} ${style.glow} transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between space-y-2 group relative`}
                            title={`Click to inspect root-cause: ${treeNode.name}`}
                          >
                            {/* Card Top: Sector & State Badge */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center space-x-1 text-[10px] font-bold text-charcoal-700">
                                {getSectorIcon(treeNode.sector)}
                                <span className="truncate">{treeNode.sector}</span>
                              </div>

                              <div className="flex items-center space-x-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${style.badgeBg}`}
                                >
                                  {treeNode.state}
                                </span>
                              </div>
                            </div>

                            {/* Node Name */}
                            <div>
                              <h4 className="text-xs font-bold text-charcoal-900 group-hover:text-mutedpurple-700 transition-colors leading-tight line-clamp-1">
                                {treeNode.name}
                              </h4>
                              {treeNode.causeReason && (
                                <p className="text-[10px] text-charcoal-600 font-sans mt-0.5 line-clamp-2 leading-tight">
                                  {treeNode.causeReason}
                                </p>
                              )}
                            </div>

                            {/* Card Bottom: Timestamp & Action Pill */}
                            <div className="flex items-center justify-between text-[10px] text-charcoal-500 pt-1 border-t border-charcoal-900/5">
                              <div className="flex items-center space-x-1 font-mono">
                                <Clock className="w-3 h-3 text-charcoal-400" />
                                <span className="font-bold">{treeNode.formattedTime}</span>
                              </div>

                              <div className="flex items-center space-x-0.5 text-mutedpurple-700 group-hover:underline text-[9px] font-bold">
                                <span>WHY?</span>
                                <HelpCircle className="w-2.5 h-2.5" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Level Connector Arrow */}
                  {!isLastLevel && (
                    <div className="flex flex-col items-center justify-center px-1 text-charcoal-400 shrink-0 select-none">
                      <div className="flex items-center space-x-1">
                        <div
                          className={`w-4 h-0.5 ${
                            isCascadeActive ? 'bg-red-400 animate-pulse' : 'bg-charcoal-300'
                          }`}
                        ></div>
                        <ArrowRight
                          className={`w-4 h-4 ${
                            isCascadeActive ? 'text-red-600 animate-bounce' : 'text-charcoal-400'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
