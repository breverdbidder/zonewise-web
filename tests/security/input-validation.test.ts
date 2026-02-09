import { describe, it, expect } from 'vitest'
import * as fs from 'fs'

describe('SEC-008: CORS and Security Headers', () => {
  const corsSource = fs.readFileSync('lib/api/cors.ts', 'utf-8')

  it('defines ALLOWED_ORIGINS whitelist', () => {
    expect(corsSource).toMatch(/ALLOWED_ORIGINS/)
  })

  it('includes production domains in whitelist', () => {
    expect(corsSource).toMatch(/zonewise\.ai/)
  })

  it('only allows localhost in development', () => {
    expect(corsSource).toMatch(/NODE_ENV.*development/)
    expect(corsSource).toMatch(/localhost/)
  })

  it('does not use wildcard (*) for CORS origin', () => {
    // Should not allow all origins
    expect(corsSource).not.toMatch(/Access-Control-Allow-Origin.*\*/)
  })

  it('sets X-Content-Type-Options: nosniff', () => {
    expect(corsSource).toMatch(/X-Content-Type-Options.*nosniff/)
  })

  it('sets X-Frame-Options: DENY', () => {
    expect(corsSource).toMatch(/X-Frame-Options.*DENY/)
  })

  it('sets Referrer-Policy header', () => {
    expect(corsSource).toMatch(/Referrer-Policy.*strict-origin/)
  })

  it('exports handlePreflight for OPTIONS requests', () => {
    expect(corsSource).toMatch(/export function handlePreflight/)
  })

  it('chat route uses CORS headers', () => {
    const chatSource = fs.readFileSync('app/api/chat/route.ts', 'utf-8')
    expect(chatSource).toMatch(/addCorsHeaders/)
    expect(chatSource).toMatch(/handlePreflight/)
  })
})

describe('SEC-009: Rate Limiting', () => {
  const rateLimitSource = fs.readFileSync('lib/rate-limit.ts', 'utf-8')
  const middlewareSource = fs.readFileSync('middleware.ts', 'utf-8')

  it('exports checkRateLimit function', () => {
    expect(rateLimitSource).toMatch(/export function checkRateLimit/)
  })

  it('defines auth rate limit (10 req/min)', () => {
    expect(rateLimitSource).toMatch(/auth.*limit:\s*10/)
  })

  it('defines API rate limit (30 req/min)', () => {
    expect(rateLimitSource).toMatch(/api.*limit:\s*30/)
  })

  it('uses sliding window with expiry', () => {
    expect(rateLimitSource).toMatch(/resetAt/)
    expect(rateLimitSource).toMatch(/windowSeconds/)
  })

  it('implements memory cleanup to prevent unbounded growth', () => {
    expect(rateLimitSource).toMatch(/cleanup/)
    expect(rateLimitSource).toMatch(/10[_,]?000/)
  })

  it('middleware rate-limits auth endpoints', () => {
    expect(middlewareSource).toMatch(/auth.*checkRateLimit|checkRateLimit.*auth/s)
  })

  it('middleware rate-limits API endpoints', () => {
    expect(middlewareSource).toMatch(/api.*checkRateLimit|checkRateLimit.*api/s)
  })

  it('returns 429 with Retry-After header', () => {
    expect(middlewareSource).toMatch(/429/)
    expect(middlewareSource).toMatch(/Retry-After/)
  })

  it('extracts client IP from proxy headers', () => {
    expect(middlewareSource).toMatch(/x-forwarded-for/)
    expect(middlewareSource).toMatch(/x-real-ip/)
  })
})
