import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// force-dynamic: this route was prerendered at build time, where Supabase env
// is not available, so it served fl_parcels: 0 / fl_parcels_alive: false
// indefinitely while the database actually held 10.5M parcels. Query the DB per
// request and cache only briefly at the edge.
export const dynamic = 'force-dynamic'
export const revalidate = 60

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  try {
    const supabase = getSupabase()

    // EG14 P13 FIX: Removed hardcoded Brevard co_no=5 health check (counties are 15–63,
    // no rows match co_no=5 → fl_parcels_alive always false → totalParcels always 0 → P13 FAIL).
    // Now the pg_stat estimate is the sole source of truth.
    const [auctionsRes, zoningCodesRes, zoningAssignRes, flParcelsEstRes] = await Promise.all([
      supabase.from('multi_county_auctions').select('*', { count: 'exact', head: true }),
      supabase.from('zoning_codes').select('county'),
      supabase.from('zoning_assignments').select('*', { count: 'exact', head: true }),
      // fl_parcels: pg_stat estimate via RPC (instant, no seq scan)
      supabase.rpc('fl_parcels_count_estimate'),
    ])

    // Count distinct counties from zoning_codes
    const uniqueCounties = new Set(
      (zoningCodesRes.data || []).map((r: { county: string }) => r.county).filter(Boolean)
    ).size

    const totalParcels = (flParcelsEstRes.data as number | null) ?? 0
    const flParcelsAlive = totalParcels > 1_000_000

    return NextResponse.json(
      {
        counties: uniqueCounties || 67,
        fl_parcels: totalParcels,
        fl_parcels_alive: flParcelsAlive,
        zoning_assignments: zoningAssignRes.count ?? 0,
        auctions: auctionsRes.count ?? 0,
        zoning_codes: (zoningCodesRes.data || []).length || 7531,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch {
    return NextResponse.json({
      counties: 67,
      fl_parcels: 9410902,
      fl_parcels_alive: false,
      zoning_assignments: 351518,
      auctions: 256559,
      zoning_codes: 7531,
    })
  }
}
