import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { SECURITY_HEADERS } from '@/lib/validation'

const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=300, stale-while-revalidate=3600',
  ...SECURITY_HEADERS,
} as const

/**
 * GET /api/owner-intel/[identifier]
 *
 * Accepts case_number, parcel_id, or defendant name (URL-encoded).
 * Returns OSINT classification from auction_owner_intel table.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  const { identifier } = await params
  const decoded = decodeURIComponent(identifier).trim()

  if (!decoded) {
    return NextResponse.json(
      { error: 'identifier is required' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  try {
    const supabase = createServiceClient()

    // Strategy 1: Direct match on case_number
    let { data, error } = await supabase
      .from('auction_owner_intel')
      .select('*')
      .eq('case_number', decoded)
      .limit(1)
      .maybeSingle()

    // Strategy 2: Resolve parcel_id → case_number via multi_county_auctions
    if (!data && !error) {
      const { data: auction } = await supabase
        .from('multi_county_auctions')
        .select('case_number')
        .eq('parcel_id', decoded)
        .limit(1)
        .maybeSingle()

      if (auction?.case_number) {
        const result = await supabase
          .from('auction_owner_intel')
          .select('*')
          .eq('case_number', auction.case_number)
          .limit(1)
          .maybeSingle()
        data = result.data
        error = result.error
      }
    }

    // Strategy 3: Fuzzy match on defendant name
    if (!data && !error) {
      const { data: nameMatch, error: nameErr } = await supabase
        .from('auction_owner_intel')
        .select('*')
        .ilike('defendant', `%${decoded}%`)
        .limit(1)
        .maybeSingle()
      data = nameMatch
      error = nameErr
    }

    if (error) {
      console.error('[owner-intel] Supabase error:', error.message)
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500, headers: SECURITY_HEADERS }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No OSINT match found', identifier: decoded },
        { status: 404, headers: CACHE_HEADERS }
      )
    }

    // Parse parcels_owned from JSONB if string
    let parcels_owned = data.parcels_owned
    if (typeof parcels_owned === 'string') {
      try { parcels_owned = JSON.parse(parcels_owned) } catch { parcels_owned = [] }
    }

    const response = {
      case_number: data.case_number,
      defendant: data.defendant,
      county: data.county ?? 'BREVARD',
      classification: data.classification ?? 'UNKNOWN',
      confidence_score: data.confidence_score ?? 0,
      match_count: data.match_count ?? 0,
      total_portfolio_value: data.total_portfolio_value ?? 0,
      is_homestead: data.is_homestead ?? false,
      is_out_of_state: data.is_out_of_state ?? false,
      is_corporate: data.is_corporate ?? false,
      owner_state: data.owner_state ?? '',
      days_since_last_sale: data.days_since_last_sale ?? null,
      auction_date: data.auction_date ?? '',
      judgment_amount: data.judgment_amount ?? null,
      plaintiff: data.plaintiff ?? '',
      parcels_owned: Array.isArray(parcels_owned)
        ? parcels_owned.map((p: Record<string, unknown>) => ({
            pin: p.pin ?? '',
            addr: p.addr ?? p.address ?? '',
            city: p.city ?? '',
            val: p.val ?? p.value ?? p.val_market ?? 0,
            luse: p.luse ?? p.luse_code ?? '',
            sqft: p.sqft ?? p.living_area ?? null,
            year: p.year ?? p.year_built ?? null,
          }))
        : [],
    }

    return NextResponse.json(response, { status: 200, headers: CACHE_HEADERS })
  } catch (err) {
    console.error('[owner-intel] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: SECURITY_HEADERS }
    )
  }
}
