import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchS5Report, type ServerKeySource } from '@/lib/biddeed-mcp'

const MCA_ID_RE = /^[A-Za-z0-9.-]{1,64}$/

export interface S5TemplateRow {
  section_key: string
  section_label: string
  title: string
  report_field: string | null
  band_color: string | null
  sort_order: number
}

export interface S5ReportPayload {
  selected: boolean
  entitled?: boolean
  mca_id?: string
  template: S5TemplateRow[]
  report: Record<string, unknown> | null
  error?: string
  keySource?: ServerKeySource
  address?: string
}

// Server-side Pro entitlement check - same source of truth as
// app/api/zoning-chat/route.ts: derived from the authenticated Clerk session
// + subscriptions table, never from a client-supplied flag.
async function checkProEntitlement(): Promise<boolean> {
  try {
    const { userId } = await auth()
    if (!userId) return false

    // Comma-separated Clerk user IDs in ADMIN_USER_IDS always pass
    // entitlement, independent of the subscriptions table.
    const adminIds = (process.env.ADMIN_USER_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (adminIds.includes(userId)) return true

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    return !!data
  } catch {
    return false
  }
}

async function loadTemplate(): Promise<S5TemplateRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('v_s5_report_template')
    .select('section_key,section_label,title,report_field,band_color,sort_order')
    .order('sort_order', { ascending: true })
  if (error || !data) return []
  return data as S5TemplateRow[]
}

async function resolveMcaIdFromAddress(address: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('multi_county_auctions')
    .select('id')
    .ilike('property_address', `%${address}%`)
    .limit(1)
    .maybeSingle()
  return data?.id != null ? String(data.id) : null
}

// Shared S5 report payload builder. Extracted from app/api/report/route.ts so
// the /report Server Component can call it in-process: the page previously
// fetched its own /api/report route over HTTP, and on the Cloudflare Worker
// that same-zone subrequest stalls ~19s then fails, rendering
// "Report service unavailable" for every user even while the API returns 200.
export async function getS5ReportPayload(params: {
  mcaId?: string
  address?: string
}): Promise<{ status: number; body: S5ReportPayload }> {
  const rawMcaId = params.mcaId?.trim()
  const rawAddress = params.address?.trim()

  if (!rawMcaId && !rawAddress) {
    return { status: 200, body: { selected: false, template: await loadTemplate(), report: null } }
  }

  let mcaId: string | null = null
  if (rawMcaId) {
    if (!MCA_ID_RE.test(rawMcaId)) {
      return { status: 400, body: { selected: false, template: [], report: null, error: 'Invalid mca_id' } }
    }
    mcaId = rawMcaId
  } else if (rawAddress) {
    if (rawAddress.length < 3 || rawAddress.length > 200) {
      return { status: 400, body: { selected: false, template: [], report: null, error: 'Invalid address' } }
    }
    mcaId = await resolveMcaIdFromAddress(rawAddress)
    if (!mcaId) {
      return {
        status: 404,
        body: { selected: false, template: [], report: null, error: 'No auction found for that address', address: rawAddress },
      }
    }
  }

  const template = await loadTemplate()
  const entitled = await checkProEntitlement()

  // Non-entitled callers never trigger the MCP report fetch - the full S5
  // JSON is simply never produced for this request, not filtered after the
  // fact. Server-derived gate only; no client-supplied flag is trusted.
  if (!entitled) {
    return { status: 200, body: { selected: true, entitled: false, mca_id: mcaId!, template, report: null } }
  }

  const result = await fetchS5Report(mcaId!)
  if (!result.ok) {
    const pending = result.keySource === 'none'
    return {
      status: pending ? 200 : (result.status || 502),
      body: {
        selected: true,
        entitled: true,
        mca_id: mcaId!,
        template,
        report: null,
        error: pending ? 'report data pending - server key not configured' : result.error,
        keySource: result.keySource,
      },
    }
  }

  return {
    status: 200,
    body: {
      selected: true,
      entitled: true,
      mca_id: mcaId!,
      template,
      report: result.data.report,
      keySource: result.keySource,
    },
  }
}
