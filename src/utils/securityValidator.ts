import { SYNTHETIC_CITY_GRAPH } from '../data/cityGraph';
import { RecoveryAction, RecoveryActionType, Scenario, SimulationMetrics } from '../types';
import { AiGeminiResponse, AiRawStrategy, AiSimulationContext } from '../types/adaptiveRecovery';

// Whitelist of supported recovery action / intervention types
export const ALLOWED_INTERVENTION_TYPES: readonly RecoveryActionType[] = [
  'BACKUP_POWER',
  'ISOLATE',
  'RESTORE_NETWORK',
  'REPAIR',
] as const;

// Extended supported intervention type names from AI proposals
export const EXTENDED_SUPPORTED_INTERVENTION_TYPES = [
  'BACKUP_POWER',
  'REROUTE_POWER',
  'ISOLATE',
  'ISOLATE_NODE',
  'RESTORE_NETWORK',
  'REPAIR',
  'REPAIR_NODE',
  'LOAD_SHEDDING',
  'WATER_BYPASS',
  'EMERGENCY_PRIORITY',
] as const;

// Supported failure types
export const ALLOWED_FAILURE_TYPES = [
  'Equipment Failure',
  'Cyber Attack',
  'Physical Disruption',
  'Extreme Weather Event',
] as const;

// Supported failure severity levels
export const ALLOWED_SEVERITIES = ['LOW', 'MEDIUM', 'CRITICAL'] as const;

// UUID validation regex (RFC 4122 compliant)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * SecurityValidator: Defense-in-depth sanitization, input validation,
 * and AI output trust-boundary enforcement.
 */
export class SecurityValidator {
  private static validNodeIdSet = new Set(SYNTHETIC_CITY_GRAPH.nodes.map((n) => n.id));

  /**
   * Validates whether a string is a strictly compliant UUID.
   */
  public static isValidUuid(value?: string | null): boolean {
    if (!value || typeof value !== 'string') return false;
    return UUID_REGEX.test(value.trim());
  }

  /**
   * Validates whether a string is a safe, sanitized User ID (UUID or alphanumeric ID).
   */
  public static isValidUserId(value?: string | null): boolean {
    if (!value || typeof value !== 'string') return false;
    return /^[a-zA-Z0-9_-]{1,64}$/.test(value.trim());
  }

  /**
   * Validates whether a node ID exists in the synthetic city infrastructure graph.
   */
  public static isValidNodeId(nodeId?: string | null): boolean {
    if (!nodeId || typeof nodeId !== 'string') return false;
    return this.validNodeIdSet.has(nodeId.trim());
  }

  /**
   * Validates a failure type string against the allowed whitelist.
   */
  public static isValidFailureType(type?: string | null): boolean {
    if (!type || typeof type !== 'string') return false;
    return (ALLOWED_FAILURE_TYPES as readonly string[]).includes(type.trim());
  }

  /**
   * Validates a severity string against the allowed whitelist.
   */
  public static isValidSeverity(severity?: string | null): boolean {
    if (!severity || typeof severity !== 'string') return false;
    return (ALLOWED_SEVERITIES as readonly string[]).includes(severity.trim().toUpperCase());
  }

  /**
   * Validates an intervention type against allowed recovery types.
   */
  public static isValidInterventionType(type?: string | null): boolean {
    if (!type || typeof type !== 'string') return false;
    const normalized = type.trim().toUpperCase();
    return (EXTENDED_SUPPORTED_INTERVENTION_TYPES as readonly string[]).includes(normalized);
  }

