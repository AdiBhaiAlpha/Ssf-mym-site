import React, { useState, useEffect } from 'react';
import { Newspaper, ChevronRight, BookOpen, UserPlus, PhoneCall, HelpCircle, CalendarClock, History } from 'lucide-react';
import { News, Circular, Event } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HeroProps {
  news: News[];
  circulars: Circular[];
  events: Event[];
  setCurrentTab: (tab: string) => void;
  aboutText: string;
  slogans?: string[];
}

export default function Hero({ news, circulars, events, setCurrentTab, aboutText, slogans }: HeroProps) {
  // Find single featured news or default to first news
  const featuredArticle = news.find(n => n.isFeatured) || news[0];
  const sideArticles = news.filter(n => n.id !== (featuredArticle?.id)).slice(0, 3);
  const recentNotices = circulars.slice(0, 2);
  const nextEvent = events.filter(e => e.status === 'upcoming')[0];

  // Formatting date for traditional feel
  const currentBanglaDate = '২৫ জ্যৈষ্ঠ, ১৪৩৩ বঙ্গাব্দ'; // 2026 June
  const romanVol = 'বর্ষ ৪২, সংখ্যা ৯';

  const getBanglaEnglishDate = () => {
    const d = new Date();
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const banglaMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    
    const toBanglaNum = (num: number) => {
      return num.toString().split('').map(digit => {
        const idx = parseInt(digit, 10);
        return isNaN(idx) ? digit : banglaDigits[idx];
      }).join('');
    };

    const dateStr = toBanglaNum(d.getDate());
    const monthStr = banglaMonths[d.getMonth()];
    const yearStr = toBanglaNum(d.getFullYear());

    return `${dateStr} ${monthStr}, ${yearStr} খ্রিস্টাব্দ`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Traditional Editorial Newspaper Header info */}
      <div className="border-y-2 border-zinc-800 dark:border-zinc-300 py-2.5 flex flex-wrap justify-between items-center text-xs text-zinc-600 dark:text-zinc-400 font-mono mb-8 gap-2">
        <div>{romanVol}</div>
        <div className="text-center font-bold tracking-tight text-rose-600 dark:text-rose-500 font-sans">
          † শোষণের শৃঙ্খল ভাঙার লড়াকু ছাত্র সংগঠন †
        </div>
        <div>ময়মনসিংহ | {currentBanglaDate} | {getBanglaEnglishDate()}</div>
      </div>

      {/* Grid: 3 Columns for Front Page Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-zinc-200 dark:border-zinc-800 pb-8">
        
        {/* Main Column: Featured Article (6/12 Columns) */}
        <div className="lg:col-span-6 border-r-0 lg:border-r border-zinc-200 dark:border-zinc-800 lg:pr-8">
          {featuredArticle ? (
            <motion.article 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="group cursor-pointer"
              onClick={() => setCurrentTab('news')}
            >
              <div className="relative overflow-hidden mb-4 rounded-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 aspect-[16/10]">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  referrerPolicy="no-referrer"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-103"
                />
                <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-xs">
                  বিশেষ প্রকাশনা
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-tight hover:text-rose-600 dark:hover:text-rose-500 transition-colors">
                {featuredArticle.title}
              </h2>
              <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400 my-2 font-mono">
                <span>{featuredArticle.date}</span>
                <span>•</span>
                <span>লিখেছেন: {featuredArticle.author}</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
                {featuredArticle.excerpt}
              </p>
              <span className="inline-flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform">
                <span>বিস্তারিত পড়ুন</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </motion.article>
          ) : (
            <div className="p-8 border border-dashed rounded-lg text-center text-zinc-400">
              কোনো সংবাদ নিবন্ধ এই মুহূর্তে উপলব্ধ নেই।
            </div>
          )}
        </div>

        {/* Column 2: Side News Feed (3/12 Columns) */}
        <div className="lg:col-span-3 border-r-0 lg:border-r border-zinc-200 dark:border-zinc-800 lg:pr-8">
          <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-850 pb-2 mb-4 font-bold">
            অন্যান্য সর্বশেষ খবর
          </h3>
          <div className="space-y-6">
            {sideArticles.map((art) => (
              <article 
                key={art.id} 
                className="group cursor-pointer"
                onClick={() => setCurrentTab('news')}
              >
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono uppercase tracking-wider mb-1">
                  {art.category === 'campus' ? 'ক্যাম্পাস' : art.category === 'political' ? 'রাজনৈতিক' : 'সাংগঠনিক'}
                </div>
                <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-500 transition-colors line-clamp-2">
                  {art.title}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {art.excerpt}
                </p>
                <div className="text-[10px] text-zinc-400 font-mono mt-1.5">{art.date}</div>
              </article>
            ))}
            {sideArticles.length === 0 && (
              <p className="text-xs text-zinc-400">জরুরি বার্তা এই মুহূর্তে খালি।</p>
            )}
          </div>
        </div>

        {/* Column 3: Notices & Events Widget Column (3/12 Columns) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Upcoming Event Widget */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xs p-5">
            <h3 className="text-xs font-mono tracking-wider uppercase border-b border-rose-600/30 dark:border-rose-500/30 pb-2 mb-3 text-rose-600 dark:text-rose-400 font-bold flex items-center space-x-1.5">
              <CalendarClock className="w-4 h-4" />
              <span>নিকটবর্তী কর্মসূচী</span>
            </h3>
            {nextEvent ? (
              <div className="cursor-pointer" onClick={() => setCurrentTab('events')}>
                <h4 className="text-sm font-bold text-zinc-800 dark:text-white hover:text-rose-600 transition">
                  {nextEvent.title}
                </h4>
                <ul className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 space-y-1 font-mono">
                  <li><span className="font-sans font-semibold">তারিখ:</span> {nextEvent.date}</li>
                  <li><span className="font-sans font-semibold">সময়:</span> {nextEvent.time}</li>
                  <li className="truncate"><span className="font-sans font-semibold">স্থান:</span> {nextEvent.venue}</li>
                </ul>
                <span className="inline-flex items-center text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-3 select-none">
                  <span>নাম নিবন্ধন করুন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">এই মুহূর্তে কোনো শিডিউল কর্মসূচি নেই।</p>
            )}
          </div>

          {/* Quick Notice Widget */}
          <div className="border border-zinc-200 dark:border-zinc-850 p-5 rounded-xs bg-white dark:bg-zinc-950">
            <h3 className="text-xs font-mono tracking-wider uppercase text-zinc-400 dark:text-zinc-500 border-b pb-2 mb-3 font-bold">
              জরুরি সার্কুলার / নোটিশ
            </h3>
            <div className="space-y-4">
              {recentNotices.map((notice) => (
                <div 
                  key={notice.id} 
                  className="cursor-pointer group"
                  onClick={() => setCurrentTab('circulars')}
                >
                  <span className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 px-1.5 py-0.5 rounded-sm font-semibold font-mono">
                    {notice.category === 'official' ? 'অফিসিয়াল' : 'নোটিশ'}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-500 mt-1.5">
                    {notice.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{notice.date}</p>
                </div>
              ))}
              {recentNotices.length === 0 && (
                <p className="text-xs text-zinc-400">কোনো বিজ্ঞপ্তি পোস্ট করা হয়নি।</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Organizational Introduction & Quick Button Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8 border-b border-zinc-200 dark:border-zinc-850">
        <div className="md:col-span-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-rose-600" />
            <span>সমাজতান্ত্রিক ছাত্র ফ্রন্ট সম্পর্কে</span>
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3.5 leading-relaxed font-sans max-w-5xl">
            {aboutText}
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={() => setCurrentTab('about')}
              className="text-xs font-semibold px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-zinc-800"
            >
              ঘোষণা ও দালিলিক নীতি
            </button>
            <button
              onClick={() => setCurrentTab('leadership')}
              className="text-xs font-semibold px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-zinc-800"
            >
              জেলা নেতৃবৃন্দের তালিকা
            </button>
          </div>
        </div>

        {/* Quick Commands Bento Grid */}
        <div className="flex flex-col justify-center space-y-3">
          <a
            href="https://tally.so/r/44Jz8O"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full p-4 bg-rose-600 text-white rounded shadow-sm hover:bg-rose-700 transition"
          >
            <div className="text-left">
              <p className="text-xs font-mono uppercase tracking-wider text-rose-100">সদস্যতা ফর্ম (Tally)</p>
              <h4 className="text-sm font-bold">অনলাইন সদস্য হোন</h4>
            </div>
            <UserPlus className="w-5 h-5" />
          </a>

          <button
            onClick={() => setCurrentTab('books')}
            className="flex items-center justify-between w-full p-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
          >
            <div className="text-left">
              <p className="text-xs font-mono uppercase tracking-wider opacity-85">পড়াশোনা শাখা</p>
              <h4 className="text-sm font-bold">রাজনৈতিক বই ও ই-লাইব্রেরি</h4>
            </div>
            <BookOpen className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Socialist Student Front Slogans / Motto Banner */}
      <div className="pt-8 text-center max-w-3xl mx-auto border-t border-zinc-200 dark:border-zinc-800 mt-12 pb-4">
        <h3 className="text-xl sm:text-2xl font-bold font-sans italic text-rose-600 dark:text-rose-500">
          "ঐক্য, সংগ্রাম, প্রগতি — সমাজতান্ত্রিক ছাত্র ফ্রন্ট!"
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono uppercase tracking-widest mb-8">
          শিক্ষা ব্যবস্থার বাণিজ্যিকীকরণ-সাম্প্রদায়িকীরণ রুখে দাঁড়াও!
        </p>

        {/* Dynamic Rotating Slogans with AnimatePresence */}
        {(() => {
          const defaultSlogans = [
            "দুনিয়ার মজদুর, এক হও!",
            "ইনকিলাব জিন্দাবাদ! বিপ্লব দীর্ঘজীবী হোক!",
            "সাম্রাজ্যবাদ নিপাত যাক, মানবতাবাদ মুক্তি পাক!",
            "ফ্যাসিবাদ নিপাত যাক, জনগণ মুক্তি পাক!",
            "সর্বহারার একক দল - বাসদ জিন্দাবাদ",
            "শ্রেণি সংগ্রাম জিন্দাবাদ!",
            "লাঙ্গল যার, জমি তার!",
            "যার শ্রম তার ধন, এই আমাদের পণ!",
            "জোর জুলুম চলবে না, কৃষক-শ্রমিক সইবে না!",
            "শ্রমিকের রক্তে কেনা, মালিকের বিলাসিতা চলবে না!",
            "আট ঘণ্টা কাজ, আট ঘণ্টা বিশ্রাম, আট ঘণ্টা বিনোদন!",
            "শিক্ষা-সংস্কৃতি-প্রগতি, আমাদের মূল গতি!",
            "শিক্ষা কোনো পণ্য না, শিক্ষা আমার অধিকার!",
            "শিক্ষা, সন্ত্রাস - একসাথে চলে না",
            "লড়াই লড়াই লড়াই চাই, লড়াই করে বাঁচতে চাই!",
            "পুঁজিবাদ নিপাত যাক, समाजতন্ত্র মুক্তি পাক!",
            "ধনীদের গিলে খাও! (Eat the rich!)",
            "লুটপাটের রাজত্ব, ভেঙে করো চুরমার!",
            "There is only one solution, communist revolution!",
            "জাত-পাত-ধর্ম দূর করো, মানুষের পরিচয় বড় করো!",
            "যুদ্ধ নয়, শান্তি চাই!",
            "নারীর ওপর বৈষম্য ও নিপীড়ন, সইবে না এ আন্দোলন!",
            "অসাম্প্রদায়িক চেতনার বাংলাদেশ গড়ে তোলো!"
          ];
          const list = slogans && slogans.length > 0 ? slogans : defaultSlogans;
          const [index, setIndex] = useState(0);

          useEffect(() => {
            const timer = setInterval(() => {
              setIndex((prev) => (prev + 1) % list.length);
            }, 3000);
            return () => clearInterval(timer);
          }, [list]);

          return (
            <div className="bg-rose-50/20 dark:bg-zinc-900/45 border border-rose-100/40 dark:border-zinc-800 p-6 rounded-sm shadow-xs max-w-xl mx-auto flex flex-col justify-center items-center min-h-[110px]">
              <span className="text-[9px] uppercase tracking-wider font-mono text-rose-600 dark:text-rose-400 font-bold mb-2.5 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded select-none">
                আমাদের শ্লোগানসমূহ
              </span>
              <div className="relative w-full h-8 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="text-xs sm:text-sm font-sans font-extrabold text-zinc-900 dark:text-zinc-100 text-center select-none"
                  >
                    {list[index]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
