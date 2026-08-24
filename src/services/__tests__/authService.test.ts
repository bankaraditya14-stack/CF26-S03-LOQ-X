import { describe, it, expect } from 'vitest';
import { AuthService } from '../authService';
import { isSupabaseConfigured } from '../supabaseClient';

describe('AuthService Integration & Offline Fallback', () => {
  it('reports cloud availability matching client configuration', () => {
    const isConfigured = isSupabaseConfigured();
    expect(AuthService.isAvailable()).toBe(isConfigured);
  });

  it('returns graceful offline message on signUp when Supabase is unconfigured', async () => {
    if (!isSupabaseConfigured()) {
      const result = await AuthService.signUp('test@city-grid.org', 'password123');
      expect(result.user).toBeNull();
      expect(result.error).toContain('Supabase is not configured');
    }
  });

  it('returns graceful offline message on signIn when Supabase is unconfigured', async () => {
    if (!isSupabaseConfigured()) {
      const result = await AuthService.signIn('test@city-grid.org', 'password123');
      expect(result.user).toBeNull();
      expect(result.error).toContain('Supabase is not configured');
    }
  });

  it('handles signOut safely without throwing', async () => {
    const result = await AuthService.signOut();
    expect(result.error).toBeNull();
  });

  it('returns null for getCurrentUser and getSession in offline mode', async () => {
    if (!isSupabaseConfigured()) {
      const user = await AuthService.getCurrentUser();
      const session = await AuthService.getSession();
      expect(user).toBeNull();
      expect(session).toBeNull();
    }
  });

  it('provides safe unsubscribe handle on onAuthStateChange', () => {
    const sub = AuthService.onAuthStateChange(() => {});
    expect(typeof sub.unsubscribe).toBe('function');
    expect(() => sub.unsubscribe()).not.toThrow();
  });
});
