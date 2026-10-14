import { loadShardsState, addShards } from './shardsTracker';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  shardsReward: number;
  difficulty: 'einfach' | 'mittel' | 'schwer' | 'extrem';
  icon: 'trophy' | 'zap' | 'star' | 'flame' | 'shield' | 'crown' | 'sparkles' | 'target';
  unlocked: boolean;
  unlockedAt?: number;
  currentProgress: number;
  maxProgress: number;
}

const ACHIEVEMENTS_STORAGE_KEY = 'dandelious_achievements_v7';

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // --- ERSTES MAL / STANDARDAKTIONEN (1 - 2 SHARDS) ---
  {
    id: 'first_msg',
    title: 'Erster Schritt',
    description: 'Sende deine allererste Nachricht an Dandelious',
    shardsReward: 1,
    difficulty: 'einfach',
    icon: 'zap',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 1
  },
  {
    id: 'open_projects',
    title: 'Projekte-Entdecker',
    description: 'Öffne den Bereich Projekte zum ersten Mal',
    shardsReward: 1,
    difficulty: 'einfach',
    icon: 'target',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 1
  },
  {
    id: 'open_mediathek',
    title: 'Mediathek-Blick',
    description: 'Öffne die Mediathek zum ersten Mal',
    shardsReward: 1,
    difficulty: 'einfach',
    icon: 'sparkles',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 1
  },
  {
    id: 'open_crypto',
    title: 'Krypto-Analyst',
    description: 'Öffne das Crypto Studio zum ersten Mal',
    shardsReward: 1,
    difficulty: 'einfach',
    icon: 'target',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 1
  },
  {
    id: 'open_stocks',
    title: 'Börsen-Analyst',
    description: 'Öffne das Aktien Studio zum ersten Mal',
    shardsReward: 1,
    difficulty: 'einfach',
    icon: 'target',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 1
  },
  {
    id: 'open_weather',
    title: 'Wetter-Sensor',
    description: 'Öffne das Wetter Studio zum ersten Mal',
    shardsReward: 1,
    difficulty: 'einfach',
    icon: 'sparkles',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 1
  },
  {
    id: 'release_planner',
    title: 'Release-Entdecker',
    description: 'Merke dir 1 kommenden Release im Studio',
    shardsReward: 1,
    difficulty: 'einfach',
    icon: 'target',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 1
  },
  {
    id: 'night_owl',
    title: 'Nachtschwärmer',
    description: 'Nutze Dandelious in den späten Abendstunden',
    shardsReward: 2,
    difficulty: 'einfach',
    icon: 'sparkles',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 1
  },

  // --- SHARD & AKTIVITÄTS-MEILENSTEINE (GROSSE BELOHNUNGEN) ---
  {
    id: 'shards_20',
    title: 'Shard-Pionier',
    description: 'Erreiche ein Guthaben von 20 Shards',
    shardsReward: 5,
    difficulty: 'einfach',
    icon: 'star',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 20
  },
  {
    id: 'shards_50',
    title: 'Shard-Sammler',
    description: 'Erreiche ein Guthaben von 50 Shards',
    shardsReward: 15,
    difficulty: 'mittel',
    icon: 'flame',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 50
  },
  {
    id: 'shards_70',
    title: 'Shard-Hüter',
    description: 'Erreiche ein Guthaben von 70 Shards',
    shardsReward: 25,
    difficulty: 'mittel',
    icon: 'shield',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 70
  },
  {
    id: 'shards_100',
    title: 'Shard-Hundert',
    description: 'Erreiche ein Guthaben von 100 Shards',
    shardsReward: 50,
    difficulty: 'mittel',
    icon: 'trophy',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 100
  },
  {
    id: 'active_7_days',
    title: 'Treuer Weggefährte',
    description: 'Sei an 7 verschiedenen Kalendertagen in Dandelious aktiv',
    shardsReward: 10,
    difficulty: 'mittel',
    icon: 'flame',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 7
  },
  {
    id: 'chat_marathon',
    title: 'Chat-Marathon',
    description: 'Sende insgesamt 100 Nachrichten im Hauptchat',
    shardsReward: 30,
    difficulty: 'schwer',
    icon: 'trophy',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 100
  },
  {
    id: 'active_30_days',
    title: 'Monats-Treue',
    description: 'Sei an 30 verschiedenen Kalendertagen in Dandelious aktiv',
    shardsReward: 40,
    difficulty: 'schwer',
    icon: 'crown',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 30
  },
  {
    id: 'active_100_days',
    title: 'Hundert-Tage-Treue',
    description: 'Sei an 100 verschiedenen Kalendertagen in Dandelious aktiv',
    shardsReward: 100,
    difficulty: 'extrem',
    icon: 'crown',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 100
  },
  {
    id: 'chat_empire',
    title: 'Chat-Imperium',
    description: 'Sende insgesamt 500 Nachrichten im Hauptchat',
    shardsReward: 150,
    difficulty: 'extrem',
    icon: 'crown',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 500
  },
  {
    id: 'shards_500',
    title: 'Shard-Gigant',
    description: 'Erreiche ein Guthaben von 500 Shards',
    shardsReward: 400,
    difficulty: 'extrem',
    icon: 'crown',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 500
  },
  {
    id: 'shards_1000',
    title: 'Legende von Dandelious',
    description: 'Erreiche das ultimative Guthaben von 1000 Shards',
    shardsReward: 1000,
    difficulty: 'extrem',
    icon: 'crown',
    unlocked: false,
    currentProgress: 0,
    maxProgress: 1000
  }
];

