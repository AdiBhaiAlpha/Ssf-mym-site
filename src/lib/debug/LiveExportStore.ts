import { CanvasTaintInspector } from '../canvas-renderer/CanvasTaintInspector';
import { RenderDebugger } from '../canvas-renderer/RenderDebugger';

export interface ExportStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  timestamp?: string;
}

export interface LiveExportSession {
  active: boolean;
  title: string;
  format: 'png' | 'pdf' | '';
  progress: number; // 0 to 100
  statusText: string;
  steps: ExportStep[];
  logs: string[];
  success: boolean | null;
  errorDetails: {
    status?: string;
    errorType?: string;
    message?: string;
    rootCause?: string;
    fileName?: string;
    functionName?: string;
    line?: number;
    column?: number;
    stackTrace?: string;
    relatedAsset?: {
      name: string;
      originalUrl: string;
      resolvedUrl: string;
      blobUrl?: string;
      origin: string;
      isSameOrigin: boolean;
      isCorsEnabled: boolean;
      loaded: boolean;
      decoded: boolean;
      cacheStatus: string;
      isSafeForCanvas: boolean;
      width?: number;
      height?: number;
      fileSize?: string;
    } | null;
    objectId?: string;
    canvasLayer?: string;
    module?: string;
    executionTime?: number;
    canvasWidth?: number;
    canvasHeight?: number;
    pixelRatio?: number;
    layerCount?: number;
    objectCount?: number;
    memoryUsage?: string;
    canvasState?: string;
    validationResult?: string;
  } | null;
  retryCallback?: () => void;
}

type StoreListener = (session: LiveExportSession) => void;

class LiveExportStoreClass {
  private session: LiveExportSession = this.getInitialSession();
  private listeners: Set<StoreListener> = new Set();

  private getInitialSession(): LiveExportSession {
    return {
      active: false,
      title: '',
      format: '',
      progress: 0,
      statusText: 'Preparing...',
      steps: [
        { id: 'init', name: 'Initializing Export...', status: 'pending' },
        { id: 'template', name: 'Loading Template...', status: 'pending' },
        { id: 'assets', name: 'Loading Assets...', status: 'pending' },
        { id: 'fonts', name: 'Loading Fonts...', status: 'pending' },
        { id: 'qr', name: 'Generating QR Code...', status: 'pending' },
        { id: 'images', name: 'Loading Images...', status: 'pending' },
        { id: 'render', name: 'Canvas Rendering...', status: 'pending' },
        { id: 'validate', name: 'Canvas Validation...', status: 'pending' },
        { id: 'blob', name: 'Blob Creation...', status: 'pending' },
        { id: 'prepare_download', name: 'Preparing Download...', status: 'pending' },
        { id: 'download_started', name: 'Download Started...', status: 'pending' },
      ],
      logs: [],
      success: null,
      errorDetails: null,
    };
  }

