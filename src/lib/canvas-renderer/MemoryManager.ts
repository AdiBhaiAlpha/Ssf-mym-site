export interface CanvasSafetyScale {
  scale: number;
  width: number;
  height: number;
  isAdjusted: boolean;
  reason?: string;
}

export class MemoryManager {
  // Safe limits to prevent iOS Safari/Android WebKit canvas crashes (typically max 16MP or 4096 max dimension)
  private static MAX_PIXELS = 12 * 1024 * 1024; // 12 Megapixels safe ceiling
  private static MAX_DIMENSION = 4096;          // 4096px maximum side

  /**
   * Evaluates the requested canvas dimensions and automatically scales down
   * to fit within browser hardware limits if it exceeds safe memory thresholds.
   */
  public static getSafeCanvasDimensions(
    baseWidth: number,
    baseHeight: number,
    scale = 1.0
  ): CanvasSafetyScale {
    const rawWidth = Math.round(baseWidth * scale);
    const rawHeight = Math.round(baseHeight * scale);
    const totalPixels = rawWidth * rawHeight;

    let adjustedScale = scale;
    let adjustedWidth = rawWidth;
    let adjustedHeight = rawHeight;
    let isAdjusted = false;
    let reason = '';

    // If total pixels exceed megapixel threshold
    if (totalPixels > this.MAX_PIXELS) {
      const downscaleFactor = Math.sqrt(this.MAX_PIXELS / totalPixels);
      adjustedScale = scale * downscaleFactor;
      isAdjusted = true;
      reason = `ক্যানভাস মেমরি লিমিট (${Math.round(this.MAX_PIXELS / 1000000)}MP) অতিক্রম করায় আউট অফ মেমরি এড়াতে সাইজ স্কেলড ডাউন করা হয়েছে।`;
    }

    // Check if any single dimension exceeds the hardware maximum
    adjustedWidth = Math.round(baseWidth * adjustedScale);
    adjustedHeight = Math.round(baseHeight * adjustedScale);

    const maxSide = Math.max(adjustedWidth, adjustedHeight);
    if (maxSide > this.MAX_DIMENSION) {
      const downscaleFactor = this.MAX_DIMENSION / maxSide;
      adjustedScale = adjustedScale * downscaleFactor;
      adjustedWidth = Math.round(baseWidth * adjustedScale);
      adjustedHeight = Math.round(baseHeight * adjustedScale);
      isAdjusted = true;
      reason = `ক্যানভাস ডাইমেনশন হার্ডওয়্যার লিমিট (${this.MAX_DIMENSION}px) অতিক্রম করায় সাইজ স্কেলড ডাউন করা হয়েছে।`;
    }

    return {
      scale: adjustedScale,
      width: adjustedWidth,
      height: adjustedHeight,
      isAdjusted,
      reason: isAdjusted ? reason : undefined
    };
  }

  /**
   * Resizes an extremely large loaded image into an offscreen canvas to optimize rendering memory.
   * Keeps aspect ratio intact and maintains pristine quality (> 90%).
   */
  public static resizeLargeImage(
    img: HTMLImageElement,
    maxSide = 2048
  ): HTMLCanvasElement | HTMLImageElement {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    if (w <= maxSide && h <= maxSide) {
      return img; // Already safe, return original
    }

    // Calculate scaled dimensions preserving aspect ratio
    let targetW = w;
    let targetH = h;

    if (w > h) {
      targetW = maxSide;
      targetH = Math.round((h * maxSide) / w);
    } else {
      targetH = maxSide;
      targetW = Math.round((w * maxSide) / h);
    }

    console.log(`[MemoryManager] Downscaling oversized image from ${w}x${h} to ${targetW}x${targetH} for memory safety`);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return img;

    // Use high quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, targetW, targetH);
    return canvas;
  }
}
