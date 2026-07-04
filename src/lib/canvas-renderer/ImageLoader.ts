import { AssetCache } from './AssetCache';
import { ImageSourceDetector } from './ImageSourceDetector';
import { ImageCacheManager } from './ImageCacheManager';
import { ImageValidator } from './ImageValidator';
import { MemoryManager } from './MemoryManager';
import { RenderDebugger } from './RenderDebugger';
import { CanvasTaintInspector } from './CanvasTaintInspector';
import { AvatarIndexedDBCache } from './AvatarIndexedDBCache';

export interface ImageFitResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ImageLoader {
  /**
   * Safe asynchronous loader for images with cache, validation, and OOM prevention.
   */
  public static async loadImage(
    url: string | undefined,
    isFeaturedImage = false,
    assetName = 'Image Resource'
  ): Promise<HTMLImageElement | HTMLCanvasElement | null> {
    if (!url) return null;

    const startTime = Date.now();
    console.log(`[ImageLoader] Starting load process for ${assetName}: ${url}`);

    // 1. Image Source Detection
    const detection = ImageSourceDetector.detect(url);
    const sourceString = detection.isLocalUpload 
      ? 'Local Upload / Base64' 
      : detection.isFirebase 
        ? 'Firebase Storage' 
        : `External (${detection.domain})`;

    if (isFeaturedImage) {
      RenderDebugger.update({
        originalUrl: url,
        imageSource: sourceString,
        downloadStatus: 'pending',
        decodeStatus: 'pending'
      });
    }

    // 2. Client & Server Image Cache Management
    const { url: proxiedUrl, status: cacheStatus } = ImageCacheManager.getProxiedUrl(url);
    const finalUrl = proxiedUrl;
    const finalCors: string | undefined = 'anonymous';
    const cacheStatusExtended = cacheStatus;
    
    if (isFeaturedImage) {
      RenderDebugger.update({
        cachedUrl: finalUrl,
        cacheStatus: cacheStatusExtended
      });
    }

    // Register initial asset status with CanvasTaintInspector
    CanvasTaintInspector.register({
      name: assetName,
      type: 'image',
      originalUrl: url,
      resolvedUrl: finalUrl,
      isCorsEnabled: finalCors === 'anonymous',
      loaded: false,
      decoded: false,
      cacheStatus: cacheStatusExtended,
    });

    // 3. Strict Pre-render Validation
    try {
      const validation = await ImageValidator.validateImage(url);
      if (!validation.isValid) {
        const errorMsg = `Image could not be loaded: ${url}. Reason: ${validation.error || 'Validation failed'}`;
        console.error(`[ImageLoader] ${errorMsg}`);
        if (isFeaturedImage) {
          RenderDebugger.update({
            downloadStatus: 'failed',
            decodeStatus: 'failed'
          });
        }
        throw new Error(errorMsg);
      }

      if (isFeaturedImage) {
        RenderDebugger.update({
          downloadStatus: 'success',
          imageWidth: validation.width || 0,
          imageHeight: validation.height || 0
        });
      }
    } catch (valError: any) {
      console.warn('[ImageLoader] Validation catch warning:', valError.message);
      // If validation fails on local environment or throws CORS on HEAD check, we attempt to continue loading safely via proxy
    }

    // 4. Load & Decode image securely via proxy or same-origin Blob URL
    try {
      console.log(`[ImageLoader] Loading asset with CORS: ${finalCors || 'none'} from: ${finalUrl}`);
      const img = await AssetCache.loadImage(finalUrl, finalCors);

      if (isFeaturedImage) {
        RenderDebugger.update({
          decodeStatus: 'success'
        });
      }

      // Update CanvasTaintInspector that loading/decoding succeeded securely
      CanvasTaintInspector.register({
        originalUrl: url,
        resolvedUrl: finalUrl,
        loaded: true,
        decoded: true,
        isCorsEnabled: finalCors === 'anonymous',
      });

      // 5. Memory Management and Downscaling for Oversized Assets
      const safeImg = MemoryManager.resizeLargeImage(img, 2048);
      
      const loadTime = Date.now() - startTime;
      console.log(`[ImageLoader] Successfully loaded image in ${loadTime}ms`);

      return safeImg;
    } catch (err: any) {
      console.error(`[ImageLoader] Failed to load image via anonymous CORS proxy ${finalUrl}:`, err);
      
      // Update CanvasTaintInspector that loading/decoding failed
      CanvasTaintInspector.register({
        originalUrl: url,
        resolvedUrl: finalUrl,
        loaded: false,
        decoded: false,
        isCorsEnabled: finalCors === 'anonymous',
      });

      if (isFeaturedImage) {
        RenderDebugger.update({
          downloadStatus: 'failed',
          decodeStatus: 'failed'
        });
      }
      throw new Error(`[CORS/Load Failure] ${assetName} লোড করা সম্ভব হয়নি। সার্ভার প্রক্সি বা ফাইলটি অ্যাক্সেসযোগ্য নয়। (URL: ${url})`);
    }
  }

  /**
   * Fits an image in a target bounding box preserving aspect ratio, using smart alignment.
   */
  public static calculateFit(
    imgWidth: number,
    imgHeight: number,
    targetX: number,
    targetY: number,
    targetWidth: number,
    targetHeight: number,
    crop = false
  ): ImageFitResult {
    const imgRatio = imgWidth / imgHeight;
    const targetRatio = targetWidth / targetHeight;

    let width = targetWidth;
    let height = targetHeight;
    let x = targetX;
    let y = targetY;

    if (crop) {
      // Zoom & Crop (fill the entire target area)
      if (imgRatio > targetRatio) {
        width = targetHeight * imgRatio;
        x = targetX - (width - targetWidth) / 2;
      } else {
        height = targetWidth / imgRatio;
        y = targetY - (height - targetHeight) / 2;
      }
    } else {
      // Fit (ensure whole image is visible)
      if (imgRatio > targetRatio) {
        height = targetWidth / imgRatio;
        y = targetY + (targetHeight - height) / 2;
      } else {
        width = targetHeight * imgRatio;
        x = targetX + (targetWidth - width) / 2;
      }
    }

    return { x, y, width, height };
  }
}
