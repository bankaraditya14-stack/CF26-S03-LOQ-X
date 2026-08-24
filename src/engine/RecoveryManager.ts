import {
  RecoveryAction,
  SimulationEvent,
  NodeRuntimeState,
  ServiceNode,
} from '../types';
import { EventQueue } from './EventQueue';

export class RecoveryManager {
  private nodesMap: Map<string, ServiceNode>;

  constructor(nodes: ServiceNode[]) {
    this.nodesMap = new Map(nodes.map(n => [n.id, n]));
  }

  /**
   * Applies an operator recovery intervention and enqueues recovery events.
   */
  public scheduleRecovery(
    action: RecoveryAction,
    currentTimestamp: number,
    runtimeNodes: Record<string, NodeRuntimeState>,
    eventQueue: EventQueue,
    eventCounter: { current: number }
  ): void {
    const targetRuntime = runtimeNodes[action.nodeId];
    if (!targetRuntime) return;

    const nodeName = this.nodesMap.get(action.nodeId)?.name || action.nodeId;
    const startTimestamp = Math.max(currentTimestamp, action.startTime);
    const completionTimestamp = startTimestamp + action.duration;

    // Remove any conflicting failure events for this node
    eventQueue.removeEventsForNode(action.nodeId, startTimestamp);

    // Apply special mitigation flags
    if (action.type === 'BACKUP_POWER') {
      targetRuntime.hasBackupPower = true;
    } else if (action.type === 'RESTORE_NETWORK') {
      targetRuntime.isNetworkRestored = true;
    } else if (action.type === 'ISOLATE') {
      targetRuntime.isIsolated = true;
    }

    targetRuntime.activeRecoveryType = action.type;

    // 1. Enqueue RECOVERY_STARTED event
    const startEventId = `evt-rec-start-${startTimestamp}-${action.nodeId}-${++eventCounter.current}`;
    const startEvent: SimulationEvent = {
      id: startEventId,
      timestamp: startTimestamp,
      type: 'RECOVERY_STARTED',
      targetNode: action.nodeId,
      previousState: targetRuntime.state,
      newState: 'RECOVERING',
      cause: {
        type: 'RECOVERY_ACTION',
        sourceNodeId: action.nodeId,
        reason: `Operator deployed ${action.type.replace('_', ' ')} mitigation on ${nodeName}.`,
      },
    };
    eventQueue.enqueue(startEvent);

    // 2. Enqueue RECOVERY_COMPLETED event
    const completeEventId = `evt-rec-done-${completionTimestamp}-${action.nodeId}-${++eventCounter.current}`;
    const completeEvent: SimulationEvent = {
      id: completeEventId,
      timestamp: completionTimestamp,
      type: 'RECOVERY_COMPLETED',
      targetNode: action.nodeId,
      previousState: 'RECOVERING',
      newState: 'HEALTHY',
      cause: {
        type: 'RESTORATION',
        sourceNodeId: action.nodeId,
        reason: `${action.type.replace('_', ' ')} operation successfully restored ${nodeName} to full health.`,
      },
    };
    eventQueue.enqueue(completeEvent);
  }
}
