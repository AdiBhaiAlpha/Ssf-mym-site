import { ThemeConfig } from './ThemeManager';
import { ImageLoader } from './ImageLoader';
import { QRCodeRenderer } from './QRCodeRenderer';

export interface RenderItem {
  id: string;
  type: string;
  title: string;
  content: string;
  excerpt?: string;
  image?: string;
  date: string;
  author?: string;
  category?: string;
  location?: string;
}

export interface RenderSettings {
  selectedTemplate: number;
  accentColor: string;
  bgStyle: string;
  bgTheme: 'light' | 'dark' | 'cream';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  imagePosition: string; // 'top' | 'left' | 'background' | 'hidden'
  fontFamily: 'sans' | 'serif' | 'mono';
  textAlignment: 'left' | 'center' | 'right' | 'justified';
  borderStyle: string;
  customTitle: string;
  customSummary: string;
  customCategory: string;
  customLocation: string;
  customAuthor: string;
  customDate: string;
  customSlogan: string;
  showLogo: boolean;
  showQR: boolean;
  showDate: boolean;
  showAuthor: boolean;
  showLocation: boolean;
  showCategory: boolean;
  showFooter: boolean;
  showReadingTime: boolean;
  aspectRatio: string;
  showWatermark?: boolean;
  watermarkText?: string;
  showWeb?: boolean;
  showFB?: boolean;
}

export interface DrawDiagnostics {
  width: number;
  height: number;
  aspectRatio: string;
  objectCount: number;
  layerOrder: string[];
  imageBounds: { x: number; y: number; w: number; h: number } | null;
  objectCoordinates: Record<string, { x: number; y: number; w?: number; h?: number }>;
  fontMetrics: { fontSize: number; lineCount: number; titleHeight: number };
}

export class LayerManager {
  /**
   * Universal text wrapping helper
   */
  public static wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  public static wrapTextWithParagraphs(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const paragraphs = text.split('\n');
    const allLines: string[] = [];
    for (const para of paragraphs) {
      if (para.trim() === '') {
        allLines.push('');
        continue;
      }
      allLines.push(...this.wrapText(ctx, para, maxWidth));
    }
    return allLines;
  }