  /**
   * Maps an extended or raw intervention type to a canonical RecoveryActionType.
   */
  public static mapToCanonicalActionType(rawType?: string | null): RecoveryActionType {
    if (!rawType || typeof rawType !== 'string') return 'REPAIR';
    const upper = rawType.trim().toUpperCase();
    if (upper.includes('POWER') || upper.includes('GENERATOR') || upper.includes('BATTERY') || upper.includes('TURBINE') || upper.includes('SOLAR')) {
      return 'BACKUP_POWER';
    }
    if (upper.includes('NETWORK') || upper.includes('TELECOM') || upper.includes('BYPASS') || upper.includes('FIBER') || upper.includes('RADIO') || upper.includes('RELAY')) {
      return 'RESTORE_NETWORK';
    }
    if (upper.includes('ISOLAT') || upper.includes('SHED') || upper.includes('THROTTL') || upper.includes('AIRGAP') || upper.includes('QUARANTINE') || upper.includes('DIVERT')) {
      return 'ISOLATE';
    }
    return 'REPAIR';
  }

  /**
   * Sanitizes a string input: strips control characters, HTML tags, and trims length.
   */
  public static sanitizeString(input: unknown, maxLength = 120, fallback = ''): string {
    if (typeof input !== 'string') return fallback;
    // Strip HTML tags and control characters
    const cleaned = input
      .replace(/<[^>]*>?/gm, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim();
    if (!cleaned) return fallback;
    return cleaned.slice(0, maxLength);
  }

  /**
   * Bounds a numeric value within [min, max] and rejects NaN / Infinity.
   */
  public static clampNumber(value: unknown, min: number, max: number, defaultValue: number): number {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Validates and sanitizes a complete Scenario object.
   */
  public static validateScenario(scenario: unknown): { valid: boolean; sanitized?: Scenario; errors: string[] } {
    const errors: string[] = [];
    if (!scenario || typeof scenario !== 'object') {
      return { valid: false, errors: ['Scenario payload must be a non-null object'] };
    }

    const s = scenario as Partial<Scenario>;

    const name = this.sanitizeString(s.name, 100, '');
    if (!name) {
      errors.push('Scenario name must be between 1 and 100 characters');
    }

    const description = this.sanitizeString(s.description, 500, '');
    const graphVersion = this.sanitizeString(s.graphVersion, 50, 'city-v1');

    if (!Array.isArray(s.initialFailures) || s.initialFailures.length === 0) {
      errors.push('Scenario must define at least one initial failure');
    }

    const sanitizedFailures = (s.initialFailures || [])
      .filter((f) => {
        if (!f || typeof f !== 'object') return false;
        if (!this.isValidNodeId(f.nodeId)) {
          errors.push(`Invalid node ID "${f.nodeId}" in initial failures`);
          return false;
        }
        if (typeof f.time !== 'number' || Number.isNaN(f.time) || f.time < 0 || f.time > 3600) {
          errors.push(`Invalid initial failure timestamp for node "${f.nodeId}"`);
          return false;
        }
        return true;
      })
      .map((f) => ({
        nodeId: f.nodeId.trim(),
        time: this.clampNumber(f.time, 0, 3600, 0),
      }));

    const sanitizedActions: RecoveryAction[] = (s.recoveryActions || [])
      .filter((a) => {
        if (!a || typeof a !== 'object') return false;
        if (!this.isValidNodeId(a.nodeId)) {
          errors.push(`Invalid node ID "${a.nodeId}" in recovery actions`);
          return false;
        }
        if (!this.isValidInterventionType(a.type)) {
          errors.push(`Invalid recovery action type "${a.type}"`);
          return false;
        }
        if (typeof a.duration !== 'number' || Number.isNaN(a.duration) || a.duration <= 0 || a.duration > 3600) {
          errors.push(`Invalid recovery action duration for node "${a.nodeId}"`);
          return false;
        }
        return true;
      })
      .map((a) => ({
        id: this.sanitizeString(a.id, 64, `rec-${Date.now()}`),
        nodeId: a.nodeId.trim(),
        type: this.mapToCanonicalActionType(a.type),
        startTime: this.clampNumber(a.startTime, 0, 3600, 0),
        duration: this.clampNumber(a.duration, 1, 3600, 10),
        description: this.sanitizeString(a.description, 200, 'Targeted recovery intervention'),
      }));

    const parameters = {
      maxSimulationTime: this.clampNumber(s.parameters?.maxSimulationTime, 10, 300, 60),
      defaultPropagationDelay: this.clampNumber(s.parameters?.defaultPropagationDelay, 1, 60, 5),
      defaultRecoveryDuration: this.clampNumber(s.parameters?.defaultRecoveryDuration, 1, 120, 15),
    };

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      sanitized: {
        id: this.sanitizeString(s.id, 64, `sc-${Date.now()}`),
        name,
        description,
        graphVersion,
        initialFailures: sanitizedFailures,
        parameters,
        recoveryActions: sanitizedActions,
      },
      errors: [],
    };
  }

  /**
   * AI TRUST BOUNDARY ENFORCER:
   * Sanitizes untrusted Gemini JSON output.
   * - Strips hallucinated or invalid node IDs.
   * - Strips injected recovery scores, ranks, and trusted metrics.
   * - Restricts intervention types to whitelisted recovery primitives.
   */
  public static sanitizeGeminiOutput(
    raw: unknown,
    context: AiSimulationContext
  ): AiGeminiResponse {
    if (!raw || typeof raw !== 'object') {
      return this.createSafeFallbackResponse(context);
    }

    const payload = raw as Record<string, unknown>;

    // 1. Sanitize Strategy Helper
    const sanitizeStrategy = (
      strat: unknown,
      fallbackName: string,
      defaultActionType: RecoveryActionType
    ): AiRawStrategy => {
      if (!strat || typeof strat !== 'object') {
        return {
          name: fallbackName,
          priority: 'HIGH',
          reason: 'Emergency cascade mitigation protocol.',
          target_nodes: context.allAffectedNodeIds.slice(0, 2),
          actions: ['Deploy rapid mitigation protocol.'],
          action_type: defaultActionType,
          required_resources: 'Specialized Emergency Response Crew',
        };
      }

      const s = strat as Record<string, unknown>;

      // Explicitly STRIP forbidden metric fields if injected by AI payload
      delete s.recoveryScore;
      delete s.rank;
      delete s.metrics;
      delete s.citizensProtected;
      delete s.impactReduction;
      delete s.cascadeDepth;
      delete s.recoveryTime;

      // Extract & validate target nodes
      let targetNodes: string[] = [];
      if (Array.isArray(s.target_nodes)) {
        targetNodes = s.target_nodes
          .filter((id) => typeof id === 'string' && this.isValidNodeId(id))
          .map((id) => (id as string).trim());
      }

      // If AI hallucinated all target nodes, fallback to context affected nodes
      if (targetNodes.length === 0) {
        targetNodes = context.allAffectedNodeIds.slice(0, 2);
      }

      const rawActionType = typeof s.action_type === 'string' ? s.action_type : '';
      const mappedActionType = this.isValidInterventionType(rawActionType)
        ? this.mapToCanonicalActionType(rawActionType)
        : this.mapToCanonicalActionType(typeof s.name === 'string' ? s.name : defaultActionType);

      const rawPriority = typeof s.priority === 'string' ? s.priority.trim().toUpperCase() : 'HIGH';
      const priority = (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).includes(rawPriority as any)
        ? (rawPriority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')
        : 'HIGH';

      const actions = Array.isArray(s.actions) && s.actions.length > 0
        ? s.actions
            .filter((a) => typeof a === 'string')
            .map((a) => this.sanitizeString(a, 200, 'Execute mitigation step'))
            .slice(0, 5)
        : ['Execute rapid mitigation protocol.'];

      return {
        name: this.sanitizeString(s.name, 80, fallbackName).toUpperCase(),
        priority,
        reason: this.sanitizeString(s.reason, 300, 'AI mitigation strategy to isolate failure and halt cascading disruption.'),
        target_nodes: targetNodes,
        actions,
        action_type: mappedActionType,
        required_resources: this.sanitizeString(s.required_resources, 120, 'Rapid Maintenance Crew + Component Spares'),
      };
    };

    const recommended = sanitizeStrategy(
      payload.recommended_strategy,
      'PRIORITY RESTORATION PROTOCOL',
      'BACKUP_POWER'
    );

    const alternativeStrategies: AiRawStrategy[] = Array.isArray(payload.alternative_strategies)
      ? payload.alternative_strategies
          .slice(0, 3)
          .map((alt, idx) =>
            sanitizeStrategy(
              alt,
              `ALTERNATIVE PROTOCOL 0${idx + 2}`,
              idx === 0 ? 'ISOLATE' : idx === 1 ? 'RESTORE_NETWORK' : 'REPAIR'
            )
          )
      : [];

    const rawConfidence = typeof payload.confidence === 'string' ? payload.confidence.trim().toUpperCase() : 'HIGH';
    const confidence = (['HIGH', 'MEDIUM', 'LOW'] as const).includes(rawConfidence as any)
      ? (rawConfidence as 'HIGH' | 'MEDIUM' | 'LOW')
      : 'HIGH';

    const priorityTargets = Array.isArray(payload.priority_targets) && payload.priority_targets.length > 0
      ? payload.priority_targets
          .filter((t) => typeof t === 'string')
          .map((t) => this.sanitizeString(t, 80, ''))
          .filter(Boolean)
          .slice(0, 5)
      : context.criticalServicesAffected;

    return {
      incident_summary: this.sanitizeString(
        payload.incident_summary,
        300,
        `Disruption on ${context.rootFailureNodeName} triggered multi-tier cascade.`
      ),
      priority_targets: priorityTargets,
      recommended_strategy: recommended,
      alternative_strategies: alternativeStrategies,
      explanation: this.sanitizeString(
        payload.explanation,
        400,
        'Root cause mitigation terminates active cascade loops.'
      ),
      confidence,
    };
  }

  /**
   * Generates a guaranteed safe fallback AI response structure if AI output is malformed.
   */
  public static createSafeFallbackResponse(context: AiSimulationContext): AiGeminiResponse {
    return {
      incident_summary: `Cascade detected originating at ${context.rootFailureNodeName} (${context.rootSector}) affecting ${context.affectedServicesCount} services.`,
      priority_targets: context.criticalServicesAffected.length > 0 ? context.criticalServicesAffected : [context.rootFailureNodeName],
      recommended_strategy: {
        name: 'ISOLATE & ACTIVATE BACKUP CIRCUITS',
        priority: 'CRITICAL',
        reason: 'Mitigates root cause power & network deficits.',
        target_nodes: context.allAffectedNodeIds.slice(0, 2),
        actions: ['Deploy localized backup power.', 'Isolate upstream faulted circuits.'],
        action_type: 'BACKUP_POWER',
        required_resources: 'Mobile 500kVA Diesel Gensets + SCADA Team',
      },
      alternative_strategies: [
        {
          name: 'RAPID COMPONENT REPAIR',
          priority: 'HIGH',
          reason: 'Direct physical restoration of damaged municipal infrastructure.',
          target_nodes: [context.rootFailureNodeId],
          actions: ['Deploy emergency repair crew.'],
          action_type: 'REPAIR',
          required_resources: 'Rapid Maintenance Crew + Component Spares',
        },
      ],
      explanation: `Root Failure (${context.rootFailureNodeName}) -> Sector Strain (${context.rootSector}) -> Priority Intervention shields essential lifelines.`,
      confidence: 'HIGH',
    };
  }

  /**
   * Verifies that metrics correspond to non-forged, valid finite values.
   */
  public static validateSimulationMetrics(metrics: unknown): metrics is SimulationMetrics {
    if (!metrics || typeof metrics !== 'object') return false;
    const m = metrics as Partial<SimulationMetrics>;
    return (
      typeof m.cascadeDepth === 'number' &&
      Number.isFinite(m.cascadeDepth) &&
      m.cascadeDepth >= 0 &&
      typeof m.affectedServices === 'number' &&
      Number.isFinite(m.affectedServices) &&
      m.affectedServices >= 0 &&
      Array.isArray(m.affectedNodeIds) &&
      typeof m.recoveryTime === 'number' &&
      Number.isFinite(m.recoveryTime) &&
      m.recoveryTime >= 0
    );
  }
}
