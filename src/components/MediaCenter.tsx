import React, { useState } from 'react';
import { Image, FileText, LayoutGrid, Award, Shield, Eye, Download, Info, Play, Music, Film } from 'lucide-react';
import { GalleryItem } from '../types';

interface MediaCenterProps {
  gallery: GalleryItem[];
}

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getEmbedUrl = (url: string) => {
  const ytId = getYouTubeId(url);
  return ytId ? `https://www.youtube.com/embed/${ytId}` : url;
};

export default function MediaCenter({ gallery }: MediaCenterProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'photo' | 'poster' | 'infographic' | 'video' | 'gif' | 'audio'>('all');
  const [focusImage, setFocusImage] = useState<GalleryItem | null>(null);

  const filteredMedia = gallery.filter((item) => activeTab === 'all' || item.type === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-805 pb-5 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
          <Image className="text-rose-600 w-7 h-7" />
          <span>মিডিয়া সেন্টার ও বিপ্লবী পোস্টার গ্যালারি</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
          সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহের মিছিল-সমাবেশ, ঐতিহাসিক দেয়ালচিত্র ও প্রগতিশীল ইনফোগ্রাফিক্স গ্যালারি
        </p>
      </div>

      {/* Categories filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { key: 'all', label: 'সকল ফাইল' },
          { key: 'photo', label: 'আন্দোলনের আলোকচিত্র' },
          { key: 'poster', label: 'বিপ্লবী পোস্টার আর্কাইভ' },
          { key: 'infographic', label: 'রাজনৈতিক ইনফোগ্রাফিক্স' },
          { key: 'video', label: 'ভিডিও ফুটেজ' },
          { key: 'gif', label: 'জিআইএফ (GIF)' },
          { key: 'audio', label: 'বিপ্লবী সঙ্গীত ও সমাজ-কথা' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3.5 py-1.5 text-xs rounded transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded overflow-hidden group shadow-xs transition hover:shadow-md"
          >
            {/* Visual Screen Container */}
            <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              {item.type === 'video' ? (
                getYouTubeId(item.url) ? (
                  <img
                    src={`https://img.youtube.com/vi/${getYouTubeId(item.url)}/0.jpg`}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-500 relative">
                    <Film className="w-12 h-12 text-rose-600 mb-2" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">ভিডিও ফাইল</span>
                    <Play className="w-10 h-10 text-white absolute bg-rose-600/90 rounded-full p-2.5 shadow" />
                  </div>
                )
              ) : item.type === 'audio' ? (
                <div className="w-full h-full bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center text-zinc-500 relative">
                  <div className="w-24 h-24 rounded-full border border-zinc-800 bg-zinc-800/40 flex items-center justify-center">
                    <Music className="w-10 h-10 text-rose-500" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mt-3">অডিও/বিপ্লবী গান</span>
                  <Play className="w-10 h-10 text-white absolute bg-zinc-800/95 border border-zinc-700 rounded-full p-2.5 shadow" />
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                />
              )}

              {/* Hover Buttons */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-3 transition-opacity duration-300 z-10">
                <button
                  onClick={() => setFocusImage(item)}
                  className="p-2 bg-white rounded-full text-zinc-900 hover:bg-rose-50 hover:text-rose-600 transition shadow cursor-pointer"
                  title={item.type === 'video' || item.type === 'audio' ? 'পেশাদারি প্লেয়ার' : 'জুম ভিউ'}
                >
                  {item.type === 'video' || item.type === 'audio' ? <Play className="w-4 h-4 fill-current" /> : <Eye className="w-4 h-4" />}
                </button>
                <a
                  href={item.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white rounded-full text-zinc-900 hover:bg-rose-50 hover:text-rose-600 transition shadow"
                  title="সংরক্ষণ করুণ"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>

              {/* Category tags absolute */}
              <span className={`absolute top-3 left-3 text-[9px] uppercase tracking-wider font-bold text-white px-2 py-0.5 rounded z-10 ${
                item.type === 'poster' ? 'bg-rose-600' :
                item.type === 'infographic' ? 'bg-purple-600' :
                item.type === 'video' ? 'bg-amber-600' :
                item.type === 'audio' ? 'bg-blue-600' :
                item.type === 'gif' ? 'bg-pink-600' : 'bg-emerald-600'
              }`}>
                {item.type === 'poster' ? 'পোস্টার' :
                 item.type === 'infographic' ? 'ইনফোগ্রাফিক' :
                 item.type === 'video' ? 'ভিডিও ফুটেজ' :
                 item.type === 'audio' ? 'সঙ্গীত/বক্তব্য' :
                 item.type === 'gif' ? 'জিআইএফ (GIF)' : 'ফটোগ্রাফ'}
              </span>
            </div>

            {/* Description Text fields */}
            <div className="p-4">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-850 dark:text-zinc-200 truncate group-hover:text-rose-600 dark:group-hover:text-rose-450 transition">
                {item.title}
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-1">{item.date}</p>
            </div>
          </div>
        ))}

        {filteredMedia.length === 0 && (
          <div className="col-span-3 p-16 border border-dashed rounded text-center text-zinc-400">
            এই ক্যাটাগরিতে কোনো ছবি বা ফাইল উপলব্ধ নেই।
          </div>
        )}
      </div>

      {/* Focus zoom / Play Modal view */}
      {focusImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setFocusImage(null)}>
          <div className="max-w-4xl max-h-[90vh] w-full relative text-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setFocusImage(null)}
              className="absolute -top-10 right-0 text-white font-bold text-xs bg-black/60 px-3 py-1 rounded cursor-pointer hover:bg-rose-600 transition"
            >
              ✕ বন্ধ করুন
            </button>
            <div className="border border-zinc-800 bg-zinc-950 overflow-hidden rounded shadow-2xl max-h-[75vh] flex items-center justify-center p-2">
              {focusImage.type === 'video' ? (
                getYouTubeId(focusImage.url) ? (
                  <iframe
                    src={getEmbedUrl(focusImage.url)}
                    className="w-full aspect-[16/9] max-h-[70vh] rounded"
                    allowFullScreen
                    title={focusImage.title}
                  />
                ) : (
                  <video
                    src={focusImage.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[70vh] rounded"
                  />
                )
              ) : focusImage.type === 'audio' ? (
                <div className="p-8 w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full border-2 border-rose-500 bg-zinc-800 flex items-center justify-center mb-6">
                    <Music className="w-10 h-10 text-rose-500" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100 mb-4">{focusImage.title}</h4>
                  <audio
                    src={focusImage.url}
                    controls
                    autoPlay
                    className="w-full mt-2"
                  />
                </div>
              ) : (
                <img
                  src={focusImage.url}
                  alt={focusImage.title}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[70vh] object-contain mx-auto"
                />
              )}
            </div>
            <div className="mt-4 text-white text-sm font-sans font-bold text-center">
              {focusImage.title} <span className="font-mono text-xs text-zinc-400 ml-1">({focusImage.date})</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
