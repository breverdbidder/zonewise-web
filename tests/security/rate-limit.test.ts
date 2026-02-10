import { describe, it, expect } from 'vitest'
import { checkRateLimit, RATE_LIMITS, type RateLimitConfig } from '../../lib/rate-limit'

const testConfig: RateLimitConfig = { limit: 3, windowSeconds: 60 }

describe('SEC-009: Rate Limiter Behavioral Tests', () => {
  it('allows requests within limit', () => {
    const id = `test-allow-${Date.now()}`
    const r1 = checkRateLimit(id, testConfig)
    const r2 = checkRateLimit(id, testConfig)
    const r3 = checkRateLimit(id, testConfig)

    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)
    expect(r3.allowed).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests exceeding limit', () => {
    const id = `test-block-${Date.now()}`
    checkRateLimit(id, testConfig)
    checkRateLimit(id, testConfig)
    checkRateLimit(id, testConfig)
    const r4 = checkRateLimit(id, testConfig)

    expect(r4.allowed).toBe(false)
    expect(r4.remaining).toBe(0)
  })

  it('provides resetAt timestamp in the future', () => {
    const id = `test-reset-${Date.now()}`
    const result = checkRateLimit(id, testConfig)
    expect(result.resetAt).toBeGreaterThan(Date.now())
  })

  it('isolates different identifiers', () => {
    const id1 = `test-iso1-${Date.now()}`
    const id2 = `test-iso2-${Date.now()}`

    // Exhaust id1
    checkRateLimit(id1, testConfig)
    checkRateLimit(id1, testConfig)
    checkRateLimit(id1, testConfig)
    const r4 = checkRateLimit(id1, testConfig)

    // id2 should still be allowed
    const r2 = checkRateLimit(id2, testConfig)

    expect(r4.allowed).toBe(false)
    expect(r2.allowed).toBe(true)
  })

  it('enforces auth limit of 10 per minute', () => {
    expect(RATE_LIMITS.auth.limit).toBe(10)
    expect(RATE_LIMITS.auth.windowSeconds).toBe(60)
  })

  it('enforces API limit of 30 per minute', () => {
    expect(RATE_LIMITS.api.limit).toBe(30)
    expect(RATE_LIMITS.api.windowSeconds).toBe(60)
  })
})
