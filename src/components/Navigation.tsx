import React, { useState } from 'react';
import { Menu, X, Sun, Moon, LogIn, LogOut, ShieldAlert, Award, FileText, Newspaper, BookOpen, Calendar, HelpCircle, Mail, Search, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveFirestoreDoc } from '../firebase';

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
  invitations?: any[];
  onInviteAction?: (id: string, action: 'accepted' | 'declined') => Promise<boolean>;
  onRegisterMember?: (registration: any) => Promise<any | null>;
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
  invitations = [],
  onInviteAction,
  onRegisterMember
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

  // User Registration (Sign up) States inside the Login Modal
  const [signupMode, setSignupMode] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regInstitution, setRegInstitution] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regType, setRegType] = useState<'member' | 'volunteer'>('member');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleCloseModal = () => {
    setShowLoginModal(false);
    setForgotPasswordMode(false);
    setSignupMode(false);
    setLoginError('');
    setRecoverySuccess('');
    setRegSuccess('');
    setRegName('');
    setRegEmail('');
    setRegMobile('');
    setRegInstitution('');
    setRegPassword('');
  };

  const userRole = invitations?.find(
    (i: any) => i.email.toLowerCase() === userEmail?.toLowerCase() && i.status === 'accepted'
  )?.role;

  const isSuperAdmin = 
    userEmail?.toLowerCase() === 'chitronbhattacharjee@gmail.com' || 
    userRole === 'super_admin';

  const isAnyAdmin = 
    userEmail?.toLowerCase() === 'chitronbhattacharjee@gmail.com' || 
    !!userRole;

  const adminLabel = isSuperAdmin 
    ? 'সুপার এডমিন' 
    : (userRole === 'admin' ? 'সমন্বয়ক এডমিন' : userEmail?.split('@')[0]);

  const [showNotifications, setShowNotifications] = useState(false);

  const pendingInvitations = userEmail
    ? (invitations || []).filter(
        (i: any) => i.email.toLowerCase() === userEmail.toLowerCase() && i.status === 'pending'
      )
    : [];

  // Browser Push Notifications
  React.useEffect(() => {
    if (userEmail && invitations && typeof window !== 'undefined' && 'Notification' in window) {
      const pending = (invitations || []).filter(
        (i: any) => i.email.toLowerCase() === userEmail.toLowerCase() && i.status === 'pending'
      );
      if (pending.length > 0) {
        pending.forEach((invite: any) => {
          const key = `push_notified_${invite.id}`;
          if (!localStorage.getItem(key)) {
            if (Notification.permission === 'granted') {
              new Notification('এডমিন নিয়োগ নিমন্ত্রণ', {
                body: `কমরেড, আপনাকে ${invite.role === 'super_admin' ? 'সুপার এডমিন' : 'সমন্বয়ক এডমিন'} হিসেবে দায়িত্ব বা প্যানেল নিমন্ত্রণ পাঠানো হয়েছে।`,
              });
              localStorage.setItem(key, 'true');
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('এডমিন নিয়োগ নিমন্ত্রণ', {
                    body: `কমরেড, আপনাকে ${invite.role === 'super_admin' ? 'সুপার এডমিন' : 'সমন্বয়ক এডমিন'} হিসেবে দায়িত্ব বা প্যানেল নিমন্ত্রণ পাঠানো হয়েছে।`,
                  });
                  localStorage.setItem(key, 'true');
                }
              });
            }
          }
        });
      }
    }
  }, [userEmail, invitations]);

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

  const logMemberLoginDirect = async (email: string, status: string, details: string) => {
    const payload = {
      id: 'ml_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      email,
      status,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    try {
      await saveFirestoreDoc('memberLogins', payload.id, payload);
    } catch (e) {
      console.error('Failed to log to Firestore direct:', e);
    }
    try {
      await fetch('/api/member-logins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, status, details })
      });
    } catch (err) {
      console.error('API logger fallback error:', err);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    setLoginError('');

    if (!email) return;

    if (email === 'chitronbhattacharjee@gmail.com') {
      const SUPER_ADMIN_PASSWORD = (import.meta as any).env.VITE_SUPER_ADMIN_PASSWORD || 'chitron@2448766';
      if (loginPassword.trim() === SUPER_ADMIN_PASSWORD) {
        onLogin(email);
        setShowLoginModal(false);
        setLoginEmail('');
        setLoginPassword('');
        logMemberLoginDirect(email, 'success', 'সুপার এডমিন (চিত্রণ ভট্টাচার্য) হিসেবে মডিউল পাসওয়ার্ড দিয়ে মূল ডাটাবেজে প্রবেশ করেছেন।');
        return;
      } else {
        setLoginError('দুঃখিত, সুপার এডমিন পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় সঠিক পাসওয়ার্ড দিন।');
        logMemberLoginDirect(email, 'failed', 'ভুল সুপার এডমিন পাসওয়ার্ড দিয়ে লগইন চেষ্টা করা হয়েছে।');
        return;
      }
    }

    const foundMember = memberships.find(m => m.email?.toLowerCase() === email);
    if (!foundMember) {
      setLoginError('প্রদত্ত ইমেইলের বিপরীতে কোনো আবেদন বা সদস্যপদ পাওয়া যায়নি।');
      logMemberLoginDirect(email, 'failed', 'অনিবন্ধিত ইমেইল দিয়ে লগইন চেষ্টা।');
      return;
    }

    if (foundMember.password && foundMember.password !== loginPassword) {
      setLoginError('দুঃখিত, আপনার পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় সঠিক পাসওয়ার্ড দিন।');
      logMemberLoginDirect(foundMember.email, 'failed', 'ভুল পাসওয়ার্ড দিয়ে লগইন চেষ্টা করা হয়েছে।');
      return;
    }

    if (foundMember.status === 'pending') {
      setLoginError('আপনার সদস্যপদ আবেদনটি বর্তমানে মূল্যায়নাধীন (Pending) রয়েছে। জেলা দপ্তর অনুমোদনকারী প্যানেল ভেরিফাই করলে লগইন সম্ভব।');
      logMemberLoginDirect(foundMember.email, 'failed', 'আবেদনকারী লগইন চেষ্টা করেছেন কিন্তু তাঁর পাসওয়ার্ড/মেইল এখনো অনুমোদিত (Pending) নয়।');
      return;
    }

    if (foundMember.status === 'rejected') {
      setLoginError('দুঃখিত, আপনার মেম্বারশিপ আবেদনটি জেলা সেল দ্বারা প্রত্যাখ্যাত হয়েছে।');
      logMemberLoginDirect(foundMember.email, 'failed', 'প্রত্যাখ্যাত আবেদন দিয়ে লগইন চেষ্টা করা হয়েছে।');
      return;
    }

    if (foundMember.status === 'verified') {
      onLogin(foundMember.email);
      setCurrentTab('member-portal');
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      logMemberLoginDirect(foundMember.email, 'success', `সদস্য "${foundMember.name}" পোর্টাল অ্যাকাউন্টে সফলভাবে লগইন করেছেন।`);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = forgotEmail.trim().toLowerCase();
    if (!email) return;

    setLoginError('');
    setRecoverySuccess('');
    setRecoveryLoading(true);

    const matchedMember = memberships.find(m => m.email?.toLowerCase() === email && m.status === 'verified');
    const directResetLog = {
      id: 'ml_forgot_' + Date.now(),
      email,
      status: 'reset_request',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details: matchedMember ? 'পাসওয়ার্ড পুনরুদ্ধারের জন্য স্বয়ংক্রিয় নোটিফিকেশন ইমেইল ইভেন্ট জেনারেট করে পাঠানো হয়েছে।' : 'ভুল বা অনিবন্ধিত ইমেইল দ্বারা পাসওয়ার্ড উদ্ধারের চেষ্টা করা হয়েছে।'
    };
    try {
      await saveFirestoreDoc('memberLogins', directResetLog.id, directResetLog);
    } catch (err) {
      console.error(err);
    }

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
        setRecoveryLoading(false);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    if (matchedMember) {
      setRecoverySuccess(`বিপ্লবী শুভেচ্ছা, কমরেড ${matchedMember.name}। পাসওয়ার্ড পুনরুদ্ধারের লিংক ও নির্দেশনাবলী আপনার নিবন্ধিত ইমেইল এড্রেসে (${email}) প্রেরণ করা হয়েছে। দয়া করে স্প্যাম ফোল্ডারসহ ইনবক্স চেক করুন।`);
      setForgotEmail('');
    } else {
      setLoginError('দুঃখিত, প্রদত্ত ইমেইলের বিপরীতে ভেরিফাইড সদস্যপদ পাওয়া যায়নি।');
    }
    setRecoveryLoading(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameVal = regName.trim();
    const emailVal = regEmail.trim().toLowerCase();
    const mobileVal = regMobile.trim();
    const instVal = regInstitution.trim();
    const passVal = regPassword.trim();

    if (!nameVal || !emailVal || !mobileVal || !instVal || !passVal) {
      setLoginError('দয়া করে প্রতিটি প্রয়োজনীয় তথ্য এবং অবশ্যই একটি পাসওয়ার্ড নিশ্চিত করুন।');
      return;
    }

    if (passVal.length < 4) {
      setLoginError('নিরাপত্তার স্বার্থে পাসওয়ার্ডটি কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    setRegLoading(true);
    setLoginError('');
    setRegSuccess('');

    try {
      if (onRegisterMember) {
        const added = await onRegisterMember({
          name: nameVal,
          mobile: mobileVal,
          email: emailVal,
          password: passVal,
          institution: instVal,
          department: '',
          academicYear: '',
          address: 'অনলাইন সাইনআপ ফর্ম',
          dob: '',
          type: regType
        });

        if (added) {
          setRegSuccess(`বিপ্লবী শুভেচ্ছা কমরেড ${nameVal}! নতুন অ্যাকাউন্ট ও সদস্যপদের আবেদনটি সফলভাবে নিবন্ধিত হয়েছে। জেলা দপ্তর সেল আবেদনটি ভেরিফাই ও অনুমোদন করার পর আপনি সরাসরি এই ইমেইল দিয়ে ডাটাবেজ পোর্টালে লগইন করতে পারবেন।`);
          setRegName('');
          setRegEmail('');
          setRegMobile('');
          setRegInstitution('');
        } else {
          setLoginError('দুঃখিত, আবেদনপত্রটি ডাটাবেজে সাবমিট করা যায়নি। দয়া করে পুনরায় চেষ্টা করুন।');
        }
      } else {
        setLoginError('দুঃখিত, এই মুহূর্তে অনলাইন সদস্যপদ নিবন্ধন কার্যক্রম ও পোর্টাল সাইনআপ সাময়িকভাবে বন্ধ আছে।');
      }
    } catch (err) {
      console.error(err);
      setLoginError('আবেদন প্রক্রিয়াকরণে ভুল ত্রুটি দেখা দিয়েছে।');
    } finally {
      setRegLoading(false);
    }
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
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono tracking-widest mt-0.5">
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
                          ? 'text-rose-600 dark:text-rose-500 bg-rose-55_10 dark:bg-rose-950/30'
                          : 'text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

              {isAnyAdmin && (
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

              {/* Notification Bell with Dropdown */}
              {userEmail && (
                <div className="relative">
                  <button
                    id="btn-nav-notifications"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-all duration-200 relative"
                    title="নিমন্ত্রণ ও বিজ্ঞপ্তি"
                  >
                    <Bell className="w-5 h-5" />
                    {pendingInvitations.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                    )}
                    {pendingInvitations.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg shadow-xl z-50 p-4 text-xs font-sans text-zinc-800 dark:text-zinc-200"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2 mb-3">
                            <h4 className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-white">
                              <Bell className="w-4 h-4 text-rose-600" />
                              <span>নিমন্ত্রণ ও বিজ্ঞপ্তি ({pendingInvitations.length})</span>
                            </h4>
                          </div>

                          {pendingInvitations.length === 0 ? (
                            <div className="text-center py-6 text-zinc-400 dark:text-zinc-650 italic">
                              কোনো পেন্ডিং এডমিন নিমন্ত্রণ বা বিজ্ঞপ্তি নেই।
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {pendingInvitations.map((invite: any) => (
                                <div
                                  key={invite.id}
                                  className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-900 rounded-md"
                                >
                                  <p className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                                    কমরেড <span className="font-semibold text-rose-600">{invite.invitedBy}</span> আপনাকে{' '}
                                    <span className="font-bold">
                                      {invite.role === 'super_admin' ? 'সুপার এডমিন' : 'সমন্বয়ক এডমিন'}
                                    </span>{' '}
                                    হিসেবে দায়িত্বে যোগ দেওয়ার নিমন্ত্রণ পাঠিয়েছেন।
                                  </p>
                                  <p className="text-[9px] text-zinc-400 mt-1 font-mono">{invite.timestamp}</p>
                                  <div className="mt-3 flex items-center justify-end gap-2">
                                    <button
                                      onClick={async () => {
                                        if (onInviteAction) {
                                          await onInviteAction(invite.id, 'declined');
                                        }
                                      }}
                                      className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded text-[10px] font-bold transition"
                                    >
                                      ডিক্লাইন
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (onInviteAction) {
                                          await onInviteAction(invite.id, 'accepted');
                                          setCurrentTab('admin'); // Directly take them to the dashboard
                                          setShowNotifications(false);
                                        }
                                      }}
                                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-sm transition"
                                    >
                                      এপ্রুভ করুন
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {userEmail ? (
                <div className="flex items-center space-x-3 ml-2 border-l pl-3 border-zinc-200 dark:border-zinc-800">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
                      {adminLabel}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">অনলাইন</p>
                  </div>
                  <button
                    id="btn-logout"
                    onClick={onLogout}
                    className="p-2 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full text-rose-600"
                    title="লগ আউট"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="btn-login-open"
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 dark:bg-zinc-100 dark:border-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-830 dark:hover:bg-white text-sm font-semibold rounded-md shadow-sm transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span>লগইন</span>
                </button>
              )}
            </div>

            {/* Mobile Actions Header area */}
            <div className="flex items-center space-x-2 lg:hidden">
              {userEmail && (
                <div className="relative font-sans">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full relative transition-all"
                  >
                    <Bell className="w-5 h-5" />
                    {pendingInvitations.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                    )}
                    {pendingInvitations.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg shadow-xl z-50 p-4 text-xs text-zinc-800 dark:text-zinc-200"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2 mb-3">
                            <h4 className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-white">
                              <Bell className="w-4 h-4 text-rose-600" />
                              <span>নোটিফিকেশন ({pendingInvitations.length})</span>
                            </h4>
                          </div>

                          {pendingInvitations.length === 0 ? (
                            <div className="text-center py-6 text-zinc-400 dark:text-zinc-650 italic">
                              কোনো পেন্ডিং নিমন্ত্রণ বা বিজ্ঞপ্তি নেই।
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {pendingInvitations.map((invite: any) => (
                                <div
                                  key={invite.id}
                                  className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-900 rounded-md"
                                >
                                  <p className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-350">
                                    কমরেড <span className="font-semibold text-rose-600">{invite.invitedBy}</span> আপনাকে{' '}
                                    <span className="font-bold">
                                      {invite.role === 'super_admin' ? 'সুপার এডমিন' : 'সমন্বয়ক এডমিন'}
                                    </span>{' '}
                                    হিসেবে দায়িত্ব বা নিমন্ত্রণ জানিয়েছেন।
                                  </p>
                                  <div className="mt-3 flex items-center justify-end gap-2">
                                    <button
                                      onClick={async () => {
                                        if (onInviteAction) {
                                          await onInviteAction(invite.id, 'declined');
                                        }
                                      }}
                                      className="px-2.5 py-1 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded text-[10px] font-bold transition"
                                    >
                                      ডিক্লাইন
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (onInviteAction) {
                                          await onInviteAction(invite.id, 'accepted');
                                          setCurrentTab('admin');
                                          setShowNotifications(false);
                                        }
                                      }}
                                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-sm transition"
                                    >
                                      এপ্রুভ করুন
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-all"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-all"
                aria-label="মেনু খুঁজুন"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Navigation slide menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-rose-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden"
            >
              <div className="px-4 pt-3 pb-6 space-y-1.5 shadow-inner">
                {/* Mobile Search input */}
                <div className="relative mb-3.5 px-1">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-zinc-400" />
                  </span>
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="নিবন্ধ, ইভেন্ট বা খবর খুঁজুন..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-55 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 text-zinc-900 dark:text-white"
                  />
                </div>

                {/* Mobile Menu Links */}
                <div className="space-y-1">
                  {menuItems
                    .filter((item) => item.visible)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          id={`mobile-nav-link-${item.id}`}
                          onClick={() => {
                            setCurrentTab(item.id);
                            setIsOpen(false);
                          }}
                          className={`flex items-center space-x-2.5 w-full px-3.5 py-2.5 text-sm font-semibold rounded-md transition-all ${
                            isActive
                              ? 'text-rose-600 dark:text-rose-500 bg-rose-55_10 dark:bg-rose-950/30'
                              : 'text-zinc-700 dark:text-zinc-300 hover:text-rose-600 hover:bg-zinc-55 dark:hover:bg-zinc-900'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}

                  {isAnyAdmin && (
                    <button
                      id="mobile-nav-link-admin"
                      onClick={() => {
                        setCurrentTab('admin');
                        setIsOpen(false);
                      }}
                      className={`flex items-center space-x-2.5 w-full px-3.5 py-2.5 text-sm font-semibold rounded-md transition-all ${
                        currentTab === 'admin'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-650/10 text-rose-600 hover:bg-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>এডমিন ড্যাশবোর্ড</span>
                    </button>
                  )}
                </div>

                {/* Direct membership link */}
                <div className="pt-3 px-1 border-t border-rose-50 dark:border-zinc-900 mt-2">
                  <a
                    href="https://tally.so/r/44Jz8O"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow-sm transition-all"
                  >
                    <Award className="h-4 w-4" />
                    <span>সদস্য হোন (অনলাইন আবেদন)</span>
                  </a>
                </div>

                {/* Login controls mobile drawer */}
                <div className="pt-3 px-1">
                  {userEmail ? (
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-md border border-zinc-150 dark:border-zinc-800">
                      <div className="truncate max-w-[150px]">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {adminLabel}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate">{userEmail}</p>
                      </div>
                      <button
                        onClick={() => {
                          onLogout();
                          setIsOpen(false);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-rose-250 dark:border-rose-900/40 rounded-md transition"
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
                      className="flex items-center justify-center space-x-2 w-full py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold rounded-md shadow-sm transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>লগইন করুন</span>
                    </button>
                  )}
                </div>

                {/* Political affiliation card for mobile */}
                <div className="pt-4 border-t border-rose-50 dark:border-zinc-900 mt-4 px-1 select-none">
                  <div className="flex items-center space-x-3 bg-rose-50/20 dark:bg-rose-950/15 p-3 rounded-md border border-rose-100/50 dark:border-rose-900/20">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Flag_of_Socialist_Party_of_Bangladesh.svg/500px-Flag_of_Socialist_Party_of_Bangladesh.svg.png"
                      alt="বাসদ পতাকা"
                      referrerPolicy="no-referrer"
                      className="h-8 w-12 object-cover rounded shadow-xs"
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 leading-none">মূল দলঃ</span>
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 mt-0.5 whitespace-nowrap">বাংলাদেশের সমাজতান্ত্রিক দল</span>
                      <a
                        href="https://spb.org.bd/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-rose-600 hover:underline mt-0.5"
                      >
                        spb.org.bd
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Authentication Control Modal (Full Overlay with highest overlay positioning) */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-zinc-950/85 backdrop-blur-xs"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600" />

              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-rose-600 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Brand */}
              <div className="flex items-center gap-3 mb-5 select-none pt-1">
                <img
                  src="https://i.ibb.co.com/F4MKM3R2/20260527-055637.png"
                  alt="সমাজতান্ত্রিক छात्र फ्रंट লোগো"
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white leading-tight">
                    {forgotPasswordMode
                      ? 'পাসওয়ার্ড উদ্ধার সেল'
                      : signupMode
                        ? 'নতুন অ্যাকাউন্ট আবেদন'
                        : 'পোর্টালে লগইন করুন'}
                  </h3>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                    সমাজতান্ত্রিক ছাত্র ফ্রন্ট • ময়মনসিংহ জেলা
                  </p>
                </div>
              </div>

              {/* Tabs for registration vs sign-in modal selection */}
              {!forgotPasswordMode && !regSuccess && (
                <div className="flex border-b border-zinc-150 dark:border-zinc-900 mb-5 text-xs font-bold leading-none select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setSignupMode(false);
                      setLoginError('');
                    }}
                    className={`flex-1 pb-3 text-center transition ${
                      !signupMode
                        ? 'border-b-2 border-rose-600 text-rose-600 dark:text-rose-500'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    লগইন করুন (Sign In)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupMode(true);
                      setLoginError('');
                    }}
                    className={`flex-1 pb-3 text-center transition ${
                      signupMode
                        ? 'border-b-2 border-rose-600 text-rose-600 dark:text-rose-500'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    কমরেড সাইন-আপ আবেদন
                  </button>
                </div>
              )}

              {/* Alerts */}
              {loginError && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-455 text-xs leading-relaxed flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {recoverySuccess && (
                <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-zinc-800 dark:text-emerald-300 text-xs leading-relaxed flex flex-col gap-2">
                  <span className="font-extrabold text-emerald-600 flex items-center gap-1">✓ সফল অনুরোধ সম্পন্ন</span>
                  <p>{recoverySuccess}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setRecoverySuccess('');
                    }}
                    className="mt-2 py-1.5 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white text-[10px] font-bold rounded"
                  >
                    লগইনে ফিরে যান
                  </button>
                </div>
              )}

              {regSuccess && (
                <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-zinc-800 dark:text-emerald-300 text-xs leading-relaxed flex flex-col gap-2">
                  <span className="font-extrabold text-emerald-600 flex items-center gap-1.5">
                    ✦ আবেদনপত্র সফলভাবে গৃহীত হয়েছে!
                  </span>
                  <p className="text-[11.5px] leading-relaxed font-sans">{regSuccess}</p>
                  <div className="flex gap-2 mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <button
                      type="button"
                      onClick={() => {
                        setSignupMode(false);
                        setRegSuccess('');
                      }}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded transition"
                    >
                      এখন লগইন করুন
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold rounded transition"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              )}

              {/* Layout forms */}
              {!recoverySuccess && !regSuccess && (
                <>
                  {forgotPasswordMode ? (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          নিবন্ধিত ইমেইল এড্রেস *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
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
                  ) : signupMode ? (
                    <form onSubmit={handleSignupSubmit} className="space-y-3.5 transition-all">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          পূর্ণ নাম (Full Name) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="जैसेः ইমরান হোসেন"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                            মোবাইল নম্বর *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="যেমনঃ ০১৭১১xxxxxx"
                            value={regMobile}
                            onChange={(e) => setRegMobile(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                            ইমেইল এড্রেস *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="name@example.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          শিক্ষা প্রতিষ্ঠান (Institution) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="যেমনঃ আনন্দ মোহন কলেজ, ময়মনসিংহ"
                          value={regInstitution}
                          onChange={(e) => setRegInstitution(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          ভূমিকা / ক্যাটাগরি ধরন নির্বাচন করুন
                        </label>
                        <select
                          value={regType}
                          onChange={(e) => setRegType(e.target.value as 'member' | 'volunteer')}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
                        >
                          <option value="member">শাখা সাধারণ সদস্য (General Member)</option>
                          <option value="volunteer">ছাত্র-স্বেচ্ছাসেবী সেল (Volunteer Wing)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                          পাসওয়ার্ড সেট করুন (Create Password) *
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={regLoading}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-md transition shadow-md disabled:opacity-50"
                      >
                        {regLoading ? 'আবেদন সিস্টেমে জমা হচ্ছে...' : 'বিপ্লবী আবেদনপত্র পেশ করুন'}
                      </button>
                    </form>
                  ) : (
                    /* Normal Login Form */
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-305 mb-1">
                          ইমেইল এড্রেস *
                        </label>
                        <input
                          type="email"
                          required
                          id="login-email-input"
                          placeholder="name@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-305">
                            পাসওয়ার্ড (Password)
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
                          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        id="login-modal-submit"
                        className="w-full py-2 bg-rose-600 text-white font-semibold text-sm rounded-md hover:bg-rose-700 transition shadow-sm"
                      >
                        লগইন করুন (Sign In)
                      </button>
                    </form>
                  )}
                </>
              )}


            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
