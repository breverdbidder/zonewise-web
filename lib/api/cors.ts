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

  return response
}

/**
 * Handle preflight OPTIONS request.
 */
export function handlePreflight(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return addCorsHeaders(request, response)
}
