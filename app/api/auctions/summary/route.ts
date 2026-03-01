import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('multi_county_auctions')
    .select('county, auction_type, is_vacant_land, is_condo, property_address, just_value, address_status')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const summary = {
    total: data.length,
    by_county: {} as Record<string, number>,
    by_type: {} as Record<string, number>,
    with_address: 0,
    vacant_land: 0,
    condos: 0,
  }

  for (const row of data) {
    const county = row.county || 'Unknown'
    summary.by_county[county] = (summary.by_county[county] || 0) + 1

    const atype = row.auction_type || 'unknown'
    summary.by_type[atype] = (summary.by_type[atype] || 0) + 1

    if (row.property_address && !['', 'UNKNOWN, FL', '0 UNKNOWN'].includes(row.property_address)) {
      summary.with_address++
    }
    if (row.is_vacant_land) summary.vacant_land++
    if (row.is_condo) summary.condos++
  }

  return NextResponse.json(summary, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
