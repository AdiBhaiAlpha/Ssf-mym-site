import React from 'react';
import { BookOpen, Scale, Award, FileText, CheckCircle2, Users, ArrowRight } from 'lucide-react';
import { WebSettings, OrgWing } from '../types';

interface AboutUsProps {
  settings: WebSettings;
  organizations: OrgWing[];
}

export default function AboutUs({ settings, organizations }: AboutUsProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-805 pb-5 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
          <BookOpen className="text-rose-600 w-7 h-7" />
          <span>আমাদের লক্ষ্য, মূলনীতি ও গৌরবোজ্জ্বল ইতিহাস</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
          সমাজতান্ত্রিক ছাত্র ফ্রন্টের তাত্ত্বিক ঘোষণা, সংবিধানের রুপরেখা ও ময়মনসিংহের বৈপ্লবিক ইতিহাস
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-12">
        {/* Left Column (8 cols): History and Constitution details */}
        <div className="md:col-span-8 space-y-8">
          
          <section className="bg-white dark:bg-zinc-950 p-6 sm:p-8 border rounded shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-rose-650 dark:text-rose-400 border-b pb-2 mb-4 font-sans flex items-center gap-2">
              <Scale className="w-5 h-5 text-rose-600" />
              <span>ঐতিহাসিক ঘোষণা ও সূচনা ইতিহাস</span>
            </h2>
            <div className="text-sm leading-relaxed font-sans space-y-4 text-zinc-700 dark:text-zinc-300">
              {settings.aboutText ? (
                <div className="whitespace-pre-wrap">{settings.aboutText}</div>
              ) : (
                <>
                  <p>
                    সমাজতান্ত্রিক ছাত্র ফ্রন্ট বাংলাদেশের একটি অন্যতম শীর্ষস্থানীয় বিপ্লবী ছাত্র সংগঠন। ১৯৮৪ সালের ২১শে আগস্ট ছাত্র সমাজের শিক্ষার স্বার্থ ও সমাজের মুক্তির প্রহর হিসেবে এই গৌরবময় প্রগতিশীল সংগঠনটির জন্ম হয়।
                  </p>
                  <p>
                    মার্ক্সবাদ ও লেনিনবাদ সম্মত বৈজ্ঞানিক সমাজতন্ত্রের আদর্শ ও মূলনীতির আলোকবর্তিতা নিয়ে আমাদের এই বীরত্বগাথা যাত্রা। ময়মনসিংহে সমাজতান্ত্রিক ছাত্র ফ্রন্ট আনন্দ মোহন কলেজ শাখার হাত ধরে জেলা জুড়ে প্রগতিশীল পাঠচক্র, শিক্ষাঙ্গনে আবাসন ও লাইব্রেরি আন্দোলন গড়ে তুলেছিল।
                  </p>
                  <p>
                    শাসকগোষ্ঠীর শিক্ষাকে পণ্য বানানোর প্রতিটি সাম্রাজ্যবাদী শিক্ষানীতির বিরুদ্ধে সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহে অবিরত প্রতিরোধ গড়ে তুলছে। টাউন হল মোড়ের ছাত্র সমাবেশ এবং গাঙ্গীবাড়ীর মোড়ে সাধারণ মেহনতি শিক্ষার্থীদের সাথে আন্দোলন আমাদের আজন্ম অনুপ্রেরণা।
                  </p>
                </>
              )}
            </div>
          </section>

          {/* New Section: What We Do (দল ও সংগঠন সম্পর্কে) */}
          <section className="bg-white dark:bg-zinc-950 p-6 sm:p-8 border rounded shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-rose-650 dark:text-rose-400 border-b pb-2 mb-4 font-sans flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-rose-600" />
              <span>আমাদের দল ও সংগঠন সম্পর্কে: আমরা যা করি (What We Do)</span>
            </h2>
            <div className="text-sm leading-relaxed font-sans space-y-4 text-zinc-700 dark:text-zinc-350">
              <p className="font-semibold text-rose-600 dark:text-rose-400">
                এই দল বৈজ্ঞানিক সমাজতন্ত্রের (অর্থাৎ মার্ক্সবাদ-লেনিনবাদ) নীতি ও আদর্শের ভিত্তিতে বাংলাদেশে শোষণমুক্ত সমাজতান্ত্রিক সমাজ প্রতিষ্ঠার আন্দোলন গড়ে তুলবে।
              </p>
              <p>
                দলটি তার কমিউনিস্ট আদর্শে অবিচল থাকবে এবং সব ধরনের বৈষম্য, শোষণ, লুণ্ঠন, উৎপীড়ন, স্বৈরতন্ত্র, কুশাসন, সাম্প্রদায়িকতা এবং সকল প্রকার অনগ্রসর ও জনবিরোধী কর্মকাণ্ডের বিরুদ্ধে সংগ্রাম অব্যাহত রাখবে।
              </p>
              <p>
                ভাসা ভাসা বুর্জোয়া আনুষ্ঠানিক গণতন্ত্রের পরিবর্তে, এই দল শোষিত ও মেহনতি সংখ্যাগরিষ্ঠ মানুষের জন্য প্রকৃত গণতন্ত্র অর্থাৎ সর্বহারা সমাজতান্ত্রিক গণতন্ত্র প্রতিষ্ঠার লড়াই করবে। পুঁজিবাদী-সাম্রাজ্যবাদী শোষণ ও লুণ্ঠনের বিরুদ্ধে লড়াইয়ের পাশাপাশি বর্ণবাদ এবং লিঙ্গবৈষম্য, ধর্মীয় ও জাতিগত নিপীড়ন, সাম্প্রদায়িকতা, আঞ্চলিকতাবাদ এবং সমস্ত প্রতিক্রিয়াশীল ও পশ্চাৎপদ ভাবাদর্শের বিরুদ্ধে দল তার নিরবচ্ছিন্ন সংগ্রাম চালিয়ে যাবে।
              </p>
              <p>
                তাছাড়া, বিশ্বজুড়ে সাম্রাজ্যবাদী প্রভাবমুক্ত ধর্মনিরপেক্ষ, গণতান্ত্রিক সমাজ ও রাষ্ট্রব্যবস্থা গড়ে তোলার এবং শোষণমুক্ত সমাজতান্ত্রিক সমাজ বিনির্মাণে জনগণের আকাঙ্ক্ষা বাস্তবায়নে এই দল সদা প্রতিশ্রুতিবদ্ধ থাকবে।
              </p>
            </div>
          </section>

          <section className="bg-white dark:bg-zinc-950 p-6 sm:p-8 border rounded shadow-xs">
            <h2 className="text-base sm:text-lg font-bold text-rose-650 dark:text-rose-400 border-b pb-2 mb-4 font-sans flex items-center gap-2">
              <FileText className="text-rose-600 w-5 h-5" />
              <span>সাংগঠনিক ঘোষণা ও মূলনীতি</span>
            </h2>
            <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
              {settings.constitutionalHeader || 'সংগঠনের ঘোষণা ও গঠনতান্ত্রিক ধারা সমূহ শিগগিরই আপডেট করা হবে।'}
            </div>
          </section>

        </div>

        {/* Right Column (4 cols): Mission and Vision */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Mission */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-6 rounded">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1.5 font-sans mb-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>আমাদের মূল উদ্দেশ্য (Mission)</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed font-sans">
              {settings.missionText}
            </p>
          </div>

          {/* Vision */}
          <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-6 rounded">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1.5 font-sans mb-3">
              <Award className="w-4 h-4 shrink-0" />
              <span>আমাদের রূপকল্প (Vision)</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed font-sans">
              {settings.visionText}
            </p>
          </div>

          {/* Slogans sidebar decoration */}
          <div className="border border-zinc-250 dark:border-zinc-800 p-5 rounded font-sans text-center bg-white dark:bg-zinc-950">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">সাংগঠনিক ৪ অঙ্গীকার</p>
            <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 space-y-2 text-left">
              <p>১. আমৃত্যু পুঁজিবাদ ও নারী আগ্রাসন বিরুদ্ধাচারণ।</p>
              <p>২. শিক্ষাঙ্গনে সন্ত্রাস ও দখলদারিত্ব রুখে দাঁড়ানো।</p>
              <p>৩. বিজ্ঞানমনস্ক বৈষম্যহীন দালিলিক একমুখী শিক্ষা সমর্থন।</p>
              <p>৪. শ্রমজীবী ও মেহনতি মানুষের সামগ্রিক মুক্তি লড়াই জোরদার করা।</p>
            </div>
          </div>

        </div>
      </div>

      {/* Associated organizations grid section (অঙ্গসংগঠন সমূহ) */}
      <section className="border-t border-zinc-200 dark:border-zinc-900 pt-10">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-905 dark:text-white flex items-center justify-center gap-2">
            <Users className="text-rose-600 w-6 h-6" />
            <span>অন্যান্য অঙ্গসংগঠন সমূহ (Organizations)</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-sans max-w-2xl mx-auto">
            বাংলাদেশের সমাজতান্ত্রিক দল (বাসদ)-এর বিভিন্ন শ্রেণী ও পেশা ভিত্তিক অঙ্গসংগঠন এবং তাদের ময়মনসিংহ জেলা শাখা সমূহের তালিকা
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {organizations.map((org) => (
            <div 
              key={org.id} 
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-5 flex flex-col items-center text-center shadow-xs hover:border-rose-400/40 transition duration-300 group"
            >
              <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-full border border-zinc-100 dark:border-zinc-850 flex items-center justify-center mb-4 overflow-hidden shadow-xs shrink-0">
                {org.logo ? (
                  <img 
                    src={org.logo} 
                    alt={org.nameBangla} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-2" 
                  />
                ) : (
                  <div className="text-rose-600 dark:text-rose-500 font-bold text-xl select-none uppercase font-mono bg-rose-50/50 dark:bg-rose-950/20 w-full h-full flex items-center justify-center">
                    {org.nameEnglish.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-150 group-hover:text-rose-600 transition duration-150">
                {org.nameBangla}
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-1 leading-tight">
                {org.nameEnglish}
              </p>
              
              <div className="mt-auto pt-4 w-full border-t border-zinc-100 dark:border-zinc-900 text-[10px] flex items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400">
                <span>বাসদ শ্রেণী সংগঠন</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
