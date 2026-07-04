export interface News {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'political' | 'organizational' | 'campus' | 'statement' | 'press-release';
  author: string;
  date: string;
  image: string;
  tags: string[];
  status: 'published' | 'draft' | 'scheduled';
  isFeatured: boolean;
  views: number;
  pdfUrl?: string;
}

export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  authorEmail?: string;
  date: string;
  image: string;
  tags: string[];
  status: 'published' | 'pending' | 'draft' | 'rejected';
  readingTime: number;
  comments: Comment[];
  views: number;
}

export interface Comment {
  id: string;
  authorName: string;
  authorEmail: string;
  text: string;
  date: string;
  approved: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  image: string;
  status: 'upcoming' | 'past' | 'cancelled';
  registrants: EventRegistrant[];
}

export interface EventRegistrant {
  id: string;
  name: string;
  email: string;
  phone: string;
  institution: string;
  appliedAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  type: 'book' | 'magazine' | 'research' | 'study-material';
  pdfUrl: string;
  downloadCount: number;
  date: string;
  isPrivate?: boolean;
}

export interface Circular {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'official' | 'notice' | 'resolution';
  pdfUrl?: string;
  image?: string;
  isPrivate?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  url: string;
  type: 'photo' | 'poster' | 'infographic' | 'political-program' | 'video' | 'gif' | 'audio';
  date: string;
}

export interface EditHistoryEntry {
  timestamp: string;
  editedBy: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface MemberRegistration {
  id: string;
  name: string;
  mobile: string;
  email: string;
  password?: string;
  photoUrl?: string;
  institution: string;
  department: string;
  academicYear: string;
  address: string;
  dob: string;
  bloodGroup?: string;
  type: 'member' | 'volunteer';
  status: 'pending' | 'verified' | 'rejected';
  appliedAt: string;
  verifiedAt?: string;
  roleTag?: 'super_admin' | 'coordinator_admin' | 'member' | 'volunteer';
  badgeText?: string;
  editHistory?: EditHistoryEntry[];
  resetRequested?: boolean;
  resetApproved?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

export interface MemberLoginLog {
  id: string;
  email: string;
  timestamp: string;
  status: 'success' | 'failed' | 'reset_request';
  details: string;
}

export interface PageVisit {
  id: string;
  date: string;
  page: string;
  views: number;
  device: 'mobile' | 'desktop' | 'tablet';
}

export interface WebSettings {
  showHero: boolean;
  showBreakingNews: boolean;
  showLatestNews: boolean;
  showEvents: boolean;
  showCirculars: boolean;
  showPublications: boolean;
  showGallery: boolean;
  showMembership: boolean;
  showFooterSocials: boolean;
  siteMaintenance: boolean;
  aboutText: string;
  missionText: string;
  visionText: string;
  constitutionalHeader: string;
  slogans: string[];
  leadersDistrict: { name: string; role: string; inst: string; memberCode?: string; photoUrl?: string; }[];
  leadersExecutive: { name: string; role: string; inst: string; memberCode?: string; photoUrl?: string; }[];
  leadersUnits: { unitName: string; leaders: { name: string; role: string; memberCode?: string; photoUrl?: string; }[] }[];
  leadersFormer: { name: string; duration: string; contribution: string; memberCode?: string; photoUrl?: string; }[];
  oathTitle?: string;
  oathBody?: string;
  idSignerName?: string;
  idSignerRoleLine1?: string;
  idSignerRoleLine2?: string;
  idSignerSignatureUrl?: string;
}

export interface OrgWing {
  id: string;
  nameEnglish: string;
  nameBangla: string;
  logo: string;
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  status: 'pending' | 'accepted' | 'declined';
  invitedBy: string;
  timestamp: string;
}

export function getMemberBadgeText(member: MemberRegistration): string {
  if (member.badgeText && member.badgeText.trim() !== '') {
    return member.badgeText;
  }
  if (member.roleTag === 'super_admin') return 'সুপার এডমিন';
  if (member.roleTag === 'coordinator_admin') return 'সমন্বয়কারী এডমিন';
  if (member.roleTag === 'volunteer') return 'স্বেচ্ছাসেবী / শুভাকাঙ্ক্ষী';
  return 'প্রাথমিক সদস্য';
}
