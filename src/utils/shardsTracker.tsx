import React from 'react';
import { motion } from 'motion/react';

// Shards & Apple Fitness Ring Activity Tracker for Dandelious

export interface ShardsState {
  enabled: boolean;
  shardsCount: number;
  lastVisitDateStr: string; // YYYY-MM-DD
  lastVisitTimestamp: number;
  daysActiveCount: number;
  limitBoostExpiresAt?: number; // timestamp until when 20% boost is active
  historyLogs: Array<{ date: string; change: number; reason: string }>;
}

const STORAGE_SHARDS_KEY = 'dandelious_shards_fitness_v4';

export const INITIAL_SHARDS_STATE: ShardsState = {
  enabled: true,
  shardsCount: 0,
  lastVisitDateStr: '',
  lastVisitTimestamp: 0,
  daysActiveCount: 0,
  historyLogs: []
};

export const resetShardsState = (): ShardsState => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_SHARDS_KEY);
      localStorage.removeItem('dandelious_shards_fitness_v2');
      localStorage.removeItem('dandelious_shards_fitness_v3');
    } catch (e) {}
  }
  const clean = { ...INITIAL_SHARDS_STATE };
  saveShardsState(clean);
  return clean;
};

export const getTodayDateStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const loadShardsState = (): ShardsState => {
  if (typeof window === 'undefined') {
    return { ...INITIAL_SHARDS_STATE };
  }

  try {
    const raw = localStorage.getItem(STORAGE_SHARDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled ?? true,
        shardsCount: typeof parsed.shardsCount === 'number' ? parsed.shardsCount : 0,
        lastVisitDateStr: parsed.lastVisitDateStr || '',
        lastVisitTimestamp: parsed.lastVisitTimestamp || 0,
        daysActiveCount: typeof parsed.daysActiveCount === 'number' ? parsed.daysActiveCount : 0,
        limitBoostExpiresAt: parsed.limitBoostExpiresAt,
        historyLogs: Array.isArray(parsed.historyLogs) ? parsed.historyLogs : []
      };
    }
  } catch (e) {
    console.warn('Failed to load shards state:', e);
  }

  return { ...INITIAL_SHARDS_STATE };
};

export const saveShardsState = (state: ShardsState): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_SHARDS_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('dandelious_shards_updated'));
  } catch (e) {}
};

export const addShards = (amount: number, reason: string = 'Aktivität'): ShardsState => {
  const state = loadShardsState();
  const newState: ShardsState = {
    ...state,
    shardsCount: state.shardsCount + amount,
    historyLogs: [
      { date: getTodayDateStr(), change: amount, reason },
      ...(state.historyLogs || [])
    ]
  };
  saveShardsState(newState);
  return newState;
};

/**
 * Checks and updates daily shards (+2 Shards per calendar day visited, no decay).
 */
export const checkAndUpdateDailyShards = (): { state: ShardsState; awarded: number; decayed: number } => {
  const state = loadShardsState();
  if (!state.enabled) {
    return { state, awarded: 0, decayed: 0 };
  }

  const today = getTodayDateStr();

  // Already credited today
  if (state.lastVisitDateStr === today) {
    return { state, awarded: 0, decayed: 0 };
  }

  const awarded = 2;
  state.shardsCount = (state.shardsCount || 0) + 2;
  state.daysActiveCount = (state.daysActiveCount || 0) + 1;
  state.historyLogs.unshift({
    date: today,
    change: +2,
    reason: 'Dandelious geöffnet (+2 Shards)'
  });

  state.lastVisitDateStr = today;
  state.lastVisitTimestamp = Date.now();
  state.historyLogs = state.historyLogs.slice(0, 15);

  saveShardsState(state);
  return { state, awarded, decayed: 0 };
};

/**
 * Tiered Shards Redemption Options:
 * - 20 Shards -> 10%
 * - 50 Shards -> 20%
 * - 70 Shards -> 25%
 * - 100 Shards -> 30%
 */
