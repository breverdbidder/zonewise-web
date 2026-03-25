import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { server, setTestEnv } from '../helpers/setup'

// ─── Env setup ────────────────────────────────────────────────────────────────
setTestEnv()

// ─── Supabase mock (unused in this route, but required for import resolution) ─
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  })),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } })),
  createBrowserClient: vi.fn(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } })),
}))

// Import route after mocks
const { GET } = await import('@/app/api/zoning-report/pdf/route')

// ─── MSW lifecycle ────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())

// ─── Helper ───────────────────────────────────────────────────────────────────
function makeGet(parcelId?: string): NextRequest {
  const url = parcelId
    ? `http://localhost:3000/api/zoning-report/pdf?parcelId=${encodeURIComponent(parcelId)}`
    : 'http://localhost:3000/api/zoning-report/pdf'
  return new NextRequest(url)
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('GET /api/zoning-report/pdf', () => {
  it('happy path: valid parcelId returns 302 redirect to print URL', async () => {
    const req = makeGet('24-36-14-54-00002.0-0004.00')
    const res = await GET(req)
    // Route redirects to /report?parcel=...&print=1 (302 or 307)
    expect([302, 307]).toContain(res.status)
    const location = res.headers.get('location')
    expect(location).toContain('/report')
    expect(location).toContain('print=1')
  })

  it('invalid parcelId → 400', async () => {
    const req = makeGet("'; DROP TABLE--")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('missing parcelId parameter → 400', async () => {
    const req = makeGet()
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('special chars in parcelId (slashes) → 400', async () => {
    const req = makeGet('PARCEL/WITH/SLASHES')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('valid parcelId: redirect location includes encoded parcel', async () => {
    const parcelId = '2436145400002'
    const req = makeGet(parcelId)
    const res = await GET(req)
    expect([302, 307]).toContain(res.status)
    const location = res.headers.get('location')
    expect(location).toContain(encodeURIComponent(parcelId))
  })
})
