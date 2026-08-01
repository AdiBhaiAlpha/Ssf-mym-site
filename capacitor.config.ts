import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'bd.pro.ssfmym',
  appName: 'সমাজতান্ত্রিক ছাত্র ফ্রন্ট',
  webDir: 'dist',
  server: {
    url: 'https://ssfmym.pro.bd',
    allowNavigation: [
      'ssfmym.pro.bd'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#18181b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '953122849300-88n085h13a52862d53g58f.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: true
  }
};

export default config;
