import { NextResponse } from 'next/server'
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

/**
 * Auction aggregates.
 *
 * Aug 17 2026 - THIS ENDPOINT WAS REPORTING FABRICATED NUMBERS. It selected
 * (county, auction_type, sale_type) for the whole table and tallied the result
 * in JS. PostgREST caps an unbounded select at 1,000 rows, so every breakdown
 * was computed from an arbitrary 1,000-row sample of 108,968: by_county summed
 * to exactly 1000, and the /auctions header read "34 Florida counties" when
 * the upcoming rows alone span 56. Same class of bug as the zoning_codes
 * 5-counties-instead-of-67 truncation.
 *
 * Counting now happens in Postgres via public.auctions_summary_ssot(), the
 * shared SSOT function. Response keys are backwards compatible; upcoming,
 * counties, counties_upcoming, by_sale_type and counties_detail are additive.
 */
export async function GET() {
  const supabase = getSupabase()

  const { data, error } = await supabase.rpc('auctions_summary_ssot')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const s = (data || {}) as Record<string, unknown>

  return NextResponse.json(
    {
      total: s.total ?? 0,
      upcoming: s.upcoming ?? 0,
      counties: s.counties ?? 0,
      counties_upcoming: s.counties_upcoming ?? 0,
      by_county: s.by_county ?? {},
      by_type: s.by_type ?? {},
      by_sale_type: s.by_sale_type ?? {},
      // No zoning dimension exists on multi_county_auctions. Returned empty
      // rather than invented, so nothing downstream renders a made-up split.
      by_zoning: {},
      counties_detail: s.counties_detail ?? [],
      with_address: s.with_address ?? 0,
      vacant_land: s.vacant_land ?? 0,
      condos: s.condos ?? 0,
      date_min: s.date_min ?? null,
      date_max: s.date_max ?? null,
      generated_at: s.generated_at ?? null,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  )
}
