import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { http, HttpResponse } from 'msw'
import { server, setTestEnv } from '../helpers/setup'

// ─── Env setup ────────────────────────────────────────────────────────────────
setTestEnv()

// No Supabase in this route, but mock to prevent import errors
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } })),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } })),
  createBrowserClient: vi.fn(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } })),
}))

// Import route after mocks
const { GET } = await import('@/app/api/bcpao-photo/route')

// ─── MSW lifecycle ────────────────────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())

// ─── Helper ───────────────────────────────────────────────────────────────────
const VALID_BCPAO_URL = 'https://www.bcpao.us/img/property/2436145400002.jpg'
const EVIL_URL = 'https://evil.com/photo.jpg'

function makeGet(url?: string): NextRequest {
  const base = 'http://localhost:3000/api/bcpao-photo'
  const req = url !== undefined
    ? `${base}?url=${encodeURIComponent(url)}`
    : base
  return new NextRequest(req)
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('GET /api/bcpao-photo', () => {
  it('happy path: valid BCPAO URL proxies the image', async () => {
    const req = makeGet(VALID_BCPAO_URL)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const ct = res.headers.get('content-type')
    expect(ct).toContain('image/')
  })

  it('non-BCPAO URL is rejected → 403', async () => {
    const req = makeGet(EVIL_URL)
    const res = await GET(req)
    // Route only allows https://www.bcpao.us/ prefix → 403
    expect(res.status).toBe(403)
    const text = await res.text()
    expect(text.toLowerCase()).toContain('bcpao')
  })

  it('missing url param → 400', async () => {
    const req = makeGet()
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('BCPAO server returns non-200 → proxied status', async () => {
    server.use(
      http.get('https://www.bcpao.us/*', () => {
        return new HttpResponse(null, { status: 404 })
      })
    )
    const req = makeGet(VALID_BCPAO_URL)
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it('network error fetching BCPAO image → 502', async () => {
    server.use(
      http.get('https://www.bcpao.us/*', () => {
        return HttpResponse.error()
      })
    )
    const req = makeGet(VALID_BCPAO_URL)
    const res = await GET(req)
    expect(res.status).toBe(502)
  })
})
