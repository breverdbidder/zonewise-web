/**
 * SEC-009: In-memory rate limiter using sliding window.
 * Limits requests per IP address to prevent abuse.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 60 seconds
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }

  // Hard cap to prevent unbounded memory growth
  if (store.size > 10_000) {
    const entries = [...store.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)
    for (let i = 0; i < entries.length - 5_000; i++) {
      store.delete(entries[i][0])
    }
  }
}

export interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given identifier (typically IP address).
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  cleanup()

  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const entry = store.get(identifier)

  // No existing entry or window expired — reset
  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: config.limit - 1, resetAt: now + windowMs }
  }

  // Within window — increment
  entry.count++

  if (entry.count > config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

// Preset configurations
export const RATE_LIMITS = {
  /** Auth endpoints: 10 requests per minute */
  auth: { limit: 10, windowSeconds: 60 } as RateLimitConfig,
  /** API endpoints: 30 requests per minute */
  api: { limit: 30, windowSeconds: 60 } as RateLimitConfig,
}
