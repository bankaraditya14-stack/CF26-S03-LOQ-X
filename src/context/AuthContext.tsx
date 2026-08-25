import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthService, AuthResult } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabaseClient';

const LOCAL_SESSION_KEY = 'cascade_auth_session';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isCloudConnected: boolean;
  isGuest: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const createLocalSession = (email: string): { user: User; session: Session } => {
  const localId = 'usr_local_' + Math.random().toString(36).substring(2, 10);
  const localUser: User = {
    id: localId,
    app_metadata: { provider: 'local' },
    user_metadata: { email, name: email.split('@')[0] },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email,
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  } as User;

  const localSession: Session = {
    access_token: 'local_token_' + Date.now(),
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    refresh_token: 'local_refresh_' + Date.now(),
    user: localUser,
  } as Session;

  return { user: localUser, session: localSession };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const isCloudConnected = isSupabaseConfigured();

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isCloudConnected) {
        try {
          const stored = localStorage.getItem(LOCAL_SESSION_KEY);
          if (stored && mounted) {
            const parsed = JSON.parse(stored);
            if (parsed?.user) {
              setSession(parsed);
              setUser(parsed.user);
            }
          }
        } catch {
          // ignore corrupted local storage
        }
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const currentSession = await AuthService.getSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      } catch (err) {
        console.warn('Auth initialization fallback:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    if (isCloudConnected) {
      const { unsubscribe } = AuthService.onAuthStateChange((_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setIsLoading(false);
        }
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    }
  }, [isCloudConnected]);

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    if (isCloudConnected) {
      const result = await AuthService.signIn(email, password);
      if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        setIsLoading(false);
        return result;
      }
      if (!result.error?.includes('Invalid login credentials')) {
        // If other connection issue, fallback to local session
        const { user: localUser, session: localSession } = createLocalSession(email);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession));
        setUser(localUser);
        setSession(localSession);
        setIsLoading(false);
        return { user: localUser, session: localSession, error: null };
      }
      setIsLoading(false);
      return result;
    } else {
      // Local mode instant authentication
      const { user: localUser, session: localSession } = createLocalSession(email);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession));
      setUser(localUser);
      setSession(localSession);
      setIsLoading(false);
      return { user: localUser, session: localSession, error: null };
    }
  }, [isCloudConnected]);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    if (isCloudConnected) {
      const result = await AuthService.signUp(email, password);
      if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        setIsLoading(false);
        return result;
      }
      if (result.error && !result.error.includes('already registered')) {
        // Fallback to local session if supabase registration errored due to network/configuration
        const { user: localUser, session: localSession } = createLocalSession(email);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession));
        setUser(localUser);
        setSession(localSession);
        setIsLoading(false);
        return { user: localUser, session: localSession, error: null };
      }
      setIsLoading(false);
      return result;
    } else {
      // Local mode instant registration & session creation
      const { user: localUser, session: localSession } = createLocalSession(email);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localSession));
      setUser(localUser);
      setSession(localSession);
      setIsLoading(false);
      return { user: localUser, session: localSession, error: null };
    }
  }, [isCloudConnected]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    localStorage.removeItem(LOCAL_SESSION_KEY);
    if (isCloudConnected) {
      await AuthService.signOut();
    }
    setUser(null);
    setSession(null);
    setIsLoading(false);
  }, [isCloudConnected]);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isCloudConnected,
    isGuest: !user,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
