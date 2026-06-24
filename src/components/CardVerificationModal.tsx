import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  X, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  Building, 
  Lock, 
  Mail, 
  Key, 
  RefreshCw,
  History,
  Clock,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { MemberRegistration, getMemberBadgeText } from '../types';
import { AppDatabase } from '../server/db-initial';

interface CardVerificationModalProps {
  verifyMemberId: string;
  userEmail: string | null;
  onLogin: (email: string) => void;
  db: AppDatabase;
  onClose: () => void;
}

export default function CardVerificationModal({
  verifyMemberId,
  userEmail,
  onLogin,
  db,
  onClose
}: CardVerificationModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab ] = useState<'public_verify' | 'admin_login'>('public_verify');

  // Fallback or environment Super Admin password
  const SUPER_ADMIN_PASSWORD = (import.meta as any).env.VITE_SUPER_ADMIN_PASSWORD || 'chitron@2448766';

  // Check if email is admin/super_admin
  const isUserAdmin = (checkEmail: string | null | undefined): boolean => {
    if (!checkEmail) return false;
    const lowerEmail = checkEmail.trim().toLowerCase();
    
    // Super Admin Check
    if (lowerEmail === 'chitronbhattacharjee@gmail.com') return true;
    
    // Coordinator Admin Check
    const hasAcceptedInvite = (db?.invitations || []).some(
      i => i.email.toLowerCase() === lowerEmail && i.status === 'accepted'
    );
    
    return hasAcceptedInvite;
  };

  const currentIsAdmin = isUserAdmin(userEmail);

  // Handle Login inside the verification tool
  const handleVerifyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setLoginError('অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দুটিই প্রদান করুন।');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // 1. Super Admin Password verification
      if (cleanEmail === 'chitronbhattacharjee@gmail.com') {
        if (cleanPass === SUPER_ADMIN_PASSWORD) {
          onLogin(cleanEmail);
          setLoading(false);
          setEmail('');
          setPassword('');
          return;
        } else {
          setLoginError('দুঃখিত, সুপার এডমিন পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় সঠিক পাসওয়ার্ড দিন।');
          setLoading(false);
          return;
        }
      }

      // 2. Normal Admin / Coordinator member search
      const matchedMember = db.memberships.find(m => m.email?.toLowerCase() === cleanEmail);
      if (!matchedMember) {
        setLoginError('প্রদত্ত ইমেইলের বিপরীতে কোনো সদস্যপদ পাওয়া যায়নি।');
        setLoading(false);
        return;
      }

      if (matchedMember.password && matchedMember.password !== cleanPass) {
        setLoginError('দুঃখিত, আপনার পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় সঠিক পাসওয়ার্ড দিন।');
        setLoading(false);
        return;
      }

      if (matchedMember.status !== 'verified') {
        setLoginError('আপনার সদস্য আবেদনটি বর্তমানে ভেরিফাইড বা অনুমোদিত নয়।');
        setLoading(false);
        return;
      }

      // 3. Ensure they have permissions
      const hasInvite = (db?.invitations || []).some(
        i => i.email.toLowerCase() === cleanEmail && i.status === 'accepted'
      );

      if (!hasInvite) {
        setLoginError('দুঃখিত, আপনি একজন সাধারণ মেম্বার। সদস্য ই-কার্ডের সত্যতা যাচাই করার অধিকার শুধুমাত্র এডমিন ও সমন্বয়কদের রয়েছে।');
        setLoading(false);
        return;
      }

      // Login success
      onLogin(matchedMember.email);
      setLoading(false);
      setEmail('');
      setPassword('');
    }, 600);
  };

  // Find the target member to verify
  const targetMember = db.memberships.find(m => m.id === verifyMemberId);
  const targetMemberId = targetMember 
    ? `SSF-MYM-${targetMember.id.substring(targetMember.id.length - 5).toUpperCase()}`
    : '';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl relative overflow-hidden font-sans text-left"
      >
        {/* Top visual accents */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-550" />

        {/* Close button in top-right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 hover:bg-zinc-90 w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-900 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header Title */}
          <div className="flex items-center gap-2.5 mb-5 select-none">
            <div className="p-2 bg-rose-500/10 border border-rose-550/30 rounded text-rose-550">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-widest uppercase mb-0.5">E-Card Verification Panel</h2>
              <p className="text-[10px] text-zinc-400">সমাজতান্ত্রিক ছাত্র ফ্রন্ট • ময়মনসিংহ জেলা সংসদ</p>
            </div>
          </div>

          {!currentIsAdmin ? (
            /* User is NOT logged in or Authorized as Admin */
            <div className="space-y-4">
              {/* Tab Switchers */}
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('public_verify')}
                  className={`flex-1 py-1.5 rounded text-center cursor-pointer transition ${
                    activeTab === 'public_verify' 
                      ? 'bg-rose-600 text-white shadow-xs font-extrabold' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  পাবলিক যাচাই ও ইতিহাস লগ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin_login');
                    setLoginError('');
                  }}
                  className={`flex-1 py-1.5 rounded text-center cursor-pointer transition ${
                    activeTab === 'admin_login' 
                      ? 'bg-rose-600 text-white shadow-xs font-extrabold' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  এডমিন লগইন / Admin Access
                </button>
              </div>

              {activeTab === 'public_verify' ? (
                /* Public Verification and History Tab */
                <div className="space-y-4">
                  {targetMember ? (
                    <div className="space-y-4">
                      {/* Public Status Banner */}
                      <div className={`p-3.5 border rounded text-xs leading-relaxed flex items-start gap-2.5 select-none ${
                        targetMember.status === 'verified'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      }`}>
                        {targetMember.status === 'verified' ? (
                          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                        ) : (
                          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-550 mt-0.5" />
                        )}
                        <div>
                          <strong className="font-extrabold block uppercase mb-0.5 text-[10px] tracking-wider">
                            {targetMember.status === 'verified' ? 'Verified Member Profile' : 'Pending Verification'}
                          </strong>
                          {targetMember.status === 'verified' ? (
                            <span>সহযোদ্ধা, এই ই-কার্ডটির জন্য একটি সক্রিয় সদস্যপদ ডাটাবেজে পাওয়া গেছে। কার্ডধারী ময়মনসিংহের একজন তালিকাভুক্ত সক্রিয় প্রাতিষ্ঠানিক সদস্য।</span>
                          ) : (
                            <span>এই সদস্য প্রোফাইলটি ডাটাবেজে রয়েছে কিন্তু বর্তমানে এটি অপেক্ষমাণ বা পেন্ডিং তালিকায় রয়েছে। জেলা দপ্তর এর অনুমোদন সম্পন্ন হলে কার্ডটি প্রকাশ্য সত্যতায় আসবে।</span>
                          )}
                          <div className="mt-1 font-bold">
                            অবস্থাঃ <span className={targetMember.status === 'verified' ? 'text-emerald-450 font-sans' : 'text-amber-450 font-sans'}>
                              {targetMember.status === 'verified' ? 'অনুমোদিত (Verified)' : 'অপেক্ষমাণ (Pending)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Public Basic Info Container */}
                      <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-lg flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {/* Avatar */}
                        <div className="w-[85px] h-[105px] rounded border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-500 overflow-hidden shadow-inner shrink-0 leading-none">
                          {targetMember.photoUrl ? (
                            <img 
                              src={targetMember.photoUrl} 
                              alt={targetMember.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User className="w-8 h-8 opacity-30 text-rose-500" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 w-full space-y-2 text-xs">
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">নাম / Full Name</span>
                            <strong className="text-zinc-150 font-extrabold text-sm block leading-tight mt-0.5">{targetMember.name}</strong>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                            <div>
                              <span className="text-[8px] text-zinc-500 uppercase tracking-wider block font-bold leading-none">মেম্বারশিপ আইডি</span>
                              <span className="text-zinc-250 font-bold block bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-850 w-fit mt-0.5 font-mono">{targetMemberId}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-zinc-500 uppercase tracking-wider block font-bold leading-none">সাংগঠনিক স্তর</span>
                              <span className="text-zinc-350 font-semibold block mt-1">{getMemberBadgeText(targetMember)}</span>
                            </div>
                          </div>

                          <div className="pt-0.5 text-[11px]">
                            <span className="text-[8px] text-zinc-500 uppercase tracking-wider block font-bold leading-none">শিক্ষা প্রতিষ্ঠান / Institution</span>
                            <span className="text-zinc-300 font-semibold block mt-0.5">{targetMember.institution}</span>
                          </div>
                        </div>
                      </div>

                      {/* PUBLIC VIEW PROFILE HISTORY SECTION */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 pb-1.5 border-b border-zinc-850">
                          <History className="w-4 h-4 text-rose-500 animate-pulse" />
                          <span>প্রোফাইল পরিবর্তন সংশোধনীর ইতিহাস লগ (Public Update History)</span>
                        </div>

                        {!targetMember.editHistory || targetMember.editHistory.length === 0 ? (
                          <div className="p-4 bg-zinc-900 border border-zinc-850 rounded text-center text-zinc-500 italic text-[11px]">
                            কোনো পূর্ববর্তী সংশোধনীর বা পরিবর্তনের ইতিহাস ডাটাবেজে পাওয়া যায়নি।
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                            {targetMember.editHistory.map((item: any, i: number) => (
                              <div key={i} className="p-2.5 bg-zinc-900 border border-zinc-850 rounded text-[11px] leading-relaxed">
                                <div className="flex justify-between items-center text-[9px] text-zinc-400 mb-1 font-mono">
                                  <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 text-[8px]">
                                    সংশোধক/ইউজার: {item.editedBy && (item.editedBy.includes('@') || item.editedBy === 'সদস্য নিজে')
                                      ? (item.editedBy === 'সদস্য নিজে' ? 'মেম্বার স্বয়ং' : item.editedBy)
                                      : 'এডমিন ও জেলা সমন্বয়ক'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-rose-500" />
                                    {item.timestamp}
                                  </span>
                                </div>
                                
                                <div className="text-zinc-300">
                                  পরিবর্তিত ক্ষেত্র: <span className="text-rose-450 font-bold">{item.field}</span>
                                </div>

                                <div className="grid grid-cols-5 gap-1 items-center mt-1 p-1 bg-zinc-950 rounded font-mono text-[9px] border border-zinc-900">
                                  <div className="col-span-2 text-rose-400 line-through truncate text-center" title={item.oldValue || '(ফাঁকা)'}>
                                    {item.oldValue || '(ফাঁকা)'}
                                  </div>
                                  <div className="col-span-1 justify-self-center text-zinc-500">
                                    <ArrowRight className="w-3 h-3" />
                                  </div>
                                  <div className="col-span-2 text-emerald-400 font-bold truncate text-center" title={item.newValue}>
                                    {item.newValue || '(ফাঁকা)'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Public Search Member Not Found */
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-lg text-xs leading-relaxed flex items-start gap-4">
                      <ShieldAlert className="w-6 h-6 shrink-0 text-rose-500 mt-0.5" />
                      <div>
                        <strong className="font-extrabold block text-rose-450 mb-1 text-[13px] uppercase font-sans">E-Card Entry Invalid</strong>
                        দুঃখিত, এই মেম্বারশিপ আইডির বিপরীতে অনলাইন ডাটাবেজে কোনো অ্যাক্টিভ মেম্বারশিপ খুঁজে পাওয়া যায়নি।
                        <p className="mt-1.5 text-zinc-400">এই কার্ডটি সঠিক নয় অথবা আমাদের ডাটাবেজে নিবন্ধিত নেই।</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-2 bg-rose-900/40 border border-rose-800 hover:bg-rose-900 text-rose-100 hover:text-white font-bold text-xs rounded transition flex items-center justify-center gap-1 cursor-pointer mt-2"
                  >
                    <span>প্যানেল বন্ধ করুন (Dismiss)</span>
                  </button>
                </div>
              ) : (
                /* Admin Login Credentials Form Tab */
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-xs leading-relaxed flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold block text-amber-450 mb-0.5">অনুমোদন প্রয়োজন / Authentication Required</strong>
                      সদস্য ডাটাবেজে সরাসরি পরিবর্তন কিংবা মেম্বারদের রোল ও এন্ট্রি এডিট করার দাপ্তরিক অ্যাক্সেস পেতে দয়া করে এডমিন ক্রেডেনশিয়াল দিয়ে সাইন-ইন করুন।
                    </div>
                  </div>

                  <form onSubmit={handleVerifyLogin} className="space-y-3.5 pt-1">
                    {loginError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-[11px] rounded leading-relaxed font-sans">
                        {loginError}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-zinc-400 mb-1 leading-none">
                        এডমিন ইমেইল / Admin Email
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-zinc-500">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          required
                          placeholder="admin@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-800 bg-zinc-900/60 text-white rounded focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-550 disabled:opacity-60 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-extrabold text-zinc-400 mb-1 leading-none">
                        পাসওয়ার্ড / Password
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-zinc-500">
                          <Key className="w-4 h-4" />
                        </span>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-800 bg-zinc-900/60 text-white rounded focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-550 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/20"
                    >
                      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>এডমিন একাউন্টে লগইন করুন</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* User IS Admin - Show Verification Outcome */
            <div className="space-y-5">
              {targetMember ? (
                targetMember.status === 'verified' ? (
                  /* Verified Success */
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs leading-relaxed flex items-start gap-3 select-none">
                      <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                      <div>
                        <strong className="font-extrabold block text-emerald-450 uppercase mb-0.5">E-Card Verification Success!</strong>
                        এই সদস্য কার্ডটির সত্যতা ময়নমনসিংহের সেন্ট্রাল ডাটাবেজে পাওয়া গেছে। প্রগতিশীল ছাত্র ফ্রন্টের তালিকা সারণী অনুযায়ী এটি একটি সক্রিয় সদস্য পদ।
                      </div>
                    </div>

                    {/* Member info card details */}
                    <div id="member-identity-card" className="bg-white border border-zinc-200 p-5 rounded-lg shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-4 text-zinc-900">
                      {/* background watermarks */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-550/5 blur-[50px] rounded-full pointer-events-none" />

                      {/* Photo */}
                      <div className="w-[100px] h-[125px] rounded border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 overflow-hidden shadow-inner shrink-0 scale-95 sm:scale-100 leading-none">
                        {targetMember.photoUrl ? (
                          <img 
                            src={targetMember.photoUrl} 
                            alt={targetMember.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User className="w-10 h-10 opacity-30 text-rose-500" />
                        )}
                      </div>

                      {/* Info lines */}
                      <div className="flex-1 w-full space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">পূর্ণ নাম / Full Name</span>
                          <strong className="text-zinc-900 font-extrabold text-sm block leading-tight mt-0.5">{targetMember.name}</strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">সাংগঠনিক স্তর (Badge)</span>
                          <span className="inline-block mt-1 px-2.5 py-1 text-[10px] bg-rose-600/80 border border-rose-500 text-white font-sans font-extrabold rounded shadow-xs">
                            {getMemberBadgeText(targetMember)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold leading-none">মেম্বারশিপ আইডি</span>
                            <span className="text-zinc-800 font-bold block bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 w-fit mt-0.5 font-mono">{targetMemberId}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold leading-none">রক্তের গ্রুপ</span>
                            <span className="text-zinc-800 font-bold block mt-1">{targetMember.bloodGroup || 'সংগৃহীত নয়'}</span>
                          </div>
                        </div>

                        <div className="pt-0.5">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">জন্ম তারিখ</span>
                          <span className="text-zinc-800 font-semibold block leading-snug mt-0.5">{targetMember.dob || 'সংগৃহীত নয়'}</span>
                        </div>

                        <div className="pt-0.5">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">শিক্ষা প্রতিষ্ঠান</span>
                          <span className="text-zinc-800 font-semibold block leading-snug mt-0.5">{targetMember.institution}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold leading-none">মোবাইল নম্বর</span>
                            <span className="text-zinc-800 block font-mono font-semibold mt-0.5">{targetMember.mobile}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold leading-none">শ্রেণি বা বিভাগ</span>
                            <span className="text-zinc-800 block font-semibold mt-0.5">{targetMember.department || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-zinc-150 flex justify-between items-center text-[10px] text-zinc-500 font-mono font-sans z-10">
                          <span>Verified At:</span>
                          <span className="text-zinc-700 font-bold">{targetMember.verifiedAt || targetMember.appliedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* ADMIN VIEW PROFILE HISTORY SECTION */}
                    <div className="space-y-3 pt-3 border-t border-zinc-900">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                        <History className="w-4 h-4 text-rose-500" />
                        <span>প্রোফাইল সংশোধনীর পূর্ণাঙ্গ ইতিহাস লগ (Admin Access History)</span>
                      </div>

                      {!targetMember.editHistory || targetMember.editHistory.length === 0 ? (
                        <div className="p-4 bg-zinc-900 border border-zinc-850 rounded text-center text-zinc-500 italic text-[11px]">
                          কোনো পূর্ববর্তী সংশোধনীর বা পরিবর্তনের ইতিহাস মেলানো যায়নি।
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                          {targetMember.editHistory.map((item: any, i: number) => (
                            <div key={i} className="p-2.5 bg-zinc-900 border border-zinc-850 rounded text-[11px] leading-relaxed">
                              <div className="flex justify-between items-center text-[9px] text-zinc-400 mb-1 font-mono">
                                <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 text-[8px] font-sans">
                                  সংশোধকঃ {item.editedBy}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-rose-500" />
                                  {item.timestamp}
                                </span>
                              </div>
                              
                              <div className="text-zinc-300 font-sans">
                                ক্ষেত্র/ক্ষেত্রসমূহঃ <span className="text-rose-450 font-bold">{item.field}</span>
                              </div>

                              <div className="grid grid-cols-5 gap-1 items-center mt-1 p-1 bg-zinc-950 rounded font-mono text-[9px] border border-zinc-900">
                                <div className="col-span-2 text-rose-400 line-through truncate text-center" title={item.oldValue || '(ফাঁকা)'}>
                                  {item.oldValue || '(ফাঁকা)'}
                                </div>
                                <div className="col-span-1 justify-self-center text-zinc-300">
                                  <ArrowRight className="w-3 h-3" />
                                </div>
                                <div className="col-span-2 text-emerald-400 font-bold truncate text-center" title={item.newValue}>
                                  {item.newValue || '(ফাঁকা)'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Found but status pending / rejected */
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/25 text-amber-500 rounded-lg text-xs leading-relaxed flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <strong className="font-extrabold block text-amber-450 uppercase mb-0.5">Member Found But Not Approved</strong>
                        এই সদস্যপদ আবেদনটি পাওয়া গেছে কিন্তু বর্তমানে এটি এখনও অপেক্ষমাণ (<b>{targetMember.status === 'pending' ? 'Pending' : 'Rejected'}</b>) রয়েছে। জেলা দপ্তর এর অনুমোদনকারী অনুমোদন দিলে তবেই এটি কার্যকর হবে।
                      </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-850 p-4 rounded text-xs space-y-1.5">
                      <div>
                        <span className="text-zinc-500 block uppercase font-bold text-[9px]">সদস্য নাম</span>
                        <strong className="text-white text-sm font-extrabold">{targetMember.name}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block uppercase font-bold text-[9px]">প্রতিষ্ঠান</span>
                        <span className="text-zinc-200 font-semibold">{targetMember.institution}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block uppercase font-bold text-[9px]">বর্তমান স্ট্যাটাস</span>
                        <span className="text-amber-450 font-extrabold capitalize">{targetMember.status}</span>
                      </div>
                    </div>

                    {/* PUBLIC VIEW PROFILE HISTORY SECTION FOR PENDING/REJECTED */}
                    <div className="space-y-3 pt-3 border-t border-zinc-900">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                        <History className="w-4 h-4 text-rose-500" />
                        <span>সংশোধনীর ইতিহাস লগ (Public Update History)</span>
                      </div>

                      {!targetMember.editHistory || targetMember.editHistory.length === 0 ? (
                        <div className="p-3 bg-zinc-900 border border-zinc-850 rounded text-center text-zinc-500 italic text-[11px]">
                          কোনো পূর্ববর্তী সংশোধনীর বা পরিবর্তনের ইতিহাস মেলানো যায়নি।
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                          {targetMember.editHistory.map((item: any, i: number) => (
                            <div key={i} className="p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded text-[11px] leading-relaxed">
                              <div className="flex justify-between items-center text-[9px] text-zinc-400 mb-1 font-mono">
                                <span className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300 text-[8px]">
                                  সংশোধকঃ {item.editedBy}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-rose-500" />
                                  {item.timestamp}
                                </span>
                              </div>
                              
                              <div className="text-zinc-300 font-sans">
                                পরিবর্তিত ক্ষেত্রঃ <span className="text-rose-450 font-bold">{item.field}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                /* Member Not Found in DB */
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-lg text-xs leading-relaxed flex items-start gap-4">
                  <ShieldAlert className="w-6 h-6 shrink-0 text-rose-500 mt-0.5" />
                  <div>
                    <strong className="font-extrabold block text-rose-450 mb-1 text-[13px] uppercase font-sans">Invalid Database Entry!</strong>
                    দুঃখিত, এই রি-ডাইরেক্ট কুয়েরি আইডির বিপরীতে সমাজতান্ত্রিক ছাত্র ফ্রন্ট অনলাইন ডাটাবেজে কোনো অ্যাক্টিভ মেম্বারশিপ খুঁজে পাওয়া যায়নি।
                    <p className="mt-1.5 text-zinc-400">কার্ডটি মেয়াদোত্তীর্ণ, নকল বা জালিয়াতি করা হতে পারে। অনুগ্রহ করে কাগজের মূল রশিদ ও জেলা দপ্তর নথির সাথে তথ্য মিলিয়ে নিন।</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>প্যানেল বন্ধ করুন (Dismiss)</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
