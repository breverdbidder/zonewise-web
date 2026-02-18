import { describe, it, expect, vi, beforeEach } from 'vitest'

// Set env before imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

describe('Supabase browser client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('createBrowserClient is called with correct env vars', async () => {
    const mockCreateBrowserClient = vi.fn().mockReturnValue({ auth: {} })
    vi.doMock('@supabase/ssr', () => ({
      createBrowserClient: mockCreateBrowserClient,
    }))

    const { createClient } = await import('@/lib/supabase/client')
    createClient()

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    )
  })

  it('returns a client object', async () => {
    const mockClient = { auth: { getUser: vi.fn() }, from: vi.fn() }
    vi.doMock('@supabase/ssr', () => ({
      createBrowserClient: vi.fn().mockReturnValue(mockClient),
    }))

    const { createClient } = await import('@/lib/supabase/client')
    const client = createClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })
})

describe('Supabase server client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('createServerClient is called with anon key (not service role)', async () => {
    const mockCreateServerClient = vi.fn().mockReturnValue({ auth: { getUser: vi.fn() } })
    const mockCookieStore = {
      get: vi.fn(),
      set: vi.fn(),
    }
    vi.doMock('@supabase/ssr', () => ({
      createServerClient: mockCreateServerClient,
    }))
    vi.doMock('next/headers', () => ({
      cookies: vi.fn().mockResolvedValue(mockCookieStore),
    }))

    const { createClient } = await import('@/lib/supabase/server')
    await createClient()

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.any(Object),
      })
    )
  })

  it('server client uses cookie-based auth', async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: 'session-token' }),
      set: vi.fn(),
    }
    vi.doMock('next/headers', () => ({
      cookies: vi.fn().mockResolvedValue(mockCookieStore),
    }))

    let capturedCookies: any
    vi.doMock('@supabase/ssr', () => ({
      createServerClient: vi.fn().mockImplementation((_url: string, _key: string, opts: any) => {
        capturedCookies = opts.cookies
        return { auth: { getUser: vi.fn() } }
      }),
    }))

    const { createClient } = await import('@/lib/supabase/server')
    await createClient()

    // The cookies object should have get/set/remove methods
    expect(capturedCookies).toBeDefined()
    expect(typeof capturedCookies.get).toBe('function')
    expect(typeof capturedCookies.set).toBe('function')
    expect(typeof capturedCookies.remove).toBe('function')
  })
})
