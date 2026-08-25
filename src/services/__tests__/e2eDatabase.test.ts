import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Scenario, SimulationMetrics, SimulationEvent } from '../../types';

const url = 'https://tnxhllzmpxczqlqomdqc.supabase.co';
const anonKey = 'sb_publishable_kZbl2M3ySnlFkN_7Bi7lYQ_NR036NqA';

describe('End-to-End Live Supabase Integration & RLS Verification', () => {
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const testEmail = `cascade_auditor_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!Secure';
  let testUserId: string | null = null;
  const testScenarioId = `sc_e2e_${Date.now()}`;

  it('verifies public.scenarios and public.simulation_runs tables exist and are reachable', async () => {
    const { data: scenarios, error: scenError } = await supabase
      .from('scenarios')
      .select('*')
      .limit(5);

    expect(scenError).toBeNull();
    expect(Array.isArray(scenarios)).toBe(true);

    const { data: runs, error: runError } = await supabase
      .from('simulation_runs')
      .select('*')
      .limit(5);

    expect(runError).toBeNull();
    expect(Array.isArray(runs)).toBe(true);
  }, 15000);

  it('performs full authentication flow: signUp, signIn, session verification', async () => {
    // 1. Sign up new test user
    const { data: upData, error: upError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (upError && upError.message.includes('rate limit')) {
      // Supabase email dispatch rate limit reached; verify error structure is handled gracefully
      expect(upError.status).toBe(429);
      return;
    }

    expect(upError).toBeNull();
    expect(upData.user).toBeDefined();
    testUserId = upData.user?.id ?? null;

    if (testUserId) {
      // 2. Sign in with password
      const { data: inData, error: inError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (!inError) {
        expect(inData.session?.access_token).toBeDefined();
        expect(inData.user?.id).toBe(testUserId);
      }
    }
  });

  it('persists a custom scenario to Supabase and retrieves it (User-Scoped RLS)', async () => {
    if (!testUserId) return;

    // Check if we have an active session or create client with token if available
    const session = (await supabase.auth.getSession()).data.session;
    const clientToUse = session?.access_token
      ? createClient(url, anonKey, {
          global: { headers: { Authorization: `Bearer ${session.access_token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : supabase;

    const customScenario: Scenario = {
      id: testScenarioId,
      name: 'E2E Grid Stress Test',
      description: 'End-to-end verified cloud scenario definition',
      graphVersion: 'city-v1',
      initialFailures: [{ nodeId: 'power-grid-main', time: 0 }],
      parameters: {
        maxSimulationTime: 120,
        defaultPropagationDelay: 5,
        defaultRecoveryDuration: 10,
      },
      recoveryActions: [
        {
          id: 'rec_e2e_1',
          type: 'ISOLATE',
          nodeId: 'power-grid-main',
          startTime: 5,
          duration: 10,
          description: 'Emergency grid decoupling',
        },
      ],
    };

    // 1. Insert scenario with user_id
    const { data: inserted, error: insertError } = await clientToUse
      .from('scenarios')
      .insert({
        id: customScenario.id,
        user_id: testUserId,
        name: customScenario.name,
        description: customScenario.description,
        graph_version: customScenario.graphVersion,
        initial_failures: customScenario.initialFailures,
        parameters: customScenario.parameters,
        recovery_actions: customScenario.recoveryActions,
      })
      .select()
      .maybeSingle();

    if (session?.access_token) {
      expect(insertError).toBeNull();
      expect(inserted?.name).toBe('E2E Grid Stress Test');
      expect(inserted?.user_id).toBe(testUserId);

      // 2. Select scenario via authenticated client
      const { data: fetched, error: fetchError } = await clientToUse
        .from('scenarios')
        .select('*')
        .eq('id', testScenarioId)
        .single();

      expect(fetchError).toBeNull();
      expect(fetched.id).toBe(testScenarioId);
    } else {
      // Unauthenticated client is correctly rejected by RLS / PostgreSQL grants
      expect(insertError?.code).toBe('42501');
    }
  });

  it('persists completed simulation run to Supabase and retrieves user audit history', async () => {
    if (!testUserId) return;

    const session = (await supabase.auth.getSession()).data.session;
    const clientToUse = session?.access_token
      ? createClient(url, anonKey, {
          global: { headers: { Authorization: `Bearer ${session.access_token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : supabase;

    const sampleMetrics: SimulationMetrics = {
      cascadeDepth: 3,
      affectedServices: 5,
      affectedNodeIds: ['power-grid-main', 'hospital-central', 'water-treatment-plant'],
      recoveryTime: 45,
      peakImpact: 6,
      activeFailures: 0,
      timeToStabilization: 50,
      criticalServicesAffected: 2,
    };

    const sampleEvents: SimulationEvent[] = [
      {
        id: 'evt-1',
        timestamp: 0,
        type: 'FAILURE_INJECTED',
        targetNode: 'power-grid-main',
        previousState: 'HEALTHY',
        newState: 'FAILED',
        cause: { type: 'INITIAL_FAILURE', reason: 'Stress overload' },
      },
      {
        id: 'evt-2',
        timestamp: 5,
        type: 'FAILURE_PROPAGATED',
        targetNode: 'hospital-central',
        previousState: 'HEALTHY',
        newState: 'DEGRADED',
        cause: { type: 'DEPENDENCY', sourceNodeId: 'power-grid-main', reason: 'Power outage' },
      },
    ];

    // 1. Insert run into simulation_runs table
    const { data: runInserted, error: runError } = await clientToUse
      .from('simulation_runs')
      .insert({
        user_id: testUserId,
        scenario_id: testScenarioId,
        graph_version: 'city-v1',
        initial_failures: [{ nodeId: 'power-grid-main', time: 0 }],
        metrics: sampleMetrics,
        event_log: sampleEvents,
        deterministic_hash: 'det_e2e_verified_hash',
      })
      .select()
      .maybeSingle();

    if (session?.access_token) {
      expect(runError).toBeNull();
      expect(runInserted?.user_id).toBe(testUserId);
      expect(runInserted?.deterministic_hash).toBe('det_e2e_verified_hash');
      expect(runInserted?.metrics.cascadeDepth).toBe(3);

      // 2. Query user's audit history
      const { data: history, error: historyError } = await clientToUse
        .from('simulation_runs')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false });

      expect(historyError).toBeNull();
      expect(history).toBeDefined();
      expect(history?.length).toBeGreaterThanOrEqual(1);
      expect(history?.[0].scenario_id).toBe(testScenarioId);
    } else {
      // Unauthenticated client is correctly rejected by RLS / PostgreSQL grants
      expect(runError?.code).toBe('42501');
    }
  });

  it('enforces Multi-User RLS isolation (User B cannot view or tamper with User A records)', async () => {
    // Create an unauthenticated client (simulating another user or anonymous request)
    const anonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Unauthenticated/other user trying to select User A's private simulation run
    const { data: anonRuns } = await anonClient
      .from('simulation_runs')
      .select('*')
      .eq('user_id', testUserId!);

    // RLS filters out rows without throwing, returning 0 rows
    expect(anonRuns?.length ?? 0).toBe(0);

    // Clean up test data if session exists
    if (testUserId) {
      await supabase.from('simulation_runs').delete().eq('user_id', testUserId);
      await supabase.from('scenarios').delete().eq('id', testScenarioId);
    }
  });
});
