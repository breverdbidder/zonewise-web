/**
 * SEC-008: CORS configuration for API routes.
 * Restricts cross-origin requests to known ZoneWise origins.
 */

import { NextResponse, type NextRequest } from 'next/server'

const ALLOWED_ORIGINS = new Set([
  'https://zonewise.ai',
  'https://www.zonewise.ai',
  'https://app.zonewise.ai',
  'https://zonewise-web.vercel.app',
  'https://zonewise-desktop-viewer.vercel.app',
])

// Allow localhost in development
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.add('http://localhost:3000')
  ALLOWED_ORIGINS.add('http://localhost:3001')
  ALLOWED_ORIGINS.add('http://localhost:5173')
  ALLOWED_ORIGINS.add('http://localhost:5174')
}

/**
 * Get the allowed origin for a request, or null if not allowed.
 */
function getAllowedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('Origin')
  if (!origin) return null
  return ALLOWED_ORIGINS.has(origin) ? origin : null
}

/**
 * Add CORS headers to a response.
 */
export function addCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = getAllowedOrigin(request)

  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Vary', 'Origin')
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://api.mapbox.com; style-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https://*.mapbox.com https://*.supabase.co; connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.mapbox.com https://api.stripe.com wss://*.supabase.co; frame-src https://js.stripe.com; font-src 'self' data:"
  )
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self)')

  return response
}

/**
 * Handle preflight OPTIONS request.
 */
export function handlePreflight(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return addCorsHeaders(request, response)
}
