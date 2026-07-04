// Let's declare our types directly to keep things clean and modular
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FATAL';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: 'Client' | 'Server' | 'System';
  module: string;
  message: string;
  functionName?: string;
  file?: string;
  absolutePath?: string;
  line?: number;
  column?: number;
  executionTime?: number; // in ms
  memoryUsage?: {
    usedHeap?: number;
    totalHeap?: number;
  };
  taskId?: string;
  stackTrace?: string;
  args?: any[];
  returnValue?: any;
  exception?: any;
  meta?: any;
}

export interface NetworkRequest {
  id: string;
  timestamp: Date;
  url: string;
  method: string;
  headers?: Record<string, string>;
  requestBody?: any;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  status?: number;
  statusText?: string;
  responseTime?: number; // ms
  payloadSize?: number; // bytes
  retryCount: number;
}

export interface ImageDebugInfo {
  id: string;
  originalUrl: string;
  resolvedUrl: string;
  blobUrl?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  decodeTime?: number; // ms
  corsStatus: 'CORRECT' | 'MISSING' | 'PROXY_BYPASS' | 'UNKNOWN';
  origin: string;
  cacheStatus: 'HIT' | 'MISS' | 'STALE' | 'UNKNOWN';
  loaded: boolean;
  decoded: boolean;
  safeForCanvas: boolean;
  timestamp: Date;
}

export interface CanvasDebugInfo {
  id: string;
  width: number;
  height: number;
  pixelRatio: number;
  scale: number;
  memoryUsage: number; // calculated bytes
  objectCount: number;
  layerCount: number;
  renderTime: number; // ms
  exportTime?: number; // ms
  blobSize?: number; // bytes
  tainted: boolean;
  taintedByObject?: {
    layerName: string;
    objectId: string;
    reason: string;
    url: string;
  } | null;
  timestamp: Date;
}

export interface MemoryMetric {
  timestamp: Date;
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  fps: number;
  cpuEstimation: number; // approximate active script load %
}

type LogSubscriber = (log: LogEntry) => void;
type NetworkSubscriber = (req: NetworkRequest) => void;
type ImageSubscriber = (img: ImageDebugInfo) => void;
type CanvasSubscriber = (canvas: CanvasDebugInfo) => void;
type MemorySubscriber = (metric: MemoryMetric) => void;

class DeveloperDebugLogger {
  private logs: LogEntry[] = [];
  private networkRequests: NetworkRequest[] = [];
  private images: Map<string, ImageDebugInfo> = new Map();
  private canvasInstance: CanvasDebugInfo | null = null;
  private memoryHistory: MemoryMetric[] = [];
  
  private logSubscribers: Set<LogSubscriber> = new Set();
  private networkSubscribers: Set<NetworkSubscriber> = new Set();
  private imageSubscribers: Set<ImageSubscriber> = new Set();
  private canvasSubscribers: Set<CanvasSubscriber> = new Set();
  private memorySubscribers: Set<MemorySubscriber> = new Set();

  private isPaused = false;
  private maxLogRetention = 2000;
  private originalFetch: typeof window.fetch | null = null;
  private fpsCounter = 0;
  private lastFpsTime = Date.now();
  private currentFps = 60;

  constructor() {
    this.initGlobalHandlers();
    this.initNetworkInterceptor();
    this.startPerformanceMonitor();
  }

  // Set up unhandled errors capture
  private initGlobalHandlers() {
    if (typeof window === 'undefined') return;

    window.onerror = (message, source, lineno, colno, error) => {
      this.log('FATAL', 'System', `Global Error: ${message}`, {
        file: source ? source.split('/').pop() : 'Unknown',
        absolutePath: source || undefined,
        line: lineno || undefined,
        column: colno || undefined,
        stackTrace: error?.stack,
        exception: error
      });
      return false; // let browser standard handling continue
    };

    window.onunhandledrejection = (event) => {
      const reason = event.reason;
      this.log('CRITICAL', 'System', `Unhandled Promise Rejection: ${reason?.message || String(reason)}`, {
        stackTrace: reason?.stack,
        exception: reason
      });
    };
  }