export interface ShardsTierOption {
  shardsRequired: number;
  limitPercentRecovery: number;
  title: string;
}

export const SHARD_TIERS: ShardsTierOption[] = [
  { shardsRequired: 20, limitPercentRecovery: 10, title: '10% Limit zurückholen' },
  { shardsRequired: 50, limitPercentRecovery: 20, title: '20% Limit zurückholen' },
  { shardsRequired: 70, limitPercentRecovery: 25, title: '25% Limit zurückholen' },
  { shardsRequired: 100, limitPercentRecovery: 30, title: '30% Limit zurückholen' }
];

export const redeemShardsForLimitBoost = (shardsRequired: number, percentPercent: number): { success: boolean; newCount: number; message: string } => {
  const state = loadShardsState();
  if (state.shardsCount < shardsRequired) {
    return {
      success: false,
      newCount: state.shardsCount,
      message: `Du benötigst mindestens ${shardsRequired} Shards (Aktuell: ${state.shardsCount})`
    };
  }

  state.shardsCount -= shardsRequired;
  state.limitBoostExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
  state.historyLogs.unshift({
    date: getTodayDateStr(),
    change: -shardsRequired,
    reason: `${shardsRequired} Shards eingelöst: +${percentPercent}% Nutzungslimit wiederhergestellt`
  });

  saveShardsState(state);
  return {
    success: true,
    newCount: state.shardsCount,
    message: `Erfolgreich! ${percentPercent}% deines Nutzungslimits wurden für heute wiederhergestellt.`
  };
};

/**
 * Custom Shard Vector Icon Component (Zero Emoji, pure Apple aesthetic)
 */
export const ShardCustomIcon: React.FC<{ className?: string; size?: number; glow?: boolean }> = ({
  className = "w-5 h-5",
  size = 20,
  glow = false
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${glow ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : ''}`}
  >
    {/* Geometric Crystal Shard */}
    <path
      d="M12 2L19.5 8.5L15 21.5L12 18L9 21.5L4.5 8.5L12 2Z"
      fill="url(#shardGradFill)"
      stroke="url(#shardGradStroke)"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M12 2V18M12 18L15 8.5M12 18L9 8.5M4.5 8.5H19.5"
      stroke="white"
      strokeOpacity="0.4"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="shardGradFill" x1="4.5" y1="2" x2="19.5" y2="21.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38BDF8" stopOpacity="0.8" />
        <stop offset="0.5" stopColor="#818CF8" stopOpacity="0.85" />
        <stop offset="1" stopColor="#C084FC" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="shardGradStroke" x1="4.5" y1="2" x2="19.5" y2="21.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E0F2FE" />
        <stop offset="1" stopColor="#C084FC" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Apple Fitness Ring for Shards Progress (with fluid rotating gradient animation)
 */
export const ShardFitnessRing: React.FC<{
  shardsCount: number;
  maxGoal?: number;
  size?: number;
  strokeWidth?: number;
  showCenterIcon?: boolean;
}> = ({
  shardsCount,
  maxGoal = 50,
  size = 84,
  strokeWidth = 8,
  showCenterIcon = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, shardsCount / maxGoal));
  const strokeDashoffset = circumference - progress * circumference;
  const gradId = React.useId().replace(/:/g, '');

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* Gentle Ambient Backglow */}
      <motion.div
        animate={{
          scale: [0.95, 1.08, 0.95],
          opacity: [0.35, 0.65, 0.35]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-md pointer-events-none"
      />

      <motion.svg
        width={size}
        height={size}
        className="rotate-[-90deg] relative z-10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Apple Ring with Animated Rotating Gradient */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Center content */}
      {showCenterIcon && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.15 }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
        >
          <ShardCustomIcon size={size * 0.34} glow={shardsCount >= maxGoal} />
        </motion.div>
      )}
    </div>
  );
};
