/**
 * Saphir Dynamic Usage Limit & Computation Intensity Tracker
 * 
 * Rules:
 * - 20-hour cycle for daily computation limit (resets every 20 hours).
 * - 7-day cycle for weekly limit (resets every 7 days).
 * - Tier Limits:
 *     Kostenlos: Fast unlimited, a bit of Basic daily (100 units capacity).
 *     Plus: Fast, Basic, Extreme (250 units capacity - 2.5x higher).
 *     Pro: Fast, Basic, Extreme, Ultra, Shark, Octopus (600 units capacity - 6x higher).
 *     Ultra: Fast, Basic, Extreme, Ultra, Octopus, Nautilus (1500 units capacity - 15x higher).
 * - Consumption increases based on computational complexity:
 *     Fast: minimal intensity (~1.2 units)
 *     Basic: standard intensity (~6.0 units)
 *     Extreme (Deep Reasoning): high intensity (~18.0 units)
 *     Ultra (Flagship 1M Tokens): apex intensity (~35.0 units)
 *     Dice Shark: ~6.0 units
 *     Dice Octopus: ~15.0 units
 *     Dice Nautilus: ~30.0 units
 *     + Modifiers for Prompt length, Output length, Attachments, Web Search, Deep Reasoning.
 */

import { SubscriptionTier } from '../types';

const STORAGE_KEY_12H = 'saphir_usage_12h_v2';
const STORAGE_KEY_WEEKLY = 'saphir_usage_weekly_v2';

export interface UsageState {
  cycleStart12h: number; // timestamp
  usedPercent12h: number; // 0 - 100
  totalComputeUnits12h: number;
  lastManualReset?: number; // timestamp
  
  cycleStartWeekly: number; // timestamp
  usedPercentWeekly: number; // 0 - 100
  totalComputeUnitsWeekly: number;
}

const CYCLE_12H_MS = 12 * 60 * 60 * 1000; // 12 hours
const CYCLE_WEEKLY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Capacity in compute units per tier for a 12h window (significantly increased)
export const TIER_CAPACITY_12H: Record<string, number> = {
  'kostenlos': 350,      // 3.5x higher base capacity
  'plus': 900,           // 4.5x higher capacity
  'expanded': 900,
  'pro': 2200,           // 5.5x higher capacity
  'unlimited': 2200,
  'ultra': 5000,          // 8.3x higher capacity (High-Volume Pro & Ultra)
  'extreme': 5000
};

// Weekly capacity is 7x daily capacity
export const TIER_CAPACITY_WEEKLY: Record<string, number> = {
  'kostenlos': 2500,
  'plus': 6500,
  'expanded': 6500,
  'pro': 16000,
  'unlimited': 16000,
  'ultra': 36000,
  'extreme': 36000
};

export function getUsageState(): UsageState {
  const now = Date.now();
  let state: UsageState = {
    cycleStart12h: now,
    usedPercent12h: 0,
    totalComputeUnits12h: 0,
    cycleStartWeekly: now,
    usedPercentWeekly: 0,
    totalComputeUnitsWeekly: 0
  };

  try {
    const raw12h = localStorage.getItem(STORAGE_KEY_12H);
    const rawWeekly = localStorage.getItem(STORAGE_KEY_WEEKLY);

    if (raw12h) {
      const parsed = JSON.parse(raw12h);
      if (parsed && typeof parsed.cycleStart12h === 'number') {
        state.cycleStart12h = parsed.cycleStart12h;
        state.usedPercent12h = parsed.usedPercent12h || 0;
        state.totalComputeUnits12h = parsed.totalComputeUnits12h || 0;
        if (parsed.lastManualReset) state.lastManualReset = parsed.lastManualReset;
      }
    }

    if (rawWeekly) {
      const parsedW = JSON.parse(rawWeekly);
      if (parsedW && typeof parsedW.cycleStartWeekly === 'number') {
        state.cycleStartWeekly = parsedW.cycleStartWeekly;
        state.usedPercentWeekly = parsedW.usedPercentWeekly || 0;
        state.totalComputeUnitsWeekly = parsedW.totalComputeUnitsWeekly || 0;
      }
    }
  } catch (e) {
    console.warn('Error reading usage state:', e);
  }

  // Check 20-hour cycle expiry
  if (now - state.cycleStart12h >= CYCLE_12H_MS) {
    state.cycleStart12h = now;
    state.usedPercent12h = 0;
    state.totalComputeUnits12h = 0;
    save12hState(state);
  }

  // Check weekly cycle expiry
  if (now - state.cycleStartWeekly >= CYCLE_WEEKLY_MS) {
    state.cycleStartWeekly = now;
    state.usedPercentWeekly = 0;
    state.totalComputeUnitsWeekly = 0;
    saveWeeklyState(state);
  }

  return state;
}

