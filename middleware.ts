import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const CLERK_ENABLED = Boolean(process.env.CLERK_SECRET_KEY)
const IS_PROD = process.env.NODE_ENV === 'production'

const isPublicRoute = createRouteMatcher([
  // API routes — public data endpoints
  '/api/health(.*)',
  '/api/stats(.*)',
  '/api/coverage(.*)', // public: customers verify county coverage BEFORE paying
  '/api/parcels/search(.*)', // public: look up any address before paying
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
  '/api/csp-report(.*)',
  '/api/floorplan(.*)',
  '/api/massing(.*)', // public: 3D Massing Engine has no login gate, same as /massing page itself
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
  '/floorplan(.*)',
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
  // SUMMIT 77c39794 — public parcel/property share cards (viral-loop phase 1)
  '/parcel(.*)',
  '/property(.*)',
    '/card(.*)',
  // SEO files — belt & suspenders (matcher also excludes txt|xml below)
  '/robots.txt',
  '/sitemap.xml',
  '/robots(.*)',
  '/sitemap(.*)',
])

// Rate limit presets per endpoint category (D4 requirements)
const CHECKOUT_LIMIT = { limit: 5, windowSeconds: 60 }
const CSP_REPORT_LIMIT = { limit: 10, windowSeconds: 60 }
const API_LIMIT = { limit: 60, windowSeconds: 60 }

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  return forwarded?.split(',')[0].trim() || realIp || 'unknown'
}

function rateLimitMiddleware(req: NextRequest): NextResponse | undefined {
  const pathname = req.nextUrl.pathname
  const clientIp = getClientIp(req)

  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname.startsWith('/api/auth')) {
    const result = checkRateLimit(`auth:${clientIp}`, RATE_LIMITS.auth)
    if (!result.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
      })
    }
  } else if (pathname.startsWith('/api/stripe/checkout')) {
    const result = checkRateLimit(`checkout:${clientIp}`, CHECKOUT_LIMIT)
    if (!result.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
      })
    }
  } else if (pathname.startsWith('/api/csp-report')) {
    // CSP reports: silently drop over limit (no 429 to avoid noise)
    const result = checkRateLimit(`csp:${clientIp}`, CSP_REPORT_LIMIT)
    if (!result.allowed) {
      return new NextResponse(null, { status: 204 })
    }
  } else if (pathname.startsWith('/api/')) {
    const result = checkRateLimit(`api:${clientIp}`, API_LIMIT)
    if (!result.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
      })
    }
  }
}

/**
 * Generate per-request nonce and build CSP header.
 * Dev mode: Content-Security-Policy-Report-Only
 * Prod mode: Content-Security-Policy (enforcing)
 *
 * script-src additions for ElevenLabs Voice Draftsman widget (Aug 2026):
 * - https://unpkg.com: hosts the @elevenlabs/convai-widget-embed bundle
 * - two sha256 hashes: the widget bootstraps by inserting two small inline
 *   <script> tags itself; strict-dynamic propagation does not cover these on
 *   all browsers, so pin the exact hashes reported by the browser's own CSP
 *   violation errors. NOTE: these hashes are tied to a specific widget
 *   bundle version — if a future ElevenLabs widget update changes its
 *   bootstrap script content, these hashes will need to be regenerated from
 *   fresh CSP violation reports (check /api/csp-report or browser console).
 * connect-src additions: the widget calls ElevenLabs' regional API (US) for
 * agent config and the realtime conversation websocket.
 */
function buildCspHeaders(nonce: string): Record<string, string> {
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://*.clerk.accounts.dev https://clerk.zonewise.ai`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev https://*.clerk.accounts.dev https://*.supabase.co https://www.bcpao.us https://gis.brevardfl.gov https://api.mapbox.com https://*.mapbox.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://*.clerk.accounts.dev wss://*.clerk.accounts.dev https://clerk.zonewise.ai https://api.clerk.com https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://api.stripe.com https://api.us.elevenlabs.io wss://api.us.elevenlabs.io https://api.elevenlabs.io wss://api.elevenlabs.io`,
    `frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `report-uri /api/csp-report`,
    `report-to csp-endpoint`,
  ].join('; ')

  const cspHeaderName = IS_PROD
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only'

  return {
    [cspHeaderName]: csp,
    'Report-To': JSON.stringify({
      group: 'csp-endpoint',
      max_age: 10886400,
      endpoints: [{ url: '/api/csp-report' }],
    }),
  }
}

function applySecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  const cspHeaders = buildCspHeaders(nonce)

  for (const [key, value] of Object.entries(cspHeaders)) {
    response.headers.set(key, value)
  }

  // Additional security headers (complement next.config static headers)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  // microphone=(self): required for the ElevenLabs Voice Draftsman widget on
  // /floorplan to request mic access. Was microphone=() (blocked site-wide),
  // which silently broke voice before the browser even reached agent config.
  response.headers.set('Permissions-Policy', 'geolocation=(self), payment=(self \"https://js.stripe.com\"), camera=(), microphone=(self), interest-cohort=()')

  // Pass nonce to pages via header so they can use it in <script nonce={}>
  response.headers.set('x-nonce', nonce)

  return response
}

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

// When Clerk is not configured, use a passthrough middleware with rate limiting + CSP
function passthroughMiddleware(req: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(req)
  if (rateLimitResponse) return rateLimitResponse

  const nonce = generateNonce()
  const response = NextResponse.next()
  return applySecurityHeaders(response, nonce)
}

export default CLERK_ENABLED
  ? clerkMiddleware(async (auth, req) => {
      const rateLimitResponse = rateLimitMiddleware(req)
      if (rateLimitResponse) return rateLimitResponse

      if (!isPublicRoute(req)) {
        await auth.protect()
      }

      const nonce = generateNonce()
      const response = NextResponse.next()
      return applySecurityHeaders(response, nonce)
    })
  : passthroughMiddleware

export const config = {
  matcher: [
    // EG14 P3 FIX: added txt|xml so /robots.txt and /sitemap.xml bypass middleware entirely
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)',
    '/(api|trpc)(.*)',
  ],
}
