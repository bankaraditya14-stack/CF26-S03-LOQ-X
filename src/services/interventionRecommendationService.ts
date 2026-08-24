import { ServiceNode, RecoveryActionType } from '../types';
import { SYNTHETIC_CITY_GRAPH } from '../data/cityGraph';

export type InterventionStrategyCategory =
  | 'FASTEST'
  | 'MAX_PROTECTION'
  | 'CRITICAL_FIRST'
  | 'LOW_RESOURCE'
  | 'BASELINE';

export type InterventionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type InterventionRisk = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
export type InterventionResource = 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface FailureContext {
  rootFailureNodeId: string;
  rootFailureNodeName: string;
  rootSector: string; // 'POWER' | 'WATER' | 'TELECOM' | 'TRAFFIC' | 'TRANSPORT' | 'HEALTHCARE' | 'EMERGENCY' | 'SEWAGE' | 'FUEL' | 'MUNICIPAL'
  failureType?: string; // 'Equipment Failure' | 'Cyber Attack' | 'Physical Disruption' | 'Extreme Weather Event'
  activeFailedNodeIds: string[];
  activeDegradedNodeIds: string[];
  allAffectedNodeIds: string[];
  causalChain?: Array<{ from: string; to: string; delay: number; reason?: string }>;
  cascadeDepth: number;
  populationAtRisk: number;
  totalServicesCount: number;
  simTimeSec: number;
  criticalNodesAffected: string[];
}

export interface InterventionRecommendation {
  id: string;
  title: string;
  tagline: string;
  strategyCategory: InterventionStrategyCategory;
  description: string;
  rationale: string;
  addressedNodeIds: string[];
  addressedCausalPath: string;
  priority: InterventionPriority;
  risk: InterventionRisk;
  resourceRequirement: InterventionResource;
  score: number;
  projectedStats: {
    populationAffected: { before: string; after: string; deltaNum: number; deltaStr: string };
    servicesAffected: { before: string; after: string; deltaPct: number; deltaStr: string };
    recoveryTime: { before: string; after: string; deltaMin: number; deltaStr: string };
    cascadeDepth: { before: string; after: string; deltaHops: number; deltaStr: string };
    risk: { before: string; after: string };
    improvementPct: number;
  };
  actions: Array<{
    id: string;
    nodeId: string;
    type: RecoveryActionType;
    duration: number;
    description: string;
  }>;
}

interface RawStrategyTemplate {
  idSuffix: string;
  title: string;
  tagline: string;
  strategyCategory: InterventionStrategyCategory;
  description: string;
  rationaleGenerator: (ctx: FailureContext, nodeName: string) => string;
  targetNodeFinder: (ctx: FailureContext) => string[];
  actionType: RecoveryActionType;
  baseDurationMin: number;
  priority: InterventionPriority;
  risk: InterventionRisk;
  resourceRequirement: InterventionResource;
  effectiveness: {
    populationProtectionPct: number;
    servicesProtectionPct: number;
    recoveryTimeReductionPct: number;
    cascadeHopsReduction: number;
    riskAfter: InterventionRisk;
  };
}

export class InterventionRecommendationService {
  private static nodesMap = new Map<string, ServiceNode>(
    SYNTHETIC_CITY_GRAPH.nodes.map((n) => [n.id, n])
  );

  /**
   * Helper to format numbers with commas
   */
  private static formatNum(n: number): string {
    return Math.round(n).toLocaleString('en-US');
  }

  /**
   * Resolve node name safely
   */
  private static getNodeName(nodeId: string): string {
    return this.nodesMap.get(nodeId)?.name || nodeId;
  }

  /**
   * Computes mathematical scoring for an intervention:
   * INTERVENTION SCORE =
   * Expected Impact Reduction + Critical Infrastructure Protection +
   * Population Protection + Recovery Speed - Resource Cost - Implementation Delay - Secondary Risk
   */
  public static calculateScore(
    improvementPct: number,
    popProtected: number,
    hopsReduction: number,
    timeSavedMin: number,
    resource: InterventionResource,
    risk: InterventionRisk,
    hasCriticalProtection: boolean
  ): number {
    let score = improvementPct * 0.9;
    score += (popProtected / 1000) * 0.6;
    score += hopsReduction * 6;
    score += timeSavedMin * 1.5;
    if (hasCriticalProtection) score += 12;

    const resourcePenaltyMap: Record<InterventionResource, number> = {
      MINIMAL: 1,
      LOW: 3,
      MODERATE: 6,
      HIGH: 11,
      CRITICAL: 16,
    };
    score -= resourcePenaltyMap[resource] || 5;

    const riskPenaltyMap: Record<InterventionRisk, number> = {
      LOW: 1,
      MODERATE: 4,
      ELEVATED: 8,
      HIGH: 14,
    };
    score -= riskPenaltyMap[risk] || 5;

    return Math.max(1, Math.round(score));
  }

