import React, { useState, useEffect } from 'react';
import { Search, Tag, MessageSquare, Clock, User, ArrowLeft, RefreshCw, Send, Check, Share2, Facebook, Twitter, Link } from 'lucide-react';
import { News, Blog, Comment } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { saveFirestoreDoc } from '../firebase';
import { updateSEOMetadata } from '../lib/seo';

interface NewsBlogSectionProps {
  news: News[];
  blogs: Blog[];
  onAddComment: (blogId: string, name: string, email: string, text: string) => Promise<Comment | null>;
  userEmail: string | null;
  onRefresh: () => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
}

export default function NewsBlogSection({
  news,
  blogs,
  onAddComment,
  userEmail,
  onRefresh,
  globalSearchQuery,
  setGlobalSearchQuery,
}: NewsBlogSectionProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'blogs'>('all');
  const searchQuery = globalSearchQuery;
  const setSearchQuery = setGlobalSearchQuery;
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFeedId, setCopiedFeedId] = useState<string | null>(null);

  const handleCopyLink = () => {
    let shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news` : '';
    if (selectedNews) {
      shareUrl = `${window.location.origin}${window.location.pathname}?tab=news&newsId=${selectedNews.id}`;
    } else if (selectedBlog) {
      shareUrl = `${window.location.origin}${window.location.pathname}?tab=news&blogId=${selectedBlog.id}`;
    }
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setScrollPercent(100);
        return;
      }
      const pct = (scrollTop / docHeight) * 100;
      setScrollPercent(Math.min(100, Math.max(0, pct)));
    };

    if (selectedNews || selectedBlog) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      setScrollPercent(0);
      const t = setTimeout(handleScroll, 100);
      return () => {
        window.removeEventListener('scroll', handleScroll);
        clearTimeout(t);
      };
    }
  }, [selectedNews, selectedBlog]);

  // Dynamic SEO metadata update when a news or blog post is selected
  useEffect(() => {
    if (selectedNews) {
      const cleanDesc = selectedNews.excerpt || (selectedNews.content ? selectedNews.content.slice(0, 150) + '...' : '');
      const uniqueUrl = `${window.location.origin}/post/${selectedNews.id}`;
      
      // Sync address bar URL for sharing to clean path /post/:id
      window.history.replaceState(null, '', `/post/${selectedNews.id}`);

      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": selectedNews.title,
        "description": cleanDesc,
        "image": [selectedNews.image || 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png'],
        "datePublished": selectedNews.date,
        "author": [{
          "@type": "Person",
          "name": selectedNews.author || "সমাজতান্ত্রিক ছাত্র ফ্রন্ট"
        }],
        "publisher": {
          "@type": "Organization",
          "name": "সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
          "logo": {
            "@type": "ImageObject",
            "url": "https://i.ibb.co.com/F4MKM3R2/20260527-055637.png"
          }
        }
      };

      updateSEOMetadata({
        title: `${selectedNews.title} | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা`,
        description: cleanDesc,
        image: selectedNews.image,
        type: 'article',
        url: uniqueUrl,
        schema: articleSchema
      });
    } else if (selectedBlog) {
      const cleanDesc = selectedBlog.excerpt || (selectedBlog.content ? selectedBlog.content.slice(0, 150) + '...' : '');
      const uniqueUrl = `${window.location.origin}/post/${selectedBlog.id}`;

      // Sync address bar URL for sharing to clean path /post/:id
      window.history.replaceState(null, '', `/post/${selectedBlog.id}`);

      const blogSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": selectedBlog.title,
        "description": cleanDesc,
        "image": [selectedBlog.image || 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png'],
        "datePublished": selectedBlog.date,
        "author": [{
          "@type": "Person",
          "name": selectedBlog.author || "কমরেড"
        }],
        "publisher": {
          "@type": "Organization",
          "name": "সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
          "logo": {
            "@type": "ImageObject",
            "url": "https://i.ibb.co.com/F4MKM3R2/20260527-055637.png"
          }
        }
      };

      updateSEOMetadata({
        title: `${selectedBlog.title} | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা`,
        description: cleanDesc,
        image: selectedBlog.image,
        type: 'article',
        url: uniqueUrl,
        schema: blogSchema
      });
    } else {
      // Check if we are currently on a category, tag, or author path, otherwise set base news URL
      const pathname = window.location.pathname.toLowerCase().trim();
      let targetPath = '/news';
      if (pathname.includes('/category/') || pathname.includes('/tag/') || pathname.includes('/author/')) {
        targetPath = window.location.pathname;
      }
      
      const baseUrl = `${window.location.origin}${targetPath}`;
      window.history.replaceState(null, '', targetPath);

      updateSEOMetadata({
        title: "সংবাদ ও কলাম | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা শাখার সাম্প্রতিক কর্মকাণ্ড, প্রেস বিজ্ঞপ্তি, ছাত্র আন্দোলন এবং তাত্ত্বিক কলাম ও বিশ্লেষণ।",
        type: 'website',
        url: baseUrl
      });
    }
  }, [selectedNews, selectedBlog]);

  // Deep linking support for crawler indexing and clean route pathnames
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '');
    
    let newsId = params.get('newsId');
    let blogId = params.get('blogId');
    
    // Check clean path for news/blog/post ID
    if (!newsId && !blogId) {
      const newsMatch = window.location.pathname.match(/\/news\/([a-zA-Z0-9_-]+)/i);
      const postMatch = window.location.pathname.match(/\/post\/([a-zA-Z0-9_-]+)/i);
      const blogMatch = window.location.pathname.match(/\/blog\/([a-zA-Z0-9_-]+)/i);
      
      const matchedId = (newsMatch && newsMatch[1]) || (postMatch && postMatch[1]) || (blogMatch && blogMatch[1]);
      if (matchedId) {
        // Try to find in news first, then in blogs
        const isNews = news.some(n => n.id === matchedId);
        if (isNews) {
          newsId = matchedId;
        } else {
          blogId = matchedId;
        }
      }
    }
    
    if (newsId && news && news.length > 0) {
      const found = news.find(n => n.id === newsId);
      if (found) setSelectedNews(found);
    } else if (blogId && blogs && blogs.length > 0) {
      const found = blogs.find(b => b.id === blogId);
      if (found) setSelectedBlog(found);
    }

    // Handle Category, Tag, Author routing filters
    if (pathname.includes('/category/')) {
      const cat = decodeURIComponent(window.location.pathname.split('/category/')[1]);
      if (cat) {
        setNewsCategoryFilter(cat.trim().toLowerCase());
        setActiveTab('all');
      }
    } else if (pathname.includes('/tag/')) {
      const tag = decodeURIComponent(window.location.pathname.split('/tag/')[1]);
      if (tag) {
        setSearchQuery(tag.trim());
        setActiveTab('all');
      }
    } else if (pathname.includes('/author/')) {
      const author = decodeURIComponent(window.location.pathname.split('/author/')[1]);
      if (author) {
        setSearchQuery(author.trim());
        setActiveTab('all');
      }
    }
  }, [news, blogs]);

  
  // Comment Form state
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Selected news categories
  const [newsCategoryFilter, setNewsCategoryFilter] = useState<string>('all');

  const newsCategories = [
    { value: 'all', label: 'সকল খণ্ড' },
    { value: 'political', label: 'রাজনৈতিক ধারা' },
    { value: 'organizational', label: 'সাংগঠনিক খবর' },
    { value: 'campus', label: 'ক্যাম্পাস নিউজ' },
    { value: 'statement', label: 'বিবৃতি' },
    { value: 'press-release', label: 'প্রেস রিলিজ' }
  ];

  // Filters news and blogs
  const filteredNews = news.filter((art) => {
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = newsCategoryFilter === 'all' || art.category === newsCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlog) return;
    if (!commentName.trim() || !commentText.trim()) return;

    setSubmittingComment(true);
    const added = await onAddComment(
      selectedBlog.id,
      commentName.trim(),
      userEmail || commentEmail.trim() || 'অনোনিম কর্মী',
      commentText.trim()
    );
    setSubmittingComment(false);

    if (added) {
      setCommentSubmitted(true);
      setCommentText('');
      // Auto close/reset state after 3 seconds
      setTimeout(() => setCommentSubmitted(false), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Sticky Top Reading Progress Bar */}
      {(selectedNews || selectedBlog) && (
        <div className="fixed top-0 left-0 w-full h-[4px] bg-rose-100 dark:bg-rose-950/20 z-[9999] pointer-events-none">
          <div 
            className="h-full bg-rose-600 dark:bg-rose-500 transition-all duration-100 ease-out shadow-[0_0_8px_rgba(225,29,72,0.5)]" 
            style={{ width: `${scrollPercent}%` }}
          />
        </div>
      )}
      
      {/* If an article is selected, render full reading layout */}
      <AnimatePresence mode="wait">
        {selectedNews && (
          <motion.div
            key="news-detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-4xl mx-auto bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-sm p-6 sm:p-10 shadow-sm"
          >
            <button
              onClick={() => setSelectedNews(null)}
              className="inline-flex items-center space-x-1.5 text-zinc-500 hover:text-rose-600 mb-6 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>পূর্ববর্তী পাতায় ফিরুন</span>
            </button>

            <span className="text-xs font-bold font-mono tracking-widest text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 px-2.5 py-1 rounded-sm uppercase">
              {selectedNews.category.replace('-', ' ')}
            </span>

            <h1 className="text-2xl sm:text-4xl font-bold mt-4 mb-4 text-zinc-900 dark:text-white leading-tight">
              {selectedNews.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-150 dark:border-zinc-900 pb-4 mb-2">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5" />
                <span>প্রতিবেদক: {selectedNews.author}</span>
              </span>
              <span>•</span>
              <span>তারিখ: {selectedNews.date}</span>
              <span>•</span>
              <span>পঠিত: {((selectedNews.views || 0) * 10)} বার</span>
            </div>

            {/* Social Share Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 py-3 border-b border-zinc-150 dark:border-zinc-900 mb-6 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mr-1 font-bold">
                <Share2 className="w-3.5 h-3.5 text-rose-600" />
                <span>শেয়ার করুন:</span>
              </span>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&newsId=${selectedNews.id}` : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded font-bold transition-all shadow-xs"
              >
                <Facebook className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedNews.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&newsId=${selectedNews.id}` : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded font-bold transition-all shadow-xs"
              >
                <Twitter className="w-3.5 h-3.5" />
                <span>Twitter / X</span>
              </a>
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(selectedNews.title + ' ' + (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&newsId=${selectedNews.id}` : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded font-bold transition-all shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
              <button 
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 rounded font-semibold transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'কপি হয়েছে' : 'লিঙ্ক কপি'}</span>
              </button>
            </div>

            <div className="relative aspect-[16/9] mb-8 rounded-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
              <img
                src={selectedNews.image}
                alt={selectedNews.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-300 leading-relaxed text-sm sm:text-base space-y-4 whitespace-pre-line">
              {selectedNews.content}
            </div>

            {selectedNews.pdfUrl && selectedNews.pdfUrl !== '#' && (
              <div id="news-pdf-attachment" className="mt-8 p-4 bg-rose-50/30 dark:bg-zinc-900/50 border border-rose-100 dark:border-zinc-800 rounded flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-600 rounded text-white text-xs font-bold uppercase tracking-wider shadow-sm">PDF</div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200">বার্তা ও সংবাদ পিডিএফ সংস্করণ</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">অফলাইন পড়ার সুবিধার্থে কপির পিডিএফ সংস্করণ ডাউনলোড অথবা ভিউ করুন।</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={selectedNews.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center sm:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow transition text-nowrap select-none"
                  >
                    পিডিএফ দেখুন
                  </a>
                  <a
                    href={selectedNews.pdfUrl}
                    download
                    className="flex-1 text-center sm:flex-none px-4 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white text-xs font-bold rounded border border-zinc-700 shadow transition text-nowrap"
                  >
                    ডাউনলোড করুন
                  </a>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-zinc-150 dark:border-zinc-900 flex flex-wrap gap-2">
              {selectedNews.tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center space-x-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded">
                  <Tag className="w-3 h-3 text-rose-600" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {selectedBlog && (
          <motion.div
            key="blog-detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-4xl mx-auto bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded-sm p-6 sm:p-10 shadow-sm"
          >
            <button
              onClick={() => setSelectedBlog(null)}
              className="inline-flex items-center space-x-1.5 text-zinc-500 hover:text-rose-600 mb-6 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>পূর্ববর্তী ব্লগে ফিরুন</span>
            </button>

            <span className="text-xs font-bold tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-sm">
              {selectedBlog.category || 'কলাম'}
            </span>

            <h1 className="text-2xl sm:text-4xl font-bold mt-4 mb-4 text-zinc-900 dark:text-white leading-tight">
              {selectedBlog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-150 dark:border-zinc-900 pb-4 mb-2 font-sans">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>লেখক: {selectedBlog.author}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>পড়ার সময়: {selectedBlog.readingTime || 5} মিনিট</span>
              </span>
              <span>•</span>
              <span>পাবলিশ ডেট: {selectedBlog.date}</span>
              <span>•</span>
              <span>ভিউ: {((selectedBlog.views || 0) * 10)}</span>
            </div>

            {/* Social Share Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 py-3 border-b border-zinc-150 dark:border-zinc-900 mb-6 text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mr-1 font-bold">
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>শেয়ার করুন:</span>
              </span>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&blogId=${selectedBlog.id}` : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded font-bold transition-all shadow-xs"
              >
                <Facebook className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedBlog.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&blogId=${selectedBlog.id}` : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded font-bold transition-all shadow-xs"
              >
                <Twitter className="w-3.5 h-3.5" />
                <span>Twitter / X</span>
              </a>
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(selectedBlog.title + ' ' + (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&blogId=${selectedBlog.id}` : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded font-bold transition-all shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
              <button 
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 rounded font-semibold transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'কপি হয়েছে' : 'লিঙ্ক কপি'}</span>
              </button>
            </div>

            <div className="relative aspect-[16/9] mb-8 rounded-sm overflow-hidden border border-zinc-200 dark:border-zinc-850 bg-zinc-100 dark:bg-zinc-900">
              <img
                src={selectedBlog.image}
                alt={selectedBlog.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-300 leading-relaxed text-sm sm:text-base space-y-4 whitespace-pre-line">
              {selectedBlog.content}
            </div>

            {/* Comment Section render */}
            <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-850 space-y-8">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-rose-600" />
                <span>মন্তব্যসমূহ ({(selectedBlog.comments || []).filter(c => c.approved).length})</span>
              </h3>

              {/* List comments */}
              <div className="space-y-4">
                {(selectedBlog.comments || [])
                  .filter((c) => c.approved)
                  .map((comment) => (
                    <div key={comment.id} className="bg-zinc-50 dark:bg-zinc-900 p-4 border border-zinc-100 dark:border-zinc-850 rounded">
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center space-x-1">
                          <span className="h-2 w-2 rounded-full bg-rose-600 inline-block mr-1"></span>
                          <span>{comment.authorName}</span>
                        </span>
                        <span className="text-zinc-400 dark:text-zinc-500 font-mono">{comment.date}</span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-400 leading-relaxed font-sans pl-3 border-l-2 border-rose-600/40">
                        {comment.text}
                      </p>
                    </div>
                  ))}

                {(selectedBlog.comments || []).filter(c => c.approved).length === 0 && (
                  <p className="text-xs text-zinc-400 italic">এখনও পর্যন্ত কোনো অনুমোদিত মন্তব্য পোস্ট করা হয়নি।</p>
                )}
              </div>

              {/* Add Comment Form */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-5 rounded-sm">
                <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-100 mb-3">মতামত প্রকাশ করুন</h4>
                <p className="text-[10px] text-zinc-500 mb-4">
                  * এডমিন অনুমোদন করার সাথে সাথে আপনার মন্তব্যটি এই পোর্টালে দৃশ্যমান হবে। গঠনমূলক আলোচনায় অংশ নিন।
                </p>

                {commentSubmitted ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 p-4 rounded text-xs flex items-center space-x-2 border border-emerald-200">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>ধন্যবাদ, আপনার মূল্যবান প্রতিক্রিয়া জমা হয়েছে! এডমিন অনুমোদনের পর তা প্রকাশিত হবে।</span>
                  </div>
                ) : (
                  <form onSubmit={handleCommentSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          আপনার নাম *
                        </label>
                        <input
                          type="text"
                          required
                          value={commentName}
                          onChange={(e) => setCommentName(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          ইমেইল এড্রেস {userEmail ? '' : '*'}
                        </label>
                        <input
                          type="email"
                          required={!userEmail}
                          disabled={!!userEmail}
                          value={userEmail || commentEmail}
                          onChange={(e) => setCommentEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none disabled:bg-zinc-100 dark:disabled:bg-zinc-850"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        মন্তব্য *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none focus:border-rose-500"
                        placeholder="আপনার তত্ত্বীয় মতামত বা সংহতি প্রদান করুন..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow transition disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>প্রতিক্রিয়া পাঠান</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* List Feed View */}
        {!selectedNews && !selectedBlog && (
          <motion.div
            key="list-feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Header Title with Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">সংবাদ ও মননশীল ব্লগ পোর্টাল</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 font-mono">
                  ময়মনসিংহ ছাত্র ফ্রন্টের সর্বশেষ রাজনৈতিক পর্যালোচনা ও প্রচার
                </p>
              </div>

              {/* Central Search bar */}
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="খবর, বিবৃতি কিংবা ব্লগ খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-rose-500 placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Selector tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => { setActiveTab('all'); setNewsCategoryFilter('all'); }}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                সব মিলিয়ে ({filteredNews.length + filteredBlogs.length})
              </button>
              <button
                onClick={() => { setActiveTab('news'); setNewsCategoryFilter('all'); }}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'news'
                    ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                সংবাদপত্রক ({filteredNews.length})
              </button>
              <button
                onClick={() => setActiveTab('blogs')}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'blogs'
                    ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                নিবন্ধ ও ব্লগ ({filteredBlogs.length})
              </button>
            </div>

            {/* Sub Filter Category buttons for news */}
            {activeTab === 'news' && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {newsCategories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setNewsCategoryFilter(cat.value)}
                    className={`px-3 py-1 text-xs rounded transition-all cursor-pointer ${
                      newsCategoryFilter === cat.value
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-805'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Content Lists Render */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Show News Articles */}
              {(activeTab === 'all' || activeTab === 'news') && (
                filteredNews.map((art) => (
                  <motion.article
                    layout
                    key={art.id}
                    onClick={() => {
                      const newViews = (art.views || 0) + 1;
                      art.views = newViews;
                      setSelectedNews(art);
                      
                      // Serverless dynamic fallback
                      saveFirestoreDoc('news', art.id, { ...art, views: newViews })
                        .then(() => onRefresh?.())
                        .catch(err => {
                          console.error('Firestore view tracking failed, trying api fallback:', err);
                          fetch(`/api/news/${art.id}/view`, { method: 'POST' })
                            .then(() => onRefresh?.())
                            .catch(e => console.error(e));
                        });
                    }}
                    className="group flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm overflow-hidden hover:border-rose-600/50 transition duration-300 cursor-pointer shadow-xs"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-900 grayscale-[40%] group-hover:grayscale-0 transition-all duration-300">
                      <img
                        src={art.image}
                        alt={art.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-xs">
                        সংবাদ: {art.category.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <span className="text-[10px] text-zinc-400 font-mono tracking-wider">{art.date}</span>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1.5 mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                        {art.excerpt}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center text-[10px] text-zinc-400">
                        <span>প্রতিবেদক: {art.author}</span>
                        <span>পঠিত: {((art.views || 0) * 10)}</span>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-zinc-100/60 dark:border-zinc-900/60 flex items-center justify-between text-[10px]" onClick={(e) => e.stopPropagation()}>
                        <span className="flex items-center gap-1 font-bold text-[9px] text-zinc-500">
                          <Share2 className="w-3 h-3 text-rose-650" />
                          <span>শেয়ারঃ</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&newsId=${art.id}` : '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-zinc-50 hover:bg-[#1877F2]/10 text-zinc-500 hover:text-[#1877F2] rounded border border-zinc-200/50 dark:bg-zinc-900/40 dark:border-zinc-800/40 transition"
                            title="ফেসবুকে শেয়ার"
                          >
                            <Facebook className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('সংবাদঃ ' + art.title + ' ')}&url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&newsId=${art.id}` : '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-zinc-50 hover:bg-[#1DA1F2]/10 text-zinc-500 hover:text-[#1DA1F2] rounded border border-zinc-200/50 dark:bg-zinc-900/40 dark:border-zinc-800/40 transition"
                            title="X-এ শেয়ার"
                          >
                            <Twitter className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent('সংবাদঃ ' + art.title + '\nলিংকঃ ' + (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&newsId=${art.id}` : ''))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-zinc-50 hover:bg-[#25D366]/10 text-zinc-500 hover:text-[#25D366] rounded border border-zinc-200/50 dark:bg-zinc-900/45 dark:border-zinc-800/40 transition"
                            title="হোয়াটসঅ্যাপে শেয়ার"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => {
                              const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&newsId=${art.id}` : '';
                              navigator.clipboard.writeText(shareUrl);
                              setCopiedFeedId(art.id);
                              setTimeout(() => setCopiedFeedId(null), 2000);
                            }}
                            className="p-1.5 bg-zinc-50 hover:bg-rose-150 text-zinc-500 hover:text-rose-600 rounded border border-zinc-200/50 dark:bg-zinc-900/45 dark:border-zinc-800/40 transition cursor-pointer"
                            title="লিংক কপি"
                          >
                            {copiedFeedId === art.id ? <Check className="w-3 h-3 text-emerald-600 font-bold" /> : <Link className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))
              )}

              {/* Show Blog Posts */}
              {(activeTab === 'all' || activeTab === 'blogs') && (
                filteredBlogs.map((post) => (
                  <motion.article
                    layout
                    key={post.id}
                    onClick={() => {
                      const newViews = (post.views || 0) + 1;
                      post.views = newViews;
                      setSelectedBlog(post);
                      
                      // Serverless dynamic fallback
                      saveFirestoreDoc('blogs', post.id, { ...post, views: newViews })
                        .then(() => onRefresh?.())
                        .catch(err => {
                          console.error('Firestore view tracking failed, trying api fallback:', err);
                          fetch(`/api/blogs/${post.id}/view`, { method: 'POST' })
                            .then(() => onRefresh?.())
                            .catch(e => console.error(e));
                        });
                    }}
                    className="group flex flex-col bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-sm overflow-hidden hover:border-emerald-600/40 transition duration-300 cursor-pointer shadow-xs"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-900 grayscale-[40%] group-hover:grayscale-0 transition-all duration-300">
                      <img
                        src={post.image}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-xs">
                        ব্লগ: {post.category || 'নিবন্ধ'}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center space-x-2 text-[10px] text-zinc-400 font-mono">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-0.5" />
                          <span>{post.readingTime} মি</span>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1.5 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3 mb-4 font-sans">
                        {post.excerpt}
                      </p>

                      <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center text-[10px] text-zinc-400">
                        <span className="truncate">লেখক: {post.author}</span>
                        <span>মতামত: {(post.comments || []).filter(c => c.approved).length}টি</span>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-zinc-100/60 dark:border-zinc-900/60 flex items-center justify-between text-[10px]" onClick={(e) => e.stopPropagation()}>
                        <span className="flex items-center gap-1 font-bold text-[9px] text-zinc-500">
                          <Share2 className="w-3 h-3 text-emerald-650" />
                          <span>শেয়ারঃ</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&blogId=${post.id}` : '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-zinc-50 hover:bg-[#1877F2]/10 text-zinc-500 hover:text-[#1877F2] rounded border border-zinc-200/50 dark:bg-zinc-900/40 dark:border-zinc-800/40 transition"
                            title="ফেসবুকে শেয়ার"
                          >
                            <Facebook className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('নিবন্ধঃ ' + post.title + ' ')}&url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&blogId=${post.id}` : '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-zinc-50 hover:bg-[#1DA1F2]/10 text-zinc-500 hover:text-[#1DA1F2] rounded border border-zinc-200/50 dark:bg-zinc-900/40 dark:border-zinc-800/40 transition"
                            title="X-এ শেয়ার"
                          >
                            <Twitter className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent('নিবন্ধঃ ' + post.title + '\nলিংকঃ ' + (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&blogId=${post.id}` : ''))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-zinc-50 hover:bg-[#25D366]/10 text-zinc-500 hover:text-[#25D366] rounded border border-zinc-200/50 dark:bg-zinc-900/45 dark:border-zinc-800/40 transition"
                            title="হোয়াটসঅ্যাপে শেয়ার"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => {
                              const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=news&blogId=${post.id}` : '';
                              navigator.clipboard.writeText(shareUrl);
                              setCopiedFeedId(post.id);
                              setTimeout(() => setCopiedFeedId(null), 2000);
                            }}
                            className="p-1.5 bg-zinc-50 hover:bg-emerald-150 text-zinc-500 hover:text-emerald-600 rounded border border-zinc-200/50 dark:bg-zinc-900/45 dark:border-zinc-800/40 transition cursor-pointer"
                            title="লিংক কপি"
                          >
                            {copiedFeedId === post.id ? <Check className="w-3 h-3 text-emerald-600 font-bold" /> : <Link className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))
              )}

            </div>

            {/* Empty view state check */}
            {filteredNews.length === 0 && filteredBlogs.length === 0 && (
              <div className="p-16 border border-dashed text-center text-zinc-400">
                আপনার খোঁজা ক্যাটেগরি কিংবা কি-ওয়ার্ড অনুসারে কোনো সংবাদ বা নিবন্ধ খুঁজে পাওয়া যায়নি।
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