  // Intercept standard fetch requests
  private initNetworkInterceptor() {
    if (typeof window === 'undefined') return;

    this.originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const startTime = performance.now();
      const id = 'req_' + Math.random().toString(36).substring(2, 11);
      const urlStr = typeof input === 'string' ? input : (input as any).url || String(input);
      const method = init?.method || 'GET';
      
      const reqRecord: NetworkRequest = {
        id,
        timestamp: new Date(),
        url: urlStr,
        method,
        headers: init?.headers as Record<string, string> || undefined,
        requestBody: init?.body ? String(init.body) : undefined,
        retryCount: 0
      };

      self.addNetworkRequest(reqRecord);

      try {
        const response = await self.originalFetch!.call(window, input, init);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Clone response to avoid disturbing client consumption
        const clonedResponse = response.clone();
        let bodyText = '[Binary Content / Not Read]';
        let payloadSize = 0;

        const contentType = clonedResponse.headers.get('content-type') || '';
        if (contentType.includes('json') || contentType.includes('text')) {
          try {
            bodyText = await clonedResponse.text();
            payloadSize = new Blob([bodyText]).size;
          } catch (_) {}
        } else {
          try {
            const blob = await clonedResponse.blob();
            payloadSize = blob.size;
          } catch (_) {}
        }

        const resHeaders: Record<string, string> = {};
        clonedResponse.headers.forEach((v, k) => {
          resHeaders[k] = v;
        });

        const updatedReq: NetworkRequest = {
          ...reqRecord,
          status: response.status,
          statusText: response.statusText,
          responseHeaders: resHeaders,
          responseBody: bodyText,
          responseTime,
          payloadSize
        };

        self.updateNetworkRequest(updatedReq);

        // Auto Log network fetch
        const level: LogLevel = response.ok ? 'INFO' : 'ERROR';
        self.log(level, 'API Client', `Fetch ${method} ${urlStr.substring(0, 80)} returned ${response.status}`, {
          executionTime: responseTime,
          meta: { status: response.status, size: payloadSize }
        });

        return response;
      } catch (err: any) {
        const endTime = performance.now();
        const updatedReq: NetworkRequest = {
          ...reqRecord,
          status: 0,
          statusText: err.message || String(err),
          responseTime: endTime - startTime,
          payloadSize: 0
        };
        self.updateNetworkRequest(updatedReq);

        self.log('CRITICAL', 'API Client', `Fetch Failed: ${method} ${urlStr} - ${err.message}`, {
          exception: err,
          executionTime: endTime - startTime
        });

        throw err;
      }
    };
  }

  // Live Performance Tracking loop
  private startPerformanceMonitor() {
    if (typeof window === 'undefined') return;

    const tick = () => {
      this.fpsCounter++;
      const now = Date.now();
      if (now - this.lastFpsTime >= 1000) {
        this.currentFps = Math.min(60, Math.round((this.fpsCounter * 1000) / (now - this.lastFpsTime)));
        this.fpsCounter = 0;
        this.lastFpsTime = now;

        // Push memory state
        const memory = (performance as any).memory;
        const metric: MemoryMetric = {
          timestamp: new Date(),
          jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
          totalJSHeapSize: memory?.totalJSHeapSize || 0,
          usedJSHeapSize: memory?.usedJSHeapSize || 0,
          fps: this.currentFps,
          cpuEstimation: this.estimateCpuUsage()
        };

        this.addMemoryMetric(metric);
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  private estimateCpuUsage(): number {
    // Basic approximate performance loading based on event loop delays
    const start = performance.now();
    let x = 0;
    for (let i = 0; i < 100000; i++) {
      x += Math.sin(i);
    }
    const duration = performance.now() - start;
    return Math.min(100, Math.max(0, Math.round(duration * 20))); // scale to percent load estimate
  }

  // Main high precision logger interface
  public log(
    level: LogLevel,
    module: string,
    message: string,
    details?: {
      functionName?: string;
      file?: string;
      absolutePath?: string;
      line?: number;
      column?: number;
      executionTime?: number;
      stackTrace?: string;
      args?: any[];
      returnValue?: any;
      exception?: any;
      meta?: any;
    }
  ) {
    if (this.isPaused) return;

    // Automatic Stack Tracing & location extraction where not explicitly provided
    let file = details?.file;
    let func = details?.functionName;
    let line = details?.line;
    let col = details?.column;
    let parsedStack = details?.stackTrace;

    if (!file || !line) {
      const err = new Error();
      const stack = err.stack || '';
      parsedStack = stack;
      
      // Parse second or third frame of stack trace
      const frames = stack.split('\n');
      const callerFrame = frames[3] || frames[2];
      if (callerFrame) {
        const match = callerFrame.match(/at\s+([^\s(]+)?\s*\(?([^:]+):(\d+):(\d+)\)?/);
        if (match) {
          func = func || match[1] || 'anonymous';
          const fullPath = match[2];
          file = file || fullPath.split('/').pop() || '';
          line = line || parseInt(match[3], 10);
          col = col || parseInt(match[4], 10);
        }
      }
    }

    const memory = (performance as any).memory;
    const entry: LogEntry = {
      id: 'log_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
      level,
      source: 'Client',
      module,
      message,
      functionName: func,
      file,
      absolutePath: details?.absolutePath || (file ? `/src/${file}` : undefined),
      line,
      column: col,
      executionTime: details?.executionTime,
      memoryUsage: memory ? {
        usedHeap: memory.usedJSHeapSize,
        totalHeap: memory.totalJSHeapSize
      } : undefined,
      stackTrace: parsedStack,
      args: details?.args,
      returnValue: details?.returnValue,
      exception: details?.exception,
      meta: details?.meta
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogRetention) {
      this.logs.shift();
    }

    // Trigger subscribers
    this.logSubscribers.forEach(sub => sub(entry));
  }

  // Network logs management
  private addNetworkRequest(req: NetworkRequest) {
    if (this.isPaused) return;
    this.networkRequests.push(req);
    if (this.networkRequests.length > 500) this.networkRequests.shift();
    this.networkSubscribers.forEach(sub => sub(req));
  }

  private updateNetworkRequest(req: NetworkRequest) {
    const idx = this.networkRequests.findIndex(r => r.id === req.id);
    if (idx !== -1) {
      this.networkRequests[idx] = req;
      this.networkSubscribers.forEach(sub => sub(req));
    }
  }

  // Image diagnostic tracking
  public trackImage(info: Omit<ImageDebugInfo, 'id' | 'timestamp'>) {
    const id = info.originalUrl;
    const fullInfo: ImageDebugInfo = {
      ...info,
      id,
      timestamp: new Date()
    };
    this.images.set(id, fullInfo);
    this.imageSubscribers.forEach(sub => sub(fullInfo));

    this.log(info.loaded ? 'SUCCESS' : 'WARNING', 'Image Cache', 
      `Image ${info.loaded ? 'Loaded' : 'Tracked'}: ${info.originalUrl.substring(0, 60)} | Canvas Safe: ${info.safeForCanvas ? 'YES' : 'NO'}`,
      { meta: info }
    );
  }

  // Canvas context monitoring
  public trackCanvas(info: Omit<CanvasDebugInfo, 'id' | 'timestamp'>) {
    const fullInfo: CanvasDebugInfo = {
      ...info,
      id: 'canvas_' + Date.now(),
      timestamp: new Date()
    };
    this.canvasInstance = fullInfo;
    this.canvasSubscribers.forEach(sub => sub(fullInfo));

    this.log(info.tainted ? 'CRITICAL' : 'SUCCESS', 'Canvas Renderer', 
      `Canvas Configured: ${info.width}x${info.height} | Layers: ${info.layerCount} | Tainted: ${info.tainted ? 'YES ❌' : 'NO ✅'}`,
      { meta: info }
    );
  }

  // Memory history logs
  private addMemoryMetric(metric: MemoryMetric) {
    this.memoryHistory.push(metric);
    if (this.memoryHistory.length > 120) this.memoryHistory.shift();
    this.memorySubscribers.forEach(sub => sub(metric));
  }

  // Getters
  public getLogs() { return this.logs; }
  public getNetworkRequests() { return this.networkRequests; }
  public getImages() { return Array.from(this.images.values()); }
  public getCanvasInfo() { return this.canvasInstance; }
  public getMemoryHistory() { return this.memoryHistory; }

  // State operations
  public setPaused(p: boolean) { this.isPaused = p; }
  public getIsPaused() { return this.isPaused; }
  public clearLogs() {
    this.logs = [];
    this.networkRequests = [];
    this.images.clear();
    this.canvasInstance = null;
    this.logSubscribers.forEach(sub => sub({} as any)); // notify listeners
  }

  // Subscriptions management
  public subscribeLogs(cb: LogSubscriber) {
    this.logSubscribers.add(cb);
    return () => this.logSubscribers.delete(cb);
  }

  public subscribeNetwork(cb: NetworkSubscriber) {
    this.networkSubscribers.add(cb);
    return () => this.networkSubscribers.delete(cb);
  }

  public subscribeImages(cb: ImageSubscriber) {
    this.imageSubscribers.add(cb);
    return () => this.imageSubscribers.delete(cb);
  }

  public subscribeCanvas(cb: CanvasSubscriber) {
    this.canvasSubscribers.add(cb);
    return () => this.canvasSubscribers.delete(cb);
  }

  public subscribeMemory(cb: MemorySubscriber) {
    this.memorySubscribers.add(cb);
    return () => this.memorySubscribers.delete(cb);
  }
}

export const DebugLogger = new DeveloperDebugLogger();
