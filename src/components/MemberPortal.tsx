import React, { useState } from 'react';
import { Award, User, Phone, Mail, MapPin, Calendar, LogOut, CheckCircle2, ShieldCheck, FileText, BookOpen, Clock, Smartphone, Download, Sparkles, Flame, Camera, Link, Check, RefreshCw } from 'lucide-react';
import { MemberRegistration, News, Circular, Book, WebSettings } from '../types';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface MemberPortalProps {
  member: MemberRegistration;
  onLogout: () => void;
  onRefresh?: () => Promise<any> | any;
  circulars: Circular[];
  books: Book[];
  settings?: WebSettings;
}

export default function MemberPortal({ member, onLogout, onRefresh, circulars = [], books = [], settings }: MemberPortalProps) {
  const memberId = `SSF-MYM-${member.id.substring(member.id.length - 5).toUpperCase()}`;
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [copied, setCopied] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(false);

  const getProxiedUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('https://') || url.startsWith('http://')) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
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
    }
  };

  const downloadPDF = async () => {
    const cardEl = document.getElementById('member-identity-card');
    if (!cardEl) return;
    try {
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
        throw new Error('সার্ভারে ছবি আপলোড করা যায়নি। পুনরায় চেষ্টা করুন।');
      }
      const data = await res.json();
      if (data && data.url) {
        // Save to member database
        const updateRes = await fetch(`/api/memberships/${member.id}/photo`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl: data.url })
        });
        if (!updateRes.ok) {
          throw new Error('সদস্য প্রোফাইল লিংকের ডাটাবেজ আপডেট ব্যর্থ হয়েছে।');
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
    try {
      const res = await fetch('/api/upload-profile-photo-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: photoUrlInput.trim(),
          userName: member.name
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'সার্ভারে ছবি ডাউনলোড করা যায়নি। পুনরায় উপযুক্ত লিংক দিয়ে চেষ্টা করুন।');
      }
      const data = await res.json();
      if (data && data.url) {
        // Save to member database
        const updateRes = await fetch(`/api/memberships/${member.id}/photo`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoUrl: data.url })
        });
        if (!updateRes.ok) {
          throw new Error('সদস্য প্রোফাইল লিংকের ডাটাবেজ আপডেট ব্যর্থ হয়েছে।');
        }
        setPhotoUrlInput('');
        // Refresh the db context in parents
        if (onRefresh) {
          await onRefresh();
        }
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'ছবি ডাউনলোড করতে অপ্রত্যাশিত ত্রুটি দেখা দিয়েছে।');
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
              <span>সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহের শিক্ষাবর্ষ ও সাংগঠনিক প্যানেলে যুক্ত হওয়ায় আপনাকে লাল সালাম। সুন্দর, গণতান্ত্রিক ও বৈষম্যহীন শিক্ষাঙ্গন গড়তে আপনার লড়াই আজ থেকে জোরদার হোক। আপনার আইডি কোড:</span>
              <button
                onClick={handleCopy}
                className="text-rose-450 hover:text-white font-mono bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded cursor-pointer transition hover:bg-rose-550/20 flex items-center gap-1"
                title="ক্লিক করুন কপি করতে"
              >
                <span>{memberId}</span>
                <span className="text-[10px] text-zinc-400 font-sans border-l border-zinc-700/60 pl-2">
                  {copied ? 'কপি হয়েছে' : 'কপি করুন'}
                </span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Smartphone className="w-3 h-3 text-rose-400" />}
              </button>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 hover:text-rose-450 font-bold text-xs text-zinc-200 border border-zinc-700/60 rounded flex items-center gap-1.5 transition duration-150 cursor-pointer select-none shadow-md hover:border-rose-900/40"
            >
              <LogOut className="w-4 h-4 text-zinc-400" />
              <span>লগআউট সেশন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Digital Member ID Card (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <h2 className="text-sm font-extrabold text-zinc-950 dark:text-white flex items-center gap-2">
              <Award className="text-rose-600 w-5 h-5 shrink-0" />
              <span>সদস্য কার্ড (E-Identity)</span>
            </h2>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">
              কার্ডটি PDF বা PNG নথিতে ডাউনলোড করতে নিচের সংশ্লিষ্ট বাটনসমূহে ক্লিক করুন।
            </p>
          </div>

          {/* Printable Visual Card wrapper - explicitly targeted with id */}
          <div className="print:p-0">
            <div id="member-identity-card" className="bg-gradient-to-br from-zinc-950 to-rose-950 p-[1.5px] rounded-lg shadow-2xl overflow-hidden relative group">
              <div className="bg-zinc-950 p-6 relative flex flex-col justify-between min-h-[350px]">
                
                {/* Background watermarks */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border border-dashed border-rose-600/10 flex items-center justify-center pointer-events-none select-none">
                  <img
                    src={getProxiedUrl('https://i.ibb.co.com/F4MKM3R2/20260527-055637.png')}
                    alt="Watermark Logo"
                    className="w-28 h-28 object-contain opacity-[0.05] brightness-75"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* ID Header */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 relative">
                  <div className="flex items-center gap-3">
                    <img
                      src={getProxiedUrl('https://i.ibb.co.com/F4MKM3R2/20260527-055637.png')}
                      alt="সমাজতান্ত্রিক ছাত্র ফ্রন্ট লোগো"
                      className="h-10 w-10 object-contain brightness-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col">
                      <img
                        src={getProxiedUrl('https://i.ibb.co/R4BCPZ0B/20250130-143124.png')}
                        alt="সমাজতান্ত্রিক ছাত্র ফ্রন্ট"
                        className="h-8.5 sm:h-9 w-auto object-contain brightness-150 saturate-125 contrast-125 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[8px] text-zinc-400 font-mono tracking-widest mt-0.5">
                        MYMENSINGH DISTRICT
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-rose-955 text-rose-450 font-mono text-[9px] font-black border border-rose-900/40 px-2 py-0.5 rounded shadow-xs select-none">
                      ACTIVE MEMBER
                    </span>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="grid grid-cols-12 gap-3.5 my-4 items-start relative">
                  {/* Photo area with fallback User icon or actual path */}
                  <div className="col-span-3.5 flex flex-col items-center justify-start pt-1.5">
                    <div className="w-[88px] h-[110px] rounded border border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center text-rose-500 relative overflow-hidden shadow-inner shrink-0">
                      {member.photoUrl ? (
                        <img 
                          src={getProxiedUrl(member.photoUrl)} 
                          alt={member.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <>
                          <User className="w-8 h-8 opacity-40 text-rose-500" />
                          <div className="absolute bottom-0 inset-x-0 bg-rose-600/20 text-[7px] py-[1.5px] text-center font-bold tracking-wider uppercase font-mono">
                            APPROVED
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Member info */}
                  <div className="col-span-8.5 space-y-1.5 font-sans">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      <div className="col-span-2">
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">নাম / Full Name</span>
                        <strong className="text-[12px] font-bold text-white tracking-wide block leading-snug mt-0.5">{member.name}</strong>
                      </div>

                      <div>
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">শ্রেণি / Class</span>
                        <span className="text-[10px] text-zinc-200 font-bold block truncate leading-tight mt-0.5">{member.department || 'সদস্য'}</span>
                      </div>

                      <div>
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">রক্তের গ্রুপ / Blood</span>
                        <span className="text-[10px] text-rose-450 font-bold block leading-tight mt-0.5">{member.dob || 'N/A'}</span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">শিক্ষা প্রতিষ্ঠান / Institution</span>
                        <span className="text-[10.5px] text-zinc-200 font-semibold block truncate leading-tight mt-0.5">{member.institution}</span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">মোবাইল / Mobile No</span>
                        <span className="text-[10px] font-mono text-zinc-300 font-bold block leading-tight mt-0.5">{member.mobile}</span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block font-bold leading-none">ঠিকানা / Address</span>
                        <span className="text-[9.5px] text-zinc-350 block leading-tight truncate mt-0.5">{member.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer info */}
                <div className="flex items-end justify-between pt-3 border-t border-zinc-900 mt-2 text-zinc-500 text-[9px] relative font-sans">
                  
                  {/* Left Block: Code & Issue Date */}
                  <div className="space-y-1.5 text-left">
                    <button 
                      onClick={handleCopy}
                      className="font-mono text-left cursor-pointer hover:text-rose-450 transition active:scale-95 group/code block"
                      title="ক্লিক করুন কপি করতে"
                    >
                      <span className="text-[7.5px] text-zinc-550 group-hover/code:text-rose-500 uppercase tracking-widest block font-sans transition leading-none">মেম্বারশিপ কোড (ক্লিক করে কপি করুন)</span>
                      <strong className="text-zinc-200 group-hover/code:text-white text-[10px] font-bold tracking-wider block transition leading-tight mt-0.5">{memberId}</strong>
                    </button>
                    
                    <div>
                      <span className="text-[7.5px] text-zinc-550 uppercase tracking-wider block font-sans leading-none">ইস্যু ডেট</span>
                      <strong className="text-zinc-350 block font-mono font-bold text-[9px] leading-tight mt-0.5">{member.verifiedAt || member.appliedAt}</strong>
                    </div>
                  </div>

                  {/* Right Block: Signer Config */}
                  <div className="text-center w-44 shrink-0 flex flex-col items-center justify-end relative">
                    <span className="text-[7.5px] font-sans text-rose-500/70 uppercase tracking-wider block font-bold leading-none mb-1">ইস্যুকারীর স্বাক্ষর</span>
                    <div className="h-8 relative flex items-center justify-center w-full">
                      {settings?.idSignerSignatureUrl ? (
                        <img 
                          src={getProxiedUrl(settings.idSignerSignatureUrl)} 
                          alt="Signature" 
                          className="h-7.5 max-w-[125px] object-contain brightness-125 select-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-7 border-b border-dashed border-zinc-800/80 w-24 mb-0.5" />
                      )}
                    </div>
                    <div className="border-t border-zinc-900/60 pt-1 w-full flex flex-col items-center select-none">
                      <span className="text-[9px] text-zinc-250 font-extrabold block tracking-wide truncate max-w-full leading-tight">{settings?.idSignerName || 'তানজিল হোসেন মুণিম'}</span>
                      <span className="text-[7.5px] text-zinc-450 block truncate max-w-full leading-none mt-0.5">{settings?.idSignerRoleLine1 || 'সভাপতি'}</span>
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

          {/* Core Member Details Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 pb-2.5 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-rose-600" />
              <span>ব্যক্তিগত মেম্বারশিপ প্রোফাইল</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
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
                <span className="text-[10px] text-zinc-400 block font-mono">জন্ম তারিখ / DOB</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-mono">{member.dob || 'তথ্য নাই'}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 block font-mono">মেইল বা বর্তমান ঠিকানা</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-200 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{member.address}</span>
                </span>
              </div>
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
