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

  const [totalRes, addressRes, vacantRes, condoRes] = await Promise.all([
    supabase.from('multi_county_auctions').select('id', { count: 'exact', head: true }),
    supabase.from('multi_county_auctions').select('id', { count: 'exact', head: true })
      .not('property_address', 'is', null)
      .neq('property_address', '')
      .neq('property_address', 'UNKNOWN, FL')
      .neq('property_address', '0 UNKNOWN'),
    supabase.from('multi_county_auctions').select('id', { count: 'exact', head: true })
      .eq('property_type', 'vacant_land'),
    supabase.from('multi_county_auctions').select('id', { count: 'exact', head: true })
      .eq('property_type', 'condo'),
  ])

  // Only select columns that exist in the table
  const { data: breakdown, error } = await supabase
    .from('multi_county_auctions')
    .select('county, auction_type, sale_type')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const by_county: Record<string, number> = {}
  const by_type: Record<string, number> = {}
  const by_sale_type: Record<string, number> = {}

  for (const row of (breakdown || [])) {
    const county = row.county || 'Unknown'
    by_county[county] = (by_county[county] || 0) + 1
    const atype = row.auction_type || 'unknown'
    by_type[atype] = (by_type[atype] || 0) + 1
    const stype = row.sale_type || 'unknown'
    by_sale_type[stype] = (by_sale_type[stype] || 0) + 1
  }

  return NextResponse.json(
    {
      total: totalRes.count || 0,
      by_county,
      by_type,
      by_sale_type,
      with_address: addressRes.count || 0,
      vacant_land: vacantRes.count || 0,
      condos: condoRes.count || 0,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  )
}