import { jsPDF } from 'jspdf';
import Konva from 'konva';
import QRCode from 'qrcode';
import { FontLoader } from './FontLoader';
import { DebugLogger } from '../debug/DebugLogger';
import { MemberRegistration, WebSettings, getMemberBadgeText } from '../../types';

export interface ValidationErrorDetail {
  assetName: string;
  failureReason: string;
  url: string;
  origin: string;
  suggestedFix: string;
}

export class ValidationError extends Error {
  public details: ValidationErrorDetail[];
  constructor(message: string, details: ValidationErrorDetail[]) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class AssetLoader {
  private static cache: Map<string, ImageBitmap | HTMLImageElement> = new Map();
  private static objectUrls: Set<string> = new Set();

  public static async loadAsset(url: string, name: string, onLog?: (msg: string) => void): Promise<ImageBitmap | HTMLImageElement> {
    if (onLog) onLog(`[রিসোর্স লোডার] "${name}" লোডের জন্য সোর্স ইউআরএল স্ক্যান করা হচ্ছে...`);
    if (!url) {
      if (onLog) onLog(`[রিসোর্স লোডার] ত্রুটি: "${name}" এর ইউআরএল খালি বা অনির্ধারিত!`);
      throw {
        assetName: name,
        failureReason: 'রিসোর্স লিংকটি ফাঁকা বা অনুপস্থিত (Empty or missing URL)',
        url: '',
        origin: 'Unknown',
        suggestedFix: 'দয়া করে মেম্বার প্রোফাইল বা সেটিংস পেজে গিয়ে সঠিক তথ্য বা ইমেজ আপলোড করুন।'
      };
    }

    if (this.cache.has(url)) {
      if (onLog) onLog(`[রিসোর্স লোডার] "${name}" পূর্বেই ক্যাশ করা আছে, ক্যাশ থেকে সরাসরি নেওয়া হল।`);
      const cachedImg = this.cache.get(url)!;
      const imgWidth = 'naturalWidth' in cachedImg ? cachedImg.naturalWidth : cachedImg.width;
      const imgHeight = 'naturalHeight' in cachedImg ? cachedImg.naturalHeight : cachedImg.height;
      DebugLogger.trackImage({
        originalUrl: url,
        resolvedUrl: url,
        width: imgWidth,
        height: imgHeight,
        corsStatus: 'UNKNOWN',
        origin: 'Memory Cache',
        cacheStatus: 'HIT',
        loaded: true,
        decoded: true,
        safeForCanvas: true
      });
      return cachedImg;
    }

    const isDataUrl = url.startsWith('data:');
    const isBlobUrl = url.startsWith('blob:');
    const isLocal = url.startsWith('/') || url.startsWith(window.location.origin);
    const isExternal = !isDataUrl && !isBlobUrl && !isLocal;

    let targetUrl = url;
    let blob: Blob | null = null;

    try {
      if (isExternal) {
        if (onLog) onLog(`[রিসোর্স লোডার] "${name}" একটি এক্সটার্নাল লিংক। সিকিউর ইমেজ প্রক্সির মাধ্যমে রিকোয়েস্ট পাঠানো হচ্ছে... URL: ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`);
        const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxiedUrl);
        if (!res.ok) {
          throw new Error(`সার্ভার প্রক্সি কানেকশন ইমেজ রিটার্ন করতে পারেনি (HTTP ${res.status} - ${res.statusText})`);
        }
        blob = await res.blob();
        if (onLog) onLog(`[রিসোর্স লোডার] প্রক্সি থেকে "${name}" সফলভাবে ডাউনলোড সম্পন্ন। সাইজ: ${blob.size} বাইটস, টাইপ: ${blob.type}`);
      } else if (!isDataUrl && !isBlobUrl) {
        if (onLog) onLog(`[রিসোর্স লোডার] "${name}" লোকাল সোর্স ফাইল। লোকাল রিকোয়েস্ট পাঠানো হচ্ছে... URL: ${url}`);
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`লোকাল ফাইলটি খুঁজে পাওয়া যায়নি (HTTP ${res.status} - ${res.statusText})`);
        }
        blob = await res.blob();
        if (onLog) onLog(`[রিসোর্স লোডার] লোকাল ফাইল ডাউনলোড সম্পন্ন। সাইজ: ${blob.size} বাইটস`);
      } else {
        if (onLog) onLog(`[রিসোর্স লোডার] "${name}" ইনলাইন/ব্লব ফরম্যাট। প্রক্সি ছাড়াই সরাসরি প্রসেস করা হচ্ছে।`);
      }

