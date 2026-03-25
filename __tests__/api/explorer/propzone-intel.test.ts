import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { server, setTestEnv } from '../../helpers/setup'

// ─── Env setup ────────────────────────────────────────────────────────────────
setTestEnv()

// ─── Supabase mock ────────────────────────────────────────────────────────────
const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
const mockFrom = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: mockMaybeSingle,
    }),
  }),
})

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

// Import route after mocks
const { GET } = await import('@/app/api/explorer/propzone-intel/route')

// ─── MSW lifecycle ────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
  // Re-wire from() after clearAllMocks
  mockMaybeSingle.mockResolvedValue({ data: null, error: null })
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      }),
    }),
  })
  mockSupabaseClient.from = mockFrom
})

// ─── Helper ───────────────────────────────────────────────────────────────────
function makeGet(parcelId?: string): NextRequest {
  const url = parcelId !== undefined
    ? `http://localhost:3000/api/explorer/propzone-intel?parcelId=${encodeURIComponent(parcelId)}`
    : 'http://localhost:3000/api/explorer/propzone-intel'
  return new NextRequest(url)
}

const MOCK_PROPZONE_ROW = {
  parcel_id: '24-36-14-54-00002.0-0004.00',
  address: '123 MAIN ST MELBOURNE FL 32901',
  zoning_code: 'BU-1',
  permitted_uses: ['retail', 'office'],
  front_setback_ft: 15,
  side_setback_ft: 10,
  rear_setback_ft: 15,
  max_height_ft: 45,
  far: 2.0,
  density: null,
  lot_coverage_pct: 70,
  scraped_at: '2026-03-01T00:00:00Z',
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('GET /api/explorer/propzone-intel', () => {
  it('happy path: valid parcelId with data returns 200 with PropZone intel', async () => {
    mockMaybeSingle.mockResolvedValue({ data: MOCK_PROPZONE_ROW, error: null })
    const req = makeGet('24-36-14-54-00002.0-0004.00')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.parcel_id).toBe('24-36-14-54-00002.0-0004.00')
    expect(body.zoning_code).toBe('BU-1')
  })

  it('empty table / parcel not found: returns 200 with { found: false }', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const req = makeGet('24-36-14-54-00002.0-0004.00')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.found).toBe(false)
    expect(body.data).toBeNull()
  })

  it('invalid parcelId → 400', async () => {
    const req = makeGet("'; DROP TABLE propzone_intel--")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('Supabase error → graceful 200 with { found: false }', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'relation does not exist' } })
    const req = makeGet('2436145400002')
    const res = await GET(req)
    // Route catches DB errors and returns empty rather than 500
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.found).toBe(false)
  })

  it('missing parcelId param → 400', async () => {
    const req = makeGet()
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})
