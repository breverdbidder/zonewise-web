export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { SECURITY_HEADERS } from '@/lib/validation'
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

// ─── Server-side Pro entitlement check ─────────────────────
// Same source of truth as app/api/zoning-chat/route.ts checkProEntitlement —
// derived from the authenticated Clerk session + subscriptions table, never
// from a client-supplied flag.
async function checkProEntitlement(): Promise<boolean> {
  try {
    const { userId } = await auth()
    if (!userId) return false

    // ADMIN OVERRIDE (added Aug 14 2026): comma-separated Clerk user IDs in
    // ADMIN_USER_IDS always pass entitlement, independent of the subscriptions
    // table. Safe/no-op until the env var is set — the `subscriptions` table
    // currently has zero active rows for anyone, including the founder, so
    // without this override nobody (not even an admin account) can ever see
    // a live report. Set ADMIN_USER_IDS in Vercel project env vars to your
    // Clerk user ID (Clerk Dashboard → Users → your account → User ID,
    // format user_xxxxxxxxxxxx) to unlock founder/demo access immediately.
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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const rawMcaId = searchParams.get('mca_id')?.trim()
  const rawAddress = searchParams.get('address')?.trim()

  if (!rawMcaId && !rawAddress) {
    // No identifying param — the page renders a picker for this, and the API
    // mirrors that: an empty, non-error "nothing selected yet" response.
    return NextResponse.json(
      { selected: false, template: await loadTemplate() },
      { headers: SECURITY_HEADERS }
    )
  }

  let mcaId: string | null = null
  if (rawMcaId) {
    if (!MCA_ID_RE.test(rawMcaId)) {
      return NextResponse.json({ error: 'Invalid mca_id' }, { status: 400, headers: SECURITY_HEADERS })
    }
    mcaId = rawMcaId
  } else if (rawAddress) {
    if (rawAddress.length < 3 || rawAddress.length > 200) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400, headers: SECURITY_HEADERS })
    }
    mcaId = await resolveMcaIdFromAddress(rawAddress)
    if (!mcaId) {
      return NextResponse.json(
        { error: 'No auction found for that address', address: rawAddress },
        { status: 404, headers: SECURITY_HEADERS }
      )
    }
  }

  const template = await loadTemplate()
  const entitled = await checkProEntitlement()

  // Non-entitled callers never trigger the MCP report fetch — the full S5
  // JSON is simply never produced for this request, not filtered after the
  // fact. Server-derived gate only; no client-supplied flag is trusted.
  if (!entitled) {
    return NextResponse.json(
      { selected: true, entitled: false, mca_id: mcaId, template, report: null },
      { headers: SECURITY_HEADERS }
    )
  }

  const result = await fetchS5Report(mcaId!)
  if (!result.ok) {
    const pending = result.keySource === 'none'
    return NextResponse.json(
      {
        selected: true,
        entitled: true,
        mca_id: mcaId,
        template,
        report: null,
        error: pending
          ? 'report data pending — server key not configured'
          : result.error,
        keySource: result.keySource satisfies ServerKeySource,
      },
      { status: pending ? 200 : (result.status || 502), headers: SECURITY_HEADERS }
    )
  }

  return NextResponse.json(
    {
      selected: true,
      entitled: true,
      mca_id: mcaId,
      template,
      report: result.data.report,
      keySource: result.keySource satisfies ServerKeySource,
    },
    { headers: SECURITY_HEADERS }
  )
}
