import { ThemeManager, ThemeConfig } from './ThemeManager';
import { FontLoader } from './FontLoader';
import { ImageLoader } from './ImageLoader';
import { LayerManager, RenderItem, RenderSettings, DrawDiagnostics } from './LayerManager';
import { ExportManager } from './ExportManager';
import { DownloadManager } from './DownloadManager';
import { MemoryManager } from './MemoryManager';
import { RenderDebugger } from './RenderDebugger';
import { CanvasTaintInspector } from './CanvasTaintInspector';

export class CanvasRenderer {
  /**
   * Universal core renderer for creating high resolution photo cards with strict memory limits
   */
  public static async renderPhotoCard(
    item: RenderItem,
    settings: RenderSettings,
    exportScale = 1.0, // 1x, 2x, 3x, 4x Retina high DPI equivalent
    diagnostics?: DrawDiagnostics
  ): Promise<HTMLCanvasElement> {
    const startTime = Date.now();
    
    // 1. Initialize Render Debugger snapshot and CanvasTaintInspector
    RenderDebugger.reset(item.image || '');
    RenderDebugger.update({ renderStatus: 'pending' });
    CanvasTaintInspector.reset();

    // Register Font asset
    CanvasTaintInspector.register({
      name: 'বাংলা ও ইংরেজি ফন্ট (Inter & Noto Sans Bengali)',
      type: 'font',
      originalUrl: 'Google Fonts',
      resolvedUrl: 'Document loaded fonts',
      isSameOrigin: true,
      isCorsEnabled: true,
      loaded: true,
      decoded: true,
    });

    // 2. Load fonts and wait for readiness
    await FontLoader.loadFonts();

    // 3. Compute Target Canvas Dimensions based on Aspect Ratio
    let baseWidth = 1080;
    let baseHeight = 1080;

    switch (settings.aspectRatio) {
      case '4:5':
        baseHeight = 1350;
        break;
      case '9:16':
        baseHeight = 1920;
        break;
      case '16:9':
        baseHeight = 607;
        break;
      case '1200x630':
        baseWidth = 1200;
        baseHeight = 630;
        break;
      case '1920x1080':
        baseWidth = 1920;
        baseHeight = 1080;
        break;
      case '1600x900':
        baseWidth = 1600;
        baseHeight = 900;
        break;
      case 'A4 Portrait':
        baseWidth = 1240;
        baseHeight = 1754;
        break;
      case 'A4 Landscape':
        baseWidth = 1754;
        baseHeight = 1240;
        break;
      case '1:1':
      default:
        baseWidth = 1080;
        baseHeight = 1080;
        break;
    }

    // 4. Memory Management: Estimate and downscale dimensions if they exceed hardware safety margins
    const safetyResult = MemoryManager.getSafeCanvasDimensions(baseWidth, baseHeight, exportScale);
    const width = safetyResult.width;
    const height = safetyResult.height;
    const actualScale = safetyResult.scale;

    if (safetyResult.isAdjusted) {
      console.warn(`[CanvasRenderer] Memory ceiling triggered: Scaling export down. Reason: ${safetyResult.reason}`);
    }

    // 5. Create canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      RenderDebugger.update({ renderStatus: 'failed' });
      throw new Error('Could not obtain 2D canvas context');
    }

    // Apply scaling to 2D context so drawing functions use coordinates relative to base size
    ctx.scale(actualScale, actualScale);

    // 6. Resolve Theme settings
    const theme: ThemeConfig = ThemeManager.getTheme(settings.bgTheme, settings.accentColor);

    // 7. Load all assets in parallel to boost performance
    const logo1Promise = ImageLoader.loadImage('https://i.ibb.co.com/F4MKM3R2/20260527-055637.png', false, 'বাম লোগো (Left Logo)');
    const logo2Promise = ImageLoader.loadImage('https://i.ibb.co/R4BCPZ0B/20250130-143124.png', false, 'ডান লোগো (Right Logo)');
    
