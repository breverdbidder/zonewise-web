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

    const [countiesRes, zoningRes, auctionsRes] = await Promise.all([
      // Count distinct counties from zoning_codes (67 FL counties)
      supabase.from('zoning_codes').select('county_name', { count: 'exact', head: true }),
      supabase.from('zoning_assignments').select('*', { count: 'exact', head: true }),
      supabase.from('multi_county_auctions').select('*', { count: 'exact', head: true }),
    ])

    // Get distinct county count from zoning_codes
    const { data: distinctCounties } = await supabase
      .from('zoning_codes')
      .select('county_name')
      .limit(1000)

    const uniqueCounties = new Set((distinctCounties || []).map(r => r.county_name)).size

    return NextResponse.json(
      {
        counties: uniqueCounties || 67,
        parcels: zoningRes.count ?? 10800000,
        auctions: auctionsRes.count ?? 245000,
        zoning_codes: countiesRes.count ?? 7531,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch {
    return NextResponse.json({ counties: 67, parcels: 10800000, auctions: 245000, zoning_codes: 7531 })
  }
}
