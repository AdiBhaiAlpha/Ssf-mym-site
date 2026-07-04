export interface TemplatePreset {
  id: number;
  name: string;
  tag: string;
  theme: 'light' | 'dark' | 'cream';
  bg: string; // solid, gradient, noise, geometric, paper
  color: string; // accent color
  font: 'sans' | 'serif' | 'mono';
  img: 'top' | 'left' | 'background' | 'hidden';
  border: string; // none, vintage, double, neon-glow, thin-red
  align: 'left' | 'center' | 'right' | 'justified';
  slogan: string;
  ratio: string; // 1:1, 4:5, 9:16, 16:9
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  { id: 1, name: '🔴 ব্রেকিং নিউজ (Breaking News)', tag: 'BREAKING', theme: 'dark', bg: 'solid', color: '#B3002D', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: '🔴 ব্রেকিং নিউজ', ratio: '1:1' },
  { id: 2, name: '📖 ম্যাগাজিন কভার (Magazine Cover)', tag: 'MAGAZINE', theme: 'cream', bg: 'gradient', color: '#B3002D', font: 'serif', img: 'background', border: 'vintage', align: 'center', slogan: 'বিশেষ সংখ্যা', ratio: '4:5' },
  { id: 3, name: '🖋️ মডার্ন মিনিমাল (Modern Minimal)', tag: 'MINIMAL', theme: 'light', bg: 'solid', color: '#111827', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: '', ratio: '1:1' },
  { id: 4, name: '🟦 স্কয়ার সোশ্যাল (Square Social)', tag: 'SOCIAL_SQ', theme: 'dark', bg: 'gradient', color: '#B3002D', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'সামাজিক যোগাযোগ মাধ্যম', ratio: '1:1' },
  { id: 5, name: '📱 ফেসবুক পোর্ট্রেট (Facebook Feed)', tag: 'FB_FEED', theme: 'dark', bg: 'noise', color: '#B3002D', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'ফেসবুক আপডেট', ratio: '4:5' },
  { id: 6, name: '📸 ইনস্টাগ্রাম স্টাইল (Instagram Post)', tag: 'IG_FEED', theme: 'light', bg: 'geometric', color: '#dc2626', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'ফটো পোস্ট', ratio: '4:5' },
  { id: 7, name: '🖥️ ল্যান্ডস্কেপ ব্যানার (Landscape Banner)', tag: 'BANNER', theme: 'light', bg: 'solid', color: '#B3002D', font: 'sans', img: 'left', border: 'none', align: 'left', slogan: 'অনলাইন সংস্করণ', ratio: '16:9' },
  { id: 8, name: '🌌 ডার্ক কসমিক (Cosmic Dark)', tag: 'COSMIC', theme: 'dark', bg: 'gradient', color: '#ea580c', font: 'sans', img: 'top', border: 'neon-glow', align: 'left', slogan: 'কসমিক বুলেটিন', ratio: '1:1' },
  { id: 9, name: '📜 অফিশিয়াল ক্রিম (Official Vintage)', tag: 'OFFICIAL_CRM', theme: 'cream', bg: 'paper', color: '#B3002D', font: 'serif', img: 'top', border: 'double', align: 'left', slogan: 'অফিসিয়াল নথিপত্র', ratio: '1:1' },
  { id: 10, name: '📢 অফিশিয়াল বিবৃতি (Statement)', tag: 'STATEMENT', theme: 'light', bg: 'solid', color: '#B3002D', font: 'serif', img: 'hidden', border: 'none', align: 'center', slogan: 'প্রেস বিজ্ঞপ্তি / বিবৃতি', ratio: '1:1' },
  { id: 11, name: '📰 সম্পাদকীয় কলাম (Editorial News)', tag: 'EDITORIAL', theme: 'cream', bg: 'paper', color: '#111827', font: 'serif', img: 'left', border: 'vintage', align: 'justified', slogan: 'সম্পাদকীয় কলাম', ratio: '16:9' },
  { id: 12, name: '🏢 করপোরেট রিপোর্ট (Corporate Style)', tag: 'CORPORATE', theme: 'light', bg: 'geometric', color: '#1d4ed8', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'বার্ষিক প্রতিবেদন', ratio: '1:1' },
  { id: 13, name: '🏛️ সরকারি নোটিশ (Govt Notice)', tag: 'GOVT_NOTICE', theme: 'light', bg: 'solid', color: '#16a34a', font: 'serif', img: 'hidden', border: 'double', align: 'center', slogan: 'জরুরি সার্কুলার', ratio: '1:1' },
  { id: 14, name: '🗳️ রাজনৈতিক বিবৃতি (Political Poster)', tag: 'POLITICAL', theme: 'dark', bg: 'gradient', color: '#dc2626', font: 'sans', img: 'background', border: 'thin-red', align: 'center', slogan: 'বিপ্লবী শুভেচ্ছা ও লাল সালাম', ratio: '9:16' },
  { id: 15, name: '📍 অনুষ্ঠান কাভারেজ (Event Coverage)', tag: 'EVENT_COV', theme: 'light', bg: 'gradient', color: '#ea580c', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'সরাসরি কাভারেজ', ratio: '1:1' },
  { id: 16, name: '📣 সামাজিক সচেতনতা (Awareness)', tag: 'AWARENESS', theme: 'dark', bg: 'gradient', color: '#e11d48', font: 'sans', img: 'top', border: 'none', align: 'center', slogan: 'জনসচেতনতামূলক বার্তা', ratio: '9:16' },
  { id: 17, name: '🎓 ছাত্র কার্যক্রম (Student Activity)', tag: 'STUDENT_ACT', theme: 'light', bg: 'noise', color: '#B3002D', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'ছাত্র ফ্রন্ট কার্যক্রম', ratio: '1:1' },
  { id: 18, name: '📚 গ্রন্থাগার ও প্রকাশনা (Library Book)', tag: 'LIBRARY', theme: 'cream', bg: 'paper', color: '#854d0e', font: 'serif', img: 'left', border: 'vintage', align: 'left', slogan: '', ratio: '4:5' },
  { id: 19, name: '🔬 গবেষণা ও রিপোর্ট (Research)', tag: 'RESEARCH', theme: 'light', bg: 'geometric', color: '#0f766e', font: 'mono', img: 'top', border: 'none', align: 'left', slogan: 'গবেষণা ও জরীপ', ratio: '1:1' },
  { id: 20, name: '📢 ঘোষণা বোর্ড (Announcement)', tag: 'ANNOUNCEMENT', theme: 'cream', bg: 'solid', color: '#ea580c', font: 'sans', img: 'hidden', border: 'vintage', align: 'center', slogan: 'জরুরি সাধারণ ঘোষণা', ratio: '1:1' },
  { id: 21, name: '📊 রিপোর্ট ও তথ্যচিত্র (Insights)', tag: 'INSIGHTS', theme: 'dark', bg: 'gradient', color: '#16a34a', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'পরিসংখ্যান ও বিশ্লেষণ', ratio: '1:1' }
];

export class TemplateEngine {
  public static getTemplates(): TemplatePreset[] {
    return TEMPLATE_PRESETS;
  }

  public static getTemplateById(id: number): TemplatePreset | undefined {
    return TEMPLATE_PRESETS.find(p => p.id === id);
  }
}
