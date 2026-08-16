import { NextRequest, NextResponse } from 'next/server'
import { SECURITY_HEADERS } from '@/lib/validation'
import { checkFreeRunCap, recordFreeRun, usageCapBody, isLeadGated, leadRequiredBody } from '@/lib/gate/server'

/**
 * Proxies /api/floorplan/* to the ZoneWise Floor Plan Worker.
 *
 * zonewise.ai's DNS is not proxied through Cloudflare (it points straight at
 * Vercel), so the Worker's own `routes` entry for zonewise.ai/api/floorplan/*
 * can never fire. This route handler is the actual path in production.
 */
const WORKER_BASE = 'https://zonewise-floorplan.brevardbidderai.workers.dev/floorplan'

async function proxy(request: NextRequest, path: string[]) {
  const target = `${WORKER_BASE}/${path.join('/')}${request.nextUrl.search}`
  const action = path[0]

  // PLG gates — only the two full-tool-run/export actions this issue names.
  // Everything else (get, list, etc.) stays ungated.
  if (request.method === 'POST' && action === 'compile' && checkFreeRunCap(request).blocked) {
    return NextResponse.json(usageCapBody(), { status: 402, headers: SECURITY_HEADERS })
  }
  if (request.method === 'POST' && action === 'save' && !isLeadGated(request)) {
    return NextResponse.json(leadRequiredBody(), { status: 402, headers: SECURITY_HEADERS })
  }

  try {
    const response = await fetch(target, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
    })

    const body = await response.text()
    const result = new NextResponse(body, {
      status: response.status,
      headers: {
        ...SECURITY_HEADERS,
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    })
    if (request.method === 'POST' && action === 'compile' && response.ok) {
      recordFreeRun(request, result)
    }
    return result
  } catch (error) {
    console.error('[api/floorplan] proxy error:', error)
    return NextResponse.json(
      { ok: false, error: 'Floor plan service unreachable' },
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