  /**
   * Primary entry point: Generates 3-4 distinct failure-specific and dependency-aware
   * recovery strategies + 1 baseline "NO INTERVENTION" option.
   */
  public static getRecommendations(context: FailureContext): InterventionRecommendation[] {
    const rootNode = this.nodesMap.get(context.rootFailureNodeId);
    const rootSector = context.rootSector || rootNode?.type || 'POWER';
    const isCyber =
      context.failureType?.toLowerCase().includes('cyber') ||
      context.rootFailureNodeId.includes('cyber');

    // Determine strategy templates based on root sector and cyber attributes
    const templates = this.getSectorTemplates(rootSector, isCyber);

    // Contextual baseline metrics
    const basePopAtRisk = Math.max(12000, context.populationAtRisk || 42500);
    const baseAffectedCount = Math.max(1, context.allAffectedNodeIds.length || 3);
    const baseAffectedPct = Math.min(
      95,
      Math.max(25, Math.round((baseAffectedCount / (context.totalServicesCount || 13)) * 100))
    );
    const baseRecoveryMin = Math.max(25, 20 + context.cascadeDepth * 5 + baseAffectedCount * 2);
    const baseDepth = Math.max(1, context.cascadeDepth || 3);

    // Build the 4 active strategy candidates
    const recommendations: InterventionRecommendation[] = templates.map((tmpl) => {
      const addressedNodeIds = tmpl.targetNodeFinder(context);
      const addressedNodeNames = addressedNodeIds.map((id) => this.getNodeName(id));
      const rootName = context.rootFailureNodeName || this.getNodeName(context.rootFailureNodeId);

      // Construct causal path description
      let addressedCausalPath = `${rootName} → ${addressedNodeNames.join(' → ')}`;
      if (addressedNodeIds.length === 1 && addressedNodeIds[0] === context.rootFailureNodeId) {
        addressedCausalPath = `${rootName} (Direct Node Action)`;
      }

      // Check if critical nodes are protected
      const protectsCritical = addressedNodeIds.some((id) => {
        const n = this.nodesMap.get(id);
        return n?.criticality === 'HIGH' || id === 'hospital-apex' || id === 'emergency-dispatch';
      });

      // Calculate projected statistics dynamically
      const eff = tmpl.effectiveness;
      const popProtectedNum = Math.round(basePopAtRisk * (eff.populationProtectionPct / 100));
      const popAfterNum = Math.max(0, basePopAtRisk - popProtectedNum);

      const servicesProtectedDeltaPct = Math.round(baseAffectedPct * (eff.servicesProtectionPct / 100));
      const servicesAfterPct = Math.max(8, baseAffectedPct - servicesProtectedDeltaPct);

      const timeSavedMin = Math.round(baseRecoveryMin * (eff.recoveryTimeReductionPct / 100));
      const timeAfterMin = Math.max(8, baseRecoveryMin - timeSavedMin);

      const hopsReductionNum = Math.min(baseDepth, eff.cascadeHopsReduction);
      const depthAfterHops = Math.max(0, baseDepth - hopsReductionNum);

      const improvementPct = Math.round(
        eff.populationProtectionPct * 0.4 +
          eff.servicesProtectionPct * 0.35 +
          eff.recoveryTimeReductionPct * 0.25
      );

      const score = this.calculateScore(
        improvementPct,
        popProtectedNum,
        hopsReductionNum,
        timeSavedMin,
        tmpl.resourceRequirement,
        tmpl.risk,
        protectsCritical
      );

      const actions = addressedNodeIds.map((nodeId, idx) => ({
        id: `rec-${tmpl.idSuffix}-${nodeId}-${idx + 1}`,
        nodeId,
        type: tmpl.actionType,
        duration: tmpl.baseDurationMin,
        description: `${tmpl.title} on ${this.getNodeName(nodeId)}`,
      }));

      return {
        id: `rec-${tmpl.idSuffix}`,
        title: tmpl.title,
        tagline: tmpl.tagline,
        strategyCategory: tmpl.strategyCategory,
        description: tmpl.description,
        rationale: tmpl.rationaleGenerator(context, rootName),
        addressedNodeIds,
        addressedCausalPath,
        priority: tmpl.priority,
        risk: tmpl.risk,
        resourceRequirement: tmpl.resourceRequirement,
        score,
        projectedStats: {
          populationAffected: {
            before: this.formatNum(basePopAtRisk),
            after: this.formatNum(popAfterNum),
            deltaNum: popProtectedNum,
            deltaStr: `-${this.formatNum(popProtectedNum)}`,
          },
          servicesAffected: {
            before: `${baseAffectedPct}%`,
            after: `${servicesAfterPct}%`,
            deltaPct: servicesProtectedDeltaPct,
            deltaStr: `-${servicesProtectedDeltaPct}%`,
          },
          recoveryTime: {
            before: `${baseRecoveryMin} min`,
            after: `${timeAfterMin} min`,
            deltaMin: timeSavedMin,
            deltaStr: `-${timeSavedMin} min`,
          },
          cascadeDepth: {
            before: `${baseDepth} hops`,
            after: `${depthAfterHops} hops`,
            deltaHops: hopsReductionNum,
            deltaStr: `-${hopsReductionNum} hops`,
          },
          risk: {
            before: 'CRITICAL',
            after: eff.riskAfter,
          },
          improvementPct,
        },
        actions,
      };
    });

    // Sort by calculated score (highest score first)
    recommendations.sort((a, b) => b.score - a.score);

    // Baseline: "NO INTERVENTION"
    const baselineRecommendation: InterventionRecommendation = {
      id: 'none',
      title: 'NO INTERVENTION',
      tagline: 'Passive Observation (Baseline)',
      strategyCategory: 'BASELINE',
      description: 'Allow the cascading failure to propagate unmitigated across all interconnected downstream dependencies.',
      rationale: `Observes the raw cascade physics without dispatcher interference. Demonstrates worst-case propagation from ${
        context.rootFailureNodeName || 'Root Node'
      } across ${baseAffectedCount} dependent services.`,
      addressedNodeIds: [],
      addressedCausalPath: 'None (Unmitigated Failure Path)',
      priority: 'LOW',
      risk: 'HIGH',
      resourceRequirement: 'MINIMAL',
      score: 0,
      projectedStats: {
        populationAffected: {
          before: this.formatNum(basePopAtRisk),
          after: this.formatNum(basePopAtRisk),
          deltaNum: 0,
          deltaStr: '0',
        },
        servicesAffected: {
          before: `${baseAffectedPct}%`,
          after: `${baseAffectedPct}%`,
          deltaPct: 0,
          deltaStr: '0%',
        },
        recoveryTime: {
          before: `${baseRecoveryMin} min`,
          after: `${baseRecoveryMin} min`,
          deltaMin: 0,
          deltaStr: '0 min',
        },
        cascadeDepth: {
          before: `${baseDepth} hops`,
          after: `${baseDepth} hops`,
          deltaHops: 0,
          deltaStr: '0 hops',
        },
        risk: {
          before: 'CRITICAL',
          after: 'CRITICAL',
        },
        improvementPct: 0,
      },
      actions: [],
    };

    return [...recommendations, baselineRecommendation];
  }

