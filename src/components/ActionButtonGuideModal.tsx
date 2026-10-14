import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Zap, 
  ExternalLink, 
  SlidersHorizontal,
  Command,
  Play
} from 'lucide-react';
import { playSound } from '../utils/sound';

interface ActionButtonGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestPromptBar: () => void;
  enableSound?: boolean;
}

export const ActionButtonGuideModal: React.FC<ActionButtonGuideModalProps> = ({
  isOpen,
  onClose,
  onTestPromptBar,
  enableSound = true,
}) => {
  const [activeTab, setActiveTab] = useState<'apple' | 'android'>('apple');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? `${window.location.origin}/?action=prompt` : 'https://dandelious.ai/?action=prompt';

  const handleCopyLink = () => {
    playSound('click', enableSound);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentAppUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            playSound('click', enableSound);
            onClose();
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-2xl rounded-3xl bg-[#090d18] border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_50px_rgba(163,190,52,0.1)] overflow-hidden z-10 backdrop-blur-2xl"
        >
          {/* Header Line */}
          <div className="h-[3px] bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400" />

          {/* Modal Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-lime-500/10 border border-lime-400/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-lime-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Ein-Ausschaltknopf & Actionbutton Integration
                </h2>
                <p className="text-xs text-neutral-400">
                  Verbinde deinen physischen Button mit der Gemini Promptleiste
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('click', enableSound);
                onClose();
              }}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex rounded-2xl bg-white/[0.04] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSound);
                  setActiveTab('apple');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'apple'
                    ? 'bg-gradient-to-r from-lime-400 to-emerald-400 text-black shadow-lg'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>🍎 Apple Action Button</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('click', enableSound);
                  setActiveTab('android');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-gradient-to-r from-lime-400 to-emerald-400 text-black shadow-lg'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>🤖 Android Power-Button</span>
              </button>
            </div>

            {/* Quick Link Generator Box */}
            <div className="p-3.5 rounded-2xl bg-lime-500/10 border border-lime-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-lime-300 uppercase tracking-wider block">
                  Dein persönlicher Prompt-Trigger Link:
                </span>
                <span className="text-xs font-mono text-white/90 truncate block mt-0.5 select-all">
                  {currentAppUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Link kopieren</span>
                  </>
                )}
              </button>
            </div>

            {/* Tab 1: Apple Action Button Guide */}
            {activeTab === 'apple' && (
              <div className="space-y-3.5 text-xs text-neutral-300">
                <div className="flex gap-3 items-start p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="w-6 h-6 rounded-full bg-lime-400/20 text-lime-300 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      Kurzbefehle App auf deinem iPhone öffnen
                    </strong>
                    Öffne die vorinstallierte Apple App <em>"Kurzbefehle" (Shortcuts)</em> und tippe auf das <strong>+</strong> oben rechts, um einen neuen Kurzbefehl zu erstellen.
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="w-6 h-6 rounded-full bg-lime-400/20 text-lime-300 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      Aktion "URL öffnen" hinzufügen
                    </strong>
                    Suche nach der Aktion <strong>"URL öffnen"</strong> und füge deinen Dandelious Prompt-Trigger Link (oben kopieren) ein.
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="w-6 h-6 rounded-full bg-lime-400/20 text-lime-300 font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      Aktionsbutton (Action Button) belegen
                    </strong>
                    Gehe in die iOS <strong>Einstellungen &rarr; Aktionsbutton</strong>, wähle <strong>"Kurzbefehl"</strong> und wähle deinen Dandelious Prompt Kurzbefehl aus.
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Android Power Button Guide */}
            {activeTab === 'android' && (
              <div className="space-y-3.5 text-xs text-neutral-300">
                <div className="flex gap-3 items-start p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="w-6 h-6 rounded-full bg-lime-400/20 text-lime-300 font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      Android Ein-/Ausschaltknopf (Funktionstaste)
                    </strong>
                    Gehe in deinen Android <strong>Einstellungen &rarr; Erweiterte Funktionen &rarr; Funktionstaste (Side Key)</strong>.
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="w-6 h-6 rounded-full bg-lime-400/20 text-lime-300 font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      Doppelklick oder Drücken belegen
                    </strong>
                    Stelle "Zweimal drücken" oder "Gedrückt halten" so ein, dass Dandelious geöffnet wird.
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="w-6 h-6 rounded-full bg-lime-400/20 text-lime-300 font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-white block font-semibold mb-0.5">
                      Bixby Routine oder Button Mapper (Optional)
                    </strong>
                    Erstelle eine Bixby Routine oder nutze Button Mapper / Tasker, um beim Gedrückthalten des Powerbuttons die URL mit <code className="text-lime-300">?action=prompt</code> auszuführen!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.02]">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
              <Command className="w-3.5 h-3.5 text-lime-400" />
              In der App kannst du auch jederzeit <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Strg+Shift+P</kbd> drücken.
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  playSound('pop', enableSound);
                  onClose();
                  onTestPromptBar();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 hover:opacity-90 text-black font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Promptleiste jetzt testen</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
