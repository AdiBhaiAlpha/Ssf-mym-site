import { 
  User, 
  AuthProvider,
  Auth,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { secondaryAuth, saveFirestoreDoc } from '../firebase';
import { BrowserDetection, BrowserProfile } from './BrowserDetection';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Register local plugin
const NativeGoogleAuth = registerPlugin('NativeGoogleAuth');

// ==========================================
// ENVIRONMENT DETECTION TYPE & FUNCTION
// ==========================================
export interface EnvironmentInfo {
  userAgent: string;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browserName: string;
  isWebView: boolean;
  isInAppBrowser: boolean;
  supportsPopups: boolean;
}

export function detectEnvironment(): EnvironmentInfo {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      browserName: 'Server Side',
      isWebView: false,
      isInAppBrowser: false,
      supportsPopups: false
    };
  }

  const profile = BrowserDetection.detect();
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi/i.test(ua);

  return {
    userAgent: ua,
    isMobile,
    isIOS,
    isAndroid,
    browserName: profile.browserName,
    isWebView: profile.isWebView,
    isInAppBrowser: profile.isEmbedded,
    supportsPopups: profile.isSupported && !isMobile
  };
}

// ==========================================
// USER VALIDATION PIPELINE
// ==========================================
export interface ValidationReport {
  isValid: boolean;
  reason?: string;
  uid?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  idToken?: string;
  expirationTime?: string;
}

export async function validateFirebaseUser(user: User | null): Promise<ValidationReport> {
  if (!user) {
    return { isValid: false, reason: 'No active authenticated user found.' };
  }
  
  // 1. Check if email is verified
  if (!user.emailVerified) {
    return { isValid: false, reason: 'Google email address is not verified.' };
  }
  
  // 2. Check if provider is indeed google.com
  const isGoogleProvider = user.providerData.some(p => p.providerId === 'google.com');
  if (!isGoogleProvider) {
    return { isValid: false, reason: 'Authentication provider is not Google.' };
  }
  
  // 3. Check UID existence
  if (!user.uid) {
    return { isValid: false, reason: 'User unique ID (UID) is missing or corrupted.' };
  }
  
  try {
    // 4. Retrieve ID token and verify token expiration
    const tokenResult = await user.getIdTokenResult(true); // force refresh to verify token validity
    const expiration = new Date(tokenResult.expirationTime);
    if (expiration.getTime() <= Date.now()) {
      return { isValid: false, reason: 'Firebase ID Token is expired.' };
    }
    
    return {
      isValid: true,
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      idToken: tokenResult.token,
      expirationTime: tokenResult.expirationTime
    };
  } catch (error: any) {
    return { isValid: false, reason: 'Failed to retrieve or verify ID token: ' + error.message };
  }
}

// ==========================================
// REAL-TIME DIAGNOSTICS STORE
// ==========================================
export interface AuthDiagnosticsData {
  chosenMethod: 'Native' | 'Popup' | 'Redirect' | 'None';
  envBrowser: string;
  envOS: string;
  envIsWebView: boolean;
  envSupportsPopups: boolean;
  firebaseAppName: string;
  redirectStarted: boolean;
  redirectReturned: boolean;
  redirectResult: 'success' | 'error' | 'none';
  userRetrieved: string | null;
  tokenVerified: boolean;
  tokenExpiration: string | null;
  dbLookupStatus: 'found' | 'not_found' | 'none';
  sessionCreated: boolean;
  errorMessage: string | null;
  technicalError: string | null;
  suggestedFix: string | null;
}

const STORAGE_KEY = 'ssf_auth_diagnostics';

const defaultDiagnostics: AuthDiagnosticsData = {
  chosenMethod: 'None',
  envBrowser: 'Unknown',
  envOS: 'Unknown',
  envIsWebView: false,
  envSupportsPopups: false,
  firebaseAppName: 'secondary',
  redirectStarted: false,
  redirectReturned: false,
  redirectResult: 'none',
  userRetrieved: null,
  tokenVerified: false,
  tokenExpiration: null,
  dbLookupStatus: 'none',
  sessionCreated: false,
  errorMessage: null,
  technicalError: null,
  suggestedFix: null
};

class AuthDiagnosticsStore {
  private state: AuthDiagnosticsData;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = { ...defaultDiagnostics };
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...defaultDiagnostics, ...parsed };
      } else {
        const env = detectEnvironment();
        this.state.envBrowser = env.browserName;
        this.state.envOS = env.isIOS ? 'iOS' : env.isAndroid ? 'Android' : 'Desktop/Other';
        this.state.envIsWebView = env.isWebView;
        this.state.envSupportsPopups = env.supportsPopups;
        this.save();
      }
    } catch (e) {
      console.error('Error loading auth diagnostics:', e);
    }
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error saving auth diagnostics:', e);
    }
    this.notify();
  }

  public notify() {
    this.listeners.forEach(l => l());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): AuthDiagnosticsData {
    return { ...this.state };
  }

  public update(updater: Partial<AuthDiagnosticsData>) {
    this.state = { ...this.state, ...updater };
    this.save();
  }

  public reset() {
    const env = detectEnvironment();
    this.state = {
      ...defaultDiagnostics,
      envBrowser: env.browserName,
      envOS: env.isIOS ? 'iOS' : env.isAndroid ? 'Android' : 'Desktop/Other',
      envIsWebView: env.isWebView,
      envSupportsPopups: env.supportsPopups
    };
    this.save();
  }
}

