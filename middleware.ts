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

/**
 * Extract user ID from Authorization header (Bearer token JWT).
 * Returns null if no valid auth header present.
 */
function getUserIdFromAuth(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const token = authHeader.slice(7)
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub || null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // SEC-009: Rate limit auth endpoints (login, signup, callback) — 5/min per IP
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

  // SEC-009: Rate limit API endpoints — 30/min per IP
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

    // SEC-009: Per-user rate limit on authenticated API routes — 20/min per user
    const userId = getUserIdFromAuth(request)
    if (userId) {
      const userResult = checkRateLimit(`user:${userId}`, RATE_LIMITS.userApi)
      if (!userResult.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((userResult.resetAt - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(RATE_LIMITS.userApi.limit),
              'X-RateLimit-Remaining': '0',
            },
          }
        )
      }
    }
  }

  const { response, user } = await updateSession(request)
  const origin = request.nextUrl.origin

  // Protected routes — require authentication
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/auctions') ||
    pathname.startsWith('/feasibility') ||
    pathname.startsWith('/chat')

  if (isProtected && !user) {
    const redirectUrl = new URL('/login', origin)
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Auth-only pages — redirect logged-in users to dashboard
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password'

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)',
  ],
}
