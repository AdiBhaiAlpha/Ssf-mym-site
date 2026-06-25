import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Eye, Tag, AlertTriangle, BookMarked, HelpCircle, FileText, CheckCircle, Lock, Share2, Facebook, Twitter, MessageSquare, Link, Check } from 'lucide-react';
import { Book } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { updateSEOMetadata } from '../lib/seo';

interface PublicationsSectionProps {
  books: Book[];
  onDownloadBook: (bookId: string) => Promise<boolean>;
  isVerifiedMember?: boolean;
}

export default function PublicationsSection({ books, onDownloadBook, isVerifiedMember = false }: PublicationsSectionProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'book' | 'magazine' | 'study-material'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [showDownloadNote, setShowDownloadNote] = useState<string | null>(null);
  const [restrictedBook, setRestrictedBook] = useState<Book | null>(null);
  const [copiedBookId, setCopiedBookId] = useState<string | null>(null);

  // Dynamic SEO update on book select/read
  useEffect(() => {
    if (readingBook) {
      const cleanDesc = readingBook.description || `সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা শাখার প্রকাশনা - ${readingBook.title}। লেখক: ${readingBook.author}`;
      const uniqueUrl = `${window.location.origin}${window.location.pathname}?tab=books&bookId=${readingBook.id}`;

      // Sync address bar URL for sharing
      window.history.replaceState(null, '', uniqueUrl);

      const bookSchema = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": readingBook.title,
        "author": {
          "@type": "Person",
          "name": readingBook.author
        },
        "description": cleanDesc,
        "image": readingBook.coverUrl || "https://i.ibb.co.com/F4MKM3R2/20260527-055637.png",
        "publisher": {
          "@type": "Organization",
          "name": "সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা"
        }
      };

      updateSEOMetadata({
        title: `${readingBook.title} | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা`,
        description: cleanDesc,
        image: readingBook.coverUrl,
        type: 'book',
        url: uniqueUrl,
        schema: bookSchema
      });
    } else {
      const baseUrl = `${window.location.origin}${window.location.pathname}?tab=books`;
      window.history.replaceState(null, '', baseUrl);

      updateSEOMetadata({
        title: "শিক্ষা ও প্রকাশনা | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "মার্ক্সীয় দর্শন, পুঁজিবাদবিরোধী লড়াই, রাজনৈতিক প্রবন্ধ, বিপ্লবী ইতিহাস এবং সমাজতান্ত্রিক ছাত্র ফ্রন্টের বিভিন্ন বৈপ্লবিক ও তাত্ত্বিক প্রকাশনাসমূহ।",
        type: 'website',
        url: baseUrl
      });
    }
  }, [readingBook]);

  // Deep linking support for crawler indexing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('bookId');
    if (bookId && books && books.length > 0) {
      const found = books.find(b => b.id === bookId);
      if (found) setReadingBook(found);
    }
  }, [books]);

  const filteredBooks = books.filter((b) => {
    const matchesFilter = activeFilter === 'all' || b.type === activeFilter;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDownload = async (book: Book) => {
    if (book.isPrivate && !isVerifiedMember) {
      setRestrictedBook(book);
      return;
    }
    // Record download statistics
    const recorded = await onDownloadBook(book.id);
    if (recorded) {
      book.downloadCount += 1;
    }
    setShowDownloadNote(book.id);
    setTimeout(() => {
      setShowDownloadNote(null);
    }, 4000);
  };

  const handleRead = (book: Book) => {
    if (book.isPrivate && !isVerifiedMember) {
      setRestrictedBook(book);
      return;
    }
    setReadingBook(book);
  };

  // Mock content display for simulated interactive PDF reading
  const mockPages = [
    { page: 1, title: 'সূচিপত্র ও প্রস্তাবনা', text: 'শিক্ষা হলো মানুষের মানবিক গুণাবলীর সামগ্রিক বিকাশ সাধনকারী মাধ্যম। যখন পুঁজিবাদ শিক্ষাকে পণ্যে রূপান্তর করেছে, তখন এই আন্দোলনের আবশ্যকতা অনস্বীকার্য।... প্রগতিশীল চিন্তা ছাড়া নৈতিক চরিত্রের সুদৃঢ় ভিত্তি দাঁড়াতে পারে না।' },
    { page: 2, title: 'অধ্যায় ১: সমাজ ও সভ্যতা', text: 'ঐতিহাসিক বস্তুবাদী দৃষ্টিভঙ্গি নির্দেশ করে যে প্রতিটি সমাজ পরিবর্তনের গভীরে অর্থনৈতিক উৎপাদন সম্পর্কের ভূমিকা রয়েছে। দাস প্রথা থেকে শুরু করে সামন্ত প্রথার এবং তৎপরবর্তী বর্তমান বুর্জোয়া সমাজের সংকটসমূহ সমাজতান্ত্রিক বিপ্লবের দিকেই দিকনির্দেশ করে।' },
    { page: 3, title: 'অধ্যায় ২: ৪ দফা দাবিনামা', text: '১. সর্বজনীন একমুখী অবৈতনিক শিক্ষা ব্যবস্থা প্রবর্তন। ২. আনন্দ মোহন কলেজের তীব্র ছাত্র আবাসন সংকট রাজনৈতিক দখলদারিত্বমুক্ত করে নিরসন করা। ৩. গবেষণা পরিদপ্তর ও বিশ্বকোষীয় লাইব্রেরী আধুনিকায়ন। ৪. শিক্ষাক্ষেত্রে বাণিজ্যিক ঋণের নামে কুক্ষিগতকরণ চক্রান্ত প্রত্যাহার।' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Search Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-805 pb-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
            <BookMarked className="text-rose-600 w-7 h-7" />
            <span>রাজনৈতিক শিক্ষা, ছাত্র বুলেটিন ও প্রকাশনা</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 font-mono">
            মার্ক্সবাদী তত্ত্বীয় বই, ঐতিহাসিক সংগ্রামের ছাত্র বুলেটিন এবং ময়মনসিংহের মুখপত্রসমূহ
          </p>
        </div>

        {/* Local Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="বই বা বুলেটিনের নাম খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-2 pl-9 bg-zinc-50 dark:bg-zinc-900 text-xs border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none min-w-[240px] text-zinc-800 dark:text-zinc-200"
          />
          <BookOpen className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { key: 'all', label: 'সকল প্রকাশনা' },
          { key: 'book', label: 'তাত্ত্বিক বই ও পুস্তিকা' },
          { key: 'magazine', label: 'ছাত্র ফ্রন্ট বুলেটিন' },
          { key: 'study-material', label: 'শিক্ষা শিবিরের উপকরণ' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveFilter(item.key as any)}
            className={`px-3.5 py-1.5 text-xs rounded transition cursor-pointer ${
              activeFilter === item.key
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-850'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredBooks.map((book) => {
          const isDownloading = showDownloadNote === book.id;
          return (
            <div
              key={book.id}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm overflow-hidden flex flex-col p-5 hover:border-rose-400/40 transition duration-300 shadow-xs group"
            >
              <div className="flex gap-4">
                {/* Book Cover Image */}
                <div className="relative w-24 h-32 bg-zinc-100 dark:bg-zinc-900 border dark:border-zinc-850 shrink-0 shadow-sm overflow-hidden rounded-xs">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 px-1.5 py-0.5 rounded font-mono uppercase">
                      {book.type === 'book' ? 'তাত্ত্বিক পুস্তিকা' : book.type === 'magazine' ? 'বুলেটিন' : 'শিক্ষা মেটেরিয়াল'}
                    </span>
                    {book.isPrivate && (
                      <span className={`text-[8px] font-bold tracking-tight px-1.5 py-0.5 rounded ${
                        isVerifiedMember
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 border border-amber-500/20'
                      }`}>
                        {isVerifiedMember ? '● অনুমোদিত অ্যাক্সেস' : '🔒 শুধুমাত্র সদস্য'}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-2 leading-snug truncate group-hover:text-rose-600 dark:group-hover:text-rose-450 transition flex items-center gap-1" title={book.title}>
                    {book.isPrivate && !isVerifiedMember && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    <span>{book.title}</span>
                  </h3>
                  
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                    লেখক/সংকলক: {book.author}
                  </p>

                  <p className="text-xs text-zinc-600 dark:text-zinc-450 line-clamp-3 mt-2 font-sans">
                    {book.description}
                  </p>
                </div>
              </div>

              {/* Bottom bar and Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-900 text-xs">
                <button
                  onClick={() => handleRead(book)}
                  className="flex items-center justify-center space-x-1 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-250 dark:hover:bg-zinc-800 rounded font-semibold transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>অনলাইনে পড়ুন</span>
                </button>

                <button
                  onClick={() => handleDownload(book)}
                  className="flex items-center justify-center space-x-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>পিডিএফ ডাউনলোড</span>
                </button>
              </div>

              {/* Download statistics */}
              <div className="mt-3 flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                <span>প্রকাশকাল: {book.date}</span>
                <span>ডাউনলোড: {book.downloadCount || 0} বার</span>
              </div>

              {/* Social Share Row */}
              <div id={`share-book-${book.id}`} className="mt-3.5 pt-3 border-t border-zinc-150 dark:border-zinc-900 flex justify-between items-center text-[10px]">
                <span className="text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1 font-sans">
                  <Share2 className="w-3.5 h-3.5 text-rose-650" />
                  <span>শেয়ারঃ</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=books&bookId=${book.id}` : '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-zinc-50 hover:bg-[#1877F2]/10 text-zinc-500 hover:text-[#1877F2] rounded border border-zinc-200/50 dark:bg-zinc-900/40 dark:border-zinc-800/40 transition"
                    title="ফেসবুকে শেয়ার"
                  >
                    <Facebook className="w-3 h-3" />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('কমরেড, ' + book.title + ' বইটি পড়ার জন্য আমন্ত্রণঃ ')}&url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=books&bookId=${book.id}` : '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-zinc-50 hover:bg-[#1DA1F2]/10 text-zinc-500 hover:text-[#1DA1F2] rounded border border-zinc-200/50 dark:bg-zinc-900/40 dark:border-zinc-800/40 transition"
                    title="X-এ শেয়ার"
                  >
                    <Twitter className="w-3 h-3" />
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent('কমরেড, ' + book.title + ' বইটি পড়তে ভিজিট করুনঃ ' + (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=books&bookId=${book.id}` : ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-zinc-50 hover:bg-[#25D366]/10 text-zinc-500 hover:text-[#25D366] rounded border border-zinc-200/50 dark:bg-zinc-900/45 dark:border-zinc-800/40 transition"
                    title="হোয়াটসঅ্যাপে শেয়ার"
                  >
                    <MessageSquare className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => {
                      const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?tab=books&bookId=${book.id}` : '';
                      navigator.clipboard.writeText(shareUrl);
                      setCopiedBookId(book.id);
                      setTimeout(() => setCopiedBookId(null), 2000);
                    }}
                    className="p-1.5 bg-zinc-50 hover:bg-rose-150 text-zinc-500 hover:text-rose-600 rounded border border-zinc-200/50 dark:bg-zinc-900/45 dark:border-zinc-800/40 transition cursor-pointer"
                    title="লিংক কপি"
                  >
                    {copiedBookId === book.id ? <Check className="w-3 h-3 text-emerald-600 font-bold" /> : <Link className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Success Notification Alert */}
              {isDownloading && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 p-2 rounded-xs border border-emerald-200 text-[10px] flex items-center space-x-1"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>PDF ডাউনলোড সফল! লাইব্রেরি ডাটাবেজে স্ট্যাটাস আপডেট হয়েছে।</span>
                </motion.div>
              )}
            </div>
          );
        })}

        {filteredBooks.length === 0 && (
          <div className="col-span-3 p-16 border border-dashed text-center text-zinc-400 font-sans">
            আপনার অনুসন্ধান শব্দের অনুকূলে কোনো রাজনৈতিক বই বা বুলেটিন সংকলন পাওয়া যায়নি।
          </div>
        )}
      </div>

      {/* Simulated Interactive PDF reader modal */}
      <AnimatePresence>
        {readingBook && (
          <div id="pdf-reader-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-3xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
              {/* Header */}
              <div className="bg-zinc-800 text-white p-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm truncate max-w-[220px] md:max-w-md">
                    {readingBook.title} - [অনলাইন ডক রিডার]
                  </span>
                </div>
                <button
                  onClick={() => setReadingBook(null)}
                  className="text-zinc-400 hover:text-white font-mono font-bold"
                >
                  ✕ বন্ধ করুন
                </button>
              </div>

              {/* Reader pages simulator / Real PDF Iframe Viewer */}
              <div className="flex-1 overflow-hidden relative bg-zinc-250 dark:bg-zinc-950 flex flex-col">
                {readingBook.pdfUrl && readingBook.pdfUrl !== '#' && readingBook.pdfUrl !== '' ? (
                  <iframe 
                    src={readingBook.pdfUrl}
                    className="w-full h-full flex-1 border-0"
                    title={readingBook.title}
                  />
                ) : (
                  <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8">
                    <div className="bg-rose-100 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 px-4 py-2 border-l-4 border-rose-600 text-xs rounded-sm mb-6 flex items-start space-x-1.5 leading-normal">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>এটি সমাজতান্ত্রিক ছাত্র ফ্রন্টের অভ্যন্তরীণ রাজনৈতিক শিক্ষা উপকরণের প্রথম খসড়া। শিক্ষাদানের স্বার্থে শিক্ষার্থীদের বিনামূল্যে বিতরণের জন্য সংরক্ষিত।</span>
                    </div>

                    {mockPages.map((page) => (
                      <div key={page.page} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-6 sm:p-8 rounded shadow-sm font-sans">
                        <div className="flex justify-between border-b pb-2 mb-4 text-xs text-zinc-400">
                          <span>সমাজতান্ত্রিক ছাত্র ফ্রন্ট শিক্ষা সেল</span>
                          <span>পাতা {page.page} অফ {mockPages.length}</span>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 mb-3">{page.title}</h4>
                        <p className="text-zinc-650 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                          {page.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer status bar */}
              <div className="bg-zinc-850 p-3 text-center border-t border-zinc-800">
                <button
                  onClick={() => {
                    handleDownload(readingBook);
                    setReadingBook(null);
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded transition shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>সম্পূর্ণ পিডিএফ ডাউনলোড করুন ({readingBook.downloadCount}টি ডাউনলোড)</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Locked publication restriction notice modal */}
      <AnimatePresence>
        {restrictedBook && (
          <div id="restricted-book-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs">
            <div className="bg-zinc-950 border border-amber-900/40 p-6 sm:p-8 max-w-md w-full rounded-lg shadow-2xl overflow-hidden relative flex flex-col items-center text-center space-y-4">
              <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 blur-[50px] rounded-full pointer-events-none" />
              
              <Lock className="w-12 h-12 text-amber-500 animate-pulse" />
              
              <div className="space-y-2">
                <span className="bg-amber-950 text-amber-450 border border-amber-900/30 font-mono text-[9px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  MEMBERS-ONLY RESTRICTED
                </span>
                <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                  {restrictedBook.title}
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  এটি ময়মনসিংহ জেলা সমাজতান্ত্রিক ছাত্র ফ্রন্টের ভেরিফাইড সদস্য ও দায়িত্বশীল কমরেডদের উচ্চতর বৈপ্লবিক অনুশীলনের জন্য একটি বিশেষ প্রকাশনা। 
                  <br />
                  <br />
                  অনুগ্রহ করে <strong>"মেম্বার পোর্টাল"</strong> সারণী ব্যবহার করে আপনার অনুমোদিত ইমেইল দ্বারা সাইন-ইন সম্পন্ন করুন।
                </p>
              </div>

              <div className="w-full pt-4 flex flex-col gap-2 font-sans">
                <button
                  onClick={() => setRestrictedBook(null)}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded transition cursor-pointer select-none"
                >
                  ফিরে যান
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
