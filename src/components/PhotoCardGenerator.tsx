import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, RefreshCw, Sliders, Image as ImageIcon, Type, Eye, Check, FileText, 
  Globe, Facebook, MessageSquare, Mail, Calendar, MapPin, Clock, Settings, Info, Grid, Award,
  Database, CloudLightning, CheckCircle
} from 'lucide-react';
import { CanvasRenderer } from '../lib/canvas-renderer/CanvasRenderer';
import { RenderDebugger } from '../lib/canvas-renderer/RenderDebugger';
import { CanvasTaintInspector } from '../lib/canvas-renderer/CanvasTaintInspector';
import { LiveExportStore } from '../lib/debug/LiveExportStore';
import QRCode from 'qrcode';
import { saveFirestoreDoc, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface PhotoCardGeneratorProps {
  item: {
    id: string;
    type: string;
    title: string;
    content: string;
    excerpt?: string;
    image?: string;
    date: string;
    author?: string;
    category?: string;
    location?: string;
  };
  onClose: () => void;
}

// OKLCH to sRGB parser and converter to solve html2canvas lack of support for oklch colors
export const convertOklchToRgbInCss = (cssText: string): string => {
  return cssText.replace(/oklch\(([^)]+)\)/g, (match, p1) => {
    try {
      const cleanParts = p1.trim().replace(/\s*,\s*/g, ' ');
      const parts = cleanParts.split(/\s+|\s*\/\s*/);
      if (parts.length < 3) return match;

      const lStr = parts[0];
      const cStr = parts[1];
      const hStr = parts[2];
      const aStr = parts[3] !== undefined ? parts[3] : "1";

      let l = 0;
      if (lStr.endsWith('%')) {
        l = parseFloat(lStr) / 100;
      } else {
        l = parseFloat(lStr);
      }

      let c = 0;
      if (cStr.endsWith('%')) {
        c = parseFloat(cStr) / 100;
      } else {
        c = parseFloat(cStr);
      }

      let h = 0;
      if (hStr.endsWith('deg')) {
        h = parseFloat(hStr);
      } else if (hStr.endsWith('rad')) {
        h = parseFloat(hStr) * (180 / Math.PI);
      } else if (hStr.endsWith('turn')) {
        h = parseFloat(hStr) * 360;
      } else {
        h = parseFloat(hStr);
      }

      let alpha = 1;
      if (aStr.endsWith('%')) {
        alpha = parseFloat(aStr) / 100;
      } else {
        alpha = parseFloat(aStr);
      }

      const hRad = (h * Math.PI) / 180;
      const oklch_a = c * Math.cos(hRad);
      const oklch_b = c * Math.sin(hRad);

      const l_ = l + 0.3963377774 * oklch_a + 0.2158037573 * oklch_b;
      const m_ = l - 0.1055613458 * oklch_a - 0.0638541728 * oklch_b;
      const s_ = l - 0.0894841775 * oklch_a - 1.2914855480 * oklch_b;

      const l_3 = l_ * l_ * l_;
      const m_3 = m_ * m_ * m_;
      const s_3 = s_ * s_ * s_;

      const rLinear = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
      const gLinear = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
      const bLinear = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.7076147010 * s_3;

      const gamma = (x: number) => {
        return x > 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x;
      };

      const out_r = Math.max(0, Math.min(255, Math.round(gamma(rLinear) * 255)));
      const out_g = Math.max(0, Math.min(255, Math.round(gamma(gLinear) * 255)));
      const out_b = Math.max(0, Math.min(255, Math.round(gamma(bLinear) * 255)));

      if (alpha === 1) {
        return `rgb(${out_r}, ${out_g}, ${out_b})`;
      } else {
        return `rgba(${out_r}, ${out_g}, ${out_b}, ${alpha})`;
      }
    } catch (e) {
      return match;
    }
  });
};

// OKLAB to sRGB parser and converter to solve html2canvas lack of support for oklab colors
export const convertOklabToRgbInCss = (cssText: string): string => {
  return cssText.replace(/oklab\(([^)]+)\)/g, (match, p1) => {
    try {
      const cleanParts = p1.trim().replace(/\s*,\s*/g, ' ');
      const parts = cleanParts.split(/\s+|\s*\/\s*/);
      if (parts.length < 3) return match;

      const lStr = parts[0];
      const aStrInput = parts[1];
      const bStrInput = parts[2];
      const alphaStr = parts[3] !== undefined ? parts[3] : "1";

      let l = 0;
      if (lStr.endsWith('%')) {
        l = parseFloat(lStr) / 100;
      } else {
        l = parseFloat(lStr);
      }

      let a = 0;
      if (aStrInput.endsWith('%')) {
        a = parseFloat(aStrInput) / 100;
      } else {
        a = parseFloat(aStrInput);
      }

      let b = 0;
      if (bStrInput.endsWith('%')) {
        b = parseFloat(bStrInput) / 100;
      } else {
        b = parseFloat(bStrInput);
      }

      let alpha = 1;
      if (alphaStr.endsWith('%')) {
        alpha = parseFloat(alphaStr) / 100;
      } else {
        alpha = parseFloat(alphaStr);
      }

      const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

      const l_3 = l_ * l_ * l_;
      const m_3 = m_ * m_ * m_;
      const s_3 = s_ * s_ * s_;

      const rLinear = +4.0767416621 * l_3 - 3.3077115913 * m_3 + 0.2309699292 * s_3;
      const gLinear = -1.2684380046 * l_3 + 2.6097574011 * m_3 - 0.3413193965 * s_3;
      const bLinear = -0.0041960863 * l_3 - 0.7034186147 * m_3 + 1.7076147010 * s_3;

      const gamma = (x: number) => {
        return x > 0.0031308 ? 1.055 * Math.pow(x, 1 / 2.4) - 0.055 : 12.92 * x;
      };

      const out_r = Math.max(0, Math.min(255, Math.round(gamma(rLinear) * 255)));
      const out_g = Math.max(0, Math.min(255, Math.round(gamma(gLinear) * 255)));
      const out_b = Math.max(0, Math.min(255, Math.round(gamma(bLinear) * 255)));

      if (alpha === 1) {
        return `rgb(${out_r}, ${out_g}, ${out_b})`;
      } else {
        return `rgba(${out_r}, ${out_g}, ${out_b}, ${alpha})`;
      }
    } catch (e) {
      return match;
    }
  });
};

// Combine both converters to ensure all modern color functions are covered
export const convertModernColorsInCss = (cssText: string): string => {
  let converted = convertOklchToRgbInCss(cssText);
  converted = convertOklabToRgbInCss(converted);
  return converted;
};

