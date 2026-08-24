import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * Checks whether valid Supabase environment variables are provided.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase client instance, or null if configuration is absent.
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance && supabaseUrl && supabaseAnonKey) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return clientInstance;
};

/**
 * Exported singleton Supabase client instance (or null if unconfigured).
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? getSupabaseClient()
  : null;
