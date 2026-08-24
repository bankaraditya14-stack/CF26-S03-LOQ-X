import { describe, it, expect } from 'vitest';
import {
  InterventionRecommendationService,
  FailureContext,
} from '../interventionRecommendationService';

describe('InterventionRecommendationService (Failure-Specific & Dependency-Aware)', () => {
  // 1. Power failure -> power-specific interventions
  it('generates power-specific interventions for power grid failures', () => {
    const context: FailureContext = {
      rootFailureNodeId: 'power-grid-main',
      rootFailureNodeName: 'Central Power Grid',
      rootSector: 'POWER',
      failureType: 'Equipment Failure',
      activeFailedNodeIds: ['power-grid-main'],
      activeDegradedNodeIds: [],
      allAffectedNodeIds: ['power-grid-main', 'water-treatment-pump', 'telecom-core'],
      cascadeDepth: 2,
      populationAtRisk: 42500,
      totalServicesCount: 13,
      simTimeSec: 0,
      criticalNodesAffected: ['power-grid-main', 'water-treatment-pump'],
    };

    const recommendations = InterventionRecommendationService.getRecommendations(context);

    expect(recommendations.length).toBeGreaterThanOrEqual(4);
    const titles = recommendations.map((r) => r.title);

    // Must contain power-related strategies
    expect(titles).toContain('DEPLOY AUXILIARY GENERATOR FLEET');
    expect(titles).toContain('REROUTE ELECTRICAL SUPPLY');
    expect(titles).toContain('PRIORITIZE HOSPITAL & 112 DISPATCH');
    expect(titles).toContain('SELECTIVE NON-ESSENTIAL LOAD SHEDDING');

    // Must NOT contain water-specific actions like tanker deployment as primary power action
    expect(titles).not.toContain('DEPLOY EMERGENCY WATER TANKER FLEET');
    expect(titles).not.toContain('ACTIVATE 112 SATELLITE EMERGENCY LINK');

    const generatorOption = recommendations.find((r) => r.id === 'rec-power-distributed-gen');
    expect(generatorOption).toBeDefined();
    expect(generatorOption?.priority).toBe('CRITICAL');
    expect(generatorOption?.projectedStats.improvementPct).toBeGreaterThan(50);
    expect(generatorOption?.actions.length).toBeGreaterThan(0);
  });

  // 2. Water failure -> water-specific interventions
  it('generates water-specific interventions for water pump failures', () => {
    const context: FailureContext = {
      rootFailureNodeId: 'water-treatment-pump',
      rootFailureNodeName: 'Central Water Pumping Station',
      rootSector: 'WATER',
      failureType: 'Physical Disruption',
      activeFailedNodeIds: ['water-treatment-pump'],
      activeDegradedNodeIds: ['water-distribution'],
      allAffectedNodeIds: ['water-treatment-pump', 'water-distribution', 'hospital-apex'],
      cascadeDepth: 2,
      populationAtRisk: 35000,
      totalServicesCount: 13,
      simTimeSec: 5,
      criticalNodesAffected: ['water-treatment-pump', 'hospital-apex'],
    };

    const recommendations = InterventionRecommendationService.getRecommendations(context);
    const titles = recommendations.map((r) => r.title);

    // Must contain water-related strategies
    expect(titles).toContain('ACTIVATE BACKUP INTAKE PUMP TURBINES');
    expect(titles).toContain('DEPLOY EMERGENCY WATER TANKER FLEET');
    expect(titles).toContain('DIVERT RESERVOIR RESERVES FOR HOSPITALS');
    expect(titles).toContain('ZONAL PRESSURE REDUCTION & RESTRICTION');

    // Must NOT recommend power grid actions like electrical reroute
    expect(titles).not.toContain('REROUTE ELECTRICAL SUPPLY');
    expect(titles).not.toContain('SELECTIVE NON-ESSENTIAL LOAD SHEDDING');

    const tankerOption = recommendations.find((r) => r.id === 'rec-water-tanker-fleet');
    expect(tankerOption?.rationale).toContain('water');
    expect(tankerOption?.addressedNodeIds).toContain('water-distribution');
  });

  // 3. Telecom failure -> telecom-specific interventions
  it('generates telecom-specific interventions for telecom fiber core failures', () => {
    const context: FailureContext = {
      rootFailureNodeId: 'telecom-core',
      rootFailureNodeName: 'Metropolitan Fiber Core',
      rootSector: 'TELECOM',
      failureType: 'Physical Disruption',
      activeFailedNodeIds: ['telecom-core'],
      activeDegradedNodeIds: ['emergency-dispatch'],
      allAffectedNodeIds: ['telecom-core', 'emergency-dispatch', 'hospital-apex'],
      cascadeDepth: 2,
      populationAtRisk: 28000,
      totalServicesCount: 13,
      simTimeSec: 0,
      criticalNodesAffected: ['telecom-core', 'emergency-dispatch'],
    };

    const recommendations = InterventionRecommendationService.getRecommendations(context);
    const titles = recommendations.map((r) => r.title);

    expect(titles).toContain('SWITCH TO REDUNDANT OPTICAL BACKBONE');
    expect(titles).toContain('DEPLOY CELL-ON-WHEELS (COW) MOBILE MESH');
    expect(titles).toContain('ACTIVATE 112 SATELLITE EMERGENCY LINK');
    expect(titles).toContain('EMERGENCY-ONLY BANDWIDTH SHAPING');

    const satLinkOption = recommendations.find((r) => r.id === 'rec-telecom-satellite-link');
    expect(satLinkOption).toBeDefined();
    expect(satLinkOption?.addressedNodeIds).toContain('emergency-dispatch');
    expect(satLinkOption?.rationale).toContain('satellite');
  });

  // 4. Traffic failure -> traffic-specific interventions
  it('generates traffic-specific interventions for traffic grid failures', () => {
    const context: FailureContext = {
      rootFailureNodeId: 'traffic-control',
      rootFailureNodeName: 'Adaptive Traffic Signal Grid',
      rootSector: 'TRAFFIC',
      failureType: 'Equipment Failure',
      activeFailedNodeIds: ['traffic-control'],
      activeDegradedNodeIds: ['public-transit'],
      allAffectedNodeIds: ['traffic-control', 'public-transit', 'emergency-dispatch'],
      cascadeDepth: 2,
      populationAtRisk: 19000,
      totalServicesCount: 13,
      simTimeSec: 0,
      criticalNodesAffected: ['emergency-dispatch'],
    };

    const recommendations = InterventionRecommendationService.getRecommendations(context);
    const titles = recommendations.map((r) => r.title);

    expect(titles).toContain('ACTIVATE AUTONOMOUS BACKUP CONTROLLERS');
    expect(titles).toContain('DEPLOY TRAFFIC POLICE & CORRIDOR MARSHALS');
    expect(titles).toContain('ESTABLISH EMERGENCY GREEN CORRIDORS');
    expect(titles).toContain('DYNAMIC PERIMETER ROAD DIVERSION');

    const greenWave = recommendations.find((r) => r.id === 'rec-traffic-green-wave');
    expect(greenWave?.addressedNodeIds).toContain('emergency-dispatch');
    expect(greenWave?.addressedCausalPath).toContain('Traffic');
  });

  // 5. Healthcare failure -> healthcare-specific interventions
  it('generates healthcare-specific interventions for hospital disruptions', () => {
    const context: FailureContext = {
      rootFailureNodeId: 'hospital-apex',
      rootFailureNodeName: 'Civil Apex Hospital & Trauma',
      rootSector: 'HOSPITAL',
      failureType: 'Equipment Failure',
      activeFailedNodeIds: ['hospital-apex'],
      activeDegradedNodeIds: [],
      allAffectedNodeIds: ['hospital-apex'],
      cascadeDepth: 0,
      populationAtRisk: 15000,
      totalServicesCount: 13,
      simTimeSec: 0,
      criticalNodesAffected: ['hospital-apex'],
    };

    const recommendations = InterventionRecommendationService.getRecommendations(context);
    const titles = recommendations.map((r) => r.title);

    expect(titles).toContain('ENGAGE HOSPITAL AUXILIARY POWER & OXYGEN');
    expect(titles).toContain('REGIONAL PATIENT MUTUAL-AID TRANSFER');
    expect(titles).toContain('ISOLATE ICU & TRAUMA ON DEDICATED UTILITY LOOP');
    expect(titles).toContain('ACTIVATE DISASTER SURGE & ELECTIVE DEFERRAL');

    const triageOption = recommendations.find((r) => r.id === 'rec-hospital-mutual-aid-transfer');
    expect(triageOption?.rationale).toContain('patients');
  });

  // 6. Mixed cascade -> dependency-aware recommendations
  it('dynamically adapts recommendations and rationales when downstream nodes are affected', () => {
    const mixedContext: FailureContext = {
      rootFailureNodeId: 'power-grid-main',
      rootFailureNodeName: 'Central Power Grid',
      rootSector: 'POWER',
      failureType: 'Equipment Failure',
      activeFailedNodeIds: ['power-grid-main', 'water-treatment-pump'],
      activeDegradedNodeIds: ['water-distribution', 'hospital-apex'],
      allAffectedNodeIds: [
        'power-grid-main',
        'water-treatment-pump',
        'water-distribution',
        'hospital-apex',
      ],
      cascadeDepth: 3,
      populationAtRisk: 52000,
      totalServicesCount: 13,
      simTimeSec: 15,
      criticalNodesAffected: ['power-grid-main', 'water-treatment-pump', 'hospital-apex'],
    };

    const recommendations = InterventionRecommendationService.getRecommendations(mixedContext);
    const genOption = recommendations.find((r) => r.id === 'rec-power-distributed-gen');

    expect(genOption).toBeDefined();
    // In mixed power->water cascade, the distributed generator rationale must explicitly mention water
    expect(genOption?.rationale).toMatch(/water/i);
    expect(genOption?.addressedNodeIds).toContain('water-treatment-pump');
  });

  // 7. No intervention -> baseline
  it('always includes NO INTERVENTION as a valid baseline with 0% improvement', () => {
    const context: FailureContext = {
      rootFailureNodeId: 'power-grid-main',
      rootFailureNodeName: 'Central Power Grid',
      rootSector: 'POWER',
      activeFailedNodeIds: ['power-grid-main'],
      activeDegradedNodeIds: [],
      allAffectedNodeIds: ['power-grid-main'],
      cascadeDepth: 1,
      populationAtRisk: 42500,
      totalServicesCount: 13,
      simTimeSec: 0,
      criticalNodesAffected: ['power-grid-main'],
    };

    const recommendations = InterventionRecommendationService.getRecommendations(context);
    const baseline = recommendations.find((r) => r.id === 'none');

    expect(baseline).toBeDefined();
    expect(baseline?.title).toBe('NO INTERVENTION');
    expect(baseline?.strategyCategory).toBe('BASELINE');
    expect(baseline?.projectedStats.improvementPct).toBe(0);
    expect(baseline?.projectedStats.populationAffected.deltaNum).toBe(0);
    expect(baseline?.projectedStats.recoveryTime.deltaMin).toBe(0);
    expect(baseline?.score).toBe(0);
    expect(baseline?.actions.length).toBe(0);
  });

  // 8. Different scenarios produce different recommendation rankings and IDs
  it('produces completely different strategy sets and rankings for different root failures', () => {
    const powerContext: FailureContext = {
      rootFailureNodeId: 'power-grid-main',
      rootFailureNodeName: 'Central Power Grid',
      rootSector: 'POWER',
      activeFailedNodeIds: ['power-grid-main'],
      activeDegradedNodeIds: [],
      allAffectedNodeIds: ['power-grid-main'],
      cascadeDepth: 1,
      populationAtRisk: 42500,
      totalServicesCount: 13,
      simTimeSec: 0,
      criticalNodesAffected: ['power-grid-main'],
    };

    const telecomContext: FailureContext = {
      rootFailureNodeId: 'telecom-core',
      rootFailureNodeName: 'Metropolitan Fiber Core',
      rootSector: 'TELECOM',
      activeFailedNodeIds: ['telecom-core'],
      activeDegradedNodeIds: [],
      allAffectedNodeIds: ['telecom-core'],
      cascadeDepth: 1,
      populationAtRisk: 25000,
      totalServicesCount: 13,
      simTimeSec: 0,
      criticalNodesAffected: ['telecom-core'],
    };

    const powerRecs = InterventionRecommendationService.getRecommendations(powerContext);
    const telecomRecs = InterventionRecommendationService.getRecommendations(telecomContext);

    const powerTopIds = powerRecs.map((r) => r.id);
    const telecomTopIds = telecomRecs.map((r) => r.id);

    // Active intervention IDs must not overlap (except baseline 'none')
    const activePowerIds = powerTopIds.filter((id) => id !== 'none');
    const activeTelecomIds = telecomTopIds.filter((id) => id !== 'none');

    for (const pId of activePowerIds) {
      expect(activeTelecomIds).not.toContain(pId);
    }
  });

  // 9. Cyber scenarios produce cyber-specific strategies
  it('generates cyber-specific strategies for cyber attacks', () => {
    const cyberContext: FailureContext = {
      rootFailureNodeId: 'power-grid-main',
      rootFailureNodeName: 'Central Power Grid',
      rootSector: 'POWER',
      failureType: 'Cyber Attack',
      activeFailedNodeIds: ['power-grid-main'],
      activeDegradedNodeIds: [],
      allAffectedNodeIds: ['power-grid-main', 'telecom-core'],
      cascadeDepth: 1,
      populationAtRisk: 42500,
      totalServicesCount: 13,
      simTimeSec: 0,
      criticalNodesAffected: ['power-grid-main'],
    };

    const recommendations = InterventionRecommendationService.getRecommendations(cyberContext);
    const titles = recommendations.map((r) => r.title);

    expect(titles).toContain('AIR-GAP COMPROMISED SCADA SYSTEMS');
    expect(titles).toContain('SWITCH TO OUT-OF-BAND ENCRYPTED CONTROL');
    expect(titles).toContain('RESTORE IMMUTABLE CRYPTOGRAPHIC BACKUP');
    expect(titles).toContain('SWITCH TO ANALOG MANUAL OVERRIDE');
  });
});
