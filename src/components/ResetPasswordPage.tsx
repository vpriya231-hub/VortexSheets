import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Cloud, Check, ArrowLeft, Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

interface ResetPasswordPageProps {
  isDarkMode: boolean;
}

export default function ResetPasswordPage({ isDarkMode }: ResetPasswordPageProps) {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.');
      setChecking(false);
      return;
    }

    // Capture the session on mount and listen to Auth state changes
    const checkSessionAndSetupListener = async () => {
      // 1. Check if URL hash indicates recovery
      const hash = window.location.hash || '';
      const isRecoveryInHash = hash.includes('type=recovery') || hash.includes('recovery');
      
      if (isRecoveryInHash) {
        setIsRecoverySession(true);
      }

      // 2. Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsRecoverySession(true);
      }

      // 3. Listen to auth state changes for PASSWORD_RECOVERY events
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || isRecoveryInHash || session) {
          setIsRecoverySession(true);
        }
      });

      setChecking(false);

      return () => {
        subscription.unsubscribe();
      };
    };

    checkSessionAndSetupListener();
  }, []);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return;

    if (!newPassword || !confirmNewPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) throw updateErr;

      setSuccess('Your password has been successfully updated!');
      
      // Clear session (sign out) so they have to sign in with their new password
      await supabase.auth.signOut();

      setTimeout(() => {
        // Redirect to login with custom success message
        navigate('/login?message=Your password has been reset successfully. Please sign in with your new password.');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while resetting your password.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 ${
        isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-zinc-800'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center animate-pulse">
            <Cloud className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
          <p className="text-xs font-semibold tracking-wide">Securing password recovery session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between p-4 transition-colors duration-150 ${
      isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-zinc-800'
    }`}>
      {/* Top Header Row / Back to Workspace */}
      <div className="w-full max-w-md mx-auto flex items-center pt-2">
        <button
          onClick={() => navigate('/login')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
            isDarkMode 
              ? 'hover:bg-zinc-900 text-zinc-400 hover:text-orange-400' 
              : 'hover:bg-gray-150 text-gray-500 hover:text-orange-600'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>
      </div>

      {/* Main Card Area */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className={`rounded-2xl border p-6 sm:p-8 shadow-xl transition-colors duration-150 ${
          isDarkMode ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-gray-200/80'
        }`}>
          {/* Logo Branding Icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-3">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Create New Password
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 leading-relaxed max-w-xs">
              {isRecoverySession 
                ? 'Your secure recovery session is verified. Please choose a strong new password.' 
                : 'No active recovery session was found. Please request a new password reset link.'}
            </p>
          </div>

          {/* Validation Feedback Messages */}
          {error && (
            <div className="mb-4 p-3.5 bg-red-100/10 border border-red-500/20 text-red-500 rounded-xl flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 bg-emerald-100/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-start gap-2.5 text-xs">
              <Check className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
              <span>{success}</span>
            </div>
          )}

          {isRecoverySession ? (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 opacity-40 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 border rounded-xl outline-none focus:border-orange-500 transition-colors bg-transparent border-gray-250 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 opacity-40 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 border rounded-xl outline-none focus:border-orange-500 transition-colors bg-transparent border-gray-250 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 cursor-pointer text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/15 hover:shadow-orange-500/30 active:translate-y-px transition-all flex justify-center items-center gap-1.5"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Update Password
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3 text-xs leading-normal">
                <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">Session Expired or Invalid</span>
                  <span>We couldn't detect a valid password reset token. Password reset links are valid for one-time use and expire quickly. Please go back to the login page and request a new password recovery email.</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 cursor-pointer text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/15 hover:shadow-orange-500/30 active:translate-y-px transition-all flex justify-center items-center gap-1.5"
              >
                Go to Sign In
              </button>
            </div>
          )}

          <div className="text-center text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-5">
            Powering fully encrypted cloud persistence over PostgreSQL
          </div>
        </div>
      </div>

      {/* Responsive Legal Footer Bottom line */}
      <div className="w-full max-w-md mx-auto pt-4 pb-2 border-t border-gray-200/50 dark:border-zinc-900/50 flex justify-center gap-4 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
        <a 
          href="https://sites.google.com/view/vortexsheets-privacy-policy/home" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-orange-500 hover:underline transition-colors"
        >
          Privacy Policy
        </a>
        <span className="text-zinc-300 dark:text-zinc-800">•</span>
        <a 
          href="https://sites.google.com/view/vortexsheetstermsandconditions/home" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-orange-500 hover:underline transition-colors"
        >
          Terms & Conditions
        </a>
      </div>
    </div>
  );
}
