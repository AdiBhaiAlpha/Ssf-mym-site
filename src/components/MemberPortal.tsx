import React from 'react';
import { Award, User, Phone, Mail, MapPin, Calendar, LogOut, CheckCircle2, ShieldCheck, FileText, BookOpen, Clock, Smartphone, Download, Sparkles, Flame } from 'lucide-react';
import { MemberRegistration, News, Circular, Book } from '../types';
import { motion } from 'motion/react';

interface MemberPortalProps {
  member: MemberRegistration;
  onLogout: () => void;
  circulars: Circular[];
  books: Book[];
}

export default function MemberPortal({ member, onLogout, circulars = [], books = [] }: MemberPortalProps) {
  const memberId = `SF-MY-${member.id.substring(member.id.length - 5).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const getGreetingTime = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return 'শুভ সকাল কমরেড';
    if (hr >= 12 && hr < 17) return 'শুভ অপরাহ্ন কমরেড';
    return 'বিপ্লবী ও লাল সালাম কমরেড';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-rose-950/60 p-6 sm:p-10 rounded border border-rose-950/30 text-white mb-8 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 blur-[150px] rounded-full pointer-events-none transition duration-500 group-hover:bg-rose-500/15" />
        <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="bg-rose-600 text-white font-mono text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-widest select-none flex items-center gap-1">
                <Sparkles className="w-3" />
                ডিজিটাল মেম্বার ড্যাশবোর্ড
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-extrabold px-2.5 py-0.5 rounded flex items-center gap-1 select-none border border-emerald-500/20 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                সক্রিয় ভেরিফাইড সদস্য
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug text-white">
              {getGreetingTime()}, <span className="text-rose-500 font-bold">{member.name}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl font-sans leading-relaxed">
              সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহের শিক্ষাবর্ষ ও সাংগঠনিক প্যানেলে যুক্ত হওয়ায় আপনাকে লাল সালাম। সুন্দর, গণতান্ত্রিক ও বৈষম্যহীন শিক্ষাঙ্গন গড়তে আপনার লড়াই আজ থেকে জোরদার হোক। আপনার বৈপ্লবিক আইডি কোড: <strong className="text-rose-450 font-mono select-all bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">{memberId}</strong>।
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 hover:text-rose-400 font-bold text-xs text-zinc-200 border border-zinc-700/60 rounded flex items-center gap-1.5 transition duration-150 cursor-pointer select-none shadow-md hover:border-rose-900/40"
            >
              <LogOut className="w-4 h-4 text-zinc-400" />
              <span>লগআউট সেশন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Digital Member ID Card (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <h2 className="text-sm font-extrabold text-zinc-950 dark:text-white flex items-center gap-2">
              <Award className="text-rose-600 w-5 h-5 shrink-0" />
              <span>ডিজিটাল বৈপ্লবিক সদস্য কার্ড (E-Identity)</span>
            </h2>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">
              কার্ডটি স্ক্রিনশট বা প্রিন্ট নিয়ে ময়মনসিংহের যেকোনো সাংগঠনিক সেলে প্রদর্শন করতে পারেন।
            </p>
          </div>

          {/* Printable Visual Card wrapper */}
          <div className="print:p-0">
            <div className="bg-gradient-to-br from-zinc-950 to-rose-950 p-[1.5px] rounded-lg shadow-2xl overflow-hidden relative group">
              <div className="bg-zinc-950 p-6 relative flex flex-col justify-between min-h-[320.5px]">
                
                {/* Background watermarks */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-48 h-48 bg-rose-600/[0.035] rounded-full flex items-center justify-center border border-dashed border-rose-600/10 font-black text-xs pointer-events-none select-none font-mono">
                  SSF MYM
                </div>

                {/* ID Header */}
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3 relative">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://i.ibb.co.com/F4MKM3R2/20260527-055637.png"
                      alt="সমাজতান্ত্রিক ছাত্র ফ্রন্ট লোগো"
                      className="h-9 w-9 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-black text-rose-500 tracking-tight leading-none leading-3">
                        সমাজতান্ত্রিক ছাত্র ফ্রন্ট
                      </h4>
                      <p className="text-[9px] text-zinc-400 font-mono tracking-widest mt-0.5">
                        MYMENSINGH DISTRICT
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-rose-950 text-rose-450 font-mono text-[9px] font-black border border-rose-900/30 px-2 py-0.5 rounded">
                      ACTIVE MEMBER
                    </span>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="grid grid-cols-12 gap-4 my-5 items-center relative">
                  {/* Photo area simulated gracefully */}
                  <div className="col-span-4 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-rose-500 relative overflow-hidden shadow-inner">
                      <User className="w-8 h-8 opacity-60" />
                      <div className="absolute bottom-0 inset-x-0 bg-rose-600/20 text-[8px] py-0.5 text-center font-bold tracking-wider uppercase font-mono">
                        APPROVED
                      </div>
                    </div>
                  </div>

                  {/* Member info */}
                  <div className="col-span-8 space-y-2">
                    <div>
                      <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider block">নাম / Full Name</span>
                      <h3 className="text-sm font-bold text-white tracking-wide">{member.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider block">শ্রেণী / বর্ষ</span>
                        <span className="text-[10px] text-zinc-300 font-bold block truncate">{member.department || 'তথ্য নাই'}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider block">শিক্ষাঙ্গন</span>
                        <span className="text-[10px] text-zinc-300 font-bold block truncate">{member.institution}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer info */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-850 text-zinc-500 text-[9px]">
                  <div className="font-mono">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-sans">মেম্বারশিপ কোড</span>
                    <strong className="text-zinc-200 text-[11px] font-bold tracking-widest block">{memberId}</strong>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[8px] font-sans block">ইস্যু ডেট</span>
                    <strong className="text-zinc-205 block font-mono font-bold">{member.verifiedAt || member.appliedAt}</strong>
                  </div>
                </div>

              </div>
            </div>

            {/* Print trigger button */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handlePrint}
                className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-90 w bg-transparent dark:bg-zinc-900 hover:text-rose-600 dark:hover:text-rose-450 text-zinc-850 dark:text-zinc-300 rounded font-bold text-xs border border-zinc-250 dark:border-zinc-800 transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 select-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>আইডি কার্ড প্রিন্ট বা ডাউনলোড করুন</span>
              </button>
            </div>
          </div>

          {/* Revolutionary Oath Panel */}
          <div className="p-4 border border-rose-900/35 bg-rose-950/15 rounded space-y-3">
            <h4 className="text-xs font-extrabold text-rose-500 flex items-center gap-1.5 font-sans">
              <Flame className="w-4 h-4 text-rose-600" />
              <span>ঐতিহাসিক বৈপ্লবিক অঙ্গীকার</span>
            </h4>
            <p className="text-[11px] text-zinc-650 dark:text-zinc-400 leading-normal">
              সমাজতান্ত্রিক ছাত্র ফ্রন্ট কোনো প্রাতিষ্ঠানিক ডিগ্রি সংগ্রহের রাজনৈতিক লিয়াজোঁ ক্লাব নয়। এটি সাম্রাজ্যবাদ, পুঁজিবাদ ও সাম্প্রদায়িকতাবিরোধী সর্বজনীন মানবিক লড়াই শক্তিশালী করার বিপ্লব মডিউল। শিক্ষা, সুস্থ সংস্কৃতি ও প্রগতির বিপ্লবী পতাকাতলে সমাজ রূপান্তরে আত্মনিয়োগ করুন।
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic Action items & materials (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <h2 className="text-sm font-extrabold text-zinc-950 dark:text-white flex items-center gap-2">
              <Sparkles className="text-rose-600 w-5 h-5 shrink-0" />
              <span>সদস্য অ্যাকাউন্ট ও নথিপত্র ড্যাশবোর্ড</span>
            </h2>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">
              সংগঠন থেকে প্রকাশিত সর্বশেষ নোটিশ, বই এবং গুরুত্বপূর্ণ কর্মসূচী সমূহ দেখে নিন।
            </p>
          </div>

          {/* Core Member Details Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 pb-2.5 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-rose-600" />
              <span>ব্যক্তিগত মেম্বারশিপ প্রোফাইল</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 block font-mono">মোবাইল ফোন নম্বর</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-200 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-mono">{member.mobile}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 block font-mono">দাপ্তরিক ইমেইল এড্রেস</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-200 flex items-center gap-1 truncate">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="font-mono overflow-hidden pr-2">{member.email || 'তথ্য নাই'}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 block font-mono">জন্ম তারিখ / DOB</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-mono">{member.dob || 'তথ্য নাই'}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 block font-mono">মেইল বা বর্তমান ঠিকানা</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-200 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{member.address}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tabular Shortcuts: Latest Circulars & Study Library */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Box 1: Recent Circulars */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-4 shadow-3xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 pb-2.5 border-b border-zinc-150 dark:border-zinc-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>অভ্যন্তরীণ সার্কুলার ও নোটিশ</span>
                </h4>
                
                <div className="mt-3.5 space-y-2.5 pb-4">
                  {circulars.slice(0, 3).map((circ) => (
                    <div key={circ.id} className="text-[11px] font-sans pb-2 border-b border-zinc-50 dark:border-zinc-900/40 last:border-0">
                      <span className="text-[9px] text-zinc-400 font-mono block">{circ.date}</span>
                      <p className="font-semibold text-zinc-750 dark:text-zinc-300 hover:text-rose-650 cursor-pointer transition line-clamp-1">{circ.title}</p>
                    </div>
                  ))}

                  {circulars.length === 0 && (
                    <p className="text-[10px] text-zinc-450 italic py-4">কোনো নোটিশ আপলোড করা হয়নি।</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-50 dark:border-zinc-900/60">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer">
                  সমস্ত সার্কুলার বোর্ড দেখুন
                </span>
              </div>
            </div>

            {/* Box 2: Revolutionary Library Books */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-4 shadow-3xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 pb-2.5 border-b border-zinc-150 dark:border-zinc-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-rose-600" />
                  <span>মার্ক্সবাদী ও প্রগতিশীল লাইব্রেরি</span>
                </h4>
                
                <div className="mt-3.5 space-y-2.5 pb-4">
                  {books.slice(0, 3).map((book) => (
                    <div key={book.id} className="text-[11px] font-sans pb-2 border-b border-zinc-50 dark:border-zinc-900/40 last:border-0 flex gap-2">
                      <img src={book.coverImage} alt={book.title} className="w-8 h-10 object-cover rounded border border-zinc-200/50" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                      <div>
                        <p className="font-semibold text-zinc-750 dark:text-zinc-300 line-clamp-1">{book.title}</p>
                        <span className="text-[9px] text-zinc-400 block font-sans">লেখকঃ {book.author}</span>
                      </div>
                    </div>
                  ))}

                  {books.length === 0 && (
                    <p className="text-[10px] text-zinc-450 italic py-4">কোনো বই বা ম্যাগাজিন নথিবদ্ধ নেই।</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-50 dark:border-zinc-900/60">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer">
                  লাইব্রেরী ও প্রকাশনা পাতা দেখুন
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
