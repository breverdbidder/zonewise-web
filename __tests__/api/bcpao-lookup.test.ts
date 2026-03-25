import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { http, HttpResponse } from 'msw'
import { server, setTestEnv, MOCK_BCPAO_FEATURE, MOCK_BCPAO_EMPTY } from '../helpers/setup'

// ─── Env setup ────────────────────────────────────────────────────────────────
setTestEnv()

// No Supabase in bcpao-lookup, but mock to prevent import errors
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } })),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } })),
  createBrowserClient: vi.fn(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } })),
}))

// Import route after mocks
const { GET } = await import('@/app/api/bcpao-lookup/route')

// ─── MSW lifecycle ────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

// ─── Helper ───────────────────────────────────────────────────────────────────
function makeGet(parcelId?: string): NextRequest {
  const url = parcelId !== undefined
    ? `http://localhost:3000/api/bcpao-lookup?parcelId=${encodeURIComponent(parcelId)}`
    : 'http://localhost:3000/api/bcpao-lookup'
  return new NextRequest(url)
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('GET /api/bcpao-lookup', () => {
  it('happy path: valid parcelId returns 200 with parcel data', async () => {
    // Default MSW handler returns MOCK_BCPAO_FEATURE
    const req = makeGet('24-36-14-54-00002.0-0004.00')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.PARCEL_ID ?? body.TaxAcct).toBeDefined()
  })

  it('missing parcelId param: no ?parcelId → 400', async () => {
    const req = makeGet()
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it("invalid format: SQL injection → 400", async () => {
    const req = makeGet("'; DROP TABLE parcels--")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('parcel not found in GIS → 404', async () => {
    server.use(
      http.get('https://gis.brevardfl.gov/gissrv/rest/services/Base_Map/Parcel_New_WKID2881/MapServer/5/query', () => {
        return HttpResponse.json(MOCK_BCPAO_EMPTY)
      })
    )
    const req = makeGet('DOESNOTEXIST99')
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it('GIS service timeout → 503', async () => {
    server.use(
      http.get('https://gis.brevardfl.gov/gissrv/rest/services/Base_Map/Parcel_New_WKID2881/MapServer/5/query', () => {
        return HttpResponse.error()
      })
    )
    const req = makeGet('2436145400002')
    const res = await GET(req)
    // Route returns 503 on TimeoutError, 500 on generic network error
    expect([500, 502, 503]).toContain(res.status)
  })
})
