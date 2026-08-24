import {
  ServiceNode,
  DependencyEdge,
  Scenario,
  SimulationState,
  SimulationEvent,
  SimulationMetrics,
  NodeRuntimeState,
  RecoveryAction,
} from '../types';
import { EventQueue } from './EventQueue';
import { DependencyResolver } from './DependencyResolver';
import { FailurePropagation } from './FailurePropagation';
import { RecoveryManager } from './RecoveryManager';
import { MetricsCalculator } from './MetricsCalculator';
import { ScenarioValidator, ValidationResult } from './ScenarioValidator';

export class SimulationEngine {
  private nodes: ServiceNode[] = [];
  private edges: DependencyEdge[] = [];
  private activeScenario?: Scenario;

  private resolver!: DependencyResolver;
  private propagator!: FailurePropagation;
  private recoveryManager!: RecoveryManager;
  private eventQueue: EventQueue = new EventQueue();

  private currentTime = 0;
  private status: SimulationState['status'] = 'IDLE';
  private runtimeNodes: Record<string, NodeRuntimeState> = {};
  private eventHistory: SimulationEvent[] = [];
  private initialFailuresList: string[] = [];
  private appliedRecoveriesList: RecoveryAction[] = [];
  private highlightedEdgeIds: string[] = [];
  private highlightedNodeIds: string[] = [];

  private eventCounter = { current: 0 };

  constructor(nodes: ServiceNode[], edges: DependencyEdge[]) {
    this.nodes = [...nodes];
    this.edges = [...edges];
    this.setupSubsystems();
    this.reset();
  }

  private setupSubsystems(): void {
    this.resolver = new DependencyResolver(this.nodes, this.edges);
    this.propagator = new FailurePropagation(this.resolver, this.nodes);
    this.recoveryManager = new RecoveryManager(this.nodes);
  }

  public validate(scenario?: Scenario): ValidationResult {
    return ScenarioValidator.validate(this.nodes, this.edges, scenario);
  }

  public initialize(scenario: Scenario): void {
    this.activeScenario = scenario;
    this.reset();

    // 1. Enqueue Initial Failures at their scheduled times (usually T+0)
    for (const failure of scenario.initialFailures) {
      this.injectFailure(failure.nodeId, failure.time);
    }

    // 2. Enqueue Pre-configured Recovery Actions
    for (const recovery of scenario.recoveryActions) {
      this.applyRecovery(recovery);
    }
  }

  public reset(): SimulationState {
    this.currentTime = 0;
    this.status = 'IDLE';
    this.eventQueue.clear();
    this.eventHistory = [];
    this.initialFailuresList = [];
    this.appliedRecoveriesList = [];
    this.highlightedEdgeIds = [];
    this.highlightedNodeIds = [];
    this.eventCounter.current = 0;

    // Initialize all runtime node states to HEALTHY
    this.runtimeNodes = {};
    for (const node of this.nodes) {
      this.runtimeNodes[node.id] = {
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
        isIsolated: false,
        hasBackupPower: false,
        isNetworkRestored: false,
      };
    }

    return this.getState();
  }

  public injectFailure(nodeId: string, timestamp = 0): void {
    if (!this.runtimeNodes[nodeId]) return;

    if (!this.initialFailuresList.includes(nodeId)) {
      this.initialFailuresList.push(nodeId);
    }

    const nodeName = this.nodes.find(n => n.id === nodeId)?.name || nodeId;
    const eventId = `evt-init-fail-${timestamp}-${nodeId}-${++this.eventCounter.current}`;

    const failureEvent: SimulationEvent = {
      id: eventId,
      timestamp,
      type: 'FAILURE_INJECTED',
      targetNode: nodeId,
      previousState: this.runtimeNodes[nodeId].state,
      newState: 'FAILED',
      cause: {
        type: 'INITIAL_FAILURE',
        sourceNodeId: nodeId,
        reason: `Initial disruption injected by operator on ${nodeName}.`,
      },
    };

    this.eventQueue.enqueue(failureEvent, 1);
  }

  public applyRecovery(action: RecoveryAction): void {
    if (!this.runtimeNodes[action.nodeId]) return;

    this.appliedRecoveriesList.push(action);
    this.recoveryManager.scheduleRecovery(
      action,
      this.currentTime,
      this.runtimeNodes,
      this.eventQueue,
      this.eventCounter
    );
  }

