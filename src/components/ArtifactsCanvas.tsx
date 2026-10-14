import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Code, 
  Play, 
  Copy, 
  Check, 
  Download, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Terminal, 
  Trash2,
  Sparkles,
  Zap,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { buildUniversalSandboxSrcDoc } from '../utils/sandboxEngine';
import { DotMatrixCanvas } from './DotMatrixCanvas';

export interface ArtifactData {
  id: string;
  title: string;
  language: string;
  content: string;
}

interface ArtifactsCanvasProps {
  artifact: ArtifactData | null;
  onClose: () => void;
}

interface ConsoleLogItem {
  id: string;
  type: 'log' | 'error' | 'warn';
  message: string;
  timestamp: string;
}

export const ArtifactsCanvas: React.FC<ArtifactsCanvasProps> = ({ artifact, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [keyCounter, setKeyCounter] = useState(0);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogItem[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Catch postMessage logs from the Dice sandbox iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'dice-iframe-console') {
        const { type, message } = event.data;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        setConsoleLogs(prev => [
          ...prev.slice(-99), // keep last 100 logs
          {
            id: Math.random().toString(36).substring(2, 9),
            type: type || 'log',
            message: message || '',
            timestamp: timeStr
          }
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!artifact) return null;

  const isPreviewable = ['html', 'svg', 'javascript', 'js', 'jsx', 'tsx', 'css'].includes(
    (artifact.language || '').toLowerCase()
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = artifact.language.toLowerCase() === 'javascript' ? 'js' : (artifact.language.toLowerCase() || 'html');
    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '_').toLowerCase()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefreshIframe = () => {
    setKeyCounter(prev => prev + 1);
    setConsoleLogs([]);
  };

  const getViewportWidthClass = () => {
    switch (viewportMode) {
      case 'mobile':
        return 'w-[375px] h-[720px] max-h-[85vh] rounded-[36px] border-[6px] border-[#1e1e24] shadow-2xl my-auto';
      case 'tablet':
        return 'w-[768px] h-[90vh] rounded-[24px] border-[4px] border-[#1e1e24] shadow-2xl my-auto';
      default:
        return 'w-full h-full';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 right-0 h-full z-50 bg-[#09090c] border-l border-white/15 flex flex-col shadow-[-25px_0_80px_rgba(0,0,0,0.95)] transform-gpu select-none overflow-hidden ${
          isFullscreen ? 'w-full' : 'w-full md:w-[55%] lg:w-[50%] xl:w-[46%]'
        }`}
      >
        {/* Subtle Ambient Dot Matrix Background Layer */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <DotMatrixCanvas density={28} interactive={false} glow={true} />
        </div>

        {/* Top Header Bar */}
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between bg-[#0d0e12]/90 backdrop-blur-2xl shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Zap className="w-4 h-4 text-lime-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">{artifact.title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 border border-white/15 text-neutral-300 uppercase">
                  DICE STUDIO
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400 truncate">
                ISOLIERTE ENGINE VORSCHAU • {artifact.language.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5">
            {/* Tab Switcher: Preview vs Code */}
            {isPreviewable && (
              <div className="flex items-center p-1 rounded-xl bg-white/[0.06] border border-white/10 text-xs mr-1">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-medium ${
                    activeTab === 'preview' ? 'bg-white text-black shadow-sm font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Vorschau</span>
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-medium ${
                    activeTab === 'code' ? 'bg-white text-black shadow-sm font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3 h-3" />
                  <span>Code</span>
                </button>
              </div>
            )}

            {/* Device Viewport Selector */}
            {activeTab === 'preview' && isPreviewable && (
              <div className="hidden sm:flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs mr-1">
                <button
                  onClick={() => setViewportMode('desktop')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewportMode === 'desktop' ? 'bg-white/20 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  title="Desktop-Sicht (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewportMode('tablet')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewportMode === 'tablet' ? 'bg-white/20 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  title="Tablet-Sicht (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewportMode('mobile')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewportMode === 'mobile' ? 'bg-white/20 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  title="Smartphone-Sicht (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Refresh Sandbox */}
            {isPreviewable && (
              <button
                onClick={handleRefreshIframe}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Sandbox-Vorschau neu laden"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Toggle Console Drawer */}
            <button
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer relative ${
                isConsoleOpen 
                  ? 'bg-lime-600/20 border-lime-400/40 text-lime-300' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'
              }`}
              title="Konsole & Logs öffnen"
            >
              <Terminal className="w-4 h-4" />
              {consoleLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-lime-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {consoleLogs.length > 9 ? '9+' : consoleLogs.length}
                </span>
              )}
            </button>

            {/* Copy Code */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Code kopieren"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Download File */}
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Datei herunterladen"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Vollbild umschalten"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Viewport */}
        <div className="flex-1 relative overflow-hidden bg-[#050508] flex flex-col justify-center items-center">
          {activeTab === 'preview' && isPreviewable ? (
            <div className="w-full h-full flex items-center justify-center p-0 md:p-3 relative overflow-hidden">
              <div className={`transition-all duration-300 ease-out flex flex-col bg-black overflow-hidden relative ${getViewportWidthClass()}`}>
                <iframe
                  key={`dice-sandbox-iframe-${keyCounter}`}
                  ref={iframeRef}
                  srcDoc={buildUniversalSandboxSrcDoc(artifact.content, artifact.language)}
                  title="Dice Studio Sandbox Preview"
                  className="w-full h-full border-none bg-black"
                  sandbox="allow-scripts allow-modals allow-forms allow-popups"
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-auto p-6 font-mono text-xs sm:text-sm text-neutral-200 leading-relaxed scrollbar-thin select-text bg-[#07070a]">
              <pre><code>{artifact.content}</code></pre>
            </div>
          )}

          {/* Console Drawer Panel */}
          <AnimatePresence>
            {isConsoleOpen && (
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-0 inset-x-0 h-48 bg-[#0b0c10]/95 border-t border-white/15 backdrop-blur-2xl flex flex-col z-30 shadow-2xl"
              >
                {/* Console Header */}
                <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-lime-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Dice Live Console
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-neutral-300">
                      {consoleLogs.length} Events
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConsoleLogs([])}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                      title="Logs leeren"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Leeren</span>
                    </button>
                    <button
                      onClick={() => setIsConsoleOpen(false)}
                      className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Console Logs Feed */}
                <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1.5 no-scrollbar select-text">
                  {consoleLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-neutral-500 italic">
                      Keine Konsolenausgaben erfasst. Interagiere mit der Vorschau, um Logs zu sehen.
                    </div>
                  ) : (
                    consoleLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`flex items-start gap-2.5 p-1.5 rounded-lg border ${
                          log.type === 'error' 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                            : log.type === 'warn'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                            : 'bg-white/[0.02] border-white/5 text-neutral-200'
                        }`}
                      >
                        <span className="text-[9px] text-neutral-500 shrink-0 pt-0.5">{log.timestamp}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                          log.type === 'error' ? 'bg-rose-500/30 text-rose-200' : log.type === 'warn' ? 'bg-amber-500/30 text-amber-200' : 'bg-white/10 text-neutral-300'
                        }`}>
                          {log.type}
                        </span>
                        <span className="break-all whitespace-pre-wrap flex-1">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Status Bar */}
        <div className="h-9 px-5 border-t border-white/10 flex items-center justify-between bg-[#08080b] text-[11px] text-neutral-400 font-mono shrink-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>DICE SANDBOX SHIELD AKTIV (TOP-NAVIGATION GEBLOCKT)</span>
          </div>
          <div className="flex items-center gap-3">
            <span>ISOLATION: OK</span>
            <span>HTML5 / REACT 18</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
