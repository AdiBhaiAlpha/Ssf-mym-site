import { CanvasTaintInspector } from './CanvasTaintInspector';

export class AssetCache {
  private static images: Map<string, HTMLImageElement> = new Map();
  private static qrs: Map<string, HTMLImageElement> = new Map();

  public static async loadImage(url: string, crossOrigin = 'anonymous'): Promise<HTMLImageElement> {
    const cacheKey = `${url}_${crossOrigin}`;
    if (this.images.has(cacheKey)) {
      // Register hit
      CanvasTaintInspector.register({
        originalUrl: url,
        resolvedUrl: url,
        loaded: true,
        decoded: true,
        isCorsEnabled: crossOrigin === 'anonymous',
        cacheStatus: 'hit',
      });
      return this.images.get(cacheKey)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      if (crossOrigin) {
        img.crossOrigin = crossOrigin;
      }
      
      img.onload = () => {
        this.images.set(cacheKey, img);
        CanvasTaintInspector.register({
          originalUrl: url,
          resolvedUrl: url,
          loaded: true,
          decoded: true,
          isCorsEnabled: crossOrigin === 'anonymous',
          cacheStatus: 'miss',
        });
        resolve(img);
      };

      img.onerror = (e) => {
        console.error(`[AssetCache] Failed to load image: ${url}`);
        CanvasTaintInspector.register({
          originalUrl: url,
          resolvedUrl: url,
          loaded: false,
          decoded: false,
          isCorsEnabled: crossOrigin === 'anonymous',
          cacheStatus: 'miss',
        });
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });
  }

  public static clear() {
    this.images.clear();
    this.qrs.clear();
  }
}

