export interface ImageMetadata {
  originalUrl: string;
  domain: string;
  isSameOrigin: boolean;
  isExternal: boolean;
  isFirebase: boolean;
  isLocalUpload: boolean;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number | null;
}

export class ImageSourceDetector {
  /**
   * Detects the type and metadata of a given image URL.
   */
  public static detect(url: string | undefined): ImageMetadata {
    const defaultMeta: ImageMetadata = {
      originalUrl: url || '',
      domain: '',
      isSameOrigin: true,
      isExternal: false,
      isFirebase: false,
      isLocalUpload: false,
      mimeType: 'image/png',
      width: 0,
      height: 0,
      fileSize: null
    };

    if (!url) return defaultMeta;

    // Detect Base64 / DataURL
    if (url.startsWith('data:')) {
      const mimeMatch = url.match(/^data:([^;]+);/);
      const dataSize = Math.round((url.length - (url.indexOf(',') + 1)) * 0.75);
      return {
        ...defaultMeta,
        domain: 'DataURL',
        isLocalUpload: true,
        mimeType: mimeMatch ? mimeMatch[1] : 'image/png',
        fileSize: dataSize
      };
    }

    // Detect local absolute or relative paths
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return {
        ...defaultMeta,
        domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
        isLocalUpload: true,
        mimeType: this.guessMimeFromUrl(url)
      };
    }

    // Absolute URLs
    try {
      const parsed = new URL(url);
      const isSameOrigin = typeof window !== 'undefined' && parsed.host === window.location.host;
      const isFirebase = parsed.hostname.includes('firebasestorage.googleapis.com');
      const isExternal = !isSameOrigin && !isFirebase;

      return {
        originalUrl: url,
        domain: parsed.hostname,
        isSameOrigin,
        isExternal,
        isFirebase,
        isLocalUpload: false,
        mimeType: this.guessMimeFromUrl(url),
        width: 0,
        height: 0,
        fileSize: null
      };
    } catch (e) {
      return {
        ...defaultMeta,
        domain: 'Invalid URL',
        isExternal: true,
        mimeType: 'image/png'
      };
    }
  }

  /**
   * Updates metadata with actual loaded image dimensions.
   */
  public static updateWithImage(meta: ImageMetadata, img: HTMLImageElement): ImageMetadata {
    return {
      ...meta,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height
    };
  }

  private static guessMimeFromUrl(url: string): string {
    const ext = url.split(/[#?]/)[0].split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'image/png';
    }
  }
}
