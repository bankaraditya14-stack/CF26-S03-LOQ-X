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

  describe('4. Deterministic Simulation Validation ("Gemini proposes. Cascade City verifies.")', () => {
    it('converts AI recommendations into executable recovery actions and validates on SimulationEngine', () => {
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
            target_nodes: ['traffic-management-hub'],
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
      const topStrat = validatedResults[0];

      expect(baseline).toBeDefined();
      expect(baseline?.baselineComparison.impactReductionPct).toBe(0);

      // The top strategy must have positive verified impact reduction
      expect(topStrat.baselineComparison.impactReductionPct).toBeGreaterThan(0);
      expect(topStrat.baselineComparison.populationSaved).toBeGreaterThanOrEqual(0);
      expect(topStrat.rank).toBe(1);
    });

    it('ranks strategies strictly by measured SimulationEngine impact reduction', () => {
      const context = AdaptiveRecoveryService.buildSimulationContext('power-grid-main');
      const aiResponse = AdaptiveRecoveryService.generateDeterministicFallbackResponse(context);

      const results = AdaptiveRecoveryService.validateStrategiesWithSimulationEngine(
        context,
        aiResponse
      );

      const activeStrategies = results.filter((s) => !s.isBaseline);

      for (let i = 0; i < activeStrategies.length - 1; i++) {
        expect(
          activeStrategies[i].baselineComparison.impactReductionPct
        ).toBeGreaterThanOrEqual(
          activeStrategies[i + 1].baselineComparison.impactReductionPct
        );
        expect(activeStrategies[i].rank).toBe(i + 1);
      }
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
