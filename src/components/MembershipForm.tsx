import React, { useState } from 'react';
import { UserPlus, ShieldAlert, CheckCircle2, Search, UserCheck, RefreshCw, X, ArrowRight, ShieldCheck, HeartHandshake, Landmark, FileCheck } from 'lucide-react';
import { MemberRegistration } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface MembershipFormProps {
  onRegisterMember: (registration: Omit<MemberRegistration, 'id' | 'status' | 'appliedAt'>) => Promise<MemberRegistration | null>;
  membersList: MemberRegistration[];
}

export default function MembershipForm({ onRegisterMember, membersList }: MembershipFormProps) {
  // Application modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Application forms State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [type, setType] = useState<'member' | 'volunteer'>('member');

  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search/Verification features
  const [searchMobile, setSearchMobile] = useState('');
  const [verifiedMember, setVerifiedMember] = useState<MemberRegistration | null>(null);
  const [searchHasRun, setSearchHasRun] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !institution.trim()) return;

    setSubmitting(true);
    const added = await onRegisterMember({
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      institution: institution.trim(),
      department: department.trim(),
      academicYear: academicYear.trim(),
      address: address.trim(),
      dob,
      type
    });
    setSubmitting(false);

    if (added) {
      setAppliedSuccess(true);
      // Clean states
      setName('');
      setMobile('');
      setEmail('');
      setInstitution('');
      setDepartment('');
      setAcademicYear('');
      setAddress('');
      setDob('');
    }
  };

  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchHasRun(true);
    const found = membersList.find(m => m.mobile === searchMobile.trim());
    if (found) {
      setVerifiedMember(found);
    } else {
      setVerifiedMember(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white flex items-center justify-center sm:justify-start gap-3">
              <UserPlus className="text-rose-600 w-8 h-8 shrink-0" />
              <span>অনলাইন সদস্যভুক্তি ও ছাত্র-স্বেচ্ছাসেবী সেল</span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-2 font-mono">
              শিক্ষা-সংস্কৃতি-প্রগতির বিপ্লবী পতাকাতলে সমাজতান্ত্রিক সমাজ বিনির্মাণের ছাত্র শক্তিতে যুক্ত হোন
            </p>
          </div>
          <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-3 py-1.5 rounded-full select-none text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider font-mono">
            <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping"></span>
            মেম্বারশিপ পোর্টাল সক্রিয়
          </div>
        </div>
      </div>

      {/* Recruiter Showcase & Verification Layout (Optimized Minimal Two-Column Split Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 items-stretch">
        
        {/* Left Column: Premium landing card with Join Us primary CTA */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-gradient-to-br from-zinc-900 via-zinc-950 to-rose-950/50 dark:from-black dark:via-zinc-950 dark:to-zinc-90 w-full p-6 sm:p-10 rounded border border-zinc-800 shadow-xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="space-y-4">
            <span className="bg-rose-600 text-white text-[9px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded font-mono select-none">
              সদস্য আহ্বান ২০২৫-২৬
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-snug">
              শিক্ষা ব্যবস্থা বাণিজ্যিকীকরণ ও <br className="hidden sm:inline" />
              <span className="text-rose-500">সাম্প্রদায়িকীকরনের পুঁজিবাদী চক্রান্ত</span> রুখে দাঁড়ান!
            </h2>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-lg">
              জ্ঞানভিত্তিক, বৈষম্যহীন এবং বিজ্ঞানমনস্ক একমুখী শিক্ষা ব্যবস্থার দাবিতে এবং সুন্দর বৈপ্লবিক সমাজ গঠনে ময়মনসিংহের শিক্ষাঙ্গনে ছাত্র ফ্রন্ট লড়ছে অগ্রভাবে। রাজপথের বৈপ্লবিক জোয়ারে আপনার অবদান আজই নিশ্চিত করুন।
            </p>
          </div>

          <div className="mt-8 space-y-5">
            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={() => setIsFormModalOpen(true)}
                className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer border border-rose-500 hover:scale-[1.02] select-none"
              >
                <UserCheck className="w-4 h-4" />
                <span>সদস্য হতে আবেদন করুন (Join Us)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="https://tally.so/r/44Jz8O"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded text-xs font-bold transition-all border border-zinc-700 select-none cursor-pointer flex items-center gap-1.5"
              >
                <span>অফিসিয়াল Tally বাটন</span>
              </a>
            </div>

            <p className="text-[10px] text-zinc-500 font-mono">
              ★ ৩ মিনিটে ফর্ম সাবমিশন সম্পন্ন হলে জেলা সাংগঠনিক সেল থেকে আপনার মোবাইল নম্বরে নিশ্চিতকরণ বার্তার সাথে যোগাযোগ ও পরিচিতি দেয়া হবে।
            </p>
          </div>
        </div>

        {/* Right Column: Instant Member Verification (Saves Space, Minimal layout) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded border border-zinc-200 dark:border-zinc-900 shadow-xs">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-rose-600 dark:text-rose-500 mb-3.5 font-bold flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>ডিজিটাল সদস্যতা ভেরিফিকেশন সেল</span>
            </h3>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-sans">
              আপনি কি বিগত সময়ে ময়মনসিংহ মেডিকেল কলেজ, আনন্দ মোহন কলেজ বা অন্য কোনো ক্যাম্পাস শাখায় নিবন্ধিত হয়েছেন? আপনার মোবাইল নম্বর দিয়ে তাৎক্ষণিক ভেরিফাইড আইডি কার্ড ও একটিভ মেম্বার ডাটা দেখে নিন।
            </p>

            <form onSubmit={handleVerifySearch} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 font-mono">নিবন্ধিত মোবাইল নম্বর</label>
                <input
                  type="tel"
                  required
                  placeholder="যেমনঃ ০১৭১১-xxxxxx"
                  value={searchMobile}
                  onChange={(e) => { 
                    setSearchMobile(e.target.value); 
                    setSearchHasRun(false); 
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-900 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold rounded transition cursor-pointer select-none"
              >
                ডিজিটাল অনুসন্ধান করুন
              </button>
            </form>
          </div>

          {/* Results Output */}
          <div className="mt-6 font-sans">
            {searchHasRun && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-zinc-250 dark:border-zinc-800 pt-4"
              >
                {verifiedMember ? (
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-4 border border-emerald-200 dark:border-emerald-800/40 rounded text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-450">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>সক্রিয় এবং রেজিস্টার্ড বৈপ্লবিক সদস্য</span>
                    </div>
                    <ul className="space-y-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-350 bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded border border-emerald-100/50 dark:border-zinc-800/40">
                      <li><strong className="font-sans text-zinc-500">নাম:</strong> {verifiedMember.name}</li>
                      <li><strong className="font-sans text-zinc-500">মেম্বার আইডি:</strong> SF-MY-{verifiedMember.id.substring(7, 12).toUpperCase()}</li>
                      <li><strong className="font-sans text-zinc-500">শিক্ষাঙ্গন:</strong> {verifiedMember.institution}</li>
                      <li><strong className="font-sans text-zinc-500">অবস্থা:</strong> <span className="text-emerald-600 font-bold">অনুমোদিত (সক্রিয়)</span></li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 p-4 border border-rose-200 dark:border-rose-900/30 rounded text-xs leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> মোবাইল নম্বর পাওয়া যায়নি</p>
                    <p className="text-[10px] text-zinc-550 dark:text-zinc-400">ব্যবহৃত মোবাইল নম্বরের বিপরীতে কোনো অনুমোদিত সক্রিয় সদস্য পাওয়া যায়নি। হয়তো আবেদনটি বর্তমানে জেলা দপ্তরে যাচাইকরণাধীন রয়েছে।</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

      </div>

      {/* Value Pillars section (Educative layout element to increase conversion rate) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4 font-sans text-center md:text-left">
        <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50/20 dark:bg-zinc-950/20 space-y-2">
          <div className="w-8 h-8 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 flex items-center justify-center mx-auto md:mx-0">
            <Landmark className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">১. শিক্ষানীতির আমূল পরিবর্তন</h4>
          <p className="text-[11px] text-zinc-550 dark:text-zinc-400 leading-normal">
            শিক্ষা ব্যবসায়ের হাতিয়ার নয়, বরং প্রতিটি মানুষের মৌলিক অধিকার। বানিজ্যিকীকরণ রুখে গণতান্ত্রিক বৈষম্যহীন একমুখী শিক্ষা বিনির্মাণ আমাদের লক্ষ্য।
          </p>
        </div>

        <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50/20 dark:bg-zinc-950/20 space-y-2">
          <div className="w-8 h-8 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 flex items-center justify-center mx-auto md:mx-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">২. রাজপথ ও শিক্ষাঙ্গনের মুক্তি</h4>
          <p className="text-[11px] text-zinc-550 dark:text-zinc-400 leading-normal">
            মেডিকেল, আনন্দ মোহন, নজরুল বিশ্ববিদ্যালয় সহ ময়মনসিংহের প্রতিটি ক্যাম্পাসে লেজুড়ভিত্তিক ভীতি ও দখলদারমুক্ত প্রগতিশীল পরিবেশ কায়েম।
          </p>
        </div>

        <div className="p-5 border border-zinc-200 dark:border-zinc-805 rounded bg-zinc-50/20 dark:bg-zinc-950/20 space-y-2">
          <div className="w-8 h-8 rounded bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 flex items-center justify-center mx-auto md:mx-0">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">৩. আত্মত্যাগী রাজনৈতিক শক্তি</h4>
          <p className="text-[11px] text-zinc-550 dark:text-zinc-400 leading-normal">
            ব্যক্তিগত ক্ষমতার লালসা উচ্ছেদ করে সাধারণ মেহনতি শিক্ষার্থীদের শোষণমুক্ত সমাজতান্ত্রিক সমাজ অভিমুখে পথ দেখানোই বিপ্লবের চালিকাশক্তি।
          </p>
        </div>
      </div>


      {/* Application Intake Popup Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!submitting) setIsFormModalOpen(false); }}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Body Centered */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded shadow-2xl max-w-2xl w-full overflow-hidden p-6 sm:p-8"
              >
                {/* Modal Title & Close Button */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <UserPlus className="text-rose-600 w-5 h-5 shrink-0" />
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">অনলাইন ভর্তি আবেদন পত্র (সদস্য ও স্বেচ্ছাসেবক)</h3>
                  </div>
                  <button
                    onClick={() => setIsFormModalOpen(false)}
                    disabled={submitting}
                    className="p-1 px-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-white rounded text-xs font-bold transition-all cursor-pointer disabled:opacity-30"
                    title="বন্ধ করুন"
                  >
                    ✕
                  </button>
                </div>

                {/* Submitting Success Status View in Modal */}
                {appliedSuccess ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10 animate-bounce" />
                    </div>
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">আবেদনটি সফলভাবে জেলা দপ্তরে গৃহীত হয়েছে!</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                      সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহে আপনার আবেদন সফলভাবে নথিবদ্ধ হয়েছে। জেলা দপ্তর সেল থেকে আমাদের প্রতিনিধি আপনার প্রদত্ত সেল নম্বরে যোগাযোগ করে পরবর্তী কর্মসূচীর আপডেট প্রদান করবে।
                    </p>
                    <div className="pt-4 flex justify-center gap-3">
                      <button
                        onClick={() => { setAppliedSuccess(false); }}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded cursor-pointer transition-all"
                      >
                        নতুন সদস্য যুক্ত করুন
                      </button>
                      <button
                        onClick={() => { 
                          setAppliedSuccess(false); 
                          setIsFormModalOpen(false); 
                        }}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded cursor-pointer transition-all"
                      >
                        ফিরে যান (ড্যাশবোর্ড)
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-300 mb-1 font-mono uppercase tracking-wider">আবেদনের ক্যাটাগরি *</label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as any)}
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded focus:outline-none"
                        >
                          <option value="member">সক্রিয় সাংগঠনিক সদস্য (Full Member)</option>
                          <option value="volunteer">ছাত্র স্বেচ্ছাসেবী প্যানেল (Volunteer Representative)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-300 mb-1 font-mono uppercase tracking-wider">সম্পূর্ণ বাংলা নাম *</label>
                        <input
                          type="text"
                          required
                          id="pop-reg-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded focus:outline-none"
                          placeholder="যেমনঃ চিত্রণ ভট্টাচার্য"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-300 mb-1 font-mono uppercase tracking-wider">মোবাইল ফোন নম্বর *</label>
                        <input
                          type="tel"
                          required
                          id="pop-reg-mobile"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded focus:outline-none"
                          placeholder="০১৭১১-xxxxxx"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-300 mb-1 font-mono uppercase tracking-wider">ইমেইল এড্রেস (ঐচ্ছিক)</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded focus:outline-none"
                          placeholder="name@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-300 mb-1 font-mono uppercase tracking-wider">শিক্ষা প্রতিষ্ঠান *</label>
                        <input
                          type="text"
                          required
                          id="pop-reg-college"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded focus:outline-none"
                          placeholder="উদাঃ আনন্দ মোহন কলেজ"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-300 mb-1 font-mono uppercase tracking-wider">শ্রেণী / বর্ষ</label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded focus:outline-none"
                          placeholder="উদাঃ স্নাতক সম্মান ৩য় বর্ষ"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-300 mb-1 font-mono uppercase tracking-wider">শিক্ষাবর্ষ / সেশন</label>
                        <input
                          type="text"
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded focus:outline-none"
                          placeholder="২০২৩-২৪"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-300 mb-1 font-mono uppercase tracking-wider">জন্ম তারিখ</label>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-905 dark:text-white rounded focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-650 dark:text-zinc-300 mb-1 font-mono uppercase tracking-wider">ঠিকানা *</label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded focus:outline-none"
                          placeholder="বর্তমান মেসের নাম বা স্থানীয় ঠিকানা"
                        />
                      </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-900 p-3.5 border border-zinc-150 dark:border-zinc-850 rounded leading-normal space-y-1 text-zinc-650 dark:text-zinc-400">
                      <p className="font-bold text-rose-600 dark:text-rose-500">সংগঠনের অঙ্গীকার ঘোষণাঃ</p>
                      <p>আমি সাম্রাজ্যবাদ, পুঁজিবাদ ও সাম্প্রদায়িকতাবিরোধী গণতান্ত্রিক মানবিক লড়াই শক্তিশালী করতে ভূমিকা রাখবো।</p>
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 font-sans">
                      <button
                        type="button"
                        onClick={() => setIsFormModalOpen(false)}
                        disabled={submitting}
                        className="px-4 py-2 border border-zinc-300 dark:border-zinc-850 bg-white hover:bg-zinc-55 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-250 font-bold rounded cursor-pointer text-xs"
                      >
                        বাতিল করুন
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded cursor-pointer text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>দাখিল করা হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>আবেদনপত্র সাবমিট করুন</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
