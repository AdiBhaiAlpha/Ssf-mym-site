import React, { useState } from 'react';
import { Shield, ToggleLeft, ToggleRight, Settings, PlusCircle, Pencil, Trash2, Calendar, FileText, BookOpen, Clock, Users, Activity, MessageSquare, Image, RefreshCw, AlertTriangle, Eye, Check, X, ShieldAlert, Upload, Download, BarChart3 } from 'lucide-react';
import { News, Blog, Event, Book, Circular, GalleryItem, MemberRegistration, AuditLog, PageVisit, WebSettings, OrgWing, MemberLoginLog } from '../types';

interface AdminDashboardProps {
  db: {
    news: News[];
    blogs: Blog[];
    events: Event[];
    books: Book[];
    circulars: Circular[];
    gallery: GalleryItem[];
    memberships: MemberRegistration[];
    logs: AuditLog[];
    visits: PageVisit[];
    settings: WebSettings;
    organizations?: OrgWing[];
    memberLogins?: MemberLoginLog[];
    invitations?: any[];
  };
  userEmail: string | null;
  onResetDB: () => Promise<boolean>;
  onSaveSettings: (settings: Partial<WebSettings>) => Promise<boolean>;
  onSaveOrganizations: (organizations: OrgWing[]) => Promise<boolean>;
  onAddInvitation?: (email: string, role: 'admin' | 'super_admin') => Promise<boolean>;
  onInviteAction?: (id: string, action: 'accepted' | 'declined') => Promise<boolean>;
  onDeleteInvitation?: (id: string) => Promise<boolean>;
  onAddNews: (article: Omit<News, 'id' | 'views' | 'date'>) => Promise<boolean>;
  onEditNews: (id: string, article: Partial<News>) => Promise<boolean>;
  onDeleteNews: (id: string) => Promise<boolean>;
  onAddBlog: (post: Omit<Blog, 'id' | 'views' | 'comments' | 'date'>) => Promise<boolean>;
  onDeleteBlog: (id: string) => Promise<boolean>;
  onApproveComment: (blogId: string, commentId: string) => Promise<boolean>;
  onAddEvent: (event: Omit<Event, 'id' | 'registrants'>) => Promise<boolean>;
  onDeleteEvent: (id: string) => Promise<boolean>;
  onAddBook: (book: Omit<Book, 'id' | 'downloadCount' | 'date'>) => Promise<boolean>;
  onEditBook?: (id: string, book: Partial<Book>) => Promise<boolean>;
  onDeleteBook: (id: string) => Promise<boolean>;
  onAddCircular: (circular: Omit<Circular, 'id' | 'date'>) => Promise<boolean>;
  onEditCircular?: (id: string, circular: Partial<Circular>) => Promise<boolean>;
  onDeleteCircular: (id: string) => Promise<boolean>;
  onAddGallery: (item: Omit<GalleryItem, 'id' | 'date'>) => Promise<boolean>;
  onDeleteGallery: (id: string) => Promise<boolean>;
  onVerifyMember: (id: string, status: 'verified' | 'rejected') => Promise<boolean>;
  onDeleteMember: (id: string) => Promise<boolean>;
}

interface FileUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
}

