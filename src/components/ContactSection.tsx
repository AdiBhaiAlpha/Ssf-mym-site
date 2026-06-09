import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckSquare, HeartHandshake } from 'lucide-react';
import { motion } from 'motion/react';

export default function ContactSection() {
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName.trim() || !feedbackMsg.trim()) return;

    setSubmitting(true);
    // Mimic API route feedback delay
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setFeedbackName('');
      setFeedbackEmail('');
      setFeedbackMsg('');
      setTimeout(() => setSuccess(false), 5000);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-805 pb-5 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
          <Mail className="text-rose-600 w-7 h-7" />
          <span>যোগাযোগ ও জেলা দপ্তর কার্যালয়</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
          সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহের সাথে যোগাযোগ, তাত্ত্বিক রিডিং মতামত কিংবা পরামর্শ প্রদান করুন
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Office details (5/12) */}
        <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 px-2 py-0.5 rounded font-bold font-mono uppercase">
              DISTRICT DOCK CENTER
            </span>
            <h2 className="text-base sm:text-lg font-bold text-zinc-855 dark:text-white mt-2 mb-4 leading-tight">
              সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা কার্যালয়
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-450 leading-relaxed font-sans">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">দপ্তর অবস্থান:</p>
                  <p>স্টেশন মালগুদাম রোড, গাঙ্গিনারপাড় (জেলা ছাত্র ফ্রন্ট কার্যালয়), ময়মনসিংহ সদর, ময়মনসিংহ।</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">মোবাইল হেল্পলাইন:</p>
                  <p className="space-x-1.5">
                    <a href="tel:01718564048" className="hover:underline text-rose-600 dark:text-rose-500 font-bold font-mono">০১৭১৮-৫৬৪০৪৮</a>
                    <span className="text-zinc-400">/</span>
                    <a href="tel:01316655254" className="hover:underline text-rose-600 dark:text-rose-500 font-bold font-mono">০১৩১৬-৬৫৫২৫৪</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">দাপ্তরিক ইমেইল:</p>
                  <p className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                    <a href="mailto:ssfmym@gmail.com" className="hover:underline text-rose-600 dark:text-rose-500 font-bold">ssfmym@gmail.com</a>
                    <span className="text-zinc-400 hidden sm:inline">,</span>
                    <a href="mailto:chitronbhattacharjee@gmailgmail.com" className="hover:underline text-rose-600 dark:text-rose-500 font-bold">chitronbhattacharjee@gmailgmail.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-900 pt-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 font-mono">সামাজিক যোগাযোগ মাধ্যম</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <a 
                href="https://www.facebook.com/ssf.mym/" 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-950 rounded font-semibold transition"
              >
                ফেসবুক পেজ (Facebook)
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-800 rounded font-semibold transition"
              >
                ইউটিউব চ্যানেল (YouTube)
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Contact/Feedback form (7/12) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-6 sm:p-8 shadow-xs">
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 border-b pb-2 mb-6 font-bold">
            মতামত, পরামর্শ কিংবা অনুসন্ধান পাঠান
          </h3>

          {success ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-450 p-5 rounded border border-emerald-250 text-xs text-center space-y-2">
              <CheckSquare className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
              <h4 className="font-bold">তথ্য প্রেরণ সফল হয়েছে!</h4>
              <p>আপনার পাঠানো রাজনৈতিক অভিমত এবং যোগাযোগ বার্তা জেলা দপ্তর সেলে সংরক্ষিত হয়েছে। লাল স্যালুট!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    আপনার সম্পূর্ণ নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                    placeholder="দেবজিৎ চক্রবর্তী"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    মোবাইল/ইমেইল এড্রেস
                  </label>
                  <input
                    type="text"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                    placeholder="email@example.com বা ০১৭xxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  পরামর্শ বা বার্তার বিবরণ *
                </label>
                <textarea
                  required
                  rows={5}
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none focus:border-rose-500"
                  placeholder="আপনার সুনির্দিষ্ট তাত্ত্বিক বিশ্লেষণ, প্রতিবাদ বা বার্তা এখানে লিখুন..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded shadow transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>মতামত সাবমিট করুন</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
