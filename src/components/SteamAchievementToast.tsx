import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Zap, Star, Flame, Shield, Crown, Sparkles, Target, X } from 'lucide-react';
import { Achievement } from '../utils/achievementsTracker';
import { playSound } from '../utils/sound';

export const SteamAchievementToast: React.FC = () => {
  const [activeToast, setActiveToast] = useState<Achievement | null>(null);

  useEffect(() => {
    const handleAchievementEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Achievement>;
      if (customEvent.detail) {
        setActiveToast(customEvent.detail);
        playSound('chime', true);

        // Auto dismiss after 5.5s
        const timer = setTimeout(() => {
          setActiveToast(null);
        }, 5500);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('dandelious_steam_achievement_unlocked', handleAchievementEvent);
    return () => window.removeEventListener('dandelious_steam_achievement_unlocked', handleAchievementEvent);
  }, []);

  const getAchievementIcon = (iconType: Achievement['icon']) => {
    switch (iconType) {
      case 'trophy': return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'crown': return <Crown className="w-5 h-5 text-amber-300" />;
      case 'flame': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'shield': return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'star': return <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />;
      case 'zap': return <Zap className="w-5 h-5 text-blue-400 fill-blue-400" />;
      case 'target': return <Target className="w-5 h-5 text-purple-400" />;
      default: return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          key={`steam-achievement-${activeToast.id}`}
          initial={{ opacity: 0, x: 80, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, y: 10, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
          className="fixed bottom-5 right-5 z-[250] pointer-events-auto select-none"
        >
          <div className="relative flex items-center gap-3.5 p-3.5 pl-4 pr-5 rounded-2xl bg-[#18181b]/95 backdrop-blur-2xl border border-amber-500/40 shadow-[0_15px_50px_rgba(0,0,0,0.8)] text-white min-w-[290px] max-w-sm">
            {/* Ambient Gold Glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent pointer-events-none" />

            {/* Icon Box */}
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500/25 via-yellow-500/15 to-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-inner">
              {getAchievementIcon(activeToast.icon)}
            </div>

            {/* Text Content */}
            <div className="min-w-0 flex-1 relative z-10">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block leading-tight">
                ERFOLG FREIGESCHALTET!
              </span>
              <h4 className="text-[14px] font-bold text-white truncate leading-snug">
                {activeToast.title}
              </h4>
              <p className="text-[11px] text-neutral-300 truncate mt-0.5">
                {activeToast.description} <span className="text-amber-300 font-mono font-bold">(+{activeToast.shardsReward} Shards)</span>
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors shrink-0"
              title="Schließen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
