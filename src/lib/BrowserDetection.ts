export interface BrowserProfile {
  browserName: string;
  browserVersion: string;
  isSupported: boolean;
  isEmbedded: boolean;
  isWebView: boolean;
  reasonIfBlocked: string | null;
}

export const BrowserDetection = {
  detect(): BrowserProfile {
    if (typeof window === 'undefined') {
      return {
        browserName: 'Server Side',
        browserVersion: '0.0',
        isSupported: false,
        isEmbedded: false,
        isWebView: false,
        reasonIfBlocked: 'Executing in a server-side environment.'
      };
    }

    const ua = navigator.userAgent || '';
    const vendor = navigator.vendor || '';

    // Platforms
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIOS || isAndroid || /Mobi/i.test(ua);

    // WebView and embedded browser detections
    const isFacebook = /FBAN|FBAV/i.test(ua);
    const isMessenger = /Messenger/i.test(ua);
    const isInstagram = /Instagram/i.test(ua);
    const isTwitter = /Twitter|TwitterAndroid|TwitterForiPhone/i.test(ua);
    const isLine = /Line/i.test(ua);
    const isWeChat = /MicroMessenger/i.test(ua);
    const isSnapchat = /Snapchat/i.test(ua);
    const isPinterest = /Pinterest/i.test(ua);
    const isLinkedin = /LinkedInApp/i.test(ua);
    const isGSA = /GSA/i.test(ua); // Google Search App
    const isVia = /Via/i.test(ua);
    const isXiaomi = /MiuiBrowser|XiaoMi/i.test(ua);
    const isSamsung = /SamsungBrowser/i.test(ua);

    // General WebView check
    let isWebView = false;
    if (isAndroid) {
      isWebView = /Version\/\d+\.\d+\s+Chrome\/\d+|wv/i.test(ua);
    } else if (isIOS) {
      // In iOS, UIWebView and WKWebView do not have 'Safari' in their user agent when embedded
      isWebView = !/Safari/i.test(ua) && /AppleWebKit/i.test(ua);
    }

    // In-app browsers are embedded web views
    const isEmbedded = isFacebook || isMessenger || isInstagram || isTwitter || isLine || isWeChat || isSnapchat || isPinterest || isLinkedin || isGSA || isVia || isXiaomi || isWebView;

    if (isEmbedded) {
      isWebView = true;
    }

    // Parse Name and Version
    let browserName = 'Unknown Browser';
    let browserVersion = '0.0';

    const getVersion = (regex: RegExp, userAgent: string): string => {
      const match = userAgent.match(regex);
      return match && match[1] ? match[1] : '0.0';
    };

    if (isVia) {
      browserName = 'Via Browser';
      browserVersion = getVersion(/Via\/([0-9._]+)/i, ua);
    } else if (isFacebook) {
      browserName = 'Facebook In-App';
      browserVersion = getVersion(/FBAV\/([0-9._]+)/i, ua);
    } else if (isInstagram) {
      browserName = 'Instagram In-App';
      browserVersion = getVersion(/Instagram\s+([0-9._]+)/i, ua);
    } else if (isMessenger) {
      browserName = 'Messenger In-App';
      browserVersion = getVersion(/FBAV\/([0-9._]+)/i, ua); // Messenger uses Facebook App Version (FBAV)
    } else if (isTwitter) {
      browserName = 'Twitter In-App';
      browserVersion = '0.0';
    } else if (isLine) {
      browserName = 'Line In-App';
      browserVersion = getVersion(/Line\/([0-9._]+)/i, ua);
    } else if (isWeChat) {
      browserName = 'WeChat In-App';
      browserVersion = getVersion(/MicroMessenger\/([0-9._]+)/i, ua);
    } else if (isSnapchat) {
      browserName = 'Snapchat In-App';
      browserVersion = '0.0';
    } else if (isPinterest) {
      browserName = 'Pinterest In-App';
      browserVersion = '0.0';
    } else if (isLinkedin) {
      browserName = 'LinkedIn In-App';
      browserVersion = '0.0';
    } else if (isGSA) {
      browserName = 'Google Search App';
      browserVersion = getVersion(/GSA\/([0-9._]+)/i, ua);
    } else if (isSamsung) {
      browserName = 'Samsung Internet';
      browserVersion = getVersion(/SamsungBrowser\/([0-9._]+)/i, ua);
    } else if (/Edg/i.test(ua) || /EdgiOS/i.test(ua)) {
      browserName = 'Microsoft Edge';
      browserVersion = getVersion(/(?:Edg|EdgiOS)\/([0-9._]+)/i, ua);
    } else if (/OPR/i.test(ua) || /Opera/i.test(ua)) {
      browserName = 'Opera';
      browserVersion = getVersion(/(?:OPR|Opera)\/([0-9._]+)/i, ua);
    } else if (/Firefox/i.test(ua) || /FxiOS/i.test(ua)) {
      browserName = 'Mozilla Firefox';
      browserVersion = getVersion(/(?:Firefox|FxiOS)\/([0-9._]+)/i, ua);
    } else if (/Chrome/i.test(ua) || /CriOS/i.test(ua)) {
      browserName = 'Google Chrome';
      browserVersion = getVersion(/(?:Chrome|CriOS)\/([0-9._]+)/i, ua);
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua) && !/CriOS/i.test(ua)) {
      browserName = 'Apple Safari';
      browserVersion = getVersion(/Version\/([0-9._]+)/i, ua);
    } else if (isWebView) {
      browserName = 'Embedded WebView';
      browserVersion = getVersion(/AppleWebKit\/([0-9._]+)/i, ua);
    }

    // Supported status
    // Google explicitly blocks OAuth requests from all embedded WebViews & In-App browsers (disallowed_useragent)
    let isSupported = true;
    let reasonIfBlocked: string | null = null;

    if (isEmbedded || isWebView) {
      isSupported = false;
      reasonIfBlocked = `গুগল সিকিউরিটি পলিসির কারণে ${browserName} (Embedded WebView) থেকে সরাসরি গুগল লগইন করা সম্ভব নয়।`;
    } else if (browserName === 'Unknown Browser') {
      // Unknown browsers might be blocked or fail Google OAuth policies
      isSupported = false;
      reasonIfBlocked = 'অপরিচিত ব্রাউজার হওয়ায় নিরাপত্তার স্বার্থে গুগল অথেনটিকেশন ব্লক করা হয়েছে।';
    }

    return {
      browserName,
      browserVersion,
      isSupported,
      isEmbedded,
      isWebView,
      reasonIfBlocked
    };
  }
};