  /**
   * Advances simulation by exactly one deterministic event timestamp batch.
   */
  public step(): SimulationState {
    if (this.eventQueue.isEmpty()) {
      this.status = 'COMPLETED';
      return this.getState();
    }

    this.status = 'RUNNING';

    // Dequeue all events occurring at the earliest timestamp
    const batchEvents = this.eventQueue.getEventsAtEarliestTimestamp();
    if (batchEvents.length === 0) {
      this.status = 'COMPLETED';
      return this.getState();
    }

    this.currentTime = batchEvents[0].timestamp;
    const modifiedNodeIds: string[] = [];
    const stepHighlightedEdges: string[] = [];
    const stepHighlightedNodes: string[] = [];

    // Process all events in this timestamp batch
    for (const evt of batchEvents) {
      const targetRuntime = this.runtimeNodes[evt.targetNode];
      if (!targetRuntime) continue;

      targetRuntime.previousState = targetRuntime.state;
      targetRuntime.state = evt.newState;
      targetRuntime.stateChangedAt = this.currentTime;

      if (evt.newState === 'FAILED') {
        targetRuntime.failedAt = this.currentTime;
      } else if (evt.type === 'RECOVERY_STARTED') {
        targetRuntime.recoveryStartedAt = this.currentTime;
      } else if (evt.type === 'RECOVERY_COMPLETED') {
        targetRuntime.recoveredAt = this.currentTime;
        targetRuntime.activeRecoveryType = null;
        targetRuntime.causes = [];
      }

      if (evt.cause.sourceNodeIds && evt.cause.sourceNodeIds.length > 0) {
        targetRuntime.causes = [...evt.cause.sourceNodeIds];
        // Highlight active failing edges
        for (const src of evt.cause.sourceNodeIds) {
          const matchingEdge = this.edges.find(e => e.from === src && e.to === evt.targetNode);
          if (matchingEdge) {
            stepHighlightedEdges.push(matchingEdge.id);
          }
        }
      } else if (evt.cause.sourceNodeId && evt.cause.sourceNodeId !== evt.targetNode) {
        targetRuntime.causes = [evt.cause.sourceNodeId];
        const matchingEdge = this.edges.find(e => e.from === evt.cause.sourceNodeId && e.to === evt.targetNode);
        if (matchingEdge) {
          stepHighlightedEdges.push(matchingEdge.id);
        }
      }

      modifiedNodeIds.push(evt.targetNode);
      stepHighlightedNodes.push(evt.targetNode);
      this.eventHistory.push(evt);
    }

    this.highlightedEdgeIds = Array.from(new Set(stepHighlightedEdges));
    this.highlightedNodeIds = Array.from(new Set(stepHighlightedNodes));

    // Propagate downstream effects of the modified nodes as a unified batch
    this.propagator.propagateBatch(
      modifiedNodeIds,
      this.currentTime,
      this.runtimeNodes,
      this.eventQueue,
      this.eventCounter
    );

    if (this.eventQueue.isEmpty()) {
      this.status = 'COMPLETED';
    }

    return this.getState();
  }

  public runUntil(targetTimestamp: number): SimulationState {
    while (!this.eventQueue.isEmpty() && (this.eventQueue.peekTimestamp() ?? Infinity) <= targetTimestamp) {
      this.step();
    }
    return this.getState();
  }

  public runToCompletion(): SimulationState {
    let safetyLoopGuard = 0;
    while (!this.eventQueue.isEmpty() && safetyLoopGuard < 2000) {
      this.step();
      safetyLoopGuard++;
    }
    this.status = 'COMPLETED';
    return this.getState();
  }

  public getState(): SimulationState {
    const metrics = this.getMetrics();
    return {
      currentTime: this.currentTime,
      status: this.status,
      nodes: { ...this.runtimeNodes },
      events: [...this.eventHistory],
      metrics,
      activeScenarioId: this.activeScenario?.id || 'custom-scenario',
      initialFailures: [...this.initialFailuresList],
      appliedRecoveries: [...this.appliedRecoveriesList],
      highlightedEdgeIds: [...this.highlightedEdgeIds],
      highlightedNodeIds: [...this.highlightedNodeIds],
    };
  }

