import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * SEC-009: Get client IP from request headers (works behind proxies).
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // SEC-009: Rate limit auth endpoints (login, signup, callback)
  if (pathname.startsWith('/auth/') || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    const ip = getClientIp(request)
    const result = checkRateLimit(`auth:${ip}`, RATE_LIMITS.auth)

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMITS.auth.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  // SEC-009: Rate limit API endpoints
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request)
    const result = checkRateLimit(`api:${ip}`, RATE_LIMITS.api)

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMITS.api.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
