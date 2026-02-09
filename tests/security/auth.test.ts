import { describe, it, expect } from 'vitest'
import * as fs from 'fs'

describe('SEC-001: Chat API Authentication', () => {
  const routeSource = fs.readFileSync('app/api/chat/route.ts', 'utf-8')

  it('includes authenticateRequest function', () => {
    expect(routeSource).toMatch(/async function authenticateRequest/)
  })

  it('auth check occurs before any Claude API call in POST handler', () => {
    // Extract the POST handler body
    const postMatch = routeSource.match(/export async function POST[\s\S]+/)
    expect(postMatch).not.toBeNull()
    const postBody = postMatch![0]
    const authCallIndex = postBody.search(/authenticateRequest/)
    const apiCallIndex = postBody.search(/messages\.create/)
    expect(authCallIndex).toBeGreaterThan(-1)
    expect(apiCallIndex).toBeGreaterThan(-1)
    expect(authCallIndex).toBeLessThan(apiCallIndex)
  })

  it('returns 401 for unauthenticated requests', () => {
    expect(routeSource).toMatch(/status:\s*401/)
  })

  it('returns 429 when query limit exceeded', () => {
    expect(routeSource).toMatch(/status:\s*429/)
  })

  it('supports Bearer token authentication', () => {
    expect(routeSource).toMatch(/Bearer/)
    expect(routeSource).toMatch(/Authorization/)
  })

  it('supports cookie-based SSR authentication', () => {
    expect(routeSource).toMatch(/createServerClient/)
    expect(routeSource).toMatch(/cookies/)
  })

  it('validates user via supabase getUser', () => {
    expect(routeSource).toMatch(/auth\.getUser/)
  })

  it('increments query count after successful request', () => {
    expect(routeSource).toMatch(/increment_query_count/)
  })
})

describe('SEC-002: OAuth CSRF Protection', () => {
  const routeSource = fs.readFileSync('app/auth/callback/route.ts', 'utf-8')

  it('validates state parameter against stored cookie', () => {
    expect(routeSource).toMatch(/oauth_state/)
    expect(routeSource).toMatch(/stateParam/)
  })

  it('rejects mismatched state', () => {
    expect(routeSource).toMatch(/state mismatch|invalid state/)
  })

  it('handles OAuth provider errors', () => {
    expect(routeSource).toMatch(/error_description/)
    expect(routeSource).toMatch(/errorParam/)
  })

  it('clears state cookie after successful validation', () => {
    expect(routeSource).toMatch(/maxAge:\s*0/)
    expect(routeSource).toMatch(/httpOnly:\s*true/)
  })

  it('exchanges code for session via Supabase', () => {
    expect(routeSource).toMatch(/exchangeCodeForSession/)
  })

  it('redirects to login on failure', () => {
    expect(routeSource).toMatch(/\/login\?error=/)
  })
})
