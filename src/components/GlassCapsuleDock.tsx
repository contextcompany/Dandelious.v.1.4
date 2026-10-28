import React from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Search, 
  Archive, 
  Plus, 
  Settings,
  Sparkles,
  Dices,
  Layers,
  Cpu
} from 'lucide-react';
import { playSound } from '../utils/sound';

export type DockTab = 'chat' | 'dice' | 'search' | 'history' | 'new_chat' | 'settings';

interface GlassCapsuleDockProps {
  activeTab: 'chat' | 'dice';
  onSelectView: (view: 'chat' | 'dice') => void;
  onNewChat?: () => void;
  onOpenSearch?: () => void;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
  onOpenPromptBar?: () => void;
  isSoundActive?: boolean;
  className?: string;
  isSidebarOpen?: boolean;
}

export const GlassCapsuleDock: React.FC<GlassCapsuleDockProps> = ({
  activeTab,
  onSelectView,
  onNewChat,
  onOpenSearch,
  onToggleSidebar,
  onOpenSettings,
  onOpenPromptBar,
  isSoundActive = true,
  className = '',
  isSidebarOpen = false,
}) => {
  const triggerClick = (fn?: () => void) => {
    playSound('click', isSoundActive);
    if (fn) fn();
  };

  return (
    <motion.div 
      initial={{ y: 50, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 50, opacity: 0, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={`fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 select-none z-40 max-w-[94vw] ${className}`}
      id="dandelious-glass-capsule-dock"
    >
      <div className="relative p-1.5 rounded-full liquid-glass-dock flex items-center justify-between gap-1 shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_1.5px_rgba(255,255,255,0.3)] backdrop-blur-3xl">
        {/* Specular Highlight Rim */}
        <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none rounded-full" />

        {/* Tab 1: Chat Mode */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => {
            playSound('click', isSoundActive);
            onSelectView('chat');
          }}
          className={`relative px-4 py-2 rounded-full flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
            activeTab === 'chat'
              ? 'liquid-glass-active-pill text-white shadow-lg border border-white/30'
              : 'text-neutral-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Dandelious Chat"
          aria-label="Dandelious Chat"
        >
          <MessageSquare className="w-4.5 h-4.5 stroke-[2]" />
          {activeTab === 'chat' && (
            <span className="text-xs font-semibold tracking-tight text-white hidden xs:inline">
              Chat
            </span>
          )}
        </motion.button>

        {/* Tab 2: Würfel / Dice Studio */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => {
            playSound('click', isSoundActive);
            onSelectView('dice');
          }}
          className={`relative px-4 py-2 rounded-full flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
            activeTab === 'dice'
              ? 'liquid-glass-active-pill text-white shadow-lg border border-white/30'
              : 'text-neutral-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Dice Studio"
          aria-label="Dice Studio"
        >
          <Dices className="w-4.5 h-4.5 stroke-[2]" />
          {activeTab === 'dice' && (
            <span className="text-xs font-semibold tracking-tight text-white hidden xs:inline">
              Dice
            </span>
          )}
        </motion.button>

        {/* Divider */}
        <div className="w-[1px] h-4.5 bg-white/20 my-auto shrink-0 mx-0.5" />

        {/* Quick Action: Gemini Promptleiste / Actionbutton */}
        {onOpenPromptBar && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => triggerClick(onOpenPromptBar)}
            className="relative p-2 rounded-full text-blue-300 hover:text-blue-200 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 transition-all cursor-pointer flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.35)]"
            title="Gemini Promptleiste (Ein-Ausschaltknopf / Actionbutton)"
            aria-label="Gemini Promptleiste"
          >
            <Sparkles className="w-4.5 h-4.5 stroke-[2] text-blue-400" />
          </motion.button>
        )}

        {/* Quick Action: Search / Command Palette */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.08 }}
          onClick={() => triggerClick(onOpenSearch)}
          className="relative p-2 rounded-full text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer flex items-center justify-center"
          title="Befehle & Suche"
          aria-label="Befehle & Suche"
        >
          <Search className="w-4.5 h-4.5 stroke-[2]" />
        </motion.button>

        {/* Quick Action: History / Sidebar Toggle */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.08 }}
          onClick={() => triggerClick(onToggleSidebar)}
          className={`relative p-2 rounded-full transition-all cursor-pointer flex items-center justify-center ${
            isSidebarOpen 
              ? 'liquid-glass-active-pill text-white shadow-md' 
              : 'text-neutral-300 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Verlauf & Menü"
          aria-label="Verlauf & Menü"
        >
          <Archive className="w-4.5 h-4.5 stroke-[2]" />
        </motion.button>

        {/* Quick Action: New Chat (Plus) with Accent Style */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.08 }}
          onClick={() => triggerClick(onNewChat)}
          className="relative p-2 rounded-full bg-white hover:bg-neutral-200 text-black shadow-[0_2px_12px_rgba(255,255,255,0.4)] border border-white/40 transition-all cursor-pointer flex items-center justify-center"
          title="Neuer Chat"
          aria-label="Neuer Chat"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.4]" />
        </motion.button>

        {/* Quick Action: Settings */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.08 }}
          onClick={() => triggerClick(onOpenSettings)}
          className="relative p-2 rounded-full text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer flex items-center justify-center"
          title="Einstellungen"
          aria-label="Einstellungen"
        >
          <Settings className="w-4.5 h-4.5 stroke-[2]" />
        </motion.button>
      </div>
    </motion.div>
  );
};
