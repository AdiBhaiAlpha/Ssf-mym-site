import { ImageSourceDetector } from './ImageSourceDetector';

export interface CacheEntryInfo {
  url: string;
  cacheKey: string;
  status: 'hit' | 'miss' | 'local' | 'bypass';
  size?: number;
  mimeType?: string;
}

export class ImageCacheManager {
  private static clientMemoryCache: Map<string, string> = new Map();

  /**
   * Translates any URL to a secure, same-origin proxied URL if necessary.
   * If it is a local upload or same-origin, it returns the URL directly.
   */
  public static getProxiedUrl(url: string | undefined): { url: string; status: CacheEntryInfo['status'] } {
    if (!url) return { url: '', status: 'bypass' };

    const detection = ImageSourceDetector.detect(url);

    if (detection.isLocalUpload || detection.isSameOrigin) {
      return { url, status: 'local' };
    }

    // It is an external image. We route it through our high-speed, secure proxy
    // This server endpoint performs SHA256-based physical disk caching
    const encodedUrl = encodeURIComponent(url);
    const proxyUrl = `/api/proxy-image?url=${encodedUrl}`;

    // Memory cache hit check on client-side
    if (this.clientMemoryCache.has(url)) {
      return { url: this.clientMemoryCache.get(url)!, status: 'hit' };
    }

    this.clientMemoryCache.set(url, proxyUrl);
    return { url: proxyUrl, status: 'miss' };
  }

  /**
   * Returns cache key for debug and audit
   */
  public static getCacheKey(url: string): string {
    // Basic hash function or pass to server
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Clears the client-side memory cache
   */
  public static clearMemoryCache() {
    this.clientMemoryCache.clear();
  }
}
