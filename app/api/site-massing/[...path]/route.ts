import { NextRequest, NextResponse } from 'next/server'
import { SECURITY_HEADERS } from '@/lib/validation'

/**
 * Proxies /api/site-massing/* to the ZoneWise Floor Plan Worker's
 * /site-massing/* routes (site massing + CAD/DXF export lives in the same
 * Worker as the floorplan tool — see workers/zonewise-floorplan in
 * cli-anything-biddeed).
 *
 * Same reasoning as app/api/floorplan/[...path]/route.ts: zonewise.ai's DNS
 * is not proxied through Cloudflare (it points straight at Vercel), so the
 * Worker's own `routes` entry can never fire — this route handler is the
 * actual path in production, kept as a Next.js route (not a next.config
 * rewrite) so it stays Clerk-auth-compatible.
 */
const WORKER_BASE = 'https://zonewise-floorplan.brevardbidderai.workers.dev/site-massing'

async function proxy(request: NextRequest, path: string[]) {
  const target = `${WORKER_BASE}/${path.join('/')}${request.nextUrl.search}`

  try {
    const response = await fetch(target, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
    })

    const body = await response.text()
    return new NextResponse(body, {
      status: response.status,
      headers: {
        ...SECURITY_HEADERS,
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch (error) {
    console.error('[api/site-massing] proxy error:', error)
    return NextResponse.json(
      { ok: false, error: 'Site massing service unreachable' },
      { status: 502, headers: SECURITY_HEADERS }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxy(request, path)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  return proxy(request, path)
}
