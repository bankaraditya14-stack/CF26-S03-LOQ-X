import {
  SimulationEvent,
  NodeRuntimeState,
  ServiceNode,
} from '../types';
import { DependencyResolver } from './DependencyResolver';
import { EventQueue } from './EventQueue';

export class FailurePropagation {
  private resolver: DependencyResolver;
  private nodesMap: Map<string, ServiceNode>;

  constructor(resolver: DependencyResolver, nodes: ServiceNode[]) {
    this.resolver = resolver;
    this.nodesMap = new Map(nodes.map(n => [n.id, n]));
  }

  /**
   * Evaluates downstream dependents for all nodes that changed state in the current batch.
   * Schedules future state transitions deterministically.
   */
  public propagateBatch(
    modifiedNodeIds: string[],
    currentTimestamp: number,
    runtimeNodes: Record<string, NodeRuntimeState>,
    eventQueue: EventQueue,
    eventCounter: { current: number }
  ): void {
    if (modifiedNodeIds.length === 0) return;

    // Collect all immediate downstream dependents of modified nodes
    const candidateTargetSet = new Set<string>();
    for (const sourceId of modifiedNodeIds) {
      const downstreams = this.resolver.getDownstreamNodes(sourceId);
      downstreams.forEach(d => candidateTargetSet.add(d));
    }

    // Sort deterministically
    const candidateTargets = Array.from(candidateTargetSet).sort();

    for (const targetId of candidateTargets) {
      const targetRuntime = runtimeNodes[targetId];
      if (!targetRuntime) continue;

      // Evaluate new prospective state based on all upstreams
      const impact = this.resolver.evaluateState(targetId, runtimeNodes);

      // If evaluated state is different from current state (or recovery condition changed)
      if (impact.targetState !== targetRuntime.state) {
        // Calculate propagation delay from relevant failing incoming edges
        const incomingEdges = this.resolver
          .getIncomingEdges(targetId)
          .filter(e => impact.failedUpstreams.includes(e.from));

        let delay = 5; // default fallback
        if (incomingEdges.length > 0) {
          // Take the minimum propagation delay among active failing dependencies
          delay = Math.min(...incomingEdges.map(e => e.propagationDelay));
        }

        const scheduledTimestamp = currentTimestamp + delay;

        // Cancel any pending conflicting future events for this target
        eventQueue.removeEventsForNode(targetId, currentTimestamp);

        const targetName = this.nodesMap.get(targetId)?.name || targetId;
        const sourceNames = impact.failedUpstreams
          .map(id => this.nodesMap.get(id)?.name || id)
          .join(', ');

        const eventId = `evt-${scheduledTimestamp}-${targetId}-${++eventCounter.current}`;

        const propagationEvent: SimulationEvent = {
          id: eventId,
          timestamp: scheduledTimestamp,
          type: 'FAILURE_PROPAGATED',
          targetNode: targetId,
          previousState: targetRuntime.state,
          newState: impact.targetState,
          cause: {
            type: 'DEPENDENCY',
            sourceNodeIds: impact.failedUpstreams,
            sourceNodeId: impact.failedUpstreams[0],
            reason:
              impact.targetState === 'HEALTHY'
                ? `Dependencies restored for ${targetName}.`
                : `Cascading failure propagated from [${sourceNames}] to ${targetName}.`,
          },
        };

        eventQueue.enqueue(propagationEvent);
      }
    }
  }
}
