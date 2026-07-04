import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Award, User, Phone, Mail, MapPin, Calendar, LogOut, CheckCircle2, ShieldCheck, FileText, BookOpen, Clock, Smartphone, Download, Sparkles, Flame, Camera, Link, Check, RefreshCw, Pencil, History, Save, Undo, Eye, X, Heart, Plus, Send } from 'lucide-react';
import { MemberRegistration, News, Circular, Book, WebSettings, Blog, getMemberBadgeText } from '../types';
import { motion } from 'motion/react';
import { useToast } from './Toast';
import { MemberCardRenderer, ValidationError, ValidationErrorDetail } from '../lib/canvas-renderer/MemberCardRenderer';
import { Exporter } from '../lib/canvas-renderer/Exporter';
import { Downloader } from '../lib/canvas-renderer/Downloader';
import { CanvasTaintInspector } from '../lib/canvas-renderer/CanvasTaintInspector';
import { LiveExportStore } from '../lib/debug/LiveExportStore';
import QRCode from 'qrcode';

interface MemberPortalProps {
  member: MemberRegistration;
  onLogout: () => void;
  onRefresh?: () => Promise<any> | any;
  onUpdateMember?: (updated: MemberRegistration) => Promise<boolean>;
  circulars: Circular[];
  books: Book[];
  settings?: WebSettings;
  blogs?: Blog[];
  onAddBlog?: (post: Omit<Blog, 'id' | 'views' | 'comments' | 'date'>) => Promise<boolean>;
  setCurrentTab?: (tab: string) => void;
}

