import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Layers, 
  MessageSquare, 
  Check, 
  ChevronRight,
  Gift,
  Cpu,
  Code2
} from 'lucide-react';

export type TierType = 'Kostenlos' | 'Expanded' | 'Unlimited';

interface TierPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier?: TierType;
  currentTier: TierType;
  onSelectRedeem?: () => void;
  onStartTrial?: () => void;
  trialUsed?: boolean;
  trialTimeLeft?: number;
}

interface TierDetail {
  id: TierType;
  name: string;
  instances: number;
  messageLimit: number;
  timeWindowHours: number;
  description: string;
  diceModel: string;
  diceModelDesc: string;
  chatModel: string;
  features: string[];
}

const TIER_DATA: Record<TierType, TierDetail> = {
  Kostenlos: {
    id: 'Kostenlos',
    name: 'Kostenlos',
    instances: 5,
    messageLimit: 250,
    timeWindowHours: 2,
    description: 'Großzügiger Basis-Zugang für den Alltag mit stark erhöhtem Standard-Kontingent.',
    diceModel: 'Shark 1.0',
    diceModelDesc: 'Schnell-Coder für UI-Komponenten, Widgets und Skripte.',
    chatModel: 'Dandelious Lite & Fast',
    features: [
      '5 Chat-Instanzen parallel nutzbar',
      '250 Nachrichten pro 2 Stunden (Gleitzeit-Fenster)',
      'Dice Coding-Modell: Shark 1.0',
      'Dandelious Chat-Modell: Dandelious Lite & Fast (hohe Limits)',
      'Standard-Antwortgeschwindigkeit'
    ]
  },
  Expanded: {
    id: 'Expanded',
    name: 'Expanded',
    instances: 15,
    messageLimit: 800,
    timeWindowHours: 2,
    description: 'Deutlich erweitertes High-Speed Kontingent für intensives Arbeiten und komplexe Web-Apps.',
    diceModel: 'Octopus 1.0 (+ Shark 1.0)',
    diceModelDesc: 'Pro Architect für vollwertige Web-Apps mit dynamischer Multi-State Logik.',
    chatModel: 'Dandelious Pro & Fast',
    features: [
      '15 Chat-Instanzen parallel nutzbar',
      '800 Nachrichten pro 2 Stunden',
      'Dice Coding-Modell: Octopus 1.0 & Shark 1.0',
      'Dandelious Chat-Modell: Dandelious Pro (Deep Reasoning & Hohe Limits)',
      '10-Minuten-Testphase verfügbar'
    ]
  },
  Unlimited: {
    id: 'Unlimited',
    name: 'Unlimited',
    instances: 50,
    messageLimit: 3000,
    timeWindowHours: 2,
    description: 'Maximale Leistungsstufe mit nahezu unbegrenzter Parallelität und Flaggschiff-KI.',
    diceModel: 'Nautilus 1.0 (+ Octopus & Shark)',
    diceModelDesc: 'Apex Flagship für komplexe Full-Stack Web-Apps, Canvas, Telemetrie & Audio.',
    chatModel: 'Dandelious Ultra & Pro Apex',
    features: [
      '50 Chat-Instanzen parallel nutzbar',
      '3.000 Nachrichten pro 2 Stunden (Ultra-Kapazität)',
      'Dice Coding-Modell: Nautilus 1.0 (Apex Flagship)',
      'Dandelious Chat-Modell: Dandelious Ultra (Flaggschiff-Intelligenz)',
      'Höchste Priorität und Ausführungsgeschwindigkeit'
    ]
  }
};