export const authDiagnostics = new AuthDiagnosticsStore();

// ==========================================
// HYBRID AUTHENTICATION INITIATOR
// ==========================================
export interface AuthInitiationOptions {
  actionType: 'nav_login' | 'nav_register_verify' | 'portal_login' | 'member_form_autofill' | 'member_form_verify';
  pendingInputs?: any;
}

let isGoogleAuthActive = false;

export async function initiateGoogleSignIn(options: AuthInitiationOptions): Promise<void> {
  if (isGoogleAuthActive) {
    console.warn('Google Auth is already in progress. Ignoring duplicate trigger.');
    return;
  }
  isGoogleAuthActive = true;

  try {
    authDiagnostics.reset();

    if (typeof window !== 'undefined') {
      localStorage.setItem('scf_auth_scroll_pos', window.scrollY.toString());
      
      if (options.pendingInputs) {
        if (options.actionType === 'nav_register_verify') {
          localStorage.setItem('scf_pending_nav_reg_inputs', JSON.stringify(options.pendingInputs));
          localStorage.setItem('scf_pending_nav_verification', 'true');
        } else if (options.actionType === 'member_form_verify') {
          localStorage.setItem('scf_pending_form_reg_inputs', JSON.stringify(options.pendingInputs));
        }
      }
    }

    if (Capacitor.isNativePlatform()) {
      authDiagnostics.update({
        chosenMethod: 'Native',
        redirectStarted: false
      });

      try {
        // Native Android Google Sign-In with Google Play Services / Credential Manager
        const googleUser: any = await NativeGoogleAuth.signIn({
          clientId: '953122849300-88n085h13a52862d53g58f.apps.googleusercontent.com'
        });

        const idToken = googleUser?.idToken;

        if (!idToken) {
          throw new Error('গুগল অ্যাকাউন্ট থেকে আইডেন্টিটি টোকেন (ID Token) উদ্ধার করা সম্ভব হয়নি।');
        }

        // Exchange ID token for Firebase auth credential
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(secondaryAuth, credential);
        const firebaseUser = userCredential.user;

        if (!firebaseUser || !firebaseUser.email) {
          throw new Error('ফায়ারবেস অথেন্টিকেশন সম্পন্ন করা যায়নি।');
        }

        const emailVal = firebaseUser.email.toLowerCase().trim();

        authDiagnostics.update({
          userRetrieved: emailVal,
          tokenVerified: true,
          sessionCreated: true
        });

        if (typeof window !== 'undefined') {
          const event = new CustomEvent('native-google-auth-success', { 
            detail: { 
              user: firebaseUser, 
              email: emailVal,
              actionType: options.actionType,
              displayName: firebaseUser.displayName || googleUser?.displayName || '',
              photoURL: firebaseUser.photoURL || googleUser?.profilePictureUri || ''
            } 
          });
          window.dispatchEvent(event);
        }
        return;
      } catch (err: any) {
        console.error('Native Google Sign-In failed:', err);
        const errStr = String(err?.message || err).toLowerCase();
        
        const isCancelled = errStr.includes('cancel') || errStr.includes('closed') || errStr.includes('12501') || errStr.includes('popup_closed_by_user') || errStr.includes('cancelled-popup-request') || errStr.includes('credential_cancelled');
        if (isCancelled) {
          throw new Error('গুগল সাইন-ইন প্রক্রিয়াটি বাতিল করা হয়েছে।');
        }

        const isPlayServicesIssue = errStr.includes('service_missing') || errStr.includes('service_disabled') || errStr.includes('google play services');
        
        const userFriendlyMessage = isPlayServicesIssue
          ? 'আপনার ডিভাইসে Google Play Services অনুপস্থিত বা সক্রিয় নয়। দয়া করে ডিভাইসের Google Play Services আপডেট অথবা সক্রিয় করে পুনরায় চেষ্টা করুন।'
          : (err?.message || 'নেটিভ গুগল সাইন-ইন সম্পন্ন করা যায়নি।');

        authDiagnostics.update({
          errorMessage: userFriendlyMessage,
          technicalError: err?.message || String(err),
          suggestedFix: 'Google Cloud Console-এ Package Name (bd.pro.ssfmym), SHA-1 Fingerprint এবং OAuth Client ID সঠিকভাবে কনফিগার করা আছে কিনা চেক করুন।'
        });

        throw new Error(userFriendlyMessage);
      }
    } else {
        throw new Error('Google Sign-In is only supported natively via Android Credential Manager in this application version.');
    }
  } finally {
    isGoogleAuthActive = false;
  }
}

// Helper to log logins to the database directly
export async function logMemberLoginDirect(email: string, status: string, details: string) {
  const logId = 'mlog_' + Date.now();
  const logData = {
    id: logId,
    email: email.toLowerCase().trim(),
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status,
    details,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
    ip: 'client-direct'
  };
  try {
    await saveFirestoreDoc('memberLogins', logId, logData);
  } catch (e) {
    console.error('Failed to save login log:', e);
  }
}
