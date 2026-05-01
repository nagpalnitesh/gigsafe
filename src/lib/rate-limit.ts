/**
 * Simple in-memory rate limiter.
 * Per-IP and per-wallet limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check rate limit. Returns { allowed, remaining, resetIn }.
 * @param key - unique key (IP, wallet, or composite)
 * @param limit - max requests per window
 * @param windowMs - time window in ms
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetIn: entry.resetAt - now };
}

/**
 * Get client IP from request headers.
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Preset rate limiters
export const limits = {
  /** General API: 60 req/min per IP */
  api: (ip: string) => rateLimit(`api:${ip}`, 60, 60_000),
  /** Write operations: 20 req/min per IP */
  write: (ip: string) => rateLimit(`write:${ip}`, 20, 60_000),
  /** AI/expensive: 5 req/min per IP */
  ai: (ip: string) => rateLimit(`ai:${ip}`, 5, 60_000),
  /** Message sending: 30 req/min per IP */
  message: (ip: string) => rateLimit(`msg:${ip}`, 30, 60_000),
};
