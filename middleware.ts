import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { type NextRequest, NextResponse } from 'next/server'
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

// Protected routes — require Clerk authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/auctions(.*)',
  '/feasibility(.*)',
  '/chat(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl

  // SEC-009: Rate limit auth endpoints — 5/min per IP
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
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
    const { userId } = await auth()
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

  // Protect dashboard routes — redirect unauthenticated users to sign-in
  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
