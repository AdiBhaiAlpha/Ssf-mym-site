import React, { useState, useEffect } from 'react';
import { MemberRegistration } from './types';
import Navigation from './components/Navigation';
import BreakingNews from './components/BreakingNews';
import Hero from './components/Hero';
import AboutUs from './components/AboutUs';
import LeadershipSection from './components/LeadershipSection';
import NewsBlogSection from './components/NewsBlogSection';
import EventsSection from './components/EventsSection';
import PublicationsSection from './components/PublicationsSection';
import CircularsSection from './components/CircularsSection';
import MembershipForm from './components/MembershipForm';
import MemberPortal from './components/MemberPortal';
import PortalAuth from './components/PortalAuth';
import MediaCenter from './components/MediaCenter';
import ContactSection from './components/ContactSection';
import AdminDashboard from './components/AdminDashboard';
import CardVerificationModal from './components/CardVerificationModal';
import { AppDatabase } from './server/db-initial';
import { Volume2, RefreshCw, Smartphone, Monitor, ChevronRight } from 'lucide-react';
import { fetchFirestoreDatabase, saveFirestoreDoc, deleteFirestoreDoc, resetFirestoreDatabase, secondaryAuth, secondaryGoogleProvider, db as firestoreDb } from './firebase';
import { getRedirectResult, signInWithCredential, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { authDiagnostics, validateFirebaseUser, decomposeAuthError, logMemberLoginDirect } from './lib/authService';
import { motion, AnimatePresence } from 'motion/react';
import { updateSEOMetadata } from './lib/seo';
import { useToast } from './components/Toast';
import ContentDetails from './components/ContentDetails';
import DebugConsole from './components/DebugConsole';
import LiveExportDebugger from './components/LiveExportDebugger';
import UnsupportedBrowserModal from './components/UnsupportedBrowserModal';
import { BrowserProfile } from './lib/BrowserDetection';

export default function App() {
  const toast = useToast();
  const [currentTab, setCurrentTab] = useState('home');
  const [darkMode, setDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Native Auth Flow State
  const [isNativeAuth, setIsNativeAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('nativeAuth') === 'true') {
        setIsNativeAuth(true);
      }
    }
  }, []);

  // Unsupported Browser Modal State
  const [unsupportedModalOpen, setUnsupportedModalOpen] = useState(false);
  const [detectedBrowserProfile, setDetectedBrowserProfile] = useState<BrowserProfile | null>(null);

  // Active Details state for clicking on any card item
  const [activeDetails, setActiveDetails] = useState<{ type: string; id: string } | null>(null);

  // Core Dynamic State
  const [db, setDb] = useState<AppDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Offline Detection State
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Verification State triggered by QR
  const [verifyMemberId, setVerifyMemberId] = useState<string | null>(null);

  // Developer Debug Console State
  const [showDebugConsole, setShowDebugConsole] = useState(false);

  // Sync online/offline listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Native Google Sign-In & Auth State Synchronizer
  useEffect(() => {
    const handleNativeGoogleAuthSuccess = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { user, email, actionType, displayName, photoURL } = customEvent.detail || {};
      
      const emailVal = (email || user?.email || '').toLowerCase().trim();
      if (!emailVal) return;

      console.log('Native Google Auth Success Event:', emailVal, actionType);

      // Store authenticated session locally
      setUserEmail(emailVal);
      localStorage.setItem('admin-email', emailVal);

      // Log direct login activity
      try {
        await logMemberLoginDirect(emailVal, 'success', `গুগল প্লে সার্ভিসেস নেটিভ সাইন-ইন সফল: ${displayName || emailVal}`);
      } catch (logErr) {
        console.error('Failed to log login:', logErr);
      }

      // Handle registration form verification autofills if applicable
      if (actionType === 'nav_register_verify' || actionType === 'member_form_verify') {
        const storedInputsStr = localStorage.getItem('scf_pending_form_reg_inputs') || localStorage.getItem('scf_pending_nav_reg_inputs');
        if (storedInputsStr) {
          try {
            const inputs = JSON.parse(storedInputsStr);
            inputs.email = emailVal;
            inputs.name = inputs.name || displayName || '';
            inputs.photoUrl = inputs.photoUrl || photoURL || '';
            localStorage.setItem('scf_pending_form_reg_inputs', JSON.stringify(inputs));
          } catch (pErr) {
            console.error(pErr);
          }
        }
        const verifyEvent = new CustomEvent('google-verify-success', { 
          detail: { email: emailVal, photoUrl: photoURL } 
        });
        window.dispatchEvent(verifyEvent);
      }

      // Show success feedback
      toast.success('গুগল অ্যাকাউন্ট সাইন-ইন সফল হয়েছে!');

      // Automatically navigate to Home screen
      setCurrentTab('home');

      // Refresh database in background
      fetchDatabase(true);
    };

    window.addEventListener('native-google-auth-success', handleNativeGoogleAuthSuccess);

    // Listen to Firebase secondaryAuth persistent auth state changes
    const unsubscribeAuth = secondaryAuth.onAuthStateChanged((user) => {
      if (user && user.email) {
        const emailVal = user.email.toLowerCase().trim();
        setUserEmail(emailVal);
        localStorage.setItem('admin-email', emailVal);
      }
    });

    return () => {
      window.removeEventListener('native-google-auth-success', handleNativeGoogleAuthSuccess);
      unsubscribeAuth();
    };
  }, []);

  // Listen for unsupported browser sign-in events
  useEffect(() => {
    const handleUnsupportedBrowser = (event: Event) => {
      const customEvent = event as CustomEvent<BrowserProfile>;
      if (customEvent.detail) {
        setDetectedBrowserProfile(customEvent.detail);
        setUnsupportedModalOpen(true);
      }
    };

    window.addEventListener('unsupported-browser-sign-in', handleUnsupportedBrowser);
    return () => {
      window.removeEventListener('unsupported-browser-sign-in', handleUnsupportedBrowser);
    };
  }, []);

  const getFilteredNews = () => {
    if (!db) return [];
    if (!globalSearchQuery.trim()) return db.news;
    const query = globalSearchQuery.toLowerCase();
    return db.news.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.excerpt.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.author.toLowerCase().includes(query) ||
        (n.tags && n.tags.some((t: string) => t.toLowerCase().includes(query)))
    );
  };

  const getFilteredBlogs = () => {
    if (!db) return [];
    if (!globalSearchQuery.trim()) return db.blogs;
    const query = globalSearchQuery.toLowerCase();
    return db.blogs.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.excerpt.toLowerCase().includes(query) ||
        b.content.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query)
    );
  };

  const getFilteredEvents = () => {
    if (!db) return [];
    if (!globalSearchQuery.trim()) return db.events;
    const query = globalSearchQuery.toLowerCase();
    return db.events.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query) ||
        e.venue.toLowerCase().includes(query)
    );
  };

  // Restore Theme preference and Admin email on load
  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem('front-theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Explicitly set the site name as the page title as requested by the user
    document.title = "সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ";

    // Auth state restore
    const savedEmail = localStorage.getItem('admin-email');
    if (savedEmail) {
      setUserEmail(savedEmail);
    }

    // Check query parameters to deep-link to tabs or details
    const params = new URLSearchParams(window.location.search);
    let urlTab = params.get('tab');
    
    const newsId = params.get('newsId') || params.get('newsid');
    const blogId = params.get('blogId') || params.get('blogid');
    const bookId = params.get('bookId') || params.get('bookid');
    const circularId = params.get('circularId') || params.get('circularid') || params.get('noticeId') || params.get('noticeid');
    const eventId = params.get('eventId') || params.get('eventid');
    const mediaId = params.get('mediaId') || params.get('mediaid');

    if (newsId) {
      setActiveDetails({ type: 'news', id: newsId });
      urlTab = 'news';
    } else if (blogId) {
      setActiveDetails({ type: 'blog', id: blogId });
      urlTab = 'news';
    } else if (bookId) {
      setActiveDetails({ type: 'publication', id: bookId });
      urlTab = 'books';
    } else if (circularId) {
      setActiveDetails({ type: 'circular', id: circularId });
      urlTab = 'circulars';
    } else if (eventId) {
      setActiveDetails({ type: 'event', id: eventId });
      urlTab = 'events';
    } else if (mediaId) {
      setActiveDetails({ type: 'media', id: mediaId });
      urlTab = 'media';
    }

    if (!urlTab) {
      if (newsId || blogId) {
        urlTab = 'news';
      } else if (bookId) {
        urlTab = 'books';
      } else if (circularId) {
        urlTab = 'circulars';
      } else if (eventId) {
        urlTab = 'events';
      } else if (mediaId) {
        urlTab = 'media';
      }
    }
    if (urlTab && ['home', 'news', 'books', 'events', 'circulars', 'about', 'join', 'portal', 'media', 'contact'].includes(urlTab)) {
      setCurrentTab(urlTab);
    }

    const mId = params.get('verify-member');
    if (mId) {
      setVerifyMemberId(mId);
    }

    // Fetch database contents
    fetchDatabase();
  }, []);

  // Dynamic SEO handler for main sections
  useEffect(() => {
    const seoConfig: Record<string, { title: string; description: string }> = {
      home: {
        title: "সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা শাখা - সর্বজনীন গণতান্ত্রিক ও বৈজ্ঞানিক সমাজতান্ত্রিক সমাজ বিনির্মাণের লক্ষ্যে আপোষহীন প্রগতিশীল ছাত্র আন্দোলন।"
      },
      news: {
        title: "সংবাদ ও কলাম | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা শাখার সাম্প্রতিক কর্মকাণ্ড, প্রেস বিজ্ঞপ্তি, ছাত্র আন্দোলন এবং তাত্ত্বিক কলাম ও বিশ্লেষণ।"
      },
      books: {
        title: "শিক্ষা ও প্রকাশনা | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "মার্ক্সীয় দর্শন, পুঁজিবাদবিরোধী লড়াই, রাজনৈতিক প্রবন্ধ, বিপ্লবী ইতিহাস এবং সমাজতান্ত্রিক ছাত্র ফ্রন্টের বিভিন্ন বৈপ্লবিক ও তাত্ত্বিক প্রকাশনাসমূহ।"
      },
      events: {
        title: "আসন্ন ইভেন্ট ও কর্মসূচী | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "ময়মনসিংহ জেলা সংসদের কর্মী সভা, রাজনৈতিক পাঠচক্র, প্রতিবাদী সমাবেশ ও সাংস্কৃতিক অনুষ্ঠানসমূহের বিস্তারিত বিবরণ এবং অংশগ্রহণ ফরম।"
      },
      circulars: {
        title: "সাংগঠনিক সার্কুলার | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "সংগঠনের অভ্যন্তরীণ সিদ্ধান্ত, নির্দেশনা, দাপ্তরিক বিজ্ঞপ্তি ও সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা সংসদের দাপ্তরিক সার্কুলারসমূহ।"
      },
      about: {
        title: "আমাদের সম্পর্কে ও গঠনতন্ত্র | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "সমাজতান্ত্রিক ছাত্র ফ্রন্টের লক্ষ্য, রাজনৈতিক আদর্শ, ঐতিহাসিক রূপরেখা এবং গণতান্ত্রিক কেন্দ্রিকতা ভিত্তিক আপোষহীন সাংগঠনিক গঠনতন্ত্র।"
      },
      join: {
        title: "অনলাইন সদস্যপদ আবেদন ফরম | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা শাখার সক্রিয় কর্মী বা সহযোগী হিসেবে যুক্ত হতে অনলাইন সদস্যপদ আবেদন ফরম পূরণ করুন।"
      },
      portal: {
        title: "মেম্বার ও কমরেড পোর্টাল | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "সংগঠনের রেজিস্টার্ড সদস্যদের জন্য অনলাইন ড্যাশবোর্ড ও লগার, যেখানে দলীয় পরিচয়পত্র ডাউনলোড এবং কাজের রিপোর্ট তদারকি করা যায়।"
      },
      media: {
        title: "ফটোগ্রাফি ও মিডিয়া সেন্টার | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "ঐতিহাসিক সমাবেশ, প্রতিবাদী স্লোগান, দেয়াল লিখন ও ময়মনসিংহের ছাত্র ফ্রন্টের বিভিন্ন প্রগতিশীল রাজনৈতিক আন্দোলনের চিত্রশালা।"
      },
      contact: {
        title: "যোগাযোগ করুন | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "ময়মনসিংহ জেলা কার্যালয়ের ঠিকানা, মোবাইল নম্বর এবং ইমেইল। যেকোনো তথ্য বা প্রগতিশীল জিজ্ঞাসার জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন।"
      }
    };

    const config = seoConfig[currentTab] || seoConfig.home;
    
    // Only update if we are on pages that don't have secondary deep details selected
    // Note: Child components like NewsBlogSection, EventsSection, and PublicationsSection will override the title when a detailed item is active
    updateSEOMetadata({
      title: config.title,
      description: config.description,
      type: 'website',
      url: `${window.location.origin}${window.location.pathname}?tab=${currentTab}`
    });
  }, [currentTab]);

  // Sync darkmode state to document html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('front-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('front-theme', 'light');
    }
  }, [darkMode]);

  // Disable automatic browser scroll restoration on history navigation
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Listen to popstate event (browser back/forward button clicks)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      let urlTab = params.get('tab');
      
      const newsId = params.get('newsId') || params.get('newsid');
      const blogId = params.get('blogId') || params.get('blogid');
      const bookId = params.get('bookId') || params.get('bookid');
      const circularId = params.get('circularId') || params.get('circularid') || params.get('noticeId') || params.get('noticeid');
      const eventId = params.get('eventId') || params.get('eventid');
      const mediaId = params.get('mediaId') || params.get('mediaid');

      if (newsId) setActiveDetails({ type: 'news', id: newsId });
      else if (blogId) setActiveDetails({ type: 'blog', id: blogId });
      else if (bookId) setActiveDetails({ type: 'publication', id: bookId });
      else if (circularId) setActiveDetails({ type: 'circular', id: circularId });
      else if (eventId) setActiveDetails({ type: 'event', id: eventId });
      else if (mediaId) setActiveDetails({ type: 'media', id: mediaId });
      else setActiveDetails(null);

      if (!urlTab) {
        if (newsId || blogId) {
          urlTab = 'news';
        } else if (bookId) {
          urlTab = 'books';
        } else if (circularId) {
          urlTab = 'circulars';
        } else if (eventId) {
          urlTab = 'events';
        } else if (mediaId) {
          urlTab = 'media';
        } else {
          urlTab = 'home';
        }
      }
      if (urlTab && ['home', 'news', 'books', 'events', 'circulars', 'about', 'join', 'portal', 'media', 'contact', 'leadership', 'membership', 'member-portal'].includes(urlTab)) {
        setCurrentTab(urlTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Synchronize browser URL query with activeDetails and currentTab state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    
    if (activeDetails) {
      params.delete('newsId');
      params.delete('blogId');
      params.delete('bookId');
      params.delete('circularId');
      params.delete('eventId');
      params.delete('noticeId');
      params.delete('mediaId');

      if (activeDetails.type === 'news') params.set('newsId', activeDetails.id);
      else if (activeDetails.type === 'blog') params.set('blogId', activeDetails.id);
      else if (activeDetails.type === 'publication') params.set('bookId', activeDetails.id);
      else if (activeDetails.type === 'circular') params.set('circularId', activeDetails.id);
      else if (activeDetails.type === 'event') params.set('eventId', activeDetails.id);
      else if (activeDetails.type === 'media') params.set('mediaId', activeDetails.id);

      let alignedTab = currentTab;
      if (activeDetails.type === 'news') alignedTab = 'news';
      else if (activeDetails.type === 'blog') alignedTab = 'news';
      else if (activeDetails.type === 'publication') alignedTab = 'books';
      else if (activeDetails.type === 'circular') alignedTab = 'circulars';
      else if (activeDetails.type === 'event') alignedTab = 'events';
      else if (activeDetails.type === 'media') alignedTab = 'media';

      if (alignedTab !== currentTab) {
        setCurrentTab(alignedTab);
      }
      params.set('tab', alignedTab);
      
      const newUrl = `?${params.toString()}`;
      // Use pushState so users can use the back button to close detail view
      window.history.pushState(null, '', newUrl);
    } else {
      // Clear IDs if details is closed
      params.delete('newsId');
      params.delete('blogId');
      params.delete('bookId');
      params.delete('circularId');
      params.delete('eventId');
      params.delete('noticeId');
      params.delete('mediaId');
      params.set('tab', currentTab);
      
      const newUrl = `?${params.toString()}`;
      if (urlTab !== currentTab) {
        window.history.pushState(null, '', newUrl);
      } else {
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, [activeDetails, currentTab]);

  // Whenever currentTab changes, scroll the window to the very top.
  // This guarantees that all sub-pages, listing pages, detailed views, and tab-level navigations start from top: 0.
  useEffect(() => {
    const performScrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as ScrollBehavior
      });
    };

    // Execute immediately on state changes
    performScrollToTop();

    // In case the page rendering requires a few frames (async content rendering, virtual DOM mounting),
    // schedule a secondary safe scroll reset.
    const timer = setTimeout(performScrollToTop, 50);
    return () => clearTimeout(timer);
  }, [currentTab]);

  // Log visitor activity on page/tab changes
  useEffect(() => {
    if (db) {
      const device = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
      const mappedTabName = currentTab === 'home' ? 'হোমপেজ' : currentTab === 'news' ? 'নিউজ পোর্টাল' : currentTab === 'books' ? 'শিক্ষা ও প্রকাশনা' : currentTab;
      const dateString = new Date().toISOString().split('T')[0];
      const visitId = `v_${dateString}_${mappedTabName}_${device}_${Date.now()}`;
      
      saveFirestoreDoc('visits', visitId, {
        id: visitId,
        date: dateString,
        page: mappedTabName,
        device,
        views: 1
      }).catch(err => console.error('Failed to log visitor analytics', err));
    }
  }, [currentTab, db ? true : false]);

  const fetchDatabase = async (silent = false) => {
    let hasCache = false;
    try {
      const cachedData = localStorage.getItem('scf_database_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed && typeof parsed === 'object' && parsed.settings) {
          setDb(parsed);
          setErrorMsg(null);
          // With cache available, instantly lift the loading state to keep app fully interactive
          setLoading(false);
          hasCache = true;
          // Force background sync mode to run silently in the background
          silent = true;
        }
      }
    } catch (cacheError) {
      console.warn('Cache loading bypassed:', cacheError);
    }

    try {
      if (!silent && !hasCache) {
        setLoading(true);
      }
      const data = await fetchFirestoreDatabase();
      
      // Update local cache asynchronously for subsequent visits
      try {
        localStorage.setItem('scf_database_cache', JSON.stringify(data));
      } catch (saveError) {
        console.warn('Failed to save database cache to localStorage:', saveError);
      }

      setDb(data);
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Database sync and fetch failure', err);
      // Only show error message if we don't have any data loaded (either in state or cache)
      if (!hasCache && !db) {
        setErrorMsg(err?.message || 'Error communicating with cloud database.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string) => {
    setUserEmail(email);
    localStorage.setItem('admin-email', email);
    if (email.toLowerCase() === 'chitronbhattacharjee@gmail.com') {
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'সুপার এডমিন লগইন',
        user: email,
        details: 'চিত্তাভ ভট্টাচার্য সফলতার সাথে ড্যাশবোর্ডে লগইন করেছেন।'
      };
      try {
        await saveFirestoreDoc('logs', logId, logData);
      } catch (e) {
        console.error(e);
      }
      await fetchDatabase();
    }
  };

  const handleLogout = async () => {
    if (userEmail) {
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'লগআউট',
        user: userEmail,
        details: 'এডমিন পোর্টাল থেকে সেশন বাতিল করা হয়েছে।'
      };
      setUserEmail(null);
      localStorage.removeItem('admin-email');
      if (currentTab === 'admin') {
        setCurrentTab('home');
      }
      try {
        await saveFirestoreDoc('logs', logId, logData);
      } catch (e) {
        console.error(e);
      }
      await fetchDatabase();
    }
  };

  const handleCloseVerification = () => {
    setVerifyMemberId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('verify-member');
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  const handleViewMemberProfile = (memberCode: string) => {
    if (!memberCode) return;
    const cleanCode = memberCode.replace('SSF-MYM-', '').trim().toLowerCase();
    const matched = db?.memberships?.find(m => {
      const matchId = m.id.substring(m.id.length - 5).toLowerCase();
      return matchId === cleanCode || m.id.toLowerCase() === cleanCode || (m.mobile && m.mobile.includes(cleanCode));
    });
    if (matched) {
      setVerifyMemberId(matched.id);
    } else {
      toast.error(`দুঃখিত, '${memberCode}' এই মেম্বার কোডের বিপরীতে আমাদের ডাটাবেজে কোনো নিবন্ধিত সদস্য প্রোফাইল পাওয়া যায়নি।`);
    }
  };

  // FULL-STACK SERVER API CALL HANDLERS
  const handleResetDB = async () => {
    if (!userEmail) return false;
    try {
      await resetFirestoreDatabase();
      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleSaveSettings = async (settings: any) => {
    if (!userEmail) return false;
    try {
      await saveFirestoreDoc('settings', 'webSettings', settings);
      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleSaveOrganizations = async (organizations: any) => {
    if (!userEmail) return false;
    try {
      for (const org of organizations) {
        if (org.id) {
          await saveFirestoreDoc('organizations', org.id, org);
        }
      }
      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleAddInvitation = async (email: string, role: 'admin' | 'super_admin') => {
    if (!userEmail) return false;
    try {
      const cleanEmail = email.trim().toLowerCase();
      const id = 'invite_' + Date.now();
      const newInvite = {
        id,
        email: cleanEmail,
        role: role || 'admin',
        status: 'pending' as const,
        invitedBy: userEmail,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      await saveFirestoreDoc('invitations', id, newInvite);

      // Save log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'এডমিন নিমন্ত্রণ পাঠানো হয়েছে',
        user: userEmail,
        details: `${cleanEmail} কমরেডকে ${role === 'super_admin' ? 'সুপার এডমিন' : 'সমন্বয়ক এডমিন'} হিসেবে দায়িত্ব বা প্যানেল নিমন্ত্রণ পাঠানো হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleDeleteInvitation = async (id: string) => {
    try {
      const matched = db?.invitations?.find(i => i.id === id);
      if (matched) {
        await deleteFirestoreDoc('invitations', id);

        // Save log
        const logId = 'log_' + Date.now();
        const logData = {
          id: logId,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: 'এডমিন নিমন্ত্রণ বাতিল',
          user: userEmail || 'unknown',
          details: `কমরেড ${matched.email}-এর এডমিন নিমন্ত্রণটি প্যানেল থেকে সফলভাবে বাতিল করা হয়েছে।`
        };
        await saveFirestoreDoc('logs', logId, logData);

        await fetchDatabase();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleInviteAction = async (id: string, action: 'accepted' | 'declined') => {
    try {
      const matched = db?.invitations?.find(i => i.id === id);
      if (matched) {
        const updated = { ...matched, status: action };
        await saveFirestoreDoc('invitations', id, updated);

        // Save log
        const logId = 'log_' + Date.now();
        const logData = {
          id: logId,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: `নিমন্ত্রণ ${action === 'accepted' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'}`,
          user: userEmail || matched.email,
          details: `কমরেড ${matched.email} এডমিন নিমন্ত্রণ ${action === 'accepted' ? 'সরাসরি গ্রহণ করে পূর্ণ এডমিন প্যানেল এক্সেস সেশন চালু করেছেন।' : 'প্রত্যাখ্যান করেছেন।'}`
        };
        await saveFirestoreDoc('logs', logId, logData);
        
        await fetchDatabase();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleAddNews = async (article: any) => {
    if (!userEmail) return false;
    try {
      const id = 'news_' + Date.now();
      const item = {
        ...article,
        id,
        views: 0,
        date: new Date().toISOString().split('T')[0]
      };
      await saveFirestoreDoc('news', id, item);

      // Log news added
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'নিউজ তৈরি',
        user: userEmail,
        details: `"${article.title}" শিরোনামে খবর প্রকাশিত করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleEditNews = async (id: string, article: any) => {
    if (!userEmail) return false;
    try {
      const matched = db?.news?.find(n => n.id === id);
      const updated = { ...matched, ...article, id };
      await saveFirestoreDoc('news', id, updated);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'নিউজ সম্পাদিত',
        user: userEmail,
        details: `"${updated.title}" শিরোনামের খবর এডিট বা আপডেট করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleDeleteNews = async (id: string) => {
    if (!userEmail) return false;
    try {
      const matched = db?.news?.find(n => n.id === id);
      await deleteFirestoreDoc('news', id);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'নিউজ অপসারিত',
        user: userEmail,
        details: `"${matched?.title || id}" খবরটি ডেটাবেজ থেকে মুছে দেওয়া হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleAddBlog = async (blogPost: any) => {
    if (!userEmail) return false;
    try {
      const id = 'blog_' + Date.now();
      const item = {
        ...blogPost,
        id,
        views: 0,
        comments: [],
        date: new Date().toISOString().split('T')[0]
      };
      await saveFirestoreDoc('blogs', id, item);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'ব্লগ তৈরি',
        user: userEmail,
        details: `"${blogPost.title}" প্রগতিশীল প্রবন্ধটি সফলভাবে প্রকাশ করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleDeleteBlog = async (id: string) => {
    if (!userEmail) return false;
    try {
      const matched = db?.blogs?.find(b => b.id === id);
      await deleteFirestoreDoc('blogs', id);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'ব্লগ অপসারিত',
        user: userEmail,
        details: `"${matched?.title || id}" নিবন্ধটি মুছে দেওয়া হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleUpdateBlog = async (id: string, updatedBlog: any) => {
    if (!userEmail) return false;
    try {
      await saveFirestoreDoc('blogs', id, updatedBlog);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'ব্লগ আপডেট/অনুমোদন',
        user: userEmail,
        details: `"${updatedBlog.title}" নিবন্ধটির স্থিতি আপডেট করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleAddComment = async (blogId: string, authorName: string, authorEmail: string, text: string) => {
    try {
      const matchedBlog = db?.blogs?.find(b => b.id === blogId);
      if (!matchedBlog) return null;

      const newC = {
        id: 'comment_' + Date.now(),
        authorName,
        authorEmail,
        text,
        date: new Date().toISOString().split('T')[0],
        approved: authorEmail.toLowerCase() === 'chitronbhattacharjee@gmail.com' || (db as any).invitations?.some((i: any) => i.email.toLowerCase() === authorEmail.toLowerCase() && i.status === 'accepted')
      };

      const updatedComments = [...(matchedBlog.comments || []), newC];
      const updatedBlog = { ...matchedBlog, comments: updatedComments };
      await saveFirestoreDoc('blogs', blogId, updatedBlog);

      await fetchDatabase();
      return newC;
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleApproveComment = async (blogId: string, commentId: string) => {
    if (!userEmail) return false;
    try {
      const matchedBlog = db?.blogs?.find(b => b.id === blogId);
      if (!matchedBlog) return false;

      const comments = (matchedBlog.comments || []).map(c => {
        if (c.id === commentId) {
          return { ...c, approved: true };
        }
        return c;
      });

      const updatedBlog = { ...matchedBlog, comments };
      await saveFirestoreDoc('blogs', blogId, updatedBlog);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleAddEvent = async (event: any) => {
    if (!userEmail) return false;
    try {
      const id = 'event_' + Date.now();
      const item = { ...event, id, registrants: [], status: 'upcoming' };
      await saveFirestoreDoc('events', id, item);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'ইভেন্ট তৈরি',
        user: userEmail,
        details: `"${event.title}" ইভেন্টটি যুক্ত করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleRegisterEvent = async (eventId: string, details: any) => {
    try {
      const matched = db?.events?.find(e => e.id === eventId);
      if (!matched) return null;

      const newReg = {
        id: 'reg_' + Date.now(),
        ...details,
        appliedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      const registrants = [...(matched.registrants || []), newReg];
      const updated = { ...matched, registrants };
      await saveFirestoreDoc('events', eventId, updated);

      await fetchDatabase();
      return newReg;
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleDeleteEvent = async (id: string) => {
    if (!userEmail) return false;
    try {
      const matched = db?.events?.find(e => e.id === id);
      await deleteFirestoreDoc('events', id);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'ইভেন্ট অপসারিত',
        user: userEmail,
        details: `"${matched?.title || id}" ইভেন্ট মুছে ফেলা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleEditEvent = async (id: string, event: any) => {
    if (!userEmail) return false;
    try {
      const matched = db?.events?.find(e => e.id === id);
      const updated = { ...matched, ...event, id };
      await saveFirestoreDoc('events', id, updated);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'ইভেন্ট সম্পাদিত',
        user: userEmail,
        details: `"${updated.title}" ইভেন্টটি আপডেট বা এডিট করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleAddBook = async (book: any) => {
    if (!userEmail) return false;
    try {
      const id = 'book_' + Date.now();
      const item = {
        ...book,
        id,
        downloadCount: 0,
        date: new Date().toISOString().split('T')[0]
      };
      await saveFirestoreDoc('books', id, item);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'প্রকাশনা সংগ্রহশালায় বই সংযুক্ত',
        user: userEmail,
        details: `"${book.title}" পুস্তিকা প্রকাশনা লাইব্রেরিতে সংযোজন করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleDownloadBook = async (bookId: string) => {
    try {
      const matched = db?.books?.find(b => b.id === bookId);
      if (!matched) return false;

      const updated = { ...matched, downloadCount: (matched.downloadCount || 0) + 1 };
      await saveFirestoreDoc('books', bookId, updated);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleDeleteBook = async (id: string) => {
    if (!userEmail) return false;
    try {
      const matched = db?.books?.find(b => b.id === id);
      await deleteFirestoreDoc('books', id);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'প্রকাশনা অপসারিত',
        user: userEmail,
        details: `"${matched?.title || id}" প্রকাশনাটি মুছে ফেলা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleAddCircular = async (circular: any) => {
    if (!userEmail) return false;
    try {
      const id = 'circ_' + Date.now();
      const item = {
        ...circular,
        id,
        date: new Date().toISOString().split('T')[0]
      };
      await saveFirestoreDoc('circulars', id, item);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'সাংগঠনিক সার্কুলার প্রকাশ',
        user: userEmail,
        details: `"${circular.title}" শিরোনামে সাংগঠনিক সার্কুলার জারি করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleDeleteCircular = async (id: string) => {
    if (!userEmail) return false;
    try {
      const matched = db?.circulars?.find(c => c.id === id);
      await deleteFirestoreDoc('circulars', id);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'সার্কুলার অপসারিত',
        user: userEmail,
        details: `"${matched?.title || id}" বিজ্ঞপ্তি বা সার্কুলার মুছে ফেলা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleEditBook = async (id: string, book: any) => {
    if (!userEmail) return false;
    try {
      const matched = db?.books?.find(b => b.id === id);
      const updated = { ...matched, ...book, id };
      await saveFirestoreDoc('books', id, updated);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'প্রকাশনা সম্পাদিত',
        user: userEmail,
        details: `"${updated.title}" বইটি মডিফাই করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleEditCircular = async (id: string, circular: any) => {
    if (!userEmail) return false;
    try {
      const matched = db?.circulars?.find(c => c.id === id);
      const updated = { ...matched, ...circular, id };
      await saveFirestoreDoc('circulars', id, updated);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'সার্কুলার সম্পাদিত',
        user: userEmail,
        details: `"${updated.title}" সার্কুলার সংশোধন করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleAddGallery = async (item: any) => {
    if (!userEmail) return false;
    try {
      const id = 'gallery_' + Date.now();
      const document = {
        ...item,
        id,
        date: new Date().toISOString().split('T')[0]
      };
      await saveFirestoreDoc('gallery', id, document);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'মিডিয়া গ্যালারি সংযুক্তি',
        user: userEmail,
        details: `"${item.title}" অ্যালবাম ছবি বা ইনফোগ্রাফিক গ্যালারিতে সংযোজন করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleDeleteGallery = async (id: string) => {
    if (!userEmail) return false;
    try {
      const matched = db?.gallery?.find(g => g.id === id);
      await deleteFirestoreDoc('gallery', id);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'মিডিয়া গ্যালারি চিত্র অপসারিত',
        user: userEmail,
        details: `"${matched?.title || id}" ফাইলটি গ্যালারি থেকে মুছে ফেলা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleUpdateGallery = async (id: string, updatedItem: any) => {
    if (!userEmail) return false;
    try {
      await saveFirestoreDoc('gallery', id, { ...updatedItem, id });

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'মিডিয়া গ্যালারি আপডেট',
        user: userEmail,
        details: `"${updatedItem.title}" গ্যালারি কন্টেন্টটির তথ্য/ক্যাটাগরি আপডেট করা হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleRegisterMember = async (registration: any) => {
    try {
      const id = 'member_' + Date.now();
      const newReg = {
        ...registration,
        id,
        status: 'pending' as const,
        appliedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      await saveFirestoreDoc('memberships', id, newReg);

      await fetchDatabase();
      return newReg;
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // Google Authentication Redirect Result Handler
  const [authProcessing, setAuthProcessing] = useState(false);

  useEffect(() => {
    if (!db) return; // Wait until database is fetched to allow member lookup
    
    const handleRedirect = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const isNativeAuthFlow = urlParams.get('nativeAuth') === 'true';
        const nativeAuthAction = urlParams.get('action') || 'portal_login';

        if (isNativeAuthFlow) {
          setAuthProcessing(true);
          const result = await getRedirectResult(secondaryAuth);
          if (result && result.user) {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const idToken = credential?.idToken;
            const accessToken = credential?.accessToken;
            if (idToken) {
              // Generate secure exchange code
              const array = new Uint8Array(16);
              window.crypto.getRandomValues(array);
              const exchangeCode = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

              // Save the exchange credentials securely in Firestore
              await saveFirestoreDoc('authExchanges', exchangeCode, {
                idToken,
                accessToken: accessToken || '',
                createdAt: new Date().toISOString(),
                used: false
              });

              // Construct secure deepLinkUrl passing ONLY the exchange code
              const deepLinkUrl = `ssfmym://auth-callback?code=${exchangeCode}&action=${nativeAuthAction}`;
              window.location.href = deepLinkUrl;
              return;
            }
          } else {
            if (secondaryAuth.currentUser) {
              await secondaryAuth.signOut();
            }
            localStorage.setItem('auth_redirect_action', nativeAuthAction);
            await signInWithRedirect(secondaryAuth, secondaryGoogleProvider);
            return;
          }
          return;
        }

        const action = localStorage.getItem('auth_redirect_action');
        if (!action) return;

        setAuthProcessing(true);
        authDiagnostics.update({ redirectReturned: true });
        
        const result = await getRedirectResult(secondaryAuth);
        if (!result || !result.user) {
          authDiagnostics.update({ redirectResult: 'none' });
          setAuthProcessing(false);
          return;
        }

        authDiagnostics.update({ redirectResult: 'success', userRetrieved: result.user.email });

        // Validate user using our secure pipeline
        const valReport = await validateFirebaseUser(result.user);
        if (!valReport.isValid) {
          const errMsg = valReport.reason || 'Authentication validation failed.';
          toast.error(errMsg);
          authDiagnostics.update({ 
            tokenVerified: false, 
            errorMessage: errMsg,
            technicalError: 'Validation failed in validateFirebaseUser.'
          });
          setAuthProcessing(false);
          return;
        }

        authDiagnostics.update({ 
          tokenVerified: true, 
          tokenExpiration: valReport.expirationTime || null 
        });

        const emailVal = valReport.email!.toLowerCase().trim();

        // 1. Check Super Admin
        if (emailVal === 'chitronbhattacharjee@gmail.com') {
          authDiagnostics.update({ dbLookupStatus: 'found', sessionCreated: true });
          await handleLogin(emailVal);
          toast.success('সুপার এডমিন হিসেবে গুগল লগইন সফল হয়েছে!');
          await logMemberLoginDirect(emailVal, 'success', 'সুপার এডমিন (চিত্রণ ভট্টাচার্য) গুগল দিয়ে সরাসরি পোর্টালে প্রবেশ করেছেন।');
          
          if (action === 'portal_login') {
            setCurrentTab('member-portal');
          } else if (action === 'nav_login') {
            setCurrentTab('member-portal');
          }
          
          cleanupRedirectStorage();
          setAuthProcessing(false);
          return;
        }

        // Search in memberships list
        const memberships = db.memberships || [];
        const foundMember = memberships.find(m => m.email?.toLowerCase().trim() === emailVal);

        if (action === 'nav_login' || action === 'portal_login') {
          if (!foundMember) {
            authDiagnostics.update({ dbLookupStatus: 'not_found' });
            
            // Prefill registration form and prompt user
            const msg = 'দুঃখিত, এই গুগল অ্যাকাউন্টের বিপরীতে কোনো সদস্য অ্যাকাউন্ট পাওয়া যায়নি। আপনার তথ্য ফর্মটি পূরণ করে মেম্বারশিপ আবেদন সম্পন্ন করুন।';
            toast.warning(msg);
            
            const autofillData = {
              name: valReport.displayName || '',
              email: emailVal,
              uid: valReport.uid || '',
              photoURL: valReport.photoURL || ''
            };
            localStorage.setItem('scf_member_form_autofill_data', JSON.stringify(autofillData));
            
            setCurrentTab('join'); // Redirect to registration page
            
            cleanupRedirectStorage();
            setAuthProcessing(false);
            return;
          }

          authDiagnostics.update({ dbLookupStatus: 'found' });

          if (foundMember.status === 'pending') {
            const msg = 'আপনার মেম্বারশিপ আবেদনটি বর্তমানে মূল্যায়নাধীন (Pending) রয়েছে। জেলা দপ্তর সেল অনুমোদন করার পর সরাসরি ড্যাশবোর্ড সক্রিয় হবে।';
            toast.warning(msg);
            await logMemberLoginDirect(emailVal, 'failed', 'আবেদন পেন্ডিং থাকা অবস্থায় গুগল লগইন চেষ্টা।');
            cleanupRedirectStorage();
            setAuthProcessing(false);
            return;
          }

          if (foundMember.status === 'rejected') {
            const msg = 'দুঃখিত, আপনার মেম্বারশিপ আবেদনটি জেলা সেল দ্বারা প্রত্যাখ্যাত হয়েছে।';
            toast.error(msg);
            await logMemberLoginDirect(emailVal, 'failed', 'প্রত্যাখ্যাত আবেদন থাকা অবস্থায় গুগল লগইন চেষ্টা।');
            cleanupRedirectStorage();
            setAuthProcessing(false);
            return;
          }

          if (foundMember.status === 'verified') {
            authDiagnostics.update({ sessionCreated: true });
            // Save metadata
            const updatedDoc = {
              ...foundMember,
              googleUid: valReport.uid,
              googleEmail: valReport.email,
              googlePhoto: valReport.photoURL || '',
              lastGoogleLogin: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
            await saveFirestoreDoc('memberships', foundMember.id, updatedDoc);

            await handleLogin(foundMember.email);
            setCurrentTab('member-portal');
            toast.success(`স্বাগতম কমরেড ${foundMember.name}! গুগল সাইন-ইন সফল হয়েছে।`);
            await logMemberLoginDirect(foundMember.email, 'success', `সদস্য "${foundMember.name}" গুগল সাইন-ইন দিয়ে সফলভাবে লগইন করেছেন।`);
          }
        }

        else if (action === 'nav_register_verify') {
          const savedRegInputs = localStorage.getItem('scf_pending_nav_reg_inputs');
          if (savedRegInputs) {
            try {
              const parsed = JSON.parse(savedRegInputs);
              if (parsed) {
                const enteredEmailLower = parsed.email.toLowerCase().trim();
                if (emailVal !== enteredEmailLower) {
                  const errorMsg = `The selected Google account does not match the email address entered during registration. (নির্বাচনকৃত গুগল অ্যাকাউন্ট "${emailVal}" আপনার ফর্মে দেওয়া ইমেইল "${enteredEmailLower}" এর সাথে হুবহু মেলেনি।)`;
                  toast.error(errorMsg);
                  authDiagnostics.update({ 
                    errorMessage: errorMsg,
                    technicalError: 'Google account and form email mismatch.'
                  });
                  setAuthProcessing(false);
                  return;
                }

                // If matches, complete registration!
                const added = await handleRegisterMember({
                  name: parsed.name.trim(),
                  mobile: parsed.mobile.trim(),
                  email: parsed.email.trim().toLowerCase(),
                  password: parsed.password.trim(),
                  institution: parsed.institution.trim(),
                  department: '',
                  academicYear: '',
                  address: 'অনলাইন সাইনআপ ফর্ম',
                  dob: parsed.dob,
                  bloodGroup: parsed.bloodGroup,
                  type: parsed.type,
                  emailVerified: true,
                  verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  verifiedMethod: 'Google OAuth',
                  googleUid: valReport.uid,
                  googleEmail: valReport.email,
                  googlePhoto: valReport.photoURL || ''
                });

                if (added) {
                  const successMsg = `বিপ্লবী শুভেচ্ছা কমরেড ${parsed.name.trim()}! নতুন অ্যাকাউন্ট ও সদস্যপদের আবেদনটি সফলভাবে নিবন্ধিত হয়েছে। জেলা দপ্তর সেল আবেদনটি ভেরিফাই ও অনুমোদন করার পর আপনি সরাসরি এই ইমেইল দিয়ে ডাটাবেজ পোর্টালে লগইন করতে পারবেন।`;
                  localStorage.setItem('scf_nav_reg_success_msg', successMsg);
                  localStorage.setItem('scf_show_login_modal_on_load', 'true');
                  window.location.reload(); // Reload to show success on mount cleanly
                } else {
                  toast.error('দুঃখিত, আবেদনপত্রটি ডাটাবেজে সাবমিট করা যায়নি। দয়া করে পুনরায় চেষ্টা করুন।');
                }
              }
            } catch (e) {
              console.error(e);
            }
          }
        }

        else if (action === 'member_form_autofill') {
          const autofillData = {
            name: valReport.displayName || '',
            email: emailVal,
            uid: valReport.uid || '',
            photoURL: valReport.photoURL || '',
            password: Math.random().toString(36).substring(2, 10)
          };
          localStorage.setItem('scf_member_form_autofill_data', JSON.stringify(autofillData));
          setCurrentTab('join');
          toast.success('গুগল অ্যাকাউন্ট থেকে আপনার নাম ও ইমেইল সফলভাবে অটো-ফিল করা হয়েছে! অনুগ্রহ করে বাকি প্রয়োজনীয় তথ্যসমূহ দিন।');
        }

        else if (action === 'member_form_verify') {
          const savedInputs = localStorage.getItem('scf_pending_form_reg_inputs');
          if (savedInputs) {
            try {
              const parsed = JSON.parse(savedInputs);
              if (parsed) {
                const enteredEmailLower = parsed.email.toLowerCase().trim();
                if (emailVal !== enteredEmailLower) {
                  const errorMsg = `The selected Google account does not match the email address entered during registration. (নির্বাচনকৃত গুগল অ্যাকাউন্ট "${emailVal}" আপনার ফর্মে দেওয়া ইমেইল "${enteredEmailLower}" এর সাথে হুবহু মেলেনি।)`;
                  localStorage.setItem('scf_pending_form_verification_error', errorMsg);
                  window.location.reload();
                  return;
                }

                // If matches, complete registration!
                const added = await handleRegisterMember({
                  name: parsed.name.trim(),
                  mobile: parsed.mobile.trim(),
                  email: parsed.email.trim(),
                  password: parsed.password.trim(),
                  institution: parsed.institution.trim(),
                  department: parsed.department.trim(),
                  academicYear: parsed.academicYear.trim(),
                  address: parsed.address.trim(),
                  dob: parsed.dob,
                  bloodGroup: parsed.bloodGroup.trim(),
                  type: parsed.type,
                  emailVerified: true,
                  verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  verifiedMethod: 'Google OAuth',
                  googleUid: valReport.uid,
                  googleEmail: valReport.email,
                  googlePhoto: valReport.photoURL || ''
                });

                if (added) {
                  localStorage.setItem('scf_form_reg_success', 'true');
                  window.location.reload();
                } else {
                  toast.error('দুঃখিত, আবেদনপত্রটি ডাটাবেজে সাবমিট করা যায়নি।');
                }
              }
            } catch (e) {
              console.error(e);
            }
          }
        }

        cleanupRedirectStorage();
      } catch (error: any) {
        console.error('Redirect Processing Error:', error);
        const errDec = decomposeAuthError(error);
        toast.error(errDec.message);
        
        authDiagnostics.update({
          redirectResult: 'error',
          errorMessage: errDec.message,
          technicalError: errDec.technicalReason,
          suggestedFix: errDec.suggestedFix
        });
      } finally {
        setAuthProcessing(false);
      }
    };

    handleRedirect();
  }, [db]);

  const cleanupRedirectStorage = () => {
    localStorage.removeItem('auth_redirect_action');
    localStorage.removeItem('scf_pending_nav_reg_inputs');
    localStorage.removeItem('scf_pending_nav_verification');
    localStorage.removeItem('scf_pending_form_reg_inputs');
    
    // Restore scroll position if saved
    const scrollPos = localStorage.getItem('scf_auth_scroll_pos');
    if (scrollPos) {
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(scrollPos, 10),
          behavior: 'smooth'
        });
        localStorage.removeItem('scf_auth_scroll_pos');
      }, 300);
    }
  };

  const handleVerifyMember = async (id: string, status: 'verified' | 'rejected') => {
    if (!userEmail) return false;
    try {
      const matched = db?.memberships?.find(m => m.id === id);
      if (matched) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const logEntry = {
          timestamp,
          editedBy: userEmail,
          field: 'সদস্যপদ অবস্থা / Membership Approval Status',
          oldValue: matched.status || 'pending',
          newValue: status === 'verified' ? 'অনুমোদিত ও সক্রিয় (Verified)' : 'প্রত্যাখ্যাত ও নিষ্ক্রিয় (Rejected)'
        };
        const updated = {
          ...matched,
          status,
          verifiedAt: timestamp,
          editHistory: [...(matched.editHistory || []), logEntry]
        };
        await saveFirestoreDoc('memberships', id, updated);

        // Log member application verify
        const logId = 'log_' + Date.now();
        const logData = {
          id: logId,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: 'সদস্য আবেদন যাচাই',
          user: userEmail,
          details: `${matched.name} কমরেডের মেম্বারশিপ আবেদন ${status === 'verified' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} করা হয়েছে।`
        };
        await saveFirestoreDoc('logs', logId, logData);

        await fetchDatabase();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleDeleteMember = async (id: string) => {
    if (!userEmail) return false;
    try {
      const matched = db?.memberships?.find(m => m.id === id);
      await deleteFirestoreDoc('memberships', id);

      // Log
      const logId = 'log_' + Date.now();
      const logData = {
        id: logId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        action: 'সদস্য পদ বাতিল/অপসারণ',
        user: userEmail,
        details: `${matched?.name || id} কমরেডের তথ্য ডাটাবেজ থেকে মুছে দেওয়া হয়েছে।`
      };
      await saveFirestoreDoc('logs', logId, logData);

      await fetchDatabase();
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleUpdateMember = async (updated: MemberRegistration) => {
    try {
      await saveFirestoreDoc('memberships', updated.id, updated);
      await fetchDatabase();
      return true;
    } catch (e) {
      console.error("Error updating member profile in App.tsx:", e);
    }
    return false;
  };

  // Render Section Selector based on currentTab index state and db settings toggling configurations
  const renderTabContent = () => {
    if (!db) return null;
    const settings = db.settings;
    const isVerifiedMember = !!db.memberships?.some(
      m => m.email?.toLowerCase() === userEmail?.toLowerCase() && m.status === 'verified'
    );

    if (activeDetails) {
      return (
        <ContentDetails
          item={activeDetails}
          db={db}
          onClose={() => setActiveDetails(null)}
          onRefresh={() => fetchDatabase(true)}
          userEmail={userEmail}
          onSelectItem={(type, id) => setActiveDetails({ type, id })}
          isVerifiedMember={isVerifiedMember}
        />
      );
    }

    switch (currentTab) {
      case 'home':
        return (
          <Hero
            news={getFilteredNews()}
            blogs={getFilteredBlogs()}
            circulars={db.circulars}
            events={getFilteredEvents()}
            setCurrentTab={setCurrentTab}
            aboutText={settings.aboutText}
            slogans={settings.slogans}
            onSelectItem={(type, id) => setActiveDetails({ type, id })}
          />
        );
      case 'about':
        return <AboutUs settings={settings} organizations={db.organizations || []} />;
      case 'leadership':
        return <LeadershipSection settings={settings} onViewMemberProfile={handleViewMemberProfile} />;
      case 'news':
        return (
          <NewsBlogSection
            news={db.news}
            blogs={db.blogs}
            onAddComment={handleAddComment}
            userEmail={userEmail}
            onRefresh={() => fetchDatabase(true)}
            globalSearchQuery={globalSearchQuery}
            setGlobalSearchQuery={setGlobalSearchQuery}
            onSelectItem={(type, id) => setActiveDetails({ type, id })}
          />
        );
      case 'events':
        return settings.showEvents ? (
          <EventsSection 
            events={getFilteredEvents()} 
            onRegisterEvent={handleRegisterEvent} 
            onSelectItem={(type, id) => setActiveDetails({ type, id })}
          />
        ) : (
          <div className="py-16 text-center text-zinc-500 text-xs sm:text-sm">এই সেকশনটি এডমিন কর্তৃক হাইড করা আছে।</div>
        );
      case 'books':
        return settings.showPublications ? (
          <PublicationsSection 
            books={db.books} 
            onDownloadBook={handleDownloadBook} 
            isVerifiedMember={isVerifiedMember}
            onSelectItem={(type, id) => setActiveDetails({ type, id })}
          />
        ) : (
          <div className="py-16 text-center text-zinc-500 text-xs sm:text-sm">প্রকাশনা সেকশনটি সাময়িকভাবে নিষ্ক্রিয় করা আছে।</div>
        );
      case 'circulars':
        return settings.showCirculars ? (
          <CircularsSection 
            circulars={db.circulars} 
            isVerifiedMember={isVerifiedMember}
            onSelectItem={(type, id) => setActiveDetails({ type, id })}
          />
        ) : (
          <div className="py-16 text-center text-zinc-500 text-xs sm:text-sm">সার্কুলার বোর্ড সাময়িকভাবে নিষ্ক্রিয় করা আছে।</div>
        );
      case 'membership':
        return settings.showMembership ? (
          <MembershipForm 
            onRegisterMember={handleRegisterMember} 
            membersList={db.memberships} 
            setCurrentTab={setCurrentTab}
          />
        ) : (
          <div className="py-16 text-center text-zinc-500 text-xs sm:text-sm">সদস্য ভর্তি ফর্ম লক করা আছে। জেলা দপ্তরে যোগাযোগ করুন।</div>
        );
      case 'media':
        return settings.showGallery ? (
          <MediaCenter 
            gallery={db.gallery} 
            onSelectItem={(type, id) => setActiveDetails({ type, id })}
          />
        ) : (
          <div className="py-16 text-center text-zinc-500 text-xs sm:text-sm">মিডিয়া সেন্টার সাময়িকভাবে নিষ্ক্রিয় করা আছে।</div>
        );
      case 'contact':
        return <ContactSection />;
      case 'member-portal':
        {
          const loggedInMember = db.memberships.find(
            m => m.email?.toLowerCase() === userEmail?.toLowerCase() && m.status === 'verified'
          );
          return loggedInMember ? (
            <MemberPortal
              member={loggedInMember}
              onLogout={handleLogout}
              onRefresh={() => fetchDatabase(true)}
              onUpdateMember={handleUpdateMember}
              circulars={db.circulars}
              books={db.books}
              settings={db.settings}
              blogs={db.blogs || []}
              onAddBlog={handleAddBlog}
              setCurrentTab={setCurrentTab}
            />
          ) : (
            <PortalAuth
              memberships={db.memberships}
              onLogin={handleLogin}
            />
          );
        }
      case 'admin':
        return (
          <AdminDashboard
            db={db}
            userEmail={userEmail}
            onResetDB={handleResetDB}
            onSaveSettings={handleSaveSettings}
            onSaveOrganizations={handleSaveOrganizations}
            onAddNews={handleAddNews}
            onEditNews={handleEditNews}
            onDeleteNews={handleDeleteNews}
            onAddBlog={handleAddBlog}
            onUpdateBlog={handleUpdateBlog}
            onDeleteBlog={handleDeleteBlog}
            onApproveComment={handleApproveComment}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onAddBook={handleAddBook}
            onEditBook={handleEditBook}
            onDeleteBook={handleDeleteBook}
            onAddCircular={handleAddCircular}
            onEditCircular={handleEditCircular}
            onDeleteCircular={handleDeleteCircular}
            onAddGallery={handleAddGallery}
            onUpdateGallery={handleUpdateGallery}
            onDeleteGallery={handleDeleteGallery}
            onVerifyMember={handleVerifyMember}
            onDeleteMember={handleDeleteMember}
            onAddInvitation={handleAddInvitation}
            onInviteAction={handleInviteAction}
            onDeleteInvitation={handleDeleteInvitation}
            onUpdateMember={handleUpdateMember}
          />
        );
      default:
        return (
          <Hero
            news={getFilteredNews()}
            blogs={getFilteredBlogs()}
            circulars={db.circulars}
            events={getFilteredEvents()}
            setCurrentTab={setCurrentTab}
            aboutText={settings.aboutText}
          />
        );
    }
  };

  if (isNativeAuth) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl p-8 border border-rose-500/20">
          <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-600/30">
            <Smartphone className="w-8 h-8 text-white animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold font-sans text-rose-500 mb-2">গুগল সাইন-ইন হচ্ছে</h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            সমাজতান্ত্রিক ছাত্র ফ্রন্ট এপ্লিকেশনে নিরাপদে সাইন-ইন করতে ব্রাউজার উইন্ডোটি ব্যবহার করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন...
          </p>
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 text-rose-500 animate-spin" />
            <span className="text-slate-400 text-xs font-mono">Redirecting to Google OAuth...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-300">
      
      {/* Navigation section */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        userEmail={userEmail}
        onLogin={handleLogin}
        onLogout={handleLogout}
        visibleSettings={db ? db.settings : { showEvents: true, showPublications: true, showCirculars: true, showMembership: true, showGallery: true }}
        globalSearchQuery={globalSearchQuery}
        setGlobalSearchQuery={setGlobalSearchQuery}
        memberships={db ? db.memberships : []}
        invitations={db ? db.invitations : []}
        onInviteAction={handleInviteAction}
        onRegisterMember={handleRegisterMember}
        showDebugConsole={showDebugConsole}
        setShowDebugConsole={setShowDebugConsole}
      />

      {/* Breaking news alerts ticker matching dynamic options */}
      {db && db.settings.showBreakingNews && (
        <BreakingNews
          news={db.news}
          circulars={db.circulars}
          setCurrentTab={setCurrentTab}
        />
      )}

      {/* Main Content frame */}
      <main className="flex-grow">
        {authProcessing ? (
          <div className="flex flex-col items-center justify-center py-32 text-sm text-zinc-500 font-sans space-y-4">
            <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">গুগল অথেনটিকেশন যাচাই করা হচ্ছে</h3>
            <p className="text-xs text-zinc-500 max-w-md text-center leading-relaxed">
              আপনার গুগল সাইন-ইন ডাটা যাচাই করা হচ্ছে এবং ডাটাবেজ সেশন সক্রিয় করা হচ্ছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন...
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-sm text-zinc-500 font-sans space-y-3">
            <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
            <p>সমাজতান্ত্রিক ছাত্র ফ্রন্ট অনলাইন ডাটাবেজ সংযোগ স্থাপিত হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন...</p>
          </div>
        ) : errorMsg ? (
          <div className="max-w-xl mx-auto my-20 p-8 border border-red-200 bg-red-50 text-red-700 text-center rounded space-y-4 font-sans">
            <p className="font-bold">ডাটাবেজ সংযোগ ত্রুটি!</p>
            <p className="text-xs">{errorMsg}</p>
            <button
              onClick={fetchDatabase}
              className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded text-xs transition"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        ) : (
          renderTabContent()
        )}
      </main>

      {/* Main Footer and credits labels without unrequested stats larp clutter */}
      <footer className="border-t border-rose-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-xs font-sans text-zinc-500 dark:text-zinc-400 py-10 mt-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="mb-3 max-w-[220px]">
              <img
                src="https://i.ibb.co/R4BCPZ0B/20250130-143124.png"
                alt="সমাজতান্ত্রিক ছাত্র ফ্রন্ট"
                referrerPolicy="no-referrer"
                className="h-10 object-contain dark:brightness-110"
              />
            </div>
            <p className="leading-relaxed">
              সমাজ পরিবর্তন ও সমাজতান্ত্রিক বিপ্লব ত্বরান্বিত করতে ছাত্র সমাজকে বিজ্ঞানমনস্ক আদর্শিক চরিত্রে সংহত করার লক্ষ্যে প্রগতিশীল ছাত্র সংগঠন।
            </p>
          </div>
          <div>
            <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm mb-3">দ্রুত লিঙ্ক</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button onClick={() => setCurrentTab('about')} className="hover:text-rose-600 text-left">ইতিহাস ও নীতি</button>
              <button onClick={() => setCurrentTab('news')} className="hover:text-rose-600 text-left">নিবন্ধ ও খবর</button>
              <button onClick={() => { if(db?.settings.showEvents) setCurrentTab('events'); }} className="hover:text-rose-600 text-left">কর্মসূচী সূচি</button>
              <button onClick={() => { if(db?.settings.showPublications) setCurrentTab('books'); }} className="hover:text-rose-600 text-left">প্রকাশনা সেল</button>
              <button onClick={() => setCurrentTab('leadership')} className="hover:text-rose-600 text-left">নেতৃবৃন্দ তালিকা</button>
              <button onClick={() => setCurrentTab('contact')} className="hover:text-rose-600 text-left">যোগাযোগ অফিস</button>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm mb-3">যোগাযোগ দপ্তর কার্যালয়</h4>
            <p className="leading-relaxed font-sans text-xs">
              স্টেশন মালগুদাম রোড, গাঙ্গিনারপাড় (জেলা ছাত্র ফ্রন্ট কার্যালয়), ময়মনসিংহ সদর, ময়মনসিংহ।<br />
              মোবাইল: <a href="tel:01718564048" className="hover:underline hover:text-rose-600 dark:hover:text-rose-450 transition font-mono font-bold">০১৭১৮-৫৬৪০৪৮</a> / <a href="tel:01316655254" className="hover:underline hover:text-rose-600 dark:hover:text-rose-450 transition font-mono font-bold">০১৩১৬-৬৫৫২৫৪</a> <br />
              ইমেইল: <a href="mailto:ssfmym@gmail.com" className="hover:underline hover:text-rose-600 dark:hover:text-rose-450 transition font-bold">ssfmym@gmail.com</a>
            </p>
          </div>
        </div>

        {/* বাসদের নির্বাচনী প্রতীক মই এবং নিবন্ধন নাম্বার */}
        <div id="electoral-info" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pt-6 border-t border-rose-100/40 dark:border-zinc-900">
          <div className="bg-red-50/25 dark:bg-zinc-950/40 p-4 rounded-md border border-rose-100/40 dark:border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto select-none">
            <div className="flex items-center gap-3">
              <img 
                src="https://spb.org.bd/wp-content/uploads/2024/11/moi-1.webp" 
                alt="বাসদের নির্বাচনী প্রতীক মই" 
                referrerPolicy="no-referrer"
                className="h-16 w-auto object-contain dark:brightness-110" 
              />
              <div className="text-left">
                <h5 className="text-xs font-bold text-rose-700 dark:text-rose-400 font-sans">
                  বাংলাদেশের সমাজতান্ত্রিক দল - বাসদ
                </h5>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  নির্বাচনী প্রতীক: মই
                </p>
              </div>
            </div>
            <div className="text-xs font-bold bg-rose-600 text-white px-3 py-1.5 rounded shadow-sm font-sans whitespace-nowrap">
              নির্বাচনী নিবন্ধন নাম্বার: ০০১৭
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-rose-50 dark:border-zinc-900 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-center gap-4">
          <p>© ২০২৬ সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="font-mono text-[10px] text-zinc-400">
            দুনিয়ার মজদুর, এক হও লড়াই করো
          </div>
        </div>
      </footer>

      {/* Custom Offline Banner UI */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            id="offline-ui-alert"
            className="fixed bottom-6 right-6 z-[100] max-w-sm bg-white dark:bg-zinc-900 border border-rose-250 dark:border-rose-900/50 rounded-lg p-5 shadow-2xl flex items-start space-x-3.5"
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0L4.929 4.93m0 0L3 3m7.071 5a1 1 0 112 0 1 1 0 01-2 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white font-sans">
                আপনি অফলাইনে আছেন!
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                আপনার ইন্টারনেট কানেকশন বিচ্ছিন্ন রয়েছে। ময়মনসিংহের ছাত্র ফ্রন্টের প্রকাশনা ও খবরসমূহ এখন ক্যাশ মেমোরি থেকে পঠিত হচ্ছে। পুনরায় সংযোগ হলে স্বয়ংক্রিয়ভাবে লাইভ ডাটা লোড হবে।
              </p>
              <div className="mt-2.5 flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
                <span className="text-[9px] font-mono font-bold text-amber-500 tracking-wider">OFFLINE MODE ACTIVE</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification modal layer */}
      <AnimatePresence>
        {verifyMemberId && db && (
          <CardVerificationModal
            verifyMemberId={verifyMemberId}
            userEmail={userEmail}
            onLogin={handleLogin}
            db={db}
            onClose={handleCloseVerification}
          />
        )}
      </AnimatePresence>

      {/* Unsupported Browser Alert Modal */}
      <UnsupportedBrowserModal
        isOpen={unsupportedModalOpen}
        onClose={() => setUnsupportedModalOpen(false)}
        profile={detectedBrowserProfile}
      />

      {/* Developer Debug Console */}
      <DebugConsole isOpen={showDebugConsole} setIsOpen={setShowDebugConsole} />

      {/* Reusable Live Export Debug Window */}
      <LiveExportDebugger />

    </div>
  );
}
