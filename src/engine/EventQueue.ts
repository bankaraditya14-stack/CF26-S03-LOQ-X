import { SimulationEvent, EventType } from '../types';

export interface QueuedEventItem {
  timestamp: number;
  priority: number;
  targetNode: string;
  id: string;
  event: SimulationEvent;
}

const EVENT_TYPE_PRIORITIES: Record<EventType, number> = {
  FAILURE_INJECTED: 1,
  RECOVERY_COMPLETED: 2,
  RECOVERY_STARTED: 3,
  FAILURE_PROPAGATED: 4,
  STATE_CHANGED: 4,
  SCENARIO_STARTED: 0,
  SCENARIO_COMPLETED: 10,
  SCENARIO_RESET: 0,
};

export class EventQueue {
  private queue: QueuedEventItem[] = [];

  public enqueue(event: SimulationEvent, customPriority?: number): void {
    const priority = customPriority ?? (EVENT_TYPE_PRIORITIES[event.type] ?? 5);
    const item: QueuedEventItem = {
      timestamp: event.timestamp,
      priority,
      targetNode: event.targetNode,
      id: event.id,
      event,
    };

    // Insert maintaining deterministic sorted order
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.compare(item, this.queue[i]) < 0) {
        insertIndex = i;
        break;
      }
    }
    this.queue.splice(insertIndex, 0, item);
  }

  private compare(a: QueuedEventItem, b: QueuedEventItem): number {
    // 1. Sort by Timestamp ascending
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    // 2. Sort by Priority ascending (lower = earlier)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // 3. Stable alphabetical sort by targetNode ID
    if (a.targetNode !== b.targetNode) {
      return a.targetNode.localeCompare(b.targetNode);
    }
    // 4. Stable alphabetical sort by event ID
    return a.id.localeCompare(b.id);
  }

  public dequeue(): SimulationEvent | undefined {
    const item = this.queue.shift();
    return item?.event;
  }

  public peek(): SimulationEvent | undefined {
    return this.queue[0]?.event;
  }

  public peekTimestamp(): number | undefined {
    return this.queue[0]?.timestamp;
  }

  public getEventsAtEarliestTimestamp(): SimulationEvent[] {
    if (this.queue.length === 0) return [];
    const earliestTime = this.queue[0].timestamp;
    const events: SimulationEvent[] = [];
    while (this.queue.length > 0 && this.queue[0].timestamp === earliestTime) {
      events.push(this.queue.shift()!.event);
    }
    return events;
  }

  public removeEventsForNode(nodeId: string, afterTimestamp?: number): void {
    this.queue = this.queue.filter(item => {
      if (item.targetNode === nodeId) {
        if (afterTimestamp === undefined || item.timestamp >= afterTimestamp) {
          return false; // Remove
        }
      }
      return true;
    });
  }

  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  public size(): number {
    return this.queue.length;
  }

  public clear(): void {
    this.queue = [];
  }

  public toArray(): SimulationEvent[] {
    return this.queue.map(item => item.event);
  }
}
