import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { SECURITY_HEADERS } from '@/lib/validation'

/**
 * ZoneWise MCP — Streamable HTTP transport (stateless JSON-RPC 2.0).
 * Deployed at: https://mcp.zonewise.ai/api/mcp
 * Auth: Authorization: Bearer <ZONEWISE_MCP_SECRET>
 *
 * Phase 1 (issue #19091): wraps only genuinely-working existing backend
 * logic — zoning-report, parcels, and the live zonewise-floorplan Worker.
 * No feasibility-study or takeoff tools here; those need real backing
 * routes that do not exist yet (separate follow-on issue).
 *
 * v1 auth is a single shared secret, not a per-customer key system — there
 * is no zw_customers/API-key table in this repo yet. TODO: replace with a
 * real per-customer key table once ZoneWise MCP has paying customers.
 */

export const runtime = 'nodejs'

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://zonewise.ai'
const WORKER_BASE = 'https://zonewise-floorplan.brevardbidderai.workers.dev/floorplan'
const PROTOCOL_VERSION = '2025-06-18'
const SERVER_NAME = 'zonewise-mcp'
const SERVER_VERSION = '1.0.0'

const TOOLS = [
  {
    name: 'lookup_zoning',
    description:
      'Look up zoning district, setbacks, buildable envelope (FAR/height/coverage/density), and permitted uses for a Brevard County parcel by parcel ID.',
    inputSchema: {
      type: 'object',
      properties: {
        parcel_id: { type: 'string', description: 'BCPAO parcel ID or tax account number, e.g. "27 3701-50-7-4"' },
      },
      required: ['parcel_id'],
    },
  },
  {
    name: 'lookup_parcel',
    description:
      'Look up parcel detail for a Brevard County parcel by parcel ID: owner/address, assessed value, boundary geometry, and BidDeed auction status.',
    inputSchema: {
      type: 'object',
      properties: {
        parcel_id: { type: 'string', description: 'BCPAO parcel ID' },
      },
      required: ['parcel_id'],
    },
  },
  {
    name: 'compile_floor_plan',
    description:
      'Compile ArchLang floor-plan source text into an SVG drawing plus room/summary metadata. Does not persist — use save_floor_plan to store the result.',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          description: 'ArchLang plan source, e.g. plan "Name" { units mm; grid 50; paper A1 landscape; scale 1:100; north up; wall exterior thickness 200 { (0,0) (8000,0) (8000,6000) (0,6000) close }; room at (0,0) size 8000x6000 label "Room 1" }',
        },
        parcel: {
          type: 'object',
          description: 'Optional lot constraints (lot_width_ft, lot_depth_ft, setbacks_*_ft, max_lot_coverage_pct, septic_bedroom_cap, utility_tier) to zoning-check the plan against',
        },
      },
      required: ['source'],
    },
  },
  {
    name: 'save_floor_plan',
    description: 'Compile and persist an ArchLang floor plan for a parcel under a named plan slot (creates a new version).',
    inputSchema: {
      type: 'object',
      properties: {
        parcel_id: { type: 'string' },
        plan_name: { type: 'string', description: 'Defaults to "default"' },
        source: { type: 'string', description: 'ArchLang plan source' },
        created_by: { type: 'string', description: 'Defaults to "mcp-client"' },
        parcel: { type: 'object', description: 'Optional lot constraints, see compile_floor_plan' },
      },
      required: ['parcel_id', 'source'],
    },
  },
  {
    name: 'get_floor_plan',
    description: 'Retrieve the current saved ArchLang floor plan (source + compiled SVG + summary) for a parcel/plan-name slot.',
    inputSchema: {
      type: 'object',
      properties: {
        parcel_id: { type: 'string' },
        plan_name: { type: 'string', description: 'Defaults to "default"' },
      },
      required: ['parcel_id'],
    },
  },
]

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function unauthorized() {
  return NextResponse.json(
    {
      error: 'Authorization required',
      hint: 'Set header: Authorization: Bearer <ZoneWise MCP shared secret>',
      get_key:
        'ZoneWise MCP v1 uses a single shared secret, not a self-serve customer key system yet — contact Everest Capital / BidDeed.AI admin. Tracked in breverdbidder/cli-anything-biddeed#19091.',
    },
    { status: 401, headers: SECURITY_HEADERS }
  )
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const data = await res.json().catch(() => ({ error: 'Non-JSON upstream response' }))
  return { ...data, _upstream_status: res.status }
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({ error: 'Non-JSON upstream response' }))
  return { ...data, _upstream_status: res.status }
}