function FileUploader({ label, value, onChange, accept = "*/*", placeholder = "সরাসরি লিঙ্ক (URL) দিন অথবা ফাইল আপলোড করুন" }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('ফাইল আপলোড ব্যর্থ হয়েছে।');
      const data = await res.json();
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'আপলোড ব্যর্থ হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 p-3.5 rounded bg-zinc-50/40 dark:bg-zinc-950/20 space-y-2 mt-1">
      <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="text"
          className="flex-1 text-xs border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        
        <label className="flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-850 text-white dark:bg-zinc-805 dark:hover:bg-zinc-700 px-3.5 py-1.5 rounded text-xs font-semibold cursor-pointer select-none transition shrink-0">
          <Upload className="w-3.5 h-3.5" />
          <span>{uploading ? 'আপলোড হচ্ছে...' : 'ফাইল আপলোড'}</span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>
      {value && (
        <p className="text-[10px] text-emerald-650 dark:text-emerald-400 font-mono flex items-center gap-1.5 break-all">
          <span>✓ লিঙ্কঃ {value}</span>
        </p>
      )}
      {error && (
        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard({
  db,
  userEmail,
  onResetDB,
  onSaveSettings,
  onSaveOrganizations,
  onAddNews,
  onEditNews,
  onDeleteNews,
  onAddBlog,
  onDeleteBlog,
  onApproveComment,
  onAddEvent,
  onDeleteEvent,
  onAddBook,
  onEditBook,
  onDeleteBook,
  onAddCircular,
  onEditCircular,
  onDeleteCircular,
  onAddGallery,
  onDeleteGallery,
  onVerifyMember,
  onDeleteMember,
  onAddInvitation,
  onInviteAction,
  onDeleteInvitation,
}: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'content' | 'settings' | 'members' | 'comments' | 'logs' | 'analytics' | 'activity' | 'invitations'>('content');
  const [activeModel, setActiveModel] = useState<'news' | 'blog' | 'event' | 'book' | 'circular' | 'gallery'>('news');

  // Form states for invitation
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'super_admin'>('admin');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Custom State-based Delete Confirm (bypass iframe window.confirm blocks)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: string } | null>(null);
  const [dbResetConfirm, setDbResetConfirm] = useState(false);

  // Form states for core text fields customisation
  const [aboutForm, setAboutForm] = useState(db.settings.aboutText || '');
  const [missionForm, setMissionForm] = useState(db.settings.missionText || '');
  const [visionForm, setVisionForm] = useState(db.settings.visionText || '');
  const [constForm, setConstForm] = useState(db.settings.constitutionalHeader || '');
  const [oathTitleForm, setOathTitleForm] = useState(db.settings.oathTitle || 'ঐতিহাসিক বৈপ্লবিক অঙ্গীকার');
  const [oathBodyForm, setOathBodyForm] = useState(db.settings.oathBody || 'সমাজতান্ত্রিক ছাত্র ফ্রন্ট কোনো প্রাতিষ্ঠানিক ডিগ্রি সংগ্রহের রাজনৈতিক লিয়াজোঁ ক্লাব নয়। এটি সাম্রাজ্যবাদ, পুঁজিবাদ ও সাম্প্রদায়িকতাবিরোধী সর্বজনীন মানবিক লড়াই শক্তিশালী করার বিপ্লব মডিউল। শিক্ষা, সুস্থ সংস্কৃতি ও প্রগতির বিপ্লবী পতাকাতলে সমাজ রূপান্তরে আত্মনিয়োগ করুন।');
  const [idSignerNameForm, setIdSignerNameForm] = useState(db.settings.idSignerName || 'তানজিল হোসেন মুণিম');
  const [idSignerRoleLine1Form, setIdSignerRoleLine1Form] = useState(db.settings.idSignerRoleLine1 || 'সভাপতি');
  const [idSignerRoleLine2Form, setIdSignerRoleLine2Form] = useState(db.settings.idSignerRoleLine2 || 'সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা');
  const [idSignerSignatureUrlForm, setIdSignerSignatureUrlForm] = useState(db.settings.idSignerSignatureUrl || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // States for Member Activity Log search/filtering
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<'all' | 'success' | 'failed' | 'reset_request'>('all');

  // Modal Control States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form Fields States for Add/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formTags, setFormTags] = useState('');
  
  // Event-specific fields
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  // Book-specific
  const [bookPdfUrl, setBookPdfUrl] = useState('');
  const [formIsPrivate, setFormIsPrivate] = useState(false);

  // General Status logs
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [membersFilter, setMembersFilter] = useState<'pending' | 'verified' | 'rejected'>('pending');

  const userAdminInvite = (db as any).invitations?.find(
    (i: any) => i.email.toLowerCase() === userEmail?.toLowerCase() && i.status === 'accepted'
  );

  const isSuperAdmin = 
    userEmail?.toLowerCase() === 'chitronbhattacharjee@gmail.com' ||
    userAdminInvite?.role === 'super_admin';

  const isAnyAdmin = 
    userEmail?.toLowerCase() === 'chitronbhattacharjee@gmail.com' ||
    !!userAdminInvite;

  const handleDownloadMembersCSV = () => {
    const verifiedMembers = db.memberships.filter(m => m.status === 'verified');
    
    // Header Row mapping
    const headers = [
      'Name (নাম)',
      'Email (ইমেইল)',
      'Phone (মোবাইল)',
      'Institution (শিক্ষা প্রতিষ্ঠান)',
      'Class/Year (শ্রেণী/বর্ষ)',
      'Unit/Wing (ইউনিট/শাখা)',
      'Address (ঠিকানা)',
      'Blood Group (রক্তের গ্রুপ)',
      'Application Date (আবেদনের তারিখ)',
      'Status (অবস্থা)'
    ];

    // Map each member to an array of string values
    const rows = verifiedMembers.map(m => [
      m.name || '',
      m.email || '',
      m.mobile || '',
      m.institution || '',
      m.department || '',
      m.academicYear || '',
      m.address || '',
      m.dob || '',
      m.appliedAt || '',
      m.status || ''
    ]);

    // Construct CSV String with CSV escaping (wrapping in double quotes, escaping double quotes inside values)
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const formatted = String(val).replace(/"/g, '""');
          return `"${formatted}"`;
        }).join(',')
      )
    ].join('\n');

    // Create a Blob with UTF-8 BOM (Byte Order Mark) to satisfy Excel Bangla encoding support
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `verified_members_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Organizational Wings Logo Fields and status
  const [orgLogos, setOrgLogos] = React.useState<{ [id: string]: string }>(() => {
    const initial: { [id: string]: string } = {};
    if (db.organizations) {
      db.organizations.forEach(o => {
        initial[o.id] = o.logo || '';
      });
    }
    return initial;
  });
  const [isSavingOrgs, setIsSavingOrgs] = React.useState(false);
  const [orgSaveSuccess, setOrgSaveSuccess] = React.useState(false);

  // Elevated Slogan States
  const [newSlogan, setNewSlogan] = React.useState('');
  const [isSavingSlogans, setIsSavingSlogans] = React.useState(false);

  // Elevated Leadership States
  const [leadersSubTab, setLeadersSubTab] = React.useState<'district' | 'executive' | 'units' | 'former'>('district');
  const [isSavingLeaders, setIsSavingLeaders] = React.useState(false);
  const [dName, setDName] = React.useState('');
  const [dRole, setDRole] = React.useState('');
  const [dInst, setDInst] = React.useState('');
  const [dMemberCode, setDMemberCode] = React.useState('');
  const [dPhotoUrl, setDPhotoUrl] = React.useState('');

  const [eName, setEName] = React.useState('');
  const [eRole, setERole] = React.useState('কার্যকরী সদস্য');
  const [eInst, setEInst] = React.useState('');
  const [eMemberCode, setEMemberCode] = React.useState('');
  const [ePhotoUrl, setEPhotoUrl] = React.useState('');

  const [uUnitName, setUUnitName] = React.useState('');
  const [uLeadName1, setULeadName1] = React.useState('');
  const [uLeadRole1, setULeadRole1] = React.useState('');
  const [uLead1MemberCode, setULead1MemberCode] = React.useState('');
  const [uLead1PhotoUrl, setULead1PhotoUrl] = React.useState('');
  const [uLeadName2, setULeadName2] = React.useState('');
  const [uLeadRole2, setULeadRole2] = React.useState('');
  const [uLead2MemberCode, setULead2MemberCode] = React.useState('');
  const [uLead2PhotoUrl, setULead2PhotoUrl] = React.useState('');

  const [fName, setFName] = React.useState('');
  const [fDuration, setFDuration] = React.useState('');
  const [fContribution, setFContribution] = React.useState('');
  const [fMemberCode, setFMemberCode] = React.useState('');
  const [fPhotoUrl, setFPhotoUrl] = React.useState('');

  const handleUpdateLogo = (id: string, value: string) => {
    setOrgLogos(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveAllLogos = async () => {
    if (!onSaveOrganizations || !db.organizations) return;
    setIsSavingOrgs(true);
    const updated = db.organizations.map(org => ({
      ...org,
      logo: orgLogos[org.id] || ''
    }));
    const success = await onSaveOrganizations(updated);
    setIsSavingOrgs(false);
    if (success) {
      setOrgSaveSuccess(true);
      setTimeout(() => setOrgSaveSuccess(false), 4000);
    }
  };

  if (!isAnyAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center font-sans">
        <ShieldAlert className="w-16 h-16 text-rose-600 mx-auto animate-bounce mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">অননুমোদিত প্রবেশাধিকার</h2>
        <p className="text-sm text-zinc-500 mt-2">
          দুঃখিত, এই পেজে শুধুমাত্র অনুমোদিত এডমিন ও সুপার এডমিনদের প্রবেশ করার অনুমতি প্রাপ্ত।
        </p>
      </div>
    );
  }

  // Toggle Visibility control helper
  const handleToggleSetting = async (key: keyof WebSettings) => {
    const updated = { [key]: !db.settings[key] };
    await onSaveSettings(updated);
  };

  const handleSaveTextSettings = async () => {
    setSavingSettings(true);
    const success = await onSaveSettings({
      aboutText: aboutForm,
      missionText: missionForm,
      visionText: visionForm,
      constitutionalHeader: constForm,
      oathTitle: oathTitleForm,
      oathBody: oathBodyForm,
      idSignerName: idSignerNameForm,
      idSignerRoleLine1: idSignerRoleLine1Form,
      idSignerRoleLine2: idSignerRoleLine2Form,
      idSignerSignatureUrl: idSignerSignatureUrlForm,
    });
    setSavingSettings(false);
    if (success) {
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 4000);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormContent('');
    setFormExcerpt('');
    if (activeModel === 'news') {
      setFormCategory('political');
      setFormImage('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800');
    } else if (activeModel === 'blog') {
      setFormCategory('রাজনৈতিক কলাম');
      setFormImage('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800');
    } else if (activeModel === 'event') {
      setFormCategory('upcoming');
      setFormImage('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800');
    } else if (activeModel === 'book') {
      setFormCategory('book');
      setFormImage('https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800');
    } else if (activeModel === 'circular') {
      setFormCategory('official');
    } else if (activeModel === 'gallery') {
      setFormCategory('photo');
    }
    setFormAuthor('দপ্তর সম্পাদক');
    setFormTags('');
    setEventTime('');
    setEventVenue('');
    setBookPdfUrl('#');
    setFormIsPrivate(false);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content || item.description || '');
    setFormExcerpt(item.excerpt || '');
    setFormCategory(item.category || item.type || '');
    setFormAuthor(item.author || '');
    setFormImage(item.image || item.coverImage || item.url || '');
    setFormTags((item.tags || []).join(', '));
    setEventTime(item.time || '');
    setEventVenue(item.venue || '');
    setBookPdfUrl(item.pdfUrl || '#');
    setFormIsPrivate(!!item.isPrivate);
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const tagsArray = formTags.split(',').map(t => t.trim()).filter(Boolean);

    let success = false;

    if (editingItem) {
      if (activeModel === 'news') {
        success = await onEditNews(editingItem.id, {
          title: formTitle,
          content: formContent,
          excerpt: formExcerpt,
          category: formCategory as any,
          author: formAuthor,
          image: formImage,
          tags: tagsArray,
          pdfUrl: bookPdfUrl || undefined
        });
      } else if (activeModel === 'book' && onEditBook) {
        success = await onEditBook(editingItem.id, {
          title: formTitle,
          author: formAuthor,
          description: formContent,
          coverImage: formImage,
          type: formCategory as any,
          pdfUrl: bookPdfUrl,
          isPrivate: formIsPrivate
        });
      } else if (activeModel === 'circular' && onEditCircular) {
        success = await onEditCircular(editingItem.id, {
          title: formTitle,
          content: formContent,
          category: formCategory as any,
          pdfUrl: bookPdfUrl || undefined,
          image: formImage || undefined,
          isPrivate: formIsPrivate
        });
      }
    } else {
      if (activeModel === 'news') {
        success = await onAddNews({
          title: formTitle,
          content: formContent,
          excerpt: formExcerpt,
          category: formCategory as any,
          author: formAuthor,
          image: formImage,
          tags: tagsArray,
          status: 'published',
          isFeatured: false,
          pdfUrl: bookPdfUrl || undefined
        });
      } else if (activeModel === 'blog') {
        success = await onAddBlog({
          title: formTitle,
          content: formContent,
          excerpt: formExcerpt,
          category: formCategory,
          author: formAuthor,
          image: formImage,
          tags: tagsArray,
          status: 'published',
          readingTime: Math.max(3, Math.ceil(formContent.length / 400))
        });
      } else if (activeModel === 'event') {
        success = await onAddEvent({
          title: formTitle,
          description: formContent,
          date: formExcerpt || new Date().toISOString().split('T')[0],
          time: eventTime || 'সময় নির্ধারণহীন',
          venue: eventVenue || 'অফিস কার্যালয়',
          image: formImage,
          status: 'upcoming'
        });
      } else if (activeModel === 'book') {
        success = await onAddBook({
          title: formTitle,
          author: formAuthor,
          description: formContent,
          coverImage: formImage,
          type: formCategory as any,
          pdfUrl: bookPdfUrl,
          isPrivate: formIsPrivate
        });
      } else if (activeModel === 'circular') {
        success = await onAddCircular({
          title: formTitle,
          content: formContent,
          category: formCategory as any,
          pdfUrl: bookPdfUrl || undefined,
          image: formImage || undefined,
          isPrivate: formIsPrivate
        });
      } else if (activeModel === 'gallery') {
        success = await onAddGallery({
          title: formTitle,
          url: formImage,
          type: formCategory as any
        });
      }
    }

    setSubmitting(false);
    if (success) {
      setActionSuccess(true);
      setTimeout(() => {
        setActionSuccess(false);
        setShowAddModal(false);
        setEditingItem(null);
      }, 1500);
    }
  };

  const calculateTotalViews = () => {
    const newsViews = db.news.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const blogViews = db.blogs.reduce((acc, curr) => acc + (curr.views || 0), 0);
    return newsViews + blogViews;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Title & SuperAdmin banner */}
      <div className="bg-zinc-900 text-white rounded p-6 mb-8 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-rose-600 rounded">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">সমাজতান্ত্রিক ছাত্র ফ্রন্ট অনলাইন সদর দপ্তর</h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">সুপার এডমিন: {userEmail}</p>
          </div>
        </div>

        {/* Database Reset Option */}
        <div className="flex items-center gap-2">
          {dbResetConfirm ? (
            <div className="flex items-center gap-1.5 bg-rose-950/40 p-1.5 border border-rose-500/30 rounded-xs">
              <span className="text-[10px] text-rose-200 uppercase font-mono tracking-wider px-1.5">নিশ্চিত?</span>
              <button
                onClick={async () => {
                  await onResetDB();
                  setDbResetConfirm(false);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-xs shadow transition cursor-pointer"
              >
                হ্যাঁ, রিসেট
              </button>
              <button
                onClick={() => setDbResetConfirm(false)}
                className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold rounded-xs transition cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDbResetConfirm(true)}
              className="px-4 py-2 bg-rose-600/25 border border-rose-600 hover:bg-rose-600 text-white text-xs font-bold rounded shadow transition cursor-pointer"
            >
              সম্পূর্ণ ডাটাবেজ রিসেট করুন
            </button>
          )}
        </div>
      </div>

      {/* Main Admin Navigation grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side Columns: Main Tabs Menu Selector (3/12) */}
        <div className="lg:col-span-3 space-y-2">
          {[
            { id: 'content', label: 'কন্টেন্ট ম্যানেজমেন্ট', icon: FileText, visible: true },
            { id: 'settings', label: 'সাইট ভিজিবিলিটি / লেআউট', icon: Settings, visible: true },
            { id: 'members', label: 'ভর্তি আবেদনপত্র ({count})'.replace('{count}', db.memberships.filter(m => m.status === 'pending').length.toString()), icon: Users, visible: true },
            { id: 'comments', label: 'মন্তব্য অনুমোদন ({count})'.replace('{count}', db.blogs.reduce((acc, b) => acc + (b.comments?.filter(c => !c.approved).length || 0), 0).toString()), icon: MessageSquare, visible: true },
            { id: 'analytics', label: 'ভিজিটর ও সাইট এনালাইটিকস', icon: BarChart3, visible: true },
            { id: 'activity', label: 'সদস্য অ্যাক্টিভিটি লগ ({count})'.replace('{count}', (db.memberLogins || []).length.toString()), icon: Clock, visible: true },
            { id: 'logs', label: 'অডিট লগ রিপোর্ট', icon: Activity, visible: true },
            { id: 'invitations', label: 'এডমিন নিয়োগ সেটিংস ({count})'.replace('{count}', ((db as any).invitations || []).filter((i: any) => i.status === 'pending').length.toString()), icon: Shield, visible: isSuperAdmin }
          ].filter(tab => tab.visible).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-xs md:text-sm font-bold rounded-sm border transition cursor-pointer text-left ${
                  activeSubTab === tab.id
                    ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/50'
                    : 'bg-white border-zinc-200 text-zinc-700 dark:bg-zinc-950 dark:border-zinc-900 dark:text-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Quick Metrics display widget */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-900 rounded p-4 pt-5 mt-6 font-mono text-[11px] text-zinc-500 space-y-2.5">
            <h4 className="font-sans font-bold text-xs text-zinc-700 dark:text-zinc-300 mb-1">ভিজিটর মেট্রিক্স</h4>
            <div className="flex justify-between border-b pb-1">
              <span>মোট সংবাদ ভিউ:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{calculateTotalViews()}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span>ভর্তি নথি:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{db.memberships.length}</span>
            </div>
            <div className="flex justify-between">
              <span>গ্যালারি মিডিয়া:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{db.gallery.length}</span>
            </div>
          </div>
        </div>

        {/* Right Columns: Main Tab Content Render (9/12 Columns) */}
        <div className="lg:col-span-9 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-6 sm:p-8">
          
          {/* Content SubTab */}
          {activeSubTab === 'content' && (
            <div className="space-y-6">
              
              {/* Models selection pill list */}
              <div className="flex flex-wrap gap-2 border-b border-zinc-150 pb-4">
                {[
                  { key: 'news', label: 'সংবাদপত্র', index: db.news.length },
                  { key: 'blog', label: 'নিবন্ধ / ব্লগ', index: db.blogs.length },
                  { key: 'event', label: 'কর্মসূচী', index: db.events.length },
                  { key: 'book', label: 'প্রকাশনা লাইব্রেরি', index: db.books.length },
                  { key: 'circular', label: 'সার্কুলার বোর্ড', index: db.circulars.length },
                  { key: 'gallery', label: 'মিডিয়া', index: db.gallery.length }
                ].map((pill) => (
                  <button
                    key={pill.key}
                    onClick={() => setActiveModel(pill.key as any)}
                    className={`px-3 py-1.5 text-xs rounded transition-all cursor-pointer font-semibold ${
                      activeModel === pill.key
                        ? 'bg-rose-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    {pill.label} ({pill.index})
                  </button>
                ))}
              </div>

              {/* Action commands bar */}
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-4 rounded border dark:border-zinc-850">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  সুপার এডমিন কন্টেন্ট কন্ট্রোল প্যানেল
                </span>

                {/* Except editing news (using modals), block empty news creators */}
                <button
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>যুক্ত করুণ</span>
                </button>
              </div>

              {/* List grid render list */}
              <div className="space-y-3">
                {activeModel === 'news' && db.news.map((item) => (
                  <div key={item.id} className="p-4 border border-zinc-150 dark:border-zinc-900 rounded-sm flex justify-between items-center text-xs gap-4 hover:bg-zinc-50/50">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">{item.category}</span>
                      <h4 className="font-bold text-sm text-zinc-850 mt-1 truncate">{item.title}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{item.date} • {((item.views || 0) * 10)} ভিউ (রিয়েল: {item.views || 0})</p>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      <button onClick={() => handleOpenEditModal(item)} className="p-1 px-2 border hover:bg-zinc-100 rounded text-zinc-500 cursor-pointer">সম্পাদনা</button>
                      {deleteConfirm?.id === item.id && deleteConfirm?.type === 'news' ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-955 px-1.5 py-0.5 border border-rose-200 dark:border-rose-900 rounded-xs">
                          <button onClick={() => { onDeleteNews(item.id); setDeleteConfirm(null); }} className="p-1 text-[10px] bg-rose-600 text-white rounded-xs font-bold cursor-pointer">হ্যাঁ</button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1 text-[10px] bg-zinc-500 text-white rounded-xs font-bold cursor-pointer">না</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm({ id: item.id, type: 'news' })} className="p-1 px-2 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 cursor-pointer">মুছুন</button>
                      )}
                    </div>
                  </div>
                ))}

                {activeModel === 'blog' && db.blogs.map((item) => (
                  <div key={item.id} className="p-4 border border-zinc-150 dark:border-zinc-900 rounded-sm flex justify-between items-center text-xs gap-4 hover:bg-zinc-50/50">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">{item.category}</span>
                      <h4 className="font-bold text-sm text-zinc-850 mt-1 truncate">{item.title}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{item.date} • লেখক: {item.author} • ভিউ: {((item.views || 0) * 10)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      {deleteConfirm?.id === item.id && deleteConfirm?.type === 'blog' ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-955 px-1.5 py-0.5 border border-rose-200 dark:border-rose-900 rounded-xs">
                          <button onClick={() => { onDeleteBlog(item.id); setDeleteConfirm(null); }} className="p-1 text-[10px] bg-rose-600 text-white rounded-xs font-bold cursor-pointer">হ্যাঁ</button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1 text-[10px] bg-zinc-500 text-white rounded-xs font-bold cursor-pointer">না</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm({ id: item.id, type: 'blog' })} className="p-1 px-2 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 cursor-pointer">মুছুন</button>
                      )}
                    </div>
                  </div>
                ))}

                {activeModel === 'event' && db.events.map((item) => (
                  <div key={item.id} className="p-4 border border-zinc-150 dark:border-zinc-900 rounded-sm flex justify-between items-center text-xs gap-4 hover:bg-zinc-50/50">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">{item.status}</span>
                      <h4 className="font-bold text-sm text-zinc-850 mt-1 truncate">{item.title}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">তারিখ: {item.date} • স্থান: {item.venue}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      {deleteConfirm?.id === item.id && deleteConfirm?.type === 'event' ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-955 px-1.5 py-0.5 border border-rose-200 dark:border-rose-900 rounded-xs">
                          <button onClick={() => { onDeleteEvent(item.id); setDeleteConfirm(null); }} className="p-1 text-[10px] bg-rose-600 text-white rounded-xs font-bold cursor-pointer">হ্যাঁ</button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1 text-[10px] bg-zinc-500 text-white rounded-xs font-bold cursor-pointer">না</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm({ id: item.id, type: 'event' })} className="p-1 px-2 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 cursor-pointer">মুছুন</button>
                      )}
                    </div>
                  </div>
                ))}

                {activeModel === 'book' && db.books.map((item) => (
                  <div key={item.id} className="p-4 border border-zinc-150 dark:border-zinc-900 rounded-sm flex justify-between items-center text-xs gap-4 hover:bg-zinc-50/50">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded font-bold">{item.type}</span>
                      <h4 className="font-bold text-sm text-zinc-850 mt-1 truncate">{item.title}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">লেখক: {item.author} • ডাউনলোড: {item.downloadCount}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      {deleteConfirm?.id === item.id && deleteConfirm?.type === 'book' ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-955 px-1.5 py-0.5 border border-rose-200 dark:border-rose-900 rounded-xs">
                          <button onClick={() => { onDeleteBook(item.id); setDeleteConfirm(null); }} className="p-1 text-[10px] bg-rose-600 text-white rounded-xs font-bold cursor-pointer">হ্যাঁ</button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1 text-[10px] bg-zinc-500 text-white rounded-xs font-bold cursor-pointer">না</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm({ id: item.id, type: 'book' })} className="p-1 px-2 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 cursor-pointer">মুছুন</button>
                      )}
                    </div>
                  </div>
                ))}

                {activeModel === 'circular' && db.circulars.map((item) => (
                  <div key={item.id} className="p-4 border border-zinc-150 dark:border-zinc-900 rounded-sm flex justify-between items-center text-xs gap-4 hover:bg-zinc-50/50">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">{item.category}</span>
                      <h4 className="font-bold text-sm text-zinc-850 mt-1 truncate">{item.title}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">তারিখ: {item.date}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      {deleteConfirm?.id === item.id && deleteConfirm?.type === 'circular' ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-955 px-1.5 py-0.5 border border-rose-200 dark:border-rose-900 rounded-xs">
                          <button onClick={() => { onDeleteCircular(item.id); setDeleteConfirm(null); }} className="p-1 text-[10px] bg-rose-600 text-white rounded-xs font-bold cursor-pointer">হ্যাঁ</button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1 text-[10px] bg-zinc-500 text-white rounded-xs font-bold cursor-pointer">না</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm({ id: item.id, type: 'circular' })} className="p-1 px-2 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 cursor-pointer">মুছুন</button>
                      )}
                    </div>
                  </div>
                ))}

                {activeModel === 'gallery' && db.gallery.map((item) => (
                  <div key={item.id} className="p-4 border border-zinc-150 dark:border-zinc-900 rounded-sm flex justify-between items-center text-xs gap-4 hover:bg-zinc-50/50">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono text-zinc-605 bg-zinc-100 px-1.5 py-0.5 rounded font-bold">{item.type}</span>
                      <h4 className="font-bold text-sm text-zinc-850 mt-1 truncate">{item.title}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{item.date}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      {deleteConfirm?.id === item.id && deleteConfirm?.type === 'gallery' ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-955 px-1.5 py-0.5 border border-rose-200 dark:border-rose-900 rounded-xs">
                          <button onClick={() => { onDeleteGallery(item.id); setDeleteConfirm(null); }} className="p-1 text-[10px] bg-rose-600 text-white rounded-xs font-bold cursor-pointer">হ্যাঁ</button>
                          <button onClick={() => setDeleteConfirm(null)} className="p-1 text-[10px] bg-zinc-500 text-white rounded-xs font-bold cursor-pointer">না</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm({ id: item.id, type: 'gallery' })} className="p-1 px-2 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 cursor-pointer">মুছুন</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings SubTab for Toggle controls of elements */}
          {activeSubTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-100">ওয়েবসাইট লেআউট এবং দৃশ্যমানতা সেটিংস</h3>
              <p className="text-xs text-zinc-500 mb-4 font-sans leading-normal">
                প্রয়োজনে আপনি যেকোনো মডিউল, পেজ বা হোমপেজ সেকশন তাৎক্ষণিকভাবে অফ কিংবা হাইড করে রাখতে পারবেন। এগুলো সাথে সাথে সেভ হয়ে যাবে।
              </p>

              <div className="space-y-4">
                {[
                  { key: 'showBreakingNews', label: 'ব্রেকিং নিউজ টিকার দেখান (Breaking News Ticker)' },
                  { key: 'showHero', label: 'প্রচ্ছদ হিরো ব্যানার দেখান (Newspaper Hero Template)' },
                  { key: 'showLatestNews', label: 'সর্বশেষ সংবাদ সেকশন চালু রাখুন' },
                  { key: 'showEvents', label: 'আসন্ন কর্মসূচী ও ক্যালেন্ডার চালু রাখুন' },
                  { key: 'showCirculars', label: 'সার্কুলার ও রেজোলিউশন বোর্ড চালু রাখুন' },
                  { key: 'showPublications', label: 'প্রকাশনা ও লাইব্রেরি মডিউল চালু রাখুন' },
                  { key: 'showGallery', label: 'মিডিয়া ও ছবি গ্যালারি চালু রাখুন' },
                  { key: 'showMembership', label: 'অনলাইন মেম্বারশিপ আবেদন পোর্টাল সক্রিয় রাখুন' }
                ].map((st) => (
                  <div key={st.key} className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 rounded">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-sans">{st.label}</span>
                    <button
                      onClick={() => handleToggleSetting(st.key as any)}
                      className="text-rose-600"
                    >
                      {db.settings[st.key as keyof WebSettings] ? (
                        <ToggleRight className="w-10 h-10" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-zinc-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Website Core Information and Text Customization Panel */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded p-5 bg-zinc-50/20 dark:bg-zinc-950/20 mt-8">
                <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                  <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">তথ্য সেটিংস</span>
                  <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">ওয়েবসাইটের মূল বিবরণ ও ইতিহাস কাস্টমাইজেশন</h4>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 font-sans leading-normal">
                  এখানে সমাজতান্ত্রিক ছাত্র ফ্রন্ট ময়মনসিংহ জেলা ওয়েবসাইটের মূল তথ্যসমূহ (আমাদের সম্পর্কে, মূলনীতি ও লক্ষ্য, ভিশন এবং সংবিধান বিবরণী) সরাসরি এডিট করে সংরক্ষণ করুন। এটি সরাসরি সাধারণ দর্শক হোমপেজে ও আমাদের সম্পর্কে সেকশনে আপডেট হয়ে যাবে।
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">আমাদের সম্পর্কে বিস্তারিত বিবরণ (About Us Text):</label>
                    <textarea 
                      className="text-xs font-sans border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-2 w-full bg-white dark:bg-zinc-950 focus:outline-rose-500/30 transition text-zinc-800 dark:text-zinc-150 h-28"
                      value={aboutForm}
                      onChange={(e) => setAboutForm(e.target.value)}
                      placeholder="এখানে আমাদের সম্পর্কে বিস্তারিত বিবরণ বাংলা ভাষায় লিখুন..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">আমাদের লক্ষ্য ও মূলনীতি (Our Mission Text):</label>
                    <textarea 
                      className="text-xs font-sans border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-2 w-full bg-white dark:bg-zinc-950 focus:outline-rose-500/30 transition text-zinc-800 dark:text-zinc-150 h-24"
                      value={missionForm}
                      onChange={(e) => setMissionForm(e.target.value)}
                      placeholder="এখানে সংগঠনের মূলনীতি ও লক্ষ্যসমূহ বিস্তারিত লিখুন..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">আমাদের ভিশন ও আগামী দিনের রূপরেখা (Our Vision Text):</label>
                    <textarea 
                      className="text-xs font-sans border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-2 w-full bg-white dark:bg-zinc-950 focus:outline-rose-500/30 transition text-zinc-800 dark:text-zinc-150 h-24"
                      value={visionForm}
                      onChange={(e) => setVisionForm(e.target.value)}
                      placeholder="এখানে সমাজতান্ত্রিক ছাত্র ফ্রন্টের লক্ষ্য, কর্মপরিকল্পনা ও রূপরেখা লিখুন..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">সাংবিধানিক প্রস্তাবনা বিবরণী (Constitutional Header Text):</label>
                    <textarea 
                      className="text-xs font-sans border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-2 w-full bg-white dark:bg-zinc-950 focus:outline-rose-500/30 transition text-zinc-800 dark:text-zinc-150 h-20"
                      value={constForm}
                      onChange={(e) => setConstForm(e.target.value)}
                      placeholder="সাংবিধানিক প্রস্তাবনা প্রথম সূচনা বাক্যটি লিখুন..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">ঐতিহাসিক বৈপ্লবিক অঙ্গীকার (Oath Title - মেম্বার পোর্টাল):</label>
                    <input 
                      type="text"
                      className="text-xs font-sans border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-2 w-full bg-white dark:bg-zinc-950 focus:outline-rose-500/30 transition text-zinc-800 dark:text-zinc-150"
                      value={oathTitleForm}
                      onChange={(e) => setOathTitleForm(e.target.value)}
                      placeholder="ঐতিহাসিক বৈপ্লবিক অঙ্গীকার..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">অঙ্গীকারের মূল তথ্য (Oath Body - মেম্বার পোর্টাল):</label>
                    <textarea 
                      className="text-xs font-sans border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-2 w-full bg-white dark:bg-zinc-950 focus:outline-rose-500/30 transition text-zinc-800 dark:text-zinc-150 h-24"
                      value={oathBodyForm}
                      onChange={(e) => setOathBodyForm(e.target.value)}
                      placeholder="অঙ্গীকারের মূল বা বিপ্লবী বাণী এখানে লিখুন..."
                    />
                  </div>

                  <div className="pt-4 border-t border-zinc-150 dark:border-zinc-900/60 space-y-4">
                    <h4 className="text-xs font-bold text-rose-500 select-none">মেম্বার আইডি কার্ড সেটিংস (E-ID Card Signature & Signer Details):</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">স্বাক্ষরকারীর নাম (Signer Name):</label>
                        <input 
                          type="text"
                          className="text-xs font-sans border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-2 w-full bg-white dark:bg-zinc-950 focus:outline-rose-500/30 transition text-zinc-800 dark:text-zinc-150"
                          value={idSignerNameForm}
                          onChange={(e) => setIdSignerNameForm(e.target.value)}
                          placeholder="কমরেড তানজিল হোসেন মুণিম..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">পদবী লাইন ১ (Role Line 1):</label>
                        <input 
                          type="text"
                          className="text-xs font-sans border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-2 w-full bg-white dark:bg-zinc-950 focus:outline-rose-500/30 transition text-zinc-800 dark:text-zinc-150"
                          value={idSignerRoleLine1Form}
                          onChange={(e) => setIdSignerRoleLine1Form(e.target.value)}
                          placeholder="সভাপতি..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">পদবী লাইন ২ (Role Line 2):</label>
                        <input 
                          type="text"
                          className="text-xs font-sans border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-2 w-full bg-white dark:bg-zinc-950 focus:outline-rose-500/30 transition text-zinc-800 dark:text-zinc-150"
                          value={idSignerRoleLine2Form}
                          onChange={(e) => setIdSignerRoleLine2Form(e.target.value)}
                          placeholder="সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা..."
                        />
                      </div>
                    </div>
                    <div>
                      <FileUploader 
                        label="স্বাক্ষরের ছবি (Signature PNG Image):"
                        value={idSignerSignatureUrlForm}
                        onChange={(url) => setIdSignerSignatureUrlForm(url)}
                        accept="image/png, image/jpeg, image/webp"
                        placeholder="আপনার স্বাক্ষরের পিএনজি ছবি লিঙ্ক বা আপলোড করুন..."
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-150 dark:border-zinc-900 pt-4">
                  {settingsSuccess ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 w-full sm:w-auto">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>ওয়েবসাইটের মূল বিবরণী সফলভাবে সংরক্ষিত হয়েছে!</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
                      *সকল বিবরণী পরিবর্তন নিশ্চিত করতে নিচের 'সংরক্ষণ করুন' বাটনে চাপুন।
                    </div>
                  )}

                  <button
                    onClick={handleSaveTextSettings}
                    disabled={savingSettings}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold tracking-wide transition flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-center disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    {savingSettings ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>সংরক্ষণ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* অঙ্গসংগঠন সমূহের লগো আপলোড ও ব্যবস্থাপনা */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded p-5 bg-zinc-50/20 dark:bg-zinc-950/20 mt-8">
                <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                  <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">নতুন ফিচার</span>
                  <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">অঙ্গসংগঠন লগো ও প্রতীক ব্যবস্থাপনা</h4>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 font-sans leading-normal">
                  এখানে বাসদের বিভিন্ন শ্রেণী ও গণসংগঠনের লগো বা প্রতীকের ইমেজ লিঙ্ক (URL) বসিয়ে দিন। এই লগোসমূহ সরাসরি 'আমাদের লক্ষ্য ও ইতিহাস' পেজের সহযোগী অঙ্গসংগঠনের তালিকায় ভেসে উঠবে।
                </p>

                <div className="space-y-4">
                  {(db.organizations || []).map((org) => {
                    const currentLogo = orgLogos[org.id] || '';
                    return (
                      <div key={org.id} className="p-4 border border-zinc-150 dark:border-zinc-900 rounded bg-white dark:bg-zinc-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full md:w-1/3">
                          <div className="w-12 h-12 rounded-full border border-zinc-100 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0">
                            {currentLogo ? (
                              <img src={currentLogo} alt={org.nameBangla} referrerPolicy="no-referrer" className="w-full h-full object-contain p-1" />
                            ) : (
                              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 font-mono uppercase">{org.nameEnglish.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{org.nameBangla}</h5>
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono block leading-tight">{org.nameEnglish}</span>
                          </div>
                        </div>

                        <div className="w-full md:w-2/3">
                          <label className="text-[10px] text-zinc-400 dark:text-zinc-550 font-mono block mb-1">লগো ইমেজ লিঙ্ক (URL URL-লিঙ্ক):</label>
                          <input 
                            type="text" 
                            className="text-xs font-sans border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 w-full bg-zinc-50/50 dark:bg-zinc-905 focus:outline-rose-500/30 transition text-zinc-850 dark:text-zinc-100" 
                            placeholder="যেমনঃ https://example.com/logo.png"
                            value={currentLogo}
                            onChange={(e) => handleUpdateLogo(org.id, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-150 dark:border-zinc-900 pt-4">
                  {orgSaveSuccess ? (
                    <div id="save-success-msg" className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 w-full sm:w-auto">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>অঙ্গসংগঠনের লগোসমূহ সফলভাবে সংরক্ষিত হয়েছে!</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
                      *সকল পরিবর্তন নিশ্চিত করতে 'সংরক্ষণ করুন' বাটনে ক্লিক করতে হবে।
                    </div>
                  )}

                  <button
                    onClick={handleSaveAllLogos}
                    disabled={isSavingOrgs}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold tracking-wide transition flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-center disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    {isSavingOrgs ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>অঙ্গসংগঠন লগো সংরক্ষণ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* বিপ্লবী শ্লোগান ডিরেক্টরি এডিটর */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded p-5 bg-zinc-50/20 dark:bg-zinc-950/20 mt-8">
                <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                  <span className="bg-rose-55 dark:bg-rose-950/60 text-white dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">রিয়েল-টাইম এডিটর</span>
                  <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">বিপ্লবী শ্লোগান ডিরেক্টরি (Slogan Ticker Editor)</h4>
                </div>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mb-5 font-sans leading-normal">
                  এখানে ওয়েবসাইটের নিচের ব্যানারে প্রদর্শনীর জন্য শ্লোগান তালিকা সংশোধন, পরিবর্ধন ও নতুন শ্লোগান যুক্ত করুন। শ্লোগান প্রতি ৩ সেকেন্ড পরপর পরিবর্তিত হবে।
                </p>

                {(() => {
                  const slogansList = db.settings.slogans || [];

                  const handleAddSlogan = async () => {
                    if (!newSlogan.trim()) return;
                    setIsSavingSlogans(true);
                    const updated = [...slogansList, newSlogan.trim()];
                    await onSaveSettings({ slogans: updated });
                    setNewSlogan('');
                    setIsSavingSlogans(false);
                  };

                  const handleDeleteSlogan = async (indexToDelete: number) => {
                    setIsSavingSlogans(true);
                    const updated = slogansList.filter((_, idx) => idx !== indexToDelete);
                    await onSaveSettings({ slogans: updated });
                    setIsSavingSlogans(false);
                  };

                  return (
                    <div className="space-y-3">
                      <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-805 rounded p-3 space-y-2 bg-white dark:bg-zinc-950 font-sans">
                        {slogansList.length === 0 ? (
                          <div className="text-xs text-zinc-400 italic py-2 text-center">কোন প্রকার শ্লোগান যুক্ত নেই। নিচে নতুন শ্লোগান যুক্ত করুন।</div>
                        ) : (
                          slogansList.map((slogan, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-850 hover:border-zinc-250 transition-all">
                              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{slogan}</span>
                              <button
                                onClick={() => handleDeleteSlogan(idx)}
                                disabled={isSavingSlogans}
                                className="text-rose-600 hover:text-rose-800 dark:hover:text-rose-400 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          className="flex-1 text-xs font-sans border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-2 bg-white dark:bg-zinc-905 focus:outline-none focus:border-rose-55/30 transition text-zinc-850 dark:text-zinc-100"
                          placeholder="নতুন বিপ্লবী শ্লোগান লিখুন..."
                          value={newSlogan}
                          onChange={(e) => setNewSlogan(e.target.value)}
                        />
                        <button
                          onClick={handleAddSlogan}
                          disabled={isSavingSlogans || !newSlogan.trim()}
                          className="px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white rounded text-xs font-bold leading-none cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>যুক্ত করুন</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* নেতৃত্ব ও নির্বাচিত সংসদ এডিটর */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded p-5 bg-zinc-50/20 dark:bg-zinc-950/20 mt-8 mb-4">
                <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                  <span className="bg-rose-55 dark:bg-rose-950/60 text-white dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">রিয়েল-টাইม এডিটর</span>
                  <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">সাংগঠনিক নেতৃত্ব ও নির্বাচিত সংসদ এডিটর</h4>
                </div>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mb-5 font-sans leading-normal">
                  এখানে ময়মনসিংহ জেলা সংসদ, কার্যকরী সাধারণ সদস্য ফোরাম, ক্যাম্পাস ও শিক্ষাঙ্গন সংসদ এবং সাবেক ছাত্রনেতৃত্বের তথ্য পরিবর্তন, বিয়োজন এবং নতুন সংযোজন করতে পারবেন।
                </p>

                {(() => {
                  const handleSaveDistrict = async (newList: any[]) => {
                    setIsSavingLeaders(true);
                    await onSaveSettings({ leadersDistrict: newList });
                    setIsSavingLeaders(false);
                  };

                  const handleSaveExecutive = async (newList: any[]) => {
                    setIsSavingLeaders(true);
                    await onSaveSettings({ leadersExecutive: newList });
                    setIsSavingLeaders(false);
                  };

                  const handleSaveUnits = async (newList: any[]) => {
                    setIsSavingLeaders(true);
                    await onSaveSettings({ leadersUnits: newList });
                    setIsSavingLeaders(false);
                  };

                  const handleSaveFormer = async (newList: any[]) => {
                    setIsSavingLeaders(true);
                    await onSaveSettings({ leadersFormer: newList });
                    setIsSavingLeaders(false);
                  };

                  return (
                    <div className="space-y-4">
                      {/* Sub tab navigator */}
                      <div className="flex flex-wrap gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        {[
                          { id: 'district', label: 'জেলা সংসদ' },
                          { id: 'executive', label: 'কার্যকরী সদস্য' },
                          { id: 'units', label: 'শিক্ষাঙ্গন ও স্কুল ফোরাম' },
                          { id: 'former', label: 'সাবেক ছাত্রনেতৃত্ব' }
                        ].map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setLeadersSubTab(sub.id as any)}
                            className={`px-3 py-1.5 rounded text-xs font-bold leading-none cursor-pointer transition-all ${
                              leadersSubTab === sub.id
                                ? 'bg-rose-600 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-150 dark:hover:bg-zinc-850'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>

                      {/* District Committee Section */}
                      {leadersSubTab === 'district' && (
                        <div className="space-y-4 font-sans">
                          <div className="space-y-2 max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2.5 rounded bg-white dark:bg-zinc-950">
                            {(db.settings.leadersDistrict || []).map((leader: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/60 p-2 rounded border border-zinc-100 dark:border-zinc-855">
                                <div className="text-xs">
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{leader.name}</span>
                                  {leader.role && <span className="text-rose-650 dark:text-rose-455 text-[10px] ml-2 font-semibold">({leader.role})</span>}
                                  {leader.inst && <span className="text-zinc-500 text-[10px] ml-2 block sm:inline">• {leader.inst}</span>}
                                  {leader.memberCode && <span className="text-[10px] text-zinc-400 font-mono ml-2 block sm:inline">[কোড: {leader.memberCode}]</span>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (db.settings.leadersDistrict || []).filter((_: any, i: number) => i !== idx);
                                    handleSaveDistrict(updated);
                                  }}
                                  disabled={isSavingLeaders}
                                  className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-955 space-y-3">
                            <h5 className="text-xs font-bold text-rose-700 dark:text-rose-455">নতুন জেলা সংসদ নেতা যুক্ত করুন</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="নেতার নাম"
                                value={dName}
                                onChange={(e) => setDName(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="পদবী (যেমনঃ সভাপতি)"
                                value={dRole}
                                onChange={(e) => setDRole(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="প্রতিষ্ঠান (যেমনঃ আনন্দ মোহন কলেজ)"
                                value={dInst}
                                onChange={(e) => setDInst(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-150 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white font-mono"
                                placeholder="মেম্বার কোড (ঐচ্ছিক)"
                                value={dMemberCode}
                                onChange={(e) => setDMemberCode(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-150 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="ছবির ইউআরএল (ঐচ্ছিক)"
                                value={dPhotoUrl}
                                onChange={(e) => setDPhotoUrl(e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!dName || !dRole || !dInst) return;
                                const updated = [...(db.settings.leadersDistrict || []), {
                                  name: dName,
                                  role: dRole,
                                  inst: dInst,
                                  memberCode: dMemberCode ? dMemberCode.trim() : undefined,
                                  photoUrl: dPhotoUrl ? dPhotoUrl.trim() : undefined
                                }];
                                handleSaveDistrict(updated);
                                setDName('');
                                setDRole('');
                                setDInst('');
                                setDMemberCode('');
                                setDPhotoUrl('');
                              }}
                              disabled={isSavingLeaders || !dName || !dRole}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              যুক্ত করুন
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Executive Committee Section */}
                      {leadersSubTab === 'executive' && (
                        <div className="space-y-4 font-sans">
                          <div className="space-y-2 max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2.5 rounded bg-white dark:bg-zinc-950">
                            {(db.settings.leadersExecutive || []).map((leader: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/60 p-2 rounded border border-zinc-100 dark:border-zinc-850">
                                <div className="text-xs">
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{leader.name}</span>
                                  {leader.role && <span className="text-rose-650 dark:text-rose-455 text-[10px] ml-2 font-semibold">({leader.role})</span>}
                                  {leader.inst && <span className="text-zinc-500 text-[10px] ml-2 block sm:inline">• {leader.inst}</span>}
                                  {leader.memberCode && <span className="text-[10px] text-zinc-400 font-mono ml-2 block sm:inline">[কোড: {leader.memberCode}]</span>}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (db.settings.leadersExecutive || []).filter((_: any, i: number) => i !== idx);
                                    handleSaveExecutive(updated);
                                  }}
                                  disabled={isSavingLeaders}
                                  className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="p-3.5 border border-zinc-200 dark:border-zinc-808 rounded bg-white dark:bg-zinc-950 space-y-3">
                            <h5 className="text-xs font-bold text-rose-700 dark:text-rose-455">নতুন কার্যকরী সদস্য যুক্ত করুন</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="সদস্যের নাম"
                                value={eName}
                                onChange={(e) => setEName(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="পদবী (যেমনঃ কার্যকরী সদস্য)"
                                value={eRole}
                                onChange={(e) => setERole(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="শিক্ষা প্রতিষ্ঠান (যেমনঃ আনন্দ মোহন কলেজ)"
                                value={eInst}
                                onChange={(e) => setEInst(e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white font-mono"
                                placeholder="মেম্বার কোড (ঐচ্ছিক)"
                                value={eMemberCode}
                                onChange={(e) => setEMemberCode(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-955 dark:text-white"
                                placeholder="ছবির ইউআরএল (ঐচ্ছিক)"
                                value={ePhotoUrl}
                                onChange={(e) => setEPhotoUrl(e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!eName || !eInst) return;
                                const updated = [...(db.settings.leadersExecutive || []), { 
                                  name: eName, 
                                  role: eRole || 'কার্যকরী সদস্য', 
                                  inst: eInst,
                                  memberCode: eMemberCode ? eMemberCode.trim() : undefined,
                                  photoUrl: ePhotoUrl ? ePhotoUrl.trim() : undefined
                                }];
                                handleSaveExecutive(updated);
                                setEName('');
                                setEInst('');
                                setEMemberCode('');
                                setEPhotoUrl('');
                              }}
                              disabled={isSavingLeaders || !eName || !eInst}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              যুক্ত করুন
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Unit Committee section */}
                      {leadersSubTab === 'units' && (
                        <div className="space-y-4 font-sans">
                          <div className="space-y-3 max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-808 p-2.5 rounded bg-white dark:bg-zinc-950">
                            {(db.settings.leadersUnits || []).map((unit, idx) => (
                              <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded border border-zinc-150 dark:border-zinc-808 space-y-2">
                                <div className="flex justify-between items-center border-b border-zinc-250 dark:border-zinc-800 pb-1.5">
                                  <h6 className="text-xs font-bold text-rose-700 dark:text-rose-455">{unit.unitName}</h6>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = (db.settings.leadersUnits || []).filter((_, i) => i !== idx);
                                      handleSaveUnits(updated);
                                    }}
                                    disabled={isSavingLeaders}
                                    className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                                    title="পুরো সংসদ মুছুন"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[11px]">
                                  {(unit.leaders || []).map((lead, lIdx) => (
                                    <span key={lIdx} className="bg-white dark:bg-zinc-955 border border-zinc-150 dark:border-zinc-850 px-2.5 py-1 rounded">
                                      <strong className="text-zinc-800 dark:text-white">{lead.name}:</strong> <span className="text-zinc-500">{lead.role}</span>
                                      {lead.memberCode && <span className="text-[9px] text-zinc-400 font-mono ml-1">[কোড: {lead.memberCode}]</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 space-y-3">
                            <h5 className="text-xs font-bold text-rose-700 dark:text-rose-455">নতুন শিক্ষাঙ্গন / শাখা সংসদ কমিটি যুক্ত করুন</h5>
                            <input
                              type="text"
                              className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-white w-full"
                              placeholder="শাখার নাম (যেমনঃ আনন্দ মোহন কলেজ শাখা সংসদ)"
                              value={uUnitName}
                              onChange={(e) => setUUnitName(e.target.value)}
                            />
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-808 rounded">
                              <div className="space-y-2">
                                <h6 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">নেতৃত্ব ১:</h6>
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-800 dark:text-white"
                                  placeholder="নাম"
                                  value={uLeadName1}
                                  onChange={(e) => setULeadName1(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-808 dark:text-white"
                                  placeholder="পদবী (যেমনঃ সভাপতি, আহ্বায়ক)"
                                  value={uLeadRole1}
                                  onChange={(e) => setULeadRole1(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-808 dark:text-white font-mono"
                                  placeholder="মেম্বার কোড (ঐচ্ছিক)"
                                  value={uLead1MemberCode}
                                  onChange={(e) => setULead1MemberCode(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-808 dark:text-white"
                                  placeholder="ছবি ইউআরএল (ঐচ্ছিক)"
                                  value={uLead1PhotoUrl}
                                  onChange={(e) => setULead1PhotoUrl(e.target.value)}
                                />
                              </div>

                              <div className="space-y-2">
                                <h6 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">নেতৃত্ব ২ (ঐচ্ছিক):</h6>
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-800 dark:text-white"
                                  placeholder="নাম"
                                  value={uLeadName2}
                                  onChange={(e) => setULeadName2(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-808 dark:text-white"
                                  placeholder="পদবী (যেমনঃ সাধারণ সম্পাদক)"
                                  value={uLeadRole2}
                                  onChange={(e) => setULeadRole2(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-808 dark:text-white font-mono"
                                  placeholder="মেম্বার কোড (ঐচ্ছিক)"
                                  value={uLead2MemberCode}
                                  onChange={(e) => setULead2MemberCode(e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="text-xs border border-zinc-200 dark:border-zinc-808 rounded px-2 py-1 w-full bg-white dark:bg-zinc-955 text-zinc-808 dark:text-white"
                                  placeholder="ছবি ইউআরএল (ঐচ্ছিক)"
                                  value={uLead2PhotoUrl}
                                  onChange={(e) => setULead2PhotoUrl(e.target.value)}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (!uUnitName || !uLeadName1 || !uLeadRole1) return;
                                const committeeLeaders = [{
                                  name: uLeadName1,
                                  role: uLeadRole1,
                                  memberCode: uLead1MemberCode ? uLead1MemberCode.trim() : null,
                                  photoUrl: uLead1PhotoUrl ? uLead1PhotoUrl.trim() : null
                                }];
                                if (uLeadName2 && uLeadRole2) {
                                  committeeLeaders.push({
                                    name: uLeadName2,
                                    role: uLeadRole2,
                                    memberCode: uLead2MemberCode ? uLead2MemberCode.trim() : null,
                                    photoUrl: uLead2PhotoUrl ? uLead2PhotoUrl.trim() : null
                                  });
                                }
                                const updated = [...(db.settings.leadersUnits || []), { unitName: uUnitName, leaders: committeeLeaders }];
                                handleSaveUnits(updated);
                                setUUnitName('');
                                setULeadName1('');
                                setULeadRole1('');
                                setULead1MemberCode('');
                                setULead1PhotoUrl('');
                                setULeadName2('');
                                setULeadRole2('');
                                setULead2MemberCode('');
                                setULead2PhotoUrl('');
                              }}
                              disabled={isSavingLeaders || !uUnitName || !uLeadName1 || !uLeadRole1}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              যুক্ত করুন
                            </button>
                          </div>
                        </div>
                      )}

                      
{/* Former leadership section */}
                      {leadersSubTab === 'former' && (
                        <div className="space-y-4 font-sans">
                          <div className="space-y-2 max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2.5 rounded bg-white dark:bg-zinc-950">
                            {(db.settings.leadersFormer || []).map((former: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-start bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded border border-zinc-100 dark:border-zinc-850">
                                <div className="text-xs">
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{former.name}</span>
                                  <span className="text-zinc-500 text-[10px] ml-2 block sm:inline font-mono">({former.duration})</span>
                                  <p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-1 italic leading-normal font-sans">অবদান ও পরিচয়ঃ {former.contribution}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (db.settings.leadersFormer || []).filter((_, i) => i !== idx);
                                    handleSaveFormer(updated);
                                  }}
                                  disabled={isSavingLeaders}
                                  className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer shrink-0"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="p-3.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 space-y-3">
                            <h5 className="text-xs font-bold text-rose-700 dark:text-rose-450">নতুন সাবেক নেতৃত্ব বিবরণী যুক্ত করুন</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-white"
                                placeholder="সাবেক নেতার নাম"
                                value={fName}
                                onChange={(e) => setFName(e.target.value)}
                              />
                              <input
                                type="text"
                                className="text-xs border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-white"
                                placeholder="নেতৃত্বের মেয়াদ (যেমনঃ ১৯৯৪ - ১৯৯৮)"
                                value={fDuration}
                                onChange={(e) => setFDuration(e.target.value)}
                              />
                            </div>
                            <textarea
                              className="text-xs border border-zinc-200 dark:border-zinc-805 rounded px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-white w-full h-16 resize-none"
                              placeholder="সংক্ষিপ্ত অবদান ও পরিচয়াবলী (যেমনঃ প্রাক্তন জেলা সভাপতি ও শ্রমিক আন্দোলনের বুদ্ধিজীবী)"
                              value={fContribution}
                              onChange={(e) => setFContribution(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!fName || !fDuration || !fContribution) return;
                                const updated = [...(db.settings.leadersFormer || []), { name: fName, duration: fDuration, contribution: fContribution }];
                                handleSaveFormer(updated);
                                setFName('');
                                setFDuration('');
                                setFContribution('');
                              }}
                              disabled={isSavingLeaders || !fName || !fDuration}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              যুক্ত করুন
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Membership approval subsystem */}
          {activeSubTab === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200">অনলাইন সদস্যভুক্তি ও সেল অনুমোদন</h3>
                    <p className="text-[11px] text-zinc-500 font-sans mt-1">
                      শ্রেণী ও সেশন ডিক্লেয়ারেশন অনুযায়ী আবেদনকারীদের যাচাই করে তালিকায় অন্তর্ভুক্ত করুন।
                    </p>
                  </div>
                  
                  {/* CSV Download Button */}
                  <button
                    onClick={handleDownloadMembersCSV}
                    title="অনুমোদিত ভেরিফাইড সদস্যদের সম্পূর্ণ ডাটাবেজ এক্সেল বা শিট ফরম্যাটে ডাউনলোড করুন"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-xs transition duration-150 select-none cursor-pointer border border-emerald-500"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ভেরিফাইড মেম্বার ডাউনলোড (CSV)</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div></div>
                
                {/* Status selector pills */}
                <div className="flex flex-wrap items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded border border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => setMembersFilter('pending')}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      membersFilter === 'pending'
                        ? 'bg-amber-550 text-white shadow-xs'
                        : 'text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    <span>অপেক্ষমান</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${membersFilter === 'pending' ? 'bg-black/20 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                      {db.memberships.filter(m => m.status === 'pending').length}
                    </span>
                  </button>

                  <button
                    onClick={() => setMembersFilter('verified')}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      membersFilter === 'verified'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    <span>অনুমোদিত সদস্য তালিকা</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${membersFilter === 'verified' ? 'bg-black/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                      {db.memberships.filter(m => m.status === 'verified').length}
                    </span>
                  </button>

                  <button
                    onClick={() => setMembersFilter('rejected')}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      membersFilter === 'rejected'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    <span>প্রত্যাখ্যাত</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${membersFilter === 'rejected' ? 'bg-black/20 text-white' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                      {db.memberships.filter(m => m.status === 'rejected').length}
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {db.memberships
                  .filter((m) => m.status === membersFilter)
                  .map((member) => (
                    <div key={member.id} className="p-5 border rounded-sm bg-zinc-50 dark:bg-zinc-900 w-full relative border-zinc-200 dark:border-zinc-800">
                      <span className={`absolute top-4 right-4 text-[9px] uppercase font-mono tracking-wider font-bold px-1.5 py-0.5 rounded ${
                        member.status === 'verified'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                          : member.status === 'rejected'
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {member.status === 'verified' ? 'Approved' : member.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>

                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{member.name} ({member.type === 'member' ? 'সদস্য' : 'স্বেচ্ছাসেবক'})</h4>
                      <ul className="text-xs text-zinc-650 dark:text-zinc-400 space-y-1 font-mono mt-2.5">
                        <li><span className="font-sans font-semibold">মোবাইল:</span> {member.mobile}</li>
                        <li><span className="font-sans font-semibold">ইমেইল:</span> {member.email || 'নাই'}</li>
                        <li><span className="font-sans font-semibold">প্রতিষ্ঠানের নাম:</span> {member.institution} • {member.department} • সেশন: {member.academicYear}</li>
                        <li><span className="font-sans font-semibold">ঠিকানা:</span> {member.address}</li>
                        <li><span className="font-sans font-semibold">আবেদন তারিখ:</span> {member.appliedAt}</li>
                        {member.verifiedAt && (
                          <li className="text-emerald-600 dark:text-emerald-400 font-bold">
                            <span className="font-sans font-semibold">ভেরিফিকেশন তারিখ:</span> {member.verifiedAt}
                          </li>
                        )}
                      </ul>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {member.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onVerifyMember(member.id, 'verified')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              অনুমোদন দিন
                            </button>
                            <button
                              onClick={() => onVerifyMember(member.id, 'rejected')}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 text-xs font-semibold cursor-pointer"
                            >
                              প্রত্যাখ্যান করুন
                            </button>
                          </>
                        )}
                        {member.status === 'rejected' && (
                          <button
                            onClick={() => onVerifyMember(member.id, 'verified')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            পুনরায় অনুমোদন দিন
                          </button>
                        )}
                        {member.status === 'verified' && (
                          <button
                            onClick={() => onVerifyMember(member.id, 'rejected')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 text-xs font-semibold cursor-pointer"
                          >
                            অনুমোদন বাতিল করুন
                          </button>
                        )}
                        {deleteConfirm?.id === member.id && deleteConfirm?.type === 'member' ? (
                          <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-955 px-2 py-1 border border-rose-250 dark:border-rose-900 rounded-xs">
                            <button onClick={() => { onDeleteMember(member.id); setDeleteConfirm(null); }} className="px-2 py-1 text-[10px] bg-rose-600 text-white rounded-xs font-bold cursor-pointer">হ্যাঁ</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-[10px] bg-zinc-550 text-white rounded-xs font-bold cursor-pointer">না</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm({ id: member.id, type: 'member' })}
                            className="px-3 py-1.5 bg-rose-50/50 hover:bg-rose-100 dark:bg-rose-950/10 rounded text-rose-600 dark:text-rose-400 text-xs font-semibold cursor-pointer"
                          >
                            মুছুন
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                {db.memberships.filter((m) => m.status === membersFilter).length === 0 && (
                  <p className="text-xs text-zinc-400 italic py-6">কোনো সদস্য বা আবেদনপত্র পাওয়া যায়নি।</p>
                )}
              </div>
            </div>
          )}

          {/* Comments approval sub panel */}
          {activeSubTab === 'comments' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-emerald-700">ব্লগ ও প্রবন্ধের মন্তব্য অনুমোদন মডিউল</h3>

              <div className="space-y-4">
                {db.blogs.map((blog) => {
                  const unapproved = (blog.comments || []).filter(c => !c.approved);
                  if (unapproved.length === 0) return null;
                  return (
                    <div key={blog.id} className="border p-4 rounded bg-white space-y-3">
                      <span className="text-[10px] text-zinc-500 font-mono">নিবন্ধ: "{blog.title}"</span>
                      {unapproved.map((comment) => (
                        <div key={comment.id} className="bg-zinc-50 p-3 rounded text-xs space-y-2 border border-zinc-150">
                          <div className="flex justify-between font-mono text-[10px] text-zinc-400">
                            <span>লেখক: {comment.authorName} ({comment.authorEmail})</span>
                            <span>তারিখ: {comment.date}</span>
                          </div>
                          <p className="text-zinc-700 font-sans italic">"{comment.text}"</p>
                          <button
                            onClick={() => onApproveComment(blog.id, comment.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded"
                          >
                            <Check className="w-3 h-3" />
                            <span>অনুমোদন ও প্রকাশ করুন</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {db.blogs.reduce((acc, b) => acc + (b.comments?.filter(c => !c.approved).length || 0), 0) === 0 && (
                  <p className="text-xs text-zinc-400 italic py-6">কোনো নতুন মন্তব্য অনুমোদনের জন্য অপেক্ষারত নেই।</p>
                )}
              </div>
            </div>
          )}

          {/* Custom Visitor & Site Analytics Tab Block */}
          {activeSubTab === 'analytics' && (
            <div className="space-y-6 font-sans">
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-900 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>সাইট ভিজিটর ও মেম্বার পোর্টাল এনালাইটিকস (Live Stats Panel)</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">এখানে সাইটের কার্যক্রম, দর্শক পরিসংখ্যান এবং মেম্বার পোর্টালের ইন্টারঅ্যাকশন বিশ্লেষণ করা হয়েছে।</p>
                </div>
                <div className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 border border-emerald-250 px-2.5 py-1 rounded-sm font-bold animate-pulse">
                  ● লাইভ ডেটা
                </div>
              </div>

              {/* 1. Quick Info Numeric Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-rose-50 to-rose-100/30 dark:from-zinc-90 w-full border border-rose-200/50 dark:border-zinc-800 rounded p-4 shadow-xs">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">সর্বমোট পেজ ভিউ (১০ গুণ সহ)</span>
                  <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">{(db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0) * 10} ভিউ</p>
                  <span className="text-[10px] text-zinc-400 block mt-1">প্রকৃত দর্শক: {(db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0)} জন</span>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 dark:from-zinc-90 w-full border border-emerald-200/50 dark:border-zinc-800 rounded p-4 shadow-xs">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">নিবন্ধিত সর্বমোট মেম্বার</span>
                  <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{db.memberships.length} জন</p>
                  <span className="text-[10px] text-zinc-400 block mt-1">অনুমোদিত: {db.memberships.filter(m => m.status === 'verified').length} • অপেক্ষারত: {db.memberships.filter(m => m.status === 'pending').length}</span>
                </div>

                <div className="bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-90 w-full border border-zinc-150 dark:border-zinc-800 rounded p-4 shadow-xs">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">ডাউনলোড কৃত প্রকাশনা</span>
                  <p className="text-2xl font-bold mt-1 text-zinc-800 dark:text-zinc-200">{db.books.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0)} বার</p>
                  <span className="text-[10px] text-zinc-400 block mt-1">মোট প্রকাশনা তালিকা: {db.books.length}টি মেটেরিয়ালস</span>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-amber-105/30 dark:from-zinc-90 w-full border border-rose-150 dark:border-zinc-800 rounded p-4 shadow-xs">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">ড্যাশবোর্ড নিরাপত্তা লগ</span>
                  <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{db.logs.length + (db.memberLogins || []).length} রেকর্ড</p>
                  <span className="text-[10px] text-zinc-400 block mt-1">অডিট ইভেন্ট: {db.logs.length} • মেম্বার লগইন লগ: {(db.memberLogins || []).length}</span>
                </div>
              </div>

              {/* 2. Page visits and Devices grids */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Device usage widget */}
                <div className="border border-zinc-150 dark:border-zinc-900 p-5 rounded bg-zinc-50/20 dark:bg-zinc-950/25">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider border-b pb-2 mb-4">ডিভাইস ভিত্তিক ট্রাফিক শেয়ার</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold">মোবাইল ফোন (Mobile Phones)</span>
                        <span className="font-semibold text-rose-600">{(db.visits || []).filter(v => v.device === 'mobile').reduce((acc, curr) => acc + (curr.views || 0), 0) * 10} ভিউ ({(db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0) > 0 ? Math.round(((db.visits || []).filter(v => v.device === 'mobile').reduce((acc, curr) => acc + (curr.views || 0), 0) / (db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0)) * 100) : 45}%)</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-150 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-600" 
                          style={{ width: `${(db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0) > 0 ? Math.round(((db.visits || []).filter(v => v.device === 'mobile').reduce((acc, curr) => acc + (curr.views || 0), 0) / (db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0)) * 100) : 45}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold">ডেস্কটপ এবং পিসি (Desktop Web)</span>
                        <span className="font-semibold text-emerald-600">{(db.visits || []).filter(v => v.device === 'desktop' || !v.device).reduce((acc, curr) => acc + (curr.views || 0), 0) * 10} ভিউ ({(db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0) > 0 ? Math.round(((db.visits || []).filter(v => v.device === 'desktop' || !v.device).reduce((acc, curr) => acc + (curr.views || 0), 0) / (db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0)) * 100) : 50}%)</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-150 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-600" 
                          style={{ width: `${(db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0) > 0 ? Math.round(((db.visits || []).filter(v => v.device === 'desktop' || !v.device).reduce((acc, curr) => acc + (curr.views || 0), 0) / (db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0)) * 100) : 50}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold">ট্যাবলেট ও আইপ্যাড (Tablets)</span>
                        <span className="font-semibold text-zinc-550">{(db.visits || []).filter(v => v.device === 'tablet').reduce((acc, curr) => acc + (curr.views || 0), 0) * 10} text-rose-500 ({(db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0) > 0 ? Math.round(((db.visits || []).filter(v => v.device === 'tablet').reduce((acc, curr) => acc + (curr.views || 0), 0) / (db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0)) * 100) : 5}%)</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-150 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-zinc-500" 
                          style={{ width: `${(db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0) > 0 ? Math.round(((db.visits || []).filter(v => v.device === 'tablet').reduce((acc, curr) => acc + (curr.views || 0), 0) / (db.visits || []).reduce((acc, curr) => acc + (curr.views || 0), 0)) * 100) : 5}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page view distribution charts */}
                <div className="border border-zinc-150 dark:border-zinc-900 p-5 rounded bg-zinc-50/20 dark:bg-zinc-950/25">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider border-b pb-2 mb-4">সেকশন ভিত্তিক পেজ পঠিত পরিসংখ্যান</h4>
                  <div className="space-y-2.5 max-h-[170px] overflow-y-auto">
                    {Array.from(new Set((db.visits || []).map(v => v.page || 'Home'))).map((page) => {
                      const pv = (db.visits || []).filter(v => (v.page || 'Home') === page).reduce((acc, curr) => acc + (curr.views || 0), 0);
                      const maximumPv = Math.max(...Array.from(new Set((db.visits || []).map(v => v.page || 'Home'))).map(p => (db.visits || []).filter(v => (v.page || 'Home') === p).reduce((acc, curr) => acc + (curr.views || 0), 0))) || 1;
                      const widthPct = Math.min(100, Math.max(10, Math.round((pv / maximumPv) * 100)));
                      return (
                        <div key={page} className="flex items-center text-xs justify-between gap-4">
                          <span className="w-1/3 truncate font-medium text-zinc-700 dark:text-zinc-300">{page}</span>
                          <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-900 rounded-sm overflow-hidden flex items-center">
                            <div className="h-full bg-rose-500" style={{ width: `${widthPct}%` }}></div>
                          </div>
                          <span className="w-1/5 text-right font-mono text-[10px] font-bold text-rose-600">{pv * 10} ভিউ</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* 3. Popular files and news ranking lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* News articles view order rankings */}
                <div className="border border-zinc-150 dark:border-zinc-900 p-5 rounded bg-zinc-50/20 dark:bg-zinc-950/25">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider border-b pb-2 mb-4 flex items-center gap-1.5">
                    <span>🔥 শীর্ষ ৫ পঠিত সংবাদ প্রতিবেদন</span>
                  </h4>
                  <div className="space-y-3">
                    {[...db.news].sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((n, i) => (
                      <div key={n.id} className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-2.5 last:border-0 last:pb-0">
                        <span className="font-mono text-sm font-bold text-zinc-400 w-4"># {i+1}</span>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate">{n.title}</h5>
                          <span className="text-[9px] text-zinc-400 font-mono">{n.date} • {n.category}</span>
                        </div>
                        <span className="font-mono text-[11px] font-extrabold text-emerald-600 shrink-0">{(n.views || 0) * 10} ভিউ</span>
                      </div>
                    ))}
                    {db.news.length === 0 && (
                      <p className="text-xs text-zinc-400 italic text-center py-6">কোনো সংবাদ রিপোর্ট নেই।</p>
                    )}
                  </div>
                </div>

                {/* Popular publication download count list */}
                <div className="border border-zinc-150 dark:border-zinc-900 p-5 rounded bg-zinc-50/20 dark:bg-zinc-950/25">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider border-b pb-2 mb-4 flex items-center gap-1.5">
                    <span>📚 সর্বাধিক ডাউনলোডকৃত প্রকাশনা</span>
                  </h4>
                  <div className="space-y-3">
                    {[...db.books].sort((a,b) => (b.downloadCount || 0) - (a.downloadCount || 0)).slice(0, 5).map((bVal, i) => (
                      <div key={bVal.id} className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-2.5 last:border-0 last:pb-0">
                        <span className="font-mono text-sm font-bold text-zinc-400 w-4"># {i+1}</span>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate">{bVal.title}</h5>
                          <span className="text-[9px] text-zinc-400 font-mono">{bVal.type} • লেখক: {bVal.author}</span>
                        </div>
                        <span className="font-mono text-[11px] font-extrabold text-rose-600 shrink-0">{bVal.downloadCount || 0} বার ডাউনলোড</span>
                      </div>
                    ))}
                    {db.books.length === 0 && (
                      <p className="text-xs text-zinc-400 italic text-center py-6">কোনো প্রকাশনা রেকর্ড নেই।</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Visitor Trends Section */}
              <div className="border border-zinc-150 dark:border-zinc-900 p-5 rounded bg-zinc-50/20 dark:bg-zinc-950/25 mt-6">
                <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest border-b pb-2 mb-4 flex items-center justify-between gap-1.5 font-sans">
                  <span>📈 দর্শক যাতায়াত ধারা (Daily & Monthly Visitor Trends - 10x Simulated)</span>
                  <span className="text-[10px] bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450 px-2.5 py-0.5 rounded font-black">সিস্টেম সিমুলেশন সক্রিয়</span>
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* Daily Trends Widget */}
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">দৈনিক দর্শক সংখ্যা (গত ১০ দিন)</h5>
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5 font-sans">প্রতিদিনের দর্শনার্থী সংখ্যার ১০ গুণিতক সিমুলেটেড রিপোর্ট</p>
                    </div>

                    <div className="flex items-end justify-between gap-2.5 pt-12 min-h-[160px] border-b border-zinc-200 dark:border-zinc-850 px-2 bg-zinc-50/30 dark:bg-zinc-900/10 p-4 rounded">
                      {(() => {
                        const dailyData = [];
                        const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        for (let i = 9; i >= 0; i--) {
                          const d = new Date();
                          d.setDate(d.getDate() - i);
                          const dateStr = d.toISOString().split('T')[0];
                          const realViews = (db.visits || []).filter(v => v.date === dateStr).reduce((acc, curr) => acc + (curr.views || 0), 0);
                          dailyData.push({
                            label: `${d.getDate()} ${mNames[d.getMonth()]}`,
                            views: realViews * 10
                          });
                        }
                        const maxViews = Math.max(...dailyData.map(d => d.views)) || 1;
                        return dailyData.map((day, idx) => {
                          const pct = Math.max(10, Math.round((day.views / maxViews) * 100));
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                              {/* Hover Tooltip */}
                              <div className="absolute -top-10 scale-0 group-hover:scale-100 bg-zinc-900 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap transition duration-150">
                                {day.views} ভিউ
                              </div>
                              <div 
                                className="w-full rounded-t bg-gradient-to-t from-rose-600 to-rose-450 hover:from-rose-500 hover:to-rose-400 shadow-inner group-hover:shadow transition-all duration-300"
                                style={{ height: `${pct}px` }}
                              />
                              <span className="text-[9px] font-bold font-mono text-zinc-500 dark:text-zinc-400 mt-2 rotate-45 origin-top-left translate-y-1 block h-5">{day.label}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Monthly Trends Widget */}
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">মাসিক দর্শক সংখ্যা (গত ৬ মাস)</h5>
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5 font-sans">প্রতি মাসের মোট দর্শনার্থী সংখ্যার ১০ গুণিতক সিমুলেটেড রিপোর্ট</p>
                    </div>

                    <div className="space-y-3 pt-2 bg-zinc-50/30 dark:bg-zinc-900/10 p-4 rounded font-sans">
                      {(() => {
                        const monthlyData = [];
                        const bMonthNames = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
                        const now = new Date();
                        for (let i = 5; i >= 0; i--) {
                          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                          const y = d.getFullYear();
                          const m = d.getMonth();
                          const prefix = `${y}-${String(m + 1).padStart(2, '0')}`;
                          const realViews = (db.visits || []).filter(v => v.date.startsWith(prefix)).reduce((sum, current) => sum + (current.views || 0), 0);
                          monthlyData.push({
                            label: `${bMonthNames[m]} ${y}`,
                            views: realViews * 10
                          });
                        }
                        const maxMonthlyViews = Math.max(...monthlyData.map(m => m.views)) || 1;
                        return monthlyData.map((m, idx) => {
                          const widthPct = Math.max(10, Math.round((m.views / maxMonthlyViews) * 100));
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-zinc-750 dark:text-zinc-350">{m.label}</span>
                                <span className="font-extrabold text-rose-600 dark:text-rose-450 font-mono">{m.views} ভিউ</span>
                              </div>
                              <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-850 rounded-sm overflow-hidden flex items-center shadow-inner">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-450 rounded-r shadow-md transition-all duration-300 hover:from-emerald-500 hover:to-emerald-400"
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Audit log visualizers */}
          {activeSubTab === 'logs' && (
            <div className="space-y-6 font-sans">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column 1: Operational Audit Log */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-600" />
                    <span>অডিট কার্যকৌশল লগ (Audit Report)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 pb-1">ওয়েবসাইটের কন্টেন্ট এবং সেটিংস পরিবর্তনের প্রশাসনিক লগ ট্র্যাকিং</p>
                  
                  <div className="bg-zinc-950 text-emerald-400 p-4 rounded border border-zinc-850 overflow-y-auto select-all h-[450px] text-[10px] space-y-3 leading-relaxed font-mono">
                    {db.logs.map((log) => (
                      <div key={log.id} className="border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0">
                        <span className="text-zinc-500">[{log.timestamp}]</span>{' '}
                        <span className="text-rose-500">[{log.action}]</span>{' '}
                        <span className="text-white">ব্যাক্তি: {log.user}</span>{' '}
                        <p className="text-zinc-400 mt-1 font-sans leading-normal">বর্ণনা: {log.details}</p>
                      </div>
                    ))}
                    {db.logs.length === 0 && (
                      <p className="text-zinc-550 italic text-center py-10 font-sans">কোনো অডিট লগ রেকর্ড নেই।</p>
                    )}
                  </div>
                </div>

                {/* Column 2: Member Login Security Activities Log */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>সদস্য লগইন ও সিকিউরিটি লগ (Login Activity Logs)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 pb-1">পোর্টাল মেম্বারদের সাইন-ইন এবং পাসওয়ার্ড উদ্ধারের নিরাপত্তা সংক্রান্ত কার্যকলাপ লগ</p>
                  
                  <div className="bg-zinc-950 p-4 rounded border border-zinc-850 overflow-y-auto select-all h-[450px] text-[10px] space-y-3 leading-relaxed font-mono text-zinc-300">
                    {(db.memberLogins || []).map((mLog) => (
                      <div key={mLog.id} className="border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="text-zinc-500">[{mLog.timestamp}]</span>
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            mLog.status === 'success' 
                              ? 'bg-emerald-950/80 text-emerald-405 border border-emerald-900/40 text-emerald-400' 
                              : mLog.status === 'reset_request'
                              ? 'bg-amber-950/80 text-amber-500 border border-amber-900/40'
                              : 'bg-rose-950/80 text-rose-500 border border-rose-900/40'
                          }`}>
                            {mLog.status === 'success' ? '✔ LOGIN_SUCCESS' : mLog.status === 'reset_request' ? '⚡ RESET_REQUEST' : '🚨 LOGIN_FAILED'}
                          </span>
                        </div>
                        <p className="text-white font-bold mt-1">ইমেইল: <span className="text-rose-400 underline select-all">{mLog.email}</span></p>
                        <p className="text-zinc-400 mt-1 font-sans leading-normal">বর্ণনা: {mLog.details}</p>
                      </div>
                    ))}
                    {(db.memberLogins || []).length === 0 && (
                      <p className="text-zinc-550 italic text-center py-10 font-sans">কোনো সদস্য লগইন সিকিউরিটি লগ রেকর্ড নেই।</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Dedicated Member Activity & Security Events Log Tab */}
          {activeSubTab === 'activity' && (
            <div className="space-y-6 font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 dark:border-zinc-900 pb-3.5 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-600" />
                    <span>মেম্বার অ্যাক্টিভিটি লগ ও সিকিউরিটি মনিটরিং</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">সদস্যদের লগইন প্রচেষ্টা, পাসওয়ার্ড পুনরুদ্ধার করার আবেদন এবং অডিট টাইমলাইন ট্র্য্যাকিং।</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="ইমেইল দিয়ে খুঁজুন..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="px-3 py-1.5 border border-zinc-250 dark:border-zinc-855 bg-transparent text-zinc-900 dark:text-zinc-150 rounded text-xs focus:ring-1 focus:ring-rose-500 outline-none max-w-[180px]"
                  />
                  <select
                    value={activityFilter}
                    onChange={(e: any) => setActivityFilter(e.target.value)}
                    className="px-2.5 py-1.5 border border-zinc-250 dark:border-zinc-855 bg-transparent text-zinc-900 dark:text-zinc-150 rounded text-xs focus:ring-1 focus:ring-rose-500 outline-none cursor-pointer"
                  >
                    <option value="all">সকল স্ট্যাটাস</option>
                    <option value="success">সফল লগইন</option>
                    <option value="failed">ব্যর্থ প্রচেষ্টা</option>
                    <option value="reset_request">রিসেট আবেদন</option>
                  </select>
                </div>
              </div>

              {/* Statistic widgets */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-90 w-full border border-zinc-150 dark:border-zinc-850 rounded">
                  <span className="text-[9px] text-zinc-450 block uppercase font-mono">সর্বমোট রেকর্ড</span>
                  <span className="text-lg font-black text-zinc-800 dark:text-zinc-200 font-mono">{(db.memberLogins || []).length}</span>
                </div>
                <div className="p-3 bg-emerald-50/35 dark:bg-emerald-950/10 w-full border border-emerald-200/40 dark:border-zinc-850 rounded">
                  <span className="text-[9px] text-zinc-455 block uppercase font-mono">সফল লগইন</span>
                  <span className="text-lg font-black text-emerald-600 font-mono">{(db.memberLogins || []).filter(l => l.status === 'success').length}</span>
                </div>
                <div className="p-3 bg-rose-50/35 dark:bg-rose-950/10 w-full border border-rose-200/40 dark:border-zinc-850 rounded">
                  <span className="text-[9px] text-zinc-455 block uppercase font-mono">ব্যর্থ লগইন</span>
                  <span className="text-lg font-black text-rose-600 font-mono">{(db.memberLogins || []).filter(l => l.status === 'failed').length}</span>
                </div>
                <div className="p-3 bg-amber-50/35 dark:bg-amber-950/10 w-full border border-amber-200/40 dark:border-zinc-850 rounded">
                  <span className="text-[9px] text-zinc-455 block uppercase font-mono">রিসেট অনুরোধ</span>
                  <span className="text-lg font-black text-amber-600 font-mono">{(db.memberLogins || []).filter(l => l.status === 'reset_request').length}</span>
                </div>
              </div>

              {/* Security monitoring grid table */}
              <div className="border border-zinc-150 dark:border-zinc-900 rounded overflow-hidden select-text">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-zinc-700 dark:text-zinc-300">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-805">
                      <tr>
                        <th className="px-4 py-3 font-bold font-sans">লগ আইডি / সময়</th>
                        <th className="px-4 py-3 font-bold font-sans">সদস্য ইমেইল</th>
                        <th className="px-4 py-3 font-bold font-sans">ফলাফল</th>
                        <th className="px-4 py-3 font-bold font-sans">বিস্তারিত তথ্য বিবরণী</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-900 font-mono text-[11px]">
                      {(() => {
                        const filtered = (db.memberLogins || []).filter(log => {
                          const matchesSearch = log.email?.toLowerCase().includes(activitySearch.trim().toLowerCase()) ||
                            log.details?.toLowerCase().includes(activitySearch.trim().toLowerCase());
                          const matchesFilter = activityFilter === 'all' || log.status === activityFilter;
                          return matchesSearch && matchesFilter;
                        });
                        
                        return filtered.map((log) => (
                          <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="block text-[8px] text-zinc-400 leading-none">ID: {log.id}</span>
                              <span className="block text-zinc-500 font-sans mt-1 text-[10px]">{log.timestamp}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-zinc-900 dark:text-white underline select-all">{log.email}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-sm text-[9px] font-extrabold uppercase ${
                                log.status === 'success'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 border border-emerald-250/20'
                                  : log.status === 'reset_request'
                                  ? 'bg-amber-100 dark:bg-amber-950/45 text-amber-750 dark:text-amber-450 border border-amber-250/20'
                                  : 'bg-rose-100 dark:bg-rose-950/45 text-rose-700 dark:text-rose-450 border border-rose-250/20'
                              }`}>
                                {log.status === 'success' ? '✔ SUCCESS' : log.status === 'reset_request' ? '⚡ RECOVERY' : '🚨 FAILED'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-sans leading-normal text-zinc-650 dark:text-zinc-400">
                              {log.details}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
                
                {(db.memberLogins || []).length === 0 && (
                  <div className="py-12 text-center text-zinc-450 italic font-sans">
                     কোনো নিরাপত্তা ইভেন্ট বা লগইন রেকর্ড পাওয়া যায়নি।
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'invitations' && isSuperAdmin && (
            <div className="space-y-6 font-sans">
              <div className="border-b border-zinc-150 dark:border-zinc-900 pb-3.5 mb-4">
                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-450 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-650" />
                  <span>এডমিন ও সুপার এডমিন নিমন্ত্রণ সেটিংস</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  নতুন সম্মানিত কমরেডদের ইমেইলে এডমিন প্যানেল নিমন্ত্রণ পাঠান। নিমন্ত্রণ গ্রহণ করার সাথে সাথে তারা উপযুক্ত ড্যাশবোর্ড পারমিশন ও কন্টেন্ট ম্যানেজমেন্টের ক্ষমতা লাভ করবেন।
                </p>
              </div>

              {/* Invitation Form Card */}
              <div className="bg-white dark:bg-zinc-950 p-5 rounded-lg border border-zinc-200 dark:border-zinc-900 max-w-xl shadow-xs">
                <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
                  নতুন নিমন্ত্রণ বার্তা পাঠান
                </h4>
                
                {inviteSuccess && (
                  <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-3 rounded text-xs font-bold border border-emerald-200/20">
                    {inviteSuccess}
                  </div>
                )}
                {inviteError && (
                  <div className="mb-4 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 p-3 rounded text-xs font-bold border border-rose-200/20">
                    {inviteError}
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!inviteEmail.trim()) return;
                    setInviteLoading(true);
                    setInviteSuccess('');
                    setInviteError('');
                    
                    try {
                      if (onAddInvitation) {
                        const success = await onAddInvitation(inviteEmail.trim(), inviteRole);
                        if (success) {
                          setInviteSuccess(`কমরেড ${inviteEmail.trim()}-কে সফলভাবে নিমন্ত্রণ পাঠানো হয়েছে!`);
                          setInviteEmail('');
                        } else {
                          setInviteError('দুঃখিত, নিমন্ত্রণ পাঠাতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
                        }
                      }
                    } catch (err) {
                      setInviteError(err instanceof Error ? err.message : 'ত্রুটি ঘটেছে');
                    } finally {
                      setInviteLoading(false);
                    }
                  }}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                      কমরেডের ইমেল ঠিকানা (Email Address) *
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="যেমনঃ comrade@email.com"
                      className="w-full px-3 py-2 bg-transparent border border-zinc-250 dark:border-zinc-800 text-zinc-900 dark:text-white rounded focus:ring-1 focus:ring-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                      প্রস্তাবিত দায়িত্ব / রোল (Role Type) *
                    </label>
                    <div className="grid grid-cols-2 gap-3 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setInviteRole('admin')}
                        className={`p-3 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                          inviteRole === 'admin'
                            ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/10'
                            : 'border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:bg-zinc-50'
                        }`}
                      >
                        <span className="font-bold text-zinc-900 dark:text-white font-sans">সমন্বয়ক এডমিন</span>
                        <span className="text-[10px] text-zinc-500 mt-1 leading-normal">কন্টেন্ট আপডেট, নোটিশ প্রকাশ ও সাধারণ সংশোধন করতে পারবেন।</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setInviteRole('super_admin')}
                        className={`p-3 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                          inviteRole === 'super_admin'
                            ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/10'
                            : 'border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:bg-zinc-50'
                        }`}
                      >
                        <span className="font-bold text-rose-700 dark:text-rose-455 font-sans">সুপার এডমিন</span>
                        <span className="text-[10px] text-zinc-500 mt-1 leading-normal font-sans">নতুন এডমিন নিয়োগ, ডাটাবেজ নিয়ন্ত্রণ সহ সকল ড্যাশবোর্ড ফিচারে পূর্ণ অ্যাক্সেস।</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold rounded shadow transition cursor-pointer font-sans"
                    >
                      {inviteLoading ? 'ইনভাইট পাঠানো হচ্ছে...' : 'ইনভাইটেশন লিংক ও পুশ নোটিফিকেশন পাঠান'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Status List */}
              <div className="border border-zinc-150 dark:border-zinc-900 rounded overflow-hidden select-text">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-150 dark:border-zinc-900 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                    সর্বমোট প্রেরিত নিমন্ত্রণ তালিকা
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-505 dark:text-zinc-400">
                    কাউন্টঃ {((db as any).invitations || []).length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-zinc-700 dark:text-zinc-300">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-805">
                      <tr>
                        <th className="px-4 py-3 font-bold font-sans">সময় ও প্রেরক</th>
                        <th className="px-4 py-3 font-bold font-sans">নিমন্ত্রিত ইমেইল</th>
                        <th className="px-4 py-3 font-bold font-sans">প্রস্তাবিত দায়িত্ব</th>
                        <th className="px-4 py-3 font-bold font-sans">অবস্থা (Status)</th>
                        <th className="px-4 py-3 font-bold font-sans text-right">পদক্ষেপ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-900 font-mono text-[11px]">
                      {(((db as any).invitations || []).map((invite: any) => (
                        <tr key={invite.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition">
                          <td className="px-4 py-3 whitespace-nowrap leading-tight">
                            <span className="block text-zinc-500 font-sans text-[10px]">{invite.timestamp}</span>
                            <span className="text-[9px] text-rose-650 font-sans mt-0.5 block">দ্বারাঃ {invite.invitedBy}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-zinc-900 dark:text-white select-all underline">{invite.email}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-xs text-[9px] font-extrabold uppercase ${
                              invite.role === 'super_admin'
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/20'
                                : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/20'
                            }`}>
                              {invite.role === 'super_admin' ? 'SUPER_ADMIN' : 'COORDINATOR_ADMIN'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-xs text-[9px] font-extrabold uppercase ${
                              invite.status === 'accepted'
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 border border-emerald-250/20'
                                : invite.status === 'declined'
                                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450 border border-rose-250/20'
                                : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-650 dark:text-zinc-400 border border-zinc-250/10 animate-pulse'
                            }`}>
                              {invite.status === 'accepted' ? '✔ ACCEPTED' : invite.status === 'declined' ? '🚨 DECLINED' : '⏳ PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {onDeleteInvitation && (
                              <button
                                onClick={async () => {
                                  if (confirm(`আপনি কি কমরেড ${invite.email}-এর নিমন্ত্রণটি বাতিল করতে নিশ্চিত?`)) {
                                    await onDeleteInvitation(invite.id);
                                  }
                                }}
                                className="px-2 py-1 bg-rose-600/10 hover:bg-rose-600 text-rose-600 hover:text-white rounded text-[10px] font-bold transition font-sans cursor-pointer"
                              >
                                মুছুন
                              </button>
                            )}
                          </td>
                        </tr>
                      )))}
                      {((db as any).invitations || []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-zinc-450 italic font-sans">
                            কোনো এডমিন নিমন্ত্রণ পাঠানো হয়নি।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Full-featured Create or Update Content Modal Sheet */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-900 border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-655 font-mono text-lg font-bold"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">
              {editingItem ? 'কন্টেন্ট সংশোধন করুনঃ' : 'নতুন কন্টেন্ট পোস্ট করুনঃ'}{' '}
              <span className="text-rose-600 capitalize">({activeModel})</span>
            </h3>

            {actionSuccess ? (
              <div className="bg-emerald-50 text-emerald-800 p-5 rounded text-xs text-center font-bold">
                অপারেশন সফল হয়েছে! ডাটাবেজ আপডেট সম্পন্ন।
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-semibold text-zinc-705 dark:text-zinc-300 mb-1">
                    কন্টেন্ট বা পোস্টের শিরোনাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                    placeholder="অনুগ্রহ করে শিরোনাম যুক্ত করুন"
                  />
                </div>

                {/* Categories selector dynamic keys */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-705 dark:text-zinc-300 mb-1">
                      ক্যাটাগরি বা প্রকার *
                    </label>
                    {activeModel === 'news' ? (
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                      >
                        <option value="political">রাজনৈতিক ধারা</option>
                        <option value="organizational">সাংগঠনিক খবর</option>
                        <option value="campus">ক্যাম্পাস নিউজ</option>
                        <option value="statement">বিবৃতি</option>
                        <option value="press-release">প্রেস রিলিজ</option>
                      </select>
                    ) : activeModel === 'circular' ? (
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                      >
                        <option value="official">অফিসিয়াল সার্কুলার</option>
                        <option value="notice">নোটিশ</option>
                        <option value="resolution">রেজোলিউশন</option>
                      </select>
                    ) : activeModel === 'gallery' ? (
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                      >
                        <option value="photo">ফটোগ্রাফ</option>
                        <option value="poster">পোস্টার</option>
                        <option value="infographic">ইনফোগ্রাফিক</option>
                      </select>
                    ) : activeModel === 'book' ? (
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                      >
                        <option value="book">বই ও পুস্তিকা</option>
                        <option value="magazine">ছাত্র বুলেটিন</option>
                        <option value="study-material">শিক্ষা মেটেরিয়াল</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                        placeholder="রাজনীতি / দর্শন কলাম ইত্যাদি"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-705 dark:text-zinc-300 mb-1">
                      লেখক বা তথ্য উপস্থাপক *
                    </label>
                    <input
                      type="text"
                      required
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                    />
                  </div>
                </div>

                {/* Excerpt descriptor or Date */}
                {activeModel === 'event' ? (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-750 dark:text-zinc-305 mb-1">
                      ইভেন্ট অনুষ্ঠিত করার তারিখ (Date) *
                    </label>
                    <input
                      type="date"
                      required
                      value={formExcerpt}
                      onChange={(e) => setFormExcerpt(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-305 rounded bg-transparent focus:outline-none text-zinc-900 dark:text-white"
                    />
                  </div>
                ) : (
                  (activeModel === 'news' || activeModel === 'blog') && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-705 dark:text-zinc-300 mb-1">
                        পোস্টটির সংক্ষিপ্ত অংশ (Excerpt) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formExcerpt}
                        onChange={(e) => setFormExcerpt(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                        placeholder="অল্প কথায় আকর্ষণীয় এক্সসার্পট দিন"
                      />
                    </div>
                  )
                )}

                {/* Specific features matching */}
                {activeModel === 'event' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                         সময়কাল (সময় সূচি) *
                      </label>
                      <input
                        type="text"
                        required
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-905 dark:text-white rounded focus:outline-none"
                        placeholder="বিকাল ০৩:৩০"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        অবস্থান (স্থান) *
                      </label>
                      <input
                        type="text"
                        required
                        value={eventVenue}
                        onChange={(e) => setEventVenue(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-905 dark:text-white rounded focus:outline-none"
                        placeholder="ময়মনসিংহ টাউন হল"
                      />
                    </div>
                  </div>
                )}

                {/* File Uploads & Direct Link inputs section based on context */}
                {activeModel === 'book' && (
                  <div className="space-y-4">
                    <FileUploader 
                      label="বই বা সাময়িকীর প্রচ্ছদ ছবি (Cover Image) *"
                      value={formImage}
                      onChange={setFormImage}
                      accept="image/*"
                      placeholder="সরাসরি প্রচ্ছদের ইমেজের লিঙ্ক (URL) দিন অথবা ফাইল আপলোড করুন"
                    />
                    <FileUploader 
                      label="বই বা সাময়িকীর পিডিএফ ফাইল (PDF File) *"
                      value={bookPdfUrl}
                      onChange={setBookPdfUrl}
                      accept="application/pdf"
                      placeholder="সরাসরি পিডিএফ ডাইরেক্ট লিঙ্ক (URL) দিন অথবা ফাইল আপলোড করুন"
                    />
                  </div>
                )}

                {activeModel === 'news' && (
                  <div className="space-y-4">
                    <FileUploader 
                      label="খবরের প্রধান ছবি / ব্যানার (Banner Image) *"
                      value={formImage}
                      onChange={setFormImage}
                      accept="image/*"
                      placeholder="সরাসরি ব্যানার ইমেজের লিঙ্ক (URL) দিন অথবা ফাইল আপলোড করুন"
                    />
                    <FileUploader 
                      label="সম্পূর্ণ সংবাদ পিডিএফ সংস্করণ (PDF Copy - ঐচ্ছিক)"
                      value={bookPdfUrl}
                      onChange={setBookPdfUrl}
                      accept="application/pdf"
                      placeholder="সরাসরি পিডিএফ ই-পেপার লিঙ্ক (URL) দিন অথবা ফাইল আপলোড করুন"
                    />
                  </div>
                )}

                {activeModel === 'circular' && (
                  <div className="space-y-4">
                    <FileUploader 
                      label="সার্কুলার বা নোটিশ পিডিএফ ফাইল (PDF File) *"
                      value={bookPdfUrl}
                      onChange={setBookPdfUrl}
                      accept="application/pdf"
                      placeholder="সরাসরি পিডিএফ লিঙ্ক (URL) দিন অথবা ফাইল আপলোড করুন"
                    />
                    <FileUploader 
                      label="সার্কুলার ব্যানার বা প্রচারপত্র ছবি (Image Option - ঐচ্ছিক)"
                      value={formImage}
                      onChange={setFormImage}
                      accept="image/*"
                      placeholder="সরাসরি ব্যানার ইমেজের লিঙ্ক (URL) দিন অথবা ফাইল আপলোড করুন"
                    />
                  </div>
                )}

                {activeModel === 'gallery' && (
                  <div className="space-y-4">
                    <FileUploader 
                      label={`গ্যালারি মিডিয়া ফাইল (${
                        formCategory === 'video' ? 'ভিডিও লিঙ্ক/ফাইল' :
                        formCategory === 'audio' ? 'অডিও/মিউজিক ফাইল' :
                        formCategory === 'gif' ? 'জিআইএফ ফাইল' : 'ইমেজ ফাইল'
                      }) *`}
                      value={formImage}
                      onChange={setFormImage}
                      accept={
                        formCategory === 'video' ? 'video/*' :
                        formCategory === 'audio' ? 'audio/*' :
                        formCategory === 'gif' ? 'image/gif' : 'image/*'
                      }
                      placeholder={
                        formCategory === 'video' ? 'ইউটিউব লিঙ্ক বা ডাইরেক্ট ভিডিও লিঙ্ক দিন অথবা ফাইল আপলোড করুন' :
                        formCategory === 'audio' ? 'অডিও ডাইরেক্ট লিঙ্ক দিন অথবা এমপিথি ফাইল আপলোড করুন' :
                        formCategory === 'gif' ? 'জিআইএফ ডাইরেক্ট লিঙ্ক দিন অথবা ফাইল আপলোড করুন' : 'ইমেজ লিঙ্ক দিন অথবা ছবি আপলোড করুন'
                      }
                    />
                  </div>
                )}

                {(activeModel === 'blog' || activeModel === 'event') && (
                  <FileUploader 
                    label="ফিচার ছবি / ব্যানার লিঙ্ক (URL) *"
                    value={formImage}
                    onChange={setFormImage}
                    accept="image/*"
                    placeholder="সরাসরি ইমেজের লিঙ্ক (URL) দিন অথবা ছবি আপলোড করুন"
                  />
                )}

                {/* Detailed descriptions */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-705 dark:text-zinc-300 mb-1">
                    বিস্তারিত কন্টেন্ট বা বিবরণী *
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-705 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none focus:border-rose-500 whitespace-pre-wrap"
                    placeholder="সম্পূর্ণ রাজনৈতিক বিবরণী ও দাবিসমূহ পরিষ্কারভাবে লিখুন..."
                  />
                </div>

                {/* News/Blog Tags */}
                {(activeModel === 'news' || activeModel === 'blog') && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-705 dark:text-zinc-300 mb-1">
                      ট্যাগসমূহ (কমা দিয়ে আলাদা করুন)
                    </label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white rounded focus:outline-none"
                      placeholder="সমাজতন্ত্র, ময়মনসিং আনন্দমোহন কেলজ"
                    />
                  </div>
                )}

                {/* Private / Members-only checkbox for books and circulars */}
                {(activeModel === 'book' || activeModel === 'circular') && (
                  <div className="bg-rose-50/20 dark:bg-zinc-950/40 p-4 border border-zinc-200 dark:border-zinc-805 rounded flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        শুধুমাত্র ভেরিফাইড সদস্যদের জন্য প্রবেশাধিকার সীমাবদ্ধ করুন
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        এটি চালু করলে শুধুমাত্র আমাদের নিবন্ধিত ও ভেরিফাইড সদস্যরা এই নির্দেশিকা/প্রকাশনা পড়তে বা ডাউনলোড করতে পারবেন।
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formIsPrivate}
                        onChange={(e) => setFormIsPrivate(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2.5px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded shadow transition disabled:opacity-50"
                >
                  {submitting ? 'সঞ্চয় হচ্ছে...' : 'কন্টেন্ট সংরক্ষণ করুন'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
