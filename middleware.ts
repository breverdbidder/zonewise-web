import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const CLERK_ENABLED = Boolean(process.env.CLERK_SECRET_KEY)

const isPublicRoute = createRouteMatcher([
  // API routes — public data endpoints
  '/api/health(.*)',
  '/api/stats(.*)',
  '/api/kpis(.*)',
  '/api/auctions(.*)',
  '/api/bcpao-lookup(.*)',
  '/api/bcpao-photo(.*)',
  '/api/explorer(.*)',
  '/api/parcels(.*)',
  '/api/zoning-chat(.*)',
  '/api/zoning-report(.*)',
  '/api/owner-intel(.*)',
  '/api/chat-v2(.*)',
  '/api/reports(.*)',
  // Stripe webhooks MUST be public (Stripe sends without auth)
  '/api/stripe/webhook(.*)',
  // Pages — public access
  '/',
  '/chat(.*)',
  '/dashboard(.*)',
  '/pricing(.*)',
  '/help(.*)',
  '/docs(.*)',
  '/explore(.*)',
  '/explorer(.*)',
  '/massing(.*)',
  '/auth(.*)',
  '/foreclosures(.*)',
  '/conquest(.*)',
  '/competitors(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/report(.*)',
  '/auctions(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/disclaimer(.*)',
  // SEO files — belt & suspenders (matcher also excludes txt|xml below)
  '/robots.txt',
  '/sitemap.xml',
  '/robots(.*)',
  '/sitemap(.*)',
])

function rateLimitMiddleware(req: NextRequest): NextResponse | undefined {
  const pathname = req.nextUrl.pathname
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const clientIp = forwarded?.split(',')[0].trim() || realIp || 'unknown'

  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname.startsWith('/api/auth')) {
    const result = checkRateLimit(`auth:${clientIp}`, RATE_LIMITS.auth)
    if (!result.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
      })
    }
  } else if (pathname.startsWith('/api/')) {
    const result = checkRateLimit(`api:${clientIp}`, RATE_LIMITS.api)
    if (!result.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
      })
    }
  }
}

// When Clerk is not configured, use a passthrough middleware with rate limiting only
function passthroughMiddleware(req: NextRequest) {
  return rateLimitMiddleware(req) || NextResponse.next()
}

export default CLERK_ENABLED
  ? clerkMiddleware(async (auth, req) => {
      const rateLimitResponse = rateLimitMiddleware(req)
      if (rateLimitResponse) return rateLimitResponse

      if (!isPublicRoute(req)) {
        await auth.protect()
      }
    })
  : passthroughMiddleware

export const config = {
  matcher: [
    // EG14 P3 FIX: added txt|xml so /robots.txt and /sitemap.xml bypass middleware entirely
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)',
    '/(api|trpc)(.*)',
  ],
}
