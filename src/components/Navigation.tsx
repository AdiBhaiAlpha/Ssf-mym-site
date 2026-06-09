import React, { useState } from 'react';
import { Menu, X, Sun, Moon, LogIn, LogOut, ShieldAlert, Award, FileText, Newspaper, BookOpen, Calendar, HelpCircle, Mail, HelpCircle as HelpIcon, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  userEmail: string | null;
  onLogin: (email: string) => void;
  onLogout: () => void;
  visibleSettings: { [key: string]: boolean };
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  memberships: any[];
}

export default function Navigation({
  currentTab,
  setCurrentTab,
  darkMode,
  setDarkMode,
  userEmail,
  onLogin,
  onLogout,
  visibleSettings,
  globalSearchQuery,
  setGlobalSearchQuery,
  memberships = [],
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Password Recovery States
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const isSuperAdmin = userEmail?.toLowerCase() === 'chitronbhattacharjee@gmail.com';
  const isApprovedMember = memberships.some(m => m.email?.toLowerCase() === userEmail?.toLowerCase() && m.status === 'verified');

  const menuItems = [
    { id: 'home', label: 'প্রচ্ছদ', icon: Newspaper, visible: true },
    { id: 'about', label: 'পরিচিতি', icon: HelpCircle, visible: true },
    { id: 'leadership', label: 'নেতৃত্ব', icon: Award, visible: true },
    { id: 'news', label: 'খবর ও ব্লগ', icon: Newspaper, visible: true },
    { id: 'events', label: 'ইভেন্ট ও কর্মসূচী', icon: Calendar, visible: visibleSettings.showEvents },
    { id: 'books', label: 'লাইব্রেরি ও প্রকাশনা', icon: BookOpen, visible: visibleSettings.showPublications },
    { id: 'circulars', label: 'সার্কুলার ও নোটিশ', icon: FileText, visible: visibleSettings.showCirculars },
    { id: 'membership', label: 'সদস্যপদ', icon: Award, visible: visibleSettings.showMembership && !userEmail },
    { id: 'member-portal', label: 'মেম্বার অ্যাকাউন্ট', icon: ShieldAlert, visible: isApprovedMember },
    { id: 'media', label: 'মিডিয়া সেন্টার', icon: FileText, visible: visibleSettings.showGallery },
    { id: 'contact', label: 'যোগাযোগ', icon: Mail, visible: true },
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    setLoginError('');

    if (!email) return;

    if (email === 'chitronbhattacharjee@gmail.com') {
      onLogin(email);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      // Record super admin login in logs
      fetch('/api/member-logins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, status: 'success', details: 'সুপার এডমিন (চিত্রণ ভট্টাচার্য) হিসেবে মূল ডাটাবেজে প্রবেশ করেছেন।' })
      }).catch(err => console.error(err));
      return;
    }

    const foundMember = memberships.find(m => m.email?.toLowerCase() === email);
    if (!foundMember) {
      setLoginError('প্রদত্ত ইমেইলের বিপরীতে কোনো আবেদন বা সদস্যপদ পাওয়া যায়নি।');
      // Record failed login
      fetch('/api/member-logins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, status: 'failed', details: 'অনিবন্ধিত ইমেইল দিয়ে লগইন চেষ্টা।' })
      }).catch(err => console.error(err));
      return;
    }

    if (foundMember.status === 'pending') {
      setLoginError('আপনার সদস্যপদ আবেদনটি বর্তমানে মূল্যায়নাধীন (Pending) রয়েছে। জেলা দপ্তর অনুমোদনকারী প্যানেল ভেরিফাই করলে লগইন সম্ভব।');
      // Record pending attempt
      fetch('/api/member-logins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: foundMember.email, status: 'failed', details: 'আবেদনকারী লগইন চেষ্টা করেছেন কিন্তু তাঁর পাসওয়ার্ড/মেইল এখনো অনুমোদিত (Pending) নয়।' })
      }).catch(err => console.error(err));
      return;
    }

    if (foundMember.status === 'rejected') {
      setLoginError('দুঃখিত, আপনার মেম্বারশিপ আবেদনটি জেলা সেল দ্বারা প্রত্যাখ্যাত হয়েছে।');
      // Record rejected attempt
      fetch('/api/member-logins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: foundMember.email, status: 'failed', details: 'প্রত্যাখ্যাত আবেদন দিয়ে লগইন চেষ্টা করা হয়েছে।' })
      }).catch(err => console.error(err));
      return;
    }

    if (foundMember.status === 'verified') {
      onLogin(foundMember.email);
      setCurrentTab('member-portal');
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      // Record successful login
      fetch('/api/member-logins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: foundMember.email, status: 'success', details: `সদস্য "${foundMember.name}" পোর্টাল অ্যাকাউন্টে সফলভাবে লগইন করেছেন।` })
      }).catch(err => console.error(err));
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = forgotEmail.trim().toLowerCase();
    if (!email) return;

    setLoginError('');
    setRecoverySuccess('');
    setRecoveryLoading(true);

    try {
      const response = await fetch('/api/member-logins/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        setRecoverySuccess(data.message);
        setForgotEmail('');
      } else {
        setLoginError(data.message || 'পাসওয়ার্ড পুনরুদ্ধারে ব্যর্থতা। অনুগ্রহ করে সঠিক তথ্য দিন।');
      }
    } catch (err) {
      console.error(err);
      setLoginError('সার্ভারে যোগাযোগ করা যায়নি। ইন্টারনেট সংযোগ পুনরায় পরীক্ষা করুন।');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleQuickAdminLogin = () => {
    onLogin('chitronbhattacharjee@gmail.com');
    setShowLoginModal(false);
    setLoginError('');
    fetch('/api/member-logins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'chitronbhattacharjee@gmail.com', status: 'success', details: 'কুইক লগইন বাটন দ্বারা সুপার এডমিন অ্যাক্সেস নেওয়া হয়েছে।' })
    }).catch(err => console.error(err));
  };

  return (
    <>
      {/* Top Slogan & Motto Banner */}
      <div className="bg-rose-700 text-white text-[11px] sm:text-xs py-2 px-4 shadow-xs border-b border-rose-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1.5">
          <div className="font-semibold tracking-wide flex items-center justify-center gap-2">
            <span>"দুনিয়ার মজদুর, এক হও লড়াই করো"</span>
          </div>
          <div className="flex items-center gap-2.5 font-bold tracking-wider text-rose-100">
            <span>ঐক্য ★ সংগ্রাম ★ প্রগতি</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-rose-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo / Title Area */}
            <div className="flex items-center">
              <div 
                className="flex items-center space-x-3 cursor-pointer" 
                onClick={() => setCurrentTab('home')}
                id="brand-logo"
              >
                <img 
                  src="https://i.ibb.co.com/F4MKM3R2/20260527-055637.png" 
                  alt="সমাজতান্ত্রিক ছাত্র ফ্রন্ট লোগো" 
                  referrerPolicy="no-referrer" 
                  className="h-12 w-12 object-contain select-none" 
                />
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-500 tracking-tight leading-4 font-sans">
                    সমাজতান্ত্রিক ছাত্র ফ্রন্ট
                  </h1>
                  <p className="text-[10px] text-zinc-650 dark:text-zinc-400 font-mono tracking-widest mt-0.5">
                    ময়মনসিংহ জেলা শাখা
                  </p>
                </div>
              </div>

              {/* SPB Party Affiliation Block (Desktop Only) */}
              <div className="hidden md:flex items-center border-l border-zinc-200 dark:border-zinc-800 pl-4 ml-4 py-1 select-none">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Flag_of_Socialist_Party_of_Bangladesh.svg/500px-Flag_of_Socialist_Party_of_Bangladesh.svg.png" 
                  alt="বাসদ পতাকা" 
                  referrerPolicy="no-referrer" 
                  className="h-7 w-11 object-cover rounded shadow-xs border border-rose-950/10 mr-3" 
                />
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans leading-none">
                    মূল দলঃ
                  </span>
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 font-sans mt-0.5 whitespace-nowrap">
                    বাংলাদেশের সমাজতান্ত্রিক দল - বাসদ
                  </span>
                  <a 
                    href="https://spb.org.bd/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 underline font-sans font-medium transition duration-150 mt-0.5"
                  >
                    https://spb.org.bd/
                  </a>
                </div>
              </div>
            </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {menuItems
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => setCurrentTab(item.id)}
                    className={`relative px-3 py-2 text-sm font-semibold transition-all duration-200 outline-none rounded-md flex items-center space-x-1.5 ${
                      isActive
                        ? 'text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-950/30'
                        : 'text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

            {isSuperAdmin && (
              <button
                id="nav-link-admin"
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  currentTab === 'admin'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-600/10 text-rose-600 hover:bg-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400'
                }`}
              >
                <ShieldAlert className="w-4 h-4 animate-pulse" />
                <span>ড্যাশবোর্ড</span>
              </button>
            )}
          </nav>

          {/* Actions - Style Toggle / Login */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Global Search bar */}
            <div className="relative mr-2 w-48 xl:w-56 focus-within:w-60 transition-all duration-300">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                <Search className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              </span>
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="নিবন্ধ, ইভেন্ট বা খবর খুঁজুন..."
                className="w-full pl-8 pr-3 py-1.5 text-[11px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-zinc-900 dark:text-white"
              />
            </div>

            <a
              href="https://tally.so/r/44Jz8O"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-md shadow-sm transition-all mr-2 whitespace-nowrap"
            >
              <Award className="h-4 w-4" />
              <span>সদস্য হোন</span>
            </a>

            <button
              id="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-all duration-200"
              title="থিম পরিবর্তন"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {userEmail ? (
              <div className="flex items-center space-x-3 ml-2 border-l pl-3 border-zinc-200 dark:border-zinc-800">
                <div className="text-right">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
                    {isSuperAdmin ? 'সুপার এডমিন' : userEmail.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">অনলাইন</p>
                </div>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="p-2 border border-rose-200 dark:border-rose-950/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full text-rose-600"
                  title="লগ আউট"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login-open"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 dark:bg-zinc-100 dark:border-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-sm font-semibold rounded-md shadow-sm transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                <span>লগইন</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-zinc-900 rounded-md"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden border-b border-rose-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-2 pb-6 space-y-1 shadow-lg max-h-[calc(100vh-5rem)] overflow-y-auto"
        >
          {/* Mobile Search input */}
          <div className="relative mb-3 px-2">
            <span className="absolute inset-y-0 left-2 flex items-center pl-2.5 pointer-events-none">
              <Search className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
            </span>
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="সংবাদ, ইভেন্ট বা কলাম খুঁজুন..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-zinc-900 dark:text-white"
            />
          </div>

          {/* Quick Mobile Membership CTA */}
          <div className="px-2 pb-3">
            <a
              href="https://tally.so/r/44Jz8O"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-md shadow-md text-center"
            >
              <Award className="h-4 w-4" />
              <span>সদস্য হোন (Tally Form)</span>
            </a>
          </div>

          {menuItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 text-sm font-semibold rounded-md transition-all ${
                    currentTab === item.id
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

          {isSuperAdmin && (
            <button
              onClick={() => {
                setCurrentTab('admin');
                setIsOpen(false);
              }}
              className={`flex items-center space-x-3 w-full px-4 py-3 text-sm font-semibold rounded-md truncate ${
                currentTab === 'admin'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-600/10 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>এডমিন ড্যাশবোর্ড</span>
            </button>
          )}

          <div className="pt-4 border-t border-rose-50 dark:border-zinc-900 mt-2">
            {userEmail ? (
              <div className="flex items-center justify-between px-4">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white capitalize">
                    {isSuperAdmin ? 'সুপার এডমিন' : userEmail.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{userEmail}</p>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md border border-rose-200 dark:border-rose-950"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>লগআউট</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowLoginModal(true);
                }}
                className="flex items-center justify-center space-x-2 w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-sm font-semibold rounded-md shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>লগইন করুন</span>
              </button>
            )}
          </div>

          {/* SPB Party Affiliation Block (Mobile view) */}
          <div className="mt-6 border-t border-rose-50 dark:border-zinc-900 pt-4 px-2 select-none">
            <div className="flex items-center space-x-3 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-md border border-zinc-100 dark:border-zinc-850">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Flag_of_Socialist_Party_of_Bangladesh.svg/500px-Flag_of_Socialist_Party_of_Bangladesh.svg.png" 
                alt="বাসদ পতাকা" 
                referrerPolicy="no-referrer" 
                className="h-8 w-12 object-cover rounded shadow-xs" 
              />
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans leading-none">
                  মূল দলঃ
                </span>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 font-sans mt-0.5">
                  বাংলাদেশের সমাজতান্ত্রিক দল - বাসদ
                </span>
                <a 
                  href="https://spb.org.bd/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 underline font-sans font-medium mt-1 inline-block"
                >
                  https://spb.org.bd/
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div id="login-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-zinc-950/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {forgotPasswordMode ? 'পাসওয়ার্ড উদ্ধার করুন' : 'সংগঠন ডাটাবেজ লগইন'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {forgotPasswordMode 
                  ? 'নিবন্ধিত ভেরিফাইড সদস্যদের পাসওয়ার্ড পুনরুদ্ধারের নির্দেশনা বা রিকভারি টোকেন প্রেরণ করা হবে।'
                  : 'সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা অনলাইন পোর্টালে স্বাগত।'}
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded text-rose-700 dark:text-rose-400 text-xs leading-relaxed flex items-start gap-1.5 font-sans">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-450" />
                <span>{loginError}</span>
              </div>
            )}

            {recoverySuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded text-emerald-850 dark:text-emerald-400 text-xs leading-relaxed flex items-start gap-1.5 font-sans">
                <span className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 block">✓</span>
                <span>{recoverySuccess}</span>
              </div>
            )}

            {forgotPasswordMode ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    নিবন্ধিত ইমেইল এড্রেস
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex gap-2 font-sans pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setLoginError('');
                      setRecoverySuccess('');
                    }}
                    className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded transition"
                  >
                    লগইনে ফিরুন
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded transition disabled:opacity-50"
                  >
                    {recoveryLoading ? 'মেইল পাঠানো হচ্ছে...' : 'রিকভারি পাঠান'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    ইমেইল এড্রেস
                  </label>
                  <input
                    type="email"
                    required
                    id="login-email-input"
                    placeholder="name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      পাসওয়ার্ড
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPasswordMode(true);
                        setLoginError('');
                        setRecoverySuccess('');
                      }}
                      className="text-[10px] sm:text-xs text-rose-600 hover:underline hover:text-rose-500 font-bold"
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="******"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  id="login-modal-submit"
                  className="w-full py-2 bg-rose-600 text-white font-semibold text-sm rounded hover:bg-rose-700 transition shadow-sm"
                >
                  লগইন করুন
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-4 text-center">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
                পরীক্ষা করার জন্য সরাসরি সুপার এডমিন (Chitron Bhattacharjee) হিসেবে সহজে প্রবেশ করতে নিচের বাটনে ক্লিক করুন:
              </p>
              <button
                type="button"
                id="btn-quick-admin-login"
                onClick={handleQuickAdminLogin}
                className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-400 text-xs font-bold rounded transition border border-rose-200 dark:border-rose-900"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>সুপার এডমিন লগইন (চিত্তাভ)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}
