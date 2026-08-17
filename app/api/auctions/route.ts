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

/**
 * Auction browse endpoint (AuctionRadar).
 *
 * Aug 17 2026 - three real defects fixed here, all reproduced against production:
 *
 * 1. NO DATE FILTER EXISTED. There was no from/to/upcoming parameter of any
 *    kind, and the default sort was auction_date DESC. So the first page of
 *    every unfiltered request was the FARTHEST-FUTURE rows (2027 Escambia tax
 *    deeds). The calendar view asked for "auctions", got 200 rows dated 2027,
 *    opened on the current month, and rendered empty. The data was never the
 *    problem: 2,709 upcoming rows across 56 counties.
 * 2. has_coords=true filtered on centroid_lat/centroid_lng, which DO NOT EXIST
 *    on multi_county_auctions -> hard 500. The real columns are latitude and
 *    longitude.
 * 3. zoning_category is not a column on this table either -> hard 500 whenever
 *    the zoning dropdown was touched. It is now accepted and ignored, and
 *    reported back in `ignored_filters` so the no-op is visible rather than
 *    silent. Real zoning filtering needs a join to zoning_assignments and is
 *    tracked separately.
 *
 * Aggregate counts do NOT belong here - use /api/auctions/calendar, which is
 * backed by the auctions_calendar_counts SSOT function that biddeed.ai calls
 * too, so the two sites cannot disagree.
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)

  const county = searchParams.get('county')
  const type = searchParams.get('type')
  // sale_type is the reliably-populated column (foreclosure/tax_deed).
  // auction_type is NULL on 12,959 rows, so filtering on it silently drops
  // real auctions. Prefer sale_type in every new caller.
  const saleType = searchParams.get('sale_type')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')
  const hasCoords = searchParams.get('has_coords')
  const caseNumber = searchParams.get('case_number')
  const address = searchParams.get('address')

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const upcoming = searchParams.get('upcoming') === 'true'
  const order = searchParams.get('order')

  for (const [name, value] of [['from', from], ['to', to]] as const) {
    if (value && !ISO_DATE.test(value)) {
      return NextResponse.json(
        { error: `invalid ${name}: expected YYYY-MM-DD` },
        { status: 400 }
      )
    }
  }

  const ignored: string[] = []
  if (searchParams.get('zoning_category')) ignored.push('zoning_category')

  // Ascending is the useful order once a date scope is active ("what is coming
  // up"). Unscoped requests keep the historical DESC default so existing
  // callers do not change behaviour.
  const dateScoped = Boolean(from || to || upcoming)
  const ascending = order ? order === 'asc' : dateScoped

  let query = supabase
    .from('multi_county_auctions')
    .select('*', { count: 'exact' })
    .order('auction_date', { ascending, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (county) query = query.ilike('county', county)
  if (type) query = query.eq('auction_type', type)
  if (saleType) query = query.eq('sale_type', saleType)
  if (from) query = query.gte('auction_date', from)
  if (to) query = query.lte('auction_date', to)
  if (upcoming && !from) {
    query = query.gte('auction_date', new Date().toISOString().slice(0, 10))
  }
  if (hasCoords === 'true') {
    query = query.not('latitude', 'is', null).not('longitude', 'is', null)
  }
  if (caseNumber) query = query.ilike('case_number', `%${caseNumber}%`)
  if (address) query = query.ilike('property_address', `%${address}%`)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      data,
      total: count,
      limit,
      offset,
      ...(ignored.length ? { ignored_filters: ignored } : {}),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
