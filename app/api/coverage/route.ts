import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// force-dynamic: coverage changes as the ingestion pipeline runs. A stale
// prerender here would be worse than useless — it is the number customers
// use to decide whether to pay.
export const dynamic = 'force-dynamic'
export const revalidate = 300

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('v_zoning_coverage')
      .select('co_no, county_name, county_slug, parcel_count, parcels_zoned, coverage_pct, zoning_polygons, jurisdictions_done, jurisdictions_total, coverage_status')
      .order('coverage_pct', { ascending: false })
      .order('county_name', { ascending: true })
      .limit(70)

    if (error) throw error

    const counties = data ?? []
    const summary = {
      counties_total: counties.length,
      counties_complete: counties.filter((c) => c.coverage_status === 'complete').length,
      counties_partial: counties.filter((c) => c.coverage_status === 'partial').length,
      counties_early: counties.filter((c) => c.coverage_status === 'early').length,
      counties_not_started: counties.filter((c) => c.coverage_status === 'not_started').length,
      parcels_zoned: counties.reduce((s, c) => s + Number(c.parcels_zoned || 0), 0),
      parcels_total: counties.reduce((s, c) => s + Number(c.parcel_count || 0), 0),
    }

    return NextResponse.json(
      { updated_at: new Date().toISOString(), summary, counties },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' } }
    )
  } catch {
    return NextResponse.json({ degraded: true, counties: [], summary: null }, { status: 200 })
  }
}
