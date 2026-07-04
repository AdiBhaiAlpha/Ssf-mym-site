import { ImageLoader } from './ImageLoader';

export class ImagePreloader {
  /**
   * Preloads a single image and guarantees it is fully decoded.
   */
  public static async preloadImage(
    url: string | undefined
  ): Promise<HTMLImageElement | HTMLCanvasElement | null> {
    if (!url) return null;
    try {
      const img = await ImageLoader.loadImage(url);
      if (img && img instanceof HTMLImageElement) {
        // Wait until image is complete and decode it safely
        if (!img.complete) {
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image on demand: ${url}`));
          });
        }
        // HTMLImageElement.decode() ensures decoding happens in the background, freeing up UI thread
        if (typeof img.decode === 'function') {
          await img.decode();
        }
      }
      return img;
    } catch (e) {
      console.error(`[ImagePreloader] Error preloading and decoding image: ${url}`, e);
      return null;
    }
  }

  /**
   * Preloads all images in parallel using Promise.all
   */
  public static async preloadAll(
    urls: (string | undefined)[]
  ): Promise<(HTMLImageElement | HTMLCanvasElement | null)[]> {
    const promises = urls.map(url => this.preloadImage(url));
    return Promise.all(promises);
  }
}