export function resetAchievementsState(): Achievement[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
      localStorage.removeItem('dandelious_achievements_v5');
      localStorage.removeItem('dandelious_achievements_v6');
    } catch (e) {}
  }
  const clean = DEFAULT_ACHIEVEMENTS.map(def => ({
    ...def,
    unlocked: false,
    unlockedAt: undefined,
    currentProgress: 0
  }));
  saveAchievementsState(clean);
  return clean;
}

export function loadAchievementsState(): Achievement[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return DEFAULT_ACHIEVEMENTS;
    const parsed: Achievement[] = JSON.parse(raw);

    // Sync with default achievements to update reward amounts and structure
    return DEFAULT_ACHIEVEMENTS.map(def => {
      const found = parsed.find(p => p.id === def.id);
      return found
        ? {
            ...def,
            unlocked: Boolean(found.unlocked),
            unlockedAt: found.unlockedAt,
            currentProgress: typeof found.currentProgress === 'number' ? found.currentProgress : def.currentProgress
          }
        : def;
    });
  } catch (e) {
    return DEFAULT_ACHIEVEMENTS;
  }
}

export function saveAchievementsState(achievements: Achievement[]): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dandelious_achievements_updated'));
    }
  } catch (e) {}
}

/**
 * Triggers an achievement unlock or updates progress.
 * Unlocks display a Steam-style popup in bottom-right corner!
 */
export function checkAchievement(achievementId: string, progressValue?: number): void {
  const currentAchievements = loadAchievementsState();
  let updated = false;
  let newlyUnlocked: Achievement | null = null;

  const shardsState = loadShardsState();
  const currentShardsCount = shardsState.shardsCount || 0;
  const daysActive = shardsState.daysActiveCount || 0;

  const list = currentAchievements.map(ach => {
    if (ach.unlocked) return ach;

    let newProgress = ach.currentProgress;

    // Handle automated milestones
    if (ach.id === 'shards_20') newProgress = currentShardsCount;
    else if (ach.id === 'shards_50') newProgress = currentShardsCount;
    else if (ach.id === 'shards_70') newProgress = currentShardsCount;
    else if (ach.id === 'shards_100') newProgress = currentShardsCount;
    else if (ach.id === 'shards_500') newProgress = currentShardsCount;
    else if (ach.id === 'shards_1000') newProgress = currentShardsCount;
    else if (ach.id === 'active_7_days') newProgress = daysActive;
    else if (ach.id === 'active_30_days') newProgress = daysActive;
    else if (ach.id === 'active_100_days') newProgress = daysActive;
    else if (ach.id === achievementId) {
      newProgress = progressValue !== undefined ? progressValue : ach.maxProgress;
    }

    if (newProgress >= ach.maxProgress && !ach.unlocked) {
      updated = true;
      const unlockedItem: Achievement = {
        ...ach,
        currentProgress: ach.maxProgress,
        unlocked: true,
        unlockedAt: Date.now()
      };
      newlyUnlocked = unlockedItem;
      return unlockedItem;
    } else if (newProgress !== ach.currentProgress) {
      updated = true;
      return { ...ach, currentProgress: Math.min(ach.maxProgress, newProgress) };
    }

    return ach;
  });

  if (updated) {
    saveAchievementsState(list);
  }

  if (newlyUnlocked) {
    // Reward bonus shards
    addShards(newlyUnlocked.shardsReward, `Erfolg freigeschaltet: ${newlyUnlocked.title}`);

    // Dispatch custom event for Steam-style popup
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dandelious_steam_achievement_unlocked', {
        detail: newlyUnlocked
      }));
    }
  }
}

/**
 * Periodically checks Shard thresholds & activity milestones
 */
export function checkShardMilestoneAchievements(shardsCount: number): void {
  if (shardsCount >= 20) checkAchievement('shards_20', shardsCount);
  if (shardsCount >= 50) checkAchievement('shards_50', shardsCount);
  if (shardsCount >= 70) checkAchievement('shards_70', shardsCount);
  if (shardsCount >= 100) checkAchievement('shards_100', shardsCount);
  if (shardsCount >= 500) checkAchievement('shards_500', shardsCount);
  if (shardsCount >= 1000) checkAchievement('shards_1000', shardsCount);

  // Also check activity days
  const daysActive = loadShardsState().daysActiveCount;
  if (daysActive >= 7) checkAchievement('active_7_days', daysActive);
  if (daysActive >= 30) checkAchievement('active_30_days', daysActive);
  if (daysActive >= 100) checkAchievement('active_100_days', daysActive);
}
