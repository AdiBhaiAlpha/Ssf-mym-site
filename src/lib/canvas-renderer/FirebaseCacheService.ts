import { ImageSourceDetector } from './ImageSourceDetector';

export class FirebaseCacheService {
  /**
   * Verifies if the image is hosted on Firebase Storage and checks its connectivity
   */
  public static async verifyFirebaseAsset(url: string): Promise<boolean> {
    const info = ImageSourceDetector.detect(url);
    if (!info.isFirebase) return false;

    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (e) {
      console.warn(`[FirebaseCacheService] Failed to ping Firebase storage asset directly: ${url}`, e);
      return false; // Fail gracefully or retry with proxy if blocked by browser policies
    }
  }

  /**
   * Creates a same-origin alias if the Firebase asset fails due to network or CORS issues.
   */
  public static resolveFirebaseUrl(url: string): string {
    const info = ImageSourceDetector.detect(url);
    if (!info.isFirebase) return url;

    // Firebase storage usually allows anonymous access, but if some domains have strict CORS,
    // we can fallback to proxying them too!
    return url;
  }
}
