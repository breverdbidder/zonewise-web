import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)

  const county = searchParams.get('county')
  const type = searchParams.get('type')
  const zoningCategory = searchParams.get('zoning_category')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')
  const hasCoords = searchParams.get('has_coords')
  // Case/address lookup — added for the Deed voice agent's "do you have this
  // case" tool (issue #19148). Same public dataset/columns this route already
  // exposes for county listing, just a different filter dimension.
  const caseNumber = searchParams.get('case_number')
  const address = searchParams.get('address')

  let query = supabase
    .from('multi_county_auctions')
    .select('*', { count: 'exact' })
    .order('auction_date', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (county) query = query.ilike('county', county)
  if (type) query = query.eq('auction_type', type)
  if (zoningCategory) query = query.eq('zoning_category', zoningCategory)
  if (hasCoords === 'true') {
    query = query.not('centroid_lat', 'is', null).not('centroid_lng', 'is', null)
  }
  if (caseNumber) query = query.ilike('case_number', `%${caseNumber}%`)
  if (address) query = query.ilike('property_address', `%${address}%`)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { data, total: count, limit, offset },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
