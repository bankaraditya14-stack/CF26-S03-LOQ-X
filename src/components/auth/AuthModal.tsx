import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Cloud,
  Shield,
  Loader2,
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
  const { signIn, signUp, user, signOut, isCloudConnected } = useAuth();
  const [mode, setMode] = useState<'SIGN_IN' | 'SIGN_UP'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'SIGN_IN') {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Successfully authenticated.');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        const res = await signUp(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Account created! Checking session...');
          setTimeout(() => {
            onClose();
          }, 1000);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in select-none font-mono">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 border border-charcoal-900/15 shadow-command-lg relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-charcoal-900/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-mutedpurple-100 text-mutedpurple-700">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-charcoal-900 font-heading">
                {user ? 'ACCOUNT PROFILE' : mode === 'SIGN_IN' ? 'SIGN IN TO CLOUD' : 'CREATE ACCOUNT'}
              </h2>
              <p className="text-xs text-charcoal-500">
                {isCloudConnected
                  ? 'Supabase Cloud Infrastructure Persistence'
                  : 'Local Mode (Supabase not configured)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-charcoal-500 hover:text-charcoal-900 hover:bg-cream-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Already Authenticated */}
        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-cream-50 border border-charcoal-900/10 space-y-2">
              <div className="flex items-center space-x-2 text-xs text-charcoal-600 font-bold">
                <Shield className="w-4 h-4 text-softblue-700" />
                <span>AUTHENTICATED USER</span>
              </div>
              <div className="text-sm font-bold text-charcoal-900 break-all">
                {user.email}
              </div>
              <div className="text-[10px] text-charcoal-500">
                USER ID: {user.id}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-softblue-100 border border-softblue-300 text-xs text-softblue-700 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-softblue-700 shrink-0" />
              <span>Cloud scenarios & simulation runs are synced to your account.</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-charcoal-900/15 text-charcoal-900 text-xs font-bold transition-all cursor-pointer"
              >
                CLOSE
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-dustybrown-300 hover:bg-dustybrown-400 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>SIGN OUT</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-4">
            {/* Mode Tabs */}
            <div className="flex items-center space-x-2 border-b border-charcoal-900/10 pb-3">
              <button
                type="button"
                onClick={() => {
                  setMode('SIGN_IN');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  mode === 'SIGN_IN'
                    ? 'bg-charcoal-900 text-cream-100 shadow-command'
                    : 'bg-cream-100 text-charcoal-500 hover:bg-cream-200 hover:text-charcoal-900 border border-charcoal-900/10'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>SIGN IN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('SIGN_UP');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  mode === 'SIGN_UP'
                    ? 'bg-charcoal-900 text-cream-100 shadow-command'
                    : 'bg-cream-100 text-charcoal-500 hover:bg-cream-200 hover:text-charcoal-900 border border-charcoal-900/10'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>CREATE ACCOUNT</span>
              </button>
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="p-3 rounded-xl bg-dustybrown-100 border border-dustybrown-300 text-dustybrown-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-dustybrown-400 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-softblue-100 border border-softblue-300 text-softblue-700 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-softblue-700 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] text-charcoal-500 uppercase tracking-wider block font-bold">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@city-grid.org"
                    disabled={isLoading}
                    className="w-full bg-cream-50 border border-charcoal-900/15 rounded-xl pl-9 pr-3 py-2 text-xs text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:border-charcoal-900 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-charcoal-500 uppercase tracking-wider block font-bold">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full bg-cream-50 border border-charcoal-900/15 rounded-xl pl-9 pr-3 py-2 text-xs text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:border-charcoal-900 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-700 text-cream-100 font-bold text-xs tracking-wider transition-all flex items-center justify-center space-x-2 shadow-command cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cream-100" />
                ) : mode === 'SIGN_IN' ? (
                  <>
                    <LogIn className="w-4 h-4 fill-cream-100" />
                    <span>SIGN IN</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>CREATE ACCOUNT</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-[10px] text-charcoal-500 border-t border-charcoal-900/10">
              Guest access is always supported. Simulation execution and local tests run in-browser without login.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
