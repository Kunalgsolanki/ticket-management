'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  X,
} from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('USER');

  // OTP overlay state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [otpInfo, setOtpInfo] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // 6 individual digit boxes
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Auto-focus first digit when OTP modal opens
  useEffect(() => {
    if (showOtpModal) {
      setTimeout(() => digitRefs.current[0]?.focus(), 120);
    }
  }, [showOtpModal]);

  const otpValue = digits.join('');

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    setOtpError(null);
    if (cleaned && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        digitRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      digitRefs.current[5]?.focus();
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        const data = await loginUser(email, password);
        if ('requireOtp' in data && data.requireOtp) {
          setOtpEmail(data.email);
          setDigits(['', '', '', '', '', '']);
          setOtpError(null);
          setOtpInfo(data.message || 'A 6-digit code was sent to your email.');
          setResendCountdown(60);
          setShowOtpModal(true);
        } else if ('token' in data) {
          onSuccess(data.user, data.token);
        }
      } else {
        if (!name.trim()) throw new Error('Please enter your full name');
        const data = await signupUser(name, email, password, role);
        onSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length < 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }
    setOtpError(null);
    setOtpLoading(true);
    try {
      const data = await verifyOtp(otpEmail, otpValue);
      setShowOtpModal(false);
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setOtpError(err.message || 'Invalid or expired code. Try again.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => digitRefs.current[0]?.focus(), 50);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) return;
    setOtpError(null);
    setIsResending(true);
    try {
      const res = await resendOtp(otpEmail);
      setOtpInfo(res.message || 'New code sent!');
      setResendCountdown(60);
      setDigits(['', '', '', '', '', '']);
      digitRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      {/* -- LOGIN / SIGNUP --------------------------------------- */}
      <div className="relative min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20 mb-3">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {isLogin
                ? 'Sign in - a verification code will be sent to your email'
                : 'Join the team and start collaborating in real-time'}
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >Login</button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >Register</button>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input type="text" required placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-indigo-500 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 cursor-pointer">
              {loading
                ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>{isLogin ? 'Continue to Verification' : 'Create Account'}<ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </div>
      </div>

      {/* -- OTP MODAL OVERLAY ------------------------------------ */}
      {showOtpModal && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(10px)' }}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-slate-700/80 bg-slate-900 p-8 shadow-2xl"
            style={{ animation: 'otpModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >
            {/* Close */}
            <button onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-indigo-500/30 mb-4">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Verify Your Email</h3>
              <p className="mt-1 text-xs text-slate-400">6-digit code sent to:</p>
              <p className="font-bold text-sm text-indigo-400 mt-0.5">{otpEmail}</p>
            </div>

            {/* Info */}
            {otpInfo && !otpError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{otpInfo}</span>
              </div>
            )}

            {/* Error */}
            {otpError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{otpError}</span>
              </div>
            )}

            {/* Digit Inputs */}
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-center gap-2" onPaste={handleDigitPaste}>
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { digitRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(i, e)}
                      style={{ width: '2.75rem', height: '3.25rem' }}
                      className={[
                        'text-center text-xl font-bold rounded-xl border-2 bg-slate-950 text-white transition-all focus:outline-none',
                        digit ? 'border-indigo-500' : 'border-slate-700',
                        otpError ? 'border-rose-500' : '',
                        'focus:border-indigo-400',
                      ].join(' ')}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
                <p className="text-center text-[11px] text-slate-500 mt-3">? Expires in 10 minutes</p>
              </div>

              <button
                type="submit"
                disabled={otpLoading || otpValue.length < 6}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-40 cursor-pointer"
              >
                {otpLoading
                  ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>Verify &amp; Sign In<ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            {/* Resend & Back */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col items-center gap-2.5 text-xs">
              <div className="text-slate-400">
                {"Didn't receive it? "}
                {resendCountdown > 0 ? (
                  <span className="text-slate-500">Resend in <strong className="text-slate-300">{resendCountdown}s</strong></span>
                ) : (
                  <button type="button" onClick={handleResend} disabled={isResending}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 underline disabled:opacity-50">
                    {isResending && <RefreshCw className="h-3 w-3 animate-spin" />}
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </button>
                )}
              </div>
              <button type="button" onClick={() => { setShowOtpModal(false); setDigits(['', '', '', '', '', '']); }}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
              </button>
            </div>
          </div>

          <style>{`
            @keyframes otpModalIn {
              from { opacity: 0; transform: scale(0.88) translateY(16px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
};
