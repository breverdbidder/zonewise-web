import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { http, HttpResponse } from 'msw'
import { server, setTestEnv } from '../../helpers/setup'

// ─── Env setup ────────────────────────────────────────────────────────────────
setTestEnv()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } })),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } })),
  createBrowserClient: vi.fn(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } })),
}))

// Import route after mocks
const { GET } = await import('@/app/api/explorer/zoning-overlay/route')

// ─── MSW lifecycle ────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

// ─── Helper ───────────────────────────────────────────────────────────────────
// Valid bbox within Brevard County
const VALID_BBOX = { west: -80.75, south: 28.1, east: -80.65, north: 28.2 }

function makeGet(params: Record<string, string | number> = {}): NextRequest {
  const sp = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  )
  return new NextRequest(`http://localhost:3000/api/explorer/zoning-overlay?${sp}`)
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('GET /api/explorer/zoning-overlay', () => {
  it('happy path: valid bbox returns 200 with GeoJSON FeatureCollection', async () => {
    const req = makeGet(VALID_BBOX)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.type).toBe('FeatureCollection')
    expect(Array.isArray(body.features)).toBe(true)
  })

  it('features enriched with zone_category and zone_color', async () => {
    const req = makeGet(VALID_BBOX)
    const res = await GET(req)
    const body = await res.json()
    if (body.features.length > 0) {
      const feat = body.features[0]
      expect(feat.properties.zone_category).toBeDefined()
      expect(feat.properties.zone_color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('missing bbox params → 400', async () => {
    const req = makeGet({})
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('non-finite bbox values (NaN) → 400', async () => {
    const req = makeGet({ west: 'abc', south: 'xyz', east: 'foo', north: 'bar' })
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('BCPAO fetch error → returns empty FeatureCollection (graceful degradation)', async () => {
    server.use(
      http.get('https://gis.brevardfl.gov/gissrv/rest/services/Planning_Development/Zoning_WKID2881/MapServer/0/query', () => {
        return HttpResponse.error()
      })
    )
    const req = makeGet(VALID_BBOX)
    const res = await GET(req)
    // Route catches errors and returns empty GeoJSON at 200
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.type).toBe('FeatureCollection')
    expect(body.features).toEqual([])
  })
})