  public getEvents(): SimulationEvent[] {
    return [...this.eventHistory];
  }

  public getMetrics(): SimulationMetrics {
    return MetricsCalculator.calculate(
      this.runtimeNodes,
      this.initialFailuresList,
      this.eventHistory,
      this.nodes
    );
  }

  public getResolver(): DependencyResolver {
    return this.resolver;
  }

  /**
   * Computes a deterministic 6-character hex hash of the simulation run.
   */
  public getDeterministicHash(): string {
    const payload = JSON.stringify({
      events: this.eventHistory.map((e) => ({
        t: e.timestamp,
        target: e.targetNode,
        type: e.type,
        newState: e.newState,
      })),
      metrics: this.getMetrics(),
    });
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const chr = payload.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(6, '0').slice(0, 6);
  }

  /**
   * Generates a dynamic, graph-derived causal chain explanation for why a node is in its current state.
   */
  public getCausalChain(nodeId: string): {
    targetNodeId: string;
    targetNodeName: string;
    targetState: string;
    isRootFailure: boolean;
    directCauses: string[];
    paths: { id: string; name: string; state: string }[][];
    explanation: string;
  } {
    const node = this.nodes.find((n) => n.id === nodeId);
    const runtime = this.runtimeNodes[nodeId];
    const nodeName = node?.name || nodeId;
    const state = runtime?.state || 'HEALTHY';

    if (this.initialFailuresList.includes(nodeId)) {
      return {
        targetNodeId: nodeId,
        targetNodeName: nodeName,
        targetState: state,
        isRootFailure: true,
        directCauses: [],
        paths: [[{ id: nodeId, name: nodeName, state }]],
        explanation: `${nodeName} is the primary root disruption injected directly at T+00.`,
      };
    }

    // Find all direct failed upstreams
    const directFailedUpstreams = this.resolver
      .getUpstreamNodes(nodeId)
      .filter((upId) => {
        const upState = this.runtimeNodes[upId]?.state;
        return upState === 'FAILED' || upState === 'DEGRADED';
      });

    const directCauseNames = directFailedUpstreams.map(
      (id) => this.nodes.find((n) => n.id === id)?.name || id
    );

    // Reconstruct all paths from any initial failure to nodeId
    const allPaths: { id: string; name: string; state: string }[][] = [];

    const findPaths = (currentId: string, currentPath: string[], visited: Set<string>) => {
      if (currentId === nodeId && currentPath.length > 1) {
        allPaths.push(
          currentPath.map((id) => ({
            id,
            name: this.nodes.find((n) => n.id === id)?.name || id,
            state: this.runtimeNodes[id]?.state || 'UNKNOWN',
          }))
        );
        return;
      }

      const neighbors = this.resolver.getDownstreamNodes(currentId);
      for (const nextId of neighbors) {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          findPaths(nextId, [...currentPath, nextId], visited);
          visited.delete(nextId);
        }
      }
    };

    for (const rootId of this.initialFailuresList) {
      findPaths(rootId, [rootId], new Set([rootId]));
    }

    // Formulate natural language explanation
    let explanation = `${nodeName} is operating normally.`;
    if (state !== 'HEALTHY') {
      if (directFailedUpstreams.length >= 2) {
        explanation = `${nodeName} ${state.toLowerCase()} due to multiple failed dependencies: ${directCauseNames.join(
          ' + '
        )}.`;
      } else if (directFailedUpstreams.length === 1) {
        const directName = directCauseNames[0];
        const longestPath = allPaths.sort((a, b) => b.length - a.length)[0];
        if (longestPath && longestPath.length > 2) {
          const rootName = longestPath[0].name;
          explanation = `${nodeName} ${state.toLowerCase()} because ${directName} became unavailable after the ${rootName} failure.`;
        } else {
          explanation = `${nodeName} ${state.toLowerCase()} directly following failure of ${directName}.`;
        }
      } else {
        explanation = `${nodeName} experienced cascade degradation across municipal grid dependencies.`;
      }
    }

    return {
      targetNodeId: nodeId,
      targetNodeName: nodeName,
      targetState: state,
      isRootFailure: false,
      directCauses: directCauseNames,
      paths: allPaths.length > 0 ? allPaths : [[{ id: nodeId, name: nodeName, state }]],
      explanation,
    };
  }
}

