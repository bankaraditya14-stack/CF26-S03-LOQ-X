import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthService, AuthResult } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabaseClient';

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
  }, [isCloudConnected]);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const result = await AuthService.signIn(email, password);
    if (result.user && result.session) {
      setUser(result.user);
      setSession(result.session);
      setIsAuthModalOpen(false);
    }
    setIsLoading(false);
    return result;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const result = await AuthService.signUp(email, password);
    if (result.user && result.session) {
      setUser(result.user);
      setSession(result.session);
      setIsAuthModalOpen(false);
    }
    setIsLoading(false);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    await AuthService.signOut();
    setUser(null);
    setSession(null);
    setIsLoading(false);
  }, []);

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
