import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MAX_RANGE_DAYS = 400

function monthBounds(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
}

/**
 * Per-day typed auction counts for a date range - the calendar's data source.
 *
 * The calendar must fetch COUNTS, not rows. PropertyOnion renders a month of
 * 100+ properties as five day badges; pulling every row to the browser to
 * count them client-side is why this surface never worked. One row per day
 * per type, capped by the range, regardless of how many auctions it covers.
 *
 * Backed by public.auctions_calendar_counts - the same SSOT function
 * biddeed.ai calls, so per-day numbers cannot diverge between the two sites.
 *
 * GET /api/auctions/calendar?from=&to=&county=&sale_type=
 *   -> { from, to, county, sale_type, days: [{ date, foreclosure_count,
 *        tax_deed_count, other_count, total }], totals: {...} }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const [defFrom, defTo] = monthBounds()

  const from = searchParams.get('from') || defFrom
  const to = searchParams.get('to') || defTo
  const county = searchParams.get('county') || null
  const saleType = searchParams.get('sale_type') || null

  for (const [name, value] of [['from', from], ['to', to]] as const) {
    if (!ISO_DATE.test(value)) {
      return NextResponse.json(
        { error: `invalid ${name}: expected YYYY-MM-DD` },
        { status: 400 }
      )
    }
  }
  if (from > to) {
    return NextResponse.json({ error: 'from must be <= to' }, { status: 400 })
  }
  const spanDays =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000
  if (spanDays > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `range too large: ${spanDays} days (max ${MAX_RANGE_DAYS})` },
      { status: 400 }
    )
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('auctions_calendar_counts', {
    p_from: from,
    p_to: to,
    p_county: county,
    p_sale_type: saleType,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  type Row = {
    auction_date: string
    foreclosure_count: number
    tax_deed_count: number
    other_count: number
    total: number
  }
  const rows = (data || []) as Row[]

  const days = rows.map((r) => ({
    date: r.auction_date,
    foreclosure_count: Number(r.foreclosure_count),
    tax_deed_count: Number(r.tax_deed_count),
    other_count: Number(r.other_count),
    total: Number(r.total),
  }))

  const totals = days.reduce(
    (acc, d) => ({
      foreclosure_count: acc.foreclosure_count + d.foreclosure_count,
      tax_deed_count: acc.tax_deed_count + d.tax_deed_count,
      other_count: acc.other_count + d.other_count,
      total: acc.total + d.total,
      days_with_auctions: acc.days_with_auctions + 1,
    }),
    {
      foreclosure_count: 0,
      tax_deed_count: 0,
      other_count: 0,
      total: 0,
      days_with_auctions: 0,
    }
  )

  return NextResponse.json(
    { from, to, county, sale_type: saleType, days, totals },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  )
}
