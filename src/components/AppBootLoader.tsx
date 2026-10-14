import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { DotMatrixCanvas } from './DotMatrixCanvas';
import { DandeliousLogo } from './DandeliousLogo';

interface AppBootLoaderProps {
  onComplete: () => void;
  durationMs?: number;
}

const BOOT_STAGES = [
  { threshold: 0, label: 'Initialisiere Dandelious Neural Kernel Engine...', sub: 'Lade lokale Parameter & Kontext-Puffer' },
  { threshold: 28, label: 'Synchronisiere Mediathek & Workspace Matrix...', sub: 'Verbinde Firestore Realtime & State Routing' },
  { threshold: 60, label: 'Wärme Dice Studio Sandbox Runtime auf...', sub: 'Kompiliere HTML5/JS Sandbox-Isolatoren' },
  { threshold: 88, label: 'Systemprüfung erfolgreich abgeschlossen', sub: 'Dandelious, Mediathek und Dice sind betriebsbereit' },
];

export const AppBootLoader: React.FC<AppBootLoaderProps> = ({
  onComplete,
  durationMs = 5000
}) => {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let animFrame: number;

    const tick = (now: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = now;
      }

      const elapsed = now - startTimeRef.current;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (pct >= 100) {
        setIsFinished(true);
        setTimeout(() => {
          onComplete();
        }, 400);
      } else {
        animFrame = requestAnimationFrame(tick);
      }
    };

    animFrame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [durationMs, onComplete]);

  // Current stage info based on progress
  const currentStage = [...BOOT_STAGES].reverse().find(s => progress >= s.threshold) || BOOT_STAGES[0];

  // Dot matrix loading bar config
  const totalDots = 28;
  const activeDots = Math.floor((progress / 100) * totalDots);

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          key="app-bootloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] bg-[#050508] flex flex-col items-center justify-center p-6 select-none overflow-hidden"
        >
          {/* Subtle Ambient Dot Matrix Background */}
          <div className="absolute inset-0 pointer-events-none opacity-35">
            <DotMatrixCanvas density={22} interactive={true} />
          </div>

          {/* Central High-Tech Boot Capsule */}
          <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#0c0c10]/90 border border-white/10 p-7 shadow-2xl backdrop-blur-2xl flex flex-col space-y-6">
            
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <DandeliousLogo className="w-6 h-6" variant="badge" />
                <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                  DANDELIOUS OS // BOOT MATRIX
                </span>
              </div>
              <span className="text-xs font-mono text-neutral-400 font-semibold">
                {progress}%
              </span>
            </div>

            {/* Matrix Pulse Center */}
            <div className="py-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {progress >= 100 ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  <p className="text-xs font-medium text-white tracking-tight truncate">
                    {currentStage.label}
                  </p>
                  <p className="text-[10px] font-mono text-neutral-400 truncate">
                    {currentStage.sub}
                  </p>
                </div>
              </div>

              {/* Dot Matrix Progress Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                  {Array.from({ length: totalDots }).map((_, idx) => {
                    const isActive = idx < activeDots;
                    const isEdge = idx === activeDots;
                    return (
                      <div
                        key={idx}
                        className={`h-2 flex-1 rounded-full transition-all duration-150 ${
                          isActive
                            ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]'
                            : isEdge
                            ? 'bg-white/60 animate-pulse'
                            : 'bg-white/10'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions / Skip */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
              <span className="font-mono text-neutral-500 text-[10px] tracking-wider uppercase">
                Dandelious • Mediathek • Dice
              </span>
              <button
                onClick={() => {
                  setIsFinished(true);
                  onComplete();
                }}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <span>Überspringen</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
