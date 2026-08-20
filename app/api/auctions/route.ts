import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Next's App Router caches fetch() by default and supabase-js goes
      // through fetch, so RPC results get frozen in the Data Cache. A county
      // normalisation shipped inside the SQL function kept serving the
      // pre-fix numbers indefinitely - through `export const dynamic =
      // 'force-dynamic'` AND through a cache-busting query string, because
      // neither of those touches the Data Cache. Auction data is live; it is
      // never cached at the data layer. Edge caching stays with Cache-Control.
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) =>
          fetch(url, { ...init, cache: 'no-store' }),
      },
    }
  )
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// Only the columns the auction surfaces actually render. select('*') pulled
// all 130+ columns of multi_county_auctions - roughly 3.4 KB per row, so the
// default 200-row page shipped about 690 KB of JSON to the browser on every
// single load. That payload, not the query, was what made the page feel slow.
const SELECT_COLUMNS = [
  'id', 'county', 'case_number', 'property_address', 'city', 'zip',
  'auction_date', 'auction_time', 'sale_type', 'auction_type', 'auction_status',
  'plaintiff', 'opening_bid', 'judgment_amount', 'assessed_value',
  'market_value', 'property_type', 'beds', 'baths', 'sqft',
  'living_area_sqft', 'lot_size', 'year_built', 'parcel_id', 'owner_name',
  'latitude', 'longitude', 'photo_url', 'auction_url', 'source_url',
  'cert_number', 'redemption_deadline', 'sold_amount', 'winning_bidder',
].join(',')

/**
 * The auction components were written against a schema this table does not
 * have. AuctionMap plots on centroid_lat/centroid_lng; AuctionTable and
 * AuctionSpreadsheet render just_value, total_living_area, is_vacant_land.
 * NONE of those are columns on multi_county_auctions, so the map had been
 * plotting zero pins and those columns had been blank on every row since the
 * surface shipped - silently, because Supabase returns `any` and TypeScript
 * validated the phantom type in types/auctions.ts instead of the real table.
 *
 * Rather than rewrite four components, the real columns are mapped onto the
 * names they already read. dor_use_code and zoning_category have no source on
 * this table at all and stay undefined: blank is honest, invented is not.
 */
function mapRow(r: Record<string, unknown>) {
  const g = (k: string) => (r[k] ?? null) as number | string | null
  return {
    ...r,
    auction_type: r.auction_type ?? r.sale_type,
    just_value: g('market_value') ?? g('assessed_value'),
    total_living_area: g('living_area_sqft') ?? g('sqft'),
    centroid_lat: g('latitude'),
    centroid_lng: g('longitude'),
    is_vacant_land: r.property_type === 'vacant_land',
  }
}

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
    .select(SELECT_COLUMNS, { count: 'exact' })
    .order('auction_date', { ascending, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (county) query = query.ilike('county', county)
  if (type) query = query.eq('auction_type', type)
  if (saleType) query = query.eq('sale_type', saleType)
  if (from) query = query.gte('auction_date', from)
  if (to) query = query.lte('auction_date', to)
  if (upcoming && !from) {
    query = query.gte('auction_date', new Date().toISOString().slice(0, 10))
    // Match auctions_summary_ssot()'s definition of "upcoming", not just the
    // date. Date-only, this filter returned 2,530 rows while the header (fed
    // by the SSOT RPC) said 1,889 -- the extra 641 were redeemed, cancelled
    // and completed auctions rendered in the list as if still biddable
    // (verified live 2026-08-20: upcoming 1,335 + scheduled 554 = 1,889).
    // Two numbers for the same word on one screen is exactly the divergence
    // the shared-RPC architecture exists to prevent.
    query = query.in('auction_status', ['upcoming', 'scheduled'])
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
      data: (data || []).map((r) => mapRow(r as Record<string, unknown>)),
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
