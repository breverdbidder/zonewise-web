import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { http, HttpResponse } from 'msw'
import { server, setTestEnv, MOCK_BCPAO_FEATURE, MOCK_BCPAO_EMPTY } from '../helpers/setup'

// ─── Env setup ────────────────────────────────────────────────────────────────
setTestEnv()

// ─── Supabase mock ────────────────────────────────────────────────────────────
const mockFrom = vi.fn()
const mockSupabaseClient = {
  from: mockFrom,
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  auth: { getUser: vi.fn() },
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}))

// Default from() — returns zoning_assignments row
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
mockFrom.mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: mockMaybeSingle,
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
})

// Import route after mocks
const { GET } = await import('@/app/api/zoning-report/route')

// ─── MSW lifecycle ────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  })
})

// ─── Helper ───────────────────────────────────────────────────────────────────
function makeGet(parcelId?: string): NextRequest {
  const url = parcelId
    ? `http://localhost:3000/api/zoning-report?parcelId=${encodeURIComponent(parcelId)}`
    : 'http://localhost:3000/api/zoning-report'
  return new NextRequest(url)
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('GET /api/zoning-report', () => {
  it('happy path: valid parcelId returns 200 with report data', async () => {
    // BCPAO returns a feature; zoning_assignments table returns null (fallback used)
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const req = makeGet('24-36-14-54-00002.0-0004.00')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.parcel_id).toBeDefined()
  })

  it("invalid parcelId: SQL injection string → 400", async () => {
    const req = makeGet("'; DROP TABLE zoning_assignments--")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('missing parcel: NONEXISTENT999 not in BCPAO GIS → 404', async () => {
    server.use(
      http.get('https://gis.brevardfl.gov/gissrv/rest/services/Base_Map/Parcel_New_WKID2881/MapServer/5/query', () => {
        return HttpResponse.json(MOCK_BCPAO_EMPTY)
      })
    )
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const req = makeGet('NONEXISTENT999')
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it('special chars: parcelId with illegal characters → 400', async () => {
    const req = makeGet('PARCEL/WITH/SLASHES')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('empty parcelId: "" → 400', async () => {
    const req = makeGet('')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
