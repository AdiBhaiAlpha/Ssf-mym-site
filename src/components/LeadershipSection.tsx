import React, { useState } from 'react';
import { Award, Shield, Library, Users, ArrowRight, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { WebSettings } from '../types';

interface LeadershipSectionProps {
  settings: WebSettings;
}

export default function LeadershipSection({ settings }: LeadershipSectionProps) {
  const [activeCommittee, setActiveCommittee] = useState<'district' | 'executive' | 'units' | 'former'>('district');

  const districtCommittee = settings.leadersDistrict || [];
  const executiveCommittee = settings.leadersExecutive || [];
  const unitCommittees = settings.leadersUnits || [];
  const formerLeaders = settings.leadersFormer || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-805 pb-5 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
          <Shield className="text-rose-600 w-7 h-7" />
          <span>নেতৃত্ব ও সাংগঠনিক সংসদ</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
          সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা শাখার নির্বাচিত নেতৃত্ব ও সাবেক বিপ্লবীদের তালিকা
        </p>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-8 max-w-2xl mx-auto text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveCommittee('district')}
          className={`flex-1 text-center py-3 border-b-2 transition cursor-pointer ${
            activeCommittee === 'district'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-850 dark:hover:text-white'
          }`}
        >
          জেলা কমিটি
        </button>
        <button
          onClick={() => setActiveCommittee('executive')}
          className={`flex-1 text-center py-3 border-b-2 transition cursor-pointer ${
            activeCommittee === 'executive'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-855 dark:hover:text-white'
          }`}
        >
          জেলা সম্পাদকমণ্ডলী ও সদস্য
        </button>
        <button
          onClick={() => setActiveCommittee('units')}
          className={`flex-1 text-center py-3 border-b-2 transition cursor-pointer ${
            activeCommittee === 'units'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-855 dark:hover:text-white'
          }`}
        >
          শিক্ষা প্রতিষ্ঠান শাখা
        </button>
        <button
          onClick={() => setActiveCommittee('former')}
          className={`flex-1 text-center py-3 border-b-2 transition cursor-pointer ${
            activeCommittee === 'former'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-855 dark:hover:text-white'
          }`}
        >
          প্রাক্তন বিপ্লবী নেতৃবৃন্দ
        </button>
      </div>

      {/* Committee Grid Renders */}
      <div className="max-w-5xl mx-auto">
        {activeCommittee === 'district' && (
          <div className="space-y-6">
            <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-4 font-bold border-b pb-2">
              জেলা সংসদ নেতৃবৃন্দ (২০২৫-২০২৬ সেশন)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {districtCommittee.map((leader, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-5 text-center flex flex-col justify-between hover:border-rose-600/30 transition-all duration-300"
                >
                  <div className="flex justify-center mb-3">
                    <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg">
                      {leader.name[0]}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">{leader.name}</h4>
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-500 mt-1">{leader.role}</p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-1 dark:text-zinc-500 truncate">{leader.inst}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeCommittee === 'executive' && (
          <div className="space-y-6">
            <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-4 font-bold border-b pb-2">
              জেলা কার্যকরী পরিষদ ও সাধারণ সদস্যবৃন্দ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {executiveCommittee.map((leader, index) => (
                <div
                  key={index}
                  className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-zinc-150 dark:border-zinc-850 rounded flex items-center space-x-3"
                >
                  <UserCheck className="w-5 h-5 text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-zinc-805 dark:text-white truncate">{leader.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{leader.role} • {leader.inst}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeCommittee === 'units' && (
          <div className="space-y-6">
            <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-4 font-bold border-b pb-2">
              শিক্ষাঙ্গন ও থানা শাখা কমিটিসমূহ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {unitCommittees.map((unit, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-5 space-y-4"
                >
                  <h4 className="text-sm font-bold text-rose-650 dark:text-rose-450 border-l-2 border-rose-600 pl-2.5 font-sans">
                    {unit.unitName}
                  </h4>

                  <div className="space-y-2.5">
                    {unit.leaders.map((leader, lidx) => (
                      <div key={lidx} className="flex justify-between items-center text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xs font-sans">
                        <span className="font-bold">{leader.name}</span>
                        <span className="text-zinc-505 font-mono">{leader.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeCommittee === 'former' && (
          <div className="space-y-6">
            <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-4 font-bold border-b pb-2">
              গর্বিত সাবেক ছাত্র ফ্রন্ট নেতৃত্ব ও বর্তমান অবদান
            </h3>

            <div className="space-y-4">
              {formerLeaders.map((leader, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 inline-block"></span>
                      <span>{leader.name}</span>
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-sans">
                      {leader.contribution}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 px-2.5 py-1 rounded shrink-0 self-start md:self-auto">
                    নেতৃত্বকাল: {leader.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
