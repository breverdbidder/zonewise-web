import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const isPublicRoute = createRouteMatcher([
  '/api/health(.*)',
  '/api/zoning-chat(.*)',
  '/api/chat-v2(.*)',
  '/api/bcpao-lookup(.*)',
  '/api/bcpao-photo(.*)',
  '/api/zoning-report(.*)',
  '/report(.*)',
  '/api/auctions(.*)',
  '/',
  '/chat(.*)',
  '/dashboard(.*)',
  '/pricing(.*)',
  '/help(.*)',
  '/docs(.*)',
  '/explorer(.*)',
  '/massing(.*)',
  '/conquest(.*)',
  '/competitors(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname

  // SEC-009: Extract client IP from proxy headers
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const clientIp = forwarded?.split(',')[0].trim() || realIp || 'unknown'

  // SEC-009: Rate-limit auth endpoints (5 req/min)
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname.startsWith('/api/auth')) {
    const result = checkRateLimit(`auth:${clientIp}`, RATE_LIMITS.auth)
    if (!result.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        },
      })
    }
  } else if (pathname.startsWith('/api/')) {
    // SEC-009: Rate-limit API endpoints (30 req/min)
    const result = checkRateLimit(`api:${clientIp}`, RATE_LIMITS.api)
    if (!result.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        },
      })
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
