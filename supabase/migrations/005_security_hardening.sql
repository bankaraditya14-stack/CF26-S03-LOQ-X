-- ==============================================================================
-- Cascade City: Urban Infrastructure Cascade Simulator
-- Migration: 005_security_hardening.sql
-- Description: Production Row Level Security (RLS) hardening, strict ownership
--              immutability, cross-user isolation, and anon privilege restriction.
-- ==============================================================================

-- 1. Ensure RLS is strictly enabled on all tables
ALTER TABLE IF EXISTS public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_recovery_recommendations ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing policies to apply hardened definitions
DROP POLICY IF EXISTS "Users can view own and public scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can create own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can update own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can delete own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Anon can view public scenario templates" ON public.scenarios;

DROP POLICY IF EXISTS "Users can view own simulation runs" ON public.simulation_runs;
DROP POLICY IF EXISTS "Users can insert own simulation runs" ON public.simulation_runs;
DROP POLICY IF EXISTS "Users can delete own simulation runs" ON public.simulation_runs;

DROP POLICY IF EXISTS "Users can view their own AI recommendations" ON public.ai_recovery_recommendations;
DROP POLICY IF EXISTS "Users can insert their own AI recommendations" ON public.ai_recovery_recommendations;
DROP POLICY IF EXISTS "Users can delete their own AI recommendations" ON public.ai_recovery_recommendations;

-- ==============================================================================
-- 3. HARDENED RLS POLICIES: SCENARIOS
-- ==============================================================================

-- Authenticated users can view their own scenarios and public system templates (user_id IS NULL)
CREATE POLICY "scenarios_authenticated_select"
    ON public.scenarios
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Unauthenticated (anon) users can ONLY view public benchmark templates (user_id IS NULL)
CREATE POLICY "scenarios_anon_select_templates_only"
    ON public.scenarios
    FOR SELECT
    TO anon
    USING (user_id IS NULL);

-- Authenticated users can insert scenarios under their own user ID only
CREATE POLICY "scenarios_authenticated_insert"
    ON public.scenarios
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Authenticated users can update their own scenarios, forbidding changing row ownership (user_id)
CREATE POLICY "scenarios_authenticated_update"
    ON public.scenarios
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own custom scenarios
CREATE POLICY "scenarios_authenticated_delete"
    ON public.scenarios
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. HARDENED RLS POLICIES: SIMULATION RUNS (Immutable Audit Log)
-- ==============================================================================

-- Authenticated users can view only their own simulation runs
CREATE POLICY "simulation_runs_authenticated_select"
    ON public.simulation_runs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Authenticated users can insert simulation runs under their own user ID only
CREATE POLICY "simulation_runs_authenticated_insert"
    ON public.simulation_runs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Authenticated users can delete their own simulation runs
CREATE POLICY "simulation_runs_authenticated_delete"
    ON public.simulation_runs
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- NOTE: UPDATE on simulation_runs is deliberately omitted to maintain an immutable audit trail.

-- ==============================================================================
-- 5. HARDENED RLS POLICIES: AI RECOVERY RECOMMENDATIONS (Immutable AI Log)
-- ==============================================================================

-- Authenticated users can view only their own AI recovery recommendations
CREATE POLICY "ai_recovery_authenticated_select"
    ON public.ai_recovery_recommendations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Authenticated users can insert AI recommendations under their own user ID only
CREATE POLICY "ai_recovery_authenticated_insert"
    ON public.ai_recovery_recommendations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Authenticated users can delete their own AI recommendations
CREATE POLICY "ai_recovery_authenticated_delete"
    ON public.ai_recovery_recommendations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- NOTE: UPDATE on ai_recovery_recommendations is deliberately omitted to maintain audit integrity.

-- ==============================================================================
-- 6. STRICT TABLE-LEVEL PRIVILEGE RESTRICTION
-- ==============================================================================

-- Revoke all modifying privileges from anon role
REVOKE INSERT, UPDATE, DELETE ON public.scenarios FROM anon;
REVOKE ALL ON public.simulation_runs FROM anon;
REVOKE ALL ON public.ai_recovery_recommendations FROM anon;

-- Grant minimal necessary privileges
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.scenarios TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scenarios TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.simulation_runs TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.ai_recovery_recommendations TO authenticated;
