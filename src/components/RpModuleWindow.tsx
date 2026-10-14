import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Code2, 
  Settings, 
  Send, 
  Brain, 
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Shield,
  Map,
  FileText,
  ShoppingBag,
  Dices,
  Terminal,
  Activity
} from 'lucide-react';
import { RpModule } from '../types';
import { injectRpBridge } from '../utils/rp-bridge';

interface RpModuleWindowProps {
  module: RpModule | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenCodeEditor?: (moduleId: string) => void;
  onSendMessage?: (text: string) => void;
  onSendStateToAi?: (moduleTitle: string, stateSummary: any) => void;
  userName?: string;
  userRole?: string;
  roomCode?: string;
  vaultCredits?: number;
  sharedState?: Record<string, any>;
}

export const RpModuleWindow: React.FC<RpModuleWindowProps> = ({
  module,
  isOpen,
  onClose,
  onOpenSettings,
  onOpenCodeEditor,
  onSendMessage,
  onSendStateToAi,
  userName = 'Spieler',
  userRole = 'Mitglied',
  roomCode = 'ARC-001',
  vaultCredits = 2500,
  sharedState = {}
}) => {
  const [windowWidth, setWindowWidth] = useState<'compact' | 'medium' | 'wide'>('medium');
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync state to iframe when sharedState prop updates from Firestore snapshot
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({
          type: 'RP_SHARED_STATE_SYNC',
          state: sharedState
        }, '*');
      } catch (e) {
        // ignore cross-origin if any
      }
    }
  }, [sharedState]);

  if (!isOpen || !module) return null;

  // Render Lucide icon based on iconName or symbol
  const getIconForSymbol = (symbol: string, iconName?: string) => {
    switch (iconName || symbol.toUpperCase()) {
      case 'shopping-bag':
      case 'S':
        return <ShoppingBag className="w-4 h-4 text-pink-400" />;
      case 'map':
      case 'M':
        return <Map className="w-4 h-4 text-lime-400" />;
      case 'file-text':
      case 'V':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'shield':
      case 'C':
        return <Shield className="w-4 h-4 text-lime-400" />;
      case 'dices':
      case 'D':
        return <Dices className="w-4 h-4 text-emerald-400" />;
      case 'terminal':
      case 'T':
        return <Terminal className="w-4 h-4 text-lime-400" />;
      default:
        return <Activity className="w-4 h-4 text-lime-400" />;
    }
  };

  const processedHtmlDoc = injectRpBridge(module.htmlContent, {
    userName,
    userRole,
    roomCode,
    vaultCredits,
    sharedState
  });

  const getWidthClass = () => {
    switch (windowWidth) {
      case 'compact': return 'w-[92vw] sm:w-[360px]';
      case 'wide': return 'w-[95vw] sm:w-[580px]';
      case 'medium':
      default: return 'w-[92vw] sm:w-[460px]';
    }
  };

  const handleSendStateToAiClick = () => {
    if (onSendStateToAi) {
      onSendStateToAi(module.title, sharedState);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`fixed right-16 top-20 bottom-16 z-40 ${getWidthClass()} rounded-[28px] bg-[#0c0d12]/95 border border-white/15 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-white font-sans transition-all duration-300`}
    >
      {/* Glassmorphism Window Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-white/[0.03] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500/20 to-lime-500/20 border border-white/20 flex items-center justify-center shrink-0 shadow-sm">
            {getIconForSymbol(module.symbol, module.iconName)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold text-white truncate">{module.title}</h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE SYNC
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {module.description || 'Interaktives Roleplay Modul'}
            </p>
          </div>
        </div>

        {/* Mini Actionbar */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Width Selector Toggle */}
          <button
            onClick={() => {
              if (windowWidth === 'compact') setWindowWidth('medium');
              else if (windowWidth === 'medium') setWindowWidth('wide');
              else setWindowWidth('compact');
            }}
            title="Fensterbreite umschalten"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Send State to AI Button */}
          <button
            onClick={handleSendStateToAiClick}
            title="Modul-Status an Dandelious KI senden (System-Kontext)"
            className="px-2 py-1 rounded-lg bg-lime-500/15 hover:bg-lime-500/25 border border-lime-500/30 text-lime-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            <Brain className="w-3.5 h-3.5 text-lime-400" />
            <span className="hidden sm:inline">KI Context</span>
          </button>

          {/* Code Editor Button */}
          {onOpenCodeEditor && (
            <button
              onClick={() => onOpenCodeEditor(module.id)}
              title="Code-Editor für dieses Modul öffnen"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="RP-Module verwalten"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Close Window */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container: Isolierter iframe Canvas with abgerundeten Innenkanten */}
      <div className="flex-1 w-full h-full bg-[#090A0D] p-2 relative overflow-hidden">
        <div className="w-full h-full rounded-2xl border border-white/5 bg-[#08090C] overflow-hidden shadow-inner relative">
          <iframe
            key={iframeKey}
            ref={iframeRef}
            title={module.title}
            srcDoc={processedHtmlDoc}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-forms allow-modals"
          />
        </div>
      </div>

      {/* Footer Info & Quick Post */}
      <div className="p-2.5 bg-[#101117] border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
          <span className="truncate">Automatischer Live-Sync mit allen Raum-Teilnehmern</span>
        </div>

        <button
          onClick={() => setIframeKey(Date.now())}
          title="Modul neu laden"
          className="text-slate-400 hover:text-white flex items-center gap-1 font-medium cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reload</span>
        </button>
      </div>
    </motion.div>
  );
};
