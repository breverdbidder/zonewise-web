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

  it('uses Clerk for authentication (not Supabase auth)', () => {
    expect(routeSource).toMatch(/auth.*from.*@clerk\/nextjs\/server|from.*@clerk\/nextjs\/server.*auth/)
    expect(routeSource).toMatch(/await auth\(\)/)
  })

  it('extracts userId from Clerk auth', () => {
    expect(routeSource).toMatch(/userId/)
    expect(routeSource).toMatch(/auth\(\)/)
  })

  it('validates user via Clerk userId (not Supabase getUser)', () => {
    expect(routeSource).toMatch(/userId/)
    expect(routeSource).not.toMatch(/auth\.getUser/)
  })

  it('increments query count after successful request', () => {
    expect(routeSource).toMatch(/increment_query_count/)
  })
})

describe('SEC-002: Auth Callback Route', () => {
  const routeSource = fs.readFileSync('app/auth/callback/route.ts', 'utf-8')

  it('exports a GET handler', () => {
    expect(routeSource).toMatch(/export async function GET/)
  })

  it('redirects to dashboard (Clerk handles OAuth)', () => {
    expect(routeSource).toMatch(/redirect.*dashboard|NextResponse\.redirect/)
  })

  it('handles auth callback without raw Supabase OAuth', () => {
    // Clerk manages OAuth — the callback just redirects
    expect(routeSource).toMatch(/NextResponse/)
  })
})