    // Feature image marked as true to capture loading diagnostics
    const featuredImgPromise = settings.imagePosition !== 'hidden' && item.image
      ? ImageLoader.loadImage(item.image, true, 'ফিচার্ড ইমেজ (Featured Image)')
      : Promise.resolve(null);

    const [logo1, logo2, featuredImg] = await Promise.all([
      logo1Promise,
      logo2Promise,
      featuredImgPromise
    ]);

    // 8. Draw background layer with custom style
    ThemeManager.drawBackground(ctx, baseWidth, baseHeight, settings.bgTheme, settings.bgStyle, theme);

    // 9. Draw all overlay layers and text elements
    await LayerManager.drawLayers(
      ctx,
      baseWidth,
      baseHeight,
      item,
      settings,
      theme,
      logo1 as any,
      logo2 as any,
      featuredImg as any,
      diagnostics
    );

    // 10. Draw border overlay on top of everything
    ThemeManager.drawBorder(ctx, baseWidth, baseHeight, settings.borderStyle, settings.accentColor, theme.borderColor);

    // 11. Log render metrics to Debugger
    const renderDuration = Date.now() - startTime;
    RenderDebugger.update({
      renderStatus: 'success',
      canvasWidth: width,
      canvasHeight: height,
      finalResolution: `${width}x${height}`,
      memoryUsage: RenderDebugger.estimateMemoryUsage(width, height),
      renderTime: renderDuration
    });

    return canvas;
  }

  /**
   * Safe export flow featuring CanvasTaintInspector instead of retry logic.
   */
  public static async exportAndDownload(
    item: RenderItem,
    settings: RenderSettings,
    format: 'png' | 'jpeg' | 'webp' | 'pdf',
    scaleOption: 'normal' | 'retina' | '4k'
  ): Promise<void> {
    let scale = 1.0;
    if (scaleOption === 'retina') scale = 2.0;
    else if (scaleOption === '4k') scale = 3.5;

    const filename = `SSF_PhotoCard_${item.id}_${Date.now()}.${format}`;

    console.log(`[CanvasRenderer] Rendering PhotoCard with Taint Inspection...`);
    
    // 1. Render the canvas safely
    let canvas = await this.renderPhotoCard(item, settings, scale);

    // 2. Taint inspection and auto-repair
    const unsafe = CanvasTaintInspector.getUnsafeAssets();
    if (unsafe.length > 0) {
      console.warn(`[CanvasRenderer] ${unsafe.length} unsafe asset(s) detected. Running automatic repair...`);
      const fixedCount = CanvasTaintInspector.autoFixUnsafeAssets();
      if (fixedCount > 0) {
        console.log(`[CanvasRenderer] Re-rendering card after automatic asset repair...`);
        canvas = await this.renderPhotoCard(item, settings, scale);
      }
    }

    // 3. Final safety verification before calling export methods
    const finalUnsafe = CanvasTaintInspector.getUnsafeAssets();
    if (finalUnsafe.length > 0) {
      const names = finalUnsafe.map(u => u.name).join(', ');
      throw new Error(`নিরাপত্তা ত্রুটি: নিম্নোক্ত ফাইলগুলোর কারণে ক্যানভাসটি এক্সপোর্ট করা যাচ্ছে না: ${names}। দয়া করে নিশ্চিত করুন সবগুলো ছবি সঠিক সিকিউর প্রক্সির মাধ্যমে লোড হয়েছে।`);
    }

    // 4. Export and validate image blobs / pdf instances
    const exportStart = Date.now();
    const exportResult = await ExportManager.exportAndValidate(canvas, format, filename);
    const exportDuration = Date.now() - exportStart;

    // Update export time and blob size
    RenderDebugger.update({
      exportTime: exportDuration,
      blobSize: exportResult instanceof Blob ? exportResult.size : 0
    });

    // 5. Trigger download safely using DownloadManager
    DownloadManager.download(exportResult, filename);

    // 6. Memory cleanup
    canvas.width = 0;
    canvas.height = 0;
  }
}
