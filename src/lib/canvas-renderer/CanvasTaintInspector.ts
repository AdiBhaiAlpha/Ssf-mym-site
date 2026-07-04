import { ImageSourceDetector } from './ImageSourceDetector';

export interface InspectorAsset {
  name: string;
  type: 'image' | 'canvas' | 'qr' | 'font' | 'svg' | 'css';
  originalUrl: string;
  resolvedUrl: string;
  origin: string;
  isSameOrigin: boolean;
  isCorsEnabled: boolean;
  loaded: boolean;
  decoded: boolean;
  cacheStatus: 'hit' | 'miss' | 'local' | 'bypass';
  isSafeForCanvas: boolean;
}

export class CanvasTaintInspector {
  private static assets: Map<string, InspectorAsset> = new Map();

  /**
   * Resets the inspector registry
   */
  public static reset() {
    this.assets.clear();
  }

  /**
   * Registers or updates an asset in the registry
   */
  public static register(asset: Partial<InspectorAsset> & { originalUrl: string }) {
    if (!asset.originalUrl) return;

    const existing = this.assets.get(asset.originalUrl) || {
      name: 'Unknown Asset',
      type: 'image',
      originalUrl: asset.originalUrl,
      resolvedUrl: asset.originalUrl,
      origin: '',
      isSameOrigin: true,
      isCorsEnabled: true,
      loaded: false,
      decoded: false,
      cacheStatus: 'bypass',
      isSafeForCanvas: true,
    };

    const updated = { ...existing, ...asset } as InspectorAsset;

    // Recalculate origin and safety
    const detection = ImageSourceDetector.detect(updated.resolvedUrl || updated.originalUrl);
    updated.origin = detection.domain || 'Local / Same-Origin';
    updated.isSameOrigin = detection.isSameOrigin || detection.isLocalUpload;
    
    // An asset is safe if it's same-origin, or loaded with CORS enabled
    updated.isSafeForCanvas = updated.isSameOrigin || updated.isCorsEnabled;

    this.assets.set(asset.originalUrl, updated);
  }

  /**
   * Returns all registered assets
   */
  public static getAssets(): InspectorAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Inspects the registry for any unsafe assets that would taint a canvas.
   * If any unsafe assets are found, it returns them.
   */
  public static getUnsafeAssets(): InspectorAsset[] {
    return this.getAssets().filter(asset => !asset.isSafeForCanvas);
  }

  /**
   * Auto-fixes any unsafe assets by converting their URLs to use our server-side secure proxy
   * and ensuring CORS is set to anonymous.
   */
  public static autoFixUnsafeAssets(): number {
    let fixCount = 0;
    for (const [key, asset] of this.assets.entries()) {
      if (!asset.isSafeForCanvas) {
        // Fix 1 & 6: If external image or logo/watermark is external, route through secure proxy
        if (asset.type === 'image' && !asset.isSameOrigin) {
          const encodedUrl = encodeURIComponent(asset.originalUrl);
          const proxyUrl = `/api/proxy-image?url=${encodedUrl}`;
          
          this.register({
            originalUrl: asset.originalUrl,
            resolvedUrl: proxyUrl,
            isCorsEnabled: true,
            isSameOrigin: true,
            cacheStatus: 'miss',
          });
          fixCount++;
        }
      }
    }
    return fixCount;
  }
}
