import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: string | null;
}

export class AuthService {
  /**
   * Registers a new user with email and password via Supabase Auth.
   */
  public static async signUp(email: string, password: string): Promise<AuthResult> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        user: null,
        session: null,
        error: 'Supabase is not configured. Running in local mode.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err: any) {
      return {
        user: null,
        session: null,
        error: err?.message || 'An unexpected error occurred during registration.',
      };
    }
  }

  /**
   * Signs in an existing user with email and password.
   */
  public static async signIn(email: string, password: string): Promise<AuthResult> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        user: null,
        session: null,
        error: 'Supabase is not configured. Running in local mode.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err: any) {
      return {
        user: null,
        session: null,
        error: err?.message || 'An unexpected error occurred during sign-in.',
      };
    }
  }

  /**
   * Signs out the current active session.
   */
  public static async signOut(): Promise<{ error: string | null }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? error.message : null };
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign out.' };
    }
  }

  /**
   * Retrieves the currently authenticated user, or null if unauthenticated.
   */
  public static async getCurrentUser(): Promise<User | null> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return null;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves the current session.
   */
  public static async getSession(): Promise<Session | null> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return null;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Subscribes to auth state changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED, etc.).
   */
  public static onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): { unsubscribe: () => void } {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { unsubscribe: () => {} };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return {
      unsubscribe: () => {
        subscription.unsubscribe();
      },
    };
  }

  /**
   * Checks if cloud auth is available.
   */
  public static isAvailable(): boolean {
    return isSupabaseConfigured();
  }
}
