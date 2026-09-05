'use client';

import React, { useState, useEffect } from 'react';
import { loginUser, signupUser, verifyOtp, resendOtp } from '../lib/api';
import { User, UserRole } from '../lib/types';
import {
  User as UserIcon,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'auth' | 'otp'>('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('USER');

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Countdown timer effect for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // ── Handle Initial Login / Signup ──────────────────────────────
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (isLogin) {
        const data = await loginUser(email, password);
        if ('requireOtp' in data && data.requireOtp) {
          // 2FA OTP flow triggered!
          setOtpEmail(data.email);
          setStep('otp');
          setOtp('');
          setResendCountdown(60);
          setInfo(data.message || 'Verification code sent to your email.');
        } else if ('token' in data) {
          onSuccess(data.user, data.token);
        }
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        const data = await signupUser(name, email, password, role);
        onSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Handle OTP Verification ───────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const data = await verifyOtp(otpEmail, otp.trim());
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Resend OTP ─────────────────────────────────────────
  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) return;
    setError(null);
    setIsResending(true);
    try {
      const res = await resendOtp(otpEmail);
      setInfo(res.message || 'New verification code sent to your email.');
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-2xl">
        {/* ── STEP 1: PASSWORD LOGIN / SIGNUP ───────────────────── */}
        {step === 'auth' && (
          <>
            {/* Top Header */}
            <div className="text-center mb-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20 mb-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {isLogin ? 'Welcome Back' : 'Create an Account'}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {isLogin
                  ? 'Sign in to access real-time ticket management'
                  : 'Join the team and start collaborating in real-time'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                  setInfo(null);
                }}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  isLogin
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                  setInfo(null);
                }}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  !isLogin
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Kunal Solanki"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Continue to Verification' : 'Create Account'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2: 2FA EMAIL OTP VERIFICATION ───────────────── */}
        {step === 'otp' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-indigo-500/25 mb-3">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Check Your Email
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                We sent a 6-digit verification code to:
              </p>
              <p className="font-semibold text-sm text-indigo-400 mt-0.5">{otpEmail}</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Info Message */}
            {info && !error && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{info}</span>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-center text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Enter 6-Digit Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center tracking-[10px] font-mono text-2xl font-bold rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
                <p className="text-center text-[11px] text-slate-500 mt-2">
                  ⏱ The verification code expires in 10 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Verify & Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Resend & Back options */}
            <div className="pt-2 flex flex-col items-center gap-3 border-t border-slate-800/80 text-xs">
              <div className="text-slate-400">
                Didn't receive the email?{' '}
                {resendCountdown > 0 ? (
                  <span className="text-slate-500 font-medium">
                    Resend in <strong className="text-slate-300">{resendCountdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-semibold text-indigo-400 hover:text-indigo-300 underline disabled:opacity-50"
                  >
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('auth');
                  setError(null);
                  setInfo(null);
                  setOtp('');
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
