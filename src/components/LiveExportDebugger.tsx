import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Copy, FileText, Download, RefreshCw, Terminal, CheckCircle2, XCircle, 
  AlertTriangle, Cpu, Layers, Activity, ShieldAlert
} from 'lucide-react';
import { LiveExportStore, LiveExportSession } from '../lib/debug/LiveExportStore';

export default function LiveExportDebugger() {
  const [session, setSession] = useState<LiveExportSession | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return LiveExportStore.subscribe((newSession) => {
      setSession(newSession);
    });
  }, []);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.logs]);

  if (!session || !session.active) return null;

  const handleCopyLogs = () => {
    const text = session.logs.join('\n');
    navigator.clipboard.writeText(text);
    alert('Logs copied to clipboard!');
  };

  const handleExportTxt = () => {
    const text = session.logs.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ssf_export_logs_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify({
      title: session.title,
      format: session.format,
      timestamp: new Date().toISOString(),
      success: session.success,
      steps: session.steps,
      logs: session.logs,
      errorDetails: session.errorDetails,
    }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ssf_export_debug_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentStepRunning = session.steps.find(s => s.status === 'running')?.name || session.statusText;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl h-[85vh] bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col shadow-2xl overflow-hidden shadow-emerald-950/20">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
            </div>
            <div className="flex items-center space-x-2 text-zinc-400 font-mono text-xs">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold tracking-wider text-zinc-300">SSF LIVE EXPORT DIAGNOSTICS</span>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">v3.5</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-[11px] font-mono font-bold bg-zinc-850 px-2.5 py-1 rounded text-zinc-400">
              Pipeline: <span className="text-emerald-400 font-black">{session.format.toUpperCase()}</span>
            </span>
            <button 
              onClick={() => LiveExportStore.close()}
              className="text-zinc-500 hover:text-white transition duration-200"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-950">
          
          {/* Left Column: Live Steps Timeline */}
          <div className="w-full md:w-80 bg-zinc-950 border-r border-zinc-900 p-4 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider mb-2">Export Steps</h3>
                <div className="h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent rounded"></div>
              </div>

              <div className="space-y-4 font-mono text-xs">
                {session.steps.map((step, index) => {
                  const isPending = step.status === 'pending';
                  const isRunning = step.status === 'running';
                  const isSuccess = step.status === 'success';
                  const isFailed = step.status === 'failed';

                  return (
                    <div 
                      key={step.id} 
                      className={`relative flex items-start space-x-3 transition-all duration-200 ${
                        isRunning ? 'scale-[1.02] bg-zinc-900/40 p-2 rounded-lg border border-emerald-800/20' : ''
                      }`}
                    >
                      {/* Step Status Icon */}
                      <div className="flex flex-col items-center mt-0.5">
                        <div className="z-10 flex items-center justify-center">
                          {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />}
                          {isFailed && <XCircle className="w-4 h-4 text-rose-500 fill-rose-950" />}
                          {isRunning && (
                            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                          )}
                          {isPending && (
                            <div className="w-3.5 h-3.5 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                              <span className="text-[8px] text-zinc-600 font-bold">{index + 1}</span>
                            </div>
                          )}
                        </div>
                        {index < session.steps.length - 1 && (
                          <div className={`w-[1px] h-6 mt-1 ${isSuccess ? 'bg-emerald-800/40' : 'bg-zinc-900'}`} />
                        )}
                      </div>

                      {/* Step Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className={`font-semibold ${
                            isRunning ? 'text-amber-400 font-bold' : 
                            isSuccess ? 'text-zinc-300' : 
                            isFailed ? 'text-rose-400 font-bold' : 
                            'text-zinc-600'
                          }`}>
                            {step.name}
                          </span>
                          {step.timestamp && (
                            <span className="text-[9px] text-zinc-600 font-light">{step.timestamp.split(' ')[0]}</span>
                          )}
                        </div>
                        {isSuccess && (
                          <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">✓ Success</span>
                        )}
                        {isRunning && (
                          <span className="text-[10px] text-amber-500/80 animate-pulse font-medium block mt-0.5">Processing...</span>
                        )}
                        {isFailed && (
                          <span className="text-[10px] text-rose-500 font-bold block mt-0.5">❌ Failed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* General Target Card Info */}
            <div className="mt-6 pt-4 border-t border-zinc-900 font-mono text-[10px] text-zinc-500">
              <div className="flex justify-between py-1">
                <span>Export Title:</span>
                <span className="text-zinc-300 truncate max-w-[140px]" title={session.title}>{session.title}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Output Format:</span>
                <span className="text-zinc-300 font-bold uppercase">{session.format}</span>
              </div>
            </div>

          </div>

          {/* Right Column: Real-time Terminal Logs OR Failure Detailed Screen */}
          <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950 font-mono p-4">
            
            {/* If Failure occurs, display the failure layout */}
            {session.success === false && session.errorDetails ? (
              <div className="flex-1 flex flex-col overflow-y-auto space-y-4 pr-1">
                
                {/* Header Error Banner */}
                <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-lg flex items-start space-x-3">
                  <ShieldAlert className="w-8 h-8 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-1">EXPORT RUNTIME CRISIS DETECTED</h2>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      The export pipeline crashed. The diagnostics framework has cataloged the failure profile below to assist in debugging.
                    </p>
                  </div>
                </div>

                {/* Technical Crash Report Grid */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-zinc-400" /> TECHNICAL DECOMPOSITION
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850/60">
                      <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider">Status Code</span>
                      <span className="text-rose-400 font-bold">{session.errorDetails.status}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850/60">
                      <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider">Error Type</span>
                      <span className="text-zinc-300 font-bold">{session.errorDetails.errorType}</span>
                    </div>
                    <div className="sm:col-span-2 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850/60">
                      <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider">Exact Error Message</span>
                      <span className="text-zinc-200 select-all font-semibold leading-relaxed block">{session.errorDetails.message}</span>
                    </div>
                    <div className="sm:col-span-2 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850/60">
                      <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider">Root Cause Analysis</span>
                      <span className="text-zinc-400 leading-relaxed block">{session.errorDetails.rootCause}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850/60">
                      <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider">Module / Source File</span>
                      <span className="text-amber-400 font-bold">{session.errorDetails.module}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850/60">
                      <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider">Trigger Function</span>
                      <span className="text-zinc-300">{session.errorDetails.functionName}()</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850/60">
                      <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider">Line Number</span>
                      <span className="text-emerald-400 font-bold">Line {session.errorDetails.line || 'N/A'}, Col {session.errorDetails.column || 'N/A'}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850/60">
                      <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider">Execution Ellapsed Time</span>
                      <span className="text-zinc-300">{session.errorDetails.executionTime ? `${session.errorDetails.executionTime.toFixed(2)} ms` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Stack Trace */}
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-850/60 text-[11px]">
                  <span className="text-[10px] text-zinc-500 block mb-1.5 uppercase tracking-wider">Active Stack Trace</span>
                  <pre className="text-zinc-500 select-all font-mono whitespace-pre-wrap overflow-x-auto max-h-40 leading-relaxed">
                    {session.errorDetails.stackTrace}
                  </pre>
                </div>

                {/* If image-related details are available */}
                {session.errorDetails.relatedAsset && (
                  <div>
                    <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> AFFECTED ASSET TELEMETRY (CORS/CATASTROPHE)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-rose-950/5 border border-rose-950 p-3 rounded-lg">
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Asset Name</span>
                        <span className="text-zinc-200 font-bold">{session.errorDetails.relatedAsset.name}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Original Target URL</span>
                        <span className="text-zinc-400 text-[10px] break-all select-all font-mono">{session.errorDetails.relatedAsset.originalUrl}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Resolved URL</span>
                        <span className="text-zinc-400 text-[10px] break-all select-all font-mono">{session.errorDetails.relatedAsset.resolvedUrl}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Asset Origin Domain</span>
                        <span className="text-zinc-300 font-bold">{session.errorDetails.relatedAsset.origin}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">CORS Header Status</span>
                        <span className={`font-black uppercase ${session.errorDetails.relatedAsset.isCorsEnabled ? 'text-green-400' : 'text-rose-500 animate-pulse'}`}>
                          {session.errorDetails.relatedAsset.isCorsEnabled ? 'ENABLED' : 'MISSING (BLOCKED)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Same-Origin Verified</span>
                        <span className="text-zinc-300">{session.errorDetails.relatedAsset.isSameOrigin ? 'TRUE (Local)' : 'FALSE (Cross-Origin)'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Load / Decode State</span>
                        <span className="text-zinc-300">Loaded: {String(session.errorDetails.relatedAsset.loaded)}, Decoded: {String(session.errorDetails.relatedAsset.decoded)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* If Canvas/Konva details are available */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-zinc-400" /> CANVAS SUBSYSTEM DIAGNOSTICS
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-850/60">
                      <span className="text-[9px] text-zinc-500 block uppercase">Dimensions</span>
                      <span className="text-zinc-300 font-bold">{session.errorDetails.canvasWidth || 1011} x {session.errorDetails.canvasHeight || 638}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-850/60">
                      <span className="text-[9px] text-zinc-500 block uppercase">Pixel Ratio</span>
                      <span className="text-zinc-300 font-bold">{session.errorDetails.pixelRatio || 1}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-850/60">
                      <span className="text-[9px] text-zinc-500 block uppercase">Canvas Memory</span>
                      <span className="text-zinc-300 font-bold">{session.errorDetails.memoryUsage || 'N/A'}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-850/60">
                      <span className="text-[9px] text-zinc-500 block uppercase">Layer Count</span>
                      <span className="text-zinc-300 font-bold">{session.errorDetails.layerCount || 4} layers</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-850/60">
                      <span className="text-[9px] text-zinc-500 block uppercase">Canvas State</span>
                      <span className="text-amber-400 font-bold">{session.errorDetails.canvasState}</span>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-850/60">
                      <span className="text-[9px] text-zinc-500 block uppercase">Validation</span>
                      <span className="text-rose-400 font-black">{session.errorDetails.validationResult}</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Default State: Live Terminal Logs Output */
              <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950 rounded-lg border border-zinc-900">
                <div className="px-3 py-2 bg-zinc-900/60 border-b border-zinc-900 text-zinc-500 text-[10px] font-mono tracking-wider flex items-center justify-between">
                  <span>TERMINAL OUTPUT FEED</span>
                  <span className="flex items-center gap-1 text-emerald-500 font-bold text-[9px] uppercase animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block"></span> Live Stream
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 text-[11px] leading-relaxed font-mono text-zinc-400 space-y-1.5">
                  {session.logs.length === 0 ? (
                    <div className="text-zinc-600 italic">Connecting diagnostics to canvas pipeline...</div>
                  ) : (
                    session.logs.map((logLine, idx) => {
                      let color = 'text-zinc-400';
                      if (logLine.includes('✓') || logLine.includes('सফল') || logLine.includes('Success')) {
                        color = 'text-emerald-400 font-medium';
                      } else if (logLine.includes('❌') || logLine.includes('ত্রুটি') || logLine.includes('Error') || logLine.includes('failed')) {
                        color = 'text-rose-400 font-bold';
                      } else if (logLine.includes('ধাপ') || logLine.includes('Processing') || logLine.includes('Running')) {
                        color = 'text-amber-400';
                      } else if (logLine.includes('[INIT]')) {
                        color = 'text-cyan-400';
                      }

                      return (
                        <div key={idx} className={`${color} break-words whitespace-pre-wrap`}>
                          {logLine}
                        </div>
                      );
                    })
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Bottom Banner Status (Download successful / failed / in-progress) */}
        {session.success !== null && (
          <div className={`px-4 py-3 border-t font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-3 ${
            session.success 
              ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' 
              : 'bg-rose-950/20 border-rose-900/50 text-rose-400'
          }`}>
            <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-center sm:text-left">
              {session.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span>Download Successful</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>Download Failed</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 font-normal">
              {session.success 
                ? 'The exported card file has been fetched and downloaded locally.'
                : 'The pipeline aborted to prevent generating corrupt files. Please inspect the logs.'}
            </div>
          </div>
        )}

        {/* Progress Bar & Stage Indicator */}
        <div className="bg-zinc-900 px-4 py-3 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-1 text-[10px] font-mono font-bold text-zinc-500">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-zinc-400 uppercase tracking-wider">STAGE: {currentStepRunning}</span>
            </span>
            <span className="text-emerald-400">{session.progress}%</span>
          </div>
          
          <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-green-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              style={{ width: `${session.progress}%` }}
            />
          </div>
        </div>

        {/* Action Buttons Panel */}
        <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-900 flex flex-wrap gap-2.5 items-center justify-end">
          <button
            onClick={handleCopyLogs}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 border border-zinc-800 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Logs
          </button>
          
          <button
            onClick={handleExportTxt}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 border border-zinc-800 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" /> Export (.txt)
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 border border-zinc-800 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" /> Export (.json)
          </button>

          {session.success === false && session.retryCallback && (
            <button
              onClick={() => {
                if (session.retryCallback) session.retryCallback();
              }}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 border border-emerald-500/20 transition cursor-pointer shadow-lg shadow-emerald-950"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white animate-spin-slow" /> Retry Export
            </button>
          )}

          <button
            onClick={() => LiveExportStore.close()}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold font-mono border border-zinc-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
