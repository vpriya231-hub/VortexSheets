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
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
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

  // If already logged in, redirect to spreadsheet workspace or target url
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const queryParams = new URLSearchParams(window.location.search);
        const target = queryParams.get('redirectTo') || '/';
        navigate(target);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const userEnteredEmail = email.trim();

    try {
      if (authMode === 'login') {
        if (!userEnteredEmail || !password) {
          setError('Please fill in both email and password fields.');
          setLoading(false);
          return;
        }
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: userEnteredEmail,
          password
        });
        if (authErr) throw authErr;
        
        setSuccess('Successfully signed in! Opening editor...');
        setTimeout(() => {
          const queryParams = new URLSearchParams(window.location.search);
          const target = queryParams.get('redirectTo') || '/';
          navigate(target);
        }, 1200);
      } else if (authMode === 'signup') {
        if (!userEnteredEmail || !password) {
          setError('Please fill in both email and password fields.');
          setLoading(false);
          return;
        }
        const { error: authErr } = await supabase.auth.signUp({
          email: userEnteredEmail,
          password
        });
        if (authErr) throw authErr;
        
        setSuccess('Registration successful! Check your mailbox for verification link or sign in.');
      } else if (authMode === 'forgot') {
        if (!userEnteredEmail) {
          setError('Please enter your email address.');
          setLoading(false);
          return;
        }
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(userEnteredEmail, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (resetErr) throw resetErr;
        
        setSuccess('A password reset link has been successfully sent to your email. Please click the link to reset your password.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="glass-login-section">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        .glass-login-section {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          font-family: "Poppins", sans-serif;
          background: #1c0806;
        }

        .glass-login-section .bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
        }

        .glass-login-section .trees {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 100;
          pointer-events: none;
        }

        .glass-login-section .girl {
          position: absolute;
          scale: 0.65;
          pointer-events: none;
          animation: animateGirl 10s linear infinite;
          z-index: 2;
        }

        @keyframes animateGirl {
          0% {
            transform: translateX(calc(100% + 100vw));
          }
          50% {
            transform: translateX(calc(-100% - 100vw));
          }
          50.01% {
            transform: translateX(calc(-100% - 100vw)) rotateY(180deg);
          }
          100% {
            transform: translateX(calc(100% + 100vw)) rotateY(180deg);
          }
        }

        .leaves {
          position: absolute;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1;
          pointer-events: none;
        }

        .leaves .set {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .leaves .set div {
          position: absolute;
          display: block;
        }

        @keyframes animateLeavesSet {
          0% {
            top: -10%;
            transform: translateX(20px) rotate(0deg);
          }
          20% {
            transform: translateX(-20px) rotate(45deg);
          }
          40% {
            transform: translateX(-20px) rotate(90deg);
          }
          60% {
            transform: translateX(20px) rotate(180deg);
          }
          80% {
            transform: translateX(-20px) rotate(45deg);
          }
          100% {
            top: 110%;
            transform: translateX(20px) rotate(225deg);
          }
        }

        .leaves .set div:nth-child(1) { left: 20%; animation: animateLeavesSet 15s linear infinite; animation-delay: 0s; }
        .leaves .set div:nth-child(2) { left: 50%; animation: animateLeavesSet 20s linear infinite; animation-delay: -5s; }
        .leaves .set div:nth-child(3) { left: 70%; animation: animateLeavesSet 20s linear infinite; animation-delay: 0s; }
        .leaves .set div:nth-child(4) { left: 0%; animation: animateLeavesSet 15s linear infinite; animation-delay: -5s; }
        .leaves .set div:nth-child(5) { left: 85%; animation: animateLeavesSet 18s linear infinite; animation-delay: -10s; }
        .leaves .set div:nth-child(6) { left: 45%; animation: animateLeavesSet 12s linear infinite; animation-delay: -2s; }
        .leaves .set div:nth-child(7) { left: 15%; animation: animateLeavesSet 14s linear infinite; animation-delay: -5s; }
        .leaves .set div:nth-child(8) { left: 60%; animation: animateLeavesSet 15s linear infinite; animation-delay: -7s; }

        .login {
          position: relative;
          padding: 40px;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          border-right: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          width: 450px;
          max-width: 90vw;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 25px 45px rgba(0, 0, 0, 0.15);
          z-index: 10;
        }

        .login h2 {
          position: relative;
          width: 100%;
          text-align: center;
          font-size: 2.2em;
          font-weight: 600;
          color: #8f2c24;
          margin-bottom: 4px;
        }

        .login .inputBox {
          position: relative;
          width: 100%;
        }

        .login .inputBox input:not([type="submit"]) {
          width: 100%;
          padding: 12px 16px 12px 42px;
          outline: none;
          font-size: 1.05em;
          color: #8f2c24;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.4);
          transition: all 0.3s ease;
        }

        .login .inputBox input:not([type="submit"]):focus {
          background: #ffffff;
          border-color: #8f2c24;
          box-shadow: 0 0 10px rgba(143, 44, 36, 0.15);
        }

        .login .inputBox input::placeholder {
          color: rgba(143, 44, 36, 0.6);
        }

        .login .inputBox .submit-btn {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: none;
          outline: none;
          background: #8f2c24;
          color: #fff;
          cursor: pointer;
          font-size: 1.1em;
          font-weight: 600;
          transition: 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(143, 44, 36, 0.2);
        }

        .login .inputBox .submit-btn:hover {
          background: #a8362d;
          box-shadow: 0 6px 20px rgba(143, 44, 36, 0.3);
        }

        .login .inputBox .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login .group {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .login .group button {
          font-size: 0.95em;
          color: #8f2c24;
          font-weight: 600;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .login .group button:hover {
          text-decoration: underline;
          opacity: 0.8;
        }

        .brand-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 5px;
        }
      `}</style>

      {/* Dynamic Falling Leaves Background Set */}
      <div className="leaves">
        <div className="set">
          {/* Leaf 1 */}
          <div>
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#ffd43b] fill-current drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
              <path d="M2 22C2 22 6 18 12 17C18 16 22 12 22 6C22 5 21 4 20 4C14 4 10 8 9 14C8 20 2 22 2 22Z" />
              <path d="M12 17C9 14 6 11 2 22" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
          {/* Leaf 2 */}
          <div>
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#ff922b] fill-current drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
              <path d="M2 22C2 22 6 18 12 17C18 16 22 12 22 6C22 5 21 4 20 4C14 4 10 8 9 14C8 20 2 22 2 22Z" />
              <path d="M12 17C9 14 6 11 2 22" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
          {/* Leaf 3 */}
          <div>
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#ff6b6b] fill-current drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
              <path d="M2 22C2 22 6 18 12 17C18 16 22 12 22 6C22 5 21 4 20 4C14 4 10 8 9 14C8 20 2 22 2 22Z" />
              <path d="M12 17C9 14 6 11 2 22" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
          {/* Leaf 4 */}
          <div>
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#fab005] fill-current drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
              <path d="M2 22C2 22 6 18 12 17C18 16 22 12 22 6C22 5 21 4 20 4C14 4 10 8 9 14C8 20 2 22 2 22Z" />
            </svg>
          </div>
          {/* Leaf 5 */}
          <div>
            <svg viewBox="0 0 24 24" className="w-9 h-9 text-[#e64980] fill-current drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
              <path d="M2 22C2 22 6 18 12 17C18 16 22 12 22 6C22 5 21 4 20 4C14 4 10 8 9 14C8 20 2 22 2 22Z" />
            </svg>
          </div>
          {/* Leaf 6 */}
          <div>
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#ffd43b] fill-current drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
              <path d="M2 22C2 22 6 18 12 17C18 16 22 12 22 6C22 5 21 4 20 4C14 4 10 8 9 14C8 20 2 22 2 22Z" />
            </svg>
          </div>
          {/* Leaf 7 */}
          <div>
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#ff922b] fill-current drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
              <path d="M2 22C2 22 6 18 12 17C18 16 22 12 22 6C22 5 21 4 20 4C14 4 10 8 9 14C8 20 2 22 2 22Z" />
            </svg>
          </div>
          {/* Leaf 8 */}
          <div>
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#f03e3e] fill-current drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
              <path d="M2 22C2 22 6 18 12 17C18 16 22 12 22 6C22 5 21 4 20 4C14 4 10 8 9 14C8 20 2 22 2 22Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Layer 1: Background Forest Image */}
      <img 
        src="https://raw.githubusercontent.com/Talal-Mehmood/Animated-Glassmorphism-Login-Form/main/bg.jpg" 
        className="bg" 
        alt="Forest Background" 
        referrerPolicy="no-referrer"
      />

      {/* Layer 2: Animated Walking Girl */}
      <img 
        src="https://raw.githubusercontent.com/Talal-Mehmood/Animated-Glassmorphism-Login-Form/main/girl.png" 
        className="girl" 
        alt="Walking Girl" 
        referrerPolicy="no-referrer"
      />

      {/* Layer 3: Foreground Trees Layer (Z-index 100) */}
      <img 
        src="https://raw.githubusercontent.com/Talal-Mehmood/Animated-Glassmorphism-Login-Form/main/trees.png" 
        className="trees" 
        alt="Trees Overlay" 
        referrerPolicy="no-referrer"
      />

      {/* Top Header Row / Back to Workspace - Positioned with high z-index to be clickable over trees */}
      <div className="absolute top-4 left-4 z-[101]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors bg-[#8f2c24] hover:bg-[#a8362d] text-white shadow-md border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go to Spreadsheet</span>
        </button>
      </div>

      {/* Main Glassmorphism Form Card */}
      <div className="login">
        {/* Brand Header */}
        <div className="brand-header">
          <div className="w-12 h-12 rounded-2xl bg-[#8f2c24]/10 backdrop-blur-md flex items-center justify-center shadow-md mb-2 border border-[#8f2c24]/20">
            <Cloud className="w-6 h-6 text-[#8f2c24]" />
          </div>
          <h2 className="drop-shadow-sm">
            {authMode === 'forgot' ? 'Reset Password' : 'VortexSheets'}
          </h2>
          <p className="text-[#8f2c24]/80 text-xs mt-0.5 leading-relaxed max-w-xs font-medium">
            {authMode === 'forgot'
              ? 'Enter your Email ID to receive a secure password reset link.'
              : 'Save your spreadsheets, charts, and configurations dynamically in the cloud.'}
          </p>
        </div>

        {/* Custom URL parameters message banner */}
        {(() => {
          const queryParams = new URLSearchParams(window.location.search);
          const msg = queryParams.get('message');
          if (msg) {
            return (
              <div className="p-3 rounded-xl bg-[#fab005]/20 border border-[#fab005]/40 text-[#8f2c24] text-center text-xs font-bold leading-relaxed backdrop-blur-sm shadow-sm">
                👑 {msg}
              </div>
            );
          }
          return null;
        })()}

        {/* Validation Feedback Messages */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-[#8f2c24] rounded-xl flex items-start gap-2.5 text-xs backdrop-blur-sm shadow-sm font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-xl flex items-start gap-2.5 text-xs backdrop-blur-sm shadow-sm font-semibold">
            <Check className="w-4 h-4 shrink-0 mt-0.5 animate-bounce text-emerald-700" />
            <span>{success}</span>
          </div>
        )}

        {/* Mode Switch Tabs inside the Login Card */}
        {authMode !== 'forgot' && (
          <div className="flex bg-[#8f2c24]/10 p-1 rounded-xl border border-[#8f2c24]/10">
            <button
              onClick={() => {
                setAuthMode('login');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-center font-bold text-xs select-none cursor-pointer transition-all ${
                authMode === 'login'
                  ? 'bg-[#8f2c24] text-white shadow-sm'
                  : 'text-[#8f2c24]/70 hover:text-[#8f2c24]'
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
              className={`flex-1 py-1.5 rounded-lg text-center font-bold text-xs select-none cursor-pointer transition-all ${
                authMode === 'signup'
                  ? 'bg-[#8f2c24] text-white shadow-sm'
                  : 'text-[#8f2c24]/70 hover:text-[#8f2c24]'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode !== 'forgot' && (
            <>
              {/* Email Input */}
              <div className="inputBox">
                <Mail className="w-5 h-5 absolute left-3.5 top-[12px] text-[#8f2c24] opacity-75" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email ID"
                />
              </div>

              {/* Password Input */}
              <div className="inputBox relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-[12px] text-[#8f2c24] opacity-75" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={authMode !== 'forgot'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[12px] text-[#8f2c24]/70 hover:text-[#8f2c24] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit Button */}
              <div className="inputBox">
                <button
                  type="submit"
                  id="btn"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                </button>
              </div>

              {/* Footer Options Group */}
              <div className="group">
                {authMode === 'login' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    Forgot Password?
                  </button>
                ) : (
                  <span></span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  {authMode === 'login' ? 'Create Account' : 'Back to Login'}
                </button>
              </div>
            </>
          )}

          {authMode === 'forgot' && (
            <>
              {/* Email Input */}
              <div className="inputBox">
                <Mail className="w-5 h-5 absolute left-3.5 top-[12px] text-[#8f2c24] opacity-75" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email ID"
                />
              </div>

              {/* Submit Button */}
              <div className="inputBox">
                <button
                  type="submit"
                  id="btn"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  <span>Send Reset Link</span>
                </button>
              </div>

              {/* Footer Option */}
              <div className="group flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex items-center gap-1 text-[#8f2c24] font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </>
          )}
        </form>

        {/* Quick Info Box */}
        <div className="p-3 rounded-xl bg-[#8f2c24]/5 border border-[#8f2c24]/10 text-[10px] text-[#8f2c24]/90 leading-normal font-semibold">
          ✓ Secure Cloud persistent synchronization saves spreadsheet formulations, visual plots, and layouts instantly in the cloud.
        </div>
      </div>

      {/* Bottom Footer legal links */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[101] flex justify-center gap-4 text-[10px] text-white/80 font-semibold bg-black/30 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
        <a 
          href="https://sites.google.com/view/vortexsheets-privacy-policy/home" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-white hover:underline transition-colors"
        >
          Privacy Policy
        </a>
        <span className="text-white/30">•</span>
        <a 
          href="https://sites.google.com/view/vortexsheetstermsandconditions/home" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-white hover:underline transition-colors"
        >
          Terms & Conditions
        </a>
      </div>
    </section>
  );
}
