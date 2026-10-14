import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Map, 
  FileText, 
  Shield, 
  Settings, 
  Dices, 
  Terminal, 
  Brain, 
  Sparkles,
  Layers,
  Activity
} from 'lucide-react';
import { RpModule } from '../types';
import { RpModuleWindow } from './RpModuleWindow';
import { RpDiceOverlay } from './RpDiceOverlay';

interface RpSidebarProps {
  rpEnabled: boolean;
  modules: RpModule[];
  activeModuleId: string | null;
  onSelectModule: (id: string | null) => void;
  onOpenRpSettings: () => void;
  onOpenCodeEditor?: (moduleId: string) => void;
  onSendMessage?: (text: string) => void;
  onTriggerAiContext?: (contextPrompt: string) => void;
  onUpdateSharedState?: (key: string, value: any) => void;
  onPatchSharedState?: (patchObj: Record<string, any>) => void;
  userName?: string;
  userRole?: string;
  roomCode?: string;
  vaultCredits?: number;
  sharedState?: Record<string, any>;
  soundEnabled?: boolean;
}

export const RpSidebar: React.FC<RpSidebarProps> = ({
  rpEnabled,
  modules = [],
  activeModuleId,
  onSelectModule,
  onOpenRpSettings,
  onOpenCodeEditor,
  onSendMessage,
  onTriggerAiContext,
  onUpdateSharedState,
  onPatchSharedState,
  userName = 'Spieler',
  userRole = 'Mitglied',
  roomCode = 'ARC-001',
  vaultCredits = 2500,
  sharedState = {},
  soundEnabled = true
}) => {
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(activeModuleId || modules[0]?.id || null);
  const [isDiceOpen, setIsDiceOpen] = useState(false);

  // Auto select first module if selectedModuleId is invalid
  useEffect(() => {
    if (!selectedModuleId && modules.length > 0) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  // Sync selected module if parent changes activeModuleId
  useEffect(() => {
    if (activeModuleId && activeModuleId !== selectedModuleId) {
      setSelectedModuleId(activeModuleId);
    }
  }, [activeModuleId]);

  // Global postMessage listener for iframe actions from RP HTML modules
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;

      switch (e.data.type) {
        case 'RP_CHAT_ACTION':
          if (typeof e.data.text === 'string' && onSendMessage) {
            onSendMessage(e.data.text);
          }
          break;

        case 'RP_STATE_UPDATE':
          if (e.data.key && onUpdateSharedState) {
            onUpdateSharedState(e.data.key, e.data.value);
          }
          break;

        case 'RP_STATE_UPDATE_PATCH':
          if (e.data.patch && onPatchSharedState) {
            onPatchSharedState(e.data.patch);
          }
          break;

        case 'RP_SEND_STATE_TO_AI':
          if (onTriggerAiContext) {
            const summaryStr = JSON.stringify(e.data.stateSummary || sharedState, null, 2);
            onTriggerAiContext(
              `[DANDELIOUS SYSTEM-KONTEXT MODUL "${e.data.moduleTitle || 'RP Modul'}"]:\nAktueller Modul-Zustand:\n${summaryStr}\n\nBitte berücksichtige diese Daten in deinen nächsten Antworten im Chat.`
            );
          }
          break;

        case 'RP_ROLL_DICE':
          setIsDiceOpen(true);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSendMessage, onUpdateSharedState, onPatchSharedState, onTriggerAiContext, sharedState]);

  if (!rpEnabled || modules.length === 0) return null;

  const activeModule = modules.find(m => m.id === selectedModuleId) || modules[0];

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

  const handlePostDiceToChat = (rollText: string, triggerAi: boolean) => {
    if (onSendMessage) {
      onSendMessage(rollText);
      if (triggerAi && onTriggerAiContext) {
        onTriggerAiContext(
          `Der Spieler hat soeben eine Würfel-Probe durchgeführt: ${rollText}. Reagiere darauf passend im Chat.`
        );
      }
    }
  };

  const handleSendStateToAi = (moduleTitle: string, stateSummary: any) => {
    if (onTriggerAiContext) {
      const summaryStr = JSON.stringify(stateSummary || sharedState, null, 2);
      onTriggerAiContext(
        `[DANDELIOUS SYSTEM-KONTEXT MODUL "${moduleTitle}"]:\nAktueller Modul-Zustand:\n${summaryStr}\n\nBitte berücksichtige diesen Spielstand bei allen kommenden Gruppen-Interaktionen.`
      );
    }
  };

  return (
    <>
      {/* Floating Vertical Dock (Rechte Sidebar) */}
      <div className="fixed right-3 top-24 z-40 bg-[#0E0F14]/70 backdrop-blur-2xl border border-white/10 rounded-full p-2 shadow-2xl flex flex-col items-center gap-3 animate-fade-in">
        
        {/* Header Icon Indicator */}
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 text-[10px] font-extrabold border border-white/10" title="ARC Tabletop Engine">
          <Layers className="w-4 h-4 text-pink-400" />
        </div>

        <div className="w-6 h-[1px] bg-white/10" />

        {/* Module Icon Buttons */}
        {modules.map((mod) => {
          const isActive = selectedModuleId === mod.id && isWindowOpen;
          return (
            <button
              key={mod.id}
              onClick={() => {
                if (selectedModuleId === mod.id && isWindowOpen) {
                  setIsWindowOpen(false);
                } else {
                  setSelectedModuleId(mod.id);
                  onSelectModule(mod.id);
                  setIsWindowOpen(true);
                }
              }}
              title={mod.title}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-white/10 border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.15)] scale-110'
                  : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white'
              }`}
            >
              {getIconForSymbol(mod.symbol, mod.iconName)}

              {/* Tooltip on Hover */}
              <div className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#090a0f]/95 border border-white/15 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl z-50">
                <div className="font-bold">{mod.title}</div>
                {mod.description && <div className="text-[10px] text-slate-400 font-normal">{mod.description}</div>}
              </div>
            </button>
          );
        })}

        <div className="w-6 h-[1px] bg-white/10" />

        {/* Integrated Dice Engine Launcher */}
        <button
          onClick={() => setIsDiceOpen(true)}
          title="3D Logic Würfel-Engine (/roll)"
          className="w-10 h-10 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 flex items-center justify-center text-amber-300 transition-all cursor-pointer shadow-md group relative"
        >
          <Dices className="w-4.5 h-4.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <div className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#090a0f]/95 border border-amber-500/30 text-amber-300 text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl z-50">
            🎲 Würfel-Engine
          </div>
        </button>

        {/* Settings / Configure Tabletop */}
        <button
          onClick={onOpenRpSettings}
          title="Tabletop-Module konfigurieren (HTML Studio)"
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer group relative"
        >
          <Settings className="w-4 h-4 text-slate-300" />
          <div className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#090a0f]/95 border border-white/15 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl z-50">
            ⚙️ HTML Studio
          </div>
        </button>
      </div>

      {/* Glassmorphism Window Overlay for Active Module */}
      <RpModuleWindow
        module={activeModule}
        isOpen={isWindowOpen}
        onClose={() => setIsWindowOpen(false)}
        onOpenSettings={onOpenRpSettings}
        onOpenCodeEditor={onOpenCodeEditor}
        onSendMessage={onSendMessage}
        onSendStateToAi={handleSendStateToAi}
        userName={userName}
        userRole={userRole}
        roomCode={roomCode}
        vaultCredits={vaultCredits}
        sharedState={sharedState}
      />

      {/* Integrated 3D / Logic Dice Engine Overlay */}
      <RpDiceOverlay
        isOpen={isDiceOpen}
        onClose={() => setIsDiceOpen(false)}
        onPostRollToChat={handlePostDiceToChat}
        soundEnabled={soundEnabled}
      />
    </>
  );
};
