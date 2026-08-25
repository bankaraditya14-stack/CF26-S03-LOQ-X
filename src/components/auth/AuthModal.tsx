import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Shield,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'SIGN_IN' | 'SIGN_UP';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'SIGN_IN',
}) => {
  const { signIn, signUp, user, signOut } = useAuth();
  const [mode, setMode] = useState<'SIGN_IN' | 'SIGN_UP'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'SIGN_IN') {
        const res = await signIn(trimmedEmail, password);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Successfully authenticated.');
          setTimeout(() => {
            onClose();
          }, 600);
        }
      } else {
        const res = await signUp(trimmedEmail, password);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Account created successfully!');
          setTimeout(() => {
            onClose();
          }, 600);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut();
    setIsLoading(false);
    onClose();
  };

  const fillQuickPreset = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in select-none font-sans">
      <div className="bg-cream-100 w-full max-w-sm rounded-2xl p-7 border-2 border-charcoal-900 shadow-[6px_6px_0px_0px_#1F1F24] relative space-y-6">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white border-2 border-charcoal-900 shadow-[2px_2px_0px_0px_#1F1F24] flex items-center justify-center text-charcoal-900 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#1F1F24] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          title="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="pr-8 space-y-1">
          <h2 className="text-2xl font-extrabold text-charcoal-900 font-heading tracking-tight">
            Welcome,
          </h2>
          <p className="text-sm text-charcoal-500 font-medium">
            {user ? 'your active session' : mode === 'SIGN_IN' ? 'sign in to continue' : 'sign up to continue'}
          </p>
        </div>

        {/* If User is Already Authenticated */}
        {user ? (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-white border-2 border-charcoal-900 shadow-[3px_3px_0px_0px_#1F1F24] space-y-2">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-softblue-700">
                <Shield className="w-4 h-4" />
                <span>AUTHENTICATED OPERATOR</span>
              </div>
              <div className="text-sm font-bold text-charcoal-900 break-all">
                {user.email}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-softblue-100 border-2 border-charcoal-900 text-xs text-charcoal-900 font-medium flex items-center space-x-2 shadow-[2px_2px_0px_0px_#1F1F24]">
              <CheckCircle2 className="w-4 h-4 text-softblue-700 shrink-0" />
              <span>Simulations & scenarios automatically sync to your account.</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-white hover:bg-cream-200 border-2 border-charcoal-900 shadow-[3px_3px_0px_0px_#1F1F24] font-bold text-xs text-charcoal-900 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1F1F24] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
              >
                CLOSE
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-dustybrown-300 hover:bg-dustybrown-400 border-2 border-charcoal-900 shadow-[3px_3px_0px_0px_#1F1F24] font-bold text-xs text-white flex items-center space-x-1.5 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1F1F24] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>SIGN OUT</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Neo-Brutalist Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Feedback Alerts */}
            {error && (
              <div className="p-3 rounded-xl bg-dustybrown-100 border-2 border-charcoal-900 text-dustybrown-500 text-xs font-medium flex items-center space-x-2 shadow-[2px_2px_0px_0px_#1F1F24]">
                <AlertCircle className="w-4 h-4 text-dustybrown-500 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-softblue-100 border-2 border-charcoal-900 text-charcoal-900 text-xs font-medium flex items-center space-x-2 shadow-[2px_2px_0px_0px_#1F1F24]">
                <CheckCircle2 className="w-4 h-4 text-softblue-700 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                disabled={isLoading}
                required
                className="w-full bg-white border-2 border-charcoal-900 shadow-[3px_3px_0px_0px_#1F1F24] rounded-xl px-4 py-2.5 text-sm font-medium text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={isLoading}
                required
                className="w-full bg-white border-2 border-charcoal-900 shadow-[3px_3px_0px_0px_#1F1F24] rounded-xl px-4 py-2.5 text-sm font-medium text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none transition-all"
              />
            </div>

            {/* Circular Quick Presets (ð, G, f) */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => fillQuickPreset('operator@city-grid.org', 'cityops2026')}
                className="w-10 h-10 rounded-full bg-white border-2 border-charcoal-900 shadow-[3px_3px_0px_0px_#1F1F24] flex items-center justify-center font-bold text-sm text-charcoal-900 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1F1F24] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
                title="Quick preset: Grid Operator"
              >
                ð
              </button>

              <button
                type="button"
                onClick={() => fillQuickPreset('analyst@city-grid.org', 'analyst2026')}
                className="w-10 h-10 rounded-full bg-white border-2 border-charcoal-900 shadow-[3px_3px_0px_0px_#1F1F24] flex items-center justify-center font-bold text-sm text-charcoal-900 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1F1F24] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
                title="Quick preset: Resilience Analyst"
              >
                G
              </button>

              <button
                type="button"
                onClick={() => fillQuickPreset('auditor@city-grid.org', 'auditor2026')}
                className="w-10 h-10 rounded-full bg-white border-2 border-charcoal-900 shadow-[3px_3px_0px_0px_#1F1F24] flex items-center justify-center font-bold text-sm text-charcoal-900 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1F1F24] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
                title="Quick preset: Municipal Auditor"
              >
                f
              </button>
            </div>

            {/* Bottom Controls Row: Toggle Mode & "Let's go ->" Button */}
            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => {
                  setMode((prev) => (prev === 'SIGN_IN' ? 'SIGN_UP' : 'SIGN_IN'));
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-charcoal-600 hover:text-charcoal-950 font-bold underline underline-offset-2 transition-colors cursor-pointer"
              >
                {mode === 'SIGN_IN' ? 'Create account' : 'Existing user? Sign in'}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 bg-white hover:bg-cream-200 border-2 border-charcoal-900 shadow-[3px_3px_0px_0px_#1F1F24] rounded-xl font-bold text-xs font-mono text-charcoal-900 flex items-center justify-center space-x-1.5 hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0px_0px_#1F1F24] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-charcoal-900" />
                ) : (
                  <>
                    <span>Let`s go</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