export const TierPreviewModal: React.FC<TierPreviewModalProps> = ({
  isOpen,
  onClose,
  initialTier = 'Expanded',
  currentTier = 'Kostenlos',
  onSelectRedeem,
  onStartTrial,
  trialUsed = false,
  trialTimeLeft = 0
}) => {
  const [selectedTier, setSelectedTier] = useState<TierType>(initialTier);

  useEffect(() => {
    if (initialTier) {
      setSelectedTier(initialTier);
    }
  }, [initialTier, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const data = TIER_DATA[selectedTier];
  const isCurrent = currentTier === selectedTier;

  const glassIslandClass = "bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.35)] relative transition-all duration-200";

  return (
    <AnimatePresence>
      <motion.div
        key="tier-preview-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          key="tier-modal-box"
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg bg-[#121216]/95 backdrop-blur-2xl border border-white/15 rounded-[26px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_24px_64px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col text-neutral-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Dandelious & Dice Pläne
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Übersicht der Limits, parallelen Instanzen und KI-Modelle
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Switcher Islands */}
          <div className="p-4 pb-2">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
              {(['Kostenlos', 'Expanded', 'Unlimited'] as TierType[]).map((tierKey) => {
                const isActive = selectedTier === tierKey;
                const isUserCurrent = currentTier === tierKey;
                return (
                  <button
                    key={tierKey}
                    type="button"
                    onClick={() => setSelectedTier(tierKey)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isActive 
                        ? 'bg-white text-black shadow-md font-bold' 
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {tierKey}
                      {isUserCurrent && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-black' : 'bg-white'}`} />
                      )}
                    </span>
                    <span className={`text-[10px] font-normal ${isActive ? 'text-black/70' : 'text-neutral-500'}`}>
                      {tierKey === 'Kostenlos' ? 'Shark 1.0' : tierKey === 'Expanded' ? 'Octopus 1.0' : 'Nautilus 1.0'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details Content Islands */}
          <div className="px-4 py-3 space-y-3 overflow-y-auto max-h-[60vh]">
            {/* Status & Limits Card Island */}
            <div className={`${glassIslandClass} space-y-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Dandelious {data.name}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {data.description}
                  </p>
                </div>
                {isCurrent && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/[0.08] text-white border border-white/20 flex items-center gap-1.5">
                    <Check className="w-3 h-3" />
                    Aktiver Plan
                  </span>
                )}
              </div>

              {/* Exact Metrics Grid Islands */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-medium">
                    <Layers className="w-3.5 h-3.5 text-neutral-300" />
                    Parallele Instanzen
                  </div>
                  <div className="text-base font-bold text-white mt-1">
                    {data.instances} {data.instances === 1 ? 'Instanz' : 'Instanzen'}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    Gleichzeitige Chats & Fenster
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-300" />
                    Nachrichten-Limit
                  </div>
                  <div className="text-base font-bold text-white mt-1">
                    {data.messageLimit} Nachrichten
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    pro {data.timeWindowHours} Stunden Gleitfenster
                  </div>
                </div>
              </div>
            </div>

            {/* Model Breakdown Glass Island */}
            <div className={`${glassIslandClass} space-y-2.5`}>
              <span className="text-xs font-semibold text-neutral-300 block">
                Verfügbare KI-Modelle in diesem Plan
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Code2 className="w-3.5 h-3.5 text-neutral-300" />
                    <span>Dice Coder</span>
                  </div>
                  <div className="text-xs text-white font-semibold">
                    {data.diceModel}
                  </div>
                  <div className="text-[11px] text-neutral-400 leading-snug">
                    {data.diceModelDesc}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Cpu className="w-3.5 h-3.5 text-neutral-300" />
                    <span>Dandelious Chat</span>
                  </div>
                  <div className="text-xs text-white font-semibold">
                    {data.chatModel}
                  </div>
                  <div className="text-[11px] text-neutral-400 leading-snug">
                    Reaktionsstarke Konversation und Code-Begleitung.
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Checklist Glass Island */}
            <div className={`${glassIslandClass} space-y-2`}>
              <span className="text-xs font-semibold text-neutral-300 block">
                Plan-Eigenschaften
              </span>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                {data.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Action Islands */}
          <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-2">
            {selectedTier === 'Expanded' && !isCurrent && onStartTrial && (
              trialTimeLeft > 0 ? (
                <div className="text-xs text-neutral-300 flex items-center gap-1.5">
                  <span className="font-mono text-white font-semibold bg-white/10 px-2 py-0.5 rounded-lg border border-white/15">
                    {Math.floor(trialTimeLeft / 60)}m {trialTimeLeft % 60}s
                  </span>
                  <span>Testphase aktiv</span>
                </div>
              ) : trialUsed ? (
                <span className="text-[11px] text-neutral-500">
                  10-Minuten-Test bereits genutzt
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onStartTrial();
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>10 Min Testen</span>
                </button>
              )
            )}

            <div className="flex items-center gap-2 ml-auto">
              {onSelectRedeem && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectRedeem();
                  }}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                >
                  <span>Code einlösen</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm"
              >
                Schließen
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
