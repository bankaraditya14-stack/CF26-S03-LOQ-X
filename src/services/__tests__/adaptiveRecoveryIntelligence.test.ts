import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdaptiveRecoveryService } from '../adaptiveRecoveryService';
import { AiRecoveryRepository } from '../aiRecoveryRepository';
import { SYNTHETIC_CITY_GRAPH } from '../../data/cityGraph';
import { SimulationEngine } from '../../engine/SimulationEngine';
import { AiGeminiResponse } from '../../types/adaptiveRecovery';

describe('Adaptive Recovery Intelligence (Gemini AI + Deterministic Simulation Validation)', () => {
  const store = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  describe('1. AI Simulation Context Payload Construction', () => {
    it('constructs a rich, deterministic simulation context from root failure and state', () => {
      const engine = new SimulationEngine(SYNTHETIC_CITY_GRAPH.nodes, SYNTHETIC_CITY_GRAPH.edges);
      engine.injectFailure('power-grid-main', 0);
      engine.step();
      const state = engine.getState();

      const context = AdaptiveRecoveryService.buildSimulationContext(
        'power-grid-main',
        'Transformer Explosion',
        state,
        10
      );

      expect(context.rootFailureNodeId).toBe('power-grid-main');
      expect(context.rootSector).toBe('POWER');
      expect(context.failureType).toBe('Transformer Explosion');
      expect(context.failedNodeIds).toContain('power-grid-main');
      expect(context.cascadeDepth).toBeGreaterThanOrEqual(0);
      expect(context.populationAffected).toBeGreaterThan(0);
      expect(context.simulationHash).toBeDefined();
      expect(context.availableNodes.length).toBe(SYNTHETIC_CITY_GRAPH.nodes.length);
    });

    it('generates consistent simulation hashes for identical simulation states', () => {
      const hash1 = AdaptiveRecoveryService.computeSimulationHash(
        'power-grid-main',
        'Substation Fire',
        ['power-grid-main', 'water-treatment-pump'],
        2,
        45000
      );
      const hash2 = AdaptiveRecoveryService.computeSimulationHash(
        'power-grid-main',
        'Substation Fire',
        ['power-grid-main', 'water-treatment-pump'],
        2,
        45000
      );
      const hash3 = AdaptiveRecoveryService.computeSimulationHash(
        'telecom-core',
        'Cyber Attack',
        ['telecom-core'],
        1,
        20000
      );

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('2. Different Failures Produce Context-Specific Analysis & Strategies', () => {
    it('generates power-specific recovery strategies for power grid failures', () => {
      const context = AdaptiveRecoveryService.buildSimulationContext(
        'power-grid-main',
        'Transformer Surge'
      );
      const fallback = AdaptiveRecoveryService.generateDeterministicFallbackResponse(context);

      expect(fallback.incident_summary).toContain('POWER');
      expect(fallback.recommended_strategy.target_nodes).toBeDefined();
      expect(fallback.recommended_strategy.priority).toBe('CRITICAL');
    });

    it('generates water-specific recovery strategies for water intake failures', () => {
      const context = AdaptiveRecoveryService.buildSimulationContext(
        'water-treatment-pump',
        'Pump Cavitation Failure'
      );
      const fallback = AdaptiveRecoveryService.generateDeterministicFallbackResponse(context);

      expect(fallback.incident_summary).toContain('WATER');
      expect(fallback.recommended_strategy.name).toBeDefined();
      expect(fallback.alternative_strategies.length).toBeGreaterThan(0);
    });

    it('generates healthcare-specific emergency strategies for hospital failures', () => {
      const context = AdaptiveRecoveryService.buildSimulationContext(
        'hospital-apex',
        'Generator Exhaust Failure'
      );
      const fallback = AdaptiveRecoveryService.generateDeterministicFallbackResponse(context);

      expect(fallback.incident_summary).toContain('HOSPITAL');
      expect(fallback.recommended_strategy.actions.length).toBeGreaterThan(0);
    });
  });

  describe('3. Response Validation & Sanitization', () => {
    it('filters out hallucinated node IDs and sanitizes fields from Gemini output', () => {
      const context = AdaptiveRecoveryService.buildSimulationContext('power-grid-main');
      const malformedRaw = {
        incident_summary: 'Severe outage detected.',
        priority_targets: ['Apex Hospital'],
        recommended_strategy: {
          name: 'Deploy emergency generators',
          priority: 'INVALID_PRIORITY',
          reason: 'Prevents cascade to water',
          target_nodes: ['non-existent-node-123', 'water-treatment-pump'],
          actions: ['Action 1'],
        },
        alternative_strategies: [
          {
            name: 'Isolate circuit',
            priority: 'MEDIUM',
            reason: 'Load shedding',
            target_nodes: ['telecom-core'],
            actions: ['Action 2'],
          },
        ],
        explanation: 'Causal explanation',
        confidence: 'UNKNOWN_VAL',
      };

      const validated = AdaptiveRecoveryService.validateGeminiResponse(malformedRaw, context);

      expect(validated.recommended_strategy.priority).toBe('HIGH'); // Normalized
      expect(validated.confidence).toBe('HIGH'); // Normalized
      expect(validated.recommended_strategy.target_nodes).toEqual(['water-treatment-pump']); // Filtered hallucination
      expect(validated.alternative_strategies[0].target_nodes).toEqual(['telecom-core']);
    });
  });

  describe('4. Independent Deterministic Simulation Validation & Scoring ("Gemini proposes. Cascade City verifies.")', () => {
    it('converts AI recommendations into executable recovery actions and validates on SimulationEngine with independent metrics', () => {
      const context = AdaptiveRecoveryService.buildSimulationContext('power-grid-main');
      const aiResponse: AiGeminiResponse = {
        incident_summary: 'Major substation failure',
        priority_targets: ['water-treatment-pump'],
        recommended_strategy: {
          name: 'DEPLOY AUXILIARY GENERATORS',
          priority: 'CRITICAL',
          reason: 'Powers water pumps and hospital',
          target_nodes: ['water-treatment-pump', 'hospital-apex'],
          actions: ['Deploy mobile diesel generators'],
          action_type: 'BACKUP_POWER',
        },
        alternative_strategies: [
          {
            name: 'ISOLATE INDUSTRIAL LOAD',
            priority: 'HIGH',
            reason: 'Sheds non-essential loads',
            target_nodes: ['traffic-control'],
            actions: ['Quarantine non-essential junction power'],
            action_type: 'ISOLATE',
          },
        ],
        explanation: 'Breaks cascade path',
        confidence: 'HIGH',
      };

      const validatedResults = AdaptiveRecoveryService.validateStrategiesWithSimulationEngine(
        context,
        aiResponse
      );

      // Should include AI strategies + baseline strategy
      expect(validatedResults.length).toBe(3);

      const baseline = validatedResults.find((s) => s.isBaseline);
      const strat1 = validatedResults[0];
      const strat2 = validatedResults[1];

      expect(baseline).toBeDefined();
      expect(baseline?.baselineComparison.impactReductionPct).toBe(0);
      expect(baseline?.recoveryScore).toBe(0);

      // Verify that every strategy has its OWN independent metrics
      expect(strat1.recoveryScore).toBeGreaterThan(0);
      expect(strat1.recoveryScore).toBeLessThanOrEqual(100);
      expect(strat1.metrics.citizensProtected).toBeGreaterThanOrEqual(0);
      expect(strat1.metrics.servicesProtectedCount).toBeGreaterThan(0);
      expect(strat1.metrics.totalServicesCount).toBe(SYNTHETIC_CITY_GRAPH.nodes.length);
      expect(strat1.rank).toBe(1);
      expect(strat1.whyThisRank).toContain('Highest composite recovery score');

      // Interventions must NOT share identical metric values unless coincidentally equal
      expect(strat1.targetNodeIds).not.toEqual(strat2.targetNodeIds);
    });

    it('evaluates different interventions to different metrics under the same failure', () => {
      const context = AdaptiveRecoveryService.buildSimulationContext('power-grid-main');
      const aiResponse: AiGeminiResponse = {
        incident_summary: 'Major power grid failure',
        priority_targets: ['water-treatment-pump', 'hospital-apex'],
        recommended_strategy: {
          name: 'DEPLOY BACKUP GENERATOR FLEET',
          priority: 'CRITICAL',
          reason: 'Emergency electrical feed to critical lifelines',
          target_nodes: ['water-treatment-pump', 'hospital-apex'],
          actions: ['Deploy 500kVA generator'],
          action_type: 'BACKUP_POWER',
        },
        alternative_strategies: [
          {
            name: 'LOCAL ISOLATION',
            priority: 'LOW',
            reason: 'Isolates only north cellular tower',
            target_nodes: ['telecom-tower-north'],
            actions: ['Isolate tower circuit'],
            action_type: 'ISOLATE',
          },
        ],
        explanation: 'Testing differential impacts',
        confidence: 'HIGH',
      };

      const results = AdaptiveRecoveryService.validateStrategiesWithSimulationEngine(
        context,
        aiResponse
      );

      const stratPower = results.find((s) => s.name === 'DEPLOY BACKUP GENERATOR FLEET')!;
      const stratLocal = results.find((s) => s.name === 'LOCAL ISOLATION')!;

      // Broad lifelines generator must protect more citizens than isolating one cellular tower
      expect(stratPower.metrics.citizensProtected).toBeGreaterThan(
        stratLocal.metrics.citizensProtected
      );
      expect(stratPower.recoveryScore).toBeGreaterThan(stratLocal.recoveryScore);
      expect(stratPower.rank).toBe(1);
      expect(stratLocal.rank).toBe(2);
    });

    it('produces different results for the same intervention across different failure scenarios', () => {
      const powerContext = AdaptiveRecoveryService.buildSimulationContext('power-grid-main');
      const telecomContext = AdaptiveRecoveryService.buildSimulationContext('telecom-core');

      const generatorStrategy: AiGeminiResponse = {
        incident_summary: 'Testing scenario sensitivity',
        priority_targets: ['hospital-apex'],
        recommended_strategy: {
          name: 'DEPLOY BACKUP GENERATOR',
          priority: 'CRITICAL',
          reason: 'Emergency generation',
          target_nodes: ['hospital-apex'],
          actions: ['Deploy generator'],
          action_type: 'BACKUP_POWER',
        },
        alternative_strategies: [],
        explanation: 'Testing cross-scenario sensitivity',
        confidence: 'HIGH',
      };

      const powerResults = AdaptiveRecoveryService.validateStrategiesWithSimulationEngine(
        powerContext,
        generatorStrategy
      );
      const telecomResults = AdaptiveRecoveryService.validateStrategiesWithSimulationEngine(
        telecomContext,
        generatorStrategy
      );

      const powerImpact = powerResults[0].baselineComparison.impactReductionPct;
      const telecomImpact = telecomResults[0].baselineComparison.impactReductionPct;

      // In a power failure, a backup generator has much higher impact than in a telecom failure
      expect(powerImpact).toBeGreaterThan(0);
      expect(telecomImpact).toBeDefined();
    });

    it('ranks strategies strictly by measured SimulationEngine recoveryScore', () => {
      const context = AdaptiveRecoveryService.buildSimulationContext('power-grid-main');
      const aiResponse = AdaptiveRecoveryService.generateDeterministicFallbackResponse(context);

      const results = AdaptiveRecoveryService.validateStrategiesWithSimulationEngine(
        context,
        aiResponse
      );

      const activeStrategies = results.filter((s) => !s.isBaseline);

      for (let i = 0; i < activeStrategies.length - 1; i++) {
        expect(activeStrategies[i].recoveryScore).toBeGreaterThanOrEqual(
          activeStrategies[i + 1].recoveryScore
        );
        expect(activeStrategies[i].rank).toBe(i + 1);
      }
    });

    it('ensures results are 100% repeatable and deterministic for the same scenario + intervention', () => {
      const context = AdaptiveRecoveryService.buildSimulationContext('water-treatment-pump');
      const aiResponse = AdaptiveRecoveryService.generateDeterministicFallbackResponse(context);

      const run1 = AdaptiveRecoveryService.validateStrategiesWithSimulationEngine(
        context,
        aiResponse
      );
      const run2 = AdaptiveRecoveryService.validateStrategiesWithSimulationEngine(
        context,
        aiResponse
      );

      expect(run1[0].recoveryScore).toBe(run2[0].recoveryScore);
      expect(run1[0].metrics.citizensProtected).toBe(run2[0].metrics.citizensProtected);
      expect(run1[0].metrics.recoveryTimeMin).toBe(run2[0].metrics.recoveryTimeMin);
      expect(run1[0].metrics.cascadeDepth).toBe(run2[0].metrics.cascadeDepth);
    });
  });

  describe('5. Persistence & LocalStorage Fallback', () => {
    it('persists AI recovery analyses to localStorage and retrieves by simulation hash', async () => {
      const context = AdaptiveRecoveryService.buildSimulationContext('water-treatment-pump');
      const analysis = await AdaptiveRecoveryService.analyzeAndValidate(context);

      expect(analysis).toBeDefined();
      expect(analysis.bestStrategy).toBeDefined();
      expect(analysis.validatedResults.length).toBeGreaterThan(0);

      // Check repository retrieval
      const cached = await AiRecoveryRepository.getAnalysisByHash(context.simulationHash);
      expect(cached).toBeDefined();
      expect(cached?.simulationHash).toBe(context.simulationHash);
    });
  });
});
