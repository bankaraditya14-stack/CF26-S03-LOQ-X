-- Migration 004: Adaptive Recovery Intelligence
-- Persist Gemini AI proposals and deterministic engine validated results

CREATE TABLE IF NOT EXISTS public.ai_recovery_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    simulation_run_id UUID REFERENCES public.simulation_runs(id) ON DELETE SET NULL,
    scenario_id TEXT NOT NULL,
    simulation_hash TEXT NOT NULL,
    incident_summary TEXT NOT NULL,
    recommended_strategy JSONB NOT NULL,
    alternative_strategies JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence TEXT NOT NULL DEFAULT 'HIGH',
    validated_results JSONB NOT NULL,
    source TEXT NOT NULL DEFAULT 'GEMINI_AI',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying by user, hash, and scenario
CREATE INDEX IF NOT EXISTS idx_ai_recovery_user_id ON public.ai_recovery_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recovery_hash ON public.ai_recovery_recommendations(simulation_hash);
CREATE INDEX IF NOT EXISTS idx_ai_recovery_scenario_id ON public.ai_recovery_recommendations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_ai_recovery_created_at ON public.ai_recovery_recommendations(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_recovery_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own AI recommendations or anonymous ones
CREATE POLICY "Users can view their own AI recommendations"
    ON public.ai_recovery_recommendations
    FOR SELECT
    USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- RLS Policy: Users can insert their own AI recommendations
CREATE POLICY "Users can insert their own AI recommendations"
    ON public.ai_recovery_recommendations
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

-- RLS Policy: Users can delete their own AI recommendations
CREATE POLICY "Users can delete their own AI recommendations"
    ON public.ai_recovery_recommendations
    FOR DELETE
    USING (
        auth.uid() = user_id
    );

-- Grant access to authenticated and anon users
GRANT SELECT, INSERT ON public.ai_recovery_recommendations TO anon, authenticated;
GRANT ALL ON public.ai_recovery_recommendations TO service_role;
