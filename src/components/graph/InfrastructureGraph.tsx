import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
  NodeTypes,
} from '@xyflow/react';
import { ServiceNode, DependencyEdge, NodeRuntimeState } from '../../types';
import { ServiceNodeCard, CustomServiceNode } from './ServiceNodeCard';

interface InfrastructureGraphProps {
  nodes: ServiceNode[];
  edges: DependencyEdge[];
  runtimeNodes: Record<string, NodeRuntimeState>;
  selectedNodeId: string | null;
  highlightedEdgeIds: string[];
  onSelectNode: (nodeId: string) => void;
}

const nodeTypes: NodeTypes = {
  serviceNode: ServiceNodeCard as unknown as React.ComponentType<any>,
};

export const InfrastructureGraph: React.FC<InfrastructureGraphProps> = ({
  nodes,
  edges,
  runtimeNodes,
  selectedNodeId,
  highlightedEdgeIds,
  onSelectNode,
}) => {
  // Convert domain nodes to React Flow nodes
  const flowNodes: CustomServiceNode[] = useMemo(() => {
    return nodes.map(node => {
      const runtime = runtimeNodes[node.id] || {
        id: node.id,
        state: node.initialState,
        previousState: node.initialState,
        stateChangedAt: 0,
        failedAt: null,
        recoveryStartedAt: null,
        recoveredAt: null,
        activeRecoveryType: null,
        causes: [],
        cascadeDepth: 0,
      };

      return {
        id: node.id,
        type: 'serviceNode' as const,
        position: node.position,
        data: {
          node,
          runtime,
          isSelected: selectedNodeId === node.id,
          onSelect: onSelectNode,
        },
      };
    });
  }, [nodes, runtimeNodes, selectedNodeId, onSelectNode]);

  // Convert domain edges to React Flow edges with dynamic styling
  const flowEdges: Edge[] = useMemo(() => {
    return edges.map(edge => {
      const isHighlighted = highlightedEdgeIds.includes(edge.id);
      const sourceState = runtimeNodes[edge.from]?.state ?? 'HEALTHY';
      const isSourceFailing = sourceState === 'FAILED' || sourceState === 'DEGRADED';

      let strokeColor = 'rgba(56, 189, 248, 0.25)'; // standard cyan/sky edge
      let strokeWidth = 1.5;
      let isAnimated = false;

      if (isHighlighted) {
        strokeColor = '#f43f5e'; // active cascade pulse (red)
        strokeWidth = 3.5;
        isAnimated = true;
      } else if (isSourceFailing) {
        strokeColor = 'rgba(244, 63, 94, 0.6)'; // failed upstream (rose)
        strokeWidth = 2;
      }

      return {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        animated: isAnimated,
        style: {
          stroke: strokeColor,
          strokeWidth,
          transition: 'stroke 0.3s, stroke-width 0.3s',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: strokeColor,
        },
      };
    });
  }, [edges, highlightedEdgeIds, runtimeNodes]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/70 shadow-2xl">
      <ReactFlow
        nodes={flowNodes as Node[]}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#0e7490" gap={28} size={1} />
        <Controls className="!bg-slate-900 !border-slate-800" />
      </ReactFlow>

      {/* Synthetic City Grid Watermark Notice */}
      <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-800/70 text-[10px] font-mono text-slate-400 select-none">
        <span className="text-cyan-400 font-semibold">SYNTHETIC MODEL</span> — JanNagar Resilience Grid
      </div>
    </div>
  );
};