  /**
   * Helper to retrieve sector-specific templates
   */
  private static getSectorTemplates(sector: string, isCyber: boolean): RawStrategyTemplate[] {
    if (isCyber) {
      return this.getCyberTemplates();
    }

    switch (sector.toUpperCase()) {
      case 'POWER':
        return this.getPowerTemplates();
      case 'WATER':
        return this.getWaterTemplates();
      case 'TELECOM':
        return this.getTelecomTemplates();
      case 'TRAFFIC':
        return this.getTrafficTemplates();
      case 'TRANSPORT':
      case 'TRANSIT':
        return this.getTransitTemplates();
      case 'HOSPITAL':
      case 'HEALTHCARE':
        return this.getHealthcareTemplates();
      case 'EMERGENCY':
        return this.getEmergencyTemplates();
      case 'SEWAGE':
      case 'INDUSTRY':
        return this.getSewageTemplates();
      default:
        return this.getPowerTemplates();
    }
  }

  // ============================================================================
  // 1. POWER FAILURE TEMPLATES
  // ============================================================================
  private static getPowerTemplates(): RawStrategyTemplate[] {
    return [
      {
        idSuffix: 'power-reroute',
        title: 'REROUTE ELECTRICAL SUPPLY',
        tagline: 'Bus-Tie & Sector Relay Bypass',
        strategyCategory: 'FASTEST',
        description: 'Redirect available power through North-East Substation 132kV bus tie to restore essential feeders.',
        rationaleGenerator: (_ctx, name) =>
          `${name} suffered a transmission trip. Switching to the North-East 132kV regional relay provides the fastest bypass circuit without mobilizing heavy field equipment.`,
        targetNodeFinder: (_ctx) => ['power-grid-sub'],
        actionType: 'REPAIR',
        baseDurationMin: 7,
        priority: 'HIGH',
        risk: 'MODERATE',
        resourceRequirement: 'LOW',
        effectiveness: {
          populationProtectionPct: 56,
          servicesProtectionPct: 50,
          recoveryTimeReductionPct: 48,
          cascadeHopsReduction: 2,
          riskAfter: 'MODERATE',
        },
      },
      {
        idSuffix: 'power-distributed-gen',
        title: 'DEPLOY AUXILIARY GENERATOR FLEET',
        tagline: 'Multi-Substation Backup Generation',
        strategyCategory: 'MAX_PROTECTION',
        description: 'Deploy emergency diesel generators to critical water pumping turbines and telecommunication cores.',
        rationaleGenerator: (ctx, name) => {
          const hasWaterDownstream = ctx.allAffectedNodeIds.includes('water-treatment-pump');
          return hasWaterDownstream
            ? `${name} blackout severed electricity to the Raw Water Intake Station. Deploying auxiliary generation directly to pumps prevents citywide water supply depletion.`
            : `${name} blackout severed electricity to downstream sectors. Deploying generator units isolates key urban hubs from the cascading power cut.`;
        },
        targetNodeFinder: (ctx) => {
          const targets = ['water-treatment-pump', 'telecom-core'];
          if (ctx.allAffectedNodeIds.includes('power-grid-sub')) targets.push('power-grid-sub');
          return targets;
        },
        actionType: 'BACKUP_POWER',
        baseDurationMin: 9,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'HIGH',
        effectiveness: {
          populationProtectionPct: 74,
          servicesProtectionPct: 65,
          recoveryTimeReductionPct: 55,
          cascadeHopsReduction: 3,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'power-hospital-priority',
        title: 'PRIORITIZE HOSPITAL & 112 DISPATCH',
        tagline: 'Microgrid Islanding Protocol',
        strategyCategory: 'CRITICAL_FIRST',
        description: 'Isolate Civil Apex Hospital and 112 Emergency Dispatch onto dedicated priority generator microgrids.',
        rationaleGenerator: (_ctx, name) =>
          `Apex Trauma Center and Emergency 112 Dispatch face imminent power loss from ${name}. Microgrid islanding shields intensive care units and dispatch queues regardless of grid state.`,
        targetNodeFinder: (_ctx) => ['hospital-apex', 'emergency-dispatch'],
        actionType: 'BACKUP_POWER',
        baseDurationMin: 6,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'MODERATE',
        effectiveness: {
          populationProtectionPct: 62,
          servicesProtectionPct: 45,
          recoveryTimeReductionPct: 40,
          cascadeHopsReduction: 2,
          riskAfter: 'MODERATE',
        },
      },
      {
        idSuffix: 'power-load-shedding',
        title: 'SELECTIVE NON-ESSENTIAL LOAD SHEDDING',
        tagline: 'Circuit Demand Curtailment',
        strategyCategory: 'LOW_RESOURCE',
        description: 'Shed non-essential municipal transit and industrial circuits to preserve essential grid distribution stability.',
        rationaleGenerator: (_ctx, name) =>
          `Grid overload from ${name} risks total collapse. Throttling non-critical industrial circuits stabilizes frequency without capital mobilization costs.`,
        targetNodeFinder: (_ctx) => ['public-transit', 'sewage-treatment'],
        actionType: 'ISOLATE',
        baseDurationMin: 4,
        priority: 'MEDIUM',
        risk: 'MODERATE',
        resourceRequirement: 'MINIMAL',
        effectiveness: {
          populationProtectionPct: 44,
          servicesProtectionPct: 35,
          recoveryTimeReductionPct: 32,
          cascadeHopsReduction: 1,
          riskAfter: 'ELEVATED',
        },
      },
    ];
  }

  // ============================================================================
  // 2. WATER SUPPLY / WATER PUMP TEMPLATES
  // ============================================================================
  private static getWaterTemplates(): RawStrategyTemplate[] {
    return [
      {
        idSuffix: 'water-backup-turbines',
        title: 'ACTIVATE BACKUP INTAKE PUMP TURBINES',
        tagline: 'Auxiliary Turbine Fast Engagement',
        strategyCategory: 'FASTEST',
        description: 'Engage secondary standby intake turbines to restore hydrostatic head pressure to main distribution.',
        rationaleGenerator: (_ctx, name) =>
          `${name} lost turbine feed pressure. Starting standby auxiliary intake pumps restores raw water throughput directly at the intake facility in minimum operational time.`,
        targetNodeFinder: (_ctx) => ['water-treatment-pump'],
        actionType: 'REPAIR',
        baseDurationMin: 6,
        priority: 'HIGH',
        risk: 'LOW',
        resourceRequirement: 'LOW',
        effectiveness: {
          populationProtectionPct: 68,
          servicesProtectionPct: 62,
          recoveryTimeReductionPct: 52,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'water-tanker-fleet',
        title: 'DEPLOY EMERGENCY WATER TANKER FLEET',
        tagline: 'Municipal Mobile Potable Tanker Grid',
        strategyCategory: 'MAX_PROTECTION',
        description: 'Mobilize 40 high-capacity potable water tankers to supply residential distribution nodes and community centers.',
        rationaleGenerator: (_ctx, name) =>
          `${name} failure is causing severe water distribution deficits. Dispatching the municipal tanker fleet bridges domestic water needs across all affected residential wards.`,
        targetNodeFinder: (_ctx) => ['water-distribution', 'water-treatment-pump'],
        actionType: 'BACKUP_POWER',
        baseDurationMin: 10,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'HIGH',
        effectiveness: {
          populationProtectionPct: 78,
          servicesProtectionPct: 58,
          recoveryTimeReductionPct: 45,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'water-hospital-reserves',
        title: 'DIVERT RESERVOIR RESERVES FOR HOSPITALS',
        tagline: 'Dedicated Medical Sanitation Feed',
        strategyCategory: 'CRITICAL_FIRST',
        description: 'Divert gravity-fed reservoir reserves exclusively to Civil Apex Hospital to safeguard surgical and dialysis operations.',
        rationaleGenerator: (_ctx, name) =>
          `Loss of pressure from ${name} threatens hospital sterilization and patient care. Diverting reservoir lines creates an isolated water lifeline for Apex Trauma Center.`,
        targetNodeFinder: (_ctx) => ['hospital-apex', 'water-distribution'],
        actionType: 'ISOLATE',
        baseDurationMin: 5,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'MODERATE',
        effectiveness: {
          populationProtectionPct: 58,
          servicesProtectionPct: 48,
          recoveryTimeReductionPct: 42,
          cascadeHopsReduction: 2,
          riskAfter: 'MODERATE',
        },
      },
      {
        idSuffix: 'water-pressure-throttling',
        title: 'ZONAL PRESSURE REDUCTION & RESTRICTION',
        tagline: 'Gravity Main Conservation Protocol',
        strategyCategory: 'LOW_RESOURCE',
        description: 'Throttle distribution mains by 40% to conserve reservoir reserves and prevent header tank cavitation.',
        rationaleGenerator: (_ctx, name) =>
          `Extends available municipal reservoir duration by 300% during the ${name} outage without requiring heavy machinery deployments.`,
        targetNodeFinder: (_ctx) => ['water-distribution'],
        actionType: 'ISOLATE',
        baseDurationMin: 4,
        priority: 'MEDIUM',
        risk: 'MODERATE',
        resourceRequirement: 'MINIMAL',
        effectiveness: {
          populationProtectionPct: 42,
          servicesProtectionPct: 34,
          recoveryTimeReductionPct: 30,
          cascadeHopsReduction: 1,
          riskAfter: 'ELEVATED',
        },
      },
    ];
  }

  // ============================================================================
  // 3. TELECOM FAILURE TEMPLATES
  // ============================================================================
  private static getTelecomTemplates(): RawStrategyTemplate[] {
    return [
      {
        idSuffix: 'telecom-fiber-bypass',
        title: 'SWITCH TO REDUNDANT OPTICAL BACKBONE',
        tagline: 'Dense Wavelength (DWDM) Trunk Bypass',
        strategyCategory: 'FASTEST',
        description: 'Reroute metropolitan data packets via southern ring optical trunk to re-establish backbone backhaul.',
        rationaleGenerator: (_ctx, name) =>
          `${name} optical core failure disconnected municipal telemetry. Switching to the southern redundant fiber bypass restores data routing instantaneously.`,
        targetNodeFinder: (_ctx) => ['telecom-core'],
        actionType: 'RESTORE_NETWORK',
        baseDurationMin: 5,
        priority: 'HIGH',
        risk: 'LOW',
        resourceRequirement: 'LOW',
        effectiveness: {
          populationProtectionPct: 64,
          servicesProtectionPct: 62,
          recoveryTimeReductionPct: 56,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'telecom-cow-fleet',
        title: 'DEPLOY CELL-ON-WHEELS (COW) MOBILE MESH',
        tagline: 'Rapid Mobile Base Station Deployment',
        strategyCategory: 'MAX_PROTECTION',
        description: 'Position 6 mobile telecom trucks to restore public cellular voice, emergency SMS, and SCADA links.',
        rationaleGenerator: (_ctx, name) =>
          `Severe wireless outage originating from ${name}. Mobile cellular transmitters re-establish voice communications and public alert channels across all city wards.`,
        targetNodeFinder: (_ctx) => ['telecom-tower-north', 'telecom-core'],
        actionType: 'BACKUP_POWER',
        baseDurationMin: 8,
        priority: 'HIGH',
        risk: 'LOW',
        resourceRequirement: 'HIGH',
        effectiveness: {
          populationProtectionPct: 76,
          servicesProtectionPct: 58,
          recoveryTimeReductionPct: 46,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'telecom-satellite-link',
        title: 'ACTIVATE 112 SATELLITE EMERGENCY LINK',
        tagline: 'LEO Disaster Communications Trunk',
        strategyCategory: 'CRITICAL_FIRST',
        description: 'Switch Emergency 112 Dispatch and Hospital telemetry to dedicated encrypted satellite channels.',
        rationaleGenerator: (_ctx, name) =>
          `Fiber collapse at ${name} threatens 112 emergency call routing. Activating satellite links guarantees ambulance dispatch remains 100% operational.`,
        targetNodeFinder: (_ctx) => ['emergency-dispatch', 'hospital-apex'],
        actionType: 'RESTORE_NETWORK',
        baseDurationMin: 4,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'MODERATE',
        effectiveness: {
          populationProtectionPct: 60,
          servicesProtectionPct: 48,
          recoveryTimeReductionPct: 44,
          cascadeHopsReduction: 2,
          riskAfter: 'MODERATE',
        },
      },
      {
        idSuffix: 'telecom-bandwidth-throttling',
        title: 'EMERGENCY-ONLY BANDWIDTH SHAPING',
        tagline: 'QoS SCADA & Voice Priority Shaping',
        strategyCategory: 'LOW_RESOURCE',
        description: 'Throttle commercial video/data streaming to prioritize emergency SCADA packets and 112 voice trunks.',
        rationaleGenerator: (_ctx, name) =>
          `Congestion management on ${name} restores emergency telemetry throughput via software traffic shaping with zero hardware cost.`,
        targetNodeFinder: (_ctx) => ['telecom-core'],
        actionType: 'ISOLATE',
        baseDurationMin: 3,
        priority: 'MEDIUM',
        risk: 'LOW',
        resourceRequirement: 'MINIMAL',
        effectiveness: {
          populationProtectionPct: 46,
          servicesProtectionPct: 38,
          recoveryTimeReductionPct: 35,
          cascadeHopsReduction: 1,
          riskAfter: 'ELEVATED',
        },
      },
    ];
  }

  // ============================================================================
  // 4. TRAFFIC SIGNAL FAILURE TEMPLATES
  // ============================================================================
  private static getTrafficTemplates(): RawStrategyTemplate[] {
    return [
      {
        idSuffix: 'traffic-local-controllers',
        title: 'ACTIVATE AUTONOMOUS BACKUP CONTROLLERS',
        tagline: 'Fixed-Interval Local Failsafe',
        strategyCategory: 'FASTEST',
        description: 'Switch dark arterial traffic signals to decentralized yellow-flash and fixed-time sequencing.',
        rationaleGenerator: (_ctx, name) =>
          `${name} lost central synchronization. Switching controllers to autonomous fixed-time mode eliminates intersection blackout in minutes.`,
        targetNodeFinder: (_ctx) => ['traffic-control'],
        actionType: 'REPAIR',
        baseDurationMin: 4,
        priority: 'HIGH',
        risk: 'LOW',
        resourceRequirement: 'LOW',
        effectiveness: {
          populationProtectionPct: 62,
          servicesProtectionPct: 55,
          recoveryTimeReductionPct: 52,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'traffic-police-marshaling',
        title: 'DEPLOY TRAFFIC POLICE & CORRIDOR MARSHALS',
        tagline: 'Manual Junction Marshaling Grid',
        strategyCategory: 'MAX_PROTECTION',
        description: 'Deploy traffic police officers to 14 core arterial bottlenecks to break gridlock and manage flow.',
        rationaleGenerator: (_ctx, name) =>
          `Gridlock triggered by ${name} threatens transit routes. Manual officer deployment clears arterial bottlenecks and prevents secondary collisions.`,
        targetNodeFinder: (_ctx) => ['traffic-control', 'public-transit'],
        actionType: 'REPAIR',
        baseDurationMin: 8,
        priority: 'HIGH',
        risk: 'MODERATE',
        resourceRequirement: 'MODERATE',
        effectiveness: {
          populationProtectionPct: 72,
          servicesProtectionPct: 58,
          recoveryTimeReductionPct: 44,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'traffic-green-wave',
        title: 'ESTABLISH EMERGENCY GREEN CORRIDORS',
        tagline: '112 Ambulance Priority Route',
        strategyCategory: 'CRITICAL_FIRST',
        description: 'Override signals along the Civic Center-to-Trauma Hospital arterial to give emergency vehicles continuous green lights.',
        rationaleGenerator: (_ctx, name) =>
          `Traffic failure at ${name} delays emergency ambulances. Establishing green wave corridors guarantees rapid hospital trauma access.`,
        targetNodeFinder: (_ctx) => ['traffic-control', 'emergency-dispatch', 'hospital-apex'],
        actionType: 'ISOLATE',
        baseDurationMin: 5,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'LOW',
        effectiveness: {
          populationProtectionPct: 58,
          servicesProtectionPct: 46,
          recoveryTimeReductionPct: 40,
          cascadeHopsReduction: 2,
          riskAfter: 'MODERATE',
        },
      },
      {
        idSuffix: 'traffic-perimeter-diversion',
        title: 'DYNAMIC PERIMETER ROAD DIVERSION',
        tagline: 'Orbital Ring Road Inflow Restriction',
        strategyCategory: 'LOW_RESOURCE',
        description: 'Divert passenger vehicles to outer orbital ring roads using variable message signs to relieve inner city congestion.',
        rationaleGenerator: (_ctx, name) =>
          `Restricting incoming private vehicles during ${name} outage reduces core junction load by 60% with zero physical equipment deployment.`,
        targetNodeFinder: (_ctx) => ['traffic-control'],
        actionType: 'ISOLATE',
        baseDurationMin: 3,
        priority: 'MEDIUM',
        risk: 'LOW',
        resourceRequirement: 'MINIMAL',
        effectiveness: {
          populationProtectionPct: 45,
          servicesProtectionPct: 36,
          recoveryTimeReductionPct: 32,
          cascadeHopsReduction: 1,
          riskAfter: 'ELEVATED',
        },
      },
    ];
  }

  // ============================================================================
  // 5. TRANSIT FAILURE TEMPLATES
  // ============================================================================
  private static getTransitTemplates(): RawStrategyTemplate[] {
    return [
      {
        idSuffix: 'transit-bus-bridge',
        title: 'DEPLOY SHUTTLE BUS REPLACEMENT BRIGADE',
        tagline: 'Rapid Surface Bus Bridging',
        strategyCategory: 'FASTEST',
        description: 'Mobilize emergency municipal diesel bus fleet to bridge disrupted metro rail and transit corridors.',
        rationaleGenerator: (_ctx, name) =>
          `${name} disruption stranded commuter rail lines. Emergency shuttle bridging restores public mobility along high-volume transit arteries.`,
        targetNodeFinder: (_ctx) => ['public-transit'],
        actionType: 'REPAIR',
        baseDurationMin: 6,
        priority: 'HIGH',
        risk: 'LOW',
        resourceRequirement: 'MODERATE',
        effectiveness: {
          populationProtectionPct: 68,
          servicesProtectionPct: 56,
          recoveryTimeReductionPct: 50,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'transit-multi-modal',
        title: 'ACTIVATE MULTI-MODAL COMMUTER REDIRECTION',
        tagline: 'Park-and-Ride & Feeder Routing',
        strategyCategory: 'MAX_PROTECTION',
        description: 'Increase bus frequencies on parallel routes and open temporary park-and-ride commuter distribution hubs.',
        rationaleGenerator: (_ctx, name) =>
          `Spillover from ${name} threatens civic mobility. Multi-modal redirection spreads passenger load across secondary urban transport corridors.`,
        targetNodeFinder: (_ctx) => ['public-transit', 'traffic-control'],
        actionType: 'RESTORE_NETWORK',
        baseDurationMin: 9,
        priority: 'HIGH',
        risk: 'LOW',
        resourceRequirement: 'HIGH',
        effectiveness: {
          populationProtectionPct: 75,
          servicesProtectionPct: 54,
          recoveryTimeReductionPct: 42,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'transit-emergency-clearance',
        title: 'RESERVE TRANSIT RIGHTS-OF-WAY FOR FIRST RESPONDERS',
        tagline: 'Dedicated Emergency Mobility',
        strategyCategory: 'CRITICAL_FIRST',
        description: 'Clear dedicated bus lanes and metro rights-of-way exclusively for disaster recovery and emergency vehicles.',
        rationaleGenerator: (_ctx, name) =>
          `Transit paralysis from ${name} must not delay critical relief. Reserving transit corridors gives emergency vehicles unhindered access.`,
        targetNodeFinder: (_ctx) => ['public-transit', 'emergency-dispatch'],
        actionType: 'ISOLATE',
        baseDurationMin: 4,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'LOW',
        effectiveness: {
          populationProtectionPct: 55,
          servicesProtectionPct: 45,
          recoveryTimeReductionPct: 38,
          cascadeHopsReduction: 1,
          riskAfter: 'MODERATE',
        },
      },
      {
        idSuffix: 'transit-station-metering',
        title: 'STAGGERED STATION TURNSTILE METERING',
        tagline: 'Platform Inflow Control Protocol',
        strategyCategory: 'LOW_RESOURCE',
        description: 'Throttle turnstile entry at major transit interchanges to prevent hazardous platform overcrowding.',
        rationaleGenerator: (_ctx, name) =>
          `Controls crowd inflow at major hubs during ${name} outage without requiring supplemental vehicle fleets.`,
        targetNodeFinder: (_ctx) => ['public-transit'],
        actionType: 'ISOLATE',
        baseDurationMin: 3,
        priority: 'MEDIUM',
        risk: 'LOW',
        resourceRequirement: 'MINIMAL',
        effectiveness: {
          populationProtectionPct: 42,
          servicesProtectionPct: 32,
          recoveryTimeReductionPct: 28,
          cascadeHopsReduction: 1,
          riskAfter: 'ELEVATED',
        },
      },
    ];
  }

  // ============================================================================
  // 6. HEALTHCARE / HOSPITAL FAILURE TEMPLATES
  // ============================================================================
  private static getHealthcareTemplates(): RawStrategyTemplate[] {
    return [
      {
        idSuffix: 'hospital-aux-power-oxygen',
        title: 'ENGAGE HOSPITAL AUXILIARY POWER & OXYGEN',
        tagline: 'On-Site Critical Redundancy',
        strategyCategory: 'FASTEST',
        description: 'Switch intensive care units, surgical suites, and ventilators to on-site emergency fuel and oxygen buffers.',
        rationaleGenerator: (_ctx, name) =>
          `${name} disruption puts patients at critical risk. Activating on-site emergency reserves secures surgical theaters in under 5 minutes.`,
        targetNodeFinder: (_ctx) => ['hospital-apex'],
        actionType: 'BACKUP_POWER',
        baseDurationMin: 5,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'LOW',
        effectiveness: {
          populationProtectionPct: 70,
          servicesProtectionPct: 60,
          recoveryTimeReductionPct: 54,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'hospital-mutual-aid-transfer',
        title: 'REGIONAL PATIENT MUTUAL-AID TRANSFER',
        tagline: 'Inter-Hospital Triage Protocol',
        strategyCategory: 'MAX_PROTECTION',
        description: 'Coordinate rapid ambulance transfer of stable patients to secondary regional clinics to preserve trauma capacity.',
        rationaleGenerator: (_ctx, name) =>
          `Severe overload or failure at ${name}. Decanting non-critical patients to regional medical facilities prevents emergency department collapse.`,
        targetNodeFinder: (_ctx) => ['hospital-apex', 'emergency-dispatch'],
        actionType: 'REPAIR',
        baseDurationMin: 9,
        priority: 'HIGH',
        risk: 'MODERATE',
        resourceRequirement: 'HIGH',
        effectiveness: {
          populationProtectionPct: 78,
          servicesProtectionPct: 55,
          recoveryTimeReductionPct: 44,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'hospital-isolate-icu',
        title: 'ISOLATE ICU & TRAUMA ON DEDICATED UTILITY LOOP',
        tagline: 'Clinical Micro-Loop Protection',
        strategyCategory: 'CRITICAL_FIRST',
        description: 'Isolate surgical suites and emergency departments onto dedicated water and electricity micro-loops.',
        rationaleGenerator: (_ctx, name) =>
          `Shields intensive care and neonatal units from wider ${name} infrastructure instability through strict physical utility circuit isolation.`,
        targetNodeFinder: (_ctx) => ['hospital-apex'],
        actionType: 'ISOLATE',
        baseDurationMin: 4,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'MODERATE',
        effectiveness: {
          populationProtectionPct: 62,
          servicesProtectionPct: 48,
          recoveryTimeReductionPct: 42,
          cascadeHopsReduction: 2,
          riskAfter: 'MODERATE',
        },
      },
      {
        idSuffix: 'hospital-surge-triage',
        title: 'ACTIVATE DISASTER SURGE & ELECTIVE DEFERRAL',
        tagline: 'Clinical Resource Reallocation',
        strategyCategory: 'LOW_RESOURCE',
        description: 'Postpone elective treatments and reassign all clinical personnel to emergency acute triage.',
        rationaleGenerator: (_ctx, name) =>
          `Reallocates 100% of medical staff to life-saving operations during ${name} emergency with zero capital outlay.`,
        targetNodeFinder: (_ctx) => ['hospital-apex'],
        actionType: 'ISOLATE',
        baseDurationMin: 3,
        priority: 'HIGH',
        risk: 'LOW',
        resourceRequirement: 'MINIMAL',
        effectiveness: {
          populationProtectionPct: 48,
          servicesProtectionPct: 36,
          recoveryTimeReductionPct: 32,
          cascadeHopsReduction: 1,
          riskAfter: 'ELEVATED',
        },
      },
    ];
  }

  // ============================================================================
  // 7. EMERGENCY RESPONSE (112 DISPATCH) TEMPLATES
  // ============================================================================
  private static getEmergencyTemplates(): RawStrategyTemplate[] {
    return [
      {
        idSuffix: 'emergency-cad-failover',
        title: 'FAILOVER TO BACKUP 112 DISPATCH CAD',
        tagline: 'Secondary Operations Center Failover',
        strategyCategory: 'FASTEST',
        description: 'Failover 112 emergency call routing to secondary regional operations center to clear call backlogs.',
        rationaleGenerator: (_ctx, name) =>
          `${name} outage severed emergency call intake. Immediate failover to regional secondary CAD restores 112 answering capabilities in minutes.`,
        targetNodeFinder: (_ctx) => ['emergency-dispatch'],
        actionType: 'RESTORE_NETWORK',
        baseDurationMin: 4,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'LOW',
        effectiveness: {
          populationProtectionPct: 68,
          servicesProtectionPct: 60,
          recoveryTimeReductionPct: 54,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'emergency-pre-deploy',
        title: 'PRE-DEPLOY FIRST RESPONDERS TO SECTOR HUBS',
        tagline: 'Decentralized Sector Patrols',
        strategyCategory: 'MAX_PROTECTION',
        description: 'Station ambulances and fire engines directly at key sector junctions to bypass central dispatch queue delays.',
        rationaleGenerator: (_ctx, name) =>
          `Dispatch latency from ${name} risks response delays. Pre-positioning emergency units across arterial nodes guarantees sub-8-minute response.`,
        targetNodeFinder: (_ctx) => ['emergency-dispatch', 'traffic-control'],
        actionType: 'REPAIR',
        baseDurationMin: 8,
        priority: 'HIGH',
        risk: 'MODERATE',
        resourceRequirement: 'HIGH',
        effectiveness: {
          populationProtectionPct: 76,
          servicesProtectionPct: 56,
          recoveryTimeReductionPct: 45,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'emergency-vhf-radio',
        title: 'ESTABLISH DIRECT TACTICAL VHF RADIO LINK',
        tagline: 'Tactical Radio Hospital Bypass',
        strategyCategory: 'CRITICAL_FIRST',
        description: 'Bypass digital CAD servers by establishing direct VHF/UHF tactical radio links between field units and Trauma Hospital.',
        rationaleGenerator: (_ctx, name) =>
          `Digital failure at ${name} threatens patient intake. Analog tactical radio bridges paramedic crews directly with trauma doctors.`,
        targetNodeFinder: (_ctx) => ['emergency-dispatch', 'hospital-apex'],
        actionType: 'RESTORE_NETWORK',
        baseDurationMin: 4,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'LOW',
        effectiveness: {
          populationProtectionPct: 60,
          servicesProtectionPct: 48,
          recoveryTimeReductionPct: 40,
          cascadeHopsReduction: 1,
          riskAfter: 'MODERATE',
        },
      },
      {
        idSuffix: 'emergency-queue-filter',
        title: 'TRIAGE-FIRST CALL QUEUE FILTERING',
        tagline: 'Automated Priority Screening',
        strategyCategory: 'LOW_RESOURCE',
        description: 'Prioritize Category-1 life-threat calls while queuing non-emergency municipal service inquiries.',
        rationaleGenerator: (_ctx, name) =>
          `Eliminates dispatch congestion at ${name} during critical incidents by focusing 100% of operators on life-safety calls.`,
        targetNodeFinder: (_ctx) => ['emergency-dispatch'],
        actionType: 'ISOLATE',
        baseDurationMin: 3,
        priority: 'HIGH',
        risk: 'LOW',
        resourceRequirement: 'MINIMAL',
        effectiveness: {
          populationProtectionPct: 46,
          servicesProtectionPct: 36,
          recoveryTimeReductionPct: 30,
          cascadeHopsReduction: 1,
          riskAfter: 'ELEVATED',
        },
      },
    ];
  }

  // ============================================================================
  // 8. SEWAGE / INDUSTRIAL DISRUPTIONS
  // ============================================================================
  private static getSewageTemplates(): RawStrategyTemplate[] {
    return [
      {
        idSuffix: 'sewage-aux-pumps',
        title: 'ACTIVATE STORM DRAIN BYPASS & LIFT PUMPS',
        tagline: 'Emergency Backflow Prevention',
        strategyCategory: 'FASTEST',
        description: 'Start emergency diesel lift pumps to divert stormwater and prevent urban effluent backflow.',
        rationaleGenerator: (_ctx, name) =>
          `${name} outage threatens wastewater backup into residential roads. Auxiliary lift pumps maintain drainage in minutes.`,
        targetNodeFinder: (_ctx) => ['sewage-treatment'],
        actionType: 'BACKUP_POWER',
        baseDurationMin: 6,
        priority: 'HIGH',
        risk: 'LOW',
        resourceRequirement: 'LOW',
        effectiveness: {
          populationProtectionPct: 64,
          servicesProtectionPct: 54,
          recoveryTimeReductionPct: 48,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'sewage-retention-containment',
        title: 'OPEN EMERGENCY RETENTION BASINS',
        tagline: 'Industrial Buffer Retention Gate',
        strategyCategory: 'MAX_PROTECTION',
        description: 'Open secondary retention basins to hold 2.5M gallons of wastewater until treatment plants recover.',
        rationaleGenerator: (_ctx, _name) =>
          `Prevents biological contamination of potable water reserves by holding untreated discharge in isolated basins.`,
        targetNodeFinder: (_ctx) => ['sewage-treatment', 'water-treatment-pump'],
        actionType: 'REPAIR',
        baseDurationMin: 8,
        priority: 'HIGH',
        risk: 'LOW',
        resourceRequirement: 'MODERATE',
        effectiveness: {
          populationProtectionPct: 74,
          servicesProtectionPct: 58,
          recoveryTimeReductionPct: 42,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'sewage-isolate-hospital-drain',
        title: 'ISOLATE HOSPITAL BIOMEDICAL EFFLUENT DRAIN',
        tagline: 'Clinical Backflow Isolation',
        strategyCategory: 'CRITICAL_FIRST',
        description: 'Isolate hospital drainage lines with check-valves to prevent wastewater surcharge into trauma basements.',
        rationaleGenerator: (_ctx, name) =>
          `Safeguards Civil Apex Hospital basements and sanitation from ${name} effluent pressure buildup.`,
        targetNodeFinder: (_ctx) => ['sewage-treatment', 'hospital-apex'],
        actionType: 'ISOLATE',
        baseDurationMin: 4,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'LOW',
        effectiveness: {
          populationProtectionPct: 58,
          servicesProtectionPct: 46,
          recoveryTimeReductionPct: 38,
          cascadeHopsReduction: 1,
          riskAfter: 'MODERATE',
        },
      },
      {
        idSuffix: 'sewage-gravity-relief',
        title: 'ACTIVATE GRAVITY RELIEF WEIRS',
        tagline: 'Passive Siphon Management',
        strategyCategory: 'LOW_RESOURCE',
        description: 'Open manual gravity bypass weirs to drain excess flood volume without electrical pumping.',
        rationaleGenerator: (_ctx, name) =>
          `Provides zero-energy passive flood relief during ${name} outage.`,
        targetNodeFinder: (_ctx) => ['sewage-treatment'],
        actionType: 'ISOLATE',
        baseDurationMin: 3,
        priority: 'MEDIUM',
        risk: 'MODERATE',
        resourceRequirement: 'MINIMAL',
        effectiveness: {
          populationProtectionPct: 44,
          servicesProtectionPct: 32,
          recoveryTimeReductionPct: 28,
          cascadeHopsReduction: 1,
          riskAfter: 'ELEVATED',
        },
      },
    ];
  }

  // ============================================================================
  // 9. CYBER ATTACK / DIGITAL THREAT TEMPLATES
  // ============================================================================
  private static getCyberTemplates(): RawStrategyTemplate[] {
    return [
      {
        idSuffix: 'cyber-scada-airgap',
        title: 'AIR-GAP COMPROMISED SCADA SYSTEMS',
        tagline: 'Network Boundary Air-Gap Isolation',
        strategyCategory: 'FASTEST',
        description: 'Sever digital connections to isolate malicious intrusion payloads and protect municipal telemetry.',
        rationaleGenerator: (_ctx, name) =>
          `${name} was targeted by a cyber disruption. Physical and digital air-gapping halts lateral malware infection to adjacent infrastructure grids immediately.`,
        targetNodeFinder: (ctx) => [ctx.rootFailureNodeId],
        actionType: 'ISOLATE',
        baseDurationMin: 4,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'MINIMAL',
        effectiveness: {
          populationProtectionPct: 65,
          servicesProtectionPct: 60,
          recoveryTimeReductionPct: 55,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'cyber-out-of-band-vlan',
        title: 'SWITCH TO OUT-OF-BAND ENCRYPTED CONTROL',
        tagline: 'Cryptographic Management Network',
        strategyCategory: 'MAX_PROTECTION',
        description: 'Activate dedicated isolated management VLAN with hardware security module token authentication.',
        rationaleGenerator: (_ctx, name) =>
          `Restores secure operator control over ${name} using cryptographically verified out-of-band telemetry lines.`,
        targetNodeFinder: (ctx) => [ctx.rootFailureNodeId, 'telecom-core'],
        actionType: 'RESTORE_NETWORK',
        baseDurationMin: 7,
        priority: 'HIGH',
        risk: 'LOW',
        resourceRequirement: 'MODERATE',
        effectiveness: {
          populationProtectionPct: 75,
          servicesProtectionPct: 64,
          recoveryTimeReductionPct: 48,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'cyber-firmware-restore',
        title: 'RESTORE IMMUTABLE CRYPTOGRAPHIC BACKUP',
        tagline: 'Bare-Metal Firmware Restoration',
        strategyCategory: 'CRITICAL_FIRST',
        description: 'Flash cryptographic gold-standard firmware to restored controllers to ensure zero rootkit persistence.',
        rationaleGenerator: (_ctx, name) =>
          `Completely purges infected firmware from ${name} and restores deterministic operating code.`,
        targetNodeFinder: (ctx) => [ctx.rootFailureNodeId],
        actionType: 'REPAIR',
        baseDurationMin: 9,
        priority: 'CRITICAL',
        risk: 'LOW',
        resourceRequirement: 'HIGH',
        effectiveness: {
          populationProtectionPct: 64,
          servicesProtectionPct: 52,
          recoveryTimeReductionPct: 44,
          cascadeHopsReduction: 2,
          riskAfter: 'LOW',
        },
      },
      {
        idSuffix: 'cyber-manual-override',
        title: 'SWITCH TO ANALOG MANUAL OVERRIDE',
        tagline: 'Mechanical Manual Interlock',
        strategyCategory: 'LOW_RESOURCE',
        description: 'Deactivate automated software control and switch municipal switchgear to manual manual lever control.',
        rationaleGenerator: (_ctx, name) =>
          `Bypasses digital malware at ${name} entirely by operating infrastructure through physical analog interlocks.`,
        targetNodeFinder: (ctx) => [ctx.rootFailureNodeId],
        actionType: 'ISOLATE',
        baseDurationMin: 3,
        priority: 'HIGH',
        risk: 'MODERATE',
        resourceRequirement: 'MINIMAL',
        effectiveness: {
          populationProtectionPct: 48,
          servicesProtectionPct: 38,
          recoveryTimeReductionPct: 32,
          cascadeHopsReduction: 1,
          riskAfter: 'ELEVATED',
        },
      },
    ];
  }
}
