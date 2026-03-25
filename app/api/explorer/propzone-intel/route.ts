import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/explorer/propzone-intel?parcelId=XXXXX
 *
 * Returns PropZone competitor data for the given parcel from the
 * propzone_intel Supabase table (populated by propzone-scrape.yml pipeline).
 *
 * Returns 404 JSON with { found: false } when parcel is not in the table.
 * Returns 200 JSON with PropZone intel when found.
 */
export async function GET(req: NextRequest) {
  const parcelId = req.nextUrl.searchParams.get('parcelId')?.trim()
  if (!parcelId) {
    return NextResponse.json({ error: 'parcelId is required' }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('propzone_intel')
      .select(
        'parcel_id, address, zoning_code, permitted_uses, front_setback_ft, side_setback_ft, rear_setback_ft, max_height_ft, far, density, lot_coverage_pct, scraped_at'
      )
      .eq('parcel_id', decodeURIComponent(parcelId))
      .maybeSingle()

    if (error) {
      // Table may not exist yet — return empty rather than 500
      return NextResponse.json({ found: false }, { status: 200 })
    }

    if (!data) {
      return NextResponse.json({ found: false }, { status: 200 })
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch {
    // Fail gracefully — competitor comparison is non-critical
    return NextResponse.json({ found: false }, { status: 200 })
  }
}
