import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { setTestEnv } from '../helpers/setup'

setTestEnv()

const TEMPLATE_ROWS = [
  { section_key: 'subject_identification', section_label: '1', title: 'Subject', report_field: 'cover', band_color: 'navy', sort_order: 10 },
  { section_key: 'auction_outcome', section_label: '18', title: 'Outcome', report_field: 'auction_outcome', band_color: 'green', sort_order: 120 },
]

let subscriptionRow: { status: string } | null = null

const mockFrom = vi.fn((table: string) => {
  if (table === 'v_s5_report_template') {
    return { select: () => ({ order: () => Promise.resolve({ data: TEMPLATE_ROWS, error: null }) }) }
  }
  if (table === 'subscriptions') {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: subscriptionRow, error: subscriptionRow ? null : { message: 'no rows' } }) }),
        }),
      }),
    }
  }
  if (table === 'multi_county_auctions') {
    return {
      select: () => ({
        ilike: () => ({ limit: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 999 }, error: null }) }) }),
      }),
    }
  }
  return { select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }
})

const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'unavailable' } })

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom, rpc: mockRpc })),
}))

let clerkUserId: string | null = null
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: clerkUserId })),
}))

describe('GET /api/report — server-side entitlement gate', () => {
  let GET: typeof import('@/app/api/report/route').GET

  beforeEach(async () => {
    clerkUserId = null
    subscriptionRow = null
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: null, error: { message: 'unavailable' } })
    vi.stubGlobal('fetch', vi.fn())
    // resolveServerKey() caches its result at module scope (by design, to
    // avoid a vault round-trip per request) — reset the module registry per
    // test so that cache doesn't leak between differently-keyed test cases.
    vi.resetModules()
    ;({ GET } = await import('@/app/api/report/route'))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.BIDDEED_MCP_SERVER_KEY
  })

  it('signed-out caller never triggers the MCP report fetch and gets no report data', async () => {
    process.env.BIDDEED_MCP_SERVER_KEY = 'bd_live_should_never_be_used'
    const req = new NextRequest('http://localhost/api/report?mca_id=abc123')
    const res = await GET(req)
    const body = await res.json()

    expect(body.entitled).toBe(false)
    expect(body.report).toBeNull()
    // The negative test: full S5 data must never be produced for a non-entitled
    // caller — proven by asserting the MCP engine (global fetch) was never hit.
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('signed-in caller without an active subscription is treated as non-Pro', async () => {
    clerkUserId = 'user_123'
    subscriptionRow = null // no active row
    const req = new NextRequest('http://localhost/api/report?mca_id=abc123')
    const res = await GET(req)
    const body = await res.json()

    expect(body.entitled).toBe(false)
    expect(body.report).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('entitled Pro caller fetches the full S5 report from the MCP engine with a server-held key', async () => {
    clerkUserId = 'user_pro'
    subscriptionRow = { status: 'active' }
    process.env.BIDDEED_MCP_SERVER_KEY = 'bd_live_test_key'
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ mca_id: 'abc123', report: { cover: { verdict: 'BID' } } }),
    })

    const req = new NextRequest('http://localhost/api/report?mca_id=abc123')
    const res = await GET(req)
    const body = await res.json()

    expect(body.entitled).toBe(true)
    expect(body.report?.cover?.verdict).toBe('BID')
    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(String(url)).toContain('/report/json?mca_id=abc123')
    expect((init?.headers as Record<string, string>)?.Authorization).toBe('Bearer bd_live_test_key')
  })

  it('entitled Pro caller with no server key gets a graceful pending state, never a crash', async () => {
    clerkUserId = 'user_pro'
    subscriptionRow = { status: 'active' }
    // BIDDEED_MCP_SERVER_KEY intentionally unset; vault RPC mocked to fail above.

    const req = new NextRequest('http://localhost/api/report?mca_id=abc123')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.entitled).toBe(true)
    expect(body.report).toBeNull()
    expect(body.error).toMatch(/server key not configured/)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('no mca_id and no address renders the picker state, never crashes', async () => {
    const req = new NextRequest('http://localhost/api/report')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.selected).toBe(false)
    expect(Array.isArray(body.template)).toBe(true)
  })
})
