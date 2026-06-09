import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, HeartHandshake, CheckCircle2, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import { Event, EventRegistrant } from '../types';
import { motion } from 'motion/react';

interface EventsSectionProps {
  events: Event[];
  onRegisterEvent: (eventId: string, details: { name: string; email: string; phone: string; institution: string }) => Promise<EventRegistrant | null>;
}

export default function EventsSection({ events, onRegisterEvent }: EventsSectionProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Registration Dialog form inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regInstitution, setRegInstitution] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Simple Month Calendar State (Default June 2026)
  const daysInJune = 30;
  const juneStartOffset = 1; // Mon (0) to Sun (6)

  // Map events to specific June calendar days for quick tags
  const calendarEventDates = events.map(e => ({
    day: parseInt(e.date.split('-')[2]) || 0,
    title: e.title,
    event: e
  })).filter(e => e.day > 0);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!regName.trim() || !regPhone.trim()) return;

    setSubmitting(true);
    const success = await onRegisterEvent(selectedEvent.id, {
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      institution: regInstitution.trim()
    });
    setSubmitting(false);

    if (success) {
      setRegSuccess(true);
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegInstitution('');
      setTimeout(() => {
        setRegSuccess(false);
        setSelectedEvent(null);
      }, 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Title & description */}
      <div className="border-b border-zinc-200 dark:border-zinc-805 pb-5 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
          <Calendar className="text-rose-600 w-7 h-7" />
          <span>রাজনৈতিক ইভেন্ট ও কর্মসূচী পঞ্জিকা</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
          শিক্ষা আন্দোলন, প্রগতিশীল কিশোর শিবির, গণসমাবেশ ও তাত্ত্বিক ক্লাসের জেলা শিডিউল
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Calendar Grid and Register Widget (7/12) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Calendar June 2026 UI */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-6 shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-zinc-850 dark:text-zinc-200 font-sans">কর্মসূচী বর্ষপঞ্জী</h3>
                <p className="text-[10px] text-zinc-500 font-mono">JUNE ২০২৬ (ময়মনসিংহ জেলা)</p>
              </div>
              <div className="flex space-x-1 text-xs font-mono text-zinc-400 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded">
                <span>জুন ২০২৬</span>
              </div>
            </div>

            {/* Calendar Grid Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase text-zinc-500 mb-3 font-sans">
              <div>শনি</div>
              <div>রবি</div>
              <div>সোম</div>
              <div>মঙ্গল</div>
              <div>বুধ</div>
              <div>বৃহঃ</div>
              <div>শুক্র</div>
            </div>

            {/* Calendar Grid Body */}
            <div className="grid grid-cols-7 gap-1 font-mono text-sm">
              {/* Empty days offsets for June 1st Monday */}
              {Array.from({ length: juneStartOffset }).map((_, idx) => (
                <div key={`offset-${idx}`} className="aspect-square bg-zinc-50/40 dark:bg-zinc-900/10 border border-zinc-100/50 dark:border-zinc-900/10 rounded-sm"></div>
              ))}

              {/* Day slots */}
              {Array.from({ length: daysInJune }).map((_, idx) => {
                const dayNum = idx + 1;
                const activeEventsForDay = calendarEventDates.filter(e => e.day === dayNum);
                const hasEvent = activeEventsForDay.length > 0;

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => {
                      if (hasEvent) {
                        setSelectedEvent(activeEventsForDay[0].event);
                      }
                    }}
                    className={`aspect-square p-1.5 border border-zinc-100 dark:border-zinc-900/50 rounded-sm flex flex-col justify-between transition group ${
                      hasEvent
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 cursor-pointer hover:bg-rose-100/50'
                        : 'bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span className={`text-xs ${hasEvent ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-zinc-700 dark:text-zinc-400'}`}>
                      {dayNum}
                    </span>
                    {hasEvent && (
                      <span className="w-2.5 h-2.5 bg-rose-600 dark:bg-rose-500 rounded-full mx-auto md:w-full md:h-1.5 md:rounded-xs animate-pulse" title={activeEventsForDay[0].title}></span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p className="text-[10px] text-zinc-400 mt-4 leading-normal italic">
              * লাল চিহ্নিত কার্টুন সেলগুলিতে গুরুত্বপূর্ণ কর্মসূচী আছে। সেলটিতে ক্লিক করে সরাসরি নিবন্ধন করতে পারবেন।
            </p>
          </div>
        </div>

        {/* Right column: List layout of Active Events (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-400 border-b pb-2 mb-4 font-bold">
            আসন্ন কর্মসূচীর সময়সূচী
          </h3>

          <div className="space-y-6">
            {events.map((event) => {
              const totalReg = (event.registrants || []).length;
              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-rose-400/40 rounded p-5 transition flex flex-col shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                      event.status === 'upcoming'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-905 dark:text-zinc-400'
                    }`}>
                      {event.status === 'upcoming' ? 'আসন্ন কর্মসূচী' : 'সম্পন্ন কর্মসূচি'}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">{event.date}</span>
                  </div>

                  <h4 className="text-base font-bold text-zinc-850 dark:text-white leading-snug">
                    {event.title}
                  </h4>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal my-3">
                    {event.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-900 pt-3 mt-1.5 font-sans">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>সময়: {event.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span className="truncate">স্থান: {event.venue}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      <span>সংহতি নিবন্ধন সক্রিয়: {totalReg} জন আবেদনকারী</span>
                    </div>
                  </div>

                  {event.status === 'upcoming' && (
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                      }}
                      className="mt-4 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition shadow"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>নামধাম ও ইমেইল যুক্ত করুন</span>
                    </button>
                  )}
                </div>
              );
            })}

            {events.length === 0 && (
              <p className="text-xs text-zinc-400">এই মুহূর্তে কোনো কর্মসূচি সূচি দেওয়া নেই।</p>
            )}
          </div>
        </div>
      </div>

      {/* Register Modal dialog */}
      {selectedEvent && (
        <div id="event-reg-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-zinc-950/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-white font-mono font-bold text-lg"
            >
              ✕
            </button>

            <div className="mb-5">
              <span className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 px-2 py-0.5 rounded font-bold font-mono">
                REGISTRATION PORTAL
              </span>
              <h3 className="text-lg font-bold text-zinc-850 dark:text-white mt-2 leading-tight">
                {selectedEvent.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                মঞ্চ সমাবেশ, তাত্ত্বিক রিডিং মেম্বার কিংবা গণ-সমাবেশে স্বতঃস্ফূর্ত অংশগ্রহণে সংহতি প্রকাশ করুন।
              </p>
            </div>

            {regSuccess ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 p-5 rounded border border-emerald-250 text-xs text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="font-bold">সংহতি নিবন্ধন সফল হয়েছে!</h4>
                <p>সংগঠন প্রতিনিধি অচিরেই আপনার মোবাইল নাম্বারে বিস্তারিত কর্মসূচি শিডিউল এসএমএস করবে। ধন্যবাদ বিপ্লব ও লাল স্যালুট!</p>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    আপনার সম্পূর্ণ নাম *
                  </label>
                  <input
                    type="text"
                    required
                    id="event-reg-name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                    placeholder="উৎস ভট্টাচার্য"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      মোবাইল নম্বর *
                    </label>
                    <input
                      type="tel"
                      required
                      id="event-reg-phone"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                      placeholder="০১৭১১-xxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      ইমেইল এড্রেস
                    </label>
                    <input
                      type="email"
                      id="event-reg-email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                      placeholder="name@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    শিক্ষা প্রতিষ্ঠান / কর্মক্ষেত্র *
                  </label>
                  <input
                    type="text"
                    required
                    id="event-reg-college"
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                    placeholder="আনন্দ মোহন কলেজ, ময়মনসিংহ"
                  />
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-850 p-3 rounded text-[10px] text-zinc-500 leading-normal">
                  * সমাজতান্ত্রিক ছাত্র ফ্রন্ট আপনার ব্যক্তিগত তথ্যাবলির শতভাগ নিরাপত্তা ও গোপনীয়তা রক্ষার পূর্ণ অঙ্গীকার করে।
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>সংহতি নিশ্চিত করুন</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
