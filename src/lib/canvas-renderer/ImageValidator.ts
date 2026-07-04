import { ImageSourceDetector } from './ImageSourceDetector';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  statusCode?: number;
  mimeType?: string;
  width?: number;
  height?: number;
}

export class ImageValidator {
  /**
   * Validates an image URL by running detailed checks.
   */
  public static async validateImage(url: string | undefined): Promise<ValidationResult> {
    if (!url) {
      return { isValid: false, error: 'ইমেজ লিংকটি সম্পূর্ণ খালি (Image URL is empty).' };
    }

    const detection = ImageSourceDetector.detect(url);

    // If it's a data URL, we decode and inspect it directly
    if (detection.isLocalUpload && url.startsWith('data:')) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            resolve({
              isValid: true,
              mimeType: detection.mimeType,
              width: img.naturalWidth,
              height: img.naturalHeight
            });
          } else {
            resolve({ isValid: false, error: 'ডেকোডকৃত ইমেজের কোনো চওড়া বা উচ্চতা পাওয়া যায়নি।' });
          }
        };
        img.onerror = () => {
          resolve({ isValid: false, error: 'ভুল ডাটা-ইউআরএল বা করাপ্টেড বেইজ৬৪ ফাইল।' });
        };
        img.src = url;
      });
    }

    // For absolute HTTP URLs, we can first make a lightweight validation fetch or let proxy handle it
    try {
      // 1. Perform a lightweight ping/fetch request (only if on same domain or routed via proxy)
      // We route external images through our same-origin proxy to ensure we get HTTP status and headers without CORS blocks!
      const proxiedUrl = url.startsWith('http') && !url.includes('/api/proxy-image')
        ? `/api/proxy-image?url=${encodeURIComponent(url)}`
        : url;

      const response = await fetch(proxiedUrl, { method: 'GET' });
      
      if (!response.ok) {
        return {
          isValid: false,
          statusCode: response.status,
          error: `সার্ভার রেসপন্স কোড: ${response.status} ${response.statusText}`
        };
      }

      const mimeType = response.headers.get('content-type') || 'image/png';
      if (!mimeType.startsWith('image/')) {
        return {
          isValid: false,
          statusCode: response.status,
          mimeType,
          error: `অমান্য ইমেজ ফরম্যাট: ${mimeType} (শুধুমাত্র PNG, JPEG বা WEBP গ্রহণযোগ্য)`
        };
      }

      // 2. Decode the image in the browser and check dimensions
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (w > 0 && h > 0) {
            resolve({
              isValid: true,
              statusCode: 200,
              mimeType,
              width: w,
              height: h
            });
          } else {
            resolve({
              isValid: false,
              statusCode: 200,
              mimeType,
              error: 'ইমেজের ডাইমেনশন শূন্য (Width: 0, Height: 0)। চিত্রটি খালি বা ক্ষতিগ্রস্ত।'
            });
          }
        };
        img.onerror = () => {
          resolve({
            isValid: false,
            statusCode: 200,
            mimeType,
            error: `ব্রাউজার ইমেজ ডেকোড করতে ব্যর্থ হয়েছে। ফাইলের ডাটা করাপ্টেড হতে পারে।`
          });
        };
        img.src = proxiedUrl;
      });
    } catch (e: any) {
      console.error('[ImageValidator] Validation request failed:', e);
      return {
        isValid: false,
        error: `ইমেজ লোড করার সময় নেটওয়ার্ক বা ব্রাউজার এরর ঘটেছে: ${e.message}`
      };
    }
  }
}