export default function MemberPortal({ member, onLogout, onRefresh, onUpdateMember, circulars = [], books = [], settings, blogs = [], onAddBlog, setCurrentTab }: MemberPortalProps) {
  const toast = useToast();
  const memberId = `SSF-MYM-${member.id.substring(member.id.length - 5).toUpperCase()}`;
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [copied, setCopied] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<{ [key: string]: string }>({});

  // Fallback states for download pipeline
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);
  const [fallbackFilename, setFallbackFilename] = useState('');
  const [fallbackFormat, setFallbackFormat] = useState<'png' | 'pdf'>('png');
  const [fallbackBlob, setFallbackBlob] = useState<Blob | null>(null);
  const [fallbackPdf, setFallbackPdf] = useState<any>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadStepLogs, setDownloadStepLogs] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorDetail[] | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState(false);
  const [useProxy, setUseProxy] = useState(() => {
    if (typeof window !== 'undefined') {
      const isSandbox = window.location.hostname.includes('localhost') || 
                        window.location.hostname.includes('127.0.0.1') || 
                        window.location.hostname.includes('run.app');
      return isSandbox;
    }
    return true;
  });

  const toDataURL = async (url: string): Promise<string> => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    
    const isExternal = url.startsWith('http://') || url.startsWith('https://');
    const urlsToTry = isExternal
      ? [`/api/proxy-image?url=${encodeURIComponent(url)}`, url]
      : [url];
      
    for (const tryUrl of urlsToTry) {
      try {
        const res = await fetch(tryUrl, { method: 'GET', credentials: 'omit' });
        if (res.ok) {
          const blob = await res.blob();
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('FileReader error'));
            reader.readAsDataURL(blob);
          });
        }
      } catch (e) {
        console.warn(`toDataURL failed to fetch from ${tryUrl}:`, e);
      }
    }
    return url;
  };

  const prepareExportImages = async () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${window.location.protocol}//${window.location.host}/?verify-member=${member.id}`)}`;
    
    const imagesToLoad = [
      { key: 'logo1', url: 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png' },
      { key: 'logo2', url: 'https://i.ibb.co/R4BCPZ0B/20250130-143124.png' },
      member.photoUrl ? { key: 'profile', url: member.photoUrl } : null,
      settings?.idSignerSignatureUrl ? { key: 'signature', url: settings.idSignerSignatureUrl } : null,
      { key: 'qrCode', url: qrUrl }
    ].filter(Boolean) as { key: string; url: string }[];

    const loaded: { [key: string]: string } = {};
    await Promise.all(
      imagesToLoad.map(async (item) => {
        try {
          const base64 = await toDataURL(item.url);
          loaded[item.key] = base64;
        } catch (e) {
          console.error(`Failed to preload ${item.key}:`, e);
          loaded[item.key] = item.url;
        }
      })
    );
    return loaded;
  };

  const runExportWorkflow = async (callback: (sandboxEl: HTMLElement) => Promise<void>) => {
    try {
      setIsExporting(true);
      
      const loaded = await prepareExportImages();
      setPreloadedImages(loaded);
      
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      
      const sandboxEl = document.getElementById('export-card-sandbox');
      if (!sandboxEl) {
        throw new Error('Canvas elements missing');
      }
      
      await callback(sandboxEl);
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('দুঃখিত, ফাইল ডাউনলোডের সময় কোনো সমস্যা হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsExporting(false);
      setPreloadedImages({});
    }
  };

  useEffect(() => {
    if (!useProxy) return;
    const checkApi = async () => {
      try {
        const testUrl = 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png';
        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(testUrl)}`, { method: 'HEAD' });
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || contentType.includes('text/html')) {
          setUseProxy(false);
        }
      } catch (e) {
        setUseProxy(false);
      }
    };
    checkApi();
  }, [useProxy]);

  // Blog submission panel states
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCategory, setBlogCategory] = useState('মতামত ও প্রবন্ধ');
  const [blogImage, setBlogImage] = useState('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80');
  const [blogTags, setBlogTags] = useState('প্রবন্ধ, সদস্য_মত');
  const [blogSubmitLoading, setBlogSubmitLoading] = useState(false);
  const [blogSubmitSuccess, setBlogSubmitSuccess] = useState('');
  const [blogSubmitError, setBlogSubmitError] = useState('');

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogExcerpt.trim() || !blogContent.trim()) {
      setBlogSubmitError('দয়া করে প্রথম ৩টি ক্ষেত্র (শিরোনাম, পরিচিতি, প্রবন্ধের মূল অংশ) অবশ্যই পূরণ করুন।');
      return;
    }

    setBlogSubmitLoading(true);
    setBlogSubmitError('');
    setBlogSubmitSuccess('');

    try {
      const tagsArray = blogTags.split(',').map(t => t.trim()).filter(Boolean);
      
      const newBlogPost = {
        title: blogTitle.trim(),
        excerpt: blogExcerpt.trim(),
        content: blogContent.trim(),
        category: blogCategory,
        author: member.name,
        authorEmail: member.email,
        image: blogImage.trim() || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80',
        tags: tagsArray,
        status: 'pending' as const,
        readingTime: Math.ceil(blogContent.trim().split(/\s+/).length / 150) || 3
      };

      if (onAddBlog) {
        const success = await onAddBlog(newBlogPost as any);
        if (success) {
          setBlogSubmitSuccess('আপনার প্রবন্ধটি জেলা সম্পাদকের দপ্তরে সফলভাবে জমা হয়েছে। রিভিউ টিম যাচাই-বাছাই ও অনুমোদন করলে এই প্রবন্ধটি সবার জন্য প্রকাশ করা হবে।');
          setBlogTitle('');
          setBlogExcerpt('');
          setBlogContent('');
          setShowBlogForm(false);
          if (onRefresh) onRefresh();
        } else {
          setBlogSubmitError('প্রবন্ধ জমা করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।');
        }
      } else {
        setBlogSubmitError('সার্ভারে প্রবন্ধ গ্রহণের মডিউল সচল নয়।');
      }
    } catch (err: any) {
      console.error(err);
      setBlogSubmitError('ত্রুটি: ' + err.message);
    } finally {
      setBlogSubmitLoading(false);
    }
  };

  // Profile Edit and History state variables
  const [isEditing, setIsEditing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: member.name || '',
    mobile: member.mobile || '',
    email: member.email || '',
    dob: member.dob || '',
    bloodGroup: member.bloodGroup || '',
    address: member.address || '',
    institution: member.institution || '',
    department: member.department || '',
    academicYear: member.academicYear || '',
  });
  const [saveLoading, setSaveLoading] = useState(false);

  const startEditing = () => {
    setEditForm({
      name: member.name || '',
      mobile: member.mobile || '',
      email: member.email || '',
      dob: member.dob || '',
      bloodGroup: member.bloodGroup || '',
      address: member.address || '',
      institution: member.institution || '',
      department: member.department || '',
      academicYear: member.academicYear || '',
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    const changes: any[] = [];
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const editedBy = member.email || 'সদস্য নিজে';

    const fieldsToCompare = [
      { key: 'name', label: 'নাম' },
      { key: 'mobile', label: 'মোবাইল ফোন নম্বর' },
      { key: 'email', label: 'দাপ্তরিক ইমেইল' },
      { key: 'dob', label: 'জন্ম তারিখ' },
      { key: 'bloodGroup', label: 'রক্তের গ্রুপ' },
      { key: 'address', label: 'বর্তমান ঠিকানা' },
      { key: 'institution', label: 'শিক্ষা প্রতিষ্ঠান' },
      { key: 'department', label: 'শ্রেণি বা বিভাগ' },
      { key: 'academicYear', label: 'শিক্ষাবর্ষ বা সেশন' },
    ];

    fieldsToCompare.forEach(({ key, label }) => {
      const oldVal = (member as any)[key] || '';
      const newVal = (editForm as any)[key] || '';
      if (oldVal !== newVal) {
        changes.push({
          timestamp,
          editedBy,
          field: label,
          oldValue: oldVal,
          newValue: newVal
        });
      }
    });

    if (changes.length === 0) {
      setIsEditing(false);
      return;
    }

    const updatedHistory = [...(member.editHistory || []), ...changes];
    const updatedMember: MemberRegistration = {
      ...member,
      ...editForm,
      editHistory: updatedHistory
    };

    if (onUpdateMember) {
      setSaveLoading(true);
      const success = await onUpdateMember(updatedMember);
      setSaveLoading(false);
      if (success) {
        setIsEditing(false);
        if (onRefresh) await onRefresh();
      } else {
        toast.error('তথ্য সংশোধন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    }
  };

  const getProxiedUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('http') && !url.includes('api/proxy-image') && !url.includes(window.location.host)) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    const currentSrc = img.src;
    
    // If it has crossOrigin/crossorigin, remove it and retry the load
    if (img.removeAttribute && (img.getAttribute('crossorigin') || img.crossOrigin)) {
      img.removeAttribute('crossorigin');
      img.crossOrigin = null;
      
      // If it was a proxied URL, try using the raw URL directly without crossorigin
      if (currentSrc.includes('/api/proxy-image?url=')) {
        try {
          const parts = currentSrc.split('/api/proxy-image?url=');
          if (parts.length > 1) {
            const rawUrl = decodeURIComponent(parts[1]);
            if (rawUrl) {
              img.src = rawUrl;
              return;
            }
          }
        } catch (err) {
          console.error('Failed to parse original image URL from proxy:', err);
        }
      }
      
      // Reset src to trigger reload without crossorigin
      img.src = currentSrc;
      return;
    }
    
    // If it is already without crossorigin and was proxied, fallback to raw url
    if (currentSrc.includes('/api/proxy-image?url=')) {
      try {
        const parts = currentSrc.split('/api/proxy-image?url=');
        if (parts.length > 1) {
          const rawUrl = decodeURIComponent(parts[1]);
          if (rawUrl) {
            img.src = rawUrl;
          }
        }
      } catch (err) {
        console.error('Failed to parse original image URL:', err);
      }
    }
  };

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(memberId);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.error('Print trigger error:', err);
      toast.error('সরাসরি প্রিন্ট করার সময় কোনো সমস্যা হয়েছে। অনুগ্রহ করে আপনার ব্রাউজারের প্রিন্ট সেটিংস চেক করুন।');
    }
  };

  const getGreetingTime = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return 'শুভ সকাল কমরেড';
    if (hr >= 12 && hr < 17) return 'শুভ অপরাহ্ন কমরেড';
    return 'বিপ্লবী লাল সালাম কমরেড';
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMsg = `[${timestamp}] ${msg}`;
    console.log(formattedMsg);
    setDownloadStepLogs(prev => [...prev, formattedMsg]);
  };

  const runDiagnostics = async () => {
    setIsDiagnosing(true);
    setDiagnosticLogs([]);
    setShowDiagnosticsPanel(true);
    const logs: string[] = [];
    const addDiagLog = (msg: string) => {
      const timestamp = new Date().toLocaleTimeString();
      const formatted = `[${timestamp}] ${msg}`;
      logs.push(formatted);
      setDiagnosticLogs([...logs]);
    };

    addDiagLog('🔬 ই-কার্ড রেন্ডারিং এবং নেটওয়ার্ক ডায়াগনস্টিকস রান করা হচ্ছে...');
    
    try {
      // 1. Check Browser API support
      addDiagLog('১. ব্রাউজার সামঞ্জস্যতা স্ক্যান করা হচ্ছে...');
      const hasImageBitmap = typeof window.createImageBitmap === 'function';
      const hasOffscreen = typeof window.OffscreenCanvas !== 'undefined';
      const hasBlob = typeof HTMLCanvasElement.prototype.toBlob === 'function';
      
      addDiagLog(`- createImageBitmap সাপোর্ট: ${hasImageBitmap ? '✅ সচল' : '❌ অচল'}`);
      addDiagLog(`- OffscreenCanvas সাপোর্ট: ${hasOffscreen ? '✅ সচল' : '❌ অচল'}`);
      addDiagLog(`- Canvas.toBlob সাপোর্ট: ${hasBlob ? '✅ সচল' : '❌ অচল'}`);
      addDiagLog(`- ব্রাউজার ইউজার এজেন্ট: ${navigator.userAgent}`);

      // 2. Main Logo Direct & Proxy check
      addDiagLog('২. "মূল লোগো" সোর্স নেটওয়ার্ক স্ক্যান...');
      const logo1Url = 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png';
      try {
        addDiagLog(`- সরাসরি কানেকশন চেষ্টা করা হচ্ছে...`);
        const resDirect = await fetch(logo1Url, { mode: 'cors' });
        addDiagLog(`  - সরাসরি কানেকশন: ${resDirect.ok ? '✅ সফল' : `❌ ব্যর্থ (HTTP ${resDirect.status})`}`);
      } catch (directErr: any) {
        addDiagLog(`  - সরাসরি কানেকশন: ❌ অবরুদ্ধ (CORS policy বা ব্রাউজার সিকিউরিটি ব্লকিং) - এটি প্রত্যাশিত`);
      }
      try {
        addDiagLog(`- সিকিউর ইমেজ প্রক্সির মাধ্যমে রিকোয়েস্ট পাঠানো হচ্ছে...`);
        const resProxy = await fetch(`/api/proxy-image?url=${encodeURIComponent(logo1Url)}`);
        addDiagLog(`  - প্রক্সি রেসপন্স: ${resProxy.ok ? '✅ সফল' : `❌ ব্যর্থ (HTTP ${resProxy.status})`}`);
        if (resProxy.ok) {
          const blob = await resProxy.blob();
          addDiagLog(`  - প্রক্সি ডাউনলোড সম্পন্ন। ফাইলের সাইজ: ${blob.size} বাইটস, টাইপ: ${blob.type}`);
        }
      } catch (proxyErr: any) {
        addDiagLog(`  - প্রক্সি রিকোয়েস্ট চরম ব্যর্থ: ${proxyErr.message || proxyErr}`);
      }

      // 3. Banner Text Logo Check
      addDiagLog('৩. "ব্যানার টেক্সট লোগো" সোর্স নেটওয়ার্ক স্ক্যান...');
      const logo2Url = 'https://i.ibb.co/R4BCPZ0B/20250130-143124.png';
      try {
        addDiagLog(`- সিকিউর ইমেজ প্রক্সির মাধ্যমে রিকোয়েস্ট পাঠানো হচ্ছে...`);
        const resProxy = await fetch(`/api/proxy-image?url=${encodeURIComponent(logo2Url)}`);
        addDiagLog(`  - প্রক্সি রেসপন্স: ${resProxy.ok ? '✅ সফল' : `❌ ব্যর্থ (HTTP ${resProxy.status})`}`);
        if (resProxy.ok) {
          const blob = await resProxy.blob();
          addDiagLog(`  - প্রক্সি ডাউনলোড সম্পন্ন। ফাইলের সাইজ: ${blob.size} বাইটস`);
        }
      } catch (proxyErr: any) {
        addDiagLog(`  - প্রক্সি রিকোয়েস্ট চরম ব্যর্থ: ${proxyErr.message || proxyErr}`);
      }

      // 4. Member Profile Photo Check
      if (member.photoUrl) {
        addDiagLog(`৪. "মেম্বার প্রোফাইল ছবি" সোর্স নেটওয়ার্ক স্ক্যান... URL: ${member.photoUrl}`);
        try {
          addDiagLog(`- সিকিউর ইমেজ প্রক্সির মাধ্যমে রিকোয়েস্ট পাঠানো হচ্ছে...`);
          const resProxy = await fetch(`/api/proxy-image?url=${encodeURIComponent(member.photoUrl)}`);
          addDiagLog(`  - প্রক্সি রেসপন্স: ${resProxy.ok ? '✅ সফল' : `❌ ব্যর্থ (HTTP ${resProxy.status})`}`);
          if (resProxy.ok) {
            const blob = await resProxy.blob();
            addDiagLog(`  - প্রক্সি ডাউনলোড সম্পন্ন। ফাইলের সাইজ: ${blob.size} বাইটস`);
          } else {
            addDiagLog(`  - সমাধান: ছবিটির ইউআরএল হয়তো অবৈধ অথবা সার্ভার সংযোগ সাময়িকভাবে বিচ্ছিন্ন।`);
          }
        } catch (proxyErr: any) {
          addDiagLog(`  - প্রক্সি রিকোয়েস্ট চরম ব্যর্থ: ${proxyErr.message || proxyErr}`);
        }
      } else {
        addDiagLog('৪. "মেম্বার প্রোফাইল ছবি" অনুপস্থিত (মেম্বার প্রোফাইলে কোনো ছবি নেই)।');
      }

      // 5. Signature Check
      if (settings?.idSignerSignatureUrl) {
        addDiagLog(`৫. "ইস্যুকারীর স্বাক্ষর" সোর্স নেটওয়ার্ক স্ক্যান... URL: ${settings.idSignerSignatureUrl}`);
        try {
          addDiagLog(`- সিকিউর ইমেজ প্রক্সির মাধ্যমে রিকোয়েস্ট পাঠানো হচ্ছে...`);
          const resProxy = await fetch(`/api/proxy-image?url=${encodeURIComponent(settings.idSignerSignatureUrl)}`);
          addDiagLog(`  - প্রক্সি রেসপন্স: ${resProxy.ok ? '✅ সফল' : `❌ ব্যর্থ (HTTP ${resProxy.status})`}`);
          if (resProxy.ok) {
            const blob = await resProxy.blob();
            addDiagLog(`  - প্রক্সি ডাউনলোড সম্পন্ন। ফাইলের সাইজ: ${blob.size} বাইটস`);
          }
        } catch (proxyErr: any) {
          addDiagLog(`  - প্রক্সি রিকোয়েস্ট চরম ব্যর্থ: ${proxyErr.message || proxyErr}`);
        }
      } else {
        addDiagLog('৫. "ইস্যুকারীর স্বাক্ষর" অনুপস্থিত (ইস্যুকারীর স্বাক্ষরের ইউআরএল খালি)।');
      }

      // 6. QR generation and load check
      addDiagLog('৬. ভ্যালিডেশন কিউআর কোড জেনারেশন এবং মেমোরি রাইট টেস্ট...');
      try {
        const verifyUrl = `${window.location.protocol}//${window.location.host}/?verify-member=${member.id}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 360 });
        addDiagLog('  - কিউআর কোড ডেটা ইউআরএল সফলভাবে জেনারেট হয়েছে।');
        const img = new Image();
        img.src = qrDataUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        addDiagLog('  - জেনারেটেড কিউআর কোড ডিকোডিং টেস্ট সম্পন্ন হয়েছে।');
      } catch (qrErr: any) {
        addDiagLog(`  - কিউআর কোড টেস্ট ব্যর্থ: ${qrErr.message || qrErr}`);
      }

      addDiagLog('🎉 ডায়াগনস্টিকস সম্পন্ন হয়েছে! সমস্ত নেটওয়ার্ক পাথ এবং ব্রাউজার এপিআই সঠিকভাবে প্রসেস করা হয়েছে।');
    } catch (err: any) {
      addDiagLog(`❌ ডায়াগনস্টিকস চলাকালীন বিপর্যয় ঘটেছে: ${err.message || err}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const openInNewTab = () => {
    try {
      if (!fallbackImageUrl) {
        toast.error('ই-কার্ড ইমেজ প্রিভিউ পাওয়া যায়নি।');
        return;
      }
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`<title>SSF Member Card - ${member.name}</title><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#111827;color:#f3f4f6;font-family:sans-serif;"><div style="text-align:center;padding:20px;"><img src="${fallbackImageUrl}" style="max-width:100%;max-height:85vh;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);border-radius:12px;border:1px solid #374151;"/><p style="margin-top:20px;font-size:14px;color:#9ca3af;">💡 ছবিটির ওপর চেপে ধরে সরাসরি মোবাইলে সংরক্ষণ করুন / Right click and Save Image As to download</p></div></body>`);
        newTab.document.close();
      } else {
        toast.error('পপআপ উইন্ডো খোলার পারমিশন ব্লকড! অনুগ্রহ করে ব্রাউজার সেটিংসে পপআপ উইন্ডো অনুমোদন করুন।');
      }
    } catch (e) {
      console.error('Failed to open in new tab:', e);
      toast.error('নতুন ট্যাবে ছবি খুলতে ব্যর্থ হয়েছে।');
    }
  };

  const downloadPNG = async () => {
    setDownloadStepLogs([]);
    setDownloadError(null);
    setValidationErrors(null);
    setFallbackImageUrl(null);
    setFallbackBlob(null);

    // Initialize the live on-screen debug window session
    LiveExportStore.start(`SSF Member Card - ${member.name}`, 'png', () => downloadPNG());
    LiveExportStore.setStep('init', 'running');
    
    addLog('সদস্য ই-কার্ড (PNG) ডাউনলোড শুরু হচ্ছে...');
    setIsExporting(true);
    
    let canvas: HTMLCanvasElement | null = null;
    let success = false;
    let currentStep = 'init';
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      LiveExportStore.setStep('init', 'success');
      
      currentStep = 'template';
      LiveExportStore.setStep('template', 'running');
      addLog('ধাপ ১: মেম্বার কার্ডের লেআউট ও কালার স্কিম লোড করা হচ্ছে...');
      await new Promise(resolve => setTimeout(resolve, 200));
      LiveExportStore.setStep('template', 'success');

      currentStep = 'fonts';
      LiveExportStore.setStep('fonts', 'running');

      const customAddLog = (msg: string) => {
        addLog(msg);
        
        // Dynamically trace fonts/assets/images/render transitions
        if (msg.includes('বাংলা ও ইংরেজি ফন্টসমূহ')) {
          currentStep = 'fonts';
          LiveExportStore.setStep('fonts', 'running');
        } else if (msg.includes('ফন্ট প্রি-লোড সফল')) {
          LiveExportStore.setStep('fonts', 'success');
        } else if (msg.includes('লোগো, সদস্যের ছবি, কিউআর কোড')) {
          currentStep = 'assets';
          LiveExportStore.setStep('assets', 'running');
          LiveExportStore.setStep('qr', 'running');
          LiveExportStore.setStep('images', 'running');
        } else if (msg.includes('ভ্যালিডেশন কিউআর কোড') && msg.includes('সফল')) {
          LiveExportStore.setStep('qr', 'success');
        } else if (msg.includes('মেম্বার প্রোফাইল ছবি') && msg.includes('সফল')) {
          LiveExportStore.setStep('images', 'success');
        } else if (msg.includes('সবগুলো অ্যাসেট সফলভাবে')) {
          LiveExportStore.setStep('assets', 'success');
        }
      };

      addLog(`ধাপ ২: ক্যানভাস তৈরি করা হচ্ছে (Konva.js)...`);
      currentStep = 'render';
      LiveExportStore.setStep('render', 'running');
      canvas = await MemberCardRenderer.drawMemberCard(member, settings, 2.5, customAddLog);
      addLog('ক্যানভাস সফলভাবে জেনারেট হয়েছে। সাইজ: ' + canvas.width + 'x' + canvas.height);
      LiveExportStore.setStep('render', 'success');
      
      const dataUrl = canvas.toDataURL('image/png');
      setFallbackImageUrl(dataUrl);
      
      currentStep = 'validate';
      LiveExportStore.setStep('validate', 'running');
      addLog('ধাপ ৩: ক্যানভাস সিকিউরিটি এবং লেআউট ভ্যালিডেশন চেক করা হচ্ছে...');
      
      // Perform structural validation checks
      const testCtx = canvas.getContext('2d');
      if (testCtx) {
        testCtx.getImageData(0, 0, 1, 1); // will throw security error if tainted
      }
      addLog('ক্যানভাস সিকিউরিটি ভ্যালিডেশন সফল। কোনো প্রকার Taint পাওয়া যায়নি।');
      LiveExportStore.setStep('validate', 'success');

      currentStep = 'blob';
      LiveExportStore.setStep('blob', 'running');
      addLog('ধাপ ৪: ক্যানভাস থেকে ছবি (Blob) তৈরি করা হচ্ছে...');
      const filename = `SSF_Member_Card_${member.name.replace(/\s+/g, '_')}_${member.id.substring(0, 5)}.png`;
      setFallbackFilename(filename);
      setFallbackFormat('png');

      const blobResult = await MemberCardRenderer.exportCanvasToBlob(canvas);
      setFallbackBlob(blobResult);
      addLog(`ইমেজ ব্লব অবজেক্ট তৈরি সম্পন্ন। সাইজ: ${blobResult.size} বাইটস`);
      LiveExportStore.setStep('blob', 'success');
      
      currentStep = 'prepare_download';
      LiveExportStore.setStep('prepare_download', 'running');
      addLog('ধাপ ৫: ব্রাউজারে ফাইল ডাউনলোড প্রস্তুত করা হচ্ছে...');
      const fileUrl = URL.createObjectURL(blobResult);
      LiveExportStore.setStep('prepare_download', 'success');

      currentStep = 'download_started';
      LiveExportStore.setStep('download_started', 'running');
      addLog('ধাপ ৬: ব্রাউজারে ফাইল ডাউনলোড ট্রিগার করা হচ্ছে...');
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);
      addLog('ডাউনলোড সিগন্যাল সফলভাবে পাঠানো হয়েছে।');
      
      LiveExportStore.setStep('download_started', 'success');
      success = true;
    } catch (err: any) {
      if (err instanceof ValidationError) {
        addLog(`রেন্ডারিং ভ্যালিডেশন ব্যর্থতা: ${err.message}`);
        setValidationErrors(err.details);
        setDownloadError(err.message);
      } else {
        addLog(`ত্রুটি: ${err.message || err}`);
        setDownloadError(err.message || 'অজানা রেন্ডারিং বা ডাউনলোড ত্রুটি');
      }
      LiveExportStore.fail(currentStep, err);
    } finally {
      if (canvas && (canvas as any)._destroyStage) {
        (canvas as any)._destroyStage();
      }
      setIsExporting(false);
    }
    
    if (!success) {
      addLog('ডাউনলোড পাইপলাইন ব্যর্থ হয়েছে। বিস্তারিত দেখতে স্ক্রিনের প্যানেলটি ব্যবহার করুন।');
      setShowFallbackModal(true);
      toast.error('ডাউনলোড করা যায়নি। বিস্তারিত দেখতে স্ক্রিনের প্যানেলটি ব্যবহার করুন।');
    } else {
      toast.success('মেম্বার কার্ড ইমেজ সফলভাবে ডাউনলোড হয়েছে!');
    }
  };

  const downloadPDF = async () => {
    setDownloadStepLogs([]);
    setDownloadError(null);
    setValidationErrors(null);
    setFallbackImageUrl(null);
    setFallbackBlob(null);
    setFallbackPdf(null);
    
    // Initialize the live on-screen debug window session
    LiveExportStore.start(`SSF Member Card - ${member.name}`, 'pdf', () => downloadPDF());
    LiveExportStore.setStep('init', 'running');

    addLog('সদস্য ই-কার্ড (PDF) ডাউনলোড শুরু হচ্ছে...');
    setIsExporting(true);
    
    let canvas: HTMLCanvasElement | null = null;
    let success = false;
    let currentStep = 'init';
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      LiveExportStore.setStep('init', 'success');

      currentStep = 'template';
      LiveExportStore.setStep('template', 'running');
      addLog('ধাপ ১: মেম্বার কার্ডের লেআউট ও কালার স্কিম লোড করা হচ্ছে...');
      await new Promise(resolve => setTimeout(resolve, 200));
      LiveExportStore.setStep('template', 'success');

      currentStep = 'fonts';
      LiveExportStore.setStep('fonts', 'running');

      const customAddLog = (msg: string) => {
        addLog(msg);
        
        // Dynamically trace fonts/assets/images/render transitions
        if (msg.includes('বাংলা ও ইংরেজি ফন্টসমূহ')) {
          currentStep = 'fonts';
          LiveExportStore.setStep('fonts', 'running');
        } else if (msg.includes('ফন্ট প্রি-লোড সফল')) {
          LiveExportStore.setStep('fonts', 'success');
        } else if (msg.includes('লোগো, সদস্যের ছবি, কিউআর কোড')) {
          currentStep = 'assets';
          LiveExportStore.setStep('assets', 'running');
          LiveExportStore.setStep('qr', 'running');
          LiveExportStore.setStep('images', 'running');
        } else if (msg.includes('ভ্যালিডেশন কিউআর কোড') && msg.includes('সফল')) {
          LiveExportStore.setStep('qr', 'success');
        } else if (msg.includes('মেম্বার প্রোফাইল ছবি') && msg.includes('সফল')) {
          LiveExportStore.setStep('images', 'success');
        } else if (msg.includes('সবগুলো অ্যাসেট সফলভাবে')) {
          LiveExportStore.setStep('assets', 'success');
        }
      };

      addLog(`ধাপ ২: ক্যানভাস তৈরি করা হচ্ছে (Konva.js)...`);
      currentStep = 'render';
      LiveExportStore.setStep('render', 'running');
      canvas = await MemberCardRenderer.drawMemberCard(member, settings, 2.5, customAddLog);
      addLog('ক্যানভাস সফলভাবে জেনারেট হয়েছে। সাইজ: ' + canvas.width + 'x' + canvas.height);
      LiveExportStore.setStep('render', 'success');
      
      const dataUrl = canvas.toDataURL('image/png');
      setFallbackImageUrl(dataUrl);
      
      currentStep = 'validate';
      LiveExportStore.setStep('validate', 'running');
      addLog('ধাপ ৩: ক্যানভাস সিকিউরিটি এবং লেআউট ভ্যালিডেশন চেক করা হচ্ছে...');
      
      // Perform structural validation checks
      const testCtx = canvas.getContext('2d');
      if (testCtx) {
        testCtx.getImageData(0, 0, 1, 1);
      }
      addLog('ক্যানভাস সিকিউরিটি ভ্যালিডেশন সফল। কোনো প্রকার Taint পাওয়া যায়নি।');
      LiveExportStore.setStep('validate', 'success');

      currentStep = 'blob';
      LiveExportStore.setStep('blob', 'running');
      addLog('ধাপ ৪: ক্যানভাস থেকে PDF তৈরি করা হচ্ছে...');
      const filename = `SSF_Member_Card_${member.name.replace(/\s+/g, '_')}_${member.id.substring(0, 5)}.pdf`;
      setFallbackFilename(filename);
      setFallbackFormat('pdf');

      const pdfResult = await MemberCardRenderer.exportCanvasToPDF(canvas, filename);
      setFallbackPdf(pdfResult);
      addLog('PDF অবজেক্ট তৈরি সম্পন্ন।');
      LiveExportStore.setStep('blob', 'success');
      
      currentStep = 'prepare_download';
      LiveExportStore.setStep('prepare_download', 'running');
      addLog('ধাপ ৫: ব্রাউজারে PDF ডাউনলোড প্রস্তুত করা হচ্ছে...');
      const fileUrl = URL.createObjectURL(pdfResult);
      LiveExportStore.setStep('prepare_download', 'success');

      currentStep = 'download_started';
      LiveExportStore.setStep('download_started', 'running');
      addLog('ধাপ ৬: ব্রাউজারে PDF ডাউনলোড ট্রিগার করা হচ্ছে...');
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);
      addLog('PDF ডাউনলোড সিগন্যাল সফলভাবে পাঠানো হয়েছে।');
      
      LiveExportStore.setStep('download_started', 'success');
      success = true;
    } catch (err: any) {
      if (err instanceof ValidationError) {
        addLog(`রেন্ডারিং ভ্যালিডেশন ব্যর্থতা: ${err.message}`);
        setValidationErrors(err.details);
        setDownloadError(err.message);
      } else {
        addLog(`ত্রুটি: ${err.message || err}`);
        setDownloadError(err.message || 'অজানা রেন্ডারিং বা ডাউনলোড ত্রুটি');
      }
      LiveExportStore.fail(currentStep, err);
    } finally {
      if (canvas && (canvas as any)._destroyStage) {
        (canvas as any)._destroyStage();
      }
      setIsExporting(false);
    }
    
    if (!success) {
      addLog('ডাউনলোড পাইপলাইন ব্যর্থ হয়েছে। বিস্তারিত দেখতে স্ক্রিনের প্যানেলটি ব্যবহার করুন।');
      setShowFallbackModal(true);
      toast.error('PDF ডাউনলোড করা যায়নি। বিস্তারিত দেখতে স্ক্রিনের প্যানেলটি ব্যবহার করুন।');
    } else {
      toast.success('মেম্বার কার্ড PDF সফলভাবে ডাউনলোড হয়েছে!');
    }
  };

  const compressImage = (f: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      if (!f.type.startsWith('image/')) {
        resolve(f);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDimension = 800; // Profile photos only need to be 800px max
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          } else {
            resolve(f);
            return;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(f);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], f.name.substring(0, f.name.lastIndexOf('.')) + '.jpg', { type: 'image/jpeg' }));
              } else {
                resolve(f);
              }
            },
            'image/jpeg',
            0.80
          );
        };
        img.onerror = () => resolve(f);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve(f);
      reader.readAsDataURL(f);
    });
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    setUploadError('');

    try {
      const processedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('userName', member.name);

      const res = await fetch(`/api/upload-profile-photo?userName=${encodeURIComponent(member.name)}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        throw new Error('সার্ভারে ছবি আপলোড করা যায়নি। দয়া করে পুনরায় চেষ্টা করুন বা ছবির লিংক (URL) ব্যবহার করুন।');
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('ফাইল আপলোড মডিউলটি এই মুহূর্তে সফলভাবে উত্তর দেয়নি। অনুগ্রহ করে ছবির লিংক (URL) ব্যবহার করুন।');
      }
      const data = await res.json();
      if (!data || !data.url) {
        throw new Error('আপলোড করা ছবির সঠিক লিংক পাওয়া যায়নি।');
      }

      const finalUrl = data.url;

      // Update local node Express db.json if running full-stack
      await fetch(`/api/memberships/${member.id}/photo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: finalUrl })
      }).catch(err => console.warn('Non-blocking local photo db update failed:', err));
      
      // Log to edit history
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const editedBy = member.email || 'সদস্য নিজে';
      const photoChange = {
        timestamp,
        editedBy,
        field: 'প্রোফাইল ছবি / Photo',
        oldValue: member.photoUrl || 'নাই/None',
        newValue: finalUrl
      };
      const updatedHistory = [...(member.editHistory || []), photoChange];
      const updatedMember: MemberRegistration = {
        ...member,
        photoUrl: finalUrl,
        editHistory: updatedHistory
      };

      if (onUpdateMember) {
        await onUpdateMember(updatedMember);
      }

      toast.success('প্রোফাইল ছবি সফলভাবে আপলোড এবং ফায়ারবেইসে সংরক্ষণ করা হয়েছে!');

      // Refresh the db context in parents
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'ছবি আপলোড ও সংরক্ষণ করতে অপ্রত্যাশিত ত্রুটি দেখা দিয়েছে।');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrlInput.trim()) return;
    setLoadingUrl(true);
    setUploadError('');
    
    const targetUrl = photoUrlInput.trim();

    try {
      let finalPhotoUrl = targetUrl;
      
      // Download the image through backend proxy, saving to server uploads
      if (useProxy) {
        try {
          const res = await fetch('/api/upload-profile-photo-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              imageUrl: targetUrl,
              userName: member.name
            })
          });
          
          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await res.json();
              if (data && data.url) {
                finalPhotoUrl = data.url;
              }
            }
          } else {
            console.warn('Backend download failed, falling back to direct URL');
          }
        } catch (backendErr) {
          console.warn('Backend download error, falling back to direct URL', backendErr);
        }
      }

      // Also update local Express db.json if running full-stack
      await fetch(`/api/memberships/${member.id}/photo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: finalPhotoUrl })
      }).catch(err => console.warn('Non-blocking local db update failed:', err));

      // Save to Firestore member database
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const editedBy = member.email || 'সদস্য নিজে';
      const photoChange = {
        timestamp,
        editedBy,
        field: 'প্রোফাইল ছবি / Photo',
        oldValue: member.photoUrl || 'নাই/None',
        newValue: finalPhotoUrl
      };
      const updatedHistory = [...(member.editHistory || []), photoChange];
      const updatedMember: MemberRegistration = {
        ...member,
        photoUrl: finalPhotoUrl,
        editHistory: updatedHistory
      };

      if (onUpdateMember) {
        const success = await onUpdateMember(updatedMember);
        if (!success) {
          throw new Error('সদস্য প্রোফাইল আপডেট ব্যর্থ হয়েছে।');
        }
      }

      toast.success('ছবি লিংক সফলভাবে সংরক্ষণ করা হয়েছে!');
      setPhotoUrlInput('');
      
      // Refresh the db context in parents
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'ছবিটি সংরক্ষণ করতে অপ্রত্যাশিত ত্রুটি দেখা দিয়েছে।');
    } finally {
      setLoadingUrl(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-950 to-rose-950/60 p-6 sm:p-10 rounded border border-rose-950/30 text-white mb-8 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 blur-[150px] rounded-full pointer-events-none transition duration-500 group-hover:bg-rose-500/15" />
        <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="bg-rose-600 text-white font-mono text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-widest select-none flex items-center gap-1">
                <Sparkles className="w-3" />
                ডিজিটাল মেম্বার ড্যাশবোর্ড
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-extrabold px-2.5 py-0.5 rounded flex items-center gap-1 select-none border border-emerald-500/20 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                সক্রিয় ভেরিফাইড সদস্য
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug text-white">
              {getGreetingTime()}, <span className="text-rose-500 font-bold">{member.name}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl font-sans leading-relaxed flex flex-wrap items-center gap-1.5">
              <span>সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা শাখার অফিশিয়াল পোর্টালে আপনাকে স্বাগত।</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column - Card visual and details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Printable Visual Card wrapper - explicitly targeted with id */}
          <div className="print:p-0">
            <div id="member-identity-card" className="bg-gradient-to-br from-zinc-200 to-rose-200 p-[1.5px] rounded-lg shadow-2xl overflow-hidden relative group">
              <div className="bg-white p-6 relative flex flex-col justify-between min-h-[350px]">
                
                {/* Background watermarks */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-rose-500/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border border-dashed border-rose-600/15 flex items-center justify-center pointer-events-none select-none">
                  <img
                    src={getProxiedUrl('https://i.ibb.co.com/F4MKM3R2/20260527-055637.png')}
                    alt="Watermark Logo"
                    className="w-28 h-28 object-contain opacity-[0.06] saturate-125"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={handleImageError}
                  />
                </div>

                {/* ID Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3 relative">
                  <div className="flex items-center gap-3">
                    <img
                      src={getProxiedUrl('https://i.ibb.co.com/F4MKM3R2/20260527-055637.png')}
                      alt="সমাজতান্ত্রিক ছাত্র ফ্রন্ট লোগো"
                      className="h-10 w-10 object-contain"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={handleImageError}
                    />
                    <div className="flex flex-col">
                      <img
                        src={getProxiedUrl('https://i.ibb.co/R4BCPZ0B/20250130-143124.png')}
                        alt="সমাজতান্ত্রিক ছাত্র ফ্রন্ট"
                        className="h-8.5 sm:h-9 w-auto object-contain saturate-125 contrast-125"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={handleImageError}
                      />
                      <p className="text-[8px] text-zinc-500 font-mono tracking-widest mt-0.5">
                        MYMENSINGH DISTRICT
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-rose-100 text-rose-700 font-sans text-[9px] font-extrabold border border-rose-200 px-2 py-0.5 rounded shadow-xs select-none uppercase tracking-wide">
                      {getMemberBadgeText(member)}
                    </span>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="grid grid-cols-12 gap-3.5 my-4 items-start relative">
                  {/* Photo area with fallback User icon or actual path */}
                  <div className="col-span-3 flex flex-col items-center justify-start pt-1.5">
                    <div className="w-[88px] h-[110px] rounded border border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center text-rose-600 relative overflow-hidden shadow-sm shrink-0">
                      {member.photoUrl ? (
                        <img 
                          src={getProxiedUrl(member.photoUrl)} 
                          alt={member.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={handleImageError}
                        />
                      ) : (
                        <>
                          <User className="w-8 h-8 opacity-40 text-rose-600" />
                          <div className="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[7px] py-[1.5px] text-center font-bold tracking-wider uppercase font-mono">
                            APPROVED
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Member info */}
                  <div className="col-span-9 space-y-1.5 font-sans">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      <div className="col-span-2">
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">নাম / Full Name</span>
                        <strong className="text-[12px] font-bold text-zinc-900 tracking-wide block leading-snug mt-0.5">{member.name}</strong>
                      </div>

                      <div>
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">শ্রেণি / Class</span>
                        <span className="text-[10px] text-zinc-800 font-bold block truncate leading-tight mt-0.5">{member.department || 'সদস্য'}</span>
                      </div>

                      <div>
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">রক্তের গ্রুপ / Blood</span>
                        <span className="text-[10px] text-zinc-900 font-bold block leading-tight mt-0.5">{member.bloodGroup || 'N/A'}</span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">শিক্ষা প্রতিষ্ঠান / Institution</span>
                        <span className="text-[10.5px] text-zinc-800 font-semibold block truncate leading-tight mt-0.5">{member.institution}</span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">মোবাইল / Mobile No</span>
                        <span className="text-[10px] font-mono text-zinc-800 font-bold block leading-tight mt-0.5">{member.mobile}</span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">ঠিকানা / Address</span>
                        <span className="text-[9.5px] text-zinc-700 block leading-tight truncate mt-0.5">{member.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer info */}
                <div className="flex items-end justify-between pt-3 border-t border-zinc-200 mt-2 text-zinc-500 text-[9px] relative font-sans">
                  
                  {/* Left Block: Code & Issue Date */}
                  <div className="space-y-1.5 text-left flex-1 min-w-0 pr-2">
                    {!isExporting ? (
                      <div className="print:hidden">
                        <button 
                          onClick={handleCopy}
                          className="font-mono text-left cursor-pointer hover:text-rose-600 transition active:scale-95 group/code block"
                          title="ক্লিক করুন কপি করতে"
                        >
                          <span className="text-[7.5px] text-zinc-500 group-hover/code:text-rose-600 uppercase tracking-widest block font-sans transition leading-none">মেম্বারশিপ কোড (ক্লিক করে কপি করুন)</span>
                          <strong className="text-zinc-850 group-hover/code:text-zinc-950 text-[10px] font-bold tracking-wider block transition leading-tight mt-0.5">{memberId}</strong>
                        </button>
                        
                        <div className="mt-1.5">
                          <span className="text-[7.5px] text-zinc-500 uppercase tracking-wider block font-sans leading-none">ইস্যু ডেট</span>
                          <strong className="text-zinc-700 block font-mono font-bold text-[9px] leading-tight mt-0.5">{member.verifiedAt || member.appliedAt}</strong>
                        </div>
                      </div>
                    ) : null}

                    {/* QR Code and verification tag during export (html2canvas) */}
                    {isExporting && (
                      <div className="flex flex-col items-start space-y-1">
                        <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-extrabold leading-none">Validate this card</span>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.protocol}//${window.location.host}/?verify-member=${member.id}`)}`}
                          alt="Verification QR Code"
                          className="w-11 h-11 object-contain rounded bg-white p-[1px] border border-zinc-200"
                        />
                      </div>
                    )}

                    {/* QR Code and verification tag during native print */}
                    <div className="hidden print:flex flex-col items-start space-y-1">
                      <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-extrabold leading-none">Validate this card</span>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.protocol}//${window.location.host}/?verify-member=${member.id}`)}`}
                        alt="Verification QR Code"
                        className="w-11 h-11 object-contain rounded bg-white p-[1px] border border-zinc-200"
                      />
                    </div>
                  </div>

                  {/* Right Block: Signer Config */}
                  <div className="text-center w-44 shrink-0 flex flex-col items-center justify-end relative">
                    <span className="text-[7.5px] font-sans text-rose-600 uppercase tracking-wider block font-bold leading-none mb-1">ইস্যুকারীর স্বাক্ষর</span>
                    <div className="h-8 relative flex items-center justify-center w-full">
                      {settings?.idSignerSignatureUrl ? (
                        <img 
                          src={getProxiedUrl(settings.idSignerSignatureUrl)} 
                          alt="Signature" 
                          className="h-7.5 max-w-[125px] object-contain select-none"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="h-7 border-b border-dashed border-zinc-300 w-24 mb-0.5" />
                      )}
                    </div>
                    <div className="border-t border-zinc-200 pt-1 w-full flex flex-col items-center select-none">
                      <span className="text-[9px] text-zinc-900 font-extrabold block tracking-wide truncate max-w-full leading-tight">{settings?.idSignerName || 'তানজিল হোসেন মুণিম'}</span>
                      <span className="text-[7.5px] text-zinc-700 block truncate max-w-full leading-none mt-0.5">{settings?.idSignerRoleLine1 || 'সভাপতি'}</span>
                      <span className="text-[7px] text-zinc-550 block truncate max-w-full leading-none mt-0.5">{settings?.idSignerRoleLine2 || 'সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা'}</span>
                    </div>
                  </div>
                  
                </div>

              </div>
            </div>
          </div>

          {/* Print and Download Actions */}
          <div className="mt-4 grid grid-cols-2 gap-2 font-sans text-xs">
            <button
              onClick={downloadPNG}
              className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded shadow cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG ডাউনলোড</span>
            </button>

            <button
              onClick={downloadPDF}
              className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-750 font-extrabold rounded shadow cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>PDF ডাউনলোড</span>
            </button>
          </div>
          
          <button
            onClick={handlePrint}
            className="mt-2 w-full py-2 bg-transparent text-zinc-400 hover:text-white border border-zinc-900 border-dashed hover:border-zinc-700 text-xs font-bold rounded cursor-pointer transition flex items-center justify-center gap-1"
          >
            <Clock className="w-3 h-3" />
            <span>সরাসরি সিস্টেমে প্রিন্ট করুন (Window Print)</span>
          </button>

          <button
            onClick={runDiagnostics}
            disabled={isDiagnosing}
            className="mt-2 w-full py-2 bg-rose-950/20 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-950/40 text-xs font-bold rounded cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            <Flame className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isDiagnosing ? 'ডায়াগনস্টিক টেস্ট রান হচ্ছে...' : 'ই-কার্ড ডাউনলোড ও নেটওয়ার্ক ডায়াগনস্টিকস রান করুন'}</span>
          </button>

          {showDiagnosticsPanel && (
            <div className="mt-3 bg-zinc-950 border border-zinc-900 rounded p-4 space-y-3 font-mono text-[10px] leading-relaxed text-zinc-350">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 uppercase">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  সিস্টেম ডায়াগনস্টিক লগ রিপোর্ট
                </span>
                <button 
                  onClick={() => setShowDiagnosticsPanel(false)} 
                  className="text-zinc-550 hover:text-zinc-350 text-[11px]"
                >
                  [বন্ধ করুন]
                </button>
              </div>
              <div className="h-48 overflow-y-auto space-y-1 bg-black/40 p-2.5 rounded border border-zinc-900/60 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
                {diagnosticLogs.map((log, idx) => (
                  <div key={idx} className={log.includes('❌') ? 'text-rose-400 font-semibold' : log.includes('✅') ? 'text-emerald-400' : 'text-zinc-300'}>
                    {log}
                  </div>
                ))}
              </div>
              <p className="text-[9.5px] text-zinc-500 font-sans leading-relaxed">
                💡 যদি ডায়াগনস্টিক রিপোর্টে লাল রঙের <b>❌ অবরুদ্ধ</b> বা <b>ব্যর্থতা</b> মেসেজ দেখেন, তবে বুঝবেন ওই নির্দিষ্ট ইমেজ লিংক বা রিসোর্সটি ডাউনলোড করা সম্ভব হচ্ছে না। বিস্তারিত তথ্য দিয়ে এডমিনকে সেটিংস থেকে ছবি পরিবর্তন করতে বলুন।
              </p>
            </div>
          )}

          {/* Profile Photo Uploader panel */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-5 shadow-sm space-y-4 font-sans">
            <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-205 flex items-center gap-1.5 pb-2 border-b border-zinc-150 dark:border-zinc-900">
              <Camera className="w-4 h-4 text-rose-600" />
              <span>প্রোফাইল ছবি আপলোড</span>
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 overflow-hidden shrink-0">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt="কমরেড ছবি" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-8 h-8 opacity-45" />
                )}
              </div>
              
              <div className="flex-1 space-y-2 w-full">
                <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-normal">
                  আপনার ছবি আপলোড করুন যা মেম্বারশিপ কার্ডে স্বয়ংক্রিয়ভাবে সংযুক্ত হবে।
                </p>
                <div 
                  className="relative border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-rose-500 rounded p-3 text-center cursor-pointer transition bg-zinc-50/50 dark:bg-zinc-900/20"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      await handlePhotoUpload(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        await handlePhotoUpload(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingPhoto || loadingUrl}
                  />
                  <div className="text-[11px] font-bold text-zinc-650 dark:text-zinc-400">
                    {uploadingPhoto ? 'ফাইলে সঞ্চিত হচ্ছে...' : 'ক্লিক করুন বা ছবি এখানে ড্রপ করুন'}
                  </div>
                </div>
              </div>
            </div>

            {/* URL Link Fetcher Block */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900/40 space-y-2 font-sans">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">বা ছবিটির ওয়েব লিংক (URL) প্রদান করুন:</label>
              <form onSubmit={handlePhotoUrlSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-400 pointer-events-none">
                    <Link className="w-3.5 h-3.5 text-zinc-400" />
                  </span>
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    disabled={uploadingPhoto || loadingUrl}
                    className="text-xs font-sans border border-zinc-200 dark:border-zinc-850 rounded pl-8 pr-2 py-1.5 w-full bg-white dark:bg-zinc-950 focus:outline-rose-500/20 transition text-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploadingPhoto || loadingUrl || !photoUrlInput.trim()}
                  className="px-3 py-1.5 bg-zinc-850 hover:bg-rose-700 text-zinc-100 hover:text-white border border-zinc-750 hover:border-rose-900/40 text-xs font-bold rounded flex items-center gap-1.5 transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-xs shrink-0"
                >
                  {loadingUrl ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                      <span>ডাউনলোড হচ্ছে...</span>
                    </>
                  ) : (
                    <span>সংরক্ষণ করুন</span>
                  )}
                </button>
              </form>
            </div>
            {uploadError && <p className="text-[10px] text-rose-600 font-semibold">{uploadError}</p>}
          </div>

          {/* Revolutionary Oath Panel */}
          <div className="p-4 border border-rose-900/35 bg-rose-950/15 rounded space-y-3">
            <h4 className="text-xs font-extrabold text-rose-500 flex items-center gap-1.5 font-sans">
              <Flame className="w-4 h-4 text-rose-600" />
              <span>{settings?.oathTitle || 'ঐতিহাসিক বৈপ্লবিক অঙ্গীকার'}</span>
            </h4>
            <div className="text-[11px] text-zinc-650 dark:text-zinc-400 leading-normal whitespace-pre-wrap">
              {settings?.oathBody || 'সমাজতান্ত্রিক ছাত্র ফ্রন্ট কোনো প্রাতিষ্ঠানিক ডিগ্রি সংগ্রহের রাজনৈতিক লিয়াজোঁ ক্লাব নয়। এটি সাম্রাজ্যবাদ, পুঁজিবাদ ও সাম্প্রদায়িকতাবিরোধী সর্বজনীন মানবিক লড়াই শক্তিশালী করার বিপ্লব মডিউল। শিক্ষা, সুস্থ সংস্কৃতি ও প্রগতির বিপ্লবী পতাকাতলে সমাজ রূপান্তরে আত্মনিয়োগ করুন।'}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Action items & materials (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <h2 className="text-sm font-extrabold text-zinc-950 dark:text-white flex items-center gap-2">
              <Sparkles className="text-rose-600 w-5 h-5 shrink-0" />
              <span>সদস্য অ্যাকাউন্ট ও নথিপত্র ড্যাশবোর্ড</span>
            </h2>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">
              সংগঠন থেকে প্রকাশিত সর্বশেষ নোটিশ, বই এবং গুরুত্বপূর্ণ কর্মসূচী সমূহ দেখে নিন।
            </p>
          </div>

          {/* Core Member Details Card with self editing and historical logger updates */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <User className="w-4 h-4 text-rose-600" />
                <span>ব্যক্তিগত মেম্বারশিপ প্রোফাইল</span>
                <span className="text-[10px] bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-sans px-2 py-0.5 rounded">
                  {getMemberBadgeText(member)}
                </span>
              </h3>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={startEditing}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-rose-600 dark:bg-zinc-900 dark:hover:bg-rose-600 text-zinc-800 dark:text-zinc-200 hover:text-white rounded text-[10px] font-bold cursor-pointer transition"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>তথ্য সংশোধন করুন</span>
                    </button>
                    {(member.editHistory && member.editHistory.length > 0) && (
                      <button
                        onClick={() => setShowHistoryModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-150 hover:bg-zinc-250 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[10px] font-bold cursor-pointer transition"
                        title="পরিবর্তন লগের তালিকা দেখুন"
                      >
                        <History className="w-3 h-3 text-rose-500" />
                        <span>ইতিহাস ({member.editHistory.length})</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saveLoading}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer transition"
                    >
                      {saveLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      <span>সংরক্ষণ করুন</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={saveLoading}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-150 hover:bg-zinc-250 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded text-[10px] font-bold cursor-pointer transition"
                    >
                      <Undo className="w-3 h-3" />
                      <span>বাতিল</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">পূর্ণ নাম</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-200 block truncate font-sans">
                    {member.name}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">মোবাইল ফোন নম্বর</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-200 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-mono">{member.mobile}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">দাপ্তরিক ইমেইল এড্রেস</span>
                  <span className="font-bold text-zinc-855 dark:text-zinc-200 flex items-center gap-1 truncate">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-mono overflow-hidden pr-2">{member.email || 'তথ্য নাই'}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">জন্ম তারিখ (DOB)</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-200 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-mono">{member.dob || 'তথ্য নাই'}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">রক্তের গ্রুপ (Blood Group)</span>
                  {member.bloodGroup ? (
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <span className="bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/40 text-xs font-mono font-bold">{member.bloodGroup}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-zinc-500 italic text-[11px]">সেট করা নাই</span>
                      <button
                        type="button"
                        onClick={() => startEditing()}
                        className="text-[9px] bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-bold cursor-pointer transition-all duration-150 inline-flex items-center"
                      >
                        সেট করুন (Set Now)
                      </button>
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">শিক্ষা প্রতিষ্ঠান</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-200 block truncate">
                    {member.institution}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">শ্রেণি বা বিভাগ</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-200 block truncate">
                    {member.department || 'তথ্য নাই'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">শিক্ষাবর্ষ বা সেশন</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-200 block truncate">
                    {member.academicYear || 'তথ্য নাই'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-mono">মেইল বা বর্তমান ঠিকানা</span>
                  <span className="font-bold text-zinc-855 dark:text-zinc-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{member.address}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-sans text-xs pt-1.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">পূর্ণ নাম / Name</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-rose-500"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">মোবাইল ফোন নম্বর / Mobile</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-rose-500 font-mono"
                      value={editForm.mobile}
                      onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">ইমেইল এড্রেস / Email</label>
                    <input
                      type="email"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-rose-500 font-mono"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">জন্ম তারিখ (Date of Birth / DOB)</label>
                    <input
                      type="text"
                      placeholder="যেমন: ১৫ আগস্ট ২০০২"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-rose-500"
                      value={editForm.dob}
                      onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">রক্তের গ্রুপ (Blood Group)</label>
                    <select
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-rose-500"
                      value={editForm.bloodGroup}
                      onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    >
                      <option value="">নির্বাচন করুন</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">শিক্ষা প্রতিষ্ঠান / Institution</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-rose-500"
                      value={editForm.institution}
                      onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">শ্রেণি বা বিভাগ / Department</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-rose-500"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-zinc-400 mb-1">শিক্ষাবর্ষ বা সেশন / Session</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-rose-500"
                      value={editForm.academicYear}
                      onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-zinc-400 mb-1">বর্তমান মেইলিং ঠিকানা / Address</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-rose-500"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-500/5 border border-amber-500/10 text-amber-500 text-[10px] rounded leading-normal">
                  ⚠️ <b>মনোযোগ দিন:</b> তথ্য পরিবর্তন করার পর এটি আপনার পরিবর্তন ইতিহাসের তালিকায় ("change-log") একটি নতুন ভুক্টি হিসেবে সংরক্ষিত থাকবে যেখানে পরিবর্তনের পূর্বে কি ছিল ও কখন কি করা হয়েছে তার রেকর্ড থাকবে।
                </div>
              </div>
            )}
          </div>

          {/* Change History Modal */}
          {showHistoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-zinc-150 dark:border-zinc-900 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-rose-600 animate-pulse" />
                    <div>
                      <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">সদস্য তথ্য সংশোধনীর ইতিহাস</h3>
                      <p className="text-[9px] text-zinc-500">আপনার পরিবর্তিত তথ্যের নিখুঁত ডিজিটাল পরিবর্তন-লগ (Audit History)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowHistoryModal(false)}
                    className="p-1 text-zinc-400 hover:text-rose-500 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-3 divide-y divide-zinc-100 dark:divide-zinc-900">
                  {member.editHistory && member.editHistory.length > 0 ? (
                    member.editHistory.map((item, index) => (
                      <div key={index} className="pt-3 first:pt-0 text-[11px] font-sans">
                        <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1.5 font-mono">
                          <span className="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                            সংশোধক: {item.editedBy === member.email ? 'মেম্বার স্বয়ং' : item.editedBy}
                          </span>
                          <span>{item.timestamp}</span>
                        </div>
                        <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                          ক্ষেত্র: <span className="text-rose-600">{item.field}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-1.5 p-2 bg-zinc-50 dark:bg-zinc-900/60 rounded font-mono text-[10px] border border-zinc-200/50 dark:border-zinc-900">
                          <div>
                            <span className="text-zinc-400 block font-sans text-[8px] uppercase">পূর্বে ছিল</span>
                            <span className="text-rose-600/95 line-through truncate block">{item.oldValue || '(ফাঁকা)'}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block font-sans text-[8px] uppercase">পরিবর্তিত রূপ</span>
                            <span className="text-emerald-500 font-bold truncate block">{item.newValue}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      কোনো পরিবর্তনের ইতিহাস খুঁজে পাওয়া যায়নি।
                    </div>
                  )}
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-150 dark:border-zinc-900 text-right">
                  <button 
                    onClick={() => setShowHistoryModal(false)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-xs font-bold cursor-pointer transition"
                  >
                    বুঝেছি, বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Member Blog Writing and Approval Panel */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-5 sm:p-6 shadow-xs space-y-4 font-sans">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-600" />
                <span>আমার রাজনৈতিক ও বৈপ্লবিক লেখনী (My Blogs)</span>
              </h3>
              <button
                onClick={() => {
                  setShowBlogForm(!showBlogForm);
                  setBlogSubmitError('');
                  setBlogSubmitSuccess('');
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 text-white hover:bg-rose-700 rounded text-[10px] font-bold cursor-pointer transition shadow-xs"
              >
                {showBlogForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{showBlogForm ? 'বন্ধ করুন' : 'নতুন প্রবন্ধ লিখুন'}</span>
              </button>
            </div>

            {/* Success and Error messages */}
            {blogSubmitSuccess && (
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs rounded leading-relaxed">
                {blogSubmitSuccess}
              </div>
            )}
            {blogSubmitError && (
              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs rounded leading-relaxed">
                {blogSubmitError}
              </div>
            )}

            {/* Create Blog Form */}
            {showBlogForm && (
              <form onSubmit={handleBlogSubmit} className="space-y-3.5 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded border border-zinc-200 dark:border-zinc-850">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-650">নতুন প্রবন্ধ খসড়া</h4>
                
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold block">প্রবন্ধের শিরোনাম (Title) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="যেমনঃ শিক্ষাক্ষেত্রে নৈরাজ্য ও আমাদের করণীয়"
                    className="w-full text-xs p-2 rounded-sm border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-850 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold block">সংক্ষিপ্ত পরিচিতি / সারসংক্ষেপ (Excerpt) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={blogExcerpt}
                    onChange={(e) => setBlogExcerpt(e.target.value)}
                    placeholder="পাঠককে আকৃষ্ট করতে ২-৩ লাইনের সংক্ষিপ্ত বর্ণনা লিখুন..."
                    className="w-full text-xs p-2 rounded-sm border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-850 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold block">ক্যাটাগরি / বিভাগ</label>
                    <select
                      value={blogCategory}
                      onChange={(e) => setBlogCategory(e.target.value)}
                      className="w-full text-xs p-2 rounded-sm border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-850 dark:text-white"
                    >
                      <option value="আজকালকার রাজনীতি">আজকালকার রাজনীতি</option>
                      <option value="শিক্ষা ও আদর্শ">শিক্ষা ও আদর্শ</option>
                      <option value="দলীয় পর্যালোচনা">দলীয় পর্যালোচনা</option>
                      <option value="ঐতিহাসিক সংগ্রাম">ঐতিহাসিক সংগ্রাম</option>
                      <option value="মতামত ও প্রবন্ধ">মতামত ও প্রবন্ধ</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold block">ট্যাগসমূহ (কমা দিয়ে আলাদা করুন)</label>
                    <input
                      type="text"
                      value={blogTags}
                      onChange={(e) => setBlogTags(e.target.value)}
                      placeholder="যেমনঃ শিক্ষা, সংগ্রাম, ছাত্রফ্রন্ট"
                      className="w-full text-xs p-2 rounded-sm border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-850 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold block">ফিচার্ড ছবির লিংক (Image URL)</label>
                  <input
                    type="url"
                    value={blogImage}
                    onChange={(e) => setBlogImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs p-2 rounded-sm border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-850 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold block">প্রবন্ধের মূল বিষয়বস্তু (Content - Markdown supported) <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    rows={8}
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    placeholder="আপনার প্রবন্ধের বিস্তারিত ও বিশদ আলোচনা এখানে লিখুন..."
                    className="w-full text-xs p-2.5 rounded-sm border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-850 dark:text-white font-sans leading-relaxed"
                  />
                </div>

                <div className="pt-1.5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBlogForm(false)}
                    className="px-3.5 py-1.5 bg-zinc-200 dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded cursor-pointer hover:bg-zinc-300 transition"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={blogSubmitLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded cursor-pointer hover:bg-rose-700 transition disabled:opacity-50 shadow-xs"
                  >
                    {blogSubmitLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{blogSubmitLoading ? 'জমা হচ্ছে...' : 'রিভিউতে পাঠান (Submit)'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List Submitted Blogs */}
            <div className="space-y-2 text-zinc-800 dark:text-zinc-200">
              <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">আমার জমাকৃত প্রবন্ধসমূহের তালিকা ({(blogs || []).filter(b => b.authorEmail === member.email).length})</h4>
              
              {((blogs || []).filter(b => b.authorEmail === member.email)).length === 0 ? (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded border border-zinc-200/50 dark:border-zinc-900 text-center text-zinc-400 italic text-[11px]">
                  প্রবন্ধের তালিকা শূন্য! প্রগতিশীল ও বিপ্লবী সাহিত্য চর্চা বাড়াতে আপনার প্রথম প্রবন্ধটি সাবমিট করুন।
                </div>
              ) : (
                <div className="divide-y divide-zinc-150 dark:divide-zinc-850 max-h-[250px] overflow-y-auto pr-1">
                  {(blogs || []).filter(b => b.authorEmail === member.email).map((b) => (
                    <div
                      key={b.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`ব্লগ প্রবন্ধঃ ${b.title}`}
                      onClick={() => {
                        if (setCurrentTab) {
                          window.history.pushState(null, '', `?tab=news&blogId=${b.id}`);
                          setCurrentTab('news');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (setCurrentTab) {
                            window.history.pushState(null, '', `?tab=news&blogId=${b.id}`);
                            setCurrentTab('news');
                          }
                        }
                      }}
                      className="py-2.5 px-3 flex items-center justify-between text-xs gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/60 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition duration-150 outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                    >
                      <div className="min-w-0">
                        <span className="text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 font-mono px-1 py-0.5 rounded font-bold mr-1.5">{b.category}</span>
                        <h5 className="font-bold text-zinc-850 dark:text-zinc-200 truncate mt-0.5">{b.title}</h5>
                        <p className="text-[9px] text-zinc-400 mt-0.5">{b.date || 'আজ'}</p>
                      </div>
                      <div className="shrink-0">
                        {b.status === 'pending' ? (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border border-amber-200/50 px-2 py-0.5 rounded">রিভিউাধীন (Pending)</span>
                        ) : b.status === 'rejected' ? (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 dark:text-rose-450 dark:bg-rose-955 px-2 py-0.5 rounded">বাতিলকৃত (Rejected)</span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-450 dark:bg-emerald-950/20 border border-emerald-250 px-2 py-0.5 rounded">প্রকাশিত (Published)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabular Shortcuts: Latest Circulars & Study Library */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Box 1: Recent Circulars */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-4 shadow-3xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-205 pb-2.5 border-b border-zinc-150 dark:border-zinc-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>অভ্যন্তরীণ সার্কুলার ও নোটিশ</span>
                </h4>
                
                <div className="mt-3.5 space-y-2.5 pb-4">
                  {circulars.slice(0, 3).map((circ) => (
                    <div
                      key={circ.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`সার্কুলারঃ ${circ.title}`}
                      onClick={() => {
                        if (setCurrentTab) {
                          window.history.pushState(null, '', `?tab=circulars&circularId=${circ.id}`);
                          setCurrentTab('circulars');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (setCurrentTab) {
                            window.history.pushState(null, '', `?tab=circulars&circularId=${circ.id}`);
                            setCurrentTab('circulars');
                          }
                        }
                      }}
                      className="text-[11px] font-sans p-2.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition duration-150 outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                    >
                      <span className="text-[9px] text-zinc-400 font-mono block">{circ.date}</span>
                      <p className="font-semibold text-zinc-750 dark:text-zinc-300 hover:text-rose-650 transition line-clamp-1 mt-0.5">{circ.title}</p>
                    </div>
                  ))}

                  {circulars.length === 0 && (
                    <p className="text-[10px] text-zinc-455 italic py-4">কোনো নোটিশ আপলোড করা হয়নি।</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-50 dark:border-zinc-900/60">
                <button
                  onClick={() => setCurrentTab?.('circulars')}
                  className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer bg-transparent border-0 p-0 text-left outline-none focus-visible:ring-1 focus-visible:ring-rose-500 rounded px-1"
                >
                  সমস্ত সার্কুলার বোর্ড দেখুন
                </button>
              </div>
            </div>

            {/* Box 2: Library Books */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-4 shadow-3xs flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 pb-2.5 border-b border-zinc-150 dark:border-zinc-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-rose-600" />
                  <span>মার্ক্সবাদী ও প্রগতিশীল লাইব্রেরি</span>
                </h4>
                
                <div className="mt-3.5 space-y-2.5 pb-4">
                  {books.slice(0, 3).map((book) => (
                    <div
                      key={book.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`বইঃ ${book.title}`}
                      onClick={() => {
                        if (setCurrentTab) {
                          window.history.pushState(null, '', `?tab=books&bookId=${book.id}`);
                          setCurrentTab('books');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (setCurrentTab) {
                            window.history.pushState(null, '', `?tab=books&bookId=${book.id}`);
                            setCurrentTab('books');
                          }
                        }
                      }}
                      className="text-[11px] font-sans p-2.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition duration-150 flex gap-2.5 outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                    >
                      <img src={book.coverImage} alt={book.title} className="w-8 h-10 object-cover rounded border border-zinc-200/50" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-750 dark:text-zinc-300 line-clamp-1">{book.title}</p>
                        <span className="text-[9px] text-zinc-400 block font-sans mt-0.5">লেখকঃ {book.author}</span>
                      </div>
                    </div>
                  ))}

                  {books.length === 0 && (
                    <p className="text-[10px] text-zinc-450 italic py-4">কোনো বই বা ম্যাগাজিন নথিবদ্ধ নেই।</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-50 dark:border-zinc-900/60">
                <button
                  onClick={() => setCurrentTab?.('books')}
                  className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer bg-transparent border-0 p-0 text-left outline-none focus-visible:ring-1 focus-visible:ring-rose-500 rounded px-1"
                >
                  লাইব্রেরী ও প্রকাশনা পাতা দেখুন
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Sandbox High-Resolution Card for Flawless PNG/PDF Generation */}
      <div 
        id="export-card-sandbox" 
        className="fixed -left-[9999px] top-0 pointer-events-none w-[1011px] h-[638px] bg-gradient-to-br from-zinc-200 to-rose-200 p-[3px] rounded-[24px] overflow-hidden flex items-center justify-center"
        style={{ zIndex: -1000 }}
      >
        <div className="bg-white w-[1005px] h-[632px] rounded-[22px] p-12 relative flex flex-col justify-between box-border">
          {/* Background Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-dashed border-rose-600/15 flex items-center justify-center pointer-events-none select-none">
            <img
              src={preloadedImages.logo1 || 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png'}
              alt="Watermark Logo"
              className="w-56 h-56 object-contain opacity-[0.06] saturate-125"
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-5 relative">
            <div className="flex items-center gap-5">
              <img
                src={preloadedImages.logo1 || 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png'}
                alt="সমাজতান্ত্রিক ছাত্র ফ্রন্ট লোগো"
                className="h-16 w-16 object-contain"
              />
              <div className="flex flex-col">
                <img
                  src={preloadedImages.logo2 || 'https://i.ibb.co/R4BCPZ0B/20250130-143124.png'}
                  alt="সমাজতান্ত্রিক ছাত্র ফ্রন্ট"
                  className="h-13 w-auto object-contain saturate-125 contrast-125"
                />
                <p className="text-[12px] text-zinc-500 font-mono tracking-[4px] mt-1 font-bold">
                  MYMENSINGH DISTRICT
                </p>
              </div>
            </div>
            <div>
              <span className="bg-rose-100 text-rose-700 font-sans text-[14px] font-extrabold border-2 border-rose-200 px-4 py-1 rounded-md shadow-xs select-none uppercase tracking-wider">
                {getMemberBadgeText(member)}
              </span>
            </div>
          </div>

          {/* Main Body */}
          <div className="grid grid-cols-12 gap-6 my-6 items-start relative flex-1">
            {/* Profile Photo */}
            <div className="col-span-3 flex flex-col items-center justify-center">
              <div className="w-[180px] h-[225px] rounded-lg border-2 border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center text-rose-600 relative overflow-hidden shadow-md shrink-0">
                {(preloadedImages.profile || member.photoUrl) ? (
                  <img 
                    src={preloadedImages.profile || member.photoUrl} 
                    alt={member.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <>
                    <User className="w-16 h-16 opacity-40 text-rose-600" />
                    <div className="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[10px] py-[3px] text-center font-bold tracking-widest uppercase font-mono">
                      APPROVED
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info Details */}
            <div className="col-span-9 space-y-3 font-sans">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="col-span-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">নাম / Full Name</span>
                  <strong className="text-[20px] font-extrabold text-zinc-900 tracking-wide block leading-snug mt-1">{member.name}</strong>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">শ্রেণি / Class</span>
                  <span className="text-[14px] text-zinc-800 font-bold block leading-tight mt-1">{member.department || 'সদস্য'}</span>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">রক্তের গ্রুপ / Blood</span>
                  <span className="text-[14px] text-zinc-900 font-bold block leading-tight mt-1">{member.bloodGroup || 'N/A'}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">শিক্ষা প্রতিষ্ঠান / Institution</span>
                  <span className="text-[15px] text-zinc-800 font-semibold block leading-tight mt-1">{member.institution}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">মোবাইল / Mobile No</span>
                  <span className="text-[14px] font-mono text-zinc-800 font-bold block leading-tight mt-1">{member.mobile}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">ঠিকানা / Address</span>
                  <span className="text-[13px] text-zinc-700 block leading-tight mt-1 truncate">{member.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between pt-4 border-t-2 border-zinc-200 mt-2 text-zinc-500 text-[12px] relative font-sans">
            {/* Left Block: QR Code Validation */}
            <div className="flex items-center gap-4">
              <img 
                src={preloadedImages.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${window.location.protocol}//${window.location.host}/?verify-member=${member.id}`)}`}
                alt="Verification QR Code"
                className="w-18 h-18 object-contain rounded bg-white p-[2px] border border-zinc-200 shadow-xs shrink-0"
              />
              <div className="space-y-1 text-left min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold block leading-none">VALIDATE THIS CARD</span>
                <strong className="text-zinc-800 text-[12px] font-mono font-bold tracking-wider block leading-tight mt-1">{memberId}</strong>
                <span className="text-[10px] text-zinc-500 block leading-none mt-1">Issue Date: <strong className="font-mono">{member.verifiedAt || member.appliedAt}</strong></span>
              </div>
            </div>

            {/* Right Block: Signer Config */}
            <div className="text-center w-56 shrink-0 flex flex-col items-center justify-end relative">
              <span className="text-[11px] font-sans text-rose-600 uppercase tracking-wider block font-bold leading-none mb-1">ইস্যুকারীর স্বাক্ষর</span>
              <div className="h-10 relative flex items-center justify-center w-full">
                {(preloadedImages.signature || settings?.idSignerSignatureUrl) ? (
                  <img 
                    src={preloadedImages.signature || settings?.idSignerSignatureUrl} 
                    alt="Signature" 
                    className="h-10 max-w-[150px] object-contain select-none"
                  />
                ) : (
                  <div className="h-8 border-b border-dashed border-zinc-300 w-36 mb-1" />
                )}
              </div>
              <div className="border-t border-zinc-200 pt-1.5 w-full flex flex-col items-center select-none">
                <span className="text-[12px] text-zinc-900 font-extrabold block tracking-wide truncate max-w-full leading-tight">{settings?.idSignerName || 'তানজিল হোসেন মুণিম'}</span>
                <span className="text-[11px] text-zinc-700 block truncate max-w-full leading-none mt-0.5">{settings?.idSignerRoleLine1 || 'সভাপতি'}</span>
                <span className="text-[10px] text-zinc-500 block truncate max-w-full leading-none mt-0.5">{settings?.idSignerRoleLine2 || 'সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portal Container for Centered Single Page Printing */}
      {createPortal(
        <div id="member-identity-card-print-container" className="hidden print:flex">
          <div className="printable-id-card">
            {/* Background watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border border-dashed border-rose-600/15 flex items-center justify-center pointer-events-none select-none">
              <img
                src="https://i.ibb.co.com/F4MKM3R2/20260527-055637.png"
                alt="Watermark Logo"
                className="w-28 h-28 object-contain opacity-[0.06] saturate-125"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={handleImageError}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2 relative">
              <div className="flex items-center gap-2">
                <img
                  src="https://i.ibb.co.com/F4MKM3R2/20260527-055637.png"
                  alt="সমাজতান্ত্রিক ছাত্র ফ্রন্ট লোগো"
                  className="h-8 w-8 object-contain"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={handleImageError}
                />
                <div className="flex flex-col">
                  <img
                    src="https://i.ibb.co/R4BCPZ0B/20250130-143124.png"
                    alt="সমাজতান্ত্রিক ছাত্র ফ্রন্ট"
                    className="h-6 w-auto object-contain saturate-125 contrast-125"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={handleImageError}
                  />
                  <p className="text-[6px] text-zinc-500 font-mono tracking-widest mt-0.5">
                    MYMENSINGH DISTRICT
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-rose-100 text-rose-700 font-sans text-[7px] font-extrabold border border-rose-200 px-1.5 py-0.5 rounded shadow-xs select-none uppercase tracking-wide">
                  {getMemberBadgeText(member)}
                </span>
              </div>
            </div>

            {/* Main Body */}
            <div className="grid grid-cols-12 gap-2 my-2 items-start relative flex-1">
              {/* Profile Photo */}
              <div className="col-span-3 flex flex-col items-center justify-start">
                <div className="w-[66px] h-[82px] rounded border border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center text-rose-600 relative overflow-hidden shadow-xs shrink-0">
                  {member.photoUrl ? (
                    <img 
                      src={member.photoUrl} 
                      alt={member.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                    />
                  ) : (
                    <>
                      <User className="w-6 h-6 opacity-40 text-rose-600" />
                      <div className="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[5px] py-[1px] text-center font-bold tracking-wider uppercase font-mono">
                        APPROVED
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Info Details */}
              <div className="col-span-9 space-y-0.5 font-sans">
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  <div className="col-span-2">
                    <span className="text-[6px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">নাম / Full Name</span>
                    <strong className="text-[9.5px] font-bold text-zinc-900 tracking-wide block leading-tight mt-0.5">{member.name}</strong>
                  </div>

                  <div>
                    <span className="text-[6px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">শ্রেণি / Class</span>
                    <span className="text-[8px] text-zinc-800 font-bold block leading-tight mt-0.5">{member.department || 'সদস্য'}</span>
                  </div>

                  <div>
                    <span className="text-[6px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">রক্তের গ্রুপ / Blood</span>
                    <span className="text-[8px] text-zinc-900 font-bold block leading-tight mt-0.5">{member.bloodGroup || 'N/A'}</span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[6px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">শিক্ষা প্রতিষ্ঠান / Institution</span>
                    <span className="text-[8.5px] text-zinc-800 font-semibold block leading-tight mt-0.5 truncate">{member.institution}</span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[6px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">মোবাইল / Mobile No</span>
                    <span className="text-[8px] font-mono text-zinc-800 font-bold block leading-tight mt-0.5">{member.mobile}</span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[6px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">ঠিকানা / Address</span>
                    <span className="text-[7.5px] text-zinc-700 block leading-tight mt-0.5 truncate">{member.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between pt-1.5 border-t border-zinc-200 mt-1 text-zinc-500 text-[7.5px] relative font-sans">
              <div className="flex items-center gap-2">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.protocol}//${window.location.host}/?verify-member=${member.id}`)}`}
                  alt="Verification QR Code"
                  className="w-8 h-8 object-contain rounded bg-white p-[1px] border border-zinc-200"
                />
                <div className="text-left">
                  <span className="text-[5.5px] text-zinc-500 uppercase tracking-widest font-extrabold block leading-none">VALIDATE THIS CARD</span>
                  <strong className="text-zinc-800 text-[8px] font-mono font-bold tracking-wider block leading-tight mt-0.5">{memberId}</strong>
                  <span className="text-[6px] text-zinc-500 block leading-none mt-0.5">Issue Date: <span className="font-mono">{member.verifiedAt || member.appliedAt}</span></span>
                </div>
              </div>

              {/* Right Signature Block */}
              <div className="text-center w-32 shrink-0 flex flex-col items-center justify-end relative">
                <span className="text-[6px] font-sans text-rose-600 uppercase tracking-wider block font-bold leading-none mb-0.5">ইস্যুকারীর স্বাক্ষর</span>
                <div className="h-6 relative flex items-center justify-center w-full">
                  {settings?.idSignerSignatureUrl ? (
                    <img 
                      src={settings.idSignerSignatureUrl} 
                      alt="Signature" 
                      className="h-5 max-w-[80px] object-contain select-none"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="h-5 border-b border-dashed border-zinc-300 w-20 mb-0.5" />
                  )}
                </div>
                <div className="border-t border-zinc-200 pt-0.5 w-full flex flex-col items-center select-none">
                  <span className="text-[7.5px] text-zinc-900 font-extrabold block tracking-wide truncate max-w-full leading-tight">{settings?.idSignerName || 'তানজিল হোসেন মুণিম'}</span>
                  <span className="text-[6px] text-zinc-700 block truncate max-w-full leading-none mt-0.5">{settings?.idSignerRoleLine1 || 'সভাপতি'}</span>
                  <span className="text-[5.5px] text-zinc-500 block truncate max-w-full leading-none mt-0.5">{settings?.idSignerRoleLine2 || 'সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fallback Manual Download Helper Modal */}
      {showFallbackModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-zinc-950 border border-rose-950/40 rounded-lg max-w-lg w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-950/40 to-zinc-900 px-6 py-4 border-b border-rose-950/30 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>ই-কার্ড ম্যানুয়াল ডাউনলোড প্যানেল</span>
              </h3>
              <button 
                onClick={() => setShowFallbackModal(false)}
                className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                ব্রাউজারের স্বয়ংক্রিয় ফাইল ডাউনলোডার সিস্টেমে সাময়িক সীমাবদ্ধতা বা সিকিউরিটি রেস্ট্রিকশনের কারণে ডাউনলোড ব্লক হয়েছে। দয়া করে নিচের ম্যানুয়াল উপায়গুলো ব্যবহার করে আপনার ই-কার্ডটি সংরক্ষণ করুন।
              </p>

              {/* Visual Preview */}
              {fallbackImageUrl && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">ডিজিটাল ই-কার্ড প্রিভিউ (সংরক্ষণ করার জন্য প্রস্তুত):</span>
                  <div className="border border-zinc-800 rounded bg-zinc-900 p-2 flex justify-center">
                    <img 
                      src={fallbackImageUrl} 
                      alt="Member Card Fallback Preview" 
                      className="max-h-48 object-contain rounded shadow-lg"
                    />
                  </div>
                  <p className="text-[10px] text-rose-400 text-center font-medium">
                    💡 মোবাইল গ্রাহক হলে ছবির উপর কিছুক্ষণ চেপে ধরে (Long Press) সরাসরি গ্যালারিতে সংরক্ষণ করতে পারেন।
                  </p>
                </div>
              )}

              {/* Error Details */}
              {downloadError && !validationErrors && (
                <div className="bg-rose-950/20 border border-rose-900/30 rounded p-3 text-xs space-y-1">
                  <span className="text-rose-500 font-bold block">🚨 ব্রাউজার ত্রুটির বিবরণ:</span>
                  <p className="text-zinc-300 leading-relaxed font-medium">{downloadError}</p>
                </div>
              )}

              {/* Detailed Validation Error Report */}
              {validationErrors && validationErrors.length > 0 && (
                <div className="bg-rose-950/25 border border-rose-900/50 rounded-lg p-3.5 space-y-2.5">
                  <span className="text-rose-400 font-bold text-xs uppercase tracking-wider block flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    রিসোর্স লোড ব্যর্থতার বিবরণ (Resource Validation Failure)
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {validationErrors.map((err, idx) => (
                      <div key={idx} className="bg-black/40 border border-rose-950/40 rounded p-2.5 space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between border-b border-rose-950/35 pb-1 text-[10px]">
                          <span className="text-rose-300 font-bold">রিসোর্স: {err.assetName}</span>
                          <span className="text-zinc-500">অরিজিন: {err.origin || 'Unknown'}</span>
                        </div>
                        <p className="text-zinc-300"><span className="text-rose-400">ব্যর্থতার কারণ:</span> {err.failureReason}</p>
                        <p className="text-zinc-400 text-[10px] truncate"><span className="text-zinc-500">উৎস URL:</span> {err.url}</p>
                        <div className="mt-1 pt-1 border-t border-rose-950/20 text-[10px] text-emerald-400 font-sans">
                          <span className="font-bold">💡 সমাধান:</span> {err.suggestedFix}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Live Logs */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">সিস্টেম ডাউনলোড পাইপলাইন লগ:</span>
                <div className="bg-black/60 border border-zinc-900 rounded p-3 h-28 overflow-y-auto font-mono text-[9px] text-emerald-400 space-y-1">
                  {downloadStepLogs.map((log, idx) => (
                    <div key={idx} className="leading-tight">{log}</div>
                  ))}
                </div>
              </div>

              {/* Manual Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    if (fallbackFormat === 'png' && fallbackBlob) {
                      Downloader.downloadBlob(fallbackBlob, fallbackFilename);
                    } else if (fallbackFormat === 'pdf' && fallbackPdf) {
                      Downloader.downloadPDF(fallbackPdf, fallbackFilename);
                    } else if (fallbackImageUrl) {
                      const link = document.createElement('a');
                      link.href = fallbackImageUrl;
                      link.download = fallbackFilename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs cursor-pointer transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>পুনরায় ডাউনলোড চেষ্টা করুন</span>
                </button>

                <button
                  onClick={openInNewTab}
                  className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold rounded text-xs cursor-pointer transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>নতুন ট্যাবে কার্ড খুলুন</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-zinc-900 px-6 py-3 border-t border-zinc-850 text-center">
              <p className="text-[10px] text-zinc-500 font-medium">
                সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা শাখা • ডিজিটাল দপ্তর
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
