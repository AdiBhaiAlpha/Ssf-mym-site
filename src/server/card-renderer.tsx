import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App for Server-Side Storage Uploads
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(firebaseApp);

// 1. Utility: Fetch & Cache Custom Font Files for Satori
async function getFontData(): Promise<{ regular: Buffer; bold: Buffer }> {
  const fontDir = path.join(process.cwd(), 'public', 'fonts');
  if (!fs.existsSync(fontDir)) {
    fs.mkdirSync(fontDir, { recursive: true });
  }

  const regularPath = path.join(fontDir, 'NotoSansBengali-Regular.ttf');
  const boldPath = path.join(fontDir, 'NotoSansBengali-Bold.ttf');

  // If fonts don't exist, download from the verified raw google/fonts repository
  if (!fs.existsSync(regularPath)) {
    console.log('Downloading NotoSansBengali-Regular.ttf...');
    const res = await fetch('https://github.com/google/fonts/raw/main/ofl/notosansbengali/NotoSansBengali-Regular.ttf');
    if (!res.ok) throw new Error(`Failed to download Regular font: ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(regularPath, buf);
  }

  if (!fs.existsSync(boldPath)) {
    console.log('Downloading NotoSansBengali-Bold.ttf...');
    const res = await fetch('https://github.com/google/fonts/raw/main/ofl/notosansbengali/NotoSansBengali-Bold.ttf');
    if (!res.ok) throw new Error(`Failed to download Bold font: ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(boldPath, buf);
  }

  return {
    regular: fs.readFileSync(regularPath),
    bold: fs.readFileSync(boldPath),
  };
}

// 2. Utility: Convert external images to safe base64 Data URLs to bypass CORS and load reliably in Satori
async function fetchImageAsBase64(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  // Resolve local public URLs to full filesystem paths if they start with "/"
  if (url.startsWith('/')) {
    const localPath = path.join(process.cwd(), 'public', url);
    if (fs.existsSync(localPath)) {
      const ext = path.extname(url).replace('.', '') || 'png';
      const buf = fs.readFileSync(localPath);
      return `data:image/${ext};base64,${buf.toString('base64')}`;
    }
    // Fallback if public local file missing
    return '';
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const contentType = res.headers.get('content-type') || 'image/png';
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error(`Error loading image URL for Satori [${url}]:`, err);
    // If external fetch fails, return empty to prevent render crash
    return '';
  }
}

// 3. Aspect Ratio Multipliers
const getRatioValue = (aspectRatio: string, customRatio: number) => {
  switch (aspectRatio) {
    case '4:5': return 0.8;
    case '9:16': return 0.5625;
    case '16:9': return 1.777;
    case '1200x630': return 1.9047;
    case '1920x1080': return 1.777;
    case '1600x900': return 1.777;
    case 'A4 Portrait': return 0.7071;
    case 'A4 Landscape': return 1.4142;
    case 'Custom': return customRatio || 1.0;
    case '1:1':
    default: return 1.0;
  }
};

// 4. Server-Side Card Renderer Controller
export async function renderPhotoCardServerSide(payload: {
  item: any;
  settings: {
    selectedTemplate: number;
    accentColor: string;
    bgStyle: string;
    bgTheme: 'light' | 'dark' | 'cream';
    fontSize: 'sm' | 'md' | 'lg' | 'xl';
    imagePosition: string;
    fontFamily: 'sans' | 'serif' | 'mono';
    textAlignment: 'left' | 'center' | 'right' | 'justified';
    borderStyle: string;
    customTitle: string;
    customSummary: string;
    customCategory: string;
    customLocation: string;
    customAuthor: string;
    customDate: string;
    customSlogan?: string;
    showLogo: boolean;
    showQR: boolean;
    showDate: boolean;
    showAuthor: boolean;
    showLocation: boolean;
    showCategory: boolean;
    showFooter: boolean;
    showReadingTime?: boolean;
    aspectRatio: string;
    customRatio?: number;
    exportFormat: 'png' | 'jpeg' | 'webp' | 'pdf';
    exportQuality: 'normal' | 'retina' | '4k';
    showWeb?: boolean;
    showFB?: boolean;
  };
  requestHost: string;
}) {
  const startTime = Date.now();
  const { item, settings, requestHost } = payload;

  const {
    selectedTemplate,
    accentColor = '#B3002D',
    bgStyle = 'solid',
    bgTheme = 'light',
    fontSize = 'md',
    imagePosition = 'top',
    textAlignment = 'left',
    borderStyle = 'none',
    customTitle = '',
    customSummary = '',
    customCategory = '',
    customLocation = '',
    customAuthor = '',
    customDate = '',
    customSlogan = '',
    showLogo = true,
    showQR = true,
    showDate = true,
    showAuthor = true,
    showLocation = true,
    showCategory = true,
    showFooter = true,
    showReadingTime = true,
    aspectRatio = '1:1',
    customRatio = 1.0,
    exportFormat = 'png',
    exportQuality = 'retina',
    showWeb = true,
    showFB = true,
  } = settings;

  // Compute scale and physical dimension bounds
  const ratio = getRatioValue(aspectRatio, customRatio);
  const baseWidth = 800;
  const baseHeight = Math.round(baseWidth / ratio);

  let scale = 1.5;
  if (exportQuality === 'retina') scale = 2.5;
  if (exportQuality === '4k') scale = 4;

  const targetWidth = Math.round(baseWidth * scale);
  const targetHeight = Math.round(baseHeight * scale);

  console.log(`Server render dimensions: Satori base size ${baseWidth}x${baseHeight} px, output size ${targetWidth}x${targetHeight} px.`);

  // Load Noto Sans Bengali font buffers
  const fonts = await getFontData();

  // Generate QR Code URL & Base64 Data URL
  let qrCodeDataUrl = '';
  if (showQR) {
    const cleanId = item.id || 'article';
    const cleanType = item.type || 'news';
    const canonicalUrl = `${requestHost.includes('http') ? '' : 'https://'}${requestHost}/?tab=${
      cleanType === 'blog' || cleanType === 'news' ? 'news' :
      cleanType === 'publication' ? 'books' :
      cleanType === 'circular' ? 'circulars' :
      cleanType === 'event' ? 'events' :
      cleanType === 'media' ? 'media' : 'home'
    }&${
      cleanType === 'publication' ? 'bookId' :
      cleanType === 'circular' ? 'circularId' :
      cleanType + 'Id'
    }=${cleanId}`;

    qrCodeDataUrl = await QRCode.toDataURL(canonicalUrl, {
      margin: 1,
      width: 150,
      color: {
        dark: bgTheme === 'dark' ? '#ffffff' : '#000000',
        light: bgTheme === 'dark' ? '#0b0f19' : '#ffffff',
      }
    });
  }

  // Pre-fetch primary logo & cover images to base64 to ensure instant rendering with zero network lookup issues inside Satori
  const defaultLogoUrl = 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png';
  const logoDataUri = await fetchImageAsBase64(defaultLogoUrl);
  const imageDataUri = (item.image && imagePosition !== 'hidden') ? await fetchImageAsBase64(item.image) : '';

  // Calculate Reading Time string
  const getReadingTimeStr = () => {
    const rawText = item.content || customTitle + customSummary;
    const wordCount = rawText.split(/\s+/).length;
    return `পড়ার সময়: ~${Math.max(1, Math.ceil(wordCount / 180))} মিনিট`;
  };

  // Helper limits words
  const getClampedSummaryStr = () => {
    const limit = 55;
    const words = customSummary.split(/\s+/);
    if (words.length <= limit) return customSummary;
    return words.slice(0, limit).join(' ') + '...';
  };

  // Helper font size scaling
  const titleSizeNum = fontSize === 'sm' ? 24 : fontSize === 'lg' ? 38 : fontSize === 'xl' ? 44 : 32;
  const summarySizeNum = fontSize === 'sm' ? 14 : fontSize === 'lg' ? 20 : fontSize === 'xl' ? 24 : 17;

  // Setup styles based on themes (No oklch or oklab used here at all! Safe, native Hex/RGB colors)
  const isDark = bgTheme === 'dark';
  const isCream = bgTheme === 'cream';

  const defaultBgColor = isDark ? '#090d16' : isCream ? '#faf6ee' : '#ffffff';
  const textMainColor = isDark ? '#ffffff' : isCream ? '#271206' : '#111827';
  const textMutedColor = isDark ? '#a1a1aa' : isCream ? '#78350f' : '#6b7280';
  const borderHexColor = isDark ? '#1e293b' : isCream ? '#ebe3d5' : '#e5e7eb';

  // Satori React elements definition
  let element: React.ReactNode;

  // Decide visual Tag archetype mapping
  const activePreset = selectedTemplate;
  let tag = 'MINIMAL';
  if (selectedTemplate === 1) tag = 'BREAKING';
  else if (selectedTemplate === 2) tag = 'MAGAZINE';
  else if ([4, 5, 6, 8, 14, 15, 16].includes(selectedTemplate)) tag = 'CINEMATIC';
  else if ([3, 7, 11, 12, 17, 18, 19, 21].includes(selectedTemplate)) tag = 'EDITORIAL';
  else if ([9, 10, 13, 20].includes(selectedTemplate)) tag = 'OFFICIAL';

  // Render Layout Tree
  if (tag === 'BREAKING') {
    // 1. BREAKING NEWS BROADCAST STYLE
    element = (
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          backgroundColor: '#090d16',
          backgroundImage: 'linear-gradient(rgba(179,0,45,0.12) 4px, transparent 4px)',
          backgroundSize: `100% 16px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px',
          boxSizing: 'border-box',
          fontFamily: 'Noto Sans Bengali',
          position: 'relative',
        }}
      >
        {/* Header Block */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ backgroundColor: '#e11d48', color: '#ffffff', fontWeight: 'bold', borderRadius: '3px', padding: '4px 12px', fontSize: '18px', marginRight: '10px' }}>
              সরাসরি
            </span>
            <span style={{ color: '#ffffff', fontWeight: 'black', fontSize: '20px', letterSpacing: '1px' }}>
              ব্রেকিং নিউজ
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {showLogo && logoDataUri && (
              <img src={logoDataUri} style={{ height: '36px', width: '36px', marginRight: '8px', objectFit: 'contain' }} alt="logo" />
            )}
            <span style={{ color: '#e11d48', fontWeight: 'bold', fontSize: '16px' }}>SSF NEWS</span>
          </div>
        </div>

        {/* Visual Screen Cover section */}
        {imageDataUri ? (
          <div style={{ width: '100%', display: 'flex', height: `${baseHeight - 270}px`, position: 'relative', overflow: 'hidden', borderTop: '3px solid #e11d48', borderBottom: '3px solid #e11d48', marginTop: '16px', marginBottom: '16px' }}>
            <img src={imageDataUri} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="main" />
            <div style={{ position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.75)', color: '#fbbf24', fontWeight: 'bold', padding: '4px 12px', fontSize: '14px' }}>
              LIVE COVERAGE • ময়মনসিংহে ছাত্র ফ্রন্ট
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: `${baseHeight - 270}px`, backgroundColor: '#111520', borderTop: '3px solid #e11d48', borderBottom: '3px solid #e11d48', marginTop: '16px', marginBottom: '16px' }}>
            <span style={{ color: '#e11d48', fontWeight: 'black', fontSize: '38px' }}>🔴 SSF LIVE</span>
          </div>
        )}

        {/* Big Headline bar */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '8px' }}>
          {customCategory && (
            <div style={{ backgroundColor: '#fbbf24', color: '#000000', fontWeight: 'black', padding: '3px 10px', fontSize: '14px', borderRadius: '3px', alignSelf: 'flex-start', marginBottom: '6px' }}>
              {customCategory}
            </div>
          )}
          <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.92)', borderLeft: '6px solid #e11d48', padding: '12px 16px', width: '100%', boxSizing: 'border-box' }}>
            <span style={{ fontWeight: 'bold', color: '#ffffff', fontSize: `${titleSizeNum}px`, lineHeight: 1.25 }}>
              {customTitle}
            </span>
          </div>
        </div>

        {/* Footer info bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#B3002D', padding: '8px 16px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#ffffff', fontSize: '14px' }}>
            {showLocation && customLocation && (
              <span style={{ backgroundColor: '#000000', padding: '2px 8px', borderRadius: '2px', marginRight: '8px', fontWeight: 'bold' }}>{customLocation}</span>
            )}
            {showAuthor && customAuthor && (
              <span style={{ marginRight: '12px' }}>প্রতিবেদক: {customAuthor}</span>
            )}
            {showDate && customDate && (
              <span style={{ opacity: 0.9 }}>{customDate}</span>
            )}
          </div>
          {showQR && qrCodeDataUrl && (
            <img src={qrCodeDataUrl} style={{ height: '40px', width: '40px', backgroundColor: '#ffffff', padding: '2px', borderRadius: '2px' }} alt="qr" />
          )}
        </div>
      </div>
    );
  } else if (tag === 'MAGAZINE') {
    // 2. PREMIUM MAGAZINE COVER STYLE
    element = (
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          backgroundColor: defaultBgColor,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px',
          boxSizing: 'border-box',
          fontFamily: 'Noto Sans Bengali',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Full Bleed Image Background if available */}
        {imageDataUri && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
            <img src={imageDataUri} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="bg" />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.95) 100%)' }} />
          </div>
        )}

        {/* Double Border Frame around bounds */}
        <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', border: `3px solid ${accentColor}`, opacity: 0.85, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', bottom: '20px', border: `1px solid ${accentColor}`, opacity: 0.5, pointerEvents: 'none' }} />

        {/* Brand Header area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {showLogo && logoDataUri && (
              <img src={logoDataUri} style={{ height: '44px', width: '44px', marginRight: '10px' }} alt="logo" />
            )}
            <span style={{ color: '#fbbf24', fontWeight: 'black', fontSize: '24px', letterSpacing: '2px' }}>
              সমাজতান্ত্রিক ছাত্র ফ্রন্ট
            </span>
          </div>
          <div style={{ width: '250px', height: '1px', backgroundColor: 'rgba(251, 191, 36, 0.4)', margin: '8px 0' }} />
          <span style={{ color: '#ffffff', opacity: 0.8, fontSize: '12px', letterSpacing: '1px' }}>
            {customSlogan || 'বিশেষ সংখ্যা • ময়মনসিংহ জেলা শাখা'}
          </span>
        </div>

        {/* Central Quote / Info block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 24px', position: 'relative', zIndex: 10, margin: 'auto 0' }}>
          {customCategory && (
            <span style={{ backgroundColor: '#fbbf24', color: '#B3002D', fontWeight: 'bold', padding: '4px 12px', fontSize: '14px', borderRadius: '4px', marginBottom: '14px' }}>
              {customCategory}
            </span>
          )}

          <span style={{ color: '#ffffff', fontWeight: 'black', fontSize: `${titleSizeNum * 1.1}px`, lineHeight: 1.2, marginBottom: '12px' }}>
            {customTitle}
          </span>

          {customSummary && (
            <span style={{ color: '#e4e4e7', fontSize: `${summarySizeNum}px`, lineHeight: 1.5, maxWidth: '500px' }}>
              {getClampedSummaryStr()}
            </span>
          )}
        </div>

        {/* Magazine Footer bar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', color: '#d4d4d8', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              {showLocation && <span style={{ color: '#fbbf24', fontWeight: 'bold', marginRight: '6px' }}>{customLocation}</span>}
              {showLocation && showAuthor && <span style={{ marginRight: '6px' }}>•</span>}
              {showAuthor && <span>প্রতিবেদক: {customAuthor}</span>}
            </div>
            <span style={{ opacity: 0.7, fontSize: '11px' }}>{showWeb ? `http://ssfmym.pro.bd/ / ${customDate || 'JULY 2026'}` : (customDate || 'JULY 2026')}</span>
          </div>

          {showQR && qrCodeDataUrl && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', marginRight: '8px', textAlign: 'right' }}>
                <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '10px' }}>SCAN TO READ</span>
                <span style={{ color: '#ffffff', opacity: 0.5, fontSize: '8px' }}>OFFICIAL LINK</span>
              </div>
              <img src={qrCodeDataUrl} style={{ height: '48px', width: '48px', backgroundColor: '#ffffff', padding: '2px', border: `1px solid ${accentColor}`, borderRadius: '2px' }} alt="qr" />
            </div>
          )}
        </div>
      </div>
    );
  } else if (tag === 'CINEMATIC') {
    // 3. CINEMATIC BACKGROUND MEDIA POSTS
    element = (
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          backgroundColor: defaultBgColor,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '36px',
          boxSizing: 'border-box',
          fontFamily: 'Noto Sans Bengali',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Full Bleed background Cover Layer with dark vignette shading */}
        {imageDataUri && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
            <img src={imageDataUri} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="cover" />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: isDark
                  ? 'linear-gradient(to bottom, rgba(9,13,22,0.15) 0%, rgba(9,13,22,0.85) 55%, rgba(9,13,22,1) 100%)'
                  : 'linear-gradient(to bottom, rgba(250,246,238,0.15) 0%, rgba(250,246,238,0.85) 55%, rgba(250,246,238,1) 100%)'
              }}
            />
          </div>
        )}

        {/* Glow / Border styles */}
        {borderStyle === 'neon-glow' && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: `2px solid ${accentColor}`, borderRadius: '6px', opacity: 0.7 }} />
        )}
        {borderStyle === 'thin-red' && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', right: '8px', bottom: '8px', border: `1px solid ${accentColor}` }} />
        )}

        {/* Upper Header strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {showLogo && logoDataUri && (
              <img src={logoDataUri} style={{ height: '32px', width: '32px', marginRight: '10px' }} alt="logo" />
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#ffffff', fontWeight: 'black', fontSize: '14px', lineHeight: 1.1 }}>
                সমাজতান্ত্রিক ছাত্র ফ্রন্ট
              </span>
              <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '9px', marginTop: '2px' }}>
                ময়মনসিংহ জেলা শাখা
              </span>
            </div>
          </div>
          {showCategory && customCategory && (
            <span style={{ backgroundColor: '#B3002D', color: '#ffffff', fontWeight: 'bold', borderRadius: '3px', padding: '3px 8px', fontSize: '11px', letterSpacing: '1px' }}>
              {customCategory}
            </span>
          )}
        </div>

        {/* Dynamic slogan bar if provided */}
        {customSlogan && (
          <div style={{ backgroundColor: accentColor, color: '#ffffff', fontWeight: 'bold', borderRadius: '20px', padding: '4px 16px', fontSize: '13px', alignSelf: 'center', marginTop: '10px', position: 'relative', zIndex: 10 }}>
            {customSlogan}
          </div>
        )}

        {/* Content floating in lower third section */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10, marginTop: 'auto', paddingTop: '16px' }}>
          <span style={{ color: textMainColor, fontWeight: 'black', fontSize: `${titleSizeNum}px`, lineHeight: 1.2, marginBottom: '8px' }}>
            {customTitle}
          </span>

          {/* Metadata tags */}
          {(showLocation || showAuthor || showDate || showReadingTime) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', color: textMutedColor, fontWeight: 'bold', fontSize: '12px', marginBottom: '10px' }}>
              {showLocation && customLocation && (
                <>
                  <span style={{ color: '#e11d48', marginRight: '6px' }}>{customLocation}</span>
                  <span style={{ marginRight: '6px' }}>•</span>
                </>
              )}
              {showAuthor && customAuthor && (
                <>
                  <span style={{ marginRight: '6px' }}>{customAuthor}</span>
                  <span style={{ marginRight: '6px' }}>•</span>
                </>
              )}
              {showDate && customDate && (
                <>
                  <span style={{ marginRight: '6px' }}>{customDate}</span>
                  <span style={{ marginRight: '6px' }}>•</span>
                </>
              )}
              {showReadingTime && (
                <span style={{ opacity: 0.85 }}>{getReadingTimeStr()}</span>
              )}
            </div>
          )}

          {/* Visual Divider block */}
          <div style={{ width: '48px', height: '4px', backgroundColor: '#e11d48', borderRadius: '2px', marginBottom: '12px' }} />

          {customSummary && (
            <span style={{ color: textMainColor, fontSize: `${summarySizeNum}px`, lineHeight: 1.5, textAlign: textAlignment }}>
              {getClampedSummaryStr()}
            </span>
          )}
        </div>

        {/* Bottom footer elements */}
        {showFooter && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${accentColor}25`, paddingTop: '12px', marginTop: '16px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '12px' }}>
                সমাজতান্ত্রিক ছাত্র ফ্রন্ট
              </span>
              {showWeb && (
                <span style={{ color: '#a1a1aa', fontSize: '9px', marginTop: '2px' }}>
                  http://ssfmym.pro.bd/post/{item.id?.slice(0, 8) || 'article'}
                </span>
              )}
            </div>
            {showQR && qrCodeDataUrl && (
              <img src={qrCodeDataUrl} style={{ height: '44px', width: '44px', backgroundColor: '#ffffff', padding: '2px', borderRadius: '3px' }} alt="qr" />
            )}
          </div>
        )}
      </div>
    );
  } else if (tag === 'EDITORIAL') {
    // 4. ASYMMETRIC EDITORIAL SPREAD LAYOUT
    const isImageLeft = imagePosition === 'left' || imagePosition === 'top';
    element = (
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          backgroundColor: defaultBgColor,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '32px',
          boxSizing: 'border-box',
          fontFamily: 'Noto Sans Bengali',
          position: 'relative',
        }}
      >
        {/* Editorial Grid crosshair overlays */}
        <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(120,120,120,0.15)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33%', width: '1px', backgroundColor: 'rgba(120,120,120,0.15)', pointerEvents: 'none' }} />

        {/* Top Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${accentColor}30`, paddingBottom: '10px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {showLogo && logoDataUri && (
              <img src={logoDataUri} style={{ height: '32px', width: '32px', marginRight: '8px' }} alt="logo" />
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#B3002D', fontWeight: 'black', fontSize: '16px', lineHeight: 1.1 }}>
                সমাজতান্ত্রিক ছাত্র ফ্রন্ট
              </span>
              <span style={{ color: textMutedColor, fontWeight: 'bold', fontSize: '9px', marginTop: '2px', letterSpacing: '1px' }}>
                EDITORIAL BULLETIN • MYMENSINGH
              </span>
            </div>
          </div>
          {showCategory && customCategory && (
            <span style={{ border: `1px solid ${accentColor}25`, color: textMutedColor, padding: '3px 8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '3px' }}>
              {customCategory}
            </span>
          )}
        </div>

        {/* Custom Slogan Bar */}
        {customSlogan && (
          <div style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: textMutedColor, borderTop: `1px solid ${accentColor}15`, borderBottom: `1px solid ${accentColor}15`, padding: '6px 0', marginTop: '6px', position: 'relative', zIndex: 10 }}>
            {customSlogan}
          </div>
        )}

        {/* Main Body Grid Layout Split */}
        <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', gap: '20px', margin: '16px 0', position: 'relative', zIndex: 10 }}>
          {/* Cover image on left if designated */}
          {imageDataUri && isImageLeft && (
            <div style={{ width: '38%', display: 'flex', height: '100%', maxHeight: '220px', backgroundColor: '#ffffff', border: `1px solid ${accentColor}20`, padding: '4px', borderRadius: '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <img src={imageDataUri} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '2px' }} alt="editorial" />
            </div>
          )}

          {/* Copy section */}
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, flexShrink: 1, textAlign: 'left' }}>
            <span style={{ color: textMainColor, fontWeight: 'black', fontSize: `${titleSizeNum}px`, lineHeight: 1.25, marginBottom: '10px' }}>
              {customTitle}
            </span>

            <div style={{ width: '64px', height: '2px', backgroundColor: '#B3002D', marginBottom: '10px' }} />

            {/* Metadata bar */}
            {(showLocation || showAuthor || showDate) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', color: textMutedColor, fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>
                {showLocation && customLocation && <span style={{ color: textMainColor, marginRight: '8px' }}>{customLocation.toUpperCase()}</span>}
                {showLocation && <span style={{ marginRight: '8px' }}>/</span>}
                {showAuthor && <span style={{ marginRight: '8px' }}>{customAuthor}</span>}
                {showAuthor && <span style={{ marginRight: '8px' }}>/</span>}
                {showDate && <span>{customDate}</span>}
              </div>
            )}

            {customSummary && (
              <span style={{ color: textMutedColor, fontSize: `${summarySizeNum}px`, lineHeight: 1.5, textAlign: textAlignment }}>
                {getClampedSummaryStr()}
              </span>
            )}
          </div>

          {/* Cover image on right if designated */}
          {imageDataUri && !isImageLeft && (
            <div style={{ width: '38%', display: 'flex', height: '100%', maxHeight: '220px', backgroundColor: '#ffffff', border: `1px solid ${accentColor}20`, padding: '4px', borderRadius: '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <img src={imageDataUri} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '2px' }} alt="editorial" />
            </div>
          )}
        </div>

        {/* Footer info bar */}
        {showFooter && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: `1px solid ${accentColor}15`, paddingTop: '10px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ color: '#B3002D', fontWeight: 'bold', fontSize: '12px' }}>
                সমাজতান্ত্রিক ছাত্র ফ্রন্ট
              </span>
              <span style={{ color: textMutedColor, fontSize: '10px', marginTop: '2px' }}>
                mymensingh-branch{showWeb ? ' // http://ssfmym.pro.bd/' : ''} // record-{item.id?.slice(0, 6) || 'card'}
              </span>
            </div>

            {showQR && qrCodeDataUrl && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', marginRight: '8px', textAlign: 'right' }}>
                  <span style={{ color: '#B3002D', fontWeight: 'bold', fontSize: '9px' }}>SCAN AND VERIFY</span>
                  <span style={{ color: '#9ca3af', fontSize: '8px' }}>ARCHIVAL RECORD</span>
                </div>
                <img src={qrCodeDataUrl} style={{ height: '40px', width: '40px', backgroundColor: '#ffffff', padding: '2px', border: `1px solid ${accentColor}15`, borderRadius: '3px' }} alt="qr" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  } else {
    // 5. OFFICIAL PROCLAMATION & CONSTITUTIONAL DOCUMENT STYLE
    element = (
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          backgroundColor: '#faf6ee',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '44px',
          boxSizing: 'border-box',
          fontFamily: 'Noto Sans Bengali',
          position: 'relative',
        }}
      >
        {/* Double border frame layout */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', bottom: '12px', border: `4px double ${accentColor}`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '22px', left: '22px', right: '22px', bottom: '22px', border: `1px solid ${accentColor}`, opacity: 0.6, pointerEvents: 'none' }} />

        {/* Emblem Crest Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          {showLogo && logoDataUri && (
            <div style={{ display: 'flex', backgroundColor: '#ffffff', border: `1px solid ${accentColor}25`, borderRadius: '50%', padding: '4px', height: '52px', width: '52px', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <img src={logoDataUri} style={{ height: '100%', width: '100%', objectFit: 'contain' }} alt="emblem" />
            </div>
          )}
          <span style={{ color: '#B3002D', fontWeight: 'black', fontSize: '22px', letterSpacing: '1px' }}>
            সমাজতান্ত্রিক ছাত্র ফ্রন্ট
          </span>
          <span style={{ color: accentColor, fontWeight: 'bold', fontSize: '12px', marginTop: '2px', letterSpacing: '1px' }}>
            ময়মনসিংহ জেলা শাখা
          </span>

          {/* Decorative Divider flourished */}
          <div style={{ display: 'flex', alignItems: 'center', width: '200px', margin: '8px 0', opacity: 0.6 }}>
            <div style={{ flexGrow: 1, height: '1px', backgroundColor: '#B3002D' }} />
            <span style={{ color: '#B3002D', margin: '0 8px', fontSize: '10px' }}>❈</span>
            <div style={{ flexGrow: 1, height: '1px', backgroundColor: '#B3002D' }} />
          </div>
        </div>

        {/* Proclamation Content panel */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 10, margin: 'auto 0' }}>
          {showCategory && customCategory && (
            <span style={{ border: `1px solid ${accentColor}20`, backgroundColor: 'rgba(235,165,10,0.1)', color: '#B3002D', fontWeight: 'bold', padding: '3px 12px', fontSize: '12px', borderRadius: '3px', marginBottom: '12px' }}>
              {customCategory}
            </span>
          )}

          <span style={{ color: accentColor, fontWeight: 'black', fontSize: `${titleSizeNum}px`, lineHeight: 1.3, marginBottom: '12px' }}>
            {customTitle}
          </span>

          <div style={{ width: '48px', height: '2px', backgroundColor: '#B3002D', opacity: 0.6, marginBottom: '12px' }} />

          {customSummary && (
            <span style={{ color: '#271206', fontSize: `${summarySizeNum}px`, lineHeight: 1.6, maxWidth: '480px' }}>
              {getClampedSummaryStr()}
            </span>
          )}

          {/* Mini Image centered inside document if selected */}
          {imageDataUri && imagePosition !== 'hidden' && (
            <div style={{ display: 'flex', marginTop: '16px', width: '180px', height: '110px', backgroundColor: '#ffffff', border: `1px solid ${accentColor}15`, padding: '2px', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <img src={imageDataUri} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="document-crest" />
            </div>
          )}
        </div>

        {/* Official Authorized sign-off block */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: `1px solid ${accentColor}20`, paddingTop: '12px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', color: '#271206', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }}>
            {showAuthor && <span style={{ color: '#000000', fontWeight: 'black', marginBottom: '2px' }}>অনুমোদিত: {customAuthor}</span>}
            {showLocation && <span style={{ opacity: 0.85, fontWeight: 'normal' }}>স্থান: {customLocation}</span>}
            {showDate && <span style={{ opacity: 0.7, fontSize: '10px', marginTop: '2px', fontFamily: 'monospace' }}>{customDate}</span>}
          </div>

          {showQR && qrCodeDataUrl && (
            <img src={qrCodeDataUrl} style={{ height: '48px', width: '48px', backgroundColor: '#ffffff', padding: '2px', border: `1px solid ${accentColor}25`, borderRadius: '3px' }} alt="qr" />
          )}
        </div>
      </div>
    );
  }

  // 5. Build Satori layout to SVG Code representation
  console.log('Compiling SVG elements using Satori with Bengali font configurations...');
  const svgCode = await satori(element, {
    width: baseWidth,
    height: baseHeight,
    fonts: [
      {
        name: 'Noto Sans Bengali',
        data: fonts.regular,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Noto Sans Bengali',
        data: fonts.bold,
        weight: 700,
        style: 'normal',
      }
    ]
  });

  // 6. Satori SVG conversion into desired graphic representations
  console.log('Rendering high resolution raster image using Resvg & Sharp...');
  const resvgRenderer = new Resvg(svgCode, {
    background: 'rgba(0, 0, 0, 0)',
    fitTo: {
      mode: 'width',
      value: targetWidth
    }
  });

  const rawPngBuffer = resvgRenderer.render().asPng();
  let finalBuffer: Buffer;
  let finalMime = 'image/png';

  if (exportFormat === 'jpeg') {
    finalBuffer = await sharp(rawPngBuffer).jpeg({ quality: 90 }).toBuffer();
    finalMime = 'image/jpeg';
  } else if (exportFormat === 'webp') {
    finalBuffer = await sharp(rawPngBuffer).webp({ quality: 90 }).toBuffer();
    finalMime = 'image/webp';
  } else if (exportFormat === 'pdf') {
    // Generate pristine high-fidelity PDF from high-res PNG utilizing jsPDF
    const pdfDoc = new jsPDF({
      orientation: targetWidth >= targetHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [targetWidth, targetHeight],
    });
    const base64Uri = `data:image/png;base64,${rawPngBuffer.toString('base64')}`;
    pdfDoc.addImage(base64Uri, 'PNG', 0, 0, targetWidth, targetHeight);
    finalBuffer = Buffer.from(pdfDoc.output('arraybuffer'));
    finalMime = 'application/pdf';
  } else {
    // PNG format default
    finalBuffer = rawPngBuffer;
  }

  // 7. Write a backup copy locally to uploads/photocards in the workspace
  const localFilename = `photocard-${item.type || 'news'}-${item.id || 'export'}-${Date.now()}.${exportFormat}`;
  const localDir = path.join(process.cwd(), 'public', 'uploads', 'photocards');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const localPath = path.join(localDir, localFilename);
  fs.writeFileSync(localPath, finalBuffer);
  const localUrl = `/uploads/photocards/${localFilename}`;

  // 8. Upload generated file directly to Firebase Storage Bucket
  console.log('Uploading generated asset to Google Firebase Storage...');
  const firebaseStoragePath = `photocards/${localFilename}`;
  const storageRef = ref(storage, firebaseStoragePath);
  const uploadResult = await uploadBytes(storageRef, finalBuffer, { contentType: finalMime });
  const firebaseDownloadUrl = await getDownloadURL(uploadResult.ref);

  const renderTime = Date.now() - startTime;
  console.log(`Server render completed in ${renderTime} ms. Saved to Firebase Storage.`);

  return {
    downloadURL: firebaseDownloadUrl,
    localURL: localUrl,
    storagePath: firebaseStoragePath,
    width: targetWidth,
    height: targetHeight,
    filesize: finalBuffer.length,
    renderTime,
  };
}