function toolResult(data: Record<string, unknown>) {
  const status = typeof data._upstream_status === 'number' ? data._upstream_status : 200
  return {
    content: [{ type: 'text', text: JSON.stringify(data) }],
    isError: status >= 400,
  }
}

async function callTool(name: string, args: Record<string, any>) {
  switch (name) {
    case 'lookup_zoning': {
      if (!args?.parcel_id) throw new Error('parcel_id is required')
      return toolResult(await fetchJson(`${APP_BASE}/api/zoning-report?parcelId=${encodeURIComponent(args.parcel_id)}`))
    }
    case 'lookup_parcel': {
      if (!args?.parcel_id) throw new Error('parcel_id is required')
      return toolResult(await fetchJson(`${APP_BASE}/api/parcels/${encodeURIComponent(args.parcel_id)}`))
    }
    case 'compile_floor_plan': {
      if (!args?.source) throw new Error('source is required')
      const body: Record<string, unknown> = { source: args.source }
      if (args.parcel) body.parcel = args.parcel
      return toolResult(await postJson(`${WORKER_BASE}/compile`, body))
    }
    case 'save_floor_plan': {
      if (!args?.parcel_id || !args?.source) throw new Error('parcel_id and source are required')
      const body: Record<string, unknown> = {
        parcel_id: args.parcel_id,
        plan_name: args.plan_name || 'default',
        source: args.source,
        created_by: args.created_by || 'mcp-client',
      }
      if (args.parcel) body.parcel = args.parcel
      return toolResult(await postJson(`${WORKER_BASE}/save`, body))
    }
    case 'get_floor_plan': {
      if (!args?.parcel_id) throw new Error('parcel_id is required')
      const qs = new URLSearchParams({ parcel_id: args.parcel_id, plan_name: args.plan_name || 'default' })
      return toolResult(await fetchJson(`${WORKER_BASE}/get?${qs.toString()}`))
    }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

async function requireAuth(req: NextRequest): Promise<NextResponse | null> {
  const authHeader = req.headers.get('authorization') || ''
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  const expected = process.env.ZONEWISE_MCP_SECRET

  if (!expected || !provided || !secretsMatch(provided, expected)) {
    return unauthorized()
  }
  return null
}

export async function GET(req: NextRequest) {
  const authError = await requireAuth(req)
  if (authError) return authError

  return NextResponse.json(
    { status: 'ok', service: SERVER_NAME, version: SERVER_VERSION, tools: TOOLS.length, endpoint: '/api/mcp' },
    { headers: SECURITY_HEADERS }
  )
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth(req)
  if (authError) return authError

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  const { id, method, params } = body || {}

  // Notifications carry no id and expect no body in response.
  if (method === 'notifications/initialized') {
    return new NextResponse(null, { status: 202, headers: SECURITY_HEADERS })
  }

  try {
    switch (method) {
      case 'initialize':
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: PROTOCOL_VERSION,
              capabilities: { tools: {} },
              serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
            },
          },
          { headers: SECURITY_HEADERS }
        )

      case 'tools/list':
        return NextResponse.json({ jsonrpc: '2.0', id, result: { tools: TOOLS } }, { headers: SECURITY_HEADERS })

      case 'tools/call': {
        const result = await callTool(params?.name, params?.arguments || {})
        return NextResponse.json({ jsonrpc: '2.0', id, result }, { headers: SECURITY_HEADERS })
      }

      default:
        return NextResponse.json(
          { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } },
          { status: 404, headers: SECURITY_HEADERS }
        )
    }
  } catch (err: any) {
    return NextResponse.json(
      { jsonrpc: '2.0', id, error: { code: -32603, message: err?.message || 'Internal error' } },
      { status: 500, headers: SECURITY_HEADERS }
    )
  }
}
