import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";

// --- Architektur: Token Bucket für KI Rate Limiting ---
// 1. Sliding Window: 1 Stunde (in ms)
// 2. Token-Verbrauch: Input + Output Tokens (Schätzung vor dem Request, Korrektur danach)
// 3. User Tier: Dynamisches Limit pro Rolle

const WINDOW_SIZE_MS = 60 * 60 * 1000; // 1 Stunde

// Konfiguration der stündlichen Token-Limits pro Tier
export const TIER_TOKEN_LIMITS: Record<string, number> = {
  'Kostenlos': 150_000,
  'Plus': 500_000,
  'Pro': 2_000_000,
  'Ultra': 10_000_000,
  'Expanded': 500_000,   // Alias
  'Extreme': 10_000_000, // Alias
  'Unlimited': 20_000_000 
};

// Interface für den Bucket-State (Redis-Simulation)
interface Bucket {
  tokens: number;
  lastRefill: number;
}

// In-Memory Store für State (Simulation von Redis für diese Architektur)
// In einer echten, skalierten Umgebung würde hier ein ioredis Client stehen.
const tokenStore = new Map<string, Bucket>();

/**
 * Token Bucket Algorithmus für Token-Verbrauch
 */
export async function consumeTokens(userId: string, tier: string, estimatedTokens: number) {
  const maxTokens = TIER_TOKEN_LIMITS[tier] || TIER_TOKEN_LIMITS['Kostenlos'];
  const refillRate = maxTokens / WINDOW_SIZE_MS; // Refill pro Millisekunde

  const now = Date.now();
  let bucket = tokenStore.get(userId);

  if (!bucket) {
    bucket = { tokens: maxTokens, lastRefill: now };
  }

  // Tokens auffüllen basierend auf verstrichener Zeit
  const timePassed = now - bucket.lastRefill;
  const refilledTokens = timePassed * refillRate;
  
  // Cap bei Max-Tokens
  bucket.tokens = Math.min(maxTokens, bucket.tokens + refilledTokens);
  bucket.lastRefill = now;

  if (bucket.tokens >= estimatedTokens) {
    // Genug Tokens vorhanden -> Abbuchen
    bucket.tokens -= estimatedTokens;
    tokenStore.set(userId, bucket);
    
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      retryAfter: 0
    };
  } else {
    // Nicht genug Tokens -> Berechnen wann genug verfügbar sind
    const missingTokens = estimatedTokens - bucket.tokens;
    const retryAfterMs = missingTokens / refillRate;
    
    tokenStore.set(userId, bucket);
    
    return {
      allowed: false,
      remaining: Math.floor(bucket.tokens),
      retryAfter: Math.ceil(retryAfterMs / 1000) // Sekunden für Retry-After Header
    };
  }
}

/**
 * Erstattet überschüssig geschätzte Tokens oder zieht mehr ab, 
 * sobald die tatsächliche Anzahl (aus den Model Metrics) bekannt ist.
 */
export async function adjustTokens(userId: string, tier: string, tokensToAdjust: number) {
  const maxTokens = TIER_TOKEN_LIMITS[tier] || TIER_TOKEN_LIMITS['Kostenlos'];
  const bucket = tokenStore.get(userId);
  
  if (bucket) {
    bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdjust);
    tokenStore.set(userId, bucket);
  }
}

/**
 * Express Middleware zum Vorab-Prüfen des Token-Limits
 */
export function aiRateLimitMiddleware(estimateTokens: (req: any) => number) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // If custom API key is supplied by the user, bypass server-side token rate limiting entirely
    const customKey = req.body?.customApiKey;
    if (customKey && typeof customKey === 'string' && customKey.trim().length > 5) {
      return next();
    }

    // IP Fallback für unauthentifizierte User
    const userId = req.user?.uid || req.ip || 'anonymous';
    const tier = req.body?.userTier || 'Kostenlos';
    const tokensNeeded = estimateTokens(req);

    const result = await consumeTokens(userId, tier, tokensNeeded);
    
    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter.toString());
      const errMsg = `Dein KI-Limit ist vorübergehend erschöpft. Bitte warte ${result.retryAfter} Sekunden.`;
      
      // Für SSE-Streaming Endpunkte (Chat) einen Stream-Error zurückgeben
      if (req.path.includes('/chat')) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
        return res.end();
      }
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: errMsg,
        retryAfter: result.retryAfter
      });
    }

    // Speichere Limit-Daten am Request für eine spätere Korrektur nach Abschluss der Generierung
    (req as any).rateLimit = { userId, tier, estimatedTokens: tokensNeeded };
    next();
  };
}

/**
 * Schätzt die benötigten Tokens basierend auf dem Prompt-Inhalt
 */
export function estimateTokensFromRequest(req: any): number {
  const messages = req.body?.messages || [];
  const prompt = req.body?.prompt || '';
  
  let totalTextLength = prompt.length;
  if (Array.isArray(messages)) {
    messages.forEach((m: any) => {
      totalTextLength += (m.content || m.text || '').length;
    });
  }

  // Sehr grobe Schätzung: 1 Token = ~4 Zeichen Input
  const estimatedInputTokens = Math.ceil(totalTextLength / 4);
  
  // Pauschaler Output-Token Puffer (je nach Model, hier z.B. 800)
  const estimatedOutputTokens = 800; 

  return estimatedInputTokens + estimatedOutputTokens;
}
