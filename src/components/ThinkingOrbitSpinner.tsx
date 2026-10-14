import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Sparkles, Layers, Cpu } from 'lucide-react';

interface ThinkingOrbitSpinnerProps {
  label?: string;
  subStatus?: string;
  className?: string;
  isWebSearch?: boolean;
}

const DEFAULT_STAGES = [
  'Analysiert die Anfrage und aktiviert Reasoning-Kerne...',
  'Durchsucht das Web und prüft relevante Quellen...',
  'Besucht Webseiten und extrahiert Kerninformationen...',
  'Gleicht Fakten ab und kombiniert Informationen...',
  'Synthetisiert Logik und strukturiert die finale Antwort...'
];

export const ThinkingOrbitSpinner: React.FC<ThinkingOrbitSpinnerProps> = ({
  label = 'Thinking',
  subStatus,
  className = '',
  isWebSearch = false
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    if (subStatus) return;
    const interval = setInterval(() => {
      setCurrentStageIdx((prev) => (prev + 1) % DEFAULT_STAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [subStatus]);

  // Choreography duration: 7.5 seconds complete loop
  const cycleDuration = 7.5;
  const keyframeTimes = [
    0,     // 0.00s: Orbit start
    0.07,  // 0.52s: Orbiting
    0.14,  // 1.05s: Orbiting
    0.21,  // 1.57s: Orbit complete
    0.28,  // 2.10s: Wave formation 1
    0.35,  // 2.62s: Wave peak/trough
    0.42,  // 3.15s: Wave rebound
    0.49,  // 3.67s: Tower stack
    0.56,  // 4.20s: Tower bounce
    0.63,  // 4.72s: Collision wind-up
    0.69,  // 5.17s: SLAM collision into center
    0.75,  // 5.62s: High elastic bounce-off
    0.82,  // 6.15s: Random kinetic leap 1
    0.89,  // 6.67s: Random kinetic leap 2
    0.95,  // 7.12s: Settle towards orbit
    1.00   // 7.50s: Seamless loop back
  ];

  const activeStatusText = subStatus || DEFAULT_STAGES[currentStageIdx];

  return (
    <div className={`flex flex-col items-start gap-2 py-1.5 px-1 select-none ${className}`}>
      {/* Top Row: Animated 3-Dot Kinetic Stage + "Thinking" */}
      <div className="flex items-center gap-3">
        <div className="relative w-7 h-6 flex items-center justify-center">
          {/* Dot 1 (Bright / Primary) */}
          <motion.span
            className="absolute w-1.5 h-1.5 rounded-full bg-white block shadow-xs"
            animate={{
              x: [0, 5.5, 0, -5.5, -8, -8, -8, 0, 0, -11, -0.6, -12, 5, -4, -1, 0],
              y: [-5.5, 0, 5.5, 0, -5, 5, -5, -6.5, -9, 0, 0, -4, 4.5, -5, -4.5, -5.5],
              scale: [1, 1, 1, 1, 1, 1.1, 1, 1.15, 0.9, 1, 1.45, 0.8, 1.2, 1, 1, 1]
            }}
            transition={{
              duration: cycleDuration,
              repeat: Infinity,
              ease: "easeInOut",
              times: keyframeTimes
            }}
          />

          {/* Dot 2 (Middle / Core) */}
          <motion.span
            className="absolute w-1.5 h-1.5 rounded-full bg-neutral-200 block shadow-xs"
            animate={{
              x: [4.8, -4.8, 0, 4.8, 0, 0, 0, 0, 0, 0, 0, 0, -5.5, 6, 4, 4.8],
              y: [2.8, 2.8, -5.5, 2.8, 5, -5, 5, 0, 0, 0, 0, 7.5, -3, 2, 2.2, 2.8],
              scale: [1, 1, 1, 1, 1.1, 1, 1.1, 1, 1.2, 0.9, 1.55, 0.85, 1, 1.2, 1, 1]
            }}
            transition={{
              duration: cycleDuration,
              repeat: Infinity,
              ease: "easeInOut",
              times: keyframeTimes
            }}
          />

          {/* Dot 3 (Accent / Dynamic) */}
          <motion.span
            className="absolute w-1.5 h-1.5 rounded-full bg-neutral-400 block shadow-xs"
            animate={{
              x: [-4.8, 0, 4.8, -4.8, 8, 8, 8, 0, 0, 11, 0.6, 12, 1.5, -3, -4, -4.8],
              y: [2.8, -5.5, 2.8, 2.8, -5, 5, -5, 6.5, 9, 0, 0, -4, 5.5, 3.5, 2.2, 2.8],
              scale: [1, 1, 1, 1, 1, 1.1, 1, 0.9, 1.15, 1, 1.45, 0.8, 1.1, 1.2, 1, 1]
            }}
            transition={{
              duration: cycleDuration,
              repeat: Infinity,
              ease: "easeInOut",
              times: keyframeTimes
            }}
          />
        </div>

        {label && (
          <span className="text-[14.5px] font-medium text-white tracking-wide">
            {label}
          </span>
        )}
      </div>

      {/* Dynamic Sub-Status in Dark Gray Text (Matching User Requirement) */}
      <div className="pl-1 min-h-[20px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={activeStatusText}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="text-[13px] text-neutral-500 font-normal leading-relaxed tracking-normal flex items-center gap-1.5 select-text"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 shrink-0 opacity-60 animate-pulse" />
            <span>{activeStatusText}</span>
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
