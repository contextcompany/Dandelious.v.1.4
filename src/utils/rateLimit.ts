import { SubscriptionTier } from '../types';

export const NO_KEY_FREE_LIMIT = 5000; // Generous capacity for seamless conversations

// Multipliers: Plus = 2x (500), Pro = 4x (1000), Ultra = 6x (2000) based on base 250 msgs / 2h
export const TIER_RATE_LIMITS: Record<SubscriptionTier, number> = {
  Kostenlos: 250,
  Plus: 500,      // 2x Multiplier
  Expanded: 500,  // Alias for Plus
  Pro: 1000,      // 4x Multiplier
  Ultra: 2000,    // 6x Multiplier
  Extreme: 2000,  // Alias for Ultra
  Unlimited: 2000, // Alias for Ultra
};

export const TIER_MULTIPLIERS: Record<SubscriptionTier, number> = {
  Kostenlos: 1,
  Plus: 2,
  Expanded: 2,
  Pro: 4,
  Ultra: 6,
  Extreme: 6,
  Unlimited: 6,
};

export function getTierMultiplier(tier: SubscriptionTier = 'Kostenlos'): number {
  return TIER_MULTIPLIERS[tier] || 1;
}

export function getTierLimit(tier: SubscriptionTier = 'Kostenlos'): number {
  return TIER_RATE_LIMITS[tier] || 50;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  count: number;
  retryAfterSeconds: number;
  isNoKeyExceeded?: boolean;
}

const STORAGE_TIMESTAMPS_KEY = 'vanguard_msg_timestamps_v1';
const STORAGE_NO_KEY_COUNT_KEY = 'vanguard_no_key_used_count_v1';
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function getNoKeyCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_NO_KEY_COUNT_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch (e) {
    return 0;
  }
}

export function checkRateLimit(
  userTier: SubscriptionTier = 'Kostenlos',
  hasCustomApiKey: boolean = false
): RateLimitCheckResult {
  // Always allow seamless chatting without lockouts
  return {
    allowed: true,
    limit: 5000,
    count: 0,
    retryAfterSeconds: 0,
    isNoKeyExceeded: false,
  };
}

export function recordMessageSent(hasCustomApiKey: boolean = false, userTier: SubscriptionTier = 'Kostenlos'): void {
  const hasActiveSubscription = userTier && userTier !== 'Kostenlos';

  if (!hasCustomApiKey && !hasActiveSubscription) {
    const current = getNoKeyCount();
    localStorage.setItem(STORAGE_NO_KEY_COUNT_KEY, (current + 1).toString());
    return;
  }

  const now = Date.now();
  let timestamps: number[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_TIMESTAMPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        timestamps = parsed;
      }
    }
  } catch (e) {
    timestamps = [];
  }

  timestamps = timestamps.filter(ts => typeof ts === 'number' && now - ts < TWO_HOURS_MS);
  timestamps.push(now);
  localStorage.setItem(STORAGE_TIMESTAMPS_KEY, JSON.stringify(timestamps));
}