      if (blob) {
        const objUrl = URL.createObjectURL(blob);
        this.objectUrls.add(objUrl);
        targetUrl = objUrl;
        if (onLog) onLog(`[রিসোর্স লোডার] "${name}" এর বাইনারি ডেটা অবজেক্ট ইউআরএল-এ রূপান্তরিত হয়েছে।`);
      }

      let img: ImageBitmap | HTMLImageElement;
      const decodeStart = performance.now();

      // Use classic image element for data URL, blob URL, or if createImageBitmap isn't available
      if (!isDataUrl && !isBlobUrl && typeof window.createImageBitmap === 'function') {
        try {
          if (onLog) onLog(`[রিসোর্স লোডার] ব্রাউজার createImageBitmap ফাংশন ব্যবহার করে "${name}" ডিকোড করা হচ্ছে...`);
          let finalBlob = blob;
          if (!finalBlob) {
            const res = await fetch(targetUrl);
            finalBlob = await res.blob();
          }
          img = await createImageBitmap(finalBlob);
          if (onLog) onLog(`[রিসোর্স লোডার] "${name}" জিপিইউ ডিকোডিং সফলভাবে সম্পন্ন।`);
        } catch (bitmapErr: any) {
          if (onLog) onLog(`[রিসোর্স লোডার] সতর্কতা: createImageBitmap ব্যর্থ হয়েছে (${bitmapErr.message || bitmapErr})। ব্যাকআপ HTMLImageElement ডিকোডার সক্রিয় করা হচ্ছে...`);
          const htmlImg = new Image();
          htmlImg.crossOrigin = 'anonymous';
          htmlImg.src = targetUrl;
          await htmlImg.decode();
          img = htmlImg;
          if (onLog) onLog(`[রিসোর্স লোডার] HTMLImageElement ব্যাকআপ দিয়ে "${name}" ডিকোড সফল।`);
        }
      } else {
        if (onLog) onLog(`[রিসোর্স লোডার] ক্লাসিক HTMLImageElement এর মাধ্যমে "${name}" লোড করা হচ্ছে...`);
        const htmlImg = new Image();
        htmlImg.crossOrigin = 'anonymous';
        htmlImg.src = targetUrl;
        await htmlImg.decode(); // Ensures image is fully decoded before drawing
        img = htmlImg;
        if (onLog) onLog(`[রিসোর্স লোডার] ক্লাসিক HTMLImageElement.decode() সফলভাবে সমাপ্ত।`);
      }

      const decodeTime = performance.now() - decodeStart;
      const imgWidth = 'naturalWidth' in img ? img.naturalWidth : img.width;
      const imgHeight = 'naturalHeight' in img ? img.naturalHeight : img.height;

      DebugLogger.trackImage({
        originalUrl: url,
        resolvedUrl: targetUrl,
        blobUrl: targetUrl.startsWith('blob:') ? targetUrl : undefined,
        width: imgWidth,
        height: imgHeight,
        fileSize: blob?.size || undefined,
        mimeType: blob?.type || undefined,
        decodeTime,
        corsStatus: isExternal ? 'PROXY_BYPASS' : 'CORRECT',
        origin: isExternal ? 'Remote CDN' : 'Local Domain',
        cacheStatus: 'MISS',
        loaded: true,
        decoded: true,
        safeForCanvas: true
      });

      this.cache.set(url, img);
      return img;
    } catch (err: any) {
      const errMsg = err.message || String(err);
      if (onLog) onLog(`[রিসোর্স লোডার] চরম ব্যর্থতা: "${name}" লোড বা ডিকোড করা যায়নি। ত্রুটি: ${errMsg}`);
      console.error(`[AssetLoader] Failed to load [${name}] from URL: ${url}`, err);
      throw {
        assetName: name,
        failureReason: errMsg,
        url,
        origin: isDataUrl ? 'Inline Base64' : isBlobUrl ? 'Local Blob URL' : new URL(url, window.location.href).origin,
        suggestedFix: isExternal 
          ? 'সার্ভার প্রক্সি কানেকশন চেক করুন বা ছবিটি পুনরায় আপলোড করে ডাইরেক্ট সচল লিংক ব্যবহার করুন।' 
          : 'ফাইলটি মুছে গেছে বা এর অ্যাক্সেস রেস্ট্রিক্টেড করা হয়েছে। প্রোফাইল পিকচারটি পুনরায় আপলোড করুন।'
      };
    }
  }

  public static cleanup() {
    // Release all created object URLs to free browser memory
    for (const objUrl of this.objectUrls) {
      URL.revokeObjectURL(objUrl);
    }
    this.objectUrls.clear();
    this.cache.clear();
  }
}

