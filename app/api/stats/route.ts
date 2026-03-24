import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour cache

export async function GET() {
  try {
    const supabase = await createClient()

    // Counties covered: count from county_conquest_status
    const { count: countiesCount } = await supabase
      .from('county_conquest_status')
      .select('*', { count: 'exact', head: true })

    // Zoning assignments as proxy for parcels analyzed
    const { count: zoningCount } = await supabase
      .from('zoning_assignments')
      .select('*', { count: 'exact', head: true })

    // Fallback to known real numbers if queries fail
    const counties = countiesCount ?? 67
    const parcels = zoningCount ?? 10800000

    return NextResponse.json(
      { counties, parcels },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch {
    // Return known real numbers on error
    return NextResponse.json({ counties: 67, parcels: 10800000 })
  }
}