function save12hState(state: UsageState) {
  try {
    localStorage.setItem(STORAGE_KEY_12H, JSON.stringify({
      cycleStart12h: state.cycleStart12h,
      usedPercent12h: Math.min(100, Math.max(0, state.usedPercent12h)),
      totalComputeUnits12h: state.totalComputeUnits12h,
      lastManualReset: state.lastManualReset
    }));
  } catch (e) {}
}

function saveWeeklyState(state: UsageState) {
  try {
    localStorage.setItem(STORAGE_KEY_WEEKLY, JSON.stringify({
      cycleStartWeekly: state.cycleStartWeekly,
      usedPercentWeekly: Math.min(100, Math.max(0, state.usedPercentWeekly)),
      totalComputeUnitsWeekly: state.totalComputeUnitsWeekly
    }));
  } catch (e) {}
}

/**
 * Record usage after a prompt or task based on model, complexity, tokens, and tier
 */
export function recordComputationUsage(
  modelId: string,
  options?: {
    userTier?: SubscriptionTier | string;
    promptLength?: number;
    outputLength?: number;
    hasAttachments?: boolean;
    isWebSearch?: boolean;
    isDeepReasoning?: boolean;
  }
): UsageState {
  const state = getUsageState();
  const lowerModel = (modelId || '').toLowerCase();
  const tierKey = (options?.userTier || 'Kostenlos').toLowerCase();

  const capacity12h = TIER_CAPACITY_12H[tierKey] || 100;
  const capacityWeekly = TIER_CAPACITY_WEEKLY[tierKey] || 500;

  // 1. Base compute unit cost by model
  let computeUnits = 4.0; // default baseline

  if (lowerModel.includes('fast') || lowerModel === 'gemma-2-2b-it') {
    computeUnits = 1.0;
  } else if (lowerModel.includes('basic') || lowerModel === 'gemma-2-9b-it') {
    computeUnits = 5.5;
  } else if (lowerModel.includes('extreme') || lowerModel === 'gemma-2-27b-it') {
    computeUnits = 18.0;
  } else if (lowerModel.includes('ultra') || lowerModel.includes('flash') || lowerModel.includes('gemini-3.7')) {
    computeUnits = 32.0;
  } else if (lowerModel === 'shark') {
    computeUnits = 6.0;
  } else if (lowerModel === 'octopus') {
    computeUnits = 15.0;
  } else if (lowerModel === 'nautilus') {
    computeUnits = 30.0;
  }

  // 2. Add complexity modifiers based on prompt & output length
  const promptLen = options?.promptLength || 0;
  const outputLen = options?.outputLength || 0;

  if (promptLen > 0) {
    computeUnits += Math.min(8.0, (promptLen / 300) * 1.0);
  }
  if (outputLen > 0) {
    computeUnits += Math.min(12.0, (outputLen / 500) * 1.5);
  }

  if (options?.isWebSearch) {
    computeUnits += 2.5;
  }
  if (options?.hasAttachments) {
    computeUnits += 3.5;
  }
  if (options?.isDeepReasoning) {
    computeUnits += 5.0;
  }

  // 3. Compute percentage increment based on user's tier capacity
  const percentInc12h = (computeUnits / capacity12h) * 100;
  const percentIncWeekly = (computeUnits / capacityWeekly) * 100;

  state.totalComputeUnits12h += computeUnits;
  state.usedPercent12h = Math.min(100, Math.round((state.usedPercent12h + percentInc12h) * 10) / 10);

  state.totalComputeUnitsWeekly += computeUnits;
  state.usedPercentWeekly = Math.min(100, Math.round((state.usedPercentWeekly + percentIncWeekly) * 10) / 10);

  save12hState(state);
  saveWeeklyState(state);

  // Dispatch custom event so all UI components (Sidebar, Settings, Modals) update synchronously
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('saphir_usage_updated', { detail: state }));
  }

  return state;
}

/**
 * Checks whether the 20-hour limit is at 100% (rechenintensives Limit erreicht)
 */
export function is12hLimitReached(): boolean {
  const state = getUsageState();
  return state.usedPercent12h >= 100;
}

