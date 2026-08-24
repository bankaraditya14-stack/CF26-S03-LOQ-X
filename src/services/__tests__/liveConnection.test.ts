import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = 'https://tnxhllzmpxczqlqomdqc.supabase.co';
const anonKey = 'sb_publishable_kZbl2M3ySnlFkN_7Bi7lYQ_NR036NqA';

describe('Supabase Remote Project Connectivity', () => {
  it('connects to the cascade-city project endpoint', async () => {
    const supabase = createClient(url, anonKey);
    expect(supabase).toBeDefined();

    // Check auth endpoint availability
    const { data: { session }, error } = await supabase.auth.getSession();
    expect(error).toBeNull();
    expect(session).toBeNull(); // No active session initially
  });
});
