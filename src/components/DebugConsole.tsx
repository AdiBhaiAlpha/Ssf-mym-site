import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, X, RotateCcw, Copy, Download, Search, AlertCircle, 
  Settings, ChevronRight, Play, Pause, ArrowDown, Activity, 
  Image, Layers, Globe, Server, Code, FileText, Maximize2, Minimize2, 
  Database, RefreshCw, Cpu, CheckCircle2, Flame, AlertOctagon
} from 'lucide-react';
import { DebugLogger, LogEntry, NetworkRequest, ImageDebugInfo, CanvasDebugInfo, MemoryMetric, LogLevel } from '../lib/debug/DebugLogger';

interface DebugConsoleProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function DebugConsole({ isOpen, setIsOpen }: DebugConsoleProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dock, setDock] = useState<'left' | 'right' | 'bottom' | 'floating' | 'fullscreen'>('bottom');
  const [activeTab, setActiveTab] = useState<'logs' | 'network' | 'images' | 'canvas' | 'memory' | 'errors' | 'source'>('logs');
  
  // Real-time state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [images, setImages] = useState<ImageDebugInfo[]>([]);
  const [canvasInfo, setCanvasInfo] = useState<CanvasDebugInfo | null>(null);
  const [memoryHistory, setMemoryHistory] = useState<MemoryMetric[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');

  // Detail Inspections
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [selectedSourceFile, setSelectedSourceFile] = useState<string>('MemberCardRenderer.ts');
  const [selectedSourceLine, setSelectedSourceLine] = useState<number>(1);

  // Floating window dragging/resizing state
  const [floatPos, setFloatPos] = useState({ x: 100, y: 100 });
  const [floatSize, setFloatSize] = useState({ width: 800, height: 450 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });
  const sizeStartRef = useRef({ width: 0, height: 0 });

  const logsEndRef = useRef<HTMLDivElement>(null);
  const memoryCanvasRef = useRef<HTMLCanvasElement>(null);

  // Keyboard shortcut removed as requested by the user
  useEffect(() => {
    // Console is now an on-page live window by default.
  }, []);

  // Listen for DebugLogger changes
  useEffect(() => {
    // Initial fetch
    setLogs(DebugLogger.getLogs());
    setRequests(DebugLogger.getNetworkRequests());
    setImages(DebugLogger.getImages());
    setCanvasInfo(DebugLogger.getCanvasInfo());
    setMemoryHistory(DebugLogger.getMemoryHistory());

    const unsubscribeLogs = DebugLogger.subscribeLogs(() => {
      if (!isPaused) setLogs([...DebugLogger.getLogs()]);
    });
    const unsubscribeNetwork = DebugLogger.subscribeNetwork(() => {
      if (!isPaused) setRequests([...DebugLogger.getNetworkRequests()]);
    });
    const unsubscribeImages = DebugLogger.subscribeImages(() => {
      if (!isPaused) setImages([...DebugLogger.getImages()]);
    });
    const unsubscribeCanvas = DebugLogger.subscribeCanvas(() => {
      setCanvasInfo(DebugLogger.getCanvasInfo());
    });
    const unsubscribeMemory = DebugLogger.subscribeMemory(() => {
      const history = DebugLogger.getMemoryHistory();
      setMemoryHistory([...history]);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeNetwork();
      unsubscribeImages();
      unsubscribeCanvas();
      unsubscribeMemory();
    };
  }, [isPaused]);

  // Handle auto-scroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, activeTab]);

  // Render Live Canvas memory/FPS chart
  useEffect(() => {
    if (activeTab !== 'memory' || !memoryCanvasRef.current || memoryHistory.length === 0) return;
    const canvas = memoryCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = document.documentElement.classList.contains('dark');

    // Clear and draw background
    ctx.fillStyle = isDark ? '#09090b' : '#f4f4f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = isDark ? '#18181b' : '#e4e4e7';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (canvas.height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const maxItems = Math.min(canvas.width, memoryHistory.length);
    const stepX = canvas.width / 120; // limit chart to 120 historic ticks

    // Draw memory heap line (emerald)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    memoryHistory.forEach((m, idx) => {
      const x = idx * stepX;
      // Normalise used heap ratio. Limit standard heap to 100MB for display scaling
      const heapRatio = m.usedJSHeapSize ? (m.usedJSHeapSize / (m.jsHeapSizeLimit || 100000000)) : 0.2;
      const y = canvas.height - (heapRatio * canvas.height * 0.8) - 10;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw FPS line (rose)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    memoryHistory.forEach((m, idx) => {
      const x = idx * stepX;
      const fpsRatio = (m.fps || 60) / 60;
      const y = canvas.height - (fpsRatio * canvas.height * 0.7) - 15;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Labels
    ctx.fillStyle = isDark ? '#a1a1aa' : '#71717a';
    ctx.font = '10px monospace';
    ctx.fillText('FPS / JS Heap allocation History (120s Ticks)', 10, 20);
    ctx.fillStyle = '#10b981';
    ctx.fillText('■ JS Heap Memory usage', 10, 35);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('■ FPS Frame rate (60 Hz)', 150, 35);
  }, [memoryHistory, activeTab]);

  // Extract unique modules dynamically for filter select
  const uniqueModules = Array.from(new Set(logs.map(l => l.module)));

  // Filter logs logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.file && log.file.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesModule = filterModule === 'ALL' || log.module === filterModule;
    return matchesSearch && matchesLevel && matchesModule;
  });

  // Level Styling map
  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'TRACE': return 'text-zinc-400 bg-zinc-950 border-zinc-900';
      case 'DEBUG': return 'text-sky-400 bg-sky-950/20 border-sky-900/40';
      case 'INFO': return 'text-blue-400 bg-blue-950/20 border-blue-900/40';
      case 'SUCCESS': return 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40';
      case 'WARNING': return 'text-amber-400 bg-amber-950/20 border-amber-900/40';
      case 'ERROR': return 'text-orange-400 bg-orange-950/20 border-orange-900/40';
      case 'CRITICAL': return 'text-rose-400 bg-rose-950/20 border-rose-900/40 font-semibold';
      case 'FATAL': return 'text-red-100 bg-red-950 border-red-800 font-bold animate-pulse';
    }
  };

  // Module Palette Map
  const getModuleColor = (mod: string) => {
    const colors: Record<string, string> = {
      'System': 'text-purple-400 bg-purple-950/25 border-purple-900/30',
      'API Client': 'text-pink-400 bg-pink-950/25 border-pink-900/30',
      'Canvas Renderer': 'text-teal-400 bg-teal-950/25 border-teal-900/30',
      'Image Cache': 'text-indigo-400 bg-indigo-950/25 border-indigo-900/30',
      'Font Loader': 'text-emerald-400 bg-emerald-950/25 border-emerald-900/30',
      'MemberCard Renderer': 'text-orange-400 bg-orange-950/25 border-orange-900/30',
      'Authentication': 'text-amber-400 bg-amber-950/25 border-amber-900/30',
      'Exporter': 'text-cyan-400 bg-cyan-950/25 border-cyan-900/30',
    };
    return colors[mod] || 'text-zinc-300 bg-zinc-900 border-zinc-800';
  };

  // Utility actions
  const handleClear = () => {
    DebugLogger.clearLogs();
    setLogs([]);
    setRequests([]);
    setImages([]);
    setCanvasInfo(null);
    setSelectedLog(null);
    setSelectedRequest(null);
  };

  const handleCopyLogs = () => {
    const data = logs.map(l => `[${l.timestamp.toISOString()}] [${l.level}] [${l.module}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(data);
    alert('Logs copied to clipboard!');
  };

  const handleExport = (format: 'txt' | 'json' | 'csv') => {
    const sysMeta = {
      browser: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      os: navigator.platform,
      url: window.location.href,
      exportedAt: new Date().toISOString()
    };

    let content = '';
    let mimeType = 'text/plain';
    let filename = `debug_report_${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify({ system: sysMeta, logs, network: requests, assets: images, canvas: canvasInfo }, null, 2);
      mimeType = 'application/json';
      filename += '.json';
    } else if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'Level', 'Module', 'Message', 'File', 'Line'];
      const rows = logs.map(l => [l.id, l.timestamp.toISOString(), l.level, l.module, l.message, l.file || '', l.line || '']);
      content = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
      mimeType = 'text/csv';
      filename += '.csv';
    } else {
      content = `=========================================\nDEVELOPER DEBUG LOG REPORT\n=========================================\n`;
      content += `EXPORTED AT: ${sysMeta.exportedAt}\nOS: ${sysMeta.os}\nVIEWPORT: ${sysMeta.viewport}\nROUTE: ${sysMeta.url}\nAGENT: ${sysMeta.browser}\n\n`;
      content += `LOG ENTRIES:\n`;
      logs.forEach(l => {
        content += `[${l.timestamp.toISOString()}] [${l.level}] [${l.module}] [${l.file || 'System'}:${l.line || 0}] ${l.message}\n`;
        if (l.stackTrace) content += `  StackTrace: ${l.stackTrace.substring(0, 300)}...\n`;
      });
      filename += '.txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const inspectCodeFile = (file: string, line: number) => {
    setSelectedSourceFile(file);
    setSelectedSourceLine(line);
    setActiveTab('source');
  };

  // Dragging event handlers for floating window
  const onMouseDownDrag = (e: React.MouseEvent) => {
    if (dock !== 'floating') return;
    // Don't drag if clicking buttons
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select') || (e.target as HTMLElement).closest('input')) return;
    
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...floatPos };
    
    document.addEventListener('mousemove', onMouseMoveDrag);
    document.addEventListener('mouseup', onMouseUpDrag);
  };

  const onMouseMoveDrag = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setFloatPos({
      x: posStartRef.current.x + dx,
      y: posStartRef.current.y + dy
    });
  };

  const onMouseUpDrag = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', onMouseMoveDrag);
    document.removeEventListener('mouseup', onMouseUpDrag);
  };

  // Resizing event handlers for floating window
  const onMouseDownResize = (e: React.MouseEvent) => {
    if (dock !== 'floating') return;
    e.stopPropagation();
    e.preventDefault();
    isResizingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    sizeStartRef.current = { ...floatSize };

    document.addEventListener('mousemove', onMouseMoveResize);
    document.addEventListener('mouseup', onMouseUpResize);
  };

  const onMouseMoveResize = (e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setFloatSize({
      width: Math.max(400, sizeStartRef.current.width + dx),
      height: Math.max(300, sizeStartRef.current.height + dy)
    });
  };

  const onMouseUpResize = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', onMouseMoveResize);
    document.removeEventListener('mouseup', onMouseUpResize);
  };

  // Dock CSS helper
  const getDockClasses = () => {
    switch (dock) {
      case 'left': return 'fixed left-0 top-0 h-screen w-[450px] z-[9999] border-r';
      case 'right': return 'fixed right-0 top-0 h-screen w-[450px] z-[9999] border-l';
      case 'bottom': return 'fixed bottom-0 left-0 w-screen h-[400px] z-[9999] border-t';
      case 'fullscreen': return 'fixed inset-0 w-screen h-screen z-[9999]';
      case 'floating': return 'fixed z-[9999] border shadow-2xl rounded-lg overflow-hidden';
    }
  };

  const getDockInlineStyle = () => {
    if (dock === 'floating') {
      return {
        left: `${floatPos.x}px`,
        top: `${floatPos.y}px`,
        width: `${floatSize.width}px`,
        height: `${floatSize.height}px`
      };
    }
    return {};
  };

  // Mock Source File Contents Map for complete code snippet preview in Source Inspector
  const virtualSourceFiles: Record<string, { code: string; desc: string }> = {
    'MemberCardRenderer.ts': {
      desc: 'canvas-renderer/MemberCardRenderer.ts',
      code: `// MemberCardRenderer.ts
export class MemberCardRenderer {
  public static async drawMemberCard(
    member: MemberRegistration,
    settings: WebSettings | undefined,
    exportScale = 2.5,
    onLog?: (msg: string) => void
  ): Promise<HTMLCanvasElement> {
    // 1. Ensure fonts are loaded
    await FontLoader.loadFonts();
    
    // 2. Load Core Assets with CORS Proxy Wrapper
    const logo1 = await AssetLoader.loadAsset('https://i.ibb.co.com/...', 'Logo', onLog);
    const logo2 = await AssetLoader.loadAsset('https://i.ibb.co/...', 'Banner', onLog);
    
    // 3. Initiate virtual Konva stage pipeline
    const stage = new Konva.Stage({ width: 1011, height: 638 });
    const backgroundLayer = new Konva.Layer();
    
    // 4. Draw graphics objects, layers & patterns
    const rect = new Konva.Rect({ width: 1011, height: 638, fill: '#800000' });
    backgroundLayer.add(rect);
    stage.add(backgroundLayer);
    
    // 5. Build dynamic QR using google verification route
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);
    
    stage.draw();
    return await stage.toCanvas();
  }
}`
    },
    'MemberPortal.tsx': {
      desc: 'components/MemberPortal.tsx',
      code: `// MemberPortal.tsx
const handleDownloadCard = async () => {
  addLog('ডাউনলোড শুরু হচ্ছে...');
  try {
    const canvas = await MemberCardRenderer.drawMemberCard(member, settings, 2.5, addLog);
    const dataUrl = canvas.toDataURL('image/png');
    
    // Intercepted and passed to Downloader client
    await Downloader.trigger(dataUrl, \`SSF_ID_\${member.name}.png\`);
    addLog('ডাউনলোড সফল হয়েছে!');
  } catch (err) {
    addLog(\`ব্যর্থতা: \${err.message}\`);
    DebugLogger.log('ERROR', 'Exporter', err.message, { exception: err });
  }
};`
    },
    'App.tsx': {
      desc: 'App.tsx',
      code: `// App.tsx entry point
export default function App() {
  const [db, setDb] = useState<AppDatabase | null>(null);
  
  useEffect(() => {
    // Initialise firestore data connection
    fetchFirestoreDatabase().then(data => {
      setDb(data);
      DebugLogger.log('SUCCESS', 'Database', 'Firestore loaded successfully', { args: [data] });
    });
  }, []);
}`
    }
  };

  const activeSourceInfo = virtualSourceFiles[selectedSourceFile] || { desc: selectedSourceFile, code: '// Source file code is currently not cached inside source viewer database.' };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 15 }}
          className={`${getDockClasses()} bg-zinc-100 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-900 font-mono text-[11px] text-zinc-700 dark:text-zinc-350 flex flex-col shadow-2xl select-none`}
          style={getDockInlineStyle()}
          id="debug-console-stage"
        >
            {/* Header with Drag handle */}
            <div 
              onMouseDown={onMouseDownDrag}
              className={`h-9 px-3 bg-zinc-200 dark:bg-zinc-900 border-b border-zinc-300 dark:border-zinc-950 flex items-center justify-between shrink-0 ${dock === 'floating' ? 'cursor-move' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-bold text-zinc-800 dark:text-zinc-150 tracking-wide uppercase text-[10px]">Developer Debugger Toolset</span>
                <span className="text-[9px] bg-zinc-150 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 text-zinc-600 dark:text-zinc-550 px-1 rounded font-mono">v1.2-beta</span>
                {isPaused && (
                  <span className="text-[9px] bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-400 px-1.5 rounded animate-pulse">PAUSED</span>
                )}
              </div>

              {/* Window Commands and Docks */}
              <div className="flex items-center gap-1.5">
                <select
                  value={dock}
                  onChange={(e) => setDock(e.target.value as any)}
                  className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 text-[10px] rounded px-1.5 py-0.5"
                >
                  <option value="floating">Floating Window</option>
                  <option value="left">Dock Left</option>
                  <option value="right">Dock Right</option>
                  <option value="bottom">Dock Bottom</option>
                  <option value="fullscreen">Fullscreen</option>
                </select>

                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1 hover:bg-zinc-250 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-200 rounded transition"
                  title="Collapse Window"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transform transition-transform ${isCollapsed ? 'rotate-90' : 'rotate-270'}`} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950 text-zinc-500 dark:text-zinc-450 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                  title="Close Logger"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inner Dashboard */}
            {!isCollapsed && (
              <div className="flex-grow flex flex-row overflow-hidden min-h-0 bg-white dark:bg-zinc-950">
                {/* Lateral Tab Bar */}
                <div className="w-32 bg-zinc-200/50 dark:bg-zinc-900/60 border-r border-zinc-300 dark:border-zinc-900 shrink-0 flex flex-col justify-between py-2">
                  <div className="space-y-0.5 px-1.5">
                    {[
                      { id: 'logs', label: 'Console Logs', icon: Terminal },
                      { id: 'network', label: 'Network Requests', icon: Globe },
                      { id: 'images', label: 'Image Asset Diagnostics', icon: Image },
                      { id: 'canvas', label: 'Canvas Taint Check', icon: Layers },
                      { id: 'memory', label: 'Memory Tracker', icon: Activity },
                      { id: 'errors', label: 'Smart Diagnostics', icon: AlertOctagon },
                      { id: 'source', label: 'Source Inspector', icon: Code }
                    ].map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`w-full py-2 px-2.5 rounded text-left flex items-center gap-1.5 transition-all cursor-pointer text-[10px] ${
                            activeTab === tab.id 
                              ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500 shadow-sm' 
                              : 'text-zinc-600 dark:text-zinc-450 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-900/60'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-2 space-y-1">
                    <div className="border-t border-zinc-350 dark:border-zinc-900 pt-2 mb-2 text-[9px] text-zinc-500 dark:text-zinc-550">OPERATIONS</div>
                    <button
                      onClick={handleClear}
                      className="w-full py-1 px-2 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-450 text-[9.5px] border border-zinc-300 dark:border-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-200 rounded flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                    <button
                      onClick={handleCopyLogs}
                      className="w-full py-1 px-2 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-450 text-[9.5px] border border-zinc-300 dark:border-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-200 rounded flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Logs</span>
                    </button>
                    <div className="grid grid-cols-3 gap-1">
                      <button 
                        onClick={() => handleExport('txt')}
                        className="py-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-450 text-[9px]"
                        title="Export TXT"
                      >
                        TXT
                      </button>
                      <button 
                        onClick={() => handleExport('json')}
                        className="py-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-450 text-[9px]"
                        title="Export JSON"
                      >
                        JS
                      </button>
                      <button 
                        onClick={() => handleExport('csv')}
                        className="py-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-450 text-[9px]"
                        title="Export CSV"
                      >
                        CSV
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary Content Screen */}
                <div className="flex-grow flex flex-col overflow-hidden min-h-0 bg-zinc-50/50 dark:bg-black/30">
                  {/* Tab Contents */}
                  {activeTab === 'logs' && (
                    <div className="flex-grow flex flex-col overflow-hidden min-h-0">
                      {/* Filter Toolbar */}
                      <div className="h-9 px-3 bg-zinc-150/55 dark:bg-zinc-900/40 border-b border-zinc-350 dark:border-zinc-900 flex items-center gap-3 shrink-0 text-[10px]">
                        <div className="flex items-center bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 rounded px-1.5 py-0.5 flex-grow max-w-xs">
                          <Search className="w-3 h-3 text-zinc-550 shrink-0 mr-1.5" />
                          <input
                            type="text"
                            placeholder="Filter logs by keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-200 w-full text-[10.5px] font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500">Level:</span>
                          <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 text-zinc-800 dark:text-zinc-350 rounded px-1 py-0.5 text-[9.5px]"
                          >
                            <option value="ALL">ALL</option>
                            <option value="TRACE">TRACE</option>
                            <option value="DEBUG">DEBUG</option>
                            <option value="INFO">INFO</option>
                            <option value="SUCCESS">SUCCESS</option>
                            <option value="WARNING">WARNING</option>
                            <option value="ERROR">ERROR</option>
                            <option value="CRITICAL">CRITICAL</option>
                            <option value="FATAL">FATAL</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500">Module:</span>
                          <select
                            value={filterModule}
                            onChange={(e) => setFilterModule(e.target.value)}
                            className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 text-zinc-800 dark:text-zinc-350 rounded px-1 py-0.5 text-[9.5px] max-w-[120px]"
                          >
                            <option value="ALL">ALL</option>
                            {uniqueModules.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1 ml-auto shrink-0">
                          <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`p-1 border rounded text-[9.5px] flex items-center gap-1 px-1.5 transition-colors cursor-pointer ${
                              isPaused 
                                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/35' 
                                : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-900'
                            }`}
                          >
                            {isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                            <span>{isPaused ? 'Resume' : 'Pause'}</span>
                          </button>

                          <button
                            onClick={() => setAutoScroll(!autoScroll)}
                            className={`p-1 border rounded text-[9.5px] flex items-center gap-1 px-1.5 transition-colors cursor-pointer ${
                              autoScroll 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-400' 
                                : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400 dark:hover:bg-zinc-900'
                            }`}
                          >
                            <ArrowDown className="w-2.5 h-2.5" />
                            <span>Auto Scroll</span>
                          </button>
                        </div>
                      </div>

                      {/* Split view: Logs list on left, details pane on right (if selected) */}
                      <div className="flex-grow flex overflow-hidden min-h-0">
                        {/* Logs list scrollframe */}
                        <div className="flex-grow overflow-y-auto p-2 space-y-1 bg-zinc-100/50 dark:bg-black/20">
                          {filteredLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 select-none py-10">
                              <Terminal className="w-6 h-6 text-zinc-450" />
                              <span>No matching log records captured yet.</span>
                            </div>
                          ) : (
                            filteredLogs.map(log => (
                              <div
                                key={log.id}
                                onClick={() => setSelectedLog(log)}
                                className={`group p-1.5 rounded border flex items-start gap-2.5 cursor-pointer transition text-[10px] select-text ${
                                  selectedLog?.id === log.id 
                                    ? 'bg-zinc-200 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-750 text-zinc-900 dark:text-zinc-100 font-medium animate-none' 
                                    : 'bg-white dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 hover:border-zinc-350 dark:hover:border-zinc-850'
                                }`}
                              >
                                <span className="text-zinc-500 dark:text-zinc-650 shrink-0 font-mono text-[9px] mt-0.5">
                                  {log.timestamp.toLocaleTimeString()}
                                </span>
                                <span className={`text-[9px] px-1 py-0.2 rounded border shrink-0 font-bold uppercase tracking-wider ${getLevelColor(log.level)}`}>
                                  {log.level}
                                </span>
                                <span className={`text-[9px] px-1 py-0.2 rounded border shrink-0 font-bold font-mono ${getModuleColor(log.module)}`}>
                                  {log.module}
                                </span>
                                <span className="flex-grow font-sans break-all truncate text-zinc-700 dark:text-zinc-300">
                                  {log.message}
                                </span>
                                {log.file && (
                                  <span className="text-[9px] font-mono text-zinc-600 shrink-0 group-hover:text-zinc-450 transition">
                                    {log.file}:{log.line}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                          <div ref={logsEndRef} />
                        </div>

                        {/* Selected Log Inspector Sidepane */}
                        <AnimatePresence>
                          {selectedLog && (
                            <motion.div
                              initial={{ width: 0, opacity: 0 }}
                              animate={{ width: 340, opacity: 1 }}
                              exit={{ width: 0, opacity: 0 }}
                              className="w-[340px] shrink-0 border-l border-zinc-300 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden min-h-0"
                            >
                              <div className="h-8 bg-zinc-200/80 dark:bg-zinc-900/80 border-b border-zinc-300 dark:border-zinc-900 px-3 flex items-center justify-between shrink-0">
                                <span className="font-bold text-zinc-800 dark:text-zinc-250 text-[10px] uppercase tracking-wide flex items-center gap-1.5">
                                  <Terminal className="w-3 h-3 text-emerald-400" />
                                  Log Payload Inspector
                                </span>
                                <button 
                                  onClick={() => setSelectedLog(null)} 
                                  className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-550 dark:hover:text-zinc-350"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="flex-grow overflow-y-auto p-3 space-y-3">
                                <div>
                                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">Log Message</div>
                                  <div className="bg-white dark:bg-black/40 p-2 border border-zinc-200 dark:border-zinc-900 rounded text-zinc-800 dark:text-zinc-200 select-text font-sans text-[11px] leading-relaxed break-words">
                                    {selectedLog.message}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <div className="text-[9px] text-zinc-500 uppercase">Timestamp</div>
                                    <div className="text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900/60 p-1 border border-zinc-200 dark:border-zinc-900/40 rounded mt-0.5 font-mono text-[9.5px]">
                                      {selectedLog.timestamp.toISOString()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[9px] text-zinc-500 uppercase">Log Level</div>
                                    <div className="text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900/60 p-1 border border-zinc-200 dark:border-zinc-900/40 rounded mt-0.5 font-mono text-[9.5px]">
                                      {selectedLog.level}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <div className="text-[9px] text-zinc-500 uppercase">Module</div>
                                    <div className="text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900/60 p-1 border border-zinc-200 dark:border-zinc-900/40 rounded mt-0.5 font-mono text-[9.5px]">
                                      {selectedLog.module}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[9px] text-zinc-500 uppercase">Log Origin</div>
                                    <div className="text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900/60 p-1 border border-zinc-200 dark:border-zinc-900/40 rounded mt-0.5 font-mono text-[9.5px]">
                                      {selectedLog.source} Thread
                                    </div>
                                  </div>
                                </div>

                                {selectedLog.file && (
                                  <div>
                                    <div className="text-[9px] text-zinc-500 uppercase">Code Coordinates</div>
                                    <div className="bg-zinc-200/50 dark:bg-zinc-900/80 p-2 border border-zinc-300 dark:border-zinc-900 rounded space-y-1 mt-1">
                                      <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-sky-600 dark:text-sky-400 font-semibold truncate max-w-[180px]">{selectedLog.file}</span>
                                        <span className="text-emerald-500">Line {selectedLog.line}:{selectedLog.column}</span>
                                      </div>
                                      <div className="text-[9px] text-zinc-500 dark:text-zinc-550 truncate">{selectedLog.absolutePath}</div>
                                      
                                      {/* Virtual Open in Editor link */}
                                      {virtualSourceFiles[selectedLog.file] && (
                                        <button
                                          onClick={() => inspectCodeFile(selectedLog.file!, selectedLog.line || 1)}
                                          className="mt-1.5 w-full py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/60 border border-sky-200 dark:border-sky-900/30 rounded text-[9.5px] cursor-pointer flex items-center justify-center gap-1 transition"
                                        >
                                          <Code className="w-3 h-3" />
                                          <span>Open file in Source Inspector</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {selectedLog.executionTime !== undefined && (
                                  <div>
                                    <div className="text-[9px] text-zinc-500 uppercase">Execution Latency</div>
                                    <div className="text-emerald-400 bg-zinc-900/60 p-1.5 border border-zinc-900 rounded mt-0.5 font-mono text-[10px] font-bold">
                                      ⚡ {selectedLog.executionTime.toFixed(2)} ms
                                    </div>
                                  </div>
                                )}

                                {selectedLog.stackTrace && (
                                  <div>
                                    <div className="text-[9px] text-zinc-500 uppercase mb-1">Execution Call Stack</div>
                                    <div className="bg-black/65 p-2 border border-zinc-900 rounded text-[9px] font-mono text-rose-350/90 leading-relaxed overflow-x-auto max-h-36 whitespace-pre overflow-y-auto select-text scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                      {selectedLog.stackTrace}
                                    </div>
                                  </div>
                                )}

                                {selectedLog.args && selectedLog.args.length > 0 && (
                                  <div>
                                    <div className="text-[9px] text-zinc-500 uppercase mb-1">Function Arguments</div>
                                    <pre className="bg-black/50 p-2 border border-zinc-900 rounded text-[8.5px] text-zinc-400 overflow-x-auto max-h-24 overflow-y-auto select-text">
                                      {JSON.stringify(selectedLog.args, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {selectedLog.returnValue !== undefined && (
                                  <div>
                                    <div className="text-[9px] text-zinc-500 uppercase mb-1">Function Return Value</div>
                                    <pre className="bg-black/50 p-2 border border-zinc-900 rounded text-[8.5px] text-emerald-400 overflow-x-auto max-h-24 overflow-y-auto select-text">
                                      {JSON.stringify(selectedLog.returnValue, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {selectedLog.exception && (
                                  <div className="bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-md space-y-1">
                                    <div className="text-rose-400 font-bold text-[9.5px] flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                      Exception Discovered
                                    </div>
                                    <div className="text-[10px] text-rose-300 font-sans leading-relaxed select-text">
                                      {selectedLog.exception.message || String(selectedLog.exception)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {activeTab === 'network' && (
                    <div className="flex-grow flex overflow-hidden min-h-0">
                      {/* Left: Requests list */}
                      <div className="flex-grow overflow-y-auto p-2 space-y-1 bg-zinc-100/30 dark:bg-black/10">
                        <div className="text-[9.5px] text-zinc-500 uppercase px-1 pb-1.5 border-b border-zinc-200 dark:border-zinc-900 mb-2 font-bold tracking-wider">
                          Intercepted Global network fetch Logs ({requests.length})
                        </div>
                        {requests.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 py-10">
                            <Globe className="w-6 h-6 text-zinc-400" />
                            <span>No remote network activity cached.</span>
                          </div>
                        ) : (
                          requests.map(req => {
                            const isErr = !req.status || req.status >= 400;
                            return (
                              <div
                                key={req.id}
                                onClick={() => setSelectedRequest(req)}
                                className={`p-1.5 rounded border cursor-pointer transition flex items-center justify-between ${
                                  selectedRequest?.id === req.id 
                                    ? 'bg-zinc-250 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-750 text-zinc-900 dark:text-zinc-100 font-medium' 
                                    : 'bg-white dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/30 hover:border-zinc-350 dark:hover:border-zinc-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 max-w-[75%]">
                                  <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold font-mono ${
                                    isErr 
                                      ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900/40' 
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900/40'
                                  }`}>
                                    {req.status || 'FAILED'}
                                  </span>
                                  <span className="text-[9px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-150 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 px-1 rounded min-w-[36px] text-center uppercase">
                                    {req.method}
                                  </span>
                                  <span className="truncate text-[10px] text-zinc-700 dark:text-zinc-250 font-mono" title={req.url}>
                                    {req.url}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-zinc-500 shrink-0 font-mono">
                                  <span>{req.responseTime ? `${req.responseTime.toFixed(0)}ms` : 'Waiting'}</span>
                                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                  <span>{req.payloadSize ? `${(req.payloadSize / 1024).toFixed(1)} KB` : '0B'}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Right: Selected Request details payload */}
                      <AnimatePresence>
                        {selectedRequest && (
                          <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 360, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="w-[360px] shrink-0 border-l border-zinc-300 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden min-h-0"
                          >
                            <div className="h-8 bg-zinc-200/80 dark:bg-zinc-900/80 border-b border-zinc-300 dark:border-zinc-900 px-3 flex items-center justify-between shrink-0">
                              <span className="font-bold text-zinc-800 dark:text-zinc-250 text-[10px] uppercase tracking-wide flex items-center gap-1.5">
                                <Globe className="w-3 h-3 text-cyan-400" />
                                Network Traffic Auditor
                              </span>
                              <button 
                                onClick={() => setSelectedRequest(null)} 
                                className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-550 dark:hover:text-zinc-350"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-3 space-y-4">
                              <div>
                                <div className="text-[9px] text-zinc-500 uppercase">Target Endpoint URL</div>
                                <div className="bg-white dark:bg-black/50 p-2 border border-zinc-200 dark:border-zinc-900 rounded font-mono text-[9.5px] text-sky-600 dark:text-sky-400 select-text break-all mt-1">
                                  {selectedRequest.url}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="text-[9px] text-zinc-500 uppercase">HTTP Status</div>
                                  <div className={`p-1 border rounded font-mono text-[10px] font-bold mt-1 text-center ${
                                    !selectedRequest.status || selectedRequest.status >= 400 
                                      ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/45 dark:border-rose-900 dark:text-rose-400' 
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/45 dark:border-emerald-900 dark:text-emerald-400'
                                  }`}>
                                    {selectedRequest.status || 'CONNECTION LOST'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[9px] text-zinc-500 uppercase">Latency Timing</div>
                                  <div className="bg-white dark:bg-zinc-900/60 p-1.5 border border-zinc-200 dark:border-zinc-900 text-zinc-700 dark:text-zinc-300 rounded font-mono text-[10px] font-bold mt-1 text-center">
                                    ⏱️ {selectedRequest.responseTime ? `${selectedRequest.responseTime.toFixed(2)} ms` : 'calculating...'}
                                  </div>
                                </div>
                              </div>

                              {selectedRequest.headers && (
                                <div>
                                  <div className="text-[9px] text-zinc-500 uppercase mb-1">Request Headers</div>
                                  <pre className="bg-white dark:bg-black/40 p-2 border border-zinc-200 dark:border-zinc-900 rounded text-[9px] text-zinc-700 dark:text-zinc-400 overflow-x-auto max-h-24 select-text">
                                    {JSON.stringify(selectedRequest.headers, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {selectedRequest.requestBody && (
                                <div>
                                  <div className="text-[9px] text-zinc-500 uppercase mb-1">Request Payload Body</div>
                                  <pre className="bg-white dark:bg-black/40 p-2 border border-zinc-200 dark:border-zinc-900 rounded text-[9px] text-zinc-700 dark:text-zinc-300 overflow-x-auto max-h-28 select-text font-mono">
                                    {selectedRequest.requestBody}
                                  </pre>
                                </div>
                              )}

                              {selectedRequest.responseHeaders && (
                                <div>
                                  <div className="text-[9px] text-zinc-500 uppercase mb-1">Response Headers (CORS visible)</div>
                                  <pre className="bg-white dark:bg-black/40 p-2 border border-zinc-200 dark:border-zinc-900 rounded text-[9px] text-zinc-700 dark:text-zinc-400 overflow-x-auto max-h-24 select-text">
                                    {JSON.stringify(selectedRequest.responseHeaders, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {selectedRequest.responseBody && (
                                <div>
                                  <div className="text-[9px] text-zinc-500 uppercase mb-1">Response JSON Body</div>
                                  <div className="bg-white dark:bg-black/70 p-2 border border-zinc-200 dark:border-zinc-900 rounded text-[9px] text-zinc-700 dark:text-zinc-250 overflow-x-auto max-h-48 overflow-y-auto select-text font-mono leading-relaxed scrollbar-thin">
                                    {selectedRequest.responseBody.startsWith('{') || selectedRequest.responseBody.startsWith('[') ? (
                                      <pre>{JSON.stringify(JSON.parse(selectedRequest.responseBody), null, 2)}</pre>
                                    ) : (
                                      <div className="whitespace-pre-wrap">{selectedRequest.responseBody}</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {activeTab === 'images' && (
                    <div className="flex-grow overflow-y-auto p-3 space-y-4">
                      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-900 pb-2">
                        <span className="font-bold text-[10px] uppercase text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
                          <Image className="w-4 h-4" />
                          Image Asset Integrity & CORS Inspector
                        </span>
                        <span className="text-[9px] text-zinc-500">
                          Total monitored: {images.length} assets
                        </span>
                      </div>

                      {images.length === 0 ? (
                        <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                          <Image className="w-8 h-8 text-zinc-400" />
                          <span>No dynamic images loaded in the current workspace session.</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {images.map(img => (
                            <div key={img.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-2.5 rounded-md space-y-2.5 relative overflow-hidden shadow-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 shrink-0 bg-zinc-100 dark:bg-black/60 rounded border border-zinc-200 dark:border-zinc-850 overflow-hidden flex items-center justify-center">
                                  <img 
                                    src={img.resolvedUrl} 
                                    alt="scanned" 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-contain"
                                    onError={(e) => { (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="gray"/></svg>'; }}
                                  />
                                </div>
                                <div className="min-w-0 flex-grow">
                                  <div className="text-[10px] text-zinc-800 dark:text-zinc-200 truncate font-semibold select-text" title={img.originalUrl}>
                                    {img.originalUrl.split('/').pop()}
                                  </div>
                                  <div className="text-[8.5px] text-zinc-450 dark:text-zinc-555 truncate mt-0.5 select-text">
                                    {img.originalUrl}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                                <div className="bg-zinc-100/50 dark:bg-zinc-900/60 p-1 border border-zinc-200 dark:border-zinc-850/40 rounded">
                                  <span className="text-zinc-500">Dimensions:</span>
                                  <div className="text-zinc-700 dark:text-zinc-350">{img.width && img.height ? `${img.width}x${img.height} px` : 'Calculating'}</div>
                                </div>
                                <div className="bg-zinc-100/50 dark:bg-zinc-900/60 p-1 border border-zinc-200 dark:border-zinc-850/40 rounded">
                                  <span className="text-zinc-500">Byte Size:</span>
                                  <div className="text-zinc-700 dark:text-zinc-350">{img.fileSize ? `${(img.fileSize / 1024).toFixed(1)} KB` : 'Unknown'}</div>
                                </div>
                                <div className="bg-zinc-100/50 dark:bg-zinc-900/60 p-1 border border-zinc-200 dark:border-zinc-850/40 rounded">
                                  <span className="text-zinc-500">CORS Support:</span>
                                  <div className={`font-bold ${img.corsStatus === 'CORRECT' || img.corsStatus === 'PROXY_BYPASS' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {img.corsStatus}
                                  </div>
                                </div>
                                <div className="bg-zinc-100/50 dark:bg-zinc-900/60 p-1 border border-zinc-200 dark:border-zinc-850/40 rounded">
                                  <span className="text-zinc-500">Decoded:</span>
                                  <div className="text-zinc-700 dark:text-zinc-350">{img.decoded ? '✅ GPU ACCEL' : '❌ PENDING'}</div>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
                                <span className="text-[9px] text-zinc-450 dark:text-zinc-550">Canvas Serialisation:</span>
                                <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                  img.safeForCanvas 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900/40' 
                                    : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-900/40'
                                }`}>
                                  {img.safeForCanvas ? 'SAFE FOR CANVAS' : 'TAINT DANGER!'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'canvas' && (
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-900 pb-2">
                        <span className="font-bold text-[10px] uppercase text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                          <Layers className="w-4 h-4" />
                          Virtual Canvas Taint Inspector (Konva Matrix)
                        </span>
                        <span className="text-[9px] text-zinc-500 dark:text-zinc-550">
                          Active State Node: {canvasInfo ? 'MOUNTED' : 'OFFLINE'}
                        </span>
                      </div>

                      {!canvasInfo ? (
                        <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                          <Layers className="w-8 h-8 text-zinc-400" />
                          <span>No Canvas rendering action logged in this session yet. Generate an e-card to scan.</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Left column: stats */}
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-3 rounded-md space-y-3.5 col-span-1 shadow-sm">
                            <h3 className="text-zinc-800 dark:text-zinc-200 font-bold border-b border-zinc-200 dark:border-zinc-900 pb-1.5 text-[10px] uppercase tracking-wide">
                              Core Canvas Parameters
                            </h3>
                            <div className="space-y-2 text-[10px] font-mono">
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Matrix Bounds:</span>
                                <span className="text-zinc-800 dark:text-zinc-300 font-bold">{canvasInfo.width} x {canvasInfo.height} px</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Device Pixel Ratio:</span>
                                <span className="text-zinc-600 dark:text-zinc-350">{canvasInfo.pixelRatio}x (Retina)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Render Scaling:</span>
                                <span className="text-zinc-600 dark:text-zinc-350">{canvasInfo.scale.toFixed(2)}x (Export Mult)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Layers Count:</span>
                                <span className="text-zinc-800 dark:text-zinc-300 font-bold">{canvasInfo.layerCount} active layers</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Object Buffer Size:</span>
                                <span className="text-zinc-600 dark:text-zinc-350">{canvasInfo.objectCount} graphic shapes</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Drawing Duration:</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">⚡ {canvasInfo.renderTime.toFixed(1)} ms</span>
                              </div>
                            </div>
                          </div>

                          {/* Center column: security & taints */}
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-3 rounded-md space-y-3 col-span-2 shadow-sm">
                            <h3 className="text-zinc-800 dark:text-zinc-200 font-bold border-b border-zinc-200 dark:border-zinc-900 pb-1.5 text-[10px] uppercase tracking-wide">
                              Canvas Security & CORS Audit
                            </h3>
                            
                            <div className="flex items-start gap-3 bg-zinc-50 dark:bg-black/40 p-3 rounded border border-zinc-200 dark:border-zinc-900">
                              <div className={`p-2 rounded-full shrink-0 ${canvasInfo.tainted ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-500' : 'bg-emerald-100 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400'}`}>
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10.5px] font-bold text-zinc-800 dark:text-zinc-150">
                                  {canvasInfo.tainted ? 'CANVAS CONTAMINATED (TAINTED)' : 'CANVAS SAFE & EXPORTABLE'}
                                </div>
                                <p className="text-[9.5px] text-zinc-500 leading-relaxed font-sans">
                                  {canvasInfo.tainted 
                                    ? 'An external resource without valid CORS authorization headers was written onto the Canvas memory block. Browser standard security policies (Same-Origin) will now permanently block exporting or downloading this canvas as PNG / JPEG.' 
                                    : 'All written elements and images successfully authenticated. Canvas is fully authorized to perform image conversion buffers (toBlob/toDataURL) safely.'}
                                </p>
                              </div>
                            </div>

                            {canvasInfo.tainted && canvasInfo.taintedByObject && (
                              <div className="bg-rose-50/50 dark:bg-rose-950/15 border border-rose-200 dark:border-rose-900/35 p-3 rounded space-y-2">
                                <div className="text-rose-600 dark:text-rose-400 font-bold text-[9.5px] uppercase tracking-wider flex items-center gap-1">
                                  <Flame className="w-3.5 h-3.5" />
                                  Taint Origin identified
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-700 dark:text-zinc-350">
                                  <div>
                                    <span className="text-zinc-500">Tainted layer:</span>
                                    <div className="text-rose-600 dark:text-rose-350 font-bold mt-0.5">{canvasInfo.taintedByObject.layerName}</div>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500">Object Reference ID:</span>
                                    <div className="text-rose-600 dark:text-rose-350 mt-0.5">{canvasInfo.taintedByObject.objectId}</div>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[9px] text-zinc-500">Violation Reason:</span>
                                  <div className="text-[10px] text-rose-700 dark:text-rose-300 font-sans mt-0.5 leading-relaxed">
                                    {canvasInfo.taintedByObject.reason}
                                  </div>
                                </div>
                                <div className="text-[8.5px] text-zinc-500 break-all select-text bg-zinc-100 dark:bg-black/35 p-1 rounded">
                                  Resource Link: {canvasInfo.taintedByObject.url}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'memory' && (
                    <div className="flex-grow p-4 flex flex-col overflow-hidden min-h-0 space-y-3">
                      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-900 pb-1 shrink-0">
                        <span className="font-bold text-[10px] uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Heap Memory & Graphics Performance metrics
                        </span>
                        <div className="flex items-center gap-4 text-[9.5px] text-zinc-500 font-mono">
                          <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-rose-500" /> FPS: <b className="text-zinc-700 dark:text-zinc-350">{(memoryHistory[memoryHistory.length - 1]?.fps) || 60} Hz</b></span>
                        </div>
                      </div>

                      {/* Display live stats boxes */}
                      {memoryHistory.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 shrink-0">
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-2 rounded text-[10px] shadow-sm">
                            <span className="text-zinc-500 uppercase block text-[8px]">Used JS Heap</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-0.5 block">
                              {(memoryHistory[memoryHistory.length - 1].usedJSHeapSize / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-2 rounded text-[10px] shadow-sm">
                            <span className="text-zinc-500 uppercase block text-[8px]">Total Allocated Heap</span>
                            <span className="text-zinc-800 dark:text-zinc-300 font-bold text-xs mt-0.5 block">
                              {(memoryHistory[memoryHistory.length - 1].totalJSHeapSize / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-2 rounded text-[10px] shadow-sm">
                            <span className="text-zinc-500 uppercase block text-[8px]">JS Heap Max Limit</span>
                            <span className="text-zinc-600 dark:text-zinc-350 text-xs mt-0.5 block">
                              {(memoryHistory[memoryHistory.length - 1].jsHeapSizeLimit / (1024 * 1024)).toFixed(0)} MB
                            </span>
                          </div>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-2 rounded text-[10px] shadow-sm">
                            <span className="text-zinc-500 uppercase block text-[8px]">Active CPU Load %</span>
                            <span className="text-rose-600 dark:text-rose-400 font-bold text-xs mt-0.5 block">
                              ~{memoryHistory[memoryHistory.length - 1].cpuEstimation}% Load
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Line chart container */}
                      <div className="flex-grow bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded p-1.5 relative min-h-0 shadow-sm">
                        <canvas 
                          ref={memoryCanvasRef} 
                          width={600} 
                          height={200}
                          className="w-full h-full block rounded"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'errors' && (
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                      <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-900 pb-2">
                        <span className="font-bold text-[10px] uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <AlertOctagon className="w-4 h-4" />
                          System Crash auditor & Smart Diagnostics Analyzer
                        </span>
                        <span className="text-[9px] text-zinc-500">
                          Errors captured: {logs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL' || l.level === 'FATAL').length}
                        </span>
                      </div>

                      {logs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL' || l.level === 'FATAL').length === 0 ? (
                        <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
                          <span className="text-zinc-700 dark:text-zinc-400 font-semibold text-[11px]">No fatal errors or stack exceptions captured in the current pipeline!</span>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-650 max-w-sm mt-0.5 font-sans">Global listeners are active. In case a network timeout, CORS obstruction or canvas taint occurs, a breakdown report will appear here.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {logs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL' || l.level === 'FATAL').map(errLog => {
                            // Smart analysis suggestions map based on messages
                            let rootCause = 'An unexpected JavaScript runtime exception was thrown.';
                            let solution = 'Investigate the trace call stack to locate parameters causing state mutation crashes.';
                            
                            if (errLog.message.toLowerCase().includes('cors') || errLog.message.toLowerCase().includes('taint') || errLog.message.toLowerCase().includes('proxy')) {
                              rootCause = 'CORS Same-Origin restrictions prevented loading the asset directly from IBb or external hosts.';
                              solution = 'Enable settings to fetch using /api/proxy-image or verify crossOrigin policies on the HTMLImageElement.';
                            } else if (errLog.message.toLowerCase().includes('font')) {
                              rootCause = 'Local or network Banglish font file failed to fetch.';
                              solution = 'Check index.css for correct URL fonts declarations and check browser network offline state.';
                            } else if (errLog.message.toLowerCase().includes('firestore') || errLog.message.toLowerCase().includes('firebase')) {
                              rootCause = 'Cloud Firestore authentication expired or permission rules blocked document synchronization.';
                              solution = 'Refresh active session or consult firestore.rules to authorize reads/writes.';
                            }

                            return (
                              <div key={errLog.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md p-3.5 space-y-3 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.2 rounded border text-[8.5px] font-bold bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950 dark:border-rose-900 dark:text-rose-400">
                                    {errLog.level}
                                  </span>
                                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-150 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 px-1 rounded font-mono">
                                    {errLog.module}
                                  </span>
                                  <span className="text-[9px] text-zinc-500 dark:text-zinc-550 ml-auto font-mono">{errLog.timestamp.toLocaleTimeString()}</span>
                                </div>

                                <div className="text-[11px] text-rose-700 dark:text-zinc-200 select-text font-semibold bg-rose-50/50 dark:bg-black/40 p-2 rounded border border-rose-200 dark:border-zinc-900 font-mono">
                                  ❌ {errLog.message}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 text-[10px]">
                                  <div className="bg-zinc-100/50 dark:bg-zinc-900/40 p-2.5 rounded border border-zinc-200 dark:border-zinc-850/50 space-y-1">
                                    <span className="text-zinc-500 font-bold uppercase text-[8px] tracking-wider block">Root Cause Analysis</span>
                                    <p className="text-zinc-700 dark:text-zinc-350 leading-relaxed font-sans">{rootCause}</p>
                                  </div>
                                  <div className="bg-emerald-50/30 dark:bg-emerald-950/10 p-2.5 rounded border border-emerald-200/50 dark:border-emerald-900/20 space-y-1">
                                    <span className="text-emerald-600 dark:text-emerald-500 font-bold uppercase text-[8px] tracking-wider block">Suggested Technical Action</span>
                                    <p className="text-zinc-800 dark:text-zinc-300 leading-relaxed font-sans font-medium">💡 {solution}</p>
                                  </div>
                                </div>

                                {errLog.stackTrace && (
                                  <div className="space-y-1">
                                    <span className="text-[8px] text-zinc-500 uppercase tracking-wider block">Diagnostic Frame coordinates</span>
                                    <pre className="bg-zinc-100 dark:bg-black/70 p-2 rounded text-[8.5px] text-zinc-750 dark:text-zinc-450 overflow-x-auto max-h-24 overflow-y-auto select-text font-mono scrollbar-thin">
                                      {errLog.stackTrace}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'source' && (
                    <div className="flex-grow flex flex-col overflow-hidden min-h-0 bg-white dark:bg-zinc-950 p-3 space-y-3">
                      {/* Source Inspector top-bar */}
                      <div className="h-8 flex items-center justify-between shrink-0 border-b border-zinc-200 dark:border-zinc-900 pb-2">
                        <span className="font-bold text-[10px] uppercase text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                          <Code className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          Virtual Code Source Inspector & Frame Explorer
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 dark:text-zinc-550 text-[9px]">Virtual Cache File:</span>
                          <select
                            value={selectedSourceFile}
                            onChange={(e) => {
                              setSelectedSourceFile(e.target.value);
                              setSelectedSourceLine(1);
                            }}
                            className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 text-sky-600 dark:text-sky-400 font-bold rounded px-2 py-0.5 text-[9.5px] shadow-sm"
                          >
                            {Object.keys(virtualSourceFiles).map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Simulated Code display container */}
                      <div className="flex-grow overflow-y-auto bg-zinc-50 dark:bg-black/60 rounded border border-zinc-200 dark:border-zinc-900 p-3 font-mono text-[10px] leading-relaxed select-text relative scrollbar-thin">
                        <div className="absolute right-3 top-3 text-[9px] text-zinc-500 dark:text-zinc-550 bg-white dark:bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-900 select-none uppercase shadow-sm">
                          {activeSourceInfo.desc}
                        </div>
                        {activeSourceInfo.code.split('\n').map((lineText, idx) => {
                          const lineNum = idx + 1;
                          const isTarget = lineNum === selectedSourceLine;
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-start ${isTarget ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold border-l-2 border-sky-550 px-1 py-0.5' : 'text-zinc-700 dark:text-zinc-350 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/20'}`}
                            >
                              <span className="w-8 select-none text-zinc-400 dark:text-zinc-650 shrink-0 text-right pr-2.5 font-mono text-[9px]">
                                {lineNum}
                              </span>
                              <pre className="whitespace-pre-wrap flex-grow font-mono">{lineText || ' '}</pre>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[9px] text-zinc-500 font-sans leading-relaxed shrink-0">
                        💡 Click on coordinates (File Name: Line) inside <b>Console Logs</b> to instantly load the target file context inside this Source Inspector window.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
  );
}
