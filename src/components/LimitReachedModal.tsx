import React, { useState, useEffect } from 'react';
import { Sparkles, CreditCard, X, ShieldAlert, Clock, Key, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SubscriptionTier } from '../types';
import { get12hResetInfo, getUsageState, canReset12hLimitManually, reset12hLimitManually } from '../utils/usageTracker';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRedeem: () => void;
  onOpenApiKeys?: () => void;
  userTier?: SubscriptionTier;
  limit?: number;
  retryAfterSeconds?: number;
  isNoKeyExceeded?: boolean;
}

export const LimitReachedModal: React.FC<LimitReachedModalProps> = ({
  isOpen,
  onClose,
  onOpenRedeem,
  onOpenApiKeys,
  userTier = 'Kostenlos',
  limit = 50,
  retryAfterSeconds = 900,
  isNoKeyExceeded = false
}) => {
  const [resetInfo, setResetInfo] = useState(get12hResetInfo());
  const usageState = getUsageState();

  useEffect(() => {
    if (!isOpen) return;
    setResetInfo(get12hResetInfo());
    const interval = setInterval(() => {
      setResetInfo(get12hResetInfo());
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="limit-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transform-gpu"
          onClick={onClose}
        >
          <motion.div 
            key="limit-modal"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md bg-[#18181D] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden p-6 text-neutral-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center pt-2 pb-1 space-y-4 relative z-10">
            {/* Icon capsule */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg text-amber-400">
              <Zap className="w-7 h-7" />
            </div>

            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white tracking-tight">
                12-Stunden Rechenlimit erreicht
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.06] border border-white/10 text-neutral-300">
                Plan: {userTier} • 100 % ausgelastet
              </span>
            </div>

            {/* Live 12h Reset Info Badge */}
            <div className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] border border-white/15 text-neutral-200 text-xs font-mono font-semibold flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-sky-400 animate-pulse shrink-0" />
              <span>Reset um <span className="font-bold text-white">{resetInfo.formattedTime} Uhr</span> ({resetInfo.remainingText})</span>
            </div>

            {/* Explanatory text */}
            <div className="text-xs leading-relaxed text-neutral-300 px-2 bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl text-left space-y-2">
              <p>
                Dein 12-Stunden-Rechenkontingent ist vollständig ausgeschöpft. Die Prozent füllen sich dynamisch je nach Rechenintensität der genutzten KI-Modelle.
              </p>
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-300 text-[11px]">
                <strong>💡 Hinweis:</strong> Du kannst Saphir weiterhin unterbrechungsfrei mit dem Basis-Modell <strong>Dandelious Lite</strong> nutzen, bis das 12-Stunden-Limit wieder freigegeben wird.
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full pt-2 space-y-2">
              {canReset12hLimitManually(userTier) && (
                <button
                  onClick={() => {
                    reset12hLimitManually(userTier);
                    onClose();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-lime-800/40 to-lime-800/40 hover:from-lime-800/60 hover:to-lime-800/60 border border-lime-500/40 hover:border-lime-400 text-lime-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ultra-Perk: Limit manuell zurücksetzen</span>
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  onOpenRedeem();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4 text-black" />
                <span>Tarif wechseln / Access Card einlösen</span>
              </button>

              {onOpenApiKeys && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenApiKeys();
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.98]"
                >
                  <Key className="w-4 h-4 text-neutral-300" />
                  <span>Eigenen API-Key verwenden</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="w-full py-2 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-400 hover:text-white font-medium text-xs transition-all flex items-center justify-center cursor-pointer"
              >
                Mit Dandelious Lite fortfahren
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
  );
};

