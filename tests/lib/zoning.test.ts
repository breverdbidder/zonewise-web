import { describe, it, expect, vi, beforeEach } from 'vitest'

// Set env before imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'

// Mock Anthropic with regular function (arrow functions can't be constructors)
vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = function(this: any) {
    this.messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Zone R-1 is single-family residential.' }],
      }),
    }
  }
  return { default: MockAnthropic }
})

describe('lib/ai/claude', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('ZONEWISE_SYSTEM_PROMPT includes Florida context', async () => {
    vi.doMock('@anthropic-ai/sdk', () => {
      const M = function(this: any) {
        this.messages = { create: vi.fn() }
      }
      return { default: M }
    })
    const { ZONEWISE_SYSTEM_PROMPT } = await import('@/lib/ai/claude')
    expect(ZONEWISE_SYSTEM_PROMPT).toContain('Florida')
    expect(ZONEWISE_SYSTEM_PROMPT).toContain('zoning')
  })

  it('chat() returns text from Anthropic response', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'R-1 allows single-family homes.' }],
    })
    vi.doMock('@anthropic-ai/sdk', () => {
      const M = function(this: any) {
        this.messages = { create: mockCreate }
      }
      return { default: M }
    })

    const { chat } = await import('@/lib/ai/claude')
    const result = await chat([{ role: 'user', content: 'What is R-1?' }])
    expect(result).toBe('R-1 allows single-family homes.')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
        max_tokens: expect.any(Number),
        system: expect.stringContaining('Florida'),
        messages: [{ role: 'user', content: 'What is R-1?' }],
      })
    )
  })

  it('chat() returns empty string for non-text response blocks', async () => {
    vi.doMock('@anthropic-ai/sdk', () => {
      const M = function(this: any) {
        this.messages = {
          create: vi.fn().mockResolvedValue({
            content: [{ type: 'tool_use', id: 'x', name: 'test', input: {} }],
          }),
        }
      }
      return { default: M }
    })

    const { chat } = await import('@/lib/ai/claude')
    const result = await chat([{ role: 'user', content: 'test' }])
    expect(result).toBe('')
  })
})

describe('CORS helpers', () => {
  it('addCorsHeaders sets security headers', async () => {
    const { addCorsHeaders } = await import('@/lib/api/cors')
    const { NextRequest, NextResponse } = await import('next/server')

    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { Origin: 'https://zonewise.ai' },
    })
    const res = NextResponse.json({ ok: true })
    const result = addCorsHeaders(req, res)

    expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(result.headers.get('X-Frame-Options')).toBe('DENY')
    expect(result.headers.get('Access-Control-Allow-Origin')).toBe('https://zonewise.ai')
  })

  it('rejects unknown origins', async () => {
    vi.resetModules()
    const { addCorsHeaders } = await import('@/lib/api/cors')
    const { NextRequest, NextResponse } = await import('next/server')

    const req = new NextRequest('http://localhost:3000/api/test', {
      headers: { Origin: 'https://evil.example.com' },
    })
    const res = NextResponse.json({ ok: true })
    const result = addCorsHeaders(req, res)

    expect(result.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('handlePreflight returns 204', async () => {
    vi.resetModules()
    const { handlePreflight } = await import('@/lib/api/cors')
    const { NextRequest } = await import('next/server')

    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'OPTIONS',
      headers: { Origin: 'https://zonewise.ai' },
    })
    const result = handlePreflight(req)
    expect(result.status).toBe(204)
  })
})
