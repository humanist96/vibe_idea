/**
 * Simple in-memory rate limiter per key (e.g., user ID).
 * Not shared across serverless instances — acceptable for cost protection.
 * For production at scale, consider Redis or Upstash rate limiting.
 */

interface RateLimitEntry {
  readonly count: number
  readonly resetAt: number
}

const store = new Map<string, RateLimitEntry>()
let callsSinceCleanup = 0
const CLEANUP_INTERVAL = 500

interface RateLimitConfig {
  readonly maxRequests: number
  readonly windowMs: number
}

function sweepExpired(): void {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key)
    }
  }
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfterMs: number } {
  callsSinceCleanup++
  if (callsSinceCleanup >= CLEANUP_INTERVAL) {
    callsSinceCleanup = 0
    sweepExpired()
  }

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  store.set(key, { count: entry.count + 1, resetAt: entry.resetAt })
  return { allowed: true, retryAfterMs: 0 }
}

export const AI_SCORE_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000,
}
