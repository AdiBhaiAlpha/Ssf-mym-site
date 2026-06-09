import React from 'react';
import { Volume2, ChevronRight } from 'lucide-react';
import { News, Circular } from '../types';

interface BreakingNewsProps {
  news: News[];
  circulars: Circular[];
  setCurrentTab: (tab: string) => void;
}

export default function BreakingNews({ news, circulars, setCurrentTab }: BreakingNewsProps) {
  // Combine news and circular titles to form breaking news list
  const breakingItems = [
    ...news.map(n => ({ id: n.id, type: 'news', title: n.title, tab: 'news' })),
    ...circulars.map(c => ({ id: c.id, type: 'circular', title: c.title, tab: 'circulars' }))
  ].slice(0, 5);

  if (breakingItems.length === 0) return null;

  return (
    <div className="bg-rose-600 dark:bg-rose-900 text-white border-b border-rose-700 font-sans shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center h-11 px-4 overflow-hidden text-sm">
        {/* Label Box */}
        <div className="bg-black/20 px-3 py-1 mr-3 flex items-center space-x-1 font-bold text-xs uppercase tracking-wider shrink-0 rounded-xs">
          <Volume2 className="w-3.5 h-3.5 animate-bounce" />
          <span>অনলাইন সারণী:</span>
        </div>

        {/* Ticker Content */}
        <div className="relative flex-1 overflow-hidden h-full flex items-center">
          <div className="flex animate-[marquee_28s_linear_infinite] whitespace-nowrap hover:[animation-play-state:paused] cursor-pointer">
            {breakingItems.map((item, index) => (
              <span
                key={`${item.id}-${index}`}
                onClick={() => setCurrentTab(item.tab)}
                className="inline-flex items-center space-x-2 text-xs md:text-sm mr-12 hover:underline select-none font-semibold"
              >
                <span className="h-1.5 w-1.5 bg-rose-200 rounded-full shrink-0"></span>
                <span className="text-zinc-100 italic">[{item.type === 'news' ? 'সংবাদ' : 'বিজ্ঞপ্তি'}]</span>
                <span>{item.title}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Quick View Button */}
        <button
          onClick={() => setCurrentTab('news')}
          className="hidden md:flex items-center space-x-0.5 text-xs font-bold hover:text-rose-100 bg-black/10 px-2.5 py-1 rounded-sm shrink-0 border border-white/10"
        >
          <span>সকল খবর</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Styled animation helper for tailwind marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
