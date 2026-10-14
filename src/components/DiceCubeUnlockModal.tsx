import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Check, AlertCircle, Lock, Unlock, ClipboardPaste, X } from 'lucide-react';
import { DiceCubeEntry } from '../data/diceCubes';
import { activateDiceCube, normalizeDiceCubeCode } from '../utils/diceCubeAuth';

interface DiceCubeUnlockModalProps {
  isOpen: boolean;
  onUnlocked: (cube: DiceCubeEntry) => void;
  onClose?: () => void;
}

export const DiceCubeUnlockModal: React.FC<DiceCubeUnlockModalProps> = ({
  isOpen,
  onUnlocked,
  onClose
}) => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  if (!isOpen) return null;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9\-_]/g, '').slice(0, 10);
    setCode(val);
    setErrorMsg(null);

    const normalized = normalizeDiceCubeCode(val);
    if (normalized.length === 10) {
      handleAttemptUnlock(normalized);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        const cleaned = text.toUpperCase().replace(/[^A-Z0-9\-_]/g, '').slice(0, 10);
        if (cleaned) {
          setCode(cleaned);
          setErrorMsg(null);
          if (cleaned.length === 10) {
            handleAttemptUnlock(cleaned);
          }
        }
      }
    } catch (e) {
      // Ignore clipboard read permission failures
    }
  };

  const handleAttemptUnlock = (codeToTest?: string) => {
    const testCode = codeToTest || code;
    const normalized = normalizeDiceCubeCode(testCode);

    if (!normalized || normalized.length !== 10) {
      setErrorMsg(`Code muss genau 10 Zeichen lang sein (${normalized.length}/10).`);
      return;
    }

    setIsActivating(true);
    setErrorMsg(null);

    setTimeout(() => {
      const result = activateDiceCube(normalized);
      setIsActivating(false);

      if (result.success && result.cube) {
        setSuccessMsg(result.message);
        setTimeout(() => {
          onUnlocked(result.cube!);
        }, 500);
      } else {
        setErrorMsg(result.message || 'Ungültiger 10-stelliger DiceCube-Code.');
      }
    }, 200);
  };

  const chars = code.padEnd(10, ' ').split('');

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-md liquid-glass-modal rounded-[32px] p-6 sm:p-8 shadow-[0_32px_90px_rgba(0,0,0,0.95)] relative overflow-hidden flex flex-col items-center text-center select-none"
      >
        {/* Specular Top Rim Reflection */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

        {/* Ambient Top Light */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/[0.08] rounded-full blur-3xl pointer-events-none" />

        {/* Close button if optional */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full liquid-glass-subtle text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        )}

        {/* Holographic Liquid Cube Icon */}
        <motion.div 
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-16 h-16 mb-4 flex items-center justify-center rounded-2xl liquid-glass-active-pill shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
        >
          <svg className="w-9 h-9 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </motion.div>

        {/* Badge Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/20 text-[10px] font-mono tracking-widest uppercase text-neutral-300 mb-2 shadow-sm">
          <Lock size={10} className="text-white" />
          <span>DICECUBE ACCESS</span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5">
          Dice Studio Entsperren
        </h2>
        <p className="text-xs text-neutral-400 max-w-xs mb-6 leading-relaxed">
          Gib deinen 10-stelligen Sicherheitsschlüssel ein, um die Coding-Engine freizuschalten.
        </p>

        {/* Interactive Segmented Key Representation */}
        <div className="w-full space-y-4">
          <div className="relative">
            <input 
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="XXXXXXXXXX"
              maxLength={10}
              autoFocus
              className="w-full h-14 liquid-glass-input rounded-2xl px-4 text-center font-mono text-xl tracking-[0.3em] text-white uppercase placeholder-neutral-700 focus:outline-none transition-all shadow-inner"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-neutral-400">
              {code.length}/10
            </div>
          </div>

          {/* Quick Paste helper */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-neutral-500 font-mono">10-stelliger Alphanumerik-Code</span>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="inline-flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white transition-colors cursor-pointer py-0.5 px-2 rounded-lg hover:bg-white/10"
            >
              <ClipboardPaste size={12} />
              <span>Aus Zwischenablage</span>
            </button>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs shadow-lg backdrop-blur-md"
              >
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs shadow-lg backdrop-blur-md"
              >
                <Check size={14} className="shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary Action Button */}
          <button 
            type="button"
            onClick={() => handleAttemptUnlock()}
            disabled={isActivating || code.length !== 10}
            className="w-full h-12 rounded-2xl bg-white hover:bg-neutral-100 disabled:opacity-35 disabled:hover:bg-white text-black font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.25)] active:scale-[0.98]"
          >
            {isActivating ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <Unlock size={15} />
                <span>DiceCube Aktivieren</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
