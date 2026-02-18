import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock @anthropic-ai/sdk — must use regular function for `new` keyword
vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = function(this: any) {
    this.messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Mocked AI response about zoning.' }],
      }),
    }
  }
  return { default: MockAnthropic }
})

// Mock @supabase/supabase-js
const mockFrom = vi.fn()
const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null })
const mockAuth = {
  getUser: vi.fn(),
}
const mockSupabaseClient = {
  from: mockFrom,
  rpc: mockRpc,
  auth: mockAuth,
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}))

// Mock CORS helper
vi.mock('@/lib/api/cors', () => ({
  addCorsHeaders: vi.fn((_req: any, res: any) => res),
  handlePreflight: vi.fn(() => new Response(null, { status: 204 })),
}))

// Set env vars before importing route
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'

// Import route handler after mocks
const { POST } = await import('@/app/api/chat/route')

function makeRequest(body: any, authHeader?: string): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authHeader) {
    headers['Authorization'] = authHeader
  }
  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: unauthenticated
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'No user' } })

    // Default subscription mock
    mockFrom.mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { query_limit: 100, queries_used: 0 },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'zoning_districts' || table === 'zone_standards' || table === 'permitted_uses' || table === 'ordinances') {
        return {
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      if (table === 'fl_parcels') {
        return {
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      if (table === 'zw_chat_messages') {
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      if (table === 'jurisdictions') {
        return {
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })
  })

  it('returns 401 when unauthenticated', async () => {
    const req = makeRequest({ messages: [{ role: 'user', content: 'hello' }] })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toContain('Authentication required')
  })

  it('returns valid response for authenticated request', async () => {
    // Mock authenticated user
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    })

    const req = makeRequest(
      { messages: [{ role: 'user', content: 'What is R-1 zoning in Melbourne?' }] },
      'Bearer valid-token'
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.response).toBeDefined()
    expect(typeof body.response).toBe('string')
  })

  it('returns 429 when query limit exceeded', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-456', email: 'test@example.com' } },
      error: null,
    })

    // Override subscription to show exhausted
    mockFrom.mockImplementation((table: string) => {
      if (table === 'subscriptions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { query_limit: 10, queries_used: 10 },
                error: null,
              }),
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }
    })

    const req = makeRequest(
      { messages: [{ role: 'user', content: 'test' }] },
      'Bearer valid-token'
    )
    const res = await POST(req)
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toContain('Query limit exceeded')
  })
})
