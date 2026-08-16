import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Address search across all 10.5M Florida parcels.
// Exists because /feasibility was hardwired to a single demo parcel with no way
// for a user to enter their own address.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const city = searchParams.get('city')?.trim() || null
  const zip = searchParams.get('zip')?.trim() || null

  if (q.length < 3) {
    return NextResponse.json({ results: [], hint: 'Enter at least 3 characters' })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.rpc('search_parcels', {
      p_query: q,
      p_city: city,
      p_zip: zip,
      p_limit: 12,
    })

    if (error) throw error

    return NextResponse.json(
      {
        query: q,
        count: data?.length ?? 0,
        results: data ?? [],
        // Address searches are prefix-based. Nothing is invented: a parcel that
        // is not in fl_parcels simply does not come back.
        hint:
          (data?.length ?? 0) === 0
            ? 'No parcel found. Try the street number and name only (e.g. "1390 KANAB"), or narrow by city.'
            : null,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json({ results: [], error: 'Search temporarily unavailable' }, { status: 200 })
  }
}