  public subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.session });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const cloned = { ...this.session, steps: this.session.steps.map(s => ({ ...s })) };
    this.listeners.forEach(l => l(cloned));
  }

  public start(title: string, format: 'png' | 'pdf', retryCallback?: () => void) {
    this.session = this.getInitialSession();
    this.session.active = true;
    this.session.title = title;
    this.session.format = format;
    this.session.retryCallback = retryCallback;
    this.log(`[INIT] Starting export pipeline for: ${title} (${format.toUpperCase()})`);
    this.notify();
  }

  public log(msg: string) {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${msg}`;
    this.session.logs = [...this.session.logs, formatted];
    this.notify();
  }

  public setStep(stepId: string, status: 'running' | 'success' | 'failed', logsToInclude?: string[]) {
    const timestamp = new Date().toLocaleTimeString();
    this.session.steps = this.session.steps.map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          status,
          timestamp,
        };
      }
      return step;
    });

    if (logsToInclude && logsToInclude.length > 0) {
      logsToInclude.forEach(logLine => {
        this.log(logLine);
      });
    }

    // Set auto progress bar text based on the running step
    let progress = 0;
    let statusText = 'Preparing...';
    switch (stepId) {
      case 'init':
        progress = 5;
        statusText = 'Initializing...';
        break;
      case 'template':
        progress = 15;
        statusText = 'Loading Template...';
        break;
      case 'assets':
        progress = 25;
        statusText = 'Loading Assets...';
        break;
      case 'fonts':
        progress = 35;
        statusText = 'Loading Fonts...';
        break;
      case 'qr':
        progress = 45;
        statusText = 'Generating QR Code...';
        break;
      case 'images':
        progress = 55;
        statusText = 'Loading Images...';
        break;
      case 'render':
        progress = 70;
        statusText = 'Rendering Canvas...';
        break;
      case 'validate':
        progress = 80;
        statusText = 'Validating Canvas...';
        break;
      case 'blob':
        progress = 90;
        statusText = 'Creating Blob...';
        break;
      case 'prepare_download':
        progress = 95;
        statusText = 'Downloading...';
        break;
      case 'download_started':
        progress = 100;
        statusText = 'Completed.';
        break;
    }

    if (status === 'success' && stepId === 'download_started') {
      this.session.success = true;
      this.session.progress = 100;
      this.session.statusText = 'Completed.';
      this.log('✓ Success: All pipeline tasks completed successfully.');
    } else {
      this.session.progress = progress;
      this.session.statusText = statusText;
    }

    this.notify();
  }

  public fail(stepId: string, error: any, extraMeta?: { assetUrl?: string; objectId?: string; layerName?: string }) {
    // Fail the current step
    this.session.steps = this.session.steps.map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          status: 'failed',
          timestamp: new Date().toLocaleTimeString(),
        };
      }
      return step;
    });

    this.session.success = false;
    this.session.statusText = 'Download Failed';
    this.log(`❌ Error in step "${stepId}": ${error.message || String(error)}`);

    // Extract error metadata
    const errorType = error.name || (error.message?.includes('taint') ? 'SecurityError (CORS)' : 'ExportError');
    const rootCause = error.message?.includes('tainted') 
      ? 'The canvas became tainted by loading cross-origin resources without CORS headers. Accessing image pixel data is restricted for security.'
      : (error.message?.includes('Coordinates') || error.message?.includes('metrics'))
        ? 'Canvas rendering diagnostics mismatch. Layout validation checks failed.'
        : 'Unexpected execution block failure.';

    // Try to extract line number and file from stack
    let fileName = 'Unknown';
    let functionName = 'Unknown';
    let line: number | undefined;
    let column: number | undefined;

    if (error.stack) {
      const lines = error.stack.split('\n');
      const traceLine = lines[1] || lines[0]; // grab first call line
      const match = traceLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || traceLine.match(/at\s+(.+?):(\d+):(\d+)/);
      if (match) {
        if (match.length === 5) {
          functionName = match[1];
          fileName = match[2].split('/').pop() || 'Unknown';
          line = parseInt(match[3], 10);
          column = parseInt(match[4], 10);
        } else {
          fileName = match[1].split('/').pop() || 'Unknown';
          line = parseInt(match[2], 10);
          column = parseInt(match[3], 10);
        }
      }
    }

    // Related Asset logic
    let relatedAsset = null;
    const assets = CanvasTaintInspector.getAssets();
    const badAsset = assets.find(a => !a.isSafeForCanvas) || (extraMeta?.assetUrl ? assets.find(a => a.originalUrl === extraMeta.assetUrl) : null);
    if (badAsset) {
      relatedAsset = {
        name: badAsset.name,
        originalUrl: badAsset.originalUrl,
        resolvedUrl: badAsset.resolvedUrl,
        origin: badAsset.origin,
        isSameOrigin: badAsset.isSameOrigin,
        isCorsEnabled: badAsset.isCorsEnabled,
        loaded: badAsset.loaded,
        decoded: badAsset.decoded,
        cacheStatus: badAsset.cacheStatus,
        isSafeForCanvas: badAsset.isSafeForCanvas,
      };
    }

    // Try to gather RenderDebugger snapshot data for additional sections
    const debuggerSnap = RenderDebugger.getSnapshot();

    this.session.errorDetails = {
      status: '❌ Failed',
      errorType,
      message: error.message || String(error),
      rootCause,
      fileName,
      functionName,
      line,
      column,
      stackTrace: error.stack || 'No stack trace available.',
      relatedAsset,
      objectId: extraMeta?.objectId || (badAsset ? 'profile-photo' : undefined),
      canvasLayer: extraMeta?.layerName || (badAsset ? 'memberPhotoLayer / orgLogoLayer' : undefined),
      module: fileName !== 'Unknown' ? fileName : 'CanvasRenderer.ts',
      executionTime: debuggerSnap.renderTime || undefined,
      canvasWidth: debuggerSnap.canvasWidth || undefined,
      canvasHeight: debuggerSnap.canvasHeight || undefined,
      pixelRatio: window.devicePixelRatio || 1,
      layerCount: 4, // standard
      objectCount: 15, // estimated standard objects
      memoryUsage: RenderDebugger.estimateMemoryUsage(debuggerSnap.canvasWidth || 1011, debuggerSnap.canvasHeight || 638),
      canvasState: debuggerSnap.renderStatus === 'success' ? 'VALID_AND_RENDERED' : 'UNSTABLE',
      validationResult: error.message?.includes('metrics') || error.message?.includes('Coordinates') ? 'FAILED_LAYOUT' : 'PASSED_OR_SKIPPED',
    };

    this.notify();
  }

  public getSession(): LiveExportSession {
    return this.session;
  }

  public close() {
    this.session.active = false;
    this.notify();
  }
}

export const LiveExportStore = new LiveExportStoreClass();
