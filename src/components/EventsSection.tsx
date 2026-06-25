import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, HeartHandshake, CheckCircle2, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import { Event, EventRegistrant } from '../types';
import { motion } from 'motion/react';
import { updateSEOMetadata } from '../lib/seo';

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

  // Dynamic SEO update on event select
  useEffect(() => {
    if (selectedEvent) {
      const cleanDesc = selectedEvent.description || `সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা সংসদের আয়োজন। তারিখ: ${selectedEvent.date}, ভেন্যু: ${selectedEvent.venue}`;
      const uniqueUrl = `${window.location.origin}${window.location.pathname}?tab=events&eventId=${selectedEvent.id}`;

      // Sync address bar URL for sharing
      window.history.replaceState(null, '', uniqueUrl);

      const eventSchema = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": selectedEvent.title,
        "description": cleanDesc,
        "startDate": selectedEvent.date,
        "location": {
          "@type": "Place",
          "name": selectedEvent.venue,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Mymensingh",
            "addressCountry": "BD"
          }
        },
        "organizer": {
          "@type": "Organization",
          "name": "সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
          "url": typeof window !== 'undefined' ? window.location.origin : ''
        }
      };

      updateSEOMetadata({
        title: `${selectedEvent.title} | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা`,
        description: cleanDesc,
        type: 'event',
        url: uniqueUrl,
        schema: eventSchema
      });
    } else {
      const baseUrl = `${window.location.origin}${window.location.pathname}?tab=events`;
      window.history.replaceState(null, '', baseUrl);

      updateSEOMetadata({
        title: "আসন্ন ইভেন্ট ও কর্মসূচী | সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
        description: "ময়মনসিংহ জেলা সংসদের কর্মী সভা, রাজনৈতিক পাঠচক্র, প্রতিবাদী সমাবেশ ও সাংস্কৃতিক অনুষ্ঠানসমূহের বিস্তারিত বিবরণ এবং অংশগ্রহণ ফরম।",
        type: 'website',
        url: baseUrl
      });
    }
  }, [selectedEvent]);

  // Deep linking support for crawler indexing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('eventId');
    if (eventId && events && events.length > 0) {
      const found = events.find(e => e.id === eventId);
      if (found) setSelectedEvent(found);
    }
  }, [events]);

  // Dynamic Month & Calendar State (Defaulting to June 2026 from local context date)
  const [viewMode, setViewMode] = useState<'split' | 'calendar' | 'list'>('split');
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed)
  const [focusedDay, setFocusedDay] = useState<number | null>(13); // Default to current time date (13th)

  const banglaMonths = [
    'জানুয়ারি (January)',
    'ফেব্রুয়ারি (February)',
    'মার্চ (March)',
    'এপ্রিল (April)',
    'মে (May)',
    'জুন (June)',
    'জুলাই (July)',
    'আগস্ট (August)',
    'সেপ্টেম্বর (September)',
    'অক্টোবর (October)',
    'নভেম্বর (November)',
    'ডিসেম্বর (December)'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setFocusedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setFocusedDay(null);
  };

  // Automated Status Evaluator based on Real Clock Date
  const getEventCalculatedStatus = (eventDateStr: string): 'ended' | 'ongoing' | 'upcoming' => {
    if (!eventDateStr) return 'upcoming';
    
    // We get current date info 
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`; // formatted as "YYYY-MM-DD"

    if (eventDateStr < todayStr) {
      return 'ended';
    } else if (eventDateStr === todayStr) {
      return 'ongoing';
    } else {
      return 'upcoming';
    }
  };

  const getStatusLabelText = (status: 'ended' | 'ongoing' | 'upcoming') => {
    switch (status) {
      case 'ended':
        return 'সম্পন্ন (Ended)';
      case 'ongoing':
        return 'চলমান (Ongoing)';
      case 'upcoming':
        return 'আপকামিং (Upcoming)';
      default:
        return '';
    }
  };

  const getStatusBadgeStyle = (status: 'ended' | 'ongoing' | 'upcoming') => {
    switch (status) {
      case 'ended':
        return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850';
      case 'ongoing':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-250 dark:border-amber-900/40';
      case 'upcoming':
        return 'bg-emerald-50 text-emerald-805 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-150 dark:border-emerald-950/20';
      default:
        return '';
    }
  };

  const getEventsForDay = (dayNum: number) => {
    const yyyy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const targetDateStr = `${yyyy}-${mm}-${dd}`;
    return events.filter(e => e.date === targetDateStr);
  };

  // Dynamic Month Calculations (Saturday offset starting grid)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // JS standard: 0=Sun, ..., 6=Sat
  const startOffset = (firstDayIndex + 1) % 7;

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

      {/* Navigation Headers, View Switcher & Month Navigation selectors */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-8">
        {/* Toggle between views */}
        <div className="flex bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-md gap-1 order-2 sm:order-1">
          <button
            type="button"
            onClick={() => { setViewMode('split'); setFocusedDay(13); }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-sm transition cursor-pointer select-none text-center ${
              viewMode === 'split'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            সমন্বিত ড্যাশবোর্ড
          </button>
          
          <button
            type="button"
            onClick={() => { setViewMode('calendar'); if(!focusedDay) setFocusedDay(13); }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-sm transition cursor-pointer select-none text-center ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            মাসিক পঞ্জিকা গ্রিড
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-sm transition cursor-pointer select-none text-center ${
              viewMode === 'list'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            কর্মসূচী তালিকা
          </button>
        </div>

        {/* Month Navigation Panel - relevant for split/calendar modes */}
        {(viewMode === 'split' || viewMode === 'calendar') && (
          <div className="flex items-center justify-between sm:justify-start gap-2.5 order-1 sm:order-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition cursor-pointer"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-center font-bold px-4 font-sans text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900/60 py-1.5 rounded border border-zinc-200 dark:border-zinc-805/65 min-w-[155px] font-mono tracking-tight shadow-2xs">
              {banglaMonths[currentMonth]} {currentYear}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition cursor-pointer"
              title="পরবর্তী মাস"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* RENDER MODES */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Dynamic Calendar Widget (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-5 shadow-xs">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-zinc-100 dark:border-zinc-900">
                <div>
                  <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 font-sans flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping"></span>
                    <span>জেলা কর্মসূচি বর্ষপঞ্জী</span>
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-0.5">ময়মনসিংহ জেলা দপ্তর সেল • {banglaMonths[currentMonth]} {currentYear}</p>
                </div>
                <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-955/20 px-1.5 py-0.5 rounded font-mono">
                  ACTIVE CALENDAR
                </span>
              </div>

              {/* Saturday-First Header */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-zinc-500 mb-3.5 font-sans">
                <div className="text-rose-500/80 dark:text-rose-400/80">শনি</div>
                <div>রবি</div>
                <div>সোম</div>
                <div>মঙ্গল</div>
                <div>বুধ</div>
                <div>বৃহঃ</div>
                <div className="text-emerald-600 dark:text-emerald-400">শুক্র</div>
              </div>

              {/* Grid Box */}
              <div className="grid grid-cols-7 gap-1 font-mono text-xs">
                {/* Offset cells */}
                {Array.from({ length: startOffset }).map((_, idx) => (
                  <div key={`split-offset-${idx}`} className="aspect-square bg-zinc-50/20 dark:bg-zinc-900/10 border border-zinc-100/30 dark:border-zinc-900/10 rounded-xs"></div>
                ))}

                {/* Actual day cells */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dayEvents = getEventsForDay(dayNum);
                  const hasEvent = dayEvents.length > 0;
                  const isFocused = focusedDay === dayNum;

                  // Evaluate style based on status of first event
                  let customStyle = 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 border-zinc-150 dark:border-zinc-900/40';
                  if (hasEvent) {
                    const statusVal = getEventCalculatedStatus(dayEvents[0].date);
                    if (statusVal === 'ended') {
                      customStyle = 'bg-zinc-50 text-zinc-400 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100';
                    } else if (statusVal === 'ongoing') {
                      customStyle = 'bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 border-amber-250 dark:border-amber-900/30 font-extrabold hover:bg-amber-100/55';
                    } else {
                      customStyle = 'bg-rose-50 dark:bg-rose-950/25 text-rose-700 dark:text-rose-450 border-rose-200 dark:border-rose-900/40 font-extrabold hover:bg-rose-100/55';
                    }
                  }

                  if (isFocused) {
                    customStyle += ' ring-2 ring-rose-500 ring-offset-1 dark:ring-offset-black';
                  }

                  return (
                    <div
                      key={`split-day-${dayNum}`}
                      onClick={() => setFocusedDay(dayNum)}
                      className={`aspect-square p-1 sm:p-1.5 border rounded-xs flex flex-col justify-between transition duration-200 cursor-pointer ${customStyle}`}
                    >
                      <span className={`text-[11px] ${isFocused ? 'font-black dark:text-white' : ''}`}>
                        {dayNum}
                      </span>
                      {hasEvent && (
                        <div className="flex gap-0.5 justify-center mt-1">
                          {dayEvents.map(ev => {
                            const estatus = getEventCalculatedStatus(ev.date);
                            const dotColor = estatus === 'ended' ? 'bg-zinc-450' : estatus === 'ongoing' ? 'bg-amber-550 animate-ping' : 'bg-emerald-500';
                            return (
                              <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${dotColor}`} title={ev.title}></span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 items-center text-[10px] text-zinc-500 dark:text-zinc-400 font-sans border-t border-zinc-100 dark:border-zinc-900 pt-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-rose-500 dark:bg-rose-600 rounded-full inline-block"></span>
                  <span>আসন্ন কর্মসূচি</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block animate-pulse"></span>
                  <span>আজকের কর্মসূচী (চলমান)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-zinc-405 dark:bg-zinc-600 rounded-full inline-block"></span>
                  <span>সম্পন্ন হয়েছে (Ended)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Dynamic Event Details Panel for Selected Day (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {focusedDay !== null ? (
              <div>
                <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 border-b pb-2 mb-4 font-bold flex justify-between items-center">
                  <span>তারিখের কর্মসূচী বিবরণী</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-bold bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded text-[10px]">
                    {focusedDay} {banglaMonths[currentMonth].split(' ')[0]}
                  </span>
                </h3>

                {getEventsForDay(focusedDay).length > 0 ? (
                  <div className="space-y-4">
                    {getEventsForDay(focusedDay).map(event => {
                      const calculatedStatus = getEventCalculatedStatus(event.date);
                      const totalReg = (event.registrants || []).length;
                      return (
                        <div
                          key={event.id}
                          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-5 shadow-xs flex flex-col"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded font-sans tracking-wide ${getStatusBadgeStyle(calculatedStatus)}`}>
                              {getStatusLabelText(calculatedStatus)}
                            </span>
                            <span className="text-[10px] text-zinc-450 font-mono">{event.date}</span>
                          </div>

                          <h4 className="text-base font-extrabold text-zinc-855 dark:text-white leading-snug">
                            {event.title}
                          </h4>

                          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed my-3">
                            {event.description}
                          </p>

                          <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-900 pt-3.5 font-sans">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>সময়: {event.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span className="truncate">স্থান: {event.venue}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span>সদস্য সংহতি প্রকাশ: {totalReg} জন</span>
                            </div>
                          </div>

                          {calculatedStatus !== 'ended' && (
                            <button
                              type="button"
                              onClick={() => setSelectedEvent(event)}
                              className="mt-4 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer select-none"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>সংহতি ফরম যুক্ত করুন / প্রবেশ</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded p-6 text-center text-zinc-500 dark:text-zinc-400 space-y-2">
                    <Calendar className="w-7 h-7 mx-auto text-zinc-350 dark:text-zinc-650" />
                    <p className="text-xs font-sans">কমরেড, এই তারিখে কোনো রাজনৈতিক কর্মসূচি, রিডিং ক্লাস বা কর্মসূচি নির্ধারিত নেই।</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">পঞ্জিকার লাল বা রঙিন ঘর বিশিষ্ট তারিখগুলিতে ক্লিক করে কর্মসূচি বিবরণী দেখুন।</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-900 rounded p-6 text-center text-zinc-500 dark:text-zinc-400">
                <p className="text-xs font-sans">পঞ্জিকা ঘরের নির্দিষ্ট কোনো তারিখে ক্লিক করে কর্মসূচী বিবরণী দেখুন।</p>
              </div>
            )}
            
            {/* Sidebar Standard upcoming prompt */}
            <div className="bg-rose-50/50 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-900/30 p-4 rounded text-xs text-rose-800 dark:text-rose-450 leading-relaxed font-sans mt-3">
              <h5 className="font-bold flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-400">
                <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0" />
                <span>মৌলিক সংহতি প্রকাশ</span>
              </h5>
              <p className="text-[11px]">
                জনগণের শিক্ষার অধিকার, গণতান্ত্রিক ক্যাম্পাস গঠন এবং স্বৈরাচার বিরোধী ছাত্র আন্দোলনের মিছিলে শামিল হতে সরাসরি আপনার এলাকার ইভেন্টে নাম যোগ করুন।
              </p>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="space-y-6">
          {/* Expanded full width calendar board */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white font-sans flex items-center gap-2">
                  <Calendar className="text-rose-600 w-5 h-5" />
                  <span>মাসিক পঞ্জিকা গ্রিড (Full Month Grid View)</span>
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">District Secretariat Organizing Calendar • {banglaMonths[currentMonth]} {currentYear}</p>
              </div>
              <span className="text-xs font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded">
                পঞ্জিকা গ্রিড ইন্টারেক্টিভ
              </span>
            </div>

            {/* Calendar Grid Headers */}
            <div className="grid grid-cols-7 gap-2 text-center font-extrabold text-xs text-zinc-500 mb-3 font-sans uppercase">
              <div className="text-rose-600">শনিবার</div>
              <div>রবিবার</div>
              <div>সোমবার</div>
              <div>মঙ্গলবার</div>
              <div>বুধবার</div>
              <div>বৃহস্পতিবার</div>
              <div className="text-emerald-600 dark:text-emerald-400">শুক্রবার</div>
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-7 gap-2">
              {/* Offsets */}
              {Array.from({ length: startOffset }).map((_, idx) => (
                <div key={`full-offset-${idx}`} className="bg-zinc-50/30 dark:bg-zinc-900/10 border border-zinc-100/40 dark:border-zinc-900/10 rounded min-h-[75px] sm:min-h-[115px]"></div>
              ))}

              {/* Days slots */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dayEvents = getEventsForDay(dayNum);
                const hasEvent = dayEvents.length > 0;
                const isFocused = focusedDay === dayNum;

                let stateStyle = 'bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-900 text-zinc-850 dark:text-zinc-300';
                if (hasEvent) {
                  const calculatedEst = getEventCalculatedStatus(dayEvents[0].date);
                  if (calculatedEst === 'ended') {
                    stateStyle = 'bg-zinc-50/50 text-zinc-400 dark:bg-zinc-900/40 border-zinc-250 dark:border-zinc-850';
                  } else if (calculatedEst === 'ongoing') {
                    stateStyle = 'bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-205 border-amber-300 dark:border-amber-850 hover:bg-amber-50';
                  } else {
                    stateStyle = 'bg-rose-50/40 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-250 dark:border-rose-900/40 font-bold hover:bg-rose-100/30';
                  }
                }

                if (isFocused) {
                  stateStyle += ' ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-black shadow-xs pb-1';
                }

                return (
                  <div
                    key={`full-day-${dayNum}`}
                    onClick={() => setFocusedDay(dayNum)}
                    className={`min-h-[75px] sm:min-h-[115px] p-2.5 border rounded flex flex-col justify-between transition duration-200 cursor-pointer ${stateStyle}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-mono font-bold ${isFocused ? 'bg-rose-600 text-white rounded-full w-5.5 h-5.5 flex items-center justify-center shrink-0 shadow-md' : ''}`}>
                        {dayNum}
                      </span>
                      {hasEvent && (
                        <span className="flex gap-0.5 sm:gap-1">
                          {dayEvents.map(e => {
                            const eStat = getEventCalculatedStatus(e.date);
                            const dotColor = eStat === 'ended' ? 'bg-zinc-400' : eStat === 'ongoing' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500';
                            return (
                              <span key={e.id} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${dotColor}`} title={e.title}></span>
                            );
                          })}
                        </span>
                      )}
                    </div>

                    {/* Desktops event previews */}
                    {dayEvents.length > 0 && (
                      <div className="hidden sm:block mt-1.5 space-y-1">
                        {dayEvents.map(e => {
                          const eStat = getEventCalculatedStatus(e.date);
                          const fontClassName = eStat === 'ended' ? 'text-zinc-400 line-through' : eStat === 'ongoing' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold';
                          return (
                            <p key={e.id} className={`text-[10px] truncate leading-normal max-w-full font-sans ${fontClassName}`} title={e.title}>
                              • {e.title}
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expanded Bottom Day Details shelf */}
          {focusedDay !== null && (
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded p-6 mt-4">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-5 flex justify-between items-center flex-wrap gap-2 font-sans">
                <div className="flex items-center gap-2">
                  <Calendar className="text-rose-600 w-5 h-5 shrink-0" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {focusedDay} {banglaMonths[currentMonth]} - তারিখে নির্ধারিত কর্মসূচী বিস্তারিত পঞ্জিকা বিবরণ
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {currentYear}-{String(currentMonth + 1).padStart(2, '0')}-{String(focusedDay).padStart(2, '0')}
                </span>
              </div>

              {getEventsForDay(focusedDay).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getEventsForDay(focusedDay).map(event => {
                    const statusVal = getEventCalculatedStatus(event.date);
                    const totalReg = (event.registrants || []).length;
                    return (
                      <div key={event.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-5 flex flex-col justify-between shadow-xs">
                        <div>
                          <div className="flex items-center justify-between mb-3.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusBadgeStyle(statusVal)}`}>
                              {getStatusLabelText(statusVal)}
                            </span>
                            <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-zinc-450" />
                              {event.time}
                            </span>
                          </div>

                          <h5 className="text-base font-extrabold text-zinc-900 dark:text-white leading-snug mb-2.5">
                            {event.title}
                          </h5>

                          <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed mb-4">
                            {event.description}
                          </p>
                        </div>

                        <div className="border-t border-zinc-100 dark:border-zinc-900 pt-3.5 mt-2 space-y-2 text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="font-bold">আয়োজন স্থল: {event.venue}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>নিবন্ধনকারী বিপ্লবীদের সংখ্যা: {totalReg} জন</span>
                          </div>

                          {statusVal !== 'ended' && (
                            <button
                              type="button"
                              onClick={() => setSelectedEvent(event)}
                              className="mt-4 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
                            >
                              <Ticket className="w-4 h-4" />
                              <span>অংশগ্রহণ নিবন্ধন / ইমেইল সাবমিট করুন</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded space-y-1">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 font-sans">এই ক্যাবিনেট তারিখে কোনো রাজনৈতিক কর্মসূচী বা মিটিং সূচি পাওয়া যায়নি।</p>
                  <p className="text-[10px] text-zinc-450">অন্য কোনো লাল ডট বা রঙিন ঘর বিশিষ্ট তারিখে ক্লিক করে সূচি বিবরণ দেখুন।</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-400 font-extrabold">
              সব কর্মসূচীর কালানুক্রমিক সূচি তালিকা (All Events List View)
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">মোট কর্মসূচি: {events.length}</span>
          </div>

          <div className="space-y-5">
            {events.map((event) => {
              const statusVal = getEventCalculatedStatus(event.date);
              const totalReg = (event.registrants || []).length;
              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-rose-450/30 rounded-md p-6 transition flex flex-col shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded font-sans uppercase tracking-wide ${getStatusBadgeStyle(statusVal)}`}>
                      {getStatusLabelText(statusVal)}
                    </span>
                    <span className="text-xs text-zinc-550 dark:text-zinc-400 font-mono font-bold bg-zinc-50 dark:bg-zinc-900/40 px-2 py-0.5 rounded border border-zinc-150/40 dark:border-zinc-850/50">
                      {event.date}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white leading-snug">
                    {event.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-405 leading-relaxed my-3 font-sans">
                    {event.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-900 pt-3.5 mt-2 font-sans">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>সময়: {event.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="truncate" title={event.venue}>আয়োজন স্থল: {event.venue}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-zinc-450 shrink-0" />
                      <span>সক্রিয় সংহতি: {totalReg} জন আবেদনকারী</span>
                    </div>
                  </div>

                  {statusVal !== 'ended' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEvent(event);
                      }}
                      className="mt-5 w-fit px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer select-none"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>সংহতি ফরম যুক্ত করুন / সরাসরি প্রবেশ</span>
                    </button>
                  )}
                </div>
              );
            })}

            {events.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-10 bg-zinc-50 dark:bg-zinc-950 p-6 rounded">এই মুহূর্তে কোনো কর্মসূচি সূচি তালিকাভুক্ত নেই।</p>
            )}
          </div>
        </div>
      )}

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
