import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  try {
    const supabase = getSupabase()

    // Parallel fetch: auctions, zoning_codes, zoning_assignments, fl_parcels estimate
    const [auctionsRes, zoningCodesRes, zoningAssignRes, flParcelsEstRes, brevardRes] = await Promise.all([
      supabase.from('multi_county_auctions').select('*', { count: 'exact', head: true }),
      supabase.from('zoning_codes').select('county'),
      supabase.from('zoning_assignments').select('*', { count: 'exact', head: true }),
      // fl_parcels: pg_stat estimate via RPC (instant, no seq scan)
      supabase.rpc('fl_parcels_count_estimate'),
      // Brevard health check — confirms fl_parcels is alive
      supabase.from('fl_parcels').select('*', { count: 'exact', head: true }).eq('co_no', 5),
    ])

    // Count distinct counties from zoning_codes
    const uniqueCounties = new Set(
      (zoningCodesRes.data || []).map((r: { county: string }) => r.county).filter(Boolean)
    ).size

    const brevardParcels = brevardRes.count ?? 0
    const flParcelsAlive = brevardParcels > 0
    // Live pg_stat estimate — falls back to 0 if RPC fails
    const totalParcels = flParcelsAlive ? (flParcelsEstRes.data ?? 0) : 0

    return NextResponse.json(
      {
        counties: uniqueCounties || 67,
        fl_parcels: totalParcels,
        fl_parcels_alive: flParcelsAlive,
        brevard_parcels: brevardParcels,
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
