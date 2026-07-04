import { ImageMetadata } from './ImageSourceDetector';

export interface DebugSnapshot {
  originalUrl: string;
  cachedUrl: string;
  cacheStatus: 'hit' | 'miss' | 'local' | 'bypass';
  downloadStatus: 'pending' | 'success' | 'failed' | 'idle';
  imageSource: string;
  imageWidth: number;
  imageHeight: number;
  decodeStatus: 'pending' | 'success' | 'failed' | 'idle';
  renderStatus: 'pending' | 'success' | 'failed' | 'idle';
  canvasWidth: number;
  canvasHeight: number;
  memoryUsage: string; // Estimated MB
  renderTime: number;  // ms
  exportTime: number;  // ms
  blobSize: number;    // bytes
  finalResolution: string;
}

export class RenderDebugger {
  private static snapshot: DebugSnapshot = {
    originalUrl: '',
    cachedUrl: '',
    cacheStatus: 'bypass',
    downloadStatus: 'idle',
    imageSource: 'None',
    imageWidth: 0,
    imageHeight: 0,
    decodeStatus: 'idle',
    renderStatus: 'idle',
    canvasWidth: 0,
    canvasHeight: 0,
    memoryUsage: '0 MB',
    renderTime: 0,
    exportTime: 0,
    blobSize: 0,
    finalResolution: '0x0'
  };

  /**
   * Resets the debugging session with new parameters
   */
  public static reset(originalUrl: string) {
    this.snapshot = {
      originalUrl,
      cachedUrl: '',
      cacheStatus: 'bypass',
      downloadStatus: 'idle',
      imageSource: 'None',
      imageWidth: 0,
      imageHeight: 0,
      decodeStatus: 'idle',
      renderStatus: 'idle',
      canvasWidth: 0,
      canvasHeight: 0,
      memoryUsage: '0 MB',
      renderTime: 0,
      exportTime: 0,
      blobSize: 0,
      finalResolution: '0x0'
    };
  }

  /**
   * Updates multiple keys in the debug snapshot
   */
  public static update(updates: Partial<DebugSnapshot>) {
    this.snapshot = {
      ...this.snapshot,
      ...updates
    };
  }

  /**
   * Returns the current debugging session snapshot
   */
  public static getSnapshot(): DebugSnapshot {
    return this.snapshot;
  }

  /**
   * Estimates browser memory allocation for a canvas of given width and height
   */
  public static estimateMemoryUsage(width: number, height: number): string {
    if (width <= 0 || height <= 0) return '0 MB';
    // Each pixel in 2D canvas consumes 4 bytes (RGBA)
    const bytes = width * height * 4;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
}
