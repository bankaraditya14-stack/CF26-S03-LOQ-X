-- ==============================================================================
-- Cascade City: Urban Infrastructure Cascade Simulator
-- Migration: 003_grants_and_permissions.sql
-- Description: Grants table-level DML permissions to anon and authenticated
--              roles so Row Level Security (RLS) policies can enforce row isolation.
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Scenarios permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scenarios TO authenticated;
GRANT SELECT ON TABLE public.scenarios TO anon;

-- Simulation runs permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.simulation_runs TO authenticated;
GRANT SELECT ON TABLE public.simulation_runs TO anon;

-- Ensure future sequences if any have usage
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
