import React, { useState } from 'react';
import { Mail, Key, ShieldCheck, ShieldAlert, Sparkles, RefreshCw, Undo2, Lock } from 'lucide-react';
import { MemberRegistration } from '../types';
import { saveFirestoreDoc, secondaryAuth, secondaryGoogleProvider } from '../firebase';
import { initiateGoogleSignIn } from '../lib/authService';

interface PortalAuthProps {
  memberships: MemberRegistration[];
  onLogin: (email: string) => void;
}

export default function PortalAuth({ memberships, onLogin }: PortalAuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // States for messaging
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await initiateGoogleSignIn({ actionType: 'portal_login' });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'গুগল দিয়ে লগইন করার সময় কোনো ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।');
      setLoading(false);
    }
  };

  const logMemberLoginDirect = async (email: string, status: string, details: string) => {
    const payload = {
      id: 'ml_portal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      email,
      status,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    try {
      await saveFirestoreDoc('memberLogins', payload.id, payload);
    } catch (e) {
      console.error('Failed to log to Firestore direct:', e);
    }
    try {
      await fetch('/api/member-logins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, status, details })
      });
    } catch (err) {}
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!cleanEmail) return;

    setLoading(true);

    // Simulate database lookup & server latency
    setTimeout(async () => {
      // Check admin login
      if (cleanEmail === 'chitronbhattacharjee@gmail.com') {
        const SUPER_ADMIN_PASSWORD = (import.meta as any).env.VITE_SUPER_ADMIN_PASSWORD || 'chitron@2448766';
        if (password.trim() === SUPER_ADMIN_PASSWORD) {
          onLogin(cleanEmail);
          setLoading(false);
          logMemberLoginDirect(cleanEmail, 'success', 'সদস্য পোর্টাল ট্যাব থেকে পাসওয়ার্ড দ্বারা সফলভাবে সুপার এডমিন সেশন চালু করা হয়েছে।');
          return;
        } else {
          setErrorMsg('দুঃখিত, সুপার এডমিন পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় সঠিক পাসওয়ার্ড দিন।');
          setLoading(false);
          logMemberLoginDirect(cleanEmail, 'failed', 'ভুল সুপার এডমিন পাসওয়ার্ড দিয়ে লগইন চেষ্টা করা হয়েছে।');
          return;
        }
      }

      const matched = memberships.find(m => m.email?.toLowerCase() === cleanEmail);
      
      if (!matched) {
        setErrorMsg('দুঃখিত, এই ইমেইলের বিপরীতে আমাদের ডাটাবেজে কোনো সদস্যপদ পাওয়া যায়নি। সঠিক তথ্য দিন অথবা জেলা দপ্তরে নতুন আবেদন পেশ করুন।');
        setLoading(false);
        logMemberLoginDirect(cleanEmail, 'failed', 'সদস্য পোর্টাল থেকে অনিবন্ধিত ইমেইল দিয়ে ব্যর্থ লগইন চেষ্টা।');
        return;
      }

      if (matched.password && matched.password !== password) {
        setErrorMsg('দুঃখিত, আপনার পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় সঠিক পাসওয়ার্ড দিন।');
        setLoading(false);
        logMemberLoginDirect(matched.email, 'failed', 'ভুল পাসওয়ার্ড দিয়ে লগইন চেষ্টা করা হয়েছে।');
        return;
      }

      if (matched.status === 'pending') {
        setErrorMsg('আপনার মেম্বারশিপ আবেদনটি এখনও জেলা দপ্তরে প্রক্রিয়াধীন (Pending) আছে। ভেরিফিকেশন প্যানেল কোড দ্বারা মেইল ভেরিফাই ও অনুমোদন সম্পন্ন করার পরে লগইন করতে পারবেন।');
        setLoading(false);
        logMemberLoginDirect(matched.email, 'failed', 'পোর্টাল লগইন চেষ্টা কিন্তু মেম্বারশিপ স্ট্যাটাস এখনও অপেক্ষারত (Pending)।');
        return;
      }

      if (matched.status === 'rejected') {
        setErrorMsg('দুঃখিত, আপনার সদস্য ফর্ম জেলা প্যানেল দ্বারা বাতিল বা প্রত্যাখ্যাত করা হয়েছে। নতুন বিবরণ পেতে জেলা দপ্তর প্রতিনিধির সাথে যোগাযোগ করুন।');
        setLoading(false);
        logMemberLoginDirect(matched.email, 'failed', 'প্রত্যাখ্যাত আবেদন নিয়ে পোর্টাল লগইন চেষ্টা।');
        return;
      }

      if (matched.status === 'verified') {
        // Success login
        onLogin(matched.email);
        setLoading(false);
        logMemberLoginDirect(matched.email, 'success', `সদস্য "${matched.name}" সরাসরি ড্যাশবোর্ড পোর্টাল দিয়ে সিস্টেমে সফল লগইন করেছেন।`);
      }
    }, 800);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setErrorMsg('');
    setSuccessMsg('');

    if (!cleanEmail) {
      setErrorMsg('অনুগ্রহ করে আপনার সঠিক নিবন্ধিত ইমেইল এড্রেস প্রদান করুন।');
      return;
    }

    setLoading(true);

    const matchedMember = memberships.find(m => m.email?.toLowerCase() === cleanEmail && m.status === 'verified');
    
    if (matchedMember) {
      const memberId = `SSF-MYM-${matchedMember.id.substring(matchedMember.id.length - 5).toUpperCase()}`;
      
      // If the admin has already approved the reset, display the ID code as the login password
      if (matchedMember.resetApproved) {
        setSuccessMsg(`আপনার পাসওয়ার্ড রিসেট আবেদনটি পূর্বেই জেলা দপ্তর দ্বারা অনুমোদিত হয়েছে! আপনার সাময়িক লগইন পাসওয়ার্ড হলো আপনার সদস্য আইডি কোড: "${memberId}"। আপনি এই কোড ব্যবহার করেই পাসওয়ার্ড হিসেবে সরাসরি লগইন করতে পারবেন।`);
        setEmail('');
        setLoading(false);
        logMemberLoginDirect(cleanEmail, 'success_recovery', 'মেম্বার রিকভারি স্ক্রিন থেকে তার অনুমোদিত রিসেট পাসওয়ার্ড আইডি কোড সফলভাবে উদ্ধার করেছেন।');
        return;
      }

      // If they have already requested reset and it's pending
      if (matchedMember.resetRequested) {
        setErrorMsg('আপনার পাসওয়ার্ড রিসেট আবেদনটি ইতিমধ্যে সাবমিট করা হয়েছে এবং জেলা দপ্তরে অপেক্ষমান (Pending) আছে। দয়া করে জেলা কমিটির সভাপতি অথবা সাধারণ সম্পাদকের সাথে যোগাযোগ করুন।');
        setLoading(false);
        return;
      }

      // Otherwise, log a new reset request
      try {
        const updatedMember = {
          ...matchedMember,
          resetRequested: true,
          resetApproved: false
        };
        await saveFirestoreDoc('memberships', matchedMember.id, updatedMember);

        const directResetLog = {
          id: 'ml_forgot_' + Date.now(),
          email: cleanEmail,
          status: 'reset_request',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          details: `কমরেড "${matchedMember.name}" এর জন্য নতুন পাসওয়ার্ড রিসেট আবেদন জমা হয়েছে। এডমিন অনুমোদনের পর আইডি কোড দিয়ে লগইন কার্যকর হবে।`
        };
        await saveFirestoreDoc('memberLogins', directResetLog.id, directResetLog);
        
        setSuccessMsg(`কমরেড ${matchedMember.name}, আপনার পাসওয়ার্ড রিসেট করার আবেদনটি সফলভাবে জেলা দপ্তরে জমা হয়েছে। জেলা দপ্তর সেল থেকে এটি অনুমোদন দেওয়ার পর আপনার সদস্য আইডি কোডটিই ("${memberId}") সাময়িক পাসওয়ার্ড হিসেবে কার্যকর হবে এবং এটি ব্যবহার করে আপনি লগইন করতে পারবেন।`);
        setEmail('');
      } catch (err) {
        console.error(err);
        setErrorMsg('দুঃখিত, পাসওয়ার্ড রিসেট রিকোয়েস্ট সাবমিট করার সময় ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।');
      }
    } else {
      setErrorMsg('দুঃখিত, প্রদত্ত ইমেইলের বিপরীতে ভেরিফাইড সদস্যপদ পাওয়া যায়নি।');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg shadow-xl font-sans text-left relative overflow-hidden transition-all duration-300">
      {/* Visual Header Decoration */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-550" />
      <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 bg-rose-50 dark:bg-rose-950/30 rounded-full text-rose-600 dark:text-rose-400 mb-3 border border-rose-100 dark:border-rose-950/60 shadow-inner">
          <Lock className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight">
          {isForgotPassword ? 'পাসওয়ার্ড উদ্ধার ও একাউন্ট রিকভারি' : 'অনলাইন সদস্য পোর্টাল লগইন'}
        </h2>
        <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
          {isForgotPassword 
            ? 'সমাজতান্ত্রিক ছাত্র ফ্রন্ট ডাটাবেজে আপনার নিবন্ধিত ইমেইলটি দিন। পাসওয়ার্ড পুনরুদ্ধার প্রক্রিয়া স্বয়ংক্রিয়ভাবে অ্যাক্টিভেট করে নির্দেশনা পাঠানো হবে।'
            : 'নিবন্ধিত সক্রিয় ও ভেরিফাইড সদস্যরা তাদের ইমেইল ও পাসওয়ার্ড প্রদান করে ডিজিটাল প্রোফাইল এবং সার্কুলার অ্যাক্সেস করতে পারেন।'}
        </p>
      </div>

      {/* Global Alerts inside form */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded text-rose-700 dark:text-rose-400 text-xs flex items-start gap-1.5 leading-relaxed">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 rounded text-emerald-800 dark:text-emerald-400 text-xs flex items-start gap-1.5 leading-relaxed">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Forms */}
      {isForgotPassword ? (
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-zinc-700 dark:text-zinc-300 mb-1 leading-none">
              আপনার নিবন্ধিত ইমেইল এড্রেস
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              disabled={loading}
              className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded flex items-center justify-center gap-1 cursor-pointer transition"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>লগইনে ফিরুন</span>
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/10 transition"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>ইমেইল রিকভারি পাঠান</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-zinc-700 dark:text-zinc-300 mb-1 leading-none">
              সদস্য ইমেইল এড্রেস
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-extrabold text-zinc-700 dark:text-zinc-300 leading-none">
                পাসওয়ার্ড
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                disabled={loading}
                className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-400 text-left">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 disabled:opacity-60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/10"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>কমরেড ভেরিফাইড পোর্টাল লগইন</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            <span className="flex-shrink mx-3 text-zinc-400 text-[10px] font-bold uppercase">অথবা</span>
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-200 font-bold text-xs rounded transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.94 1 12 1 7.24 1 3.2 3.86 1.34 8l3.77 2.92C6.01 7.24 8.79 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.45 12.3c0-.82-.07-1.6-.2-2.3H12v4.4h6.43c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.37-4.88 3.37-8.5z" />
              <path fill="#FBBC05" d="M5.11 14.08c-.24-.72-.37-1.5-.37-2.3s.13-1.58.37-2.3L1.34 6.56C.48 8.28 0 10.1 0 12s.48 3.72 1.34 5.44l3.77-2.92c-.24-.44-.24-.88-.24-1.44z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.66-2.84c-1.1.74-2.52 1.18-4.3 1.18-3.21 0-5.99-2.2-6.96-5.46l-3.77 2.92C3.2 20.14 7.24 23 12 23z" />
            </svg>
            <span>Google অ্যাকাউন্ট দিয়ে লগইন</span>
          </button>
        </form>
      )}

      {/* Sparkle Quick Info */}
      <div className="mt-6 border-t border-zinc-150 dark:border-zinc-900 pt-4 text-[10px] text-zinc-450 dark:text-zinc-500 leading-relaxed text-center flex items-center justify-center gap-1 select-none">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>শিক্ষা ও প্রগতির সংগ্রামকে বেগবান করতে ডিজিটাল ডেটাবেজ সুরক্ষিত রাখুন।</span>
      </div>
    </div>
  );
}
