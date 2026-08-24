import { supabase, isSupabaseConfigured } from './supabaseClient';
import { AiRecoveryAnalysis } from '../types/adaptiveRecovery';

const LOCAL_STORAGE_KEY = 'cascade_ai_recovery_recommendations';

export class AiRecoveryRepository {
  /**
   * Saves an AI analysis with its validated results to Supabase (with localStorage fallback).
   */
  public static async saveAnalysis(
    analysis: AiRecoveryAnalysis,
    scenarioId: string,
    userId?: string,
    simulationRunId?: string
  ): Promise<string> {
    const recordId = analysis.id || `ai-rec-${Date.now()}`;

    // 1. Always save locally immediately for instant offline cache
    this.saveLocally(analysis);

    // 2. Sync to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('ai_recovery_recommendations')
          .insert({
            id: recordId,
            user_id: userId || null,
            simulation_run_id: simulationRunId || null,
            scenario_id: scenarioId,
            simulation_hash: analysis.simulationHash,
            incident_summary: analysis.incidentSummary,
            recommended_strategy: analysis.recommendedStrategy,
            alternative_strategies: analysis.alternativeStrategies,
            confidence: analysis.confidence,
            validated_results: analysis.validatedResults,
            source: analysis.source,
            created_at: analysis.createdAt || new Date().toISOString(),
          })
          .select('id')
          .single();

        if (error) {
          console.warn('[AiRecoveryRepository] Supabase insert warning:', error.message);
          return recordId;
        }

        return data?.id || recordId;
      } catch (err) {
        console.warn('[AiRecoveryRepository] Supabase exception:', err);
        return recordId;
      }
    }

    return recordId;
  }

  /**
   * Retrieve cached AI analysis by simulation hash.
   */
  public static async getAnalysisByHash(
    simulationHash: string
  ): Promise<AiRecoveryAnalysis | null> {
    // 1. Check localStorage first for instant fast response
    const localMatches = this.getLocalAnalyses();
    const foundLocal = localMatches.find((a) => a.simulationHash === simulationHash);
    if (foundLocal) return foundLocal;

    // 2. Query Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('ai_recovery_recommendations')
          .select('*')
          .eq('simulation_hash', simulationHash)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) return null;

        return {
          id: data.id,
          simulationHash: data.simulation_hash,
          incidentSummary: data.incident_summary,
          priorityTargets: data.recommended_strategy?.target_nodes || [],
          recommendedStrategy: data.recommended_strategy,
          alternativeStrategies: data.alternative_strategies || [],
          explanation: data.incident_summary || 'Root cause recovery intervention terminates cascade loops.',
          confidence: data.confidence || 'HIGH',
          validatedResults: data.validated_results || [],
          bestStrategy: data.validated_results?.[0] || null,
          source: data.source || 'GEMINI_AI',
          createdAt: data.created_at,
        };
      } catch (e) {
        console.warn('[AiRecoveryRepository] Supabase query hash error:', e);
      }
    }

    return null;
  }

  /**
   * Save analysis to localStorage
   */
  private static saveLocally(
    analysis: AiRecoveryAnalysis
  ): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const items = this.getLocalAnalyses();
      const filtered = items.filter((item) => item.simulationHash !== analysis.simulationHash);
      filtered.unshift(analysis);
      // Keep up to 20 most recent
      const capped = filtered.slice(0, 20);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(capped));
    } catch (e) {
      console.warn('[AiRecoveryRepository] LocalStorage save error:', e);
    }
  }

  /**
   * Get all analyses from localStorage
   */
  public static getLocalAnalyses(): AiRecoveryAnalysis[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}
