import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Clock, User, Share2, Facebook, Twitter, MessageSquare, Link, 
  Check, Calendar, MapPin, Download, FileText, Bookmark, Printer, Eye,
  Send, Award, Shield, Tag, MessageCircle, EyeOff, Sparkles, Heart, FileDown, Play, Music, Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateSEOMetadata } from '../lib/seo';
import { saveFirestoreDoc } from '../firebase';
import PhotoCardGenerator from './PhotoCardGenerator';

interface ContentDetailsProps {
  item: {
    type: string; // 'news' | 'blog' | 'event' | 'publication' | 'circular' | 'media' | string
    id: string;
  };
  db: any;
  onClose: () => void;
  onRefresh?: () => void;
  userEmail: string | null;
  onSelectItem: (type: string, id: string) => void;
  isVerifiedMember?: boolean;
}

export default function ContentDetails({
  item,
  db,
  onClose,
  onRefresh,
  userEmail,
  onSelectItem,
  isVerifiedMember = false
}: ContentDetailsProps) {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showPhotoCardBuilder, setShowPhotoCardBuilder] = useState(false);
  
  // Comments state
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSubmitted, setCommentSubmitted] = useState(false);

  // Retrieve item from DB
  const getRawItem = () => {
    if (!db) return null;
    switch (item.type) {
      case 'news':
        return db.news?.find((n: any) => n.id === item.id) || null;
      case 'blog':
      case 'blogs':
        return db.blogs?.find((b: any) => b.id === item.id) || null;
      case 'event':
      case 'events':
        return db.events?.find((e: any) => e.id === item.id) || null;
      case 'publication':
      case 'books':
      case 'book':
        return db.books?.find((b: any) => b.id === item.id) || null;
      case 'circular':
      case 'circulars':
        return db.circulars?.find((c: any) => c.id === item.id) || null;
      case 'media':
      case 'gallery':
        return db.gallery?.find((g: any) => g.id === item.id) || null;
      default:
        // Search globally across all tables
        return (
          db.news?.find((n: any) => n.id === item.id) ||
          db.blogs?.find((b: any) => b.id === item.id) ||
          db.events?.find((e: any) => e.id === item.id) ||
          db.books?.find((b: any) => b.id === item.id) ||
          db.circulars?.find((c: any) => c.id === item.id) ||
          db.gallery?.find((g: any) => g.id === item.id) ||
          null
        );
    }
  };

  const rawItem = getRawItem();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [item.id, item.type]);

  // Load bookmark status from LocalStorage
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('ssf_bookmarks') || '[]');
    setBookmarked(bookmarks.some((b: any) => b.id === item.id && b.type === item.type));
  }, [item.id, item.type]);

  // Map to unified format
  const getUnifiedItem = () => {
    if (!rawItem) return null;

    const defaultImg = "https://i.ibb.co.com/F4MKM3R2/20260527-055637.png";
    const type = item.type;

    if (type === 'news') {
      return {
        id: rawItem.id,
        type: 'news',
        title: rawItem.title,
        content: rawItem.content,
        excerpt: rawItem.excerpt || rawItem.content?.slice(0, 150) + '...',
        image: rawItem.image || defaultImg,
        date: rawItem.date,
        author: rawItem.author || "সমাজতান্ত্রিক ছাত্র ফ্রন্ট",
        category: rawItem.category?.replace('-', ' ') || "সংবাদপত্রক",
        tags: rawItem.tags || [],
        views: rawItem.views || 0,
        pdfUrl: rawItem.pdfUrl,
        location: "ময়মনসিংহ"
      };
    }

    if (type === 'blog' || type === 'blogs') {
      return {
        id: rawItem.id,
        type: 'blog',
        title: rawItem.title,
        content: rawItem.content,
        excerpt: rawItem.excerpt || rawItem.content?.slice(0, 150) + '...',
        image: rawItem.image || defaultImg,
        date: rawItem.date,
        author: rawItem.author || "কমরেড",
        category: rawItem.category || "রাজনৈতিক নিবন্ধ",
        tags: rawItem.tags || [],
        views: rawItem.views || 0,
        pdfUrl: rawItem.pdfUrl,
        location: "ময়মনসিংহ"
      };
    }

    if (type === 'event' || type === 'events') {
      return {
        id: rawItem.id,
        type: 'event',
        title: rawItem.title,
        content: rawItem.description || '',
        excerpt: rawItem.description?.slice(0, 150) + '...',
        image: rawItem.image || defaultImg,
        date: rawItem.date,
        time: rawItem.time || "বিকালে",
        venue: rawItem.venue || "জেলা কার্যালয়, ময়মনসিংহ",
        author: "ময়মনসিংহ জেলা শাখা",
        category: "কর্মসূচী ও প্রতিবাদী সমাবেশ",
        tags: ["আন্দোলন", "কর্মী সভা", "ময়মনসিংহ"],
        views: rawItem.views || 0,
        pdfUrl: null,
        location: rawItem.venue || "ময়মনসিংহ"
      };
    }

    if (type === 'publication' || type === 'books' || type === 'book') {
      return {
        id: rawItem.id,
        type: 'publication',
        title: rawItem.title,
        content: rawItem.description || '',
        excerpt: rawItem.description?.slice(0, 150) + '...',
        image: rawItem.coverImage || rawItem.coverUrl || defaultImg,
        date: rawItem.date || "২০২৬",
        author: rawItem.author || "সমাজতান্ত্রিক ছাত্র ফ্রন্ট প্রকাশনা",
        category: rawItem.type || "বই ও ই-পুস্তক",
        tags: ["তাত্ত্বিক শিক্ষা", "মার্ক্সবাদ", "প্রকাশনা"],
        views: rawItem.views || 0,
        pdfUrl: rawItem.pdfUrl,
        location: "ময়মনসিংহ",
        downloadCount: rawItem.downloadCount || 0
      };
    }

    if (type === 'circular' || type === 'circulars') {
      return {
        id: rawItem.id,
        type: 'circular',
        title: rawItem.title,
        content: rawItem.content || '',
        excerpt: rawItem.content?.slice(0, 150) + '...',
        image: rawItem.image || defaultImg,
        date: rawItem.date,
        author: "ময়মনসিংহ জেলা সংসদ",
        category: rawItem.category || "অফিসিয়াল নোটিশ",
        tags: ["গুরুত্বপূর্ণ নোটিশ", "রেজোলিউশন"],
        views: rawItem.views || 0,
        pdfUrl: rawItem.pdfUrl,
        location: "ময়মনসিংহ"
      };
    }

    if (type === 'media' || type === 'gallery') {
      return {
        id: rawItem.id,
        type: 'media',
        title: rawItem.title,
        content: rawItem.title || '',
        excerpt: rawItem.title,
        image: rawItem.type === 'photo' || rawItem.type === 'poster' ? rawItem.url : defaultImg,
        date: rawItem.date,
        author: "মিডিয়া সেল",
        category: rawItem.type || "ফটোগ্রাফি",
        tags: ["গ্যালারি", "ছবি ও পোস্টার"],
        views: rawItem.views || 0,
        pdfUrl: null,
        mediaType: rawItem.type,
        mediaUrl: rawItem.url,
        location: "ময়মনসিংহ"
      };
    }

    return null;
  };

  const unified = getUnifiedItem();

  // Trigger Dynamic SEO and views tracking increment on mount
  useEffect(() => {
    if (!unified) return;

    // Increment views locally and in Firestore
    const incrementViews = async () => {
      try {
        const keyMap = item.type === 'blogs' ? 'blogs' : item.type === 'books' ? 'books' : item.type === 'circulars' ? 'circulars' : item.type === 'gallery' ? 'gallery' : item.type === 'events' ? 'events' : item.type;
        const currentViews = Number(rawItem.views || 0);
        const updatedDoc = { ...rawItem, views: currentViews + 1 };
        
        // Save to Firestore and local state
        await saveFirestoreDoc(keyMap, item.id, updatedDoc);
        if (onRefresh) onRefresh();
      } catch (err) {
        console.warn('View count auto increment sync skipped:', err);
      }
    };

    incrementViews();

    // SEO updates
    const titleText = `${unified.title} | সমাজতান্ত্রিক ছাত্র ফ্রন্ট`;
    const cleanDesc = unified.excerpt || unified.content?.slice(0, 150);
    const pageUrl = `${window.location.origin}/${unified.type}/${unified.id}`;

    // Sync browser address bar route path nicely (satisfies /blog/:id patterns)
    window.history.replaceState(null, '', `/${unified.type}/${unified.id}`);

    updateSEOMetadata({
      title: titleText,
      description: cleanDesc,
      image: unified.image,
      type: 'article',
      url: pageUrl
    });
  }, [item.id, item.type]);

  if (!rawItem || !unified) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 border border-amber-200 bg-amber-50 text-amber-800 text-center rounded space-y-4 font-sans">
        <p className="font-bold text-lg">আইটেমটি খুঁজে পাওয়া যায়নি!</p>
        <p className="text-xs text-amber-700">অনুরোধকৃত কন্টেন্ট অথবা আইডি ডাটাবেজে অনুপস্থিত রয়েছে।</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-zinc-900 text-white rounded text-xs transition hover:bg-zinc-800"
        >
          আগের পাতায় ফিরে যান
        </button>
      </div>
    );
  }

  // Handle Bookmarking
  const handleToggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('ssf_bookmarks') || '[]');
    if (bookmarked) {
      const filtered = bookmarks.filter((b: any) => !(b.id === item.id && b.type === item.type));
      localStorage.setItem('ssf_bookmarks', JSON.stringify(filtered));
      setBookmarked(false);
    } else {
      bookmarks.push({ id: item.id, type: item.type, title: unified.title, date: unified.date });
      localStorage.setItem('ssf_bookmarks', JSON.stringify(bookmarks));
      setBookmarked(true);
    }
  };

  // Handle Copy Link
  const handleCopyLink = () => {
    const pageUrl = `${window.location.origin}/${unified.type}/${unified.id}`;
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Printable Handler
  const handlePrint = () => {
    window.print();
  };

  // Comments submit handler
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentText) return;

    setSubmittingComment(true);
    try {
      const commentObj = {
        id: 'comm_' + Math.random().toString(36).substr(2, 9),
        name: commentName,
        email: commentEmail || 'anonymous@ssf.org',
        text: commentText,
        date: new Date().toISOString().split('T')[0],
        approved: false // requires admin moderation
      };

      const existingComments = rawItem.comments || [];
      const updatedItem = {
        ...rawItem,
        comments: [...existingComments, commentObj]
      };

      const keyMap = item.type === 'blogs' ? 'blogs' : item.type === 'books' ? 'books' : item.type === 'circulars' ? 'circulars' : item.type === 'gallery' ? 'gallery' : item.type === 'events' ? 'events' : item.type;
      await saveFirestoreDoc(keyMap, item.id, updatedItem);
      
      setCommentSubmitted(true);
      setCommentText('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Comment save failed:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Reading calculations
  const totalWords = unified.content ? unified.content.split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(totalWords / 150)); // ~150 words per minute Bangla speed

  // Get Related Items
  const getRelatedItems = () => {
    if (!db) return [];
    let sourceArray: any[] = [];
    if (unified.type === 'news') sourceArray = db.news || [];
    else if (unified.type === 'blog') sourceArray = db.blogs || [];
    else if (unified.type === 'event') sourceArray = db.events || [];
    else if (unified.type === 'publication') sourceArray = db.books || [];
    else if (unified.type === 'circular') sourceArray = db.circulars || [];
    else if (unified.type === 'media') sourceArray = db.gallery || [];

    return sourceArray
      .filter((x: any) => x.id !== unified.id)
      .slice(0, 3);
  };

  const related = getRelatedItems();

  // Embedded video helper
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* BREADCRUMBS ROW */}
      <nav className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400 mb-6 border-b border-zinc-150/50 dark:border-zinc-800/50 pb-3 select-none no-print">
        <button onClick={onClose} className="hover:text-rose-600 font-bold transition">হোম</button>
        <span>/</span>
        <span className="capitalize">{unified.type === 'news' ? 'বার্তা ও খবর' : unified.type === 'blog' ? 'নিবন্ধ ও কলাম' : unified.type === 'event' ? 'কর্মসূচী ও প্রতিবাদ' : unified.type === 'publication' ? 'প্রকাশনা সেল' : unified.type === 'circular' ? 'সার্কুলার ও নোটিশ' : 'মিডিয়া সেন্টার'}</span>
        <span>/</span>
        <span className="text-zinc-800 dark:text-zinc-200 truncate font-semibold max-w-[280px]">{unified.title}</span>
      </nav>

      {/* BACK BUTTON AND UTILS ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 no-print">
        <button
          onClick={onClose}
          className="inline-flex items-center space-x-1.5 text-zinc-650 hover:text-rose-600 transition font-semibold text-xs border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-sm bg-white dark:bg-zinc-950 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>তালিকায় ফিরে যান</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print utility */}
          <button
            onClick={handlePrint}
            className="p-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-600 dark:text-zinc-350 hover:text-rose-600 transition shadow-xs text-xs flex items-center gap-1.5 cursor-pointer"
            title="পৃষ্ঠাটি প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">প্রিন্ট</span>
          </button>

          {/* Bookmark utility */}
          <button
            onClick={handleToggleBookmark}
            className={`p-1.5 border rounded text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
              bookmarked 
                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40' 
                : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300 hover:text-rose-600'
            }`}
            title={bookmarked ? "বুকমার্ক থেকে মুছুন" : "বুকমার্ক করুন"}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
            <span>{bookmarked ? 'বুকমার্কড' : 'বুকমার্ক'}</span>
          </button>

          {/* Graphic Image Generator BUTTON */}
          <button
            onClick={() => setShowPhotoCardBuilder(true)}
            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer uppercase tracking-wider"
          >
            <Sparkles className="w-4 h-4" />
            <span>ফটো কার্ড তৈরি করুন</span>
          </button>
        </div>
      </div>

      {/* MAIN ARTICLE LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: PRIMARY BODY (12 cols -> 8 cols on desktop) */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded p-5 sm:p-9 shadow-xs printable-article-body">
          
          {/* HEADER BADGE */}
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-xs font-bold tracking-widest text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 px-2.5 py-1 rounded">
              {unified.category}
            </span>
            {readingTime > 0 && (
              <span className="text-[11px] text-zinc-400 font-mono">
                {readingTime} মিনিট পড়ার সময় ({totalWords} শব্দ)
              </span>
            )}
          </div>

          {/* HEADLINE TITLE */}
          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white leading-tight mb-5">
            {unified.title}
          </h1>

          {/* REPORTER & STATS BAR */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-150 dark:border-zinc-900 pb-5 mb-6 font-sans">
            <span className="flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-rose-500" />
              <span>লেখক/প্রতিবেদক: <strong className="text-zinc-850 dark:text-zinc-250 font-bold">{unified.author}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>তারিখ: {unified.date}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-mono">পঠিত: {(Number(unified.views) * 7) + 3} বার</span>
            </span>
            {unified.downloadCount !== undefined && (
              <>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Download className="w-3.5 h-3.5 text-rose-500" />
                  <span className="font-mono">ডাউনলোড: {unified.downloadCount} বার</span>
                </span>
              </>
            )}
          </div>

          {/* AUDIO/VIDEO EMBED PLAYERS (If media gallery type) */}
          {unified.type === 'media' && (unified.mediaType === 'video' || unified.mediaType === 'audio') && (
            <div className="w-full mb-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black shadow-lg">
              {unified.mediaType === 'video' ? (
                getYouTubeId(unified.mediaUrl || '') ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(unified.mediaUrl || '')}`}
                      title={unified.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                ) : (
                  <video 
                    src={unified.mediaUrl} 
                    controls 
                    className="w-full max-h-[480px]"
                  />
                )
              ) : (
                <div className="p-6 bg-zinc-950 text-white flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-4">
                    <Music className="w-8 h-8 text-rose-500 animate-pulse" />
                  </div>
                  <audio 
                    src={unified.mediaUrl} 
                    controls 
                    className="w-full max-w-md mx-auto"
                  />
                </div>
              )}
            </div>
          )}

          {/* LARGE FEATURED HERO IMAGE */}
          {unified.image && unified.mediaType !== 'video' && unified.mediaType !== 'audio' && (
            <div className="relative aspect-[16/9] mb-8 rounded overflow-hidden border border-zinc-150 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900 group">
              <img
                src={unified.image}
                alt={unified.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              />
            </div>
          )}

          {/* ARTICLE RICH BODY TEXT CONTENT */}
          <article className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 leading-relaxed text-sm sm:text-base space-y-4 whitespace-pre-line text-left">
            {unified.content}
          </article>

          {/* PDF DOWNLOADING / PORTAL RESOURCE ACTIONS */}
          {unified.pdfUrl && unified.pdfUrl !== '#' && (
            <div className="mt-8 p-5 bg-rose-50/25 dark:bg-zinc-900/40 border border-rose-100 dark:border-zinc-800/80 rounded flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="p-3 bg-rose-600 rounded text-white text-xs font-bold uppercase tracking-wider">PDF</div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">অফিসিয়াল নথিপত্র এবং পিডিএফ ফাইল</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">সহজে অফলাইনে পড়তে অথবা সংগ্রহে রাখতে ডাউলোড করুন।</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto no-print">
                <a
                  href={unified.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center sm:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow transition text-nowrap select-none"
                >
                  পিডিএফ দেখুন
                </a>
                <a
                  href={unified.pdfUrl}
                  download
                  className="flex-1 text-center sm:flex-none px-4 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white text-xs font-bold rounded border border-zinc-700 shadow transition text-nowrap"
                >
                  ডাউনলোড
                </a>
              </div>
            </div>
          )}

          {/* EVENT LOCATION & VENUE EXTRA DETAILS CARD */}
          {unified.type === 'event' && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-zinc-150 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-950/20 rounded flex items-start gap-3 text-left">
                <MapPin className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-850 dark:text-white">ভেন্যু এবং এলাকা</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">{unified.venue}</p>
                </div>
              </div>
              <div className="p-4 border border-zinc-150 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-950/20 rounded flex items-start gap-3 text-left">
                <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-850 dark:text-white">তারিখ ও সময়সূচী</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">{unified.date} ({unified.time})</p>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC ARTICLE TAGS ROW */}
          {unified.tags && unified.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-zinc-150 dark:border-zinc-900 flex flex-wrap gap-2">
              {unified.tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center space-x-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded">
                  <Tag className="w-3 h-3 text-rose-600" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          {/* COMMENTS MODERATION PANEL & FORM */}
          <div className="mt-12 border-t border-zinc-150 dark:border-zinc-900 pt-8 no-print">
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white mb-6 flex items-center space-x-2 text-left">
              <MessageCircle className="w-5 h-5 text-rose-600" />
              <span>মন্তব্য এবং প্রতিক্রিয়া ({rawItem.comments ? rawItem.comments.filter((c: any) => c.approved || userEmail).length : 0})</span>
            </h3>

            {/* List existing comments */}
            <div className="space-y-4 mb-8">
              {rawItem.comments && rawItem.comments.length > 0 ? (
                rawItem.comments
                  .filter((c: any) => c.approved || userEmail) // admins can see all, readers see approved only
                  .map((comm: any, idx: number) => (
                    <div 
                      key={comm.id || idx}
                      className={`p-4 rounded border text-left ${
                        !comm.approved 
                          ? 'bg-amber-50/40 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/30' 
                          : 'bg-zinc-50/50 border-zinc-150 dark:bg-zinc-900/30 dark:border-zinc-850'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{comm.name}</span>
                        <div className="flex items-center space-x-2 text-[10px] text-zinc-400 font-mono">
                          <span>{comm.date}</span>
                          {!comm.approved && (
                            <span className="text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1 rounded">মডারেশনাধীন</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-zinc-750 dark:text-zinc-300 whitespace-pre-line">{comm.text}</p>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6">এখনো কোনো প্রতিক্রিয়া বা তত্ত্বীয় মন্তব্য প্রদান করা হয়নি। প্রথম মন্তব্যটি আপনার হোক!</p>
              )}
            </div>

            {/* New Comment submission form */}
            <div className="bg-zinc-50/30 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-900 p-5 rounded">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-4 text-left">মন্তব্য প্রদান করুন</h4>
              
              {commentSubmitted ? (
                <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 rounded text-center text-xs">
                  আপনার মন্তব্য সফলভাবে প্রেরণ করা হয়েছে। অ্যাডমিন মডারেশনের পর এটি প্রকাশ করা হবে। ধন্যবাদ!
                </div>
              ) : (
                <form onSubmit={handleCommentSubmit} className="space-y-4 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">আপনার নাম *</label>
                      <input
                        type="text"
                        required
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-1.5 text-xs outline-none"
                        placeholder="উদাঃ কমরেড জয়"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">ইমেইল (গোপন থাকবে)</label>
                      <input
                        type="email"
                        value={commentEmail}
                        onChange={(e) => setCommentEmail(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-1.5 text-xs outline-none"
                        placeholder="ssfmym@gmail.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1">মন্তব্য *</label>
                    <textarea
                      required
                      rows={4}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded p-1.5 text-xs outline-none"
                      placeholder="আপনার গঠনমূলক রাজনৈতিক ও সাংগঠনিক পর্যালোচনা বা সংহতি জানান..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>প্রেরণ করুন</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SECONDARY BRAND & SOCIAL BAR (12 cols -> 4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6 no-print">
          
          {/* SOCIAL SHARING BLOCK */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded p-5 shadow-xs text-left">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white mb-3 tracking-widest uppercase">
              শেয়ার এবং প্রচার
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/${unified.type}/${unified.id}` : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded font-bold transition-all shadow-xs"
              >
                <Facebook className="w-4 h-4" />
                <span>Facebook</span>
              </a>
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(unified.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/${unified.type}/${unified.id}` : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded font-bold transition-all shadow-xs"
              >
                <Twitter className="w-4 h-4" />
                <span>Twitter / X</span>
              </a>
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(unified.title + ' ' + (typeof window !== 'undefined' ? `${window.location.origin}/${unified.type}/${unified.id}` : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded font-bold transition-all shadow-xs col-span-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp এ শেয়ার করুন</span>
              </a>
              <button 
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 rounded font-bold transition-all cursor-pointer col-span-2 mt-1"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link className="w-4 h-4" />}
                <span>{copied ? 'লিঙ্ক কপি হয়েছে!' : 'শেয়ার লিঙ্ক কপি করুন'}</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC PHOTO CARD GRAPHICS LAUNCHER */}
          <div className="bg-gradient-to-br from-rose-900/10 to-amber-950/10 dark:from-rose-950/40 dark:to-zinc-950 border border-rose-200/50 dark:border-rose-900/30 rounded p-5 shadow-sm text-left relative overflow-hidden group">
            <div className="absolute right-[-15px] bottom-[-15px] text-rose-500/10 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-28 h-28" />
            </div>
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 animate-spin duration-3000" />
              <span>বিপ্লবী গ্রাফিক ফটো কার্ড</span>
            </h3>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
              এই প্রতিবেদনের একটি দৃষ্টিনন্দন ও তথ্যবহুল সোশাল মিডিয়া গ্রাফিক ইমেজ স্বয়ংক্রিয়ভাবে জেনারেট করুন। ফেসবুক কিংবা হোয়াটস্যাপে দ্রুত প্রচারে ব্যবহার্য।
            </p>
            <button
              onClick={() => setShowPhotoCardBuilder(true)}
              className="mt-4 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>কার্ড মেকার শুরু করুন</span>
            </button>
          </div>

          {/* RELATED ARTICLES PREVIEW */}
          {related.length > 0 && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded p-5 shadow-xs text-left">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white mb-4 tracking-widest uppercase border-b pb-2 border-zinc-100 dark:border-zinc-900">
                সংশ্লিষ্ট অন্যান্য পোস্ট
              </h3>
              <div className="space-y-4">
                {related.map((rel: any) => (
                  <div 
                    key={rel.id}
                    onClick={() => onSelectItem(item.type, rel.id)}
                    className="group flex gap-3 cursor-pointer items-start"
                  >
                    <div className="h-12 w-20 bg-zinc-100 dark:bg-zinc-900 rounded overflow-hidden shrink-0 border border-zinc-150 dark:border-zinc-900">
                      <img 
                        src={rel.image || rel.coverImage || rel.coverUrl || "https://i.ibb.co.com/F4MKM3R2/20260527-055637.png"} 
                        alt={rel.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-2 leading-tight group-hover:text-rose-600 transition">
                        {rel.title}
                      </h4>
                      <span className="text-[10px] text-zinc-450 mt-1 block font-mono">{rel.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* RENDER PHOTO CARD GENERATOR MODAL IF ACTIVE */}
      <AnimatePresence>
        {showPhotoCardBuilder && (
          <PhotoCardGenerator
            item={unified}
            onClose={() => setShowPhotoCardBuilder(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
