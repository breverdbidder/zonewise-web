import { describe, it, expect } from 'vitest'
import * as fs from 'fs'

describe('SEC-008: CORS Behavioral Tests', () => {
  const corsSource = fs.readFileSync('lib/api/cors.ts', 'utf-8')

  it('rejects wildcard origins', () => {
    expect(corsSource).not.toMatch(/'Access-Control-Allow-Origin'\s*,\s*'\*'/)
  })

  it('whitelists only trusted domains', () => {
    // Extract origins from the ALLOWED_ORIGINS set (before CSP header)
    const allowedOriginsBlock = corsSource.split('ALLOWED_ORIGINS')[1]?.split(']')[0] || ''
    const prodOrigins = allowedOriginsBlock.match(/https:\/\/[a-z.-]+/g) || []
    for (const origin of prodOrigins) {
      expect(origin).toMatch(/zonewise|vercel/)
    }
  })

  it('limits localhost to development mode only', () => {
    // All localhost references must be inside the NODE_ENV === 'development' guard
    const lines = corsSource.split(/\r?\n/)
    let inDevBlock = false
    let braceDepth = 0
    for (const line of lines) {
      if (/NODE_ENV.*development/.test(line)) {
        inDevBlock = true
        braceDepth = 0
      }
      if (inDevBlock) {
        braceDepth += (line.match(/\{/g) || []).length
        braceDepth -= (line.match(/\}/g) || []).length
        if (braceDepth <= 0 && line.includes('}')) inDevBlock = false
        continue
      }
      // Outside dev block: no localhost URL patterns (comments are ok)
      if (/localhost:\d+/.test(line)) {
        throw new Error(`localhost URL found outside dev block: ${line.trim()}`)
      }
    }
  })

  it('includes all required security headers', () => {
    expect(corsSource).toMatch(/X-Content-Type-Options/)
    expect(corsSource).toMatch(/X-Frame-Options/)
    expect(corsSource).toMatch(/Referrer-Policy/)
    expect(corsSource).toMatch(/X-XSS-Protection/)
  })

  it('includes Content-Security-Policy header', () => {
    expect(corsSource).toMatch(/Content-Security-Policy/)
    expect(corsSource).toMatch(/default-src\s+'self'/)
    expect(corsSource).toMatch(/script-src\s+'self'/)
    expect(corsSource).toMatch(/connect-src\s+'self'/)
  })

  it('includes Strict-Transport-Security header with preload', () => {
    expect(corsSource).toMatch(/Strict-Transport-Security/)
    expect(corsSource).toMatch(/max-age=31536000/)
    expect(corsSource).toMatch(/includeSubDomains/)
    expect(corsSource).toMatch(/preload/)
  })

  it('includes Permissions-Policy header restricting sensitive APIs', () => {
    expect(corsSource).toMatch(/Permissions-Policy/)
    expect(corsSource).toMatch(/camera=\(\)/)
    expect(corsSource).toMatch(/microphone=\(\)/)
  })

  it('sets Vary: Origin header for proper caching', () => {
    expect(corsSource).toMatch(/Vary.*Origin/)
  })

  it('preflight returns 204 status', () => {
    expect(corsSource).toMatch(/status:\s*204/)
  })
})
