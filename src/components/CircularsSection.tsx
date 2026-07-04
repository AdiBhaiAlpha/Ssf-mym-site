import React, { useState } from 'react';
import { FileText, Calendar, Bell, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Circular } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CircularsSectionProps {
  circulars: Circular[];
  isVerifiedMember?: boolean;
  onSelectItem?: (type: string, id: string) => void;
}

export default function CircularsSection({ circulars, isVerifiedMember = false, onSelectItem }: CircularsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Synchronize expandedId with URL for clean route pathnames and bookmark sharing
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const circId = params.get('circularId') || params.get('noticeId');
    if (circId && circulars && circulars.length > 0) {
      const found = circulars.some(c => c.id === circId);
      if (found) {
        setExpandedId(circId);
        // Scroll to the expanded circular smoothly
        setTimeout(() => {
          const element = document.getElementById(`circular-${circId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [circulars]);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      const params = new URLSearchParams(window.location.search);
      params.delete('circularId');
      params.delete('noticeId');
      const newQuery = params.toString();
      const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`;
      window.history.replaceState(null, '', newUrl);
    } else {
      setExpandedId(id);
      const params = new URLSearchParams(window.location.search);
      params.set('circularId', id);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-805 pb-5 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
          <FileText className="text-rose-600 w-7 h-7" />
          <span>অফিসিয়াল সার্কুলার ও নোটিশ বোর্ড</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
          ময়মনসিংহ জেলা সংসদ ও সংশ্লিষ্ট থানা/কলেজ শাখার নির্দেশাবলী এবং রেজোলিউশন আর্কাইভ
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {circulars.map((circ) => {
          const isExpanded = expandedId === circ.id;
          const isRestricted = circ.isPrivate && !isVerifiedMember;

          return (
            <div
              key={circ.id}
              id={`circular-${circ.id}`}
              className={`bg-white dark:bg-zinc-950 border rounded-sm overflow-hidden transition-all duration-300 ${
                isExpanded
                  ? isRestricted ? 'border-amber-500 ring-1 ring-amber-500/10 shadow-sm' : 'border-rose-600 shadow-md ring-1 ring-rose-600/10'
                  : 'border-zinc-200 dark:border-zinc-900 hover:border-zinc-350 dark:hover:border-zinc-800'
              }`}
            >
              {/* Header Box */}
              <div
                onClick={() => {
                  if (onSelectItem) {
                    onSelectItem('circular', circ.id);
                  } else {
                    toggleExpand(circ.id);
                  }
                }}
                className="p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-start sm:items-center space-x-4 min-w-0 font-sans">
                  <div className={`p-2.5 rounded shrink-0 ${
                    isRestricted
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
                      : circ.category === 'official'
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600'
                      : circ.category === 'resolution'
                      ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600'
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
                  }`}>
                    {isRestricted ? <Lock className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5 font-sans text-xs">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isRestricted
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : circ.category === 'official'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          : circ.category === 'resolution'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {isRestricted && 'সংরক্ষিত নির্দেশনা'}
                        {!isRestricted && (circ.category === 'official' ? 'অফিসিয়াল সার্কুলার' : circ.category === 'resolution' ? 'কমিটি রেজোলিউশন' : 'সাধারণ নোটিশ')}
                      </span>
                      {circ.isPrivate && (
                        <span className={`text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded ${
                          isVerifiedMember
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                          {isVerifiedMember ? '● সদস্য অ্যাক্সেস অনুমোদিত' : '🔒 শুধুমাত্র সদস্যের জন্য'}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400 font-mono flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{circ.date}</span>
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-zinc-850 dark:text-white leading-snug">
                      {circ.title}
                    </h3>
                  </div>
                </div>

                <div className="text-zinc-400 select-none shrink-0">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              {/* Expansion Content panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10"
                  >
                    <div className="p-6 space-y-4">
                      {isRestricted ? (
                        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded p-6 text-center space-y-4">
                          <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                          <div className="max-w-md mx-auto space-y-2">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-sans">
                              এই কন্টেন্টের অ্যাক্সেস শুধুমাত্র ভেরিফাইড সদস্যদের জন্য সীমিত
                            </h4>
                            <p className="text-xs text-zinc-650 dark:text-zinc-450 leading-relaxed font-sans">
                              এটি ময়মনসিংহ জেলা সংসদের একটি অভ্যন্তরীণ সাংগঠনিক বিবরণী বা সদস্যদের জন্য বিশেষ নোটিশ। প্রকাশনা ও নির্দেশিকার গোপনীয়তা বজায় রাখার স্বার্থে এর অ্যাক্সেস ব্লক রয়েছে। অ্যাক্সেস পেতে দয়া করে "মেম্বার পোর্টাল" ট্যাবে গিয়ে নিবন্ধিত ইমেইল দ্বরা লগইন করুন।
                            </p>
                          </div>
                          
                          <div className="pt-2 text-xs font-mono text-zinc-400">
                            নথি আইডি: {circ.id}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Notice guidelines warning text */}
                          <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400 font-mono">
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span>সংগঠন সদস্যদের জন্য সংরক্ষিত তথ্য নথি। কপিরাইট সংরক্ষিত।</span>
                          </div>

                          <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line font-sans border-l-2 border-zinc-300 dark:border-zinc-800 pl-4">
                            {circ.content}
                          </div>

                          {circ.image && (
                            <div className="my-4 max-w-xl mx-auto rounded overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-xs">
                              <img 
                                src={circ.image} 
                                alt={circ.title} 
                                referrerPolicy="no-referrer"
                                className="w-full object-contain max-h-[400px]" 
                              />
                            </div>
                          )}

                          {circ.pdfUrl && circ.pdfUrl !== '#' && circ.pdfUrl !== '' && (
                            <div className="bg-rose-50/20 dark:bg-zinc-900 border border-rose-100/40 dark:border-zinc-800 p-4 rounded flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <div className="px-2 py-1 bg-rose-600 rounded text-[10px] font-bold text-white uppercase tracking-wider font-mono">PDF Doc</div>
                                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-sans font-semibold">অফিসিয়াল সার্কুলার ফাইল</span>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                <a
                                  href={circ.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 sm:flex-none text-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded transition text-nowrap select-none"
                                >
                                  পিডিএফ দেখুন
                                </a>
                                <a
                                  href={circ.pdfUrl}
                                  download
                                  className="flex-1 sm:flex-none text-center px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold rounded border border-zinc-700 transition text-nowrap"
                                >
                                  ডাউনলোড
                                </a>
                              </div>
                            </div>
                          )}

                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-sm p-4 text-xs font-mono flex flex-col sm:flex-row justify-between items-center gap-3">
                            <span>ডকুমেন্ট আইডি: {circ.id}</span>
                            <div className="flex space-x-2 text-rose-600 dark:text-rose-400 font-sans font-bold">
                              <span>ময়মনসিংহ জেলা সংসদ</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {circulars.length === 0 && (
          <div className="p-16 border border-dashed rounded text-center text-zinc-400">
            এই মুহূর্তে নোটিশ বোর্ডে কোনো সার্কুলার নেই।
          </div>
        )}
      </div>

    </div>
  );
}