export class MemberCardRenderer {
  private static calculateFit(
    srcWidth: number,
    srcHeight: number,
    dstWidth: number,
    dstHeight: number,
    cover = false
  ) {
    const srcRatio = srcWidth / srcHeight;
    const dstRatio = dstWidth / dstHeight;
    let width = dstWidth;
    let height = dstHeight;
    let x = 0;
    let y = 0;

    if (cover) {
      if (srcRatio > dstRatio) {
        width = dstHeight * srcRatio;
        x = (dstWidth - width) / 2;
      } else {
        height = dstWidth / srcRatio;
        y = (dstHeight - height) / 2;
      }
    } else {
      if (srcRatio > dstRatio) {
        height = dstWidth / srcRatio;
        y = (dstHeight - height) / 2;
      } else {
        width = dstHeight * srcRatio;
        x = (dstWidth - width) / 2;
      }
    }

    return { x, y, width, height };
  }

  /**
   * Constructs the Member eCard using Konva.js and returns the fully rendered high-res HTMLCanvasElement
   */
  public static async drawMemberCard(
    member: MemberRegistration,
    settings: WebSettings | undefined,
    exportScale = 2.5,
    onLog?: (msg: string) => void
  ): Promise<HTMLCanvasElement> {
    const renderStart = performance.now();
    const baseWidth = 1011;
    const baseHeight = 638;

    // 1. Ensure fonts are loaded
    if (onLog) onLog('ধাপ ১: মেম্বার কার্ডের বাংলা ও ইংরেজি ফন্টসমূহ ব্রাউজারে প্রি-লোড করা হচ্ছে...');
    await FontLoader.loadFonts();
    if (onLog) onLog('ফন্ট প্রি-লোড সফল হয়েছে।');

    // 2. Setup parallel asset loads using AssetLoader
    if (onLog) onLog('ধাপ ২: ই-কার্ডের লোগো, সদস্যের ছবি, কিউআর কোড এবং ইস্যুকারীর স্বাক্ষর লোড করা হচ্ছে...');
    const verifyUrl = `${window.location.protocol}//${window.location.host}/?verify-member=${member.id}`;
    
    let logo1: ImageBitmap | HTMLImageElement | null = null;
    let logo2: ImageBitmap | HTMLImageElement | null = null;
    let profile: ImageBitmap | HTMLImageElement | null = null;
    let signature: ImageBitmap | HTMLImageElement | null = null;
    let qrImage: ImageBitmap | HTMLImageElement | null = null;

    const validationErrors: ValidationErrorDetail[] = [];

    // Parallel load core assets with rich error handling
    const loadPromises = [
      AssetLoader.loadAsset('https://i.ibb.co.com/F4MKM3R2/20260527-055637.png', 'মূল লোগো (Main SSF Logo)', onLog)
        .then(img => { logo1 = img; })
        .catch(err => { validationErrors.push(err); }),

      AssetLoader.loadAsset('https://i.ibb.co/R4BCPZ0B/20250130-143124.png', 'ব্যানার টেক্সট লোগো (Banner Text Logo)', onLog)
        .then(img => { logo2 = img; })
        .catch(err => { validationErrors.push(err); }),

      QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 360,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      })
        .then(qrDataUrl => AssetLoader.loadAsset(qrDataUrl, 'ভ্যালিডেশন কিউআর কোড (Validation QR Code)', onLog))
        .then(img => { qrImage = img; })
        .catch(err => {
          validationErrors.push({
            assetName: 'ভ্যালিডেশন কিউআর কোড (Validation QR Code)',
            failureReason: err.message || 'কিউআর কোড জেনারেশন ব্যর্থ হয়েছে।',
            url: verifyUrl,
            origin: 'Local Generator',
            suggestedFix: 'মেম্বার আইডি ভ্যালিডেশন লিংকটি সঠিক কিনা পরীক্ষা করুন।'
          });
        })
    ];

    if (member.photoUrl) {
      loadPromises.push(
        AssetLoader.loadAsset(member.photoUrl, 'মেম্বার প্রোফাইল ছবি (Member Profile Photo)', onLog)
          .then(img => { profile = img; })
          .catch(err => { validationErrors.push(err); })
      );
    } else {
      if (onLog) onLog('[রিসোর্স লোডার] সতর্কবার্তা: মেম্বার প্রোফাইলে কোনো ছবি নেই! ডিফল্ট প্লেসহোল্ডার ছাড়াই রেন্ডারিং এগিয়ে যাবে।');
    }

    if (settings?.idSignerSignatureUrl) {
      loadPromises.push(
        AssetLoader.loadAsset(settings.idSignerSignatureUrl, 'ইস্যুকারীর স্বাক্ষর (Authorized Signature)', onLog)
          .then(img => { signature = img; })
          .catch(err => { validationErrors.push(err); })
      );
    } else {
      if (onLog) onLog('[রিসোর্স লোডার] তথ্য: ইস্যুকারীর স্বাক্ষর এর কোনো সোর্স লিংক পাওয়া যায়নি। ড্যাশড লাইন ড্র করা হবে।');
    }

    await Promise.all(loadPromises);

    // If any asset validation failed, halt render and throw a ValidationError containing detailed reports
    if (validationErrors.length > 0) {
      if (onLog) onLog(`[রিসোর্স লোডার] ত্রুটি: ${validationErrors.length}টি আবশ্যিক রিসোর্স লোড করা যায়নি। প্রসেস স্থগিত করা হচ্ছে।`);
      throw new ValidationError('মেম্বার কার্ড তৈরির সময় কিছু প্রয়োজনীয় উপাদান লোড করা যায়নি।', validationErrors);
    }

    if (onLog) onLog('ধাপ ৩: সমস্ত ফাইল ও কিউআর কোড জেনারেট সম্পন্ন হয়েছে। কনভা (Konva.js) ডাইনামিক স্টেজ তৈরি করা হচ্ছে...');

    // 3. Construct Konva Stage programmatically
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    const stage = new Konva.Stage({
      container: container,
      width: baseWidth * exportScale,
      height: baseHeight * exportScale
    });

    // Scale stage to handle export DPI cleanly
    stage.scale({ x: exportScale, y: exportScale });

    // Initialize 11 mandatory layers
    const backgroundLayer = new Konva.Layer();
    const cardBorderLayer = new Konva.Layer();
    const memberPhotoLayer = new Konva.Layer();
    const orgLogoLayer = new Konva.Layer();
    const memberInfoLayer = new Konva.Layer();
    const qrCodeLayer = new Konva.Layer();
    const verificationCodeLayer = new Konva.Layer();
    const signaturesLayer = new Konva.Layer();
    const footerLayer = new Konva.Layer();
    const watermarkLayer = new Konva.Layer();
    const securityOverlayLayer = new Konva.Layer();

    const padding = 35;
    const fontPreference = 'Inter, Noto Sans Bengali, sans-serif';

    // 1. Background Layer (Outer Gradient Border)
    const borderRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: baseWidth,
      height: baseHeight,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: baseWidth, y: baseHeight },
      fillLinearGradientColorStops: [
        0, '#e4e4e7', // zinc-200
        1, '#fecdd3'  // rose-200
      ],
      cornerRadius: 16
    });
    backgroundLayer.add(borderRect);

    // 2. Card Border Layer (White body & Radial Glow)
    const innerCard = new Konva.Rect({
      x: 4,
      y: 4,
      width: baseWidth - 8,
      height: baseHeight - 8,
      fill: '#ffffff',
      cornerRadius: 12
    });
    cardBorderLayer.add(innerCard);

    const radialGlow = new Konva.Circle({
      x: baseWidth * 0.8,
      y: 100,
      radius: 200,
      fillRadialGradientStartPoint: { x: 0, y: 0 },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndPoint: { x: 0, y: 0 },
      fillRadialGradientEndRadius: 200,
      fillRadialGradientColorStops: [
        0, 'rgba(244, 63, 94, 0.05)', // rose-500/5
        1, 'rgba(255, 255, 255, 0)'
      ]
    });
    cardBorderLayer.add(radialGlow);

    // 3. Member Photo Layer
    const bodyY = 160;
    const photoW = 160;
    const photoH = 200;

    const photoGroup = new Konva.Group({
      x: padding,
      y: bodyY,
      width: photoW,
      height: photoH,
      clipFunc: (ctx) => {
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(photoW - radius, 0);
        ctx.quadraticCurveTo(photoW, 0, photoW, radius);
        ctx.lineTo(photoW, photoH - radius);
        ctx.quadraticCurveTo(photoW, photoH, photoW - radius, photoH);
        ctx.lineTo(radius, photoH);
        ctx.quadraticCurveTo(0, photoH, 0, photoH - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
      }
    });

    const photoBg = new Konva.Rect({
      x: 0,
      y: 0,
      width: photoW,
      height: photoH,
      fill: '#f4f4f5'
    });
    photoGroup.add(photoBg);

    if (profile) {
      const fit = this.calculateFit(
        (profile as any).width,
        (profile as any).height,
        photoW,
        photoH,
        true // cover crop
      );
      const kProfile = new Konva.Image({
        image: profile,
        x: fit.x,
        y: fit.y,
        width: fit.width,
        height: fit.height
      });
      photoGroup.add(kProfile);
    } else {
      const symbol = new Konva.Text({
        text: '☭',
        fontSize: 36,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fill: '#be123c',
        align: 'center',
        verticalAlign: 'middle',
        x: 0,
        y: photoH / 2 - 30,
        width: photoW,
        height: 60
      });
      const bottomBar = new Konva.Rect({
        x: 2,
        y: photoH - 30,
        width: photoW - 4,
        height: 28,
        fill: '#e11d48'
      });
      const barText = new Konva.Text({
        text: 'APPROVED MEMBER',
        fontSize: 9,
        fontFamily: 'Inter, sans-serif',
        fontStyle: 'bold',
        fill: '#ffffff',
        align: 'center',
        verticalAlign: 'middle',
        x: 0,
        y: photoH - 30,
        width: photoW,
        height: 28
      });
      photoGroup.add(symbol);
      photoGroup.add(bottomBar);
      photoGroup.add(barText);
    }
    memberPhotoLayer.add(photoGroup);

    const photoBorder = new Konva.Rect({
      x: padding,
      y: bodyY,
      width: photoW,
      height: photoH,
      stroke: '#e4e4e7',
      strokeWidth: 1.5,
      cornerRadius: 8
    });
    memberPhotoLayer.add(photoBorder);

    // 4. Organization Logo Layer
    const headerY = padding;
    let headerLogoX = padding;

    if (logo1) {
      const kLogo1 = new Konva.Image({
        image: logo1,
        x: headerLogoX,
        y: headerY,
        width: 68,
        height: 68
      });
      orgLogoLayer.add(kLogo1);
      headerLogoX += 82;
    }

    if (logo2) {
      const kLogo2 = new Konva.Image({
        image: logo2,
        x: headerLogoX,
        y: headerY + 12,
        width: 180,
        height: 52
      });
      orgLogoLayer.add(kLogo2);
    }

    const subTitle = new Konva.Text({
      text: 'MYMENSINGH DISTRICT',
      x: headerLogoX,
      y: headerY + 70,
      fontSize: 11,
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      fill: '#71717a'
    });
    orgLogoLayer.add(subTitle);

    // 5. Member Information Layer (Badge & metadata)
    const badgeText = getMemberBadgeText(member).toUpperCase();
    const dummyText = new Konva.Text({
      text: badgeText,
      fontSize: 12,
      fontFamily: fontPreference,
      fontStyle: 'bold'
    });
    const textW = dummyText.width();
    const badgeWidth = textW + 24;
    const badgeX = baseWidth - padding - badgeWidth;

    const badgeBg = new Konva.Rect({
      x: badgeX,
      y: headerY + 18,
      width: badgeWidth,
      height: 32,
      fill: '#fff1f2',
      stroke: '#fecdd3',
      strokeWidth: 1.5,
      cornerRadius: 6
    });
    memberInfoLayer.add(badgeBg);

    const badgeLabel = new Konva.Text({
      text: badgeText,
      x: badgeX,
      y: headerY + 18,
      width: badgeWidth,
      height: 32,
      fontSize: 12,
      fontFamily: fontPreference,
      fontStyle: 'bold',
      fill: '#be123c',
      align: 'center',
      verticalAlign: 'middle'
    });
    memberInfoLayer.add(badgeLabel);

    const infoX = padding + photoW + 40;
    const infoW = baseWidth - padding - infoX;

    const drawMetaFieldKonva = (
      labelBangla: string,
      labelEnglish: string,
      val: string,
      x: number,
      y: number,
      w: number,
      customSize = 14
    ) => {
      const label = new Konva.Text({
        text: `${labelBangla} / ${labelEnglish}`,
        x: x,
        y: y,
        fontSize: 10,
        fontFamily: fontPreference,
        fontStyle: 'bold',
        fill: '#71717a'
      });
      memberInfoLayer.add(label);

      const value = new Konva.Text({
        text: val || 'N/A',
        x: x,
        y: y + 16,
        width: w,
        fontSize: customSize,
        fontFamily: fontPreference,
        fontStyle: '600',
        fill: '#18181b',
        wrap: 'char'
      });
      memberInfoLayer.add(value);
    };

    drawMetaFieldKonva('নাম', 'Full Name', member.name, infoX, bodyY + 8, infoW, 18);
    drawMetaFieldKonva('শ্রেণি বা বিভাগ', 'Class / Department', member.department || 'সদস্য', infoX, bodyY + 54, infoW * 0.6);
    drawMetaFieldKonva('রক্তের গ্রুপ', 'Blood Group', member.bloodGroup || 'N/A', infoX + infoW * 0.65, bodyY + 54, infoW * 0.35);
    drawMetaFieldKonva('শিক্ষা প্রতিষ্ঠান', 'Institution', member.institution, infoX, bodyY + 100, infoW);
    drawMetaFieldKonva('মোবাইল', 'Mobile No', member.mobile, infoX, bodyY + 146, infoW * 0.45);
    drawMetaFieldKonva('ঠিকানা', 'Address', member.address, infoX + infoW * 0.5, bodyY + 146, infoW * 0.5);

    // 6. QR Code Layer
    const footerY = 395;
    const footerContentY = footerY + 22;
    const qrSize = 90;
    const qrX = padding;
    const qrY = footerContentY + 2;

    if (qrImage) {
      const kQr = new Konva.Image({
        image: qrImage,
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize
      });
      qrCodeLayer.add(kQr);
    }

    // 7. Verification Code Layer
    const memberId = `SSF-MYM-${member.id.substring(member.id.length - 5).toUpperCase()}`;
    const issueDate = member.verifiedAt || member.appliedAt || '';
    const textNextToQrX = qrX + qrSize + 20;

    const validateText = new Konva.Text({
      text: 'VALIDATE THIS CARD',
      x: textNextToQrX,
      y: footerContentY + 12,
      fontSize: 10,
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'bold',
      fill: '#71717a'
    });
    verificationCodeLayer.add(validateText);

    const idLabel = new Konva.Text({
      text: 'মেম্বারশিপ কোড / ID Code',
      x: textNextToQrX,
      y: footerContentY + 34,
      fontSize: 10,
      fontFamily: fontPreference,
      fontStyle: 'bold',
      fill: '#71717a'
    });
    verificationCodeLayer.add(idLabel);

    const idVal = new Konva.Text({
      text: memberId,
      x: textNextToQrX,
      y: footerContentY + 50,
      fontSize: 15,
      fontFamily: 'Inter, monospace',
      fontStyle: 'bold',
      fill: '#18181b'
    });
    verificationCodeLayer.add(idVal);

    const issueLabel = new Konva.Text({
      text: 'ইস্যু ডেট / Issue Date',
      x: textNextToQrX + 220,
      y: footerContentY + 34,
      fontSize: 10,
      fontFamily: fontPreference,
      fontStyle: 'bold',
      fill: '#71717a'
    });
    verificationCodeLayer.add(issueLabel);

    const issueVal = new Konva.Text({
      text: issueDate,
      x: textNextToQrX + 220,
      y: footerContentY + 50,
      fontSize: 13,
      fontFamily: 'Inter, monospace',
      fontStyle: 'bold',
      fill: '#3f3f46'
    });
    verificationCodeLayer.add(issueVal);

    // 8. Signatures Layer
    const signerW = 280;
    const signerX = baseWidth - padding - signerW;
    const signerDetailsY = baseHeight - padding - 35;

    const signatureTitle = new Konva.Text({
      text: 'ইস্যুকারীর স্বাক্ষর / Authorized Signatory',
      x: signerX,
      y: footerContentY + 12,
      width: signerW,
      fontSize: 10.5,
      fontFamily: fontPreference,
      fontStyle: 'bold',
      fill: '#dc2626',
      align: 'center'
    });
    signaturesLayer.add(signatureTitle);

    if (signature) {
      const sigFit = this.calculateFit(
        (signature as any).width,
        (signature as any).height,
        140,
        42,
        false // contain fit
      );
      const kSignature = new Konva.Image({
        image: signature,
        x: signerX + (signerW - 140) / 2 + sigFit.x,
        y: footerContentY + 22 + sigFit.y,
        width: sigFit.width,
        height: sigFit.height
      });
      signaturesLayer.add(kSignature);
    } else {
      const dashLine = new Konva.Line({
        points: [signerX + 70, footerContentY + 52, signerX + signerW - 70, footerContentY + 52],
        stroke: '#d4d4d8',
        strokeWidth: 1.5,
        dash: [4, 4]
      });
      signaturesLayer.add(dashLine);
    }

    const signerDivider = new Konva.Line({
      points: [signerX + 20, signerDetailsY - 14, signerX + signerW - 20, signerDetailsY - 14],
      stroke: '#e4e4e7',
      strokeWidth: 1
    });
    signaturesLayer.add(signerDivider);

    const signerName = new Konva.Text({
      text: settings?.idSignerName || 'তানজিল হোসেন মুণিম',
      x: signerX,
      y: signerDetailsY - 4,
      width: signerW,
      fontSize: 12.5,
      fontFamily: fontPreference,
      fontStyle: 'bold',
      fill: '#18181b',
      align: 'center'
    });
    signaturesLayer.add(signerName);

    const signerRole1 = new Konva.Text({
      text: settings?.idSignerRoleLine1 || 'সভাপতি',
      x: signerX,
      y: signerDetailsY + 12,
      width: signerW,
      fontSize: 10.5,
      fontFamily: fontPreference,
      fontStyle: '600',
      fill: '#3f3f46',
      align: 'center'
    });
    signaturesLayer.add(signerRole1);

    const signerRole2 = new Konva.Text({
      text: settings?.idSignerRoleLine2 || 'সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা',
      x: signerX,
      y: signerDetailsY + 26,
      width: signerW,
      fontSize: 9.5,
      fontFamily: fontPreference,
      fontStyle: '500',
      fill: '#71717a',
      align: 'center'
    });
    signaturesLayer.add(signerRole2);

    // 9. Footer Layer (Divider Line)
    const footerDivider = new Konva.Line({
      points: [padding, footerY, baseWidth - padding, footerY],
      stroke: '#e4e4e7',
      strokeWidth: 1.5
    });
    footerLayer.add(footerDivider);

    // 10. Watermark Layer
    if (logo1) {
      const watermarkSize = 320;
      const watermarkImg = new Konva.Image({
        image: logo1,
        x: (baseWidth - watermarkSize) / 2,
        y: (baseHeight - watermarkSize) / 2,
        width: watermarkSize,
        height: watermarkSize,
        opacity: 0.055
      });
      watermarkLayer.add(watermarkImg);
    }

    // 11. Security Overlay Layer (Wavy protection pattern)
    for (let offset = 0; offset < 3; offset++) {
      const points: number[] = [];
      for (let x = 30; x < baseWidth - 30; x += 20) {
        const y = 300 + Math.sin((x + offset * 100) * 0.015) * 15 + offset * 8;
        points.push(x, y);
      }
      const wave = new Konva.Line({
        points,
        stroke: 'rgba(239, 68, 68, 0.02)',
        strokeWidth: 0.75,
        tension: 0.5
      });
      securityOverlayLayer.add(wave);
    }

    // Mount all 11 layers in strict hierarchy order
    if (onLog) onLog('ধাপ ৪: ই-কার্ডের ১১টি গ্রাফিক্স লেয়ার (ব্যাকগ্রাউন্ড, বর্ডার, ফটো, লোগো, সদস্য তথ্য, কিউআর, ভেরিফিকেশন, সিগনেচার, ফুটার, জলছাপ, সিকিউরিটি ঢেউ) সাজানো হচ্ছে...');
    stage.add(backgroundLayer);
    stage.add(cardBorderLayer);
    stage.add(memberPhotoLayer);
    stage.add(orgLogoLayer);
    stage.add(memberInfoLayer);
    stage.add(qrCodeLayer);
    stage.add(verificationCodeLayer);
    stage.add(signaturesLayer);
    stage.add(footerLayer);
    stage.add(watermarkLayer);
    stage.add(securityOverlayLayer);

    // Force stage render
    if (onLog) onLog('ধাপ ৫: গ্রাফিক্স ইঞ্জিন (Konva.js) দিয়ে রেন্ডারিং সমাপ্ত করা হচ্ছে...');
    stage.draw();

    // Export fully rendered stage to static Canvas
    if (onLog) onLog('ধাপ ৬: ভার্চুয়াল স্টেজ থেকে হাই-ডিউটি ক্যানভাস ম্যাট্রিক্স (pixel buffer) এক্সপোর্ট করা হচ্ছে...');
    const canvas = await stage.toCanvas();

    // Verify canvas parameters before leaving
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
      if (onLog) onLog('রেন্ডারিং চরম ব্যর্থতা: এক্সপোর্ট করা ক্যানভাস সাইজ ত্রুটিপূর্ণ (width or height <= 0)');
      throw new Error('রেন্ডারার একটি ত্রুটিপূর্ণ ক্যানভাস তৈরি করেছে (প্রস্থ বা উচ্চতা ০)');
    }

    const renderTime = performance.now() - renderStart;
    let tainted = false;
    let taintedByObject = null;
    try {
      const testCtx = canvas.getContext('2d');
      if (testCtx) {
        testCtx.getImageData(0, 0, 1, 1);
      }
    } catch (taintErr: any) {
      tainted = true;
      taintedByObject = {
        layerName: 'memberPhotoLayer / orgLogoLayer',
        objectId: member.photoUrl ? 'profile-photo' : 'logo-main',
        reason: taintErr.message || String(taintErr),
        url: member.photoUrl || 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png'
      };
    }

    DebugLogger.trackCanvas({
      width: canvas.width,
      height: canvas.height,
      pixelRatio: window.devicePixelRatio || 1,
      scale: exportScale,
      memoryUsage: canvas.width * canvas.height * 4,
      objectCount: stage.find('*').length,
      layerCount: stage.getLayers().length,
      renderTime,
      tainted,
      taintedByObject
    });

    if (onLog) onLog(`রেন্ডারিং সফল! ক্যানভাস সাইজ: ${canvas.width}x${canvas.height} পিক্সেল।`);

    // Retain a reference to stage/container in the canvas object to allow cleanup on export end
    (canvas as any)._destroyStage = () => {
      stage.destroy();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      AssetLoader.cleanup();
    };

    return canvas;
  }

  private static async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('ক্যানভাস থেকে ফাইল (Blob) রূপান্তর ব্যর্থ হয়েছে।'));
          }
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    });
  }

  private static dataURLToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  }

  /**
   * Universal export helper that takes the Canvas, performs robust multi-stage conversion to Blob, revokes and downloads
   */
  public static async exportCanvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    try {
      return await this.canvasToBlob(canvas);
    } catch (err) {
      console.warn('[MemberCardRenderer] Default toBlob failed, trying OffscreenCanvas pipeline...', err);
      if (typeof window.OffscreenCanvas !== 'undefined') {
        try {
          const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
          const ctx = offscreen.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, 0);
            const blob = await offscreen.convertToBlob({ type: 'image/png' });
            if (blob) return blob;
          }
        } catch (offscreenErr) {
          console.error('[MemberCardRenderer] OffscreenCanvas export failed:', offscreenErr);
        }
      }

      console.warn('[MemberCardRenderer] OffscreenCanvas failed or unsupported. Trying secondary hidden canvas...');
      try {
        const secondary = document.createElement('canvas');
        secondary.width = canvas.width;
        secondary.height = canvas.height;
        const ctx = secondary.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, 0);
          const blob = await this.canvasToBlob(secondary);
          if (blob) return blob;
        }
      } catch (secErr) {
        console.error('[MemberCardRenderer] Secondary canvas fallback failed:', secErr);
      }

      // Ultimate absolute fallback: toDataURL -> Base64 string -> manual Blob conversion
      console.warn('[MemberCardRenderer] All direct blob exports failed. Falling back to DataURL conversion as absolute last resort.');
      try {
        const dataUrl = canvas.toDataURL('image/png');
        return this.dataURLToBlob(dataUrl);
      } catch (dataUrlErr) {
        throw new Error('ব্রাউজারটি ছবি রূপান্তরের সমস্ত পন্থাই ব্লক করেছে। দয়া করে অন্য ব্রাউজার ব্যবহার করুন।');
      }
    }
  }

  /**
   * Generates a PDF of the member card using jsPDF
   */
  public static async exportCanvasToPDF(canvas: HTMLCanvasElement, filename: string): Promise<Blob> {
    const baseWidth = 1011;
    const baseHeight = 638;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [baseWidth, baseHeight]
    });

    // jsPDF allows drawing the HTMLCanvasElement directly inside addImage, saving massive base64 overhead!
    try {
      pdf.addImage(canvas, 'PNG', 0, 0, baseWidth, baseHeight);
      const blob = pdf.output('blob');
      return blob;
    } catch (pdfErr) {
      console.warn('[MemberCardRenderer] HTMLCanvasElement to PDF failed. Trying image data fallback...', pdfErr);
      const dataUrl = canvas.toDataURL('image/png');
      pdf.addImage(dataUrl, 'PNG', 0, 0, baseWidth, baseHeight);
      return pdf.output('blob');
    }
  }

  /**
   * Self-contained download and export pipeline. Draws, validates, converts to Blob, and downloads the file.
   */
  public static async exportAndDownloadMemberCard(
    member: MemberRegistration,
    settings: WebSettings | undefined,
    format: 'png' | 'pdf'
  ): Promise<void> {
    let canvas: HTMLCanvasElement | null = null;
    let fileUrl: string | null = null;

    try {
      canvas = await this.drawMemberCard(member, settings, 2.5);
      const filename = `SSF_Member_Card_${member.name.replace(/\s+/g, '_')}_${member.id.substring(0, 5)}.${format}`;

      let blob: Blob;
      if (format === 'pdf') {
        blob = await this.exportCanvasToPDF(canvas, filename);
      } else {
        blob = await this.exportCanvasToBlob(canvas);
      }

      // Create a same-origin Object URL from the final Blob
      fileUrl = URL.createObjectURL(blob);

      // Trigger standard browser download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`[MemberCardRenderer] Successful download triggered for ${filename}`);
    } finally {
      // Memory cleanup
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
      if (canvas && (canvas as any)._destroyStage) {
        (canvas as any)._destroyStage();
      }
    }
  }
}
