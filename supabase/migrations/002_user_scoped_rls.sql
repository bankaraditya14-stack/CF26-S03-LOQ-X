-- ==============================================================================
-- Cascade City: Urban Infrastructure Cascade Simulator
-- Migration: 002_user_scoped_rls.sql
-- Description: Adds user-scoping to simulation_runs and configures production
--              Row Level Security (RLS) policies for scenarios and runs.
-- ==============================================================================

-- 1. ADD user_id TO simulation_runs TABLE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'simulation_runs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE simulation_runs ADD COLUMN user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. CREATE INDEX FOR simulation_runs.user_id
CREATE INDEX IF NOT EXISTS idx_simulation_runs_user_id ON simulation_runs(user_id);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;

-- 4. CLEAN UP PREVIOUS POLICIES IF RE-APPLYING
DROP POLICY IF EXISTS "Users can view own and public scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can create own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can update own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can delete own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users can view own simulation runs" ON simulation_runs;
DROP POLICY IF EXISTS "Users can insert own simulation runs" ON simulation_runs;
DROP POLICY IF EXISTS "Users can delete own simulation runs" ON simulation_runs;

-- 5. PRODUCTION RLS POLICIES: SCENARIOS
-- Authenticated users can view their own scenarios and public system templates (user_id IS NULL).
CREATE POLICY "Users can view own and public scenarios"
    ON scenarios
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Authenticated users can insert their own custom scenarios.
CREATE POLICY "Users can create own scenarios"
    ON scenarios
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own custom scenarios.
CREATE POLICY "Users can update own scenarios"
    ON scenarios
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own custom scenarios.
CREATE POLICY "Users can delete own scenarios"
    ON scenarios
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. PRODUCTION RLS POLICIES: SIMULATION RUNS
-- Authenticated users can only view their own simulation runs.
CREATE POLICY "Users can view own simulation runs"
    ON simulation_runs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Authenticated users can record simulation runs under their own user ID.
CREATE POLICY "Users can insert own simulation runs"
    ON simulation_runs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own simulation runs.
CREATE POLICY "Users can delete own simulation runs"
    ON simulation_runs
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