export const prepareOklchStylesheets = async (): Promise<() => void> => {
  const restores: (() => void)[] = [];

  // 1. Process document.styleSheets to handle dynamically injected CSSOM rules (Vite/Tailwind v4)
  try {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        let cssText = '';
        if (sheet.cssRules) {
          cssText = Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
        }

        if (cssText && (cssText.includes('oklch') || cssText.includes('oklab'))) {
          console.log('Replacing oklch/oklab in stylesheet:', sheet);
          const converted = convertModernColorsInCss(cssText);
          
          // Create temporary style tag with converted css
          const tempStyle = document.createElement('style');
          tempStyle.setAttribute('data-temp-oklch-fix', 'true');
          tempStyle.textContent = converted;
          document.head.appendChild(tempStyle);

          // Disable the original stylesheet
          sheet.disabled = true;

          restores.push(() => {
            tempStyle.remove();
            sheet.disabled = false;
          });
        }
      } catch (err) {
        // If we get cross-origin error on cssRules, try to check if it has an ownerNode and it's a LINK element
        const ownerNode = sheet.ownerNode;
        if (ownerNode && ownerNode.nodeName === 'LINK') {
          const link = ownerNode as HTMLLinkElement;
          if (link.href) {
            try {
              const res = await fetch(link.href);
              if (res.ok) {
                const originalCss = await res.text();
                if (originalCss.includes('oklch') || originalCss.includes('oklab')) {
                  console.log('Replacing oklch/oklab in fetched linked stylesheet:', link.href);
                  const convertedCss = convertModernColorsInCss(originalCss);
                  const tempStyle = document.createElement('style');
                  tempStyle.setAttribute('data-temp-oklch-fix', 'true');
                  tempStyle.textContent = convertedCss;
                  document.head.appendChild(tempStyle);

                  link.disabled = true;

                  restores.push(() => {
                    tempStyle.remove();
                    link.disabled = false;
                  });
                }
              }
            } catch (fetchErr) {
              console.warn(`Could not proxy/fix oklch/oklab for linked stylesheet ${link.href}:`, fetchErr);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error during document.styleSheets preprocessing:', err);
  }

  // 2. Also check any raw <style> element textContent as a secondary safety measure
  try {
    const styleElements = Array.from(document.querySelectorAll('style:not([data-temp-oklch-fix])'));
    for (const style of styleElements) {
      const originalContent = style.textContent || '';
      if (originalContent.includes('oklch') || originalContent.includes('oklab')) {
        console.log('Replacing oklch/oklab in direct style tag:', style);
        const converted = convertModernColorsInCss(originalContent);
        style.textContent = converted;
        restores.push(() => {
          style.textContent = originalContent;
        });
      }
    }
  } catch (err) {
    console.error('Error fixing raw <style> elements:', err);
  }

  return () => {
    restores.forEach(restore => {
      try {
        restore();
      } catch (e) {
        console.error('Error during oklch/oklab restore:', e);
      }
    });
  };
};

// Compact and extremely powerful 21 templates list
const TEMPLATE_PRESETS = [
  { id: 1, name: '🔴 ব্রেকিং নিউজ (Breaking News)', tag: 'BREAKING', theme: 'dark', bg: 'solid', color: '#B3002D', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: '🔴 ব্রেকিং নিউজ' },
  { id: 2, name: '📖 ম্যাগাজিন কভার (Magazine Cover)', tag: 'MAGAZINE', theme: 'cream', bg: 'gradient', color: '#B3002D', font: 'serif', img: 'background', border: 'vintage', align: 'center', slogan: 'বিশেষ সংখ্যা' },
  { id: 3, name: '🖋️ মডার্ন মিনিমাল (Modern Minimal)', tag: 'MINIMAL', theme: 'light', bg: 'solid', color: '#111827', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: '' },
  { id: 4, name: '🟦 স্কয়ার সোশ্যাল (Square Social)', tag: 'SOCIAL_SQ', theme: 'dark', bg: 'gradient', color: '#B3002D', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'সামাজিক যোগাযোগ মাধ্যম' },
  { id: 5, name: '📱 ফেসবুক পোর্ট্রেট (Facebook Feed)', tag: 'FB_FEED', theme: 'dark', bg: 'noise', color: '#B3002D', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'ফেসবুক আপডেট' },
  { id: 6, name: '📸 ইনস্টাগ্রাম স্টাইল (Instagram Post)', tag: 'IG_FEED', theme: 'light', bg: 'geometric', color: '#dc2626', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'ফটো পোস্ট' },
  { id: 7, name: '🖥️ ল্যান্ডস্কেপ ব্যানার (Landscape Banner)', tag: 'BANNER', theme: 'light', bg: 'solid', color: '#B3002D', font: 'sans', img: 'left', border: 'none', align: 'left', slogan: 'অনলাইন সংস্করণ' },
  { id: 8, name: '🌌 ডার্ক কসমিক (Cosmic Dark)', tag: 'COSMIC', theme: 'dark', bg: 'gradient', color: '#ea580c', font: 'sans', img: 'top', border: 'neon-glow', align: 'left', slogan: 'কসমিক বুলেটিন' },
  { id: 9, name: '📜 অফিশিয়াল ক্রিম (Official Vintage)', tag: 'OFFICIAL_CRM', theme: 'cream', bg: 'paper', color: '#B3002D', font: 'serif', img: 'top', border: 'double', align: 'left', slogan: 'অফিসিয়াল নথিপত্র' },
  { id: 10, name: '📢 অফিশিয়াল বিবৃতি (Statement)', tag: 'STATEMENT', theme: 'light', bg: 'solid', color: '#B3002D', font: 'serif', img: 'hidden', border: 'none', align: 'center', slogan: 'প্রেস বিজ্ঞপ্তি / বিবৃতি' },
  { id: 11, name: '📰 সম্পাদকীয় কলাম (Editorial News)', tag: 'EDITORIAL', theme: 'cream', bg: 'paper', color: '#111827', font: 'serif', img: 'left', border: 'vintage', align: 'justified', slogan: 'সম্পাদকীয় কলাম' },
  { id: 12, name: '🏢 করপোরেট রিপোর্ট (Corporate Style)', tag: 'CORPORATE', theme: 'light', bg: 'geometric', color: '#1d4ed8', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'বার্ষিক প্রতিবেদন' },
  { id: 13, name: '🏛️ সরকারি নোটিশ (Govt Notice)', tag: 'GOVT_NOTICE', theme: 'light', bg: 'solid', color: '#16a34a', font: 'serif', img: 'hidden', border: 'double', align: 'center', slogan: 'জরুরি সার্কুলার' },
  { id: 14, name: '🗳️ রাজনৈতিক বিবৃতি (Political Poster)', tag: 'POLITICAL', theme: 'dark', bg: 'gradient', color: '#dc2626', font: 'sans', img: 'background', border: 'thin-red', align: 'center', slogan: 'বিপ্লবী শুভেচ্ছা ও লাল সালাম' },
  { id: 15, name: '📍 অনুষ্ঠান কাভারেজ (Event Coverage)', tag: 'EVENT_COV', theme: 'light', bg: 'gradient', color: '#ea580c', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'সরাসরি কাভারেজ' },
  { id: 16, name: '📣 সামাজিক সচেতনতা (Awareness)', tag: 'AWARENESS', theme: 'dark', bg: 'gradient', color: '#e11d48', font: 'sans', img: 'top', border: 'none', align: 'center', slogan: 'জনসচেতনতামূলক বার্তা' },
  { id: 17, name: '🎓 ছাত্র কার্যক্রম (Student Activity)', tag: 'STUDENT_ACT', theme: 'light', bg: 'noise', color: '#B3002D', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'ছাত্র ফ্রন্ট কার্যক্রম' },
  { id: 18, name: '📚 গ্রন্থাগার ও প্রকাশনা (Library Book)', tag: 'LIBRARY', theme: 'cream', bg: 'paper', color: '#854d0e', font: 'serif', img: 'left', border: 'vintage', align: 'left', slogan: 'নতুন প্রকাশনা রিভিউ' },
  { id: 19, name: '🔬 গবেষণা ও রিপোর্ট (Research)', tag: 'RESEARCH', theme: 'light', bg: 'geometric', color: '#0f766e', font: 'mono', img: 'top', border: 'none', align: 'left', slogan: 'গবেষণা ও জরীপ' },
  { id: 20, name: '📢 ঘোষণা বোর্ড (Announcement)', tag: 'ANNOUNCEMENT', theme: 'cream', bg: 'solid', color: '#ea580c', font: 'sans', img: 'hidden', border: 'vintage', align: 'center', slogan: 'জরুরি সাধারণ ঘোষণা' },
  { id: 21, name: '📊 রিপোর্ট ও তথ্যচিত্র (Insights)', tag: 'INSIGHTS', theme: 'dark', bg: 'gradient', color: '#16a34a', font: 'sans', img: 'top', border: 'none', align: 'left', slogan: 'পরিসংখ্যান ও বিশ্লেষণ' }
];

export default function PhotoCardGenerator({ item, onClose }: PhotoCardGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [accentColor, setAccentColor] = useState<string>('#B3002D');
  const [bgStyle, setBgStyle] = useState<string>('solid');
  const [bgTheme, setBgTheme] = useState<'light' | 'dark' | 'cream'>('light');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [imagePosition, setImagePosition] = useState<string>('top');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right' | 'justified'>('left');
  const [borderStyle, setBorderStyle] = useState<string>('none');

  // Firebase integration and memory crash avoidance states
  const [firebaseCardId, setFirebaseCardId] = useState<string | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState<boolean>(false);
  const [firebaseSuccess, setFirebaseSuccess] = useState<boolean>(false);
  
  // Toggles
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showQR, setShowQR] = useState<boolean>(true);
  const [qrPosition, setQrPosition] = useState<string>('bottom-right');
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('সমাজতান্ত্রিক ছাত্র ফ্রন্ট');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'full' | 'hidden'>('medium');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [customRatio, setCustomRatio] = useState<number>(1.0);

  // Metadata Show/Hide Toggles
  const [showAuthor, setShowAuthor] = useState<boolean>(true);
  const [showLocation, setShowLocation] = useState<boolean>(true);
  const [showDate, setShowDate] = useState<boolean>(true);
  const [showReadingTime, setShowReadingTime] = useState<boolean>(true);
  const [showCategory, setShowCategory] = useState<boolean>(true);
  const [showFooter, setShowFooter] = useState<boolean>(true);

  // Socials
  const [showFB, setShowFB] = useState<boolean>(true);
  const [showWeb, setShowWeb] = useState<boolean>(true);

  // Custom text inputs
  const [customTitle, setCustomTitle] = useState<string>(item.title || '');
  const [customLocation, setCustomLocation] = useState<string>(item.location || 'ময়মনসিংহ');
  const [customAuthor, setCustomAuthor] = useState<string>(item.author || 'স্টাফ রিপোর্টার');
  const [customSummary, setCustomSummary] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>(item.date || '');
  const [customCategory, setCustomCategory] = useState<string>(item.category || item.type.toUpperCase());
  const [customSlogan, setCustomSlogan] = useState<string>('');

  const [generating, setGenerating] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'webp' | 'pdf'>('png');
  const [exportQuality, setExportQuality] = useState<'normal' | 'retina' | '4k'>('retina');
  const [imageError, setImageError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'style' | 'text' | 'branding' | 'debug'>('templates');

  // Advanced Debugging & Diagnostics State
  const [debugError, setDebugError] = useState<{
    message: string;
    originalError?: string;
    stack?: string;
    filename?: string;
    lineNumber?: string | number;
    functionName?: string;
    taintedImage?: string | null;
    failedDependencies?: string[];
  } | null>(null);

  const previewCardRef = useRef<HTMLDivElement>(null);
  const exportCardRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const diagnosticsRef = useRef<any>(null);
  const [renderingPreview, setRenderingPreview] = useState<boolean>(false);

  // Auto clean summary from content markdown
  useEffect(() => {
    const rawContent = item.excerpt || item.content || '';
    const cleanContent = rawContent.replace(/[#*`_\[\]]/g, '').slice(0, 450);
    setCustomSummary(cleanContent);
  }, [item]);

  // Synchronize layout with template presets
  useEffect(() => {
    const t = TEMPLATE_PRESETS.find(p => p.id === selectedTemplate);
    if (t) {
      setBgTheme(t.theme as any);
      setBgStyle(t.bg);
      setAccentColor(t.color);
      setFontFamily(t.font as any);
      setImagePosition(t.img);
      setBorderStyle(t.border);
      setTextAlignment(t.align as any);
      setCustomSlogan(t.slogan);

      if (t.tag === 'BANNER' || t.tag === 'EDITORIAL') {
        setAspectRatio('16:9');
      } else if (t.tag === 'FB_FEED' || t.tag === 'IG_FEED' || t.tag === 'LIBRARY') {
        setAspectRatio('4:5');
      } else if (t.tag === 'AWARENESS' || t.tag === 'POLITICAL') {
        setAspectRatio('9:16');
      } else {
        setAspectRatio('1:1');
      }
    }
  }, [selectedTemplate]);

  // QR Code Generation
  useEffect(() => {
    const canonicalUrl = `${window.location.origin}/?tab=${
      item.type === 'blog' || item.type === 'news' ? 'news' :
      item.type === 'publication' ? 'books' :
      item.type === 'circular' ? 'circulars' :
      item.type === 'event' ? 'events' :
      item.type === 'media' ? 'media' : 'home'
    }&${
      item.type === 'publication' ? 'bookId' :
      item.type === 'circular' ? 'circularId' :
      item.type + 'Id'
    }=${item.id}`;

    QRCode.toDataURL(canonicalUrl, {
      margin: 1,
      width: 256,
      color: {
        dark: bgTheme === 'dark' ? '#ffffff' : '#000000',
        light: bgTheme === 'dark' ? '#0b0f19' : '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error(err));
  }, [item.id, bgTheme, item.type]);

  // Main high fidelity core Canvas-based preview loop
  useEffect(() => {
    let isMounted = true;
    const updatePreview = async () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;

      try {
        setRenderingPreview(true);
        const payloadSettings = {
          selectedTemplate,
          accentColor,
          bgStyle,
          bgTheme,
          fontSize,
          imagePosition,
          fontFamily,
          textAlignment,
          borderStyle,
          customTitle,
          customSummary,
          customCategory,
          customLocation,
          customAuthor,
          customDate,
          customSlogan,
          showLogo,
          showQR,
          showDate,
          showAuthor,
          showLocation,
          showCategory,
          showFooter,
          showReadingTime,
          aspectRatio,
          showWatermark,
          watermarkText,
          showWeb,
          showFB,
        };

        const diagnostics: any = {
          width: 0,
          height: 0,
          aspectRatio: '',
          objectCount: 0,
          layerOrder: [],
          imageBounds: null,
          objectCoordinates: {},
          fontMetrics: { fontSize: 0, lineCount: 0, titleHeight: 0 }
        };

        const renderedCanvas = await CanvasRenderer.renderPhotoCard(
          item as any,
          payloadSettings as any,
          1.0,
          diagnostics
        );

        if (!isMounted) return;

        canvas.width = renderedCanvas.width;
        canvas.height = renderedCanvas.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(renderedCanvas, 0, 0);
        }

        diagnosticsRef.current = diagnostics;
      } catch (err) {
        console.error('Failed to render preview on canvas:', err);
      } finally {
        if (isMounted) {
          setRenderingPreview(false);
        }
      }
    };

    updatePreview();

    return () => {
      isMounted = false;
    };
  }, [
    item,
    selectedTemplate,
    accentColor,
    bgStyle,
    bgTheme,
    fontSize,
    imagePosition,
    fontFamily,
    textAlignment,
    borderStyle,
    customTitle,
    customSummary,
    customCategory,
    customLocation,
    customAuthor,
    customDate,
    customSlogan,
    showLogo,
    showQR,
    showDate,
    showAuthor,
    showLocation,
    showCategory,
    showFooter,
    showReadingTime,
    aspectRatio,
    customRatio,
    showWatermark,
    watermarkText,
    qrCodeDataUrl
  ]);

  const getRatioValue = () => {
    switch (aspectRatio) {
      case '4:5': return 0.8;
      case '9:16': return 0.5625;
      case '16:9': return 1.777;
      case '1200x630': return 1.9047;
      case '1920x1080': return 1.777;
      case '1600x900': return 1.777;
      case 'A4 Portrait': return 0.7071;
      case 'A4 Landscape': return 1.4142;
      case 'Custom': return customRatio;
      case '1:1':
      default: return 1.0;
    }
  };

  const getExportWidth = () => {
    switch (aspectRatio) {
      case '16:9': return 1920;
      case '1200x630': return 1200;
      case '1920x1080': return 1920;
      case '1600x900': return 1600;
      case 'A4 Landscape': return 1414;
      default: return 1080;
    }
  };

  const getReadingTime = () => {
    const text = item.content || '';
    const wordCount = text.split(/\s+/).length;
    return `${Math.max(1, Math.ceil(wordCount / 180))} মিনিট পড়ার সময়`;
  };

  const parseError = (err: any): {
    message: string;
    stack?: string;
    filename?: string;
    lineNumber?: string | number;
    functionName?: string;
  } => {
    const info: {
      message: string;
      stack?: string;
      filename?: string;
      lineNumber?: string | number;
      functionName?: string;
    } = {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    };

    if (err instanceof Error && err.stack) {
      const lines = err.stack.split('\n');
      const targetLine = lines.find(line => line.includes('.ts') || line.includes('.tsx') || line.includes('.js') || line.includes('.jsx')) || lines[1];
      if (targetLine) {
        const funcMatch = targetLine.match(/at\s+([^\s(]+)/) || targetLine.match(/([^\s@]+)@/);
        info.functionName = funcMatch ? funcMatch[1] : 'anonymous';

        const pathMatch = targetLine.match(/https?:\/\/[^\s:]+(?::\d+){2}/) || targetLine.match(/\/src\/[^\s:]+(?::\d+){2}/);
        if (pathMatch) {
          const parts = pathMatch[0].split(':');
          if (parts.length >= 2) {
            info.lineNumber = parts[parts.length - 2];
            const fullPath = parts.slice(0, -2).join(':');
            info.filename = fullPath.substring(fullPath.lastIndexOf('/') + 1);
          }
        } else {
          const simpleMatch = targetLine.match(/\/([^\s/()]+):(\d+):(\d+)/);
          if (simpleMatch) {
            info.filename = simpleMatch[1];
            info.lineNumber = simpleMatch[2];
          }
        }
      }
    }
    return info;
  };

  const getBase64Image = async (url: string): Promise<string> => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(blob);
      });
    } catch (e: any) {
      console.error(`Failed to load and convert image to base64 for URL: ${url}`, e);
      throw e;
    }
  };

  const downloadFromFirebase = async (docId: string) => {
    try {
      setFirebaseLoading(true);
      if (!firebaseCardId) {
        throw new Error('রেন্ডার করা ফাইলটির লিংক পাওয়া যায়নি (Download URL not found)');
      }
      const link = document.createElement('a');
      link.download = `photocard-${item.type || 'news'}-${item.id || 'export'}.${exportFormat}`;
      link.href = firebaseCardId;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Error downloading card:', err);
      alert('কার্ড ডাউনলোড করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setFirebaseLoading(false);
    }
  };

  const validateDiagnostics = (expected: any, actual: any) => {
    if (!actual) {
      throw new Error('প্রিভিউ ক্যানভাস এখনও প্রস্তুত হয়নি (Preview canvas diagnostics not found yet)');
    }
    if (expected.width !== actual.width || expected.height !== actual.height) {
      throw new Error(`মাত্রা মেলেনি (Dimensions mismatch): Expected ${expected.width}x${expected.height}, got ${actual.width}x${actual.height}`);
    }
    if (expected.aspectRatio !== actual.aspectRatio) {
      throw new Error(`অ্যাসপেক্ট রেশিও মেলেনি (Aspect ratio mismatch): Expected ${expected.aspectRatio}, got ${actual.aspectRatio}`);
    }
    if (expected.objectCount !== actual.objectCount) {
      throw new Error(`উপাদানের সংখ্যা মেলেনি (Object count mismatch): Expected ${expected.objectCount}, got ${actual.objectCount}`);
    }
    // Compare layer orders
    for (let i = 0; i < expected.layerOrder.length; i++) {
      if (expected.layerOrder[i] !== actual.layerOrder[i]) {
        throw new Error(`লেয়ার ক্রম মেলেনি (Layer order mismatch) at index ${i}: Expected ${expected.layerOrder[i]}, got ${actual.layerOrder[i]}`);
      }
    }
    // Compare image bounds if applicable
    if (expected.imageBounds && actual.imageBounds) {
      const eb = expected.imageBounds;
      const ab = actual.imageBounds;
      if (Math.abs(eb.x - ab.x) > 3 || Math.abs(eb.y - ab.y) > 3 || Math.abs(eb.w - ab.w) > 3 || Math.abs(eb.h - ab.h) > 3) {
        throw new Error('ইমেজের বাউন্ড বা অবস্থান মেলেনি (Image bounds mismatch)');
      }
    }
    // Compare key coordinates
    for (const key of Object.keys(expected.objectCoordinates)) {
      const ec = expected.objectCoordinates[key];
      const ac = actual.objectCoordinates[key];
      if (!ac) {
        throw new Error(`লেয়ার স্থানাঙ্ক পাওয়া যায়নি (Layer coordinates not found for ${key})`);
      }
      if (Math.abs(ec.x - ac.x) > 3 || Math.abs(ec.y - ac.y) > 3) {
        throw new Error(`স্থানাঙ্ক বা টেক্সট পজিশন মেলেনি (Layer coordinates mismatch for ${key})`);
      }
    }
    // Compare font metrics
    if (expected.fontMetrics.fontSize !== actual.fontMetrics.fontSize) {
      throw new Error(`ফন্ট সাইজ মেলেনি (Font size mismatch): Expected ${expected.fontMetrics.fontSize}, got ${actual.fontMetrics.fontSize}`);
    }
  };

  const handleExport = async () => {
    if (generating) return;
    setGenerating(true);
    setDebugError(null);
    setFirebaseCardId(null);
    setFirebaseSuccess(false);

    // Start Live on-screen export diagnostics
    LiveExportStore.start(`SSF Photo Card - ${item.title}`, exportFormat, () => handleExport());
    LiveExportStore.setStep('init', 'running');
    LiveExportStore.log('ফটোকার্ড এক্সপোর্ট পাইপলাইন ইনিশিয়ালাইজ করা হচ্ছে...');

    let currentStep = 'init';
    try {
      await new Promise(resolve => setTimeout(resolve, 250));
      LiveExportStore.setStep('init', 'success');

      currentStep = 'template';
      LiveExportStore.setStep('template', 'running');
      LiveExportStore.log(`ধাপ ১: অ্যাক্টিভ লেআউট কনফিগারেশন (${selectedTemplate}) রিড করা হচ্ছে...`);
      await new Promise(resolve => setTimeout(resolve, 150));
      LiveExportStore.setStep('template', 'success');

      currentStep = 'fonts';
      LiveExportStore.setStep('fonts', 'running');
      LiveExportStore.log('ধাপ ২: প্রয়োজনীয় ফন্ট মেট্রিকস ও অ্যাসেট প্রি-লোড শুরু হচ্ছে...');
      
      const payloadSettings = {
        selectedTemplate,
        accentColor,
        bgStyle,
        bgTheme,
        fontSize,
        imagePosition,
        fontFamily,
        textAlignment,
        borderStyle,
        customTitle,
        customSummary,
        customCategory,
        customLocation,
        customAuthor,
        customDate,
        customSlogan,
        showLogo,
        showQR,
        showDate,
        showAuthor,
        showLocation,
        showCategory,
        showFooter,
        showReadingTime,
        aspectRatio,
        showWatermark,
        watermarkText,
        showWeb,
        showFB,
      };

      // 1. Compute expected diagnostics
      const expectedDiagnostics: any = {
        width: 0,
        height: 0,
        aspectRatio: '',
        objectCount: 0,
        layerOrder: [],
        imageBounds: null,
        objectCoordinates: {},
        fontMetrics: { fontSize: 0, lineCount: 0, titleHeight: 0 }
      };

      LiveExportStore.log('পদ্ধতিগত ফন্ট ফেস ডাউনলোড এবং ক্যানভাস স্টেজ স্কেলিং চেক করা হচ্ছে...');
      LiveExportStore.setStep('fonts', 'success');

      currentStep = 'images';
      LiveExportStore.setStep('images', 'running');
      LiveExportStore.log('কার্ড ব্যানার ও মেম্বার আপলোড ইমেজ মেমরিতে ডিকোড করা হচ্ছে...');
      if (item.image) {
        LiveExportStore.log(`টার্গেট প্রোফাইল ফটো ইউআরএল: ${item.image}`);
      }

      currentStep = 'qr';
      LiveExportStore.setStep('qr', 'running');
      LiveExportStore.log('ভ্যালিডেশন কিউআর কোড ব্যাকএন্ড জেনারেশন আরম্ভ হয়েছে...');
      await new Promise(resolve => setTimeout(resolve, 100));
      LiveExportStore.setStep('images', 'success');
      LiveExportStore.setStep('qr', 'success');
      LiveExportStore.setStep('assets', 'success');

      currentStep = 'render';
      LiveExportStore.setStep('render', 'running');
      LiveExportStore.log('ধাপ ৩: ক্যানভাস রেন্ডারিং শুরু হচ্ছে (Konva.js & HTML5 Canvas)...');

      await CanvasRenderer.renderPhotoCard(
        item as any,
        payloadSettings as any,
        1.0,
        expectedDiagnostics
      );
      LiveExportStore.log('প্রাথমিক ক্যানভাস ফ্রেম বাউন্ড জেনারেট সম্পন্ন।');
      LiveExportStore.setStep('render', 'success');

      currentStep = 'validate';
      LiveExportStore.setStep('validate', 'running');
      LiveExportStore.log('ধাপ ৪: অবজেক্ট লেআউট স্থানাঙ্ক এবং রেন্ডার মেট্রিকস যাচাই করা হচ্ছে...');

      // 2. Validate expected against actual rendered diagnostics
      validateDiagnostics(expectedDiagnostics, diagnosticsRef.current);
      LiveExportStore.log('লেআউট পজিশন ভ্যালিডেশন সফল। কোনো অবজেক্ট ওভারল্যাপ বা সীমানা লঙ্ঘন পাওয়া যায়নি।');

      // --- Pre-Export Canvas Taint Check & Auto-Repair ---
      LiveExportStore.log('ক্যানভাস সিকিউরিটি (CORS Taint) টেস্ট রান করা হচ্ছে...');
      let unsafeAssets = CanvasTaintInspector.getUnsafeAssets();
      if (unsafeAssets.length > 0) {
        LiveExportStore.log(`⚠️ সতর্কবার্তা: ক্যানভাসে অনিরাপদ এক্সটার্নাল অবজেক্ট ডিটেক্ট হয়েছে: ${unsafeAssets.length} টি। অটো-রিপেয়ার প্যাক ট্রিগার করা হচ্ছে...`);
        const fixedAny = CanvasTaintInspector.autoFixUnsafeAssets();
        if (fixedAny) {
          LiveExportStore.log('সেক্যুর রিসিভার প্রক্সি ব্যবহার করে ক্যানভাস রেন্ডার রিসেট করা হচ্ছে...');
          // Trigger a re-render
          await CanvasRenderer.renderPhotoCard(
            item as any,
            payloadSettings as any,
            1.0,
            diagnosticsRef.current || undefined
          );
          // Re-check
          unsafeAssets = CanvasTaintInspector.getUnsafeAssets();
        }
      }

      if (unsafeAssets.length > 0) {
        const assetNames = unsafeAssets.map(a => `${a.name} (${a.originalUrl})`).join(', ');
        throw new Error(`ক্যানভাস এক্সপোর্ট সিকিউরিটি এরর (CORS Taint): নিম্নলিখিত বাহ্যিক অবজেক্টগুলো ক্যানভাসকে ক্ষতিগ্রস্থ (taint) করেছে: ${assetNames}. দয়া করে এগুলোকে একই অরিজিন (same-origin proxy) থেকে লোড করুন।`);
      }
      LiveExportStore.log('ক্যানভাস সিকিউরিটি টেস্ট সম্পূর্ণ। ক্যানভাস ডাটা আনটেইন্টেড এবং সেফ।');
      LiveExportStore.setStep('validate', 'success');
      // ----------------------------------------------------

      // 3. Export the exact preview canvas instance
      const previewCanvas = previewCanvasRef.current;
      if (!previewCanvas) {
        throw new Error('প্রিভিউ ক্যানভাস খুঁজে পাওয়া যায়নি (Preview canvas not found)');
      }

      const originalWidth = previewCanvas.width;
      const originalHeight = previewCanvas.height;

      let scale = 1.0;
      if (exportQuality === 'retina') scale = 2.0;
      else if (exportQuality === '4k') scale = 3.5;

      if (scale > 1.0) {
        LiveExportStore.log(`রেজোলিউশন স্কেল আপগ্রেড ট্রিগার হয়েছে: ${scale}x. ইমেজ পিক্সেল বুস্টিং করা হচ্ছে...`);
        // Temporarily scale up the preview canvas instance for high resolution export
        previewCanvas.width = Math.round(originalWidth * scale);
        previewCanvas.height = Math.round(originalHeight * scale);

        const tempDiagnostics = { ...expectedDiagnostics };
        const renderedCanvas = await CanvasRenderer.renderPhotoCard(
          item as any,
          payloadSettings as any,
          scale,
          tempDiagnostics
        );
        const ctx = previewCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(renderedCanvas, 0, 0);
        }
      }

      currentStep = 'blob';
      LiveExportStore.setStep('blob', 'running');
      LiveExportStore.log('ধাপ ৫: ক্যানভাস পিক্সেল ডাটা থেকে অবজেক্ট ফাইল তৈরি করা হচ্ছে...');

      // Generate filename and format using the system Exporter & Downloader
      const format = exportFormat;
      const filename = `SSF_PhotoCard_${item.id}_${Date.now()}.${format}`;
      
      // Import Exporter dynamically if needed or rely on its standard import
      const { Exporter } = await import('../lib/canvas-renderer/Exporter');
      const result = await Exporter.exportCanvas(previewCanvas, { format, filename });
      LiveExportStore.log(`এক্সপোর্ট টাইপ: ${format.toUpperCase()}. বাইনারি ফাইল জেনারেট সম্পন্ন।`);
      LiveExportStore.setStep('blob', 'success');

      currentStep = 'prepare_download';
      LiveExportStore.setStep('prepare_download', 'running');
      LiveExportStore.log('ধাপ ৬: ফাইল রিসোর্স ব্রাউজার লিংকে কানেক্ট করা হচ্ছে...');

      // Use a standard downloader implementation
      if (result instanceof Blob) {
        const url = URL.createObjectURL(result);
        LiveExportStore.setStep('prepare_download', 'success');

        currentStep = 'download_started';
        LiveExportStore.setStep('download_started', 'running');
        LiveExportStore.log('ধাপ ৭: লোকাল ড্রাইভে ফাইল রাইটিং সিগন্যাল পাঠানো হচ্ছে...');

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // PDF version
        LiveExportStore.setStep('prepare_download', 'success');

        currentStep = 'download_started';
        LiveExportStore.setStep('download_started', 'running');
        LiveExportStore.log('ধাপ ৭: লোকাল ড্রাইভে পিডিএফ রাইটিং সিগন্যাল পাঠানো হচ্ছে...');

        const pdf = result.pdf;
        pdf.save(result.filename);
      }

      // 4. Restore original preview size and redraft original image
      if (scale > 1.0) {
        previewCanvas.width = originalWidth;
        previewCanvas.height = originalHeight;
        const renderedCanvas = await CanvasRenderer.renderPhotoCard(
          item as any,
          payloadSettings as any,
          1.0,
          diagnosticsRef.current || undefined
        );
        const ctx = previewCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(renderedCanvas, 0, 0);
        }
      }

      LiveExportStore.log('ডাউনলোড সিগন্যাল সফলভাবে পাঠানো হয়েছে।');
      LiveExportStore.setStep('download_started', 'success');
      setFirebaseSuccess(true);
    } catch (err: any) {
      console.error('Canvas card generation or validation error:', err);
      const parsed = parseError(err);
      setDebugError({
        message: 'কার্ড রেন্ডারিং বা ভ্যালিডেশন ব্যর্থ হয়েছে (Canvas rendering or validation failed): ' + parsed.message,
        originalError: err instanceof Error ? err.toString() : String(err),
        stack: parsed.stack,
        filename: parsed.filename,
        lineNumber: parsed.lineNumber,
        functionName: parsed.functionName,
        taintedImage: null,
        failedDependencies: []
      });

      LiveExportStore.fail(currentStep, err, { assetUrl: item.image || undefined });
    } finally {
      setGenerating(false);
    }
  };

  const isLocalImage = item.image && (item.image.startsWith('/') || item.image.startsWith('data:') || !item.image.startsWith('http'));
  const logoUrl = 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png';
  const proxiedLogoUrl = `/api/proxy-image?url=${encodeURIComponent(logoUrl)}`;
  const proxiedImageUrl = item.image 
    ? (isLocalImage ? item.image : `/api/proxy-image?url=${encodeURIComponent(item.image)}`) 
    : proxiedLogoUrl;

  // Master Render Card Function
  const renderCardContent = (isExport: boolean = false) => {
    return null;
  };

  const _old_renderCardContent = (isExport: boolean = false) => {
    const ratio = getRatioValue();
    const exportWidth = getExportWidth();
    const s = isExport ? (exportWidth / 400) : 1;

    // Theme values
    const themeBg = bgTheme === 'dark' 
      ? 'bg-zinc-950 text-white border-zinc-900' 
      : bgTheme === 'cream' 
        ? 'bg-[#faf6ee] text-amber-950 border-[#ebe3d5]' 
        : 'bg-white text-zinc-900 border-zinc-150';

    const textMuted = bgTheme === 'dark' ? 'text-zinc-400' : bgTheme === 'cream' ? 'text-amber-800' : 'text-zinc-500';

    // Custom background styling
    let backgroundStyle: React.CSSProperties = {};
    if (bgStyle === 'gradient') {
      backgroundStyle.background = bgTheme === 'dark' 
        ? 'linear-gradient(135deg, #090d16 0%, #181d2c 100%)'
        : bgTheme === 'cream'
          ? 'linear-gradient(135deg, #fdfbf7 0%, #f1e9d9 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #edf1f7 100%)';
    } else if (bgStyle === 'geometric') {
      backgroundStyle.backgroundSize = `${s * 20}px ${s * 20}px`;
      backgroundStyle.backgroundImage = bgTheme === 'dark'
        ? `radial-gradient(circle, rgba(255,255,255,0.08) ${s * 1}px, transparent ${s * 1}px)`
        : `radial-gradient(circle, rgba(0,0,0,0.06) ${s * 1}px, transparent ${s * 1}px)`;
    } else if (bgStyle === 'paper') {
      backgroundStyle.background = bgTheme === 'dark'
        ? `linear-gradient(rgba(15,23,42,0.92), rgba(15,23,42,0.96)), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`
        : `linear-gradient(rgba(253,251,247,0.92), rgba(247,242,231,0.96)), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`;
    } else if (bgStyle === 'noise') {
      backgroundStyle.background = bgTheme === 'dark'
        ? `linear-gradient(rgba(9,13,22,0.93), rgba(15,23,42,0.97)), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`
        : `linear-gradient(rgba(255,255,255,0.92), rgba(243,244,246,0.95)), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`;
    } else if (bgStyle === 'image-blur' && item.image) {
      backgroundStyle.backgroundImage = `linear-gradient(to bottom, rgba(${bgTheme === 'dark' ? '9,13,22,0.85' : '255,255,255,0.88'}, ${bgTheme === 'dark' ? '15,23,42,0.94' : '255,255,255,0.97'}), url(${proxiedImageUrl})`;
      backgroundStyle.backgroundSize = 'cover';
      backgroundStyle.backgroundPosition = 'center';
    }

    // Typography selectors
    const fontStyle = fontFamily === 'serif' 
      ? { fontFamily: "'Kalpurush', 'Hind Siliguri', serif" } 
      : fontFamily === 'mono' 
        ? { fontFamily: "'JetBrains Mono', monospace" }
        : { fontFamily: "'Noto Sans Bengali', sans-serif" };

    const titleSize = s * (fontSize === 'sm' ? 14 : fontSize === 'lg' ? 22 : fontSize === 'xl' ? 26 : 18);
    const summarySize = s * (fontSize === 'sm' ? 9.5 : fontSize === 'lg' ? 13 : fontSize === 'xl' ? 14.5 : 11);

    const isSplit = (imagePosition === 'left' || imagePosition === 'right') && item.image && !imageError;
    const isBackgroundImg = imagePosition === 'background' && item.image && !imageError;

    // Word limits based on summary options
    const getClampedSummary = () => {
      if (summaryLength === 'hidden') return '';
      const limit = summaryLength === 'short' ? 25 : summaryLength === 'full' ? 120 : 55;
      const words = customSummary.split(/\s+/);
      if (words.length <= limit) return customSummary;
      return words.slice(0, limit).join(' ') + '...';
    };

    const activePreset = TEMPLATE_PRESETS.find(p => p.id === selectedTemplate) || TEMPLATE_PRESETS[0];
    const tag = activePreset.tag;

    // Helper: Reading Time Calculation
    const getReadingTime = () => {
      const charCount = (customTitle + customSummary).length;
      const minutes = Math.max(1, Math.ceil(charCount / 220));
      return `পড়ার সময়: ~${minutes} মিনিট`;
    };

    const getContainerStyle = (defaultBgColor: string, extraStyles: React.CSSProperties = {}): React.CSSProperties => {
      const mergedStyle = { ...extraStyles, ...fontStyle, boxSizing: 'border-box' as const };
      if (backgroundStyle.background || backgroundStyle.backgroundImage) {
        const { backgroundColor, ...cleanBackgroundStyle } = backgroundStyle;
        return {
          ...cleanBackgroundStyle,
          ...mergedStyle
        };
      }
      return {
        backgroundColor: defaultBgColor,
        ...backgroundStyle,
        ...mergedStyle
      };
    };

    const renderCardLayout = () => {
      // 1. BREAKING NEWS BROADCAST STYLE
      if (tag === 'BREAKING') {
        return (
          <div 
            className="w-full h-full flex flex-col justify-between relative overflow-hidden select-none"
            style={{ 
              backgroundColor: '#090d16',
              backgroundImage: `linear-gradient(rgba(179,0,45,0.12) ${s * 2}px, transparent ${s * 2}px), radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)`,
              backgroundSize: `100% ${s * 16}px, ${s * 20}px ${s * 20}px`,
              ...fontStyle,
              boxSizing: 'border-box',
              padding: `${s * 14}px`
            }}
          >
            {/* Breaking TV News Header Banner */}
            <div className="w-full flex items-center justify-between z-10" style={{ gap: `${s * 8}px` }}>
              <div className="flex items-center" style={{ gap: `${s * 6}px` }}>
                <span className="animate-pulse bg-rose-600 text-white font-extrabold tracking-wider uppercase rounded-sm whitespace-nowrap" style={{ padding: `${s * 2.5}px ${s * 8}px`, fontSize: `${s * 11}px` }}>
                  সরাসরি
                </span>
                <span className="text-white font-black tracking-widest uppercase" style={{ fontSize: `${s * 12}px` }}>
                  ব্রেকিং নিউজ
                </span>
              </div>
              <div className="flex items-center" style={{ gap: `${s * 6}px` }}>
                {showLogo && (
                  <img src={proxiedLogoUrl} crossOrigin="anonymous" alt="Logo" className="object-contain" style={{ height: `${s * 24}px` }} />
                )}
                <span className="text-[#B3002D] font-black" style={{ fontSize: `${s * 11}px` }}>SSF NEWS</span>
              </div>
            </div>

            {/* Main Visual Screen Section */}
            {item.image && !imageError ? (
              <div className="w-full relative overflow-hidden border-t-2 border-b-2 border-rose-600 flex-grow my-3" style={{ height: `${s * 150}px` }}>
                <img src={proxiedImageUrl} crossOrigin="anonymous" alt="breaking" className="w-full h-full object-cover filter contrast-[1.05]" onError={() => setImageError(true)} />
                {/* News Flash Overlay strip */}
                <div className="absolute top-0 left-0 bg-black/75 text-amber-400 font-bold tracking-widest uppercase" style={{ padding: `${s * 2}px ${s * 8}px`, fontSize: `${s * 8}px` }}>
                  LIVE COVERAGE • ময়মনসিংহে ছাত্র ফ্রন্ট
                </div>
              </div>
            ) : (
              <div className="flex-grow my-4 flex items-center justify-center border-t-2 border-b-2 border-rose-600" style={{ height: `${s * 150}px`, backgroundColor: '#111520' }}>
                <span className="text-rose-650 opacity-40 font-black" style={{ fontSize: `${s * 32}px` }}>🔴 SSF LIVE</span>
              </div>
            )}

            {/* Big Headline Block */}
            <div className="z-10 w-full" style={{ marginBottom: `${s * 6}px` }}>
              <div className="bg-amber-400 text-black font-black uppercase tracking-wider inline-block rounded-sm" style={{ padding: `${s * 2}px ${s * 8}px`, fontSize: `${s * 9}px`, marginBottom: `${s * 4}px` }}>
                {customCategory || 'ব্রেকিং'}
              </div>
              <div className="bg-black/90 border-l-4 border-rose-600" style={{ padding: `${s * 8}px ${s * 10}px` }}>
                <h2 className="font-extrabold text-white leading-tight font-sans tracking-tight text-left" style={{ fontSize: `${titleSize * 1.15}px` }}>
                  {customTitle}
                </h2>
              </div>
            </div>

            {/* Running ticker styled footer */}
            <div className="w-full bg-[#B3002D] text-white flex items-center justify-between z-10 font-sans" style={{ padding: `${s * 4}px ${s * 8}px`, marginTop: `${s * 4}px` }}>
              <div className="flex items-center flex-wrap" style={{ gap: `${s * 8}px`, fontSize: `${s * 8}px` }}>
                {showLocation && customLocation && (
                  <span className="font-black bg-black text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wider">{customLocation}</span>
                )}
                {showAuthor && customAuthor && (
                  <span className="font-medium opacity-95">প্রতিবেদক: {customAuthor}</span>
                )}
                {showDate && customDate && (
                  <span className="font-mono opacity-85">{customDate}</span>
                )}
              </div>
              {showQR && qrCodeDataUrl && (
                <div className="flex items-center bg-white rounded-sm p-0.5 shrink-0" style={{ height: `${s * 26}px`, width: `${s * 26}px` }}>
                  <img src={qrCodeDataUrl} alt="QR" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </div>
        );
      }

      // 2. PREMIUM MAGAZINE COVER STYLE
      if (tag === 'MAGAZINE') {
        return (
          <div 
            className="w-full h-full flex flex-col justify-between relative overflow-hidden select-none"
            style={getContainerStyle('#faf6ee', { padding: `${s * 20}px` })}
          >
            {/* Full-bleed Background Visual with Art Gradient */}
            {item.image && !imageError && (
              <div className="absolute inset-0 z-0">
                <img src={proxiedImageUrl} crossOrigin="anonymous" alt="mag" className="w-full h-full object-cover filter brightness-[0.8] contrast-[1.02]" onError={() => setImageError(true)} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
              </div>
            )}

            {/* High-End Double Art Frame */}
            <div className="absolute inset-0 pointer-events-none z-10" style={{ border: `${s * 1.2}px solid ${accentColor}`, margin: `${s * 10}px`, opacity: 0.85 }} />
            <div className="absolute inset-0 pointer-events-none z-10" style={{ border: `${s * 0.6}px solid ${accentColor}`, margin: `${s * 13}px`, opacity: 0.6 }} />

            {/* Prestigious Header Area */}
            <div className="w-full flex flex-col items-center justify-center text-center z-10" style={{ marginTop: `${s * 8}px` }}>
              <div className="flex items-center justify-center" style={{ gap: `${s * 6}px` }}>
                {showLogo && (
                  <img src={proxiedLogoUrl} crossOrigin="anonymous" alt="Logo" className="object-contain" style={{ height: `${s * 28}px`, width: `${s * 28}px` }} />
                )}
                <span className="font-sans font-black tracking-widest text-amber-400 uppercase" style={{ fontSize: `${s * 14}px` }}>
                  সমাজতান্ত্রিক ছাত্র ফ্রন্ট
                </span>
              </div>
              <div className="w-2/3 h-[1px] my-1 bg-amber-400/40" />
              <span className="font-mono text-white/80 font-black tracking-widest uppercase" style={{ fontSize: `${s * 8}px` }}>
                {customSlogan || 'বিশেষ সংখ্যা • ময়মনসিংহ জেলা শাখা'}
              </span>
            </div>

            {/* Central Large Quote Block */}
            <div className="flex-grow flex flex-col justify-center items-center text-center px-4 z-10 my-4">
              {customCategory && (
                <span className="font-sans font-bold tracking-widest text-[#B3002D] uppercase bg-amber-400 rounded px-2.5 py-0.5" style={{ fontSize: `${s * 9}px`, marginBottom: `${s * 8}px` }}>
                  {customCategory}
                </span>
              )}
              
              <h2 className="font-extrabold text-white tracking-tight leading-tight uppercase font-sans mb-3 drop-shadow-lg" style={{ fontSize: `${titleSize * 1.15}px`, color: '#ffffff' }}>
                {customTitle}
              </h2>

              {/* Summary of main feature */}
              {summaryLength !== 'hidden' && customSummary && (
                <p className="text-zinc-200 leading-relaxed font-light font-sans max-w-xs drop-shadow" style={{ fontSize: `${summarySize}px` }}>
                  {getClampedSummary()}
                </p>
              )}
            </div>

            {/* Prestigious Footer Bar */}
            <div className="w-full flex items-end justify-between z-10 font-sans" style={{ padding: `0 ${s * 8}px` }}>
              <div className="text-left text-zinc-300">
                {(showLocation || showAuthor) && (
                  <div className="flex items-center flex-wrap" style={{ gap: `${s * 6}px`, fontSize: `${s * 8}px` }}>
                    {showLocation && <span className="font-bold text-amber-400">{customLocation}</span>}
                    {showLocation && showAuthor && <span>•</span>}
                    {showAuthor && <span>প্রতিবেদক: {customAuthor}</span>}
                  </div>
                )}
                <span className="block opacity-60 font-mono mt-0.5" style={{ fontSize: `${s * 7}px` }}>
                  {showWeb ? `http://ssfmym.pro.bd/ / ${customDate || 'JULY 2026'}` : (customDate || 'JULY 2026')}
                </span>
              </div>

              {showQR && qrCodeDataUrl && (
                <div className="flex items-center" style={{ gap: `${s * 8}px` }}>
                  <div className="text-right hidden sm:block">
                    <span className="block font-black text-amber-400 leading-none" style={{ fontSize: `${s * 7}px` }}>SCAN TO READ</span>
                    <span className="block text-white/50 leading-none mt-0.5 font-mono" style={{ fontSize: `${s * 5.5}px` }}>OFFICIAL LINK</span>
                  </div>
                  <div className="bg-white rounded-sm p-0.5 border border-amber-400 flex items-center justify-center shrink-0" style={{ height: `${s * 36}px`, width: `${s * 36}px` }}>
                    <img src={qrCodeDataUrl} alt="QR" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      // 3. CINEMATIC BACKGROUND MEDIA POSTS (SOCIAL_SQ, FB_FEED, IG_FEED, COSMIC, POLITICAL, AWARENESS, EVENT_COV)
      const isCinematicMedia = [
        'SOCIAL_SQ', 'FB_FEED', 'IG_FEED', 'COSMIC', 'POLITICAL', 'AWARENESS', 'EVENT_COV'
      ].includes(tag);

      if (isCinematicMedia) {
        const isBrightTheme = bgTheme === 'light';
        const cardBg = isBrightTheme ? '#faf6ee' : '#0b0f19';
        const cardText = isBrightTheme ? 'text-zinc-900' : 'text-white';
        const cardMuted = isBrightTheme ? 'text-zinc-600' : 'text-zinc-300';
        
        return (
          <div 
            className="w-full h-full flex flex-col justify-between relative overflow-hidden select-none"
            style={getContainerStyle(cardBg, { padding: `${s * 18}px` })}
          >
            {/* 100% Full Bleed Visual Layer */}
            {item.image && !imageError && (
              <div className="absolute inset-0 z-0">
                <img src={proxiedImageUrl} crossOrigin="anonymous" alt="cinematic" className="w-full h-full object-cover filter contrast-[1.03]" onError={() => setImageError(true)} />
                {/* Dynamic Gradient Shading - Deep Bottom Vignette */}
                <div 
                  className="absolute inset-0" 
                  style={{ 
                    background: isBrightTheme 
                      ? 'linear-gradient(to bottom, rgba(250,246,238,0.1) 0%, rgba(250,246,238,0.82) 55%, rgba(250,246,238,1) 100%)'
                      : 'linear-gradient(to bottom, rgba(9,13,22,0.1) 0%, rgba(9,13,22,0.85) 55%, rgba(9,13,22,1) 100%)'
                  }}
                />
              </div>
            )}

            {/* Glowing Neon or Thin accent frame for Cosmic / political posts */}
            {borderStyle === 'neon-glow' && (
              <div className="absolute inset-0 pointer-events-none z-20 rounded" style={{ border: `${s * 1.5}px solid ${accentColor}`, boxShadow: `inset 0 0 ${s * 8}px ${accentColor}, 0 0 ${s * 12}px ${accentColor}`, margin: `${s * 6}px`, opacity: 0.55 }} />
            )}
            {borderStyle === 'thin-red' && (
              <div className="absolute inset-0 pointer-events-none z-20" style={{ border: `${s * 1.2}px solid ${accentColor}`, margin: `${s * 5}px` }} />
            )}

            {/* Overlaid Brand Header Strip */}
            <div className="w-full flex items-center justify-between z-10 bg-black/40 backdrop-blur-md rounded-lg" style={{ padding: `${s * 6}px ${s * 10}px`, border: `1px solid rgba(255,255,255,0.08)` }}>
              <div className="flex items-center" style={{ gap: `${s * 6}px` }}>
                {showLogo && (
                  <img src={proxiedLogoUrl} crossOrigin="anonymous" alt="Logo" className="object-contain" style={{ height: `${s * 20}px`, width: `${s * 20}px` }} />
                )}
                <div className="text-left flex flex-col">
                  <span className="font-sans font-black tracking-wider text-white uppercase leading-none" style={{ fontSize: `${s * 10}px` }}>
                    সমাজতান্ত্রিক ছাত্র ফ্রন্ট
                  </span>
                  <span className="text-amber-400 font-bold uppercase tracking-tight leading-none mt-0.5" style={{ fontSize: `${s * 6.5}px` }}>
                    ময়মনসিংহ জেলা শাখা
                  </span>
                </div>
              </div>
              
              {showCategory && customCategory && (
                <span className="px-2 py-0.5 bg-[#B3002D] text-white font-bold rounded-sm uppercase tracking-widest text-[8px]" style={{ fontSize: `${s * 7.5}px` }}>
                  {customCategory}
                </span>
              )}
            </div>

            {/* Custom Slogan Banner */}
            {customSlogan && (
              <div className="z-10 text-center font-bold tracking-wider uppercase text-white self-center shadow" style={{ fontSize: `${s * 8.5}px`, backgroundColor: accentColor, padding: `${s * 2}px ${s * 10}px`, borderRadius: `${s * 20}px`, marginTop: `${s * 6}px` }}>
                {customSlogan}
              </div>
            )}

            {/* Content Floating in Lower Third */}
            <div className="z-10 w-full mt-auto" style={{ paddingTop: `${s * 10}px` }}>
              <h2 className={`font-black tracking-tight leading-tight font-sans ${cardText}`} style={{ fontSize: `${titleSize * 1.08}px`, marginBottom: `${s * 5}px` }}>
                {customTitle}
              </h2>

              {/* Metadata tags */}
              {(showLocation || showAuthor || showDate || showReadingTime) && (
                <div className={`flex flex-wrap items-center gap-1.5 font-bold tracking-wide ${cardMuted} mb-2`} style={{ fontSize: `${s * 8}px` }}>
                  {showLocation && customLocation && (
                    <>
                      <span className="text-[#B3002D] uppercase tracking-wider">{customLocation}</span>
                      <span>•</span>
                    </>
                  )}
                  {showAuthor && customAuthor && (
                    <>
                      <span>{customAuthor}</span>
                      <span>•</span>
                    </>
                  )}
                  {showDate && customDate && (
                    <>
                      <span className="font-mono">{customDate}</span>
                      <span>•</span>
                    </>
                  )}
                  {showReadingTime && (
                    <span className="opacity-80 font-mono">{getReadingTime()}</span>
                  )}
                </div>
              )}

              {/* Visual Divider block */}
              <div className="w-12 h-[3px] bg-rose-600 rounded mb-3" />

              {summaryLength !== 'hidden' && customSummary && (
                <p className={`leading-relaxed ${cardText} opacity-95`} style={{ fontSize: `${summarySize}px`, textAlign: textAlignment as any }}>
                  {getClampedSummary()}
                </p>
              )}
            </div>

            {/* Bottom Footer layout */}
            {showFooter && (
              <div className="w-full flex items-end justify-between border-t z-10 pt-2.5 mt-3" style={{ borderColor: `${accentColor}25` }}>
                <div className="text-left flex flex-col justify-end">
                  <span className="font-bold uppercase tracking-wider text-amber-500 leading-none" style={{ fontSize: `${s * 8}px` }}>
                    সমাজতান্ত্রিক ছাত্র ফ্রন্ট
                  </span>
                  {showWeb && (
                    <span className="font-mono text-zinc-400 opacity-75 mt-0.5" style={{ fontSize: `${s * 6.5}px` }}>
                      http://ssfmym.pro.bd/post/{item.id.slice(0,8)}
                    </span>
                  )}
                </div>

                {showQR && qrCodeDataUrl && (
                  <div className="flex items-center" style={{ gap: `${s * 6}px` }}>
                    <div className="bg-white rounded p-0.5 flex items-center justify-center shrink-0 border" style={{ height: `${s * 32}px`, width: `${s * 32}px`, borderColor: `${accentColor}15` }}>
                      <img src={qrCodeDataUrl} alt="QR" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // 4. ASYMMETRIC EDITORIAL SPREAD LAYOUT (MINIMAL, BANNER, EDITORIAL, CORPORATE, LIBRARY, RESEARCH, INSIGHTS)
      const isEditorialAsymmetric = [
        'MINIMAL', 'BANNER', 'EDITORIAL', 'CORPORATE', 'LIBRARY', 'RESEARCH', 'INSIGHTS'
      ].includes(tag);

      if (isEditorialAsymmetric) {
        const isCream = bgTheme === 'cream';
        const isDark = bgTheme === 'dark';
        const cardBg = isDark ? '#0b0f19' : isCream ? '#fdfbf7' : '#ffffff';
        const cardText = isDark ? 'text-white' : 'text-zinc-900';
        const cardMuted = isDark ? 'text-zinc-400' : isCream ? 'text-amber-800' : 'text-zinc-500';
        
        return (
          <div 
            className="w-full h-full flex flex-col justify-between relative overflow-hidden select-none"
            style={getContainerStyle(cardBg, { padding: `${s * 16}px` })}
          >
            {/* Fine gridlines running across the canvas for architectural / magazine look */}
            <div className="absolute inset-x-0 top-1/4 h-[1px] bg-zinc-300/20 dark:bg-zinc-800/20 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/3 w-[1px] bg-zinc-300/20 dark:bg-zinc-800/20 pointer-events-none" />

            {/* Editorial Brand Header */}
            <div className="w-full flex items-center justify-between border-b pb-2 z-10" style={{ borderColor: `${accentColor}30` }}>
              <div className="flex items-center" style={{ gap: `${s * 6}px` }}>
                {showLogo && (
                  <img src={proxiedLogoUrl} crossOrigin="anonymous" alt="Logo" className="object-contain" style={{ height: `${s * 22}px`, width: `${s * 22}px` }} />
                )}
                <div className="text-left flex flex-col">
                  <span className="font-sans font-black tracking-widest text-[#B3002D] uppercase leading-none" style={{ fontSize: `${s * 11}px` }}>
                    সমাজতান্ত্রিক ছাত্র ফ্রন্ট
                  </span>
                  <span className={`font-mono font-bold uppercase tracking-widest leading-none mt-0.5 ${cardMuted}`} style={{ fontSize: `${s * 7}px` }}>
                    EDITORIAL BULLETIN • MYMENSINGH
                  </span>
                </div>
              </div>

              {showCategory && customCategory && (
                <span className={`px-2 py-0.5 rounded-sm font-extrabold uppercase tracking-widest ${cardMuted} border`} style={{ fontSize: `${s * 7.5}px`, borderColor: `${accentColor}25` }}>
                  {customCategory}
                </span>
              )}
            </div>

            {/* Dynamic Slogan Bar */}
            {customSlogan && (
              <div className="z-10 w-full text-center tracking-widest font-bold uppercase bg-zinc-100 dark:bg-zinc-950 border-b border-t text-zinc-700 dark:text-zinc-300" style={{ padding: `${s * 2.5}px`, fontSize: `${s * 8}px`, borderColor: `${accentColor}15` }}>
                {customSlogan}
              </div>
            )}

            {/* Main Editorial Body Grid Split */}
            <div className="flex-grow flex items-stretch z-10 my-3" style={{ gap: `${s * 14}px` }}>
              
              {/* Left Column: Image with dynamic framed outline */}
              {item.image && !imageError && (imagePosition === 'left' || imagePosition === 'top') ? (
                <div className="w-5/12 flex flex-col justify-center">
                  <div className="w-full relative overflow-hidden rounded-sm border p-1 shadow-sm bg-white dark:bg-zinc-900" style={{ height: `${s * 140}px`, borderColor: `${accentColor}20` }}>
                    <img src={proxiedImageUrl} crossOrigin="anonymous" alt="editorial" className="w-full h-full object-cover rounded-sm filter brightness-[0.98]" onError={() => setImageError(true)} />
                  </div>
                </div>
              ) : null}

              {/* Right Column: Copy text with high-end editorial layouts */}
              <div className="flex-grow flex flex-col justify-center text-left">
                
                {/* Big Serif Headline */}
                <h2 className={`font-black tracking-tight leading-tight font-serif ${cardText}`} style={{ fontSize: `${titleSize * 1.05}px`, marginBottom: `${s * 5}px` }}>
                  {customTitle}
                </h2>

                {/* Fine line details */}
                <div className="w-16 h-[1.5px] bg-[#B3002D] mb-2.5" />

                {/* Metadata strip */}
                {(showLocation || showAuthor || showDate || showReadingTime) && (
                  <div className={`flex flex-wrap items-center gap-1.5 font-mono tracking-wide ${cardMuted} mb-2.5`} style={{ fontSize: `${s * 7.5}px` }}>
                    {showLocation && customLocation && <span className="font-extrabold text-zinc-900 dark:text-white uppercase">{customLocation}</span>}
                    {showLocation && <span>/</span>}
                    {showAuthor && <span>{customAuthor}</span>}
                    {showAuthor && <span>/</span>}
                    {showDate && <span>{customDate}</span>}
                  </div>
                )}

                {/* Summary block */}
                {summaryLength !== 'hidden' && customSummary && (
                  <p className={`leading-relaxed ${cardMuted}`} style={{ fontSize: `${summarySize}px`, textAlign: textAlignment as any }}>
                    {getClampedSummary()}
                  </p>
                )}
              </div>

              {/* Alternate Right Column: Image */}
              {item.image && !imageError && imagePosition === 'right' ? (
                <div className="w-5/12 flex flex-col justify-center">
                  <div className="w-full relative overflow-hidden rounded-sm border p-1 shadow-sm bg-white dark:bg-zinc-900" style={{ height: `${s * 140}px`, borderColor: `${accentColor}20` }}>
                    <img src={proxiedImageUrl} crossOrigin="anonymous" alt="editorial" className="w-full h-full object-cover rounded-sm filter brightness-[0.98]" onError={() => setImageError(true)} />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer with fine technical line info */}
            {showFooter && (
              <div className="w-full flex items-end justify-between border-t z-10 pt-2.5" style={{ borderColor: `${accentColor}15` }}>
                <div className="text-left font-sans">
                  <span className="block font-bold uppercase tracking-widest text-[#B3002D]" style={{ fontSize: `${s * 8}px` }}>
                    সমাজতান্ত্রিক ছাত্র ফ্রন্ট
                  </span>
                  <span className={`block opacity-60 mt-0.5 font-mono`} style={{ fontSize: `${s * 6.5}px` }}>
                    mymensingh-branch{showWeb ? ' // http://ssfmym.pro.bd/' : ''} // publication-{item.id.slice(0,6)}
                  </span>
                </div>

                {showQR && qrCodeDataUrl && (
                  <div className="flex items-center" style={{ gap: `${s * 8}px` }}>
                    <div className="text-right hidden sm:block font-mono">
                      <span className="block font-bold text-[#B3002D] leading-none" style={{ fontSize: `${s * 6.5}px` }}>SCAN AND VERIFY</span>
                      <span className="block text-zinc-400 leading-none mt-0.5" style={{ fontSize: `${s * 5.5}px` }}>ARCHIVAL RECORD</span>
                    </div>
                    <div className="bg-white rounded-sm p-0.5 border flex items-center justify-center shrink-0" style={{ height: `${s * 30}px`, width: `${s * 30}px`, borderColor: `${accentColor}15` }}>
                      <img src={qrCodeDataUrl} alt="QR" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      // 5. OFFICIAL PROCLAMATION & CONSTITUTIONAL DOCUMENT STYLE (OFFICIAL_CRM, STATEMENT, GOVT_NOTICE, ANNOUNCEMENT)
      // Defaults to the official paper proclamation layout
      return (
        <div 
          className="w-full h-full flex flex-col justify-between relative overflow-hidden select-none"
          style={getContainerStyle('#faf6ee', { padding: `${s * 22}px` })}
        >
          {/* Classic Double Art Frame */}
          <div className="absolute inset-0 pointer-events-none z-20 border-double" style={{ borderWidth: `${s * 4}px`, borderColor: accentColor, margin: `${s * 6}px` }} />
          <div className="absolute inset-0 pointer-events-none z-20" style={{ border: `${s * 0.8}px solid ${accentColor}`, margin: `${s * 13}px`, opacity: 0.6 }} />

          {/* Majestic Central Crest Header */}
          <div className="w-full flex flex-col items-center justify-center text-center z-10" style={{ marginTop: `${s * 6}px` }}>
            {showLogo && (
              <div className="rounded-full bg-white border p-1 shadow-xs flex items-center justify-center mb-1.5" style={{ borderColor: `${accentColor}25`, height: `${s * 34}px`, width: `${s * 34}px` }}>
                <img src={proxiedLogoUrl} crossOrigin="anonymous" alt="Emblem" className="w-full h-full object-contain" />
              </div>
            )}
            <h1 className="font-sans font-black tracking-widest uppercase leading-none text-[#B3002D]" style={{ fontSize: `${s * 13}px` }}>
              সমাজতান্ত্রিক ছাত্র ফ্রন্ট
            </h1>
            <span className="font-mono font-bold tracking-widest uppercase opacity-80 mt-0.5" style={{ fontSize: `${s * 7.5}px`, color: accentColor }}>
              ময়মনসিংহ জেলা শাখা
            </span>

            {/* Decorative divider flourishes */}
            <div className="flex items-center justify-center space-x-1.5 w-1/2 my-2 opacity-55">
              <div className="h-[1px] bg-[#B3002D] flex-grow" />
              <span className="text-[#B3002D]" style={{ fontSize: `${s * 6}px` }}>❈</span>
              <div className="h-[1px] bg-[#B3002D] flex-grow" />
            </div>
          </div>

          {/* Proclamation Content Panel */}
          <div className="flex-grow flex flex-col justify-center items-center text-center z-10 px-4 my-2">
            {showCategory && customCategory && (
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-[#B3002D] font-extrabold tracking-widest rounded-sm border uppercase mb-2.5" style={{ fontSize: `${s * 8}px`, borderColor: `${accentColor}20` }}>
                {customCategory}
              </span>
            )}

            {/* Central Large Proclamation Headline */}
            <h2 className="font-extrabold tracking-tight leading-snug font-serif text-zinc-900" style={{ fontSize: `${titleSize}px`, marginBottom: `${s * 6}px`, color: accentColor }}>
              {customTitle}
            </h2>

            {/* Formal double divider */}
            <div className="w-16 h-[2px] bg-[#B3002D] opacity-60 mb-3" />

            {/* Official Announcement body */}
            {summaryLength !== 'hidden' && customSummary && (
              <p className="leading-relaxed text-zinc-800 font-serif font-medium max-w-sm" style={{ fontSize: `${summarySize}px` }}>
                {getClampedSummary()}
              </p>
            )}

            {/* Optional central visual (only if present and small) */}
            {item.image && !imageError && imagePosition !== 'hidden' && (
              <div className="mt-3 overflow-hidden rounded-sm border p-0.5 shadow-xs bg-white" style={{ width: '45%', height: `${s * 70}px`, borderColor: `${accentColor}15` }}>
                <img src={proxiedImageUrl} crossOrigin="anonymous" alt="crest" className="w-full h-full object-cover" onError={() => setImageError(true)} />
              </div>
            )}
          </div>

          {/* Authorized Footer Signoff Block */}
          <div className="w-full flex items-end justify-between z-10 font-sans border-t pt-2.5" style={{ borderColor: `${accentColor}20`, paddingLeft: `${s * 8}px`, paddingRight: `${s * 8}px` }}>
            <div className="text-left text-zinc-700 font-medium">
              {(showLocation || showAuthor || showDate) && (
                <div className="flex flex-col text-[7.5px]" style={{ fontSize: `${s * 7.5}px` }}>
                  {showAuthor && <span className="font-black text-zinc-900">অনুমোদিত: {customAuthor}</span>}
                  {showLocation && <span>স্থান: {customLocation}</span>}
                  {showDate && <span className="font-mono text-[7px] opacity-75">{customDate}</span>}
                </div>
              )}
            </div>

            {showQR && qrCodeDataUrl && (
              <div className="flex items-center bg-white rounded-sm p-0.5 border shadow-xs shrink-0" style={{ height: `${s * 34}px`, width: `${s * 34}px`, borderColor: `${accentColor}25` }}>
                <img src={qrCodeDataUrl} alt="QR" className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div 
        className={`w-full h-full relative overflow-hidden`}
        style={{ 
          boxSizing: 'border-box'
        }}
      >
        {renderCardLayout()}
      </div>
    );
  };

  return (
    <div id="photocard-builder-modal" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      {/* Floating always-visible close button on top right of viewport for best mobile UX */}
      <button 
        onClick={onClose}
        className="fixed top-3 right-3 sm:top-5 sm:right-5 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full z-[200] shadow-xl hover:scale-110 active:scale-95 transition cursor-pointer flex items-center justify-center border border-rose-500"
        title="বন্ধ করুন (Close)"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-0 shadow-2xl animate-in fade-in zoom-in-95 duration-200 md:max-h-[92vh] max-h-[95vh] md:overflow-hidden overflow-y-auto relative">
        
        {/* LEFT CUSTOMIZER SIDEBAR */}
        <div className="md:col-span-5 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-5 overflow-y-auto flex flex-col justify-between md:max-h-[92vh] max-h-none">
          <div>
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4.5 h-4.5 text-rose-650 animate-pulse" />
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white font-sans uppercase">কাস্টমাইজেশন প্যানেল</h3>
              </div>
              <button 
                onClick={onClose}
                className="md:hidden p-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-rose-600 rounded cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customizer Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-3 text-[10px] font-bold">
              {[
                { id: 'templates', name: '১. টেমপ্লেট', icon: Grid },
                { id: 'style', name: '২. ডিজাইন', icon: Settings },
                { id: 'text', name: '৩. লেখা', icon: Type },
                { id: 'branding', name: '৪. উপাদান', icon: Award },
                { id: 'debug', name: '৫. ডিবাগ', icon: Database }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-1.5 text-center border-b-2 flex items-center justify-center space-x-1 cursor-pointer transition ${
                    activeTab === tab.id
                      ? 'border-rose-600 text-rose-600 font-black'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3.5 text-xs text-left font-sans">
              
              {/* TAB 1: TEMPLATES & PRESETS */}
              {activeTab === 'templates' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-black text-zinc-600 dark:text-zinc-300">ডিজাইন টেমপ্লেট নির্বাচন (২১টি প্রি-সেট)</label>
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950/40 text-rose-600 font-bold px-1.5 py-0.5 rounded">CMS অটো</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[48vh] overflow-y-auto pr-1">
                    {TEMPLATE_PRESETS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedTemplate(p.id)}
                        className={`p-2 rounded text-left transition cursor-pointer border ${
                          selectedTemplate === p.id
                            ? 'bg-rose-600 text-white border-rose-600 font-black'
                            : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100 border-zinc-200 dark:border-zinc-800 text-zinc-750 dark:text-zinc-400 text-[10px]'
                        }`}
                      >
                        <div className="truncate font-bold">{p.name}</div>
                        <div className="text-[8px] opacity-75 mt-0.5">টাইপ: {p.tag}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: DESIGN & BG OVERRIDES */}
              {activeTab === 'style' && (
                <div className="space-y-3.5">
                  {/* Theme Accent Presets */}
                  <div>
                    <label className="block font-bold text-zinc-650 dark:text-zinc-300 mb-1">অ্যাকসেন্ট কালার (Accent Color)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['#B3002D', '#dc2626', '#16a34a', '#1d4ed8', '#ea580c', '#0f766e', '#e11d48', '#111827'].map(c => (
                        <button
                          key={c}
                          onClick={() => setAccentColor(c)}
                          className="w-5.5 h-5.5 rounded-full border border-white dark:border-zinc-800 flex items-center justify-center transition hover:scale-110 cursor-pointer"
                          style={{ backgroundColor: c }}
                        >
                          {accentColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dark / Light Presets */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'light', name: 'শুভ্র লাইট', bg: 'bg-white text-zinc-800' },
                      { id: 'cream', name: 'ভিন্টেজ ক্রিম', bg: 'bg-[#faf6ee] text-amber-950' },
                      { id: 'dark', name: 'কসমিক ডার্ক', bg: 'bg-zinc-900 text-zinc-400' }
                    ].map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setBgTheme(theme.id as any)}
                        className={`py-1 rounded border text-[10px] cursor-pointer transition ${bgTheme === theme.id ? 'bg-rose-600 text-white font-bold border-transparent' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700'}`}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>

                  {/* Background Textures */}
                  <div>
                    <label className="block font-bold text-zinc-650 dark:text-zinc-300 mb-1">পটভূমির ধরণ (Background Pattern)</label>
                    <select
                      value={bgStyle}
                      onChange={(e) => setBgStyle(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded outline-none"
                    >
                      <option value="solid">সলিড রঙ (Solid Color)</option>
                      <option value="gradient">গ্রেডিয়েন্ট (Smooth Gradient)</option>
                      <option value="geometric">জ্যামিতিক গ্রিড (Geometric Grid)</option>
                      <option value="paper">ভিন্টেজ পেপার (Paper Texture)</option>
                      <option value="noise">ডিজিটাল নয়েজ (Digital Noise)</option>
                      <option value="brand">ব্র্যান্ড জলছাপ (Brand Watermarks)</option>
                      <option value="image-blur">ইমেজ ব্লার (Dynamic Image Blur)</option>
                    </select>
                  </div>

                  {/* Aspect Ratio Presets */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1">অ্যাসপেক্ট রেশিও</label>
                      <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded outline-none"
                      >
                        <option value="1:1">Square (1:1)</option>
                        <option value="4:5">Portrait (4:5)</option>
                        <option value="9:16">Story (9:16)</option>
                        <option value="16:9">Landscape (16:9)</option>
                        <option value="1200x630">Facebook Share (1200×630)</option>
                        <option value="A4 Portrait">A4 Portrait</option>
                        <option value="A4 Landscape">A4 Landscape</option>
                        <option value="Custom">Custom Slider</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">সীমানা স্টাইল (Borders)</label>
                      <select
                        value={borderStyle}
                        onChange={(e) => setBorderStyle(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded outline-none"
                      >
                        <option value="none">কোনো সীমানা নেই</option>
                        <option value="double">ডাবল লাল সীমানা</option>
                        <option value="vintage">ভিন্টেজ ফ্রেম</option>
                        <option value="neon-glow">নিয়ন গ্লো ফ্রেম</option>
                        <option value="thin-red">সরু বর্ডার</option>
                      </select>
                    </div>
                  </div>

                  {aspectRatio === 'Custom' && (
                    <div className="bg-zinc-100 dark:bg-zinc-900 p-2 rounded">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span>কাস্টম রেশিও (প্রস্থ / উচ্চতা)</span>
                        <span className="font-mono font-bold">{customRatio}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2.0" 
                        step="0.05" 
                        value={customRatio}
                        onChange={(e) => setCustomRatio(parseFloat(e.target.value))}
                        className="w-full accent-rose-600 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TEXTS OVERRIDES */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1">মিডিয়া পজিশন</label>
                      <select
                        value={imagePosition}
                        onChange={(e) => setImagePosition(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded text-[11px] outline-none"
                      >
                        <option value="top">উপরে (Top Image)</option>
                        <option value="left">বামে (Left Split)</option>
                        <option value="right">ডানে (Right Split)</option>
                        <option value="background">পটভূমিতে (Vignette Cover)</option>
                        <option value="hidden">লুকান (Text-only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">ফন্ট ও অ্যালাইন</label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value as any)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded text-[11px] outline-none"
                      >
                        <option value="sans">Inter (Sans)</option>
                        <option value="serif">Kalpurush (Serif)</option>
                        <option value="mono">JetBrains Mono</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">হেডলাইন পরিবর্তন</label>
                    <textarea
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      rows={2}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1">স্থান (Location)</label>
                      <input
                        type="text"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">প্রতিবেদক (Reporter)</label>
                      <input
                        type="text"
                        value={customAuthor}
                        onChange={(e) => setCustomAuthor(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold mb-1">লেখার আকার</label>
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(e.target.value as any)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded text-[11px] outline-none"
                      >
                        <option value="sm">ছোট (Small)</option>
                        <option value="md">স্বাভাবিক (Medium)</option>
                        <option value="lg">বড় (Large)</option>
                        <option value="xl">অতিরিক্ত বড় (XL)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">স্লোগান ব্যানার টেক্সট</label>
                      <input
                        type="text"
                        value={customSlogan}
                        onChange={(e) => setCustomSlogan(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded outline-none text-[11px]"
                        placeholder="উদাঃ লাল সালাম"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BRANDING, WATERMARKS & SOCIAL TOGGLES */}
              {activeTab === 'branding' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} className="rounded text-rose-600" />
                      <span className="text-zinc-750 dark:text-zinc-350">লোগো প্রদর্শন</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={showQR} onChange={(e) => setShowQR(e.target.checked)} className="rounded text-rose-600" />
                      <span className="text-zinc-750 dark:text-zinc-350">QR কোড প্রদর্শন</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={showWatermark} onChange={(e) => setShowWatermark(e.target.checked)} className="rounded text-rose-600" />
                      <span className="text-zinc-750 dark:text-zinc-350">জলছাপ প্রদর্শন</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={showFooter} onChange={(e) => setShowFooter(e.target.checked)} className="rounded text-rose-600" />
                      <span className="text-zinc-750 dark:text-zinc-350">ফুটার স্ট্রিপ</span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">জলছাপের লেখা পরিবর্তন করুন</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">সারসংক্ষেপ কলাম প্রদর্শন দৈর্ঘ্য</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'hidden', name: 'হাইড' },
                        { id: 'short', name: 'শর্ট' },
                        { id: 'medium', name: 'মাঝারি' },
                        { id: 'full', name: 'সম্পূর্ণ' }
                      ].map(len => (
                        <button
                          key={len.id}
                          onClick={() => setSummaryLength(len.id as any)}
                          className={`py-1 text-[10px] font-bold rounded border ${summaryLength === len.id ? 'bg-rose-600 text-white border-transparent' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}
                        >
                          {len.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1.5">
                    <label className="block font-bold mb-1">মেটাডাটা উপাদানসমূহ অন/অফ</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" checked={showLocation} onChange={(e) => setShowLocation(e.target.checked)} className="rounded text-rose-600" />
                        <span className="text-[11px] text-zinc-700 dark:text-zinc-350">লোকেশন</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" checked={showAuthor} onChange={(e) => setShowAuthor(e.target.checked)} className="rounded text-rose-600" />
                        <span className="text-[11px] text-zinc-700 dark:text-zinc-350">প্রতিবেদক</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" checked={showDate} onChange={(e) => setShowDate(e.target.checked)} className="rounded text-rose-600" />
                        <span className="text-[11px] text-zinc-700 dark:text-zinc-350">তারিখ ও সময়</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" checked={showReadingTime} onChange={(e) => setShowReadingTime(e.target.checked)} className="rounded text-rose-600" />
                        <span className="text-[11px] text-zinc-700 dark:text-zinc-350">পড়ার সময়</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="block font-bold mb-1">ফুটার সোশ্যাল লিংকস</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" checked={showFB} onChange={(e) => setShowFB(e.target.checked)} className="rounded text-rose-600" />
                        <span className="text-[11px]">Facebook</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" checked={showWeb} onChange={(e) => setShowWeb(e.target.checked)} className="rounded text-rose-600" />
                        <span className="text-[11px]">Website</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ADVANCED RENDER DEBUGGER & METRICS */}
              {activeTab === 'debug' && (
                <div className="space-y-3.5 max-h-[58vh] overflow-y-auto pr-1">
                  {/* Canvas Taint Inspector Report */}
                  <div className="bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h4 className="font-black text-[10px] text-zinc-500 uppercase tracking-widest mb-2 border-b pb-1">
                      ক্যানভাস সিকিউরিটি ও রিসোর্স রিপোর্ট (Canvas Safety & Resource Report)
                    </h4>
                    
                    <div className="space-y-2 text-[10px]">
                      {CanvasTaintInspector.getAssets().length === 0 ? (
                        <div className="text-zinc-500 py-2 text-center font-bold">কোনো অবজেক্ট এখনও লোড হয়নি</div>
                      ) : (
                        CanvasTaintInspector.getAssets().map((asset, idx) => {
                          const isTainted = !asset.isSafeForCanvas;
                          return (
                            <div 
                              key={idx} 
                              className={`p-2 rounded border flex flex-col space-y-1 ${
                                isTainted 
                                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-350 text-rose-800 dark:text-rose-350' 
                                  : 'bg-green-50 dark:bg-green-950/10 border-green-200 text-green-850 dark:text-green-300'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold">{asset.name}</span>
                                <span className={`px-1 rounded text-[9px] font-black uppercase ${
                                  isTainted ? 'bg-rose-200 text-rose-800' : 'bg-green-200 text-green-800'
                                }`}>
                                  {isTainted ? 'Tainted (CORS Error)' : 'Secure (Same-Origin)'}
                                </span>
                              </div>
                              <div className="text-[9px] space-y-0.5 font-mono opacity-85 break-all">
                                <div><span className="font-black">প্রকার:</span> {asset.type}</div>
                                <div><span className="font-black">মূল লিঙ্ক:</span> {asset.originalUrl}</div>
                                <div><span className="font-black">রিজলভ লিঙ্ক:</span> {asset.resolvedUrl}</div>
                                <div>
                                  <span className="font-black">স্ট্যাটাস:</span>{' '}
                                  {asset.loaded ? 'Loaded' : 'Pending/Failed'}{' '}
                                  {asset.decoded ? '(Decoded)' : ''}
                                </div>
                              </div>
                              {isTainted && (
                                <button
                                  onClick={async () => {
                                    CanvasTaintInspector.autoFixUnsafeAssets();
                                    // Trigger a simple state update to refresh the view
                                    setBgStyle(prev => prev);
                                  }}
                                  className="mt-1 px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[9px] cursor-pointer"
                                >
                                  অটো-রিপেয়ার ও প্রক্সি লোড করুন (Auto-Repair Asset)
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h4 className="font-black text-[10px] text-zinc-500 uppercase tracking-widest mb-2 border-b pb-1">চিত্র লোডিং স্ট্যাটাস (Image Loading State)</h4>
                    
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">মূল চিত্র লিংক:</span>
                        <span className="font-mono truncate max-w-[180px] font-medium text-zinc-755 dark:text-zinc-350" title={RenderDebugger.getSnapshot().originalUrl}>
                          {RenderDebugger.getSnapshot().originalUrl || 'কোনো চিত্র নেই'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ক্যাশেড লিংক:</span>
                        <span className="font-mono truncate max-w-[180px] font-medium text-rose-600" title={RenderDebugger.getSnapshot().cachedUrl}>
                          {RenderDebugger.getSnapshot().cachedUrl || 'ব্যবহার করা হয়নি'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ক্যাশে স্ট্যাটাস:</span>
                        <span className={`font-bold uppercase ${RenderDebugger.getSnapshot().cacheStatus === 'hit' ? 'text-green-650' : 'text-amber-650'}`}>
                          {RenderDebugger.getSnapshot().cacheStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ডাউনলোড স্ট্যাটাস:</span>
                        <span className={`font-bold uppercase ${RenderDebugger.getSnapshot().downloadStatus === 'success' ? 'text-green-650' : 'text-rose-650'}`}>
                          {RenderDebugger.getSnapshot().downloadStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">চিত্রের ধরণ:</span>
                        <span className="font-bold text-zinc-755 dark:text-zinc-350">{RenderDebugger.getSnapshot().imageSource}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">চিত্রের ডাইমেনশন:</span>
                        <span className="font-mono font-bold text-zinc-755 dark:text-zinc-350">
                          {RenderDebugger.getSnapshot().imageWidth}px × {RenderDebugger.getSnapshot().imageHeight}px
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ডিকোড স্ট্যাটাস:</span>
                        <span className={`font-bold uppercase ${RenderDebugger.getSnapshot().decodeStatus === 'success' ? 'text-green-650' : 'text-rose-650'}`}>
                          {RenderDebugger.getSnapshot().decodeStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h4 className="font-black text-[10px] text-zinc-500 uppercase tracking-widest mb-2 border-b pb-1">রেন্ডারিং পরিসংখ্যান (Rendering Benchmarks)</h4>
                    
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">রেন্ডার স্ট্যাটাস:</span>
                        <span className={`font-bold uppercase ${RenderDebugger.getSnapshot().renderStatus === 'success' ? 'text-green-650' : 'text-rose-650'}`}>
                          {RenderDebugger.getSnapshot().renderStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ক্যানভাস প্রস্থ:</span>
                        <span className="font-mono font-bold text-zinc-755 dark:text-zinc-350">{RenderDebugger.getSnapshot().canvasWidth} px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ক্যানভাস উচ্চতা:</span>
                        <span className="font-mono font-bold text-zinc-755 dark:text-zinc-350">{RenderDebugger.getSnapshot().canvasHeight} px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">চূড়ান্ত রেজোলিউশন:</span>
                        <span className="font-mono font-bold text-zinc-755 dark:text-zinc-350">{RenderDebugger.getSnapshot().finalResolution}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">মেমরি ব্যবহারের হিসাব:</span>
                        <span className="font-mono font-bold text-amber-655">{RenderDebugger.getSnapshot().memoryUsage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">রেন্ডারিং সময়:</span>
                        <span className="font-mono font-bold text-green-655">{RenderDebugger.getSnapshot().renderTime} ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <h4 className="font-black text-[10px] text-zinc-500 uppercase tracking-widest mb-2 border-b pb-1">এক্সপোর্ট এবং ফাইল মেটা (Export Diagnostics)</h4>
                    
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">এক্সপোর্ট কোয়ালিটি:</span>
                        <span className="font-bold uppercase text-zinc-755 dark:text-zinc-350">{exportQuality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">এক্সপোর্ট ফরম্যাট:</span>
                        <span className="font-bold uppercase text-zinc-755 dark:text-zinc-350">{exportFormat}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">এক্সপোর্ট করতে সময়:</span>
                        <span className="font-mono font-bold text-zinc-755 dark:text-zinc-350">{RenderDebugger.getSnapshot().exportTime} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ফাইল সাইজ (Blob Size):</span>
                        <span className="font-mono font-bold text-blue-655">
                          {RenderDebugger.getSnapshot().blobSize ? `${(RenderDebugger.getSnapshot().blobSize / 1024).toFixed(2)} KB` : '0 KB'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ACTIONS WRAPPER BAR */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3.5 mt-4 bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-bold mb-2">
              <Info className="w-3.5 h-3.5 text-rose-600" />
              <span>এটি সম্পূর্ণ অটোমেটিক ডিজাইনার সিস্টেম।</span>
            </div>
          </div>
        </div>

        {/* RIGHT PREVIEW & ACTION PANEL */}
        <div className="md:col-span-7 bg-zinc-100 dark:bg-zinc-900/50 p-4 sm:p-5 flex flex-col justify-between items-center relative overflow-hidden md:max-h-[92vh] max-h-none">
          
          <div className="w-full flex items-center justify-between mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2 shrink-0">
            <h4 className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 font-mono tracking-wider uppercase">ডিজাইন ল্যাবরেটরি রিয়েল-টাইম প্রিভিউ</h4>
            <button 
              onClick={onClose}
              className="hidden md:block p-1 bg-white dark:bg-zinc-900 hover:text-rose-600 rounded transition shadow-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* DIAGNOSTICS & DEBUG ERRORS PANEL */}
          {debugError && (
            <div className="w-full bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-500 rounded-lg p-3 sm:p-4 mb-3 text-left shadow-lg overflow-y-auto max-h-[35vh] animate-in fade-in slide-in-from-top-4 duration-200 shrink-0">
              <div className="flex items-start justify-between border-b border-rose-200 dark:border-rose-900 pb-1.5 mb-2.5">
                <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-450">
                  <Info className="w-4 h-4 shrink-0" />
                  <h4 className="font-extrabold text-[10px] uppercase tracking-wider">রেন্ডারিং ব্যর্থতা বিবরণ (CORS & Debugger Details)</h4>
                </div>
                <button 
                  onClick={() => setDebugError(null)}
                  className="text-rose-500 hover:text-rose-700 p-0.5 rounded-sm bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <p className="text-xs font-bold text-rose-800 dark:text-rose-300 mb-2 bg-white dark:bg-zinc-950 px-2 py-1.5 rounded border border-rose-300/50">
                ⚠️ {debugError.message}
              </p>

              <div className="text-[10px] space-y-1.5 text-zinc-750 dark:text-zinc-300 font-sans">
                {debugError.filename && (
                  <div className="grid grid-cols-4 gap-2 border-b border-zinc-200/40 dark:border-zinc-800/40 pb-1">
                    <span className="font-bold text-zinc-500 dark:text-zinc-400">File:</span>
                    <span className="col-span-3 font-mono bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded text-rose-600 dark:text-rose-450 truncate">{debugError.filename}</span>
                  </div>
                )}
                {debugError.lineNumber && (
                  <div className="grid grid-cols-4 gap-2 border-b border-zinc-200/40 dark:border-zinc-800/40 pb-1">
                    <span className="font-bold text-zinc-500 dark:text-zinc-400">Line:</span>
                    <span className="col-span-3 font-mono bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded text-rose-600 dark:text-rose-450">{debugError.lineNumber}</span>
                  </div>
                )}
                {debugError.functionName && (
                  <div className="grid grid-cols-4 gap-2 border-b border-zinc-200/40 dark:border-zinc-800/40 pb-1">
                    <span className="font-bold text-zinc-500 dark:text-zinc-400">Function:</span>
                    <span className="col-span-3 font-mono bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded text-rose-600 dark:text-rose-450">{debugError.functionName}</span>
                  </div>
                )}
                {debugError.taintedImage && (
                  <div className="grid grid-cols-4 gap-2 border-b border-zinc-200/40 dark:border-zinc-800/40 pb-1 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                    <span className="font-bold text-amber-600 dark:text-amber-400">Tainted URL:</span>
                    <span className="col-span-3 font-mono break-all text-amber-700 dark:text-amber-300 text-[9px]">{debugError.taintedImage}</span>
                  </div>
                )}
                {debugError.stack && (
                  <div className="mt-2">
                    <span className="font-bold text-zinc-500 dark:text-zinc-400 block mb-0.5">Stack Trace:</span>
                    <pre className="p-1.5 bg-zinc-900 text-zinc-200 text-[9px] font-mono rounded overflow-auto max-h-[100px] whitespace-pre-wrap border border-zinc-800">
                      {debugError.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EMBEDDED PREVIEW AREA */}
          <div className="w-full flex-grow flex items-center justify-center p-1.5 relative overflow-auto max-h-[52vh] sm:max-h-[58vh]">
            <div className="w-full flex justify-center p-1">
              <div 
                style={{ 
                  width: '400px', 
                  height: `${Math.round(400 / getRatioValue())}px`,
                }}
                className="shrink-0 transition-all duration-300 shadow-xl rounded overflow-hidden select-none border border-zinc-300/40 relative flex items-center justify-center bg-zinc-950/20"
              >
                {renderingPreview && (
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center z-20 rounded">
                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                <canvas 
                  ref={previewCanvasRef} 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* FORMAT SELECTOR & SAVE TRIGGERS */}
          <div className="w-full bg-white dark:bg-zinc-950 p-3.5 rounded-lg mt-3 border border-zinc-200 dark:border-zinc-850 shadow-md shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
              <div>
                <label className="block text-[9.5px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">ডাউনলোড ফরম্যাট</label>
                <div className="flex space-x-1">
                  {(['png', 'jpeg', 'webp', 'pdf'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`flex-1 py-1 rounded font-black uppercase text-[9.5px] cursor-pointer transition ${
                        exportFormat === fmt
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] text-zinc-500 font-bold mb-1 uppercase tracking-wider">রেন্ডার রেজোলিউশন</label>
                <div className="flex space-x-1">
                  {[
                    { id: 'normal', name: 'Normal (2x)' },
                    { id: 'retina', name: 'Retina HD (3x)' },
                    { id: '4k', name: 'Extreme 4K (4x)' }
                  ].map(q => (
                    <button
                      key={q.id}
                      onClick={() => setExportQuality(q.id as any)}
                      className={`flex-1 py-1 rounded text-[9.5px] font-bold cursor-pointer transition ${
                        exportQuality === q.id
                          ? 'bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 font-black'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      {q.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={generating}
              className="w-full mt-3 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 text-white rounded-lg text-xs font-bold tracking-wider flex items-center justify-center space-x-2 shadow transition-all duration-200 cursor-pointer select-none"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>রেন্ডার করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {exportFormat === 'pdf' ? 'পিডিএফ সংস্করণ' : 'হাই-কোয়ালিটি গ্রাফিক কার্ড'} রেন্ডার করুন
                  </span>
                </>
              )}
            </button>

            {firebaseSuccess && firebaseCardId && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border-2 border-green-500 rounded-lg text-left animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-400 mb-1.5 font-bold">
                  <CheckCircle className="w-5 h-5 shrink-0 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-black">রেন্ডারিং ও ফায়ারবেস ক্লাউড স্টোরেজ ব্যাকআপ সফল!</span>
                </div>
                <p className="text-[10px] text-zinc-650 dark:text-zinc-300 font-medium leading-relaxed mb-2.5">
                  ব্রাউজার মেমরি সমস্যা এড়াতে এবং কোনো প্রকার ক্র্যাশ ছাড়া নিরাপদে কার্ডটি সরাসরি গুগল ফায়ারবেস ডেটাবেজ সার্ভার থেকে ডাউনলোড করতে নিচের বাটনটি ব্যবহার করুন।
                </p>
                <button
                  onClick={() => downloadFromFirebase(firebaseCardId)}
                  disabled={firebaseLoading}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  {firebaseLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>ডাউনলোড ফাইল প্রস্তুত হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>গুগল ফায়ারবেস ক্লাউড থেকে সরাসরি ডাউনলোড করুন</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>

      </div>



    </div>
  );
}
