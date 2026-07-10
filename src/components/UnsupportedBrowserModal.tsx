import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Chrome, Copy, Check, ExternalLink, Compass, ShieldAlert } from 'lucide-react';
import { BrowserProfile } from '../lib/BrowserDetection';

interface UnsupportedBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BrowserProfile | null;
}

export default function UnsupportedBrowserModal({ isOpen, onClose, profile }: UnsupportedBrowserModalProps) {
  const [copied, setCopied] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      setIsAndroid(/Android/i.test(ua));
      setIsIOS(/iPhone|iPad|iPod/i.test(ua));
    }
  }, []);

  if (!isOpen || !profile) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenInSystemBrowser = () => {
    if (isAndroid) {
      // Android intent to open link directly in default Chrome
      const urlWithoutProtocol = currentUrl.replace(/^https?:\/\//, '');
      const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
    } else {
      // For iOS / generic: open in a new window or trigger open
      window.open(currentUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
          id="unsupported-browser-backdrop"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-2xl overflow-hidden z-10 font-sans"
          id="unsupported-browser-modal-card"
        >
          {/* Top border colored accent */}
          <div className="h-1.5 bg-amber-500 w-full" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            id="close-unsupported-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Body Content */}
          <div className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-xl shrink-0">
                <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">
                  গুগল সিকিউরিটি পলিসি অ্যালার্ট
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Google Security &amp; OAuth Compliance Layer
                </p>
              </div>
            </div>

            {/* Error Message Explainer */}
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 space-y-2">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                  গুগল সিকিউরিটি পলিসির কারণে এই ব্রাউজার থেকে সরাসরি গুগল লগইন করা সম্ভব নয়। গুগল অ্যাপ্লিকেশনের নিরাপত্তা বাড়াতে এবং ফিশিং আক্রমণ প্রতিরোধ করতে সব ধরণের এম্বেডেড ব্রাউজার বা ইন-অ্যাপ ওয়েব-ভিউ (যেমন ফেইসবুক, ইন্সটাগ্রাম বা কোনো থার্ড-পার্টি কাস্টম ব্রাউজার) থেকে গুগল সাইন-ইন ব্লক করে থাকে।
                </p>
                <div className="text-[11px] text-zinc-500 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900/60 px-2.5 py-1.5 rounded font-mono flex flex-col gap-1">
                  <div>
                    <span className="font-bold text-zinc-700 dark:text-zinc-400">Detected Browser:</span> {profile.browserName} v{profile.browserVersion}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-700 dark:text-zinc-400">Safety Status:</span> Embedded / Restricted Environment 🚫
                  </div>
                </div>
              </div>

              {/* Troubleshooting Instructions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  কিভাবে এটি সমাধান করবেন? (How to solve)
                </h4>

                {isAndroid && (
                  <div className="text-xs text-zinc-650 dark:text-zinc-400 space-y-1 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/20 rounded-lg p-3">
                    <p className="font-bold text-zinc-800 dark:text-zinc-300 mb-1">🤖 অ্যান্ড্রয়েড ব্যবহারকারীদের জন্য:</p>
                    <p>নিচের <strong>"ব্রাউজারে খুলুন (Open in Chrome)"</strong> বাটনে ক্লিক করলে সাইটটি সরাসরি আপনার ফোনের মূল গুগল ক্রোম ব্রাউজারে চালু হবে, যেখানে লগইন সম্পূর্ণ নিরাপদ ও সচল থাকবে।</p>
                  </div>
                )}

                {isIOS && (
                  <div className="text-xs text-zinc-650 dark:text-zinc-400 space-y-1 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-200/40 dark:border-indigo-900/20 rounded-lg p-3">
                    <p className="font-bold text-zinc-800 dark:text-zinc-300 mb-1">🍎 আইওএস (iPhone/iPad) ব্যবহারকারীদের জন্য:</p>
                    <p className="leading-relaxed">
                      ১. স্ক্রিনের ডানদিকের উপরের ৩টি ডট বা নিচের শেয়ার বোতামে চাপুন।<br />
                      ২. তালিকা থেকে <strong>"Open in System Browser"</strong> বা <strong>"Open in Safari"</strong> নির্বাচন করুন।
                    </p>
                  </div>
                )}

                {!isAndroid && !isIOS && (
                  <div className="text-xs text-zinc-650 dark:text-zinc-400 space-y-1 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-3">
                    <p className="font-bold text-zinc-850 dark:text-zinc-300 mb-1">💡 সাধারণ নির্দেশনা:</p>
                    <p>দয়া করে একটি আদর্শ ও নিরাপদ ব্রাউজার (যেমন গুগল ক্রোম, সাফারি বা মজিলা ফায়ারফক্স) ব্যবহার করে সাইটটিতে সরাসরি প্রবেশ করুন।</p>
                  </div>
                )}
              </div>

              {/* Clipboard Action */}
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-900 rounded-lg p-2.5">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="bg-transparent text-[10.5px] font-mono text-zinc-500 select-all outline-none flex-grow min-w-0"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 shrink-0 px-2.5 py-1 text-xs font-semibold bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-800 rounded transition"
                  title="Copy URL"
                  id="copy-site-link-btn"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-900 px-6 py-4 flex flex-col sm:flex-row-reverse gap-2">
            <button
              onClick={handleOpenInSystemBrowser}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition duration-150"
              id="open-in-chrome-btn"
            >
              {isAndroid ? (
                <>
                  <Chrome className="w-4 h-4" />
                  <span>ব্রাউজারে খুলুন (Open in Chrome)</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>নতুন উইন্ডোতে খুলুন</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition duration-150"
              id="cancel-unsupported-modal-btn"
            >
              বাতিল (Cancel)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
