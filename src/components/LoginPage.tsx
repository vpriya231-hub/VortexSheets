import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Cloud, Key, AlertCircle, Check, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

interface LoginPageProps {
  initialMode?: 'login' | 'signup';
  isDarkMode: boolean;
}

export default function LoginPage({ initialMode = 'login', isDarkMode }: LoginPageProps) {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync mode if parameters change
  useEffect(() => {
    setAuthMode(initialMode);
    setError(null);
    setSuccess(null);
  }, [initialMode]);

  // If already logged in, redirect to spreadsheet workspace
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.');
      return;
    }

    if (!email || !password) {
      setError('Please fill in check email and password fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (authMode === 'login') {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (authErr) throw authErr;
        
        setSuccess('Successfully signed in! Opening editor...');
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        const { error: authErr } = await supabase.auth.signUp({
          email,
          password
        });
        if (authErr) throw authErr;
        
        setSuccess('Registration successful! Check your mailbox for verification link or sign in.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error happened, please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between p-4 transition-colors duration-150 ${
      isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-zinc-800'
    }`}>
      {/* Top Header Row / Back to Workspace */}
      <div className="w-full max-w-md mx-auto flex items-center pt-2">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
            isDarkMode 
              ? 'hover:bg-zinc-900 text-zinc-400 hover:text-orange-400' 
              : 'hover:bg-gray-150 text-gray-500 hover:text-orange-600'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go to Spreadsheet</span>
        </button>
      </div>

      {/* Main Login Card Area */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className={`rounded-2xl border p-6 sm:p-8 shadow-xl transition-colors duration-150 ${
          isDarkMode ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white border-gray-200/80'
        }`}>
          {/* Logo Branding Icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-3">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">VortexSheets Cloud Sync</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 leading-relaxed max-w-xs">
              Save your spreadsheet sheets, layouts, formulas and visualization configurations dynamically in the cloud.
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

          {/* Mode Switch Tabs */}
          <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl mb-5">
            <button
              onClick={() => {
                setAuthMode('login');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 rounded-lg text-center font-bold text-xs select-none cursor-pointer transition-all ${
                authMode === 'login'
                  ? 'bg-white dark:bg-zinc-700 shadow text-orange-600 dark:text-orange-400'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 rounded-lg text-center font-bold text-xs select-none cursor-pointer transition-all ${
                authMode === 'signup'
                  ? 'bg-white dark:bg-zinc-700 shadow text-orange-600 dark:text-orange-400'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 opacity-40 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2.5 border rounded-xl outline-none focus:border-orange-500 transition-colors bg-transparent border-gray-250 dark:border-zinc-800 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 opacity-40 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 border rounded-xl outline-none focus:border-orange-500 transition-colors bg-transparent border-gray-250 dark:border-zinc-800 text-xs"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 cursor-pointer text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/15 hover:shadow-orange-500/30 active:translate-y-px transition-all flex justify-center items-center gap-1.5"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Key className="w-4 h-4" />
              )}
              {authMode === 'login' ? 'Sign In to Cloud' : 'Create Account'}
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="mt-5 p-3 rounded-xl bg-orange-500/5 border border-orange-500/5 text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
            ✓ Cloud database enables instant real-time saving and auto-loading your spreadsheets layout and charts securely.
          </div>

          <div className="text-center text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-4">
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
