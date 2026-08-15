import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// force-dynamic: this route was previously prerendered at build time, where
// Supabase env is unavailable, so it served fl_parcels: 0 / alive: false
// indefinitely while the database held 10.5M parcels.
export const dynamic = 'force-dynamic'
export const revalidate = 60

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface PlatformStats {
  counties: number
  fl_parcels: number
  zoning_codes: number
  zoning_assignments: number
  auctions: number
}

export async function GET() {
  try {
    const supabase = getSupabase()

    // Single RPC rather than four client-side queries. The previous version
    // counted distinct counties by selecting every zoning_codes row, which
    // PostgREST capped at 1000 — so it reported 5 counties instead of 67.
    const { data, error } = await supabase.rpc('zonewise_platform_stats')
    if (error || !data) throw error ?? new Error('no stats returned')

    const s = data as PlatformStats
    const totalParcels = Number(s.fl_parcels) || 0

    return NextResponse.json(
      {
        counties: Number(s.counties) || 0,
        fl_parcels: totalParcels,
        fl_parcels_alive: totalParcels > 1_000_000,
        zoning_assignments: Number(s.zoning_assignments) || 0,
        auctions: Number(s.auctions) || 0,
        zoning_codes: Number(s.zoning_codes) || 0,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    )
  } catch {
    // Explicitly flagged as not live so the UI can distinguish a degraded
    // response from real data. Never present these as verified figures.
    return NextResponse.json(
      {
        counties: 67,
        fl_parcels: 0,
        fl_parcels_alive: false,
        zoning_assignments: 0,
        auctions: 0,
        zoning_codes: 0,
        degraded: true,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