  /**
   * Helper to draw a rounded rectangle
   */
  private static fillRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  private static strokeRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
  }

  /**
   * Main draw method that renders all layers depending on the template preset
   */
  public static async drawLayers(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    item: RenderItem,
    settings: RenderSettings,
    theme: ThemeConfig,
    logo1: HTMLImageElement | null,
    logo2: HTMLImageElement | null,
    featuredImg: HTMLImageElement | null,
    diagnostics?: DrawDiagnostics
  ) {
    // Initialize diagnostics
    if (diagnostics) {
      diagnostics.width = width;
      diagnostics.height = height;
      diagnostics.aspectRatio = settings.aspectRatio;
      diagnostics.objectCount = 0;
      diagnostics.layerOrder = [];
      diagnostics.imageBounds = null;
      diagnostics.objectCoordinates = {};
      diagnostics.fontMetrics = { fontSize: 0, lineCount: 0, titleHeight: 0 };
    }

    const s = width / 400; // Base layout scale
    const padding = s * 14;

    const fontPreference = settings.fontFamily === 'serif' ? 'Hind Siliguri, Georgia, serif' : 
                           settings.fontFamily === 'mono' ? 'JetBrains Mono, monospace' : 
                           'Hind Siliguri, Inter, sans-serif';

    const titleSize = s * (settings.fontSize === 'sm' ? 14 : settings.fontSize === 'lg' ? 22 : settings.fontSize === 'xl' ? 26 : 18);
    const summarySize = s * (settings.fontSize === 'sm' ? 9.5 : settings.fontSize === 'lg' ? 13 : settings.fontSize === 'xl' ? 14.5 : 11);

    const getClampedSummary = () => {
      const customSummary = settings.customSummary || '';
      const limit = settings.fontSize === 'sm' ? 25 : settings.fontSize === 'lg' ? 120 : 55;
      const words = customSummary.split(/\s+/);
      if (words.length <= limit) return customSummary;
      return words.slice(0, limit).join(' ') + '...';
    };

    const getReadingTime = () => {
      const text = item.content || '';
      const wordCount = text.split(/\s+/).length;
      return `পড়ার সময়: ~${Math.max(1, Math.ceil(wordCount / 180))} মিনিট`;
    };

    // Preset selection tags
    const tag = settings.selectedTemplate === 15 ? 'EVENT_COV' :
                settings.selectedTemplate === 16 ? 'AWARENESS' :
                settings.selectedTemplate === 17 ? 'STUDENT_ACT' :
                settings.selectedTemplate === 18 ? 'LIBRARY' :
                settings.selectedTemplate === 19 ? 'RESEARCH' :
                settings.selectedTemplate === 20 ? 'ANNOUNCEMENT' :
                settings.selectedTemplate === 21 ? 'INSIGHTS' :
                settings.selectedTemplate === 1 ? 'BREAKING' :
                settings.selectedTemplate === 2 ? 'MAGAZINE' :
                [3, 4, 5, 6, 15, 16].includes(settings.selectedTemplate) ? 'SOCIAL_SQ' : // Cinematic
                [7, 8, 9, 10, 11, 18, 19, 21].includes(settings.selectedTemplate) ? 'MINIMAL' : // Asymmetric Editorial
                'PROCLAMATION';

    // 0. Base Background Layer (Diagnostics tracking)
    if (diagnostics) {
      diagnostics.objectCount++;
      diagnostics.layerOrder.push('background');
      diagnostics.objectCoordinates['background'] = { x: 0, y: 0, w: width, h: height };
    }

    // 0.5. Watermark Layer
    if (settings.showWatermark && logo1) {
      ctx.save();
      ctx.globalAlpha = 0.04;
      const watermarkSize = Math.min(width, height) * 0.45;
      const wx = (width - watermarkSize) / 2;
      const wy = (height - watermarkSize) / 2;
      ctx.drawImage(logo1, wx, wy, watermarkSize, watermarkSize);
      ctx.restore();

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('watermark');
        diagnostics.objectCoordinates['watermark'] = { x: wx, y: wy, w: watermarkSize, h: watermarkSize };
      }
    }

    // DRAW THE TEMPLATE LAYOUTS SPECIFICALLY

    // ==========================================
    // 1. BREAKING NEWS BROADCAST STYLE
    // ==========================================
    if (tag === 'BREAKING') {
      // Base theme is dark, red highlights
      ctx.save();

      // Grid vertical/horizontal stripes
      ctx.strokeStyle = 'rgba(179,0,45,0.08)';
      ctx.lineWidth = s * 2;
      for (let y = 0; y < height; y += s * 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Live "সরাসরি" (LIVE) Banner
      ctx.fillStyle = '#dc2626';
      this.fillRoundedRect(ctx, padding, padding, s * 48, s * 18, s * 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${s * 10}px ${fontPreference}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('সরাসরি', padding + s * 24, padding + s * 9);

      // "ব্রেকিং নিউজ" text
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${s * 12}px ${fontPreference}`;
      ctx.textAlign = 'left';
      ctx.fillText('ব্রেকিং নিউজ', padding + s * 56, padding + s * 9);

      // SSF News Branding on top right
      if (settings.showLogo && logo1) {
        ctx.drawImage(logo1, width - padding - s * 65, padding - s * 2, s * 22, s * 22);
      }
      ctx.fillStyle = '#B3002D';
      ctx.font = `900 ${s * 11}px ${fontPreference}`;
      ctx.textAlign = 'right';
      ctx.fillText('SSF NEWS', width - padding, padding + s * 12);

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('header');
        diagnostics.objectCoordinates['header'] = { x: padding, y: padding, w: width - 2 * padding, h: s * 22 };
      }

      // Featured Image screen box
      const imgY = padding + s * 24;
      const imgH = s * 150;
      const imgW = width - 2 * padding;

      // Draw top/bottom border
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = s * 2;
      ctx.beginPath();
      ctx.moveTo(padding, imgY);
      ctx.lineTo(width - padding, imgY);
      ctx.moveTo(padding, imgY + imgH);
      ctx.lineTo(width - padding, imgY + imgH);
      ctx.stroke();

      if (featuredImg) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(padding, imgY, imgW, imgH);
        ctx.clip();

        const fit = ImageLoader.calculateFit(featuredImg.width, featuredImg.height, padding, imgY, imgW, imgH, true);
        ctx.drawImage(featuredImg, fit.x, fit.y, fit.width, fit.height);
        ctx.restore();

        // Image overlay badge
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(padding, imgY, s * 150, s * 14);
        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${s * 7.5}px ${fontPreference}`;
        ctx.textAlign = 'left';
        ctx.fillText('LIVE COVERAGE • ময়মনসিংহে ছাত্র ফ্রন্ট', padding + s * 6, imgY + s * 7);

        if (diagnostics) {
          diagnostics.imageBounds = { x: padding, y: imgY, w: imgW, h: imgH };
        }
      } else {
        // Red live box representation
        ctx.fillStyle = '#111520';
        ctx.fillRect(padding, imgY, imgW, imgH);
        ctx.fillStyle = '#e11d48';
        ctx.font = `900 ${s * 24}px ${fontPreference}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔴 SSF LIVE', padding + imgW / 2, imgY + imgH / 2);
      }

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('image_panel');
        diagnostics.objectCoordinates['image_panel'] = { x: padding, y: imgY, w: imgW, h: imgH };
      }

      // Category / Tag Badge below image
      const catY = imgY + imgH + s * 10;
      ctx.fillStyle = '#facc15';
      const catText = settings.customCategory || 'ব্রেকিং';
      ctx.font = `bold ${s * 9}px ${fontPreference}`;
      const catW = ctx.measureText(catText).width + s * 12;
      this.fillRoundedRect(ctx, padding, catY, catW, s * 14, s * 1.5);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(catText, padding + catW / 2, catY + s * 7);

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('category');
        diagnostics.objectCoordinates['category'] = { x: padding, y: catY, w: catW, h: s * 14 };
      }

      // Headline black box text
      const headY = catY + s * 19;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      const headH = s * 64;
      const headW = width - 2 * padding;
      ctx.fillRect(padding, headY, headW, headH);
      
      // Headline Left Red Accent Border
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(padding, headY, s * 4, headH);

      // Draw Headline text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${titleSize * 1.15}px ${fontPreference}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const wrappedTitle = this.wrapTextWithParagraphs(ctx, settings.customTitle, headW - s * 18);
      let titleDrawY = headY + s * 8;
      for (let i = 0; i < Math.min(wrappedTitle.length, 2); i++) {
        ctx.fillText(wrappedTitle[i], padding + s * 10, titleDrawY);
        titleDrawY += titleSize * 1.3;
      }

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('title');
        diagnostics.objectCoordinates['title'] = { x: padding, y: headY, w: headW, h: headH };
        diagnostics.fontMetrics = {
          fontSize: titleSize * 1.15,
          lineCount: wrappedTitle.length,
          titleHeight: titleDrawY - headY
        };
      }

      // Running ticker styled footer
      const footY = height - padding - s * 22;
      const footH = s * 22;
      ctx.fillStyle = '#B3002D';
      ctx.fillRect(padding, footY, width - 2 * padding, footH);

      // Meta texts on footer
      let textX = padding + s * 6;
      ctx.textBaseline = 'middle';

      if (settings.showLocation && settings.customLocation) {
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${s * 8}px ${fontPreference}`;
        const locW = ctx.measureText(settings.customLocation).width + s * 8;
        this.fillRoundedRect(ctx, textX, footY + s * 4, locW, s * 14, s * 1.5);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(settings.customLocation, textX + locW / 2, footY + s * 11);
        textX += locW + s * 6;
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = `${s * 8}px ${fontPreference}`;
      ctx.textAlign = 'left';

      if (settings.showAuthor && settings.customAuthor) {
        const authStr = `প্রতিবেদক: ${settings.customAuthor}`;
        ctx.fillText(authStr, textX, footY + s * 11);
        textX += ctx.measureText(authStr).width + s * 8;
      }

      if (settings.showDate && settings.customDate) {
        ctx.font = `normal ${s * 8}px 'JetBrains Mono', monospace`;
        ctx.fillText(settings.customDate, textX, footY + s * 11);
      }

      // Footer QR Code
      if (settings.showQR) {
        const qrSize = s * 16;
        const qrX = width - padding - s * 20;
        const qrY = footY + s * 3;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - s * 1, qrY - s * 1, qrSize + s * 2, qrSize + s * 2);

        const canonicalUrl = `${window.location.origin}/?tab=news&newsId=${item.id}`;
        await QRCodeRenderer.drawQRCode(ctx, canonicalUrl, qrX, qrY, qrSize, '#000000', '#ffffff');

        if (diagnostics) {
          diagnostics.objectCoordinates['qr'] = { x: qrX, y: qrY, w: qrSize, h: qrSize };
        }
      }

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('footer');
        diagnostics.objectCoordinates['footer'] = { x: padding, y: footY, w: width - 2 * padding, h: footH };
      }

      ctx.restore();
    }

    // ==========================================
    // 2. PREMIUM MAGAZINE COVER STYLE
    // ==========================================
    else if (tag === 'MAGAZINE') {
      ctx.save();

      // Background draw
      if (featuredImg) {
        const fit = ImageLoader.calculateFit(featuredImg.width, featuredImg.height, 0, 0, width, height, true);
        ctx.drawImage(featuredImg, fit.x, fit.y, fit.width, fit.height);

        // Dark linear gradient overlay
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        if (diagnostics) {
          diagnostics.imageBounds = { x: 0, y: 0, w: width, h: height };
        }
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }

      // Double Art Frame
      ctx.strokeStyle = settings.accentColor;
      ctx.lineWidth = s * 1.2;
      ctx.strokeRect(s * 10, s * 10, width - s * 20, height - s * 20);
      
      ctx.lineWidth = s * 0.6;
      ctx.globalAlpha = 0.6;
      ctx.strokeRect(s * 13, s * 13, width - s * 26, height - s * 26);
      ctx.globalAlpha = 1.0;

      // Brand Title Header
      const headerY = s * 16;
      if (settings.showLogo && logo1) {
        ctx.drawImage(logo1, width / 2 - s * 14, headerY, s * 28, s * 28);
      }

      ctx.fillStyle = '#fbbf24'; // amber-400
      ctx.font = `bold ${s * 14}px ${fontPreference}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('সমাজতান্ত্রিক ছাত্র ফ্রন্ট', width / 2, headerY + s * 32);

      // Fine line details
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = s * 1;
      ctx.beginPath();
      ctx.moveTo(width / 6, headerY + s * 49);
      ctx.lineTo(width * 5/6, headerY + s * 49);
      ctx.stroke();

      // Slogan
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = `bold ${s * 8}px ${fontPreference}`;
      ctx.fillText(settings.customSlogan || 'বিশেষ সংখ্যা • ময়মনসিংহ জেলা শাখা', width / 2, headerY + s * 53);

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('header');
        diagnostics.objectCoordinates['header'] = { x: width / 6, y: headerY, w: width * 2/3, h: s * 64 };
      }

      // Central Content Section
      const centerY = height / 2 - s * 20;

      // Category tag centered
      let curY = centerY - s * 30;
      if (settings.customCategory) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${s * 9}px ${fontPreference}`;
        const catText = settings.customCategory.toUpperCase();
        const catW = ctx.measureText(catText).width + s * 14;
        this.fillRoundedRect(ctx, width / 2 - catW / 2, curY, catW, s * 14, s * 1.5);
        ctx.fillStyle = '#B3002D';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(catText, width / 2, curY + s * 7);
        curY += s * 20;
      }

      // Headline title centered
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${titleSize * 1.15}px ${fontPreference}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const wrappedTitle = this.wrapTextWithParagraphs(ctx, settings.customTitle, width - s * 60);
      let titleHeight = 0;
      for (let i = 0; i < wrappedTitle.length; i++) {
        ctx.fillText(wrappedTitle[i], width / 2, curY);
        curY += titleSize * 1.25;
        titleHeight += titleSize * 1.25;
      }

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('title');
        diagnostics.objectCoordinates['title'] = { x: s * 30, y: centerY - s * 10, w: width - s * 60, h: titleHeight };
        diagnostics.fontMetrics = {
          fontSize: titleSize * 1.15,
          lineCount: wrappedTitle.length,
          titleHeight: titleHeight
        };
      }

      // Summary
      const summaryText = getClampedSummary();
      if (summaryText) {
        ctx.fillStyle = '#e4e4e7';
        ctx.font = `300 ${summarySize}px ${fontPreference}`;
        const wrappedSummary = this.wrapTextWithParagraphs(ctx, summaryText, width - s * 80);
        let summaryY = curY + s * 4;
        for (let i = 0; i < Math.min(wrappedSummary.length, 3); i++) {
          ctx.fillText(wrappedSummary[i], width / 2, summaryY);
          summaryY += summarySize * 1.4;
        }
      }

      // Footer
      const footY = height - padding - s * 26;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#fbbf24';
      ctx.font = `bold ${s * 8}px ${fontPreference}`;
      
      let metaStr = '';
      if (settings.showLocation && settings.customLocation) {
        metaStr += settings.customLocation;
      }
      if (settings.showAuthor && settings.customAuthor) {
        metaStr += (metaStr ? '  •  ' : '') + `প্রতিবেদক: ${settings.customAuthor}`;
      }
      ctx.fillText(metaStr || 'প্রকাশনা', padding + s * 8, footY + s * 12);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = `${s * 7}px 'JetBrains Mono', monospace`;
      const dateStr = (settings.showWeb !== false)
        ? `http://ssfmym.pro.bd/ / ${settings.customDate || 'JULY 2026'}`
        : `${settings.customDate || 'JULY 2026'}`;
      ctx.fillText(dateStr, padding + s * 8, footY + s * 22);

      // QR Code
      if (settings.showQR) {
        const qrSize = s * 32;
        const qrX = width - padding - s * 36;
        const qrY = footY - s * 2;

        ctx.fillStyle = '#ffffff';
        this.fillRoundedRect(ctx, qrX - s * 2, qrY - s * 2, qrSize + s * 4, qrSize + s * 4, s * 2);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = s * 1;
        this.strokeRoundedRect(ctx, qrX - s * 2, qrY - s * 2, qrSize + s * 4, qrSize + s * 4, s * 2);

        const canonicalUrl = `${window.location.origin}/?tab=news&newsId=${item.id}`;
        await QRCodeRenderer.drawQRCode(ctx, canonicalUrl, qrX, qrY, qrSize, '#000000', '#ffffff');

        // Text alongside QR code
        ctx.fillStyle = '#fbbf24';
        ctx.font = `900 ${s * 7}px ${fontPreference}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('SCAN TO READ', qrX - s * 6, qrY + s * 10);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = `${s * 5.5}px 'JetBrains Mono', monospace`;
        ctx.fillText('OFFICIAL LINK', qrX - s * 6, qrY + s * 18);
      }

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('footer');
        diagnostics.objectCoordinates['footer'] = { x: padding, y: footY, w: width - 2 * padding, h: s * 26 };
      }

      ctx.restore();
    }

    // ==========================================
    // 3. CINEMATIC BACKGROUND MEDIA POSTS
    // ==========================================
    else if (tag === 'SOCIAL_SQ' || tag === 'AWARENESS' || tag === 'EVENT_COV' || tag === 'STUDENT_ACT') {
      ctx.save();

      const isBrightTheme = settings.bgTheme === 'light';
      const cardBg = isBrightTheme ? '#faf6ee' : '#0b0f19';
      const cardText = isBrightTheme ? '#090d16' : '#ffffff';
      const cardMuted = isBrightTheme ? '#334155' : '#94a3b8';

      // Background draw
      if (featuredImg) {
        const fit = ImageLoader.calculateFit(featuredImg.width, featuredImg.height, 0, 0, width, height, true);
        ctx.drawImage(featuredImg, fit.x, fit.y, fit.width, fit.height);

        // Vignette gradient shading
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        if (isBrightTheme) {
          grad.addColorStop(0, 'rgba(250, 246, 238, 0.1)');
          grad.addColorStop(0.5, 'rgba(250, 246, 238, 0.82)');
          grad.addColorStop(1, 'rgba(250, 246, 238, 1)');
        } else {
          grad.addColorStop(0, 'rgba(9, 13, 22, 0.1)');
          grad.addColorStop(0.5, 'rgba(9, 13, 22, 0.85)');
          grad.addColorStop(1, 'rgba(9, 13, 22, 1)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        if (diagnostics) {
          diagnostics.imageBounds = { x: 0, y: 0, w: width, h: height };
        }
      } else {
        ctx.fillStyle = cardBg;
        ctx.fillRect(0, 0, width, height);
      }

      // Accent border
      if (settings.borderStyle === 'neon-glow') {
        ctx.strokeStyle = settings.accentColor;
        ctx.lineWidth = s * 1.5;
        ctx.shadowColor = settings.accentColor;
        ctx.shadowBlur = s * 8;
        ctx.strokeRect(s * 6, s * 6, width - s * 12, height - s * 12);
        ctx.shadowBlur = 0; // reset
      } else if (settings.borderStyle === 'thin-red') {
        ctx.strokeStyle = settings.accentColor;
        ctx.lineWidth = s * 1.2;
        ctx.strokeRect(s * 5, s * 5, width - s * 10, height - s * 10);
      }

      // Overlaid Brand Header strip
      const stripY = s * 14;
      const stripH = s * 32;
      const stripW = width - padding * 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      this.fillRoundedRect(ctx, padding, stripY, stripW, stripH, s * 6);
      this.strokeRoundedRect(ctx, padding, stripY, stripW, stripH, s * 6);

      // Header inside logo & title
      let logoX = padding + s * 8;
      if (settings.showLogo && logo1) {
        ctx.drawImage(logo1, logoX, stripY + s * 6, s * 20, s * 20);
        logoX += s * 26;
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${s * 10}px ${fontPreference}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('সমাজতান্ত্রিক ছাত্র ফ্রন্ট', logoX, stripY + s * 6);

      ctx.fillStyle = '#fbbf24'; // amber-400
      ctx.font = `bold ${s * 6.5}px ${fontPreference}`;
      ctx.fillText('ময়মনসিংহ জেলা শাখা', logoX, stripY + s * 18);

      // Category badge in strip
      if (settings.showCategory && settings.customCategory) {
        ctx.fillStyle = '#B3002D';
        ctx.font = `bold ${s * 7.5}px ${fontPreference}`;
        const catW = ctx.measureText(settings.customCategory.toUpperCase()).width + s * 10;
        this.fillRoundedRect(ctx, width - padding - s * 10 - catW, stripY + s * 7, catW, s * 18, s * 1.5);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(settings.customCategory.toUpperCase(), width - padding - s * 10 - catW / 2, stripY + s * 16);
      }

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('header');
        diagnostics.objectCoordinates['header'] = { x: padding, y: stripY, w: stripW, h: stripH };
      }

      // Slogan banner
      if (settings.customSlogan) {
        ctx.fillStyle = settings.accentColor;
        ctx.font = `bold ${s * 8.5}px ${fontPreference}`;
        const sloganW = ctx.measureText(settings.customSlogan).width + s * 20;
        const bannerX = width / 2 - sloganW / 2;
        const bannerY = stripY + stripH + s * 8;
        this.fillRoundedRect(ctx, bannerX, bannerY, sloganW, s * 16, s * 8);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(settings.customSlogan, width / 2, bannerY + s * 8);
      }

      // Floating Lower-Third Content Section
      const contentY = height - padding - s * 110;
      let curDrawY = contentY;

      ctx.fillStyle = cardText;
      ctx.font = `bold ${titleSize * 1.08}px ${fontPreference}`;
      ctx.textBaseline = 'top';
      
      const wrappedTitle = this.wrapTextWithParagraphs(ctx, settings.customTitle, width - padding * 2);
      let alignX = padding;
      if (settings.textAlignment === 'center') {
        alignX = width / 2;
        ctx.textAlign = 'center';
      } else if (settings.textAlignment === 'right') {
        alignX = width - padding;
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'left';
      }

      for (let i = 0; i < Math.min(wrappedTitle.length, 2); i++) {
        ctx.fillText(wrappedTitle[i], alignX, curDrawY);
        curDrawY += titleSize * 1.25;
      }

      // Metadata tags
      let metaStr = '';
      if (settings.showLocation && settings.customLocation) {
        metaStr += `📍 ${settings.customLocation}  •  `;
      }
      if (settings.showAuthor && settings.customAuthor) {
        metaStr += `✍️ ${settings.customAuthor}  •  `;
      }
      if (settings.showDate && settings.customDate) {
        metaStr += `${settings.customDate}  •  `;
      }
      if (settings.showReadingTime) {
        metaStr += `${getReadingTime()}`;
      }
      if (metaStr.endsWith('  •  ')) {
        metaStr = metaStr.slice(0, -5);
      }

      if (metaStr) {
        ctx.fillStyle = cardMuted;
        ctx.font = `bold ${s * 8}px ${fontPreference}`;
        ctx.fillText(metaStr, alignX, curDrawY + s * 4);
        curDrawY += s * 14;
      }

      // Accent visual divider line
      ctx.fillStyle = '#e11d48'; // red
      const dividerW = s * 24;
      const dividerX = settings.textAlignment === 'center' ? (width / 2 - dividerW / 2) :
                       settings.textAlignment === 'right' ? (width - padding - dividerW) : padding;
      ctx.fillRect(dividerX, curDrawY + s * 2, dividerW, s * 2);
      curDrawY += s * 8;

      // Summary
      const summaryText = getClampedSummary();
      if (summaryText) {
        ctx.fillStyle = cardText;
        ctx.font = `${summarySize}px ${fontPreference}`;
        const wrappedSummary = this.wrapTextWithParagraphs(ctx, summaryText, width - padding * 2);
        for (let i = 0; i < Math.min(wrappedSummary.length, 3); i++) {
          ctx.fillText(wrappedSummary[i], alignX, curDrawY);
          curDrawY += summarySize * 1.4;
        }
      }

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('title');
        diagnostics.objectCoordinates['title'] = { x: padding, y: contentY, w: width - padding * 2, h: curDrawY - contentY };
      }

      // Footer
      if (settings.showFooter) {
        const footY = height - padding - s * 20;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, footY);
        ctx.lineTo(width - padding, footY);
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${s * 8}px ${fontPreference}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('সমাজতান্ত্রিক ছাত্র ফ্রন্ট', padding, footY + s * 6);

        if (settings.showWeb !== false) {
          ctx.fillStyle = cardMuted;
          ctx.font = `${s * 6.5}px 'JetBrains Mono', monospace`;
          ctx.fillText(`http://ssfmym.pro.bd/post/${item.id.slice(0, 8)}`, padding, footY + s * 15);
        }

        // QR Code
        if (settings.showQR) {
          const qrSize = s * 24;
          const qrX = width - padding - s * 24;
          const qrY = footY + s * 4;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(qrX - s * 1, qrY - s * 1, qrSize + s * 2, qrSize + s * 2);

          const canonicalUrl = `${window.location.origin}/?tab=news&newsId=${item.id}`;
          await QRCodeRenderer.drawQRCode(ctx, canonicalUrl, qrX, qrY, qrSize, '#000000', '#ffffff');
        }

        if (diagnostics) {
          diagnostics.objectCount++;
          diagnostics.layerOrder.push('footer');
          diagnostics.objectCoordinates['footer'] = { x: padding, y: footY, w: width - 2 * padding, h: s * 20 };
        }
      }

      ctx.restore();
    }

    // ==========================================
    // 4. ASYMMETRIC EDITORIAL SPREAD LAYOUT
    // ==========================================
    else if (tag === 'MINIMAL' || tag === 'LIBRARY' || tag === 'RESEARCH' || tag === 'INSIGHTS') {
      ctx.save();

      const isDark = settings.bgTheme === 'dark';
      const isCream = settings.bgTheme === 'cream';
      const cardBg = isDark ? '#0b0f19' : isCream ? '#fdfbf7' : '#ffffff';
      const cardText = isDark ? '#ffffff' : '#090d16';
      const cardMuted = isDark ? '#94a3b8' : isCream ? '#854d0e' : '#475569';

      ctx.fillStyle = cardBg;
      ctx.fillRect(0, 0, width, height);

      // Gridline decorations
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = s * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.25);
      ctx.lineTo(width, height * 0.25);
      ctx.moveTo(width * 0.33, 0);
      ctx.lineTo(width * 0.33, height);
      ctx.stroke();

      // Brand Header
      const headerY = padding;
      ctx.strokeStyle = `${settings.accentColor}40`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, headerY + s * 28);
      ctx.lineTo(width - padding, headerY + s * 28);
      ctx.stroke();

      let textX = padding;
      if (settings.showLogo && logo1) {
        ctx.drawImage(logo1, padding, headerY, s * 22, s * 22);
        textX += s * 28;
      }

      ctx.fillStyle = '#B3002D';
      ctx.font = `bold ${s * 11}px ${fontPreference}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('সমাজতান্ত্রিক ছাত্র ফ্রন্ট', textX, headerY);

      ctx.fillStyle = cardMuted;
      ctx.font = `bold ${s * 7}px 'JetBrains Mono', monospace`;
      ctx.fillText('EDITORIAL BULLETIN • MYMENSINGH', textX, headerY + s * 12);

      // Category badge
      if (settings.showCategory && settings.customCategory) {
        ctx.fillStyle = cardText;
        ctx.font = `bold ${s * 7.5}px ${fontPreference}`;
        const catW = ctx.measureText(settings.customCategory).width + s * 10;
        ctx.strokeStyle = `${settings.accentColor}25`;
        this.strokeRoundedRect(ctx, width - padding - catW, headerY, catW, s * 14, s * 1.5);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(settings.customCategory, width - padding - catW / 2, headerY + s * 7);
      }

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('header');
        diagnostics.objectCoordinates['header'] = { x: padding, y: headerY, w: width - 2 * padding, h: s * 28 };
      }

      // Slogan bar
      if (settings.customSlogan) {
        ctx.fillStyle = isDark ? '#111827' : '#f3f4f6';
        ctx.fillRect(padding, headerY + s * 34, width - padding * 2, s * 16);
        ctx.strokeStyle = `${settings.accentColor}15`;
        ctx.strokeRect(padding, headerY + s * 34, width - padding * 2, s * 16);

        ctx.fillStyle = cardMuted;
        ctx.font = `bold ${s * 8}px ${fontPreference}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(settings.customSlogan, width / 2, headerY + s * 42);
      }

      // Columns split
      const isSplit = (settings.imagePosition === 'left' || settings.imagePosition === 'right' || settings.imagePosition === 'top') && featuredImg;
      let leftBox = { x: padding, y: headerY + s * 60, w: width - padding * 2, h: height * 0.5 };
      let rightBox = { x: padding, y: headerY + s * 60, w: width - padding * 2, h: height * 0.5 };

      if (isSplit) {
        const imgW = width * 0.42;
        const textW = width - imgW - padding * 2 - s * 14;

        if (settings.imagePosition === 'left' || settings.imagePosition === 'top') {
          // Left split
          leftBox = { x: padding, y: headerY + s * 64, w: imgW, h: s * 140 };
          rightBox = { x: padding + imgW + s * 14, y: headerY + s * 64, w: textW, h: s * 140 };
        } else {
          // Right split
          rightBox = { x: padding, y: headerY + s * 64, w: textW, h: s * 140 };
          leftBox = { x: padding + textW + s * 14, y: headerY + s * 64, w: imgW, h: s * 140 };
        }

        // Draw image frame
        ctx.fillStyle = isDark ? '#111827' : '#ffffff';
        this.fillRoundedRect(ctx, leftBox.x, leftBox.y, leftBox.w, leftBox.h, s * 3);
        ctx.strokeStyle = `${settings.accentColor}20`;
        this.strokeRoundedRect(ctx, leftBox.x, leftBox.y, leftBox.w, leftBox.h, s * 3);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(leftBox.x + s * 2, leftBox.y + s * 2, leftBox.w - s * 4, leftBox.h - s * 4, s * 2);
        ctx.clip();

        const fit = ImageLoader.calculateFit(featuredImg.width, featuredImg.height, leftBox.x + s * 2, leftBox.y + s * 2, leftBox.w - s * 4, leftBox.h - s * 4, true);
        ctx.drawImage(featuredImg, fit.x, fit.y, fit.width, fit.height);
        ctx.restore();

        if (diagnostics) {
          diagnostics.imageBounds = leftBox;
        }
      }

      // Draw Headline & copy text inside rightBox
      ctx.save();
      let copyY = rightBox.y;

      ctx.fillStyle = cardText;
      ctx.font = `bold ${titleSize * 1.05}px ${fontPreference}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const wrappedTitle = this.wrapTextWithParagraphs(ctx, settings.customTitle, rightBox.w);
      for (let i = 0; i < Math.min(wrappedTitle.length, 2); i++) {
        ctx.fillText(wrappedTitle[i], rightBox.x, copyY);
        copyY += titleSize * 1.25;
      }

      // Red line accent bar
      ctx.fillStyle = '#B3002D';
      ctx.fillRect(rightBox.x, copyY + s * 3, s * 16, s * 1.5);
      copyY += s * 8;

      // Metadata details
      let metaStr = '';
      if (settings.showLocation && settings.customLocation) {
        metaStr += `${settings.customLocation.toUpperCase()} / `;
      }
      if (settings.showAuthor && settings.customAuthor) {
        metaStr += `${settings.customAuthor} / `;
      }
      if (settings.showDate && settings.customDate) {
        metaStr += `${settings.customDate}`;
      }
      if (metaStr.endsWith(' / ')) {
        metaStr = metaStr.slice(0, -3);
      }

      if (metaStr) {
        ctx.fillStyle = cardMuted;
        ctx.font = `bold ${s * 7.5}px ${fontPreference}`;
        ctx.fillText(metaStr, rightBox.x, copyY);
        copyY += s * 12;
      }

      // Summary copy
      const summaryText = getClampedSummary();
      if (summaryText) {
        ctx.fillStyle = cardMuted;
        ctx.font = `${summarySize}px ${fontPreference}`;
        const wrappedSummary = this.wrapTextWithParagraphs(ctx, summaryText, rightBox.w);
        for (let i = 0; i < Math.min(wrappedSummary.length, 4); i++) {
          ctx.fillText(wrappedSummary[i], rightBox.x, copyY);
          copyY += summarySize * 1.4;
        }
      }

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('title');
        diagnostics.objectCoordinates['title'] = { x: rightBox.x, y: rightBox.y, w: rightBox.w, h: copyY - rightBox.y };
      }

      ctx.restore();

      // Footer
      if (settings.showFooter) {
        const footY = height - padding - s * 24;
        ctx.strokeStyle = `${settings.accentColor}15`;
        ctx.beginPath();
        ctx.moveTo(padding, footY);
        ctx.lineTo(width - padding, footY);
        ctx.stroke();

        ctx.fillStyle = '#B3002D';
        ctx.font = `bold ${s * 8}px ${fontPreference}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('সমাজতান্ত্রিক ছাত্র ফ্রন্ট', padding, footY + s * 6);

        ctx.fillStyle = cardMuted;
        ctx.font = `${s * 6.5}px 'JetBrains Mono', monospace`;
        const footerSubText = (settings.showWeb !== false)
          ? `mymensingh-branch // http://ssfmym.pro.bd/`
          : `mymensingh-branch`;
        ctx.fillText(footerSubText, padding, footY + s * 15);

        // QR Code with details alongside
        if (settings.showQR) {
          const qrSize = s * 30;
          const qrX = width - padding - s * 30;
          const qrY = footY + s * 4;

          ctx.fillStyle = '#ffffff';
          this.fillRoundedRect(ctx, qrX - s * 1, qrY - s * 1, qrSize + s * 2, qrSize + s * 2, s * 1);
          ctx.strokeStyle = `${settings.accentColor}15`;
          this.strokeRoundedRect(ctx, qrX - s * 1, qrY - s * 1, qrSize + s * 2, qrSize + s * 2, s * 1);

          const canonicalUrl = `${window.location.origin}/?tab=news&newsId=${item.id}`;
          await QRCodeRenderer.drawQRCode(ctx, canonicalUrl, qrX, qrY, qrSize, '#000000', '#ffffff');

          // Text labels
          ctx.fillStyle = '#B3002D';
          ctx.font = `900 ${s * 6.5}px ${fontPreference}`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText('SCAN AND VERIFY', qrX - s * 6, qrY + s * 10);
          ctx.fillStyle = cardMuted;
          ctx.font = `${s * 5.5}px 'JetBrains Mono', monospace`;
          ctx.fillText('ARCHIVAL RECORD', qrX - s * 6, qrY + s * 18);
        }

        if (diagnostics) {
          diagnostics.objectCount++;
          diagnostics.layerOrder.push('footer');
          diagnostics.objectCoordinates['footer'] = { x: padding, y: footY, w: width - 2 * padding, h: s * 24 };
        }
      }

      ctx.restore();
    }

    // ==========================================
    // 5. OFFICIAL PROCLAMATION & STATEMENT
    // ==========================================
    else {
      ctx.save();

      const isDark = settings.bgTheme === 'dark';
      const cardBg = isDark ? '#090d16' : '#faf6ee';
      const cardText = isDark ? '#ffffff' : '#1c1917';
      const cardMuted = isDark ? '#94a3b8' : '#57534e';

      ctx.fillStyle = cardBg;
      ctx.fillRect(0, 0, width, height);

      // Classic Double Art Frame
      ctx.strokeStyle = settings.accentColor;
      ctx.lineWidth = s * 4;
      ctx.strokeRect(s * 6, s * 6, width - s * 12, height - s * 12);

      ctx.lineWidth = s * 0.8;
      ctx.globalAlpha = 0.6;
      ctx.strokeRect(s * 13, s * 13, width - s * 26, height - s * 26);
      ctx.globalAlpha = 1.0;

      // Crest Header
      const headerY = s * 14;
      if (settings.showLogo && logo1) {
        ctx.fillStyle = '#ffffff';
        this.fillRoundedRect(ctx, width / 2 - s * 17, headerY, s * 34, s * 34, s * 17);
        ctx.strokeStyle = `${settings.accentColor}25`;
        ctx.lineWidth = 1;
        this.strokeRoundedRect(ctx, width / 2 - s * 17, headerY, s * 34, s * 34, s * 17);
        ctx.drawImage(logo1, width / 2 - s * 13, headerY + s * 4, s * 26, s * 26);
      }

      ctx.fillStyle = '#B3002D';
      ctx.font = `bold ${s * 13}px ${fontPreference}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('সমাজতান্ত্রিক ছাত্র ফ্রন্ট', width / 2, headerY + s * 40);

      ctx.fillStyle = settings.accentColor;
      ctx.font = `bold ${s * 7.5}px ${fontPreference}`;
      ctx.fillText('ময়মনসিংহ জেলা শাখা', width / 2, headerY + s * 52);

      // Decorative Divider flourish
      ctx.fillStyle = '#B3002D';
      ctx.strokeStyle = '#B3002D';
      ctx.lineWidth = s * 0.5;
      ctx.beginPath();
      ctx.moveTo(width * 0.35, headerY + s * 64);
      ctx.lineTo(width * 0.65, headerY + s * 64);
      ctx.stroke();
      
      ctx.font = `${s * 6}px sans-serif`;
      ctx.fillText('❈', width / 2, headerY + s * 61);

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('header');
        diagnostics.objectCoordinates['header'] = { x: width * 0.3, y: headerY, w: width * 0.4, h: s * 70 };
      }

      // Proclamation Content panel
      const panelY = headerY + s * 78;
      let curY = panelY;

      // Category badge
      if (settings.showCategory && settings.customCategory) {
        ctx.fillStyle = '#B3002D';
        ctx.font = `bold ${s * 8}px ${fontPreference}`;
        const catW = ctx.measureText(settings.customCategory.toUpperCase()).width + s * 16;
        ctx.strokeStyle = `${settings.accentColor}20`;
        this.strokeRoundedRect(ctx, width / 2 - catW / 2, curY, catW, s * 16, s * 2);
        
        ctx.textBaseline = 'middle';
        ctx.fillText(settings.customCategory.toUpperCase(), width / 2, curY + s * 8);
        curY += s * 24;
      }

      // Title Large Headline
      ctx.fillStyle = settings.accentColor;
      ctx.font = `bold ${titleSize}px ${fontPreference}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const wrappedTitle = this.wrapTextWithParagraphs(ctx, settings.customTitle, width - s * 64);
      let titleHeight = 0;
      for (let i = 0; i < Math.min(wrappedTitle.length, 3); i++) {
        ctx.fillText(wrappedTitle[i], width / 2, curY);
        curY += titleSize * 1.25;
        titleHeight += titleSize * 1.25;
      }

      // Formal divider
      ctx.fillStyle = '#B3002D';
      ctx.fillRect(width / 2 - s * 16, curY + s * 4, s * 32, s * 2);
      curY += s * 12;

      // Announcement summary body
      const summaryText = getClampedSummary();
      if (summaryText) {
        ctx.fillStyle = cardText;
        ctx.font = `${summarySize}px ${fontPreference}`;
        const wrappedSummary = this.wrapTextWithParagraphs(ctx, summaryText, width - s * 100);
        for (let i = 0; i < Math.min(wrappedSummary.length, 6); i++) {
          ctx.fillText(wrappedSummary[i], width / 2, curY);
          curY += summarySize * 1.4;
        }
      }

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('title');
        diagnostics.objectCoordinates['title'] = { x: s * 32, y: panelY, w: width - s * 64, h: curY - panelY };
        diagnostics.fontMetrics = {
          fontSize: titleSize,
          lineCount: wrappedTitle.length,
          titleHeight: titleHeight
        };
      }

      // Optional central visual image (inside proclamation)
      if (featuredImg && settings.imagePosition !== 'hidden') {
        const imgW = width * 0.45;
        const imgH = s * 70;
        const imgX = width / 2 - imgW / 2;
        const imgY = curY + s * 6;

        ctx.fillStyle = '#ffffff';
        this.fillRoundedRect(ctx, imgX, imgY, imgW, imgH, s * 2);
        ctx.strokeStyle = `${settings.accentColor}15`;
        this.strokeRoundedRect(ctx, imgX, imgY, imgW, imgH, s * 2);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imgX + s * 1.5, imgY + s * 1.5, imgW - s * 3, imgH - s * 3, s * 1);
        ctx.clip();

        const fit = ImageLoader.calculateFit(featuredImg.width, featuredImg.height, imgX + s * 1.5, imgY + s * 1.5, imgW - s * 3, imgH - s * 3, true);
        ctx.drawImage(featuredImg, fit.x, fit.y, fit.width, fit.height);
        ctx.restore();

        if (diagnostics) {
          diagnostics.imageBounds = { x: imgX, y: imgY, w: imgW, h: imgH };
        }
      }

      // Authorized Signoff footer block
      const footY = height - padding - s * 28;
      ctx.strokeStyle = `${settings.accentColor}20`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding + s * 8, footY);
      ctx.lineTo(width - padding - s * 8, footY);
      ctx.stroke();

      // Signoff metadata
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = cardText;
      ctx.font = `bold ${s * 8}px ${fontPreference}`;

      let signY = footY + s * 6;
      if (settings.showAuthor && settings.customAuthor) {
        ctx.fillText(`অনুমোদিত: ${settings.customAuthor}`, padding + s * 8, signY);
        signY += s * 10;
      }
      if (settings.showLocation && settings.customLocation) {
        ctx.fillStyle = cardMuted;
        ctx.fillText(`স্থান: ${settings.customLocation}`, padding + s * 8, signY);
        signY += s * 10;
      }
      if (settings.showDate && settings.customDate) {
        ctx.fillStyle = cardMuted;
        ctx.font = `${s * 7.5}px 'JetBrains Mono', monospace`;
        ctx.fillText(settings.customDate, padding + s * 8, signY);
      }

      // QR Code
      if (settings.showQR) {
        const qrSize = s * 34;
        const qrX = width - padding - s * 42;
        const qrY = footY + s * 6;

        ctx.fillStyle = '#ffffff';
        this.fillRoundedRect(ctx, qrX - s * 1.5, qrY - s * 1.5, qrSize + s * 3, qrSize + s * 3, s * 2);
        ctx.strokeStyle = `${settings.accentColor}25`;
        this.strokeRoundedRect(ctx, qrX - s * 1.5, qrY - s * 1.5, qrSize + s * 3, qrSize + s * 3, s * 2);

        const canonicalUrl = `${window.location.origin}/?tab=news&newsId=${item.id}`;
        await QRCodeRenderer.drawQRCode(ctx, canonicalUrl, qrX, qrY, qrSize, '#000000', '#ffffff');
      }

      if (diagnostics) {
        diagnostics.objectCount++;
        diagnostics.layerOrder.push('footer');
        diagnostics.objectCoordinates['footer'] = { x: padding, y: footY, w: width - 2 * padding, h: s * 28 };
      }

      ctx.restore();
    }
  }
}
