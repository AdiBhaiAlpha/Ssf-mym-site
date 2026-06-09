import React, { useState } from 'react';
import { Mail, Key, ShieldCheck, ShieldAlert, Sparkles, RefreshCw, Undo2, Lock } from 'lucide-react';
import { MemberRegistration } from '../types';

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
        onLogin(cleanEmail);
        setLoading(false);
        // Record login event on server
        try {
          await fetch('/api/member-logins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              status: 'success',
              details: 'সদস্য পোর্টাল ট্যাব থেকে সরাসরি সুপার এডমিন (চিত্তাভ ভট্টাচার্য) সেশন চালু করা হয়েছে।'
            })
          });
        } catch (err) {
          console.error(err);
        }
        return;
      }

      const matched = memberships.find(m => m.email?.toLowerCase() === cleanEmail);
      
      if (!matched) {
        setErrorMsg('দুঃখিত, এই ইমেইলের বিপরীতে আমাদের ডাটাবেজে কোনো সদস্যপদ পাওয়া যায়নি। সঠিক তথ্য দিন অথবা জেলা দপ্তরে নতুন আবেদন পেশ করুন।');
        setLoading(false);
        // Record failed attempt
        try {
          await fetch('/api/member-logins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, status: 'failed', details: 'সদস্য পোর্টাল থেকে অনিবন্ধিত ইমেইল দিয়ে ব্যর্থ লগইন চেষ্টা।' })
          });
        } catch (err) {}
        return;
      }

      if (matched.status === 'pending') {
        setErrorMsg('আপনার মেম্বারশিপ আবেদনটি এখনও জেলা দপ্তরে প্রক্রিয়াধীন (Pending) আছে। ভেরিফিকেশন প্যানেল কোড দ্বারা মেইল ভেরিফাই ও অনুমোদন সম্পন্ন করার পরে লগইন করতে পারবেন।');
        setLoading(false);
        // Record failed attempt
        try {
          await fetch('/api/member-logins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: matched.email, status: 'failed', details: 'পোর্টাল লগইন চেষ্টা কিন্তু মেম্বারশিপ স্ট্যাটাস এখনও অপেক্ষারত (Pending)।' })
          });
        } catch (err) {}
        return;
      }

      if (matched.status === 'rejected') {
        setErrorMsg('দুঃখিত, আপনার সদস্য ফর্ম জেলা প্যানেল দ্বারা বাতিল বা প্রত্যাখ্যাত করা হয়েছে। নতুন বিবরণ পেতে জেলা দপ্তর প্রতিনিধির সাথে যোগাযোগ করুন।');
        setLoading(false);
        try {
          await fetch('/api/member-logins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: matched.email, status: 'failed', details: 'প্রত্যাখ্যাত আবেদন নিয়ে পোর্টাল লগইন চেষ্টা।' })
          });
        } catch (err) {}
        return;
      }

      if (matched.status === 'verified') {
        // Success login
        onLogin(matched.email);
        setLoading(false);
        try {
          await fetch('/api/member-logins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: matched.email,
              status: 'success',
              details: `সদস্য "${matched.name}" সরাসরি ড্যাশবোর্ড পোর্টাল দিয়ে সিস্টেমে সফল লগইন করেছেন।`
            })
          });
        } catch (err) {}
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

    try {
      const response = await fetch('/api/member-logins/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMsg(data.message || 'পাসওয়ার্ড পুনরুদ্ধারের লিংক সফলভাবে পাঠানো হয়েছে।');
        setEmail('');
      } else {
        setErrorMsg(data.message || 'পাসওয়ার্ড পুনরুদ্ধারে ব্যর্থতা। অনুগ্রহ করে সঠিক নিবন্ধিত ইমেইল দিন।');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('সার্ভারে যোগাযোগ করা যায়নি। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ পুনরায় পরীক্ষা করুন।');
    } finally {
      setLoading(false);
    }
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
