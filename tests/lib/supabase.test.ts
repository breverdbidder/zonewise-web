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

describe('Supabase server client (Clerk auth, no SSR cookies)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('createServiceClient uses service role key', async () => {
    const mockCreateClient = vi.fn().mockReturnValue({ from: vi.fn() })
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: mockCreateClient,
    }))

    const { createServiceClient } = await import('@/lib/supabase/server')
    createServiceClient()

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-service-key',
      expect.objectContaining({ auth: expect.objectContaining({ persistSession: false }) })
    )
  })

  it('createServiceClient throws when service role key is missing', async () => {
    vi.resetModules()
    const original = process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: vi.fn().mockReturnValue({}),
    }))

    const { createServiceClient } = await import('@/lib/supabase/server')
    expect(() => createServiceClient()).toThrow('SUPABASE_SERVICE_ROLE_KEY is required')

    process.env.SUPABASE_SERVICE_ROLE_KEY = original
  })

  it('createAnonClient uses anon key', async () => {
    const mockCreateClient = vi.fn().mockReturnValue({ from: vi.fn() })
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: mockCreateClient,
    }))

    const { createAnonClient } = await import('@/lib/supabase/server')
    createAnonClient()

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.any(Object)
    )
  })

  it('legacy createClient returns an anon client (backwards compat)', async () => {
    const mockClient = { from: vi.fn(), auth: {} }
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: vi.fn().mockReturnValue(mockClient),
    }))

    const { createClient } = await import('@/lib/supabase/server')
    const client = await createClient()
    expect(client).toBeDefined()
  })
})
