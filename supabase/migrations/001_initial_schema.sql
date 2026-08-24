-- ==============================================================================
-- Cascade City: Urban Infrastructure Cascade Simulator
-- Migration: 001_initial_schema.sql
-- Description: Initial schema for scenarios and simulation runs persistence.
-- ==============================================================================

-- 1. SCENARIOS TABLE
-- Stores predefined and custom disruption scenarios.
-- Does NOT calculate cascading failures; records scenario definitions only.
CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL,
    name TEXT NOT NULL,
    description TEXT NULL,
    graph_version TEXT NOT NULL,
    initial_failures JSONB NOT NULL,
    parameters JSONB NULL,
    recovery_actions JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. SIMULATION RUNS TABLE
-- Stores completed simulation outcomes, metrics, and event histories.
-- Deterministic hashes guarantee reproducibility across runs.
CREATE TABLE IF NOT EXISTS simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NULL REFERENCES scenarios(id) ON DELETE SET NULL,
    graph_version TEXT NOT NULL,
    initial_failures JSONB NOT NULL,
    metrics JSONB NOT NULL,
    event_log JSONB NOT NULL,
    deterministic_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_scenario_id ON simulation_runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_simulation_runs_created_at ON simulation_runs(created_at DESC);

-- 4. ROW LEVEL SECURITY (RLS)
-- Both tables have RLS enabled by default.
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES NOTE:
-- Authentication is NOT yet implemented in this phase.
--
-- Production Policies (Pending Phase with Auth):
--   - scenarios: Authenticated users can CRUD their own rows (where user_id = auth.uid()),
--                and view public/system scenarios (where user_id IS NULL).
--   - simulation_runs: Authenticated users can insert and view their own runs.
--
-- DEVELOPMENT-ONLY POLICIES (Uncomment ONLY for local/demo dev without Auth):
-- Note: Do NOT deploy these open policies to production.
-- ==============================================================================

-- [DEVELOPMENT-ONLY] Allow anonymous read access to scenarios:
-- CREATE POLICY "dev_anon_read_scenarios" ON scenarios
--     FOR SELECT TO anon
--     USING (true);

-- [DEVELOPMENT-ONLY] Allow anonymous create/update access to scenarios:
-- CREATE POLICY "dev_anon_write_scenarios" ON scenarios
--     FOR ALL TO anon
--     USING (true)
--     WITH CHECK (true);

-- [DEVELOPMENT-ONLY] Allow anonymous access to simulation runs:
-- CREATE POLICY "dev_anon_read_simulation_runs" ON simulation_runs
--     FOR SELECT TO anon
--     USING (true);

-- CREATE POLICY "dev_anon_insert_simulation_runs" ON simulation_runs
--     FOR INSERT TO anon
--     WITH CHECK (true);
