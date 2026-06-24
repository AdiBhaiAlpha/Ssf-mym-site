import React, { useState, useEffect } from 'react';
import { Award, User, Phone, Mail, MapPin, Calendar, LogOut, CheckCircle2, ShieldCheck, FileText, BookOpen, Clock, Smartphone, Download, Sparkles, Flame, Camera, Link, Check, RefreshCw, Pencil, History, Save, Undo, Eye, X, Heart, Plus, Send } from 'lucide-react';
import { MemberRegistration, News, Circular, Book, WebSettings, Blog, getMemberBadgeText } from '../types';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
}

export default function MemberPortal({ member, onLogout, onRefresh, onUpdateMember, circulars = [], books = [], settings, blogs = [], onAddBlog }: MemberPortalProps) {
  const memberId = `SSF-MYM-${member.id.substring(member.id.length - 5).toUpperCase()}`;
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [copied, setCopied] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [useProxy, setUseProxy] = useState(() => {
    if (typeof window !== 'undefined') {
      const isSandbox = window.location.hostname.includes('localhost') || 
                        window.location.hostname.includes('127.0.0.1') || 
                        window.location.hostname.includes('run.app');
      return isSandbox;
    }
    return true;
  });

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
        alert('তথ্য সংশোধন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    }
  };

  const getProxiedUrl = (url: string | undefined) => {
    if (!url) return '';
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
      alert('সরাসরি প্রিন্ট করার সময় কোনো সমস্যা হয়েছে। অনুগ্রহ করে আপনার ব্রাউজারের প্রিন্ট সেটিংস চেক করুন।');
    }
  };

  const getGreetingTime = () => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return 'শুভ সকাল কমরেড';
    if (hr >= 12 && hr < 17) return 'শুভ অপরাহ্ন কমরেড';
    return 'বিপ্লবী লাল সালাম কমরেড';
  };

  const downloadPNG = async () => {
    const cardEl = document.getElementById('member-identity-card');
    if (!cardEl) return;
    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 150));
      const canvas = await html2canvas(cardEl, {
        scale: 3, // High quality output
        useCORS: true,
        backgroundColor: '#09090b' // Dark matching BG
      });
      const link = document.createElement('a');
      link.download = `Member_Card_${member.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG download error:', err);
      alert('দুঃখিত, ইমেজ ডাউনলোডের সময় কোনো সমস্যা হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPDF = async () => {
    const cardEl = document.getElementById('member-identity-card');
    if (!cardEl) return;
    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 150));
      const canvas = await html2canvas(cardEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#09090b'
      });
      const imgData = canvas.toDataURL('image/png');
      
      // Landscape CR80 standard credit card: 85.6mm width, 54mm height
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 54]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54);
      pdf.save(`Member_Card_${member.name}.pdf`);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('দুঃখিত, পিডিএফ ডাউনলোডের সময় কোনো সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userName', member.name);

      const res = await fetch(`/api/upload-profile-photo?userName=${encodeURIComponent(member.name)}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        throw new Error('সার্ভারে ছবি আপলোড করা যায়নি। আপনার হোস্টিংয়ে যদি নোড ব্যাকএন্ড সক্রিয় না থাকে, তবে অনুগ্রহ করে ছবির লিংক (URL) ব্যবহার করুন।');
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('আপনার হোস্টিংয়ে ফাইল আপলোড মডিউলটি সক্রিয় নেই। অনুগ্রহ করে ছবির লিংক (URL) ব্যবহার করে প্রোফাইল ছবি সংরক্ষণ করুন।');
      }
      const data = await res.json();
      if (data && data.url) {
        // Save to local backend db if running full-stack
        await fetch(`/api/memberships/${member.id}/photo`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl: data.url })
        }).catch(err => console.warn('Non-blocking local photo db update failed:', err));
        
        // Log to edit history
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const editedBy = member.email || 'সদস্য নিজে';
        const photoChange = {
          timestamp,
          editedBy,
          field: 'প্রোফাইল ছবি / Photo',
          oldValue: member.photoUrl || 'নাই/None',
          newValue: data.url
        };
        const updatedHistory = [...(member.editHistory || []), photoChange];
        const updatedMember: MemberRegistration = {
          ...member,
          photoUrl: data.url,
          editHistory: updatedHistory
        };

        if (onUpdateMember) {
          await onUpdateMember(updatedMember);
        }

        // Refresh the db context in parents
        if (onRefresh) {
          await onRefresh();
        }
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'ছবি আপলোড করতে অপ্রত্যাশিত ত্রুটি দেখা দিয়েছে।');
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
      
      if (useProxy) {
        // Try backend download
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
                
                // Also update local Express db.json if running full-stack
                await fetch(`/api/memberships/${member.id}/photo`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ photoUrl: finalPhotoUrl })
                }).catch(err => console.warn('Non-blocking local db update failed:', err));
              }
            }
          } else {
            console.warn('Backend download failed, falling back to direct URL saving');
          }
        } catch (backendErr) {
          console.warn('Backend download error, falling back to direct URL saving', backendErr);
        }
      }

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
                    <div key={b.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
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
                    <div key={circ.id} className="text-[11px] font-sans pb-2 border-b border-zinc-50 dark:border-zinc-900/40 last:border-0">
                      <span className="text-[9px] text-zinc-400 font-mono block">{circ.date}</span>
                      <p className="font-semibold text-zinc-750 dark:text-zinc-300 hover:text-rose-650 cursor-pointer transition line-clamp-1">{circ.title}</p>
                    </div>
                  ))}

                  {circulars.length === 0 && (
                    <p className="text-[10px] text-zinc-450 italic py-4">কোনো নোটিশ আপলোড করা হয়নি।</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-50 dark:border-zinc-900/60">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer">
                  সমস্ত সার্কুলার বোর্ড দেখুন
                </span>
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
                    <div key={book.id} className="text-[11px] font-sans pb-2 border-b border-zinc-50 dark:border-zinc-900/40 last:border-0 flex gap-2">
                      <img src={book.coverImage} alt={book.title} className="w-8 h-10 object-cover rounded border border-zinc-200/50" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                      <div>
                        <p className="font-semibold text-zinc-750 dark:text-zinc-300 line-clamp-1">{book.title}</p>
                        <span className="text-[9px] text-zinc-400 block font-sans">লেখকঃ {book.author}</span>
                      </div>
                    </div>
                  ))}

                  {books.length === 0 && (
                    <p className="text-[10px] text-zinc-450 italic py-4">কোনো বই বা ম্যাগাজিন নথিবদ্ধ নেই।</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-50 dark:border-zinc-900/60">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer">
                  লাইব্রেরী ও প্রকাশনা পাতা দেখুন
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