/**
 * Checks if the user is allowed to manually reset their 12h limit.
 * Only allowed for Ultra users once per 24 hours.
 */
export function canReset12hLimitManually(userTier: string = 'Kostenlos'): boolean {
  if (userTier !== 'Ultra' && userTier !== 'Extreme') return false;
  const state = getUsageState();
  const now = Date.now();
  if (!state.lastManualReset) return true;
  return now - state.lastManualReset >= 24 * 60 * 60 * 1000;
}

/**
 * Manually resets the 12h limit for Ultra users.
 */
export function reset12hLimitManually(userTier: string = 'Kostenlos'): boolean {
  if (!canReset12hLimitManually(userTier)) return false;
  const state = getUsageState();
  const now = Date.now();
  state.cycleStart12h = now;
  state.usedPercent12h = 0;
  state.totalComputeUnits12h = 0;
  state.lastManualReset = now;
  save12hState(state);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('saphir_usage_updated', { detail: state }));
  }
  return true;
}

/**
 * Checks if a model is allowed for a given subscription tier:
 * - Kostenlos: Fast (unlimited) + everyday a little bit of Basic
 * - Plus: Fast, Basic, Extreme
 * - Pro: Fast, Basic, Extreme, Ultra, Shark, Octopus
 * - Ultra: Fast, Basic, Extreme, Ultra, Octopus, Nautilus
 */
export function isModelAllowedForTier(modelId: string, userTier: SubscriptionTier | string = 'Kostenlos'): boolean {
  const m = (modelId || '').toLowerCase();
  const tier = (userTier || 'Kostenlos').toLowerCase();

  // Lite, Fast, Gemma 2B, Gemma 9B, and standard Dandelious models are free for everyone
  if (
    m.includes('lite') || 
    m.includes('fast') || 
    m.includes('2b') || 
    m.includes('9b') || 
    m.includes('basic') || 
    m.includes('dandelious') ||
    m === ''
  ) {
    return true;
  }

  // Free Tier (Kostenlos): Only Lite & Fast & Basic
  if (tier === 'kostenlos') {
    return true; // Fallback smoothly to standard model instead of blocking
  }

  // Plus Tier: Unlocks Dandelious Plus (+ Lite, Fast)
  if (tier === 'plus' || tier === 'expanded') {
    return true;
  }

  // Pro Tier: Unlocks Dandelious Pro (+ Plus, Lite, Fast, Shark, Octopus)
  if (tier === 'pro' || tier === 'unlimited') {
    return true;
  }

  // Ultra Tier: Unlocks everything + Thinking + higher limits
  if (tier === 'ultra' || tier === 'extreme') {
    return true;
  }

  return true;
}

/**
 * Returns whether a given model is allowed under current usage.
 * If 100% is reached, 'Fast' and 'Basic' are allowed.
 */
export function isModelAllowedUnderLimit(modelId: string): boolean {
  if (!is12hLimitReached()) return true;
  const m = (modelId || '').toLowerCase();
  return m.includes('lite') || m.includes('fast') || m.includes('basic') || m.includes('2b') || m.includes('9b');
}

/**
 * Formats the 12h reset string (e.g. "Wird um 17:07 Uhr zurückgesetzt (in 14 Std. 20 Min.)")
 */
export function get12hResetInfo(): { resetDate: Date; formattedTime: string; remainingText: string } {
  const state = getUsageState();
  const resetMs = state.cycleStart12h + CYCLE_12H_MS;
  const resetDate = new Date(resetMs);
  
  const remainingMs = Math.max(0, resetMs - Date.now());
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  const timeStr = resetDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const remainingStr = hours > 0 ? `in ${hours} Std. ${minutes} Min.` : `in ${minutes} Min.`;

  return {
    resetDate,
    formattedTime: timeStr,
    remainingText: remainingStr
  };
}

/**
 * Formats the weekly reset string (e.g. "Wird am Montag, 1. September um 14:00 zurückgesetzt")
 */
export function getWeeklyResetInfo(): { resetDate: Date; formattedText: string } {
  const state = getUsageState();
  const resetMs = state.cycleStartWeekly + CYCLE_WEEKLY_MS;
  const resetDate = new Date(resetMs);

  const formattedDate = resetDate.toLocaleDateString('de-DE', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  const timeStr = resetDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  return {
    resetDate,
    formattedText: `Wird am ${formattedDate} um ${timeStr} zurückgesetzt`
  };
}
