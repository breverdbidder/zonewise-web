import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getZoningCategory } from '@/lib/zoning'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const BATCH_SIZE = 50

/**
 * POST /api/admin/enrich-zoning
 *
 * Batch enriches auctions with zoning data from fl_parcels.
 * Processes BATCH_SIZE auctions per call (those missing zoning_category).
 * Call repeatedly until remaining = 0.
 *
 * Body: { "secret": "enrich-2026" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const SECRET = process.env.ENRICH_SECRET
    if (!SECRET || body.secret !== SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()

    // Find auctions that need enrichment (no zoning_category yet, have parcel_id)
    const { data: auctions, error: fetchError } = await supabase
      .from('multi_county_auctions')
      .select('id, parcel_id, fl_co_no, county')
      .is('zoning_category', null)
      .not('parcel_id', 'is', null)
      .limit(BATCH_SIZE)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!auctions || auctions.length === 0) {
      return NextResponse.json({
        message: 'All auctions enriched',
        enriched: 0,
        remaining: 0,
      })
    }

    let enriched = 0
    let skipped = 0

    for (const auction of auctions) {
      if (!auction.parcel_id) {
        skipped++
        continue
      }

      // Strategy 1: Exact match on co_no + parcel_id
      let parcelData = null
      const cleanParcel = auction.parcel_id.replace(/[\s\-\*]/g, '')

      if (auction.fl_co_no && cleanParcel.length >= 4) {
        const { data } = await supabase
          .from('fl_parcels')
          .select('dor_uc, zone_code, municipality')
          .eq('co_no', auction.fl_co_no)
          .ilike('parcel_id', `%${cleanParcel}%`)
          .limit(1)
          .maybeSingle()
        parcelData = data
      }

      // Strategy 2: Broad ILIKE fallback
      if (!parcelData && cleanParcel.length >= 4) {
        const { data } = await supabase
          .from('fl_parcels')
          .select('dor_uc, zone_code, municipality')
          .ilike('parcel_id', `%${cleanParcel}%`)
          .limit(1)
          .maybeSingle()
        parcelData = data
      }

      if (parcelData) {
        const dorCode = (parcelData.dor_uc as string)?.padStart(3, '0') || null
        const category = getZoningCategory(dorCode)

        const { error: updateError } = await supabase
          .from('multi_county_auctions')
          .update({
            dor_use_code: dorCode,
            zoning_category: category,
            zone_code: parcelData.zone_code as string | null,
            municipality: parcelData.municipality as string | null,
          })
          .eq('id', auction.id)

        if (!updateError) enriched++
      } else {
        // Mark as MISC so we don't re-process
        await supabase
          .from('multi_county_auctions')
          .update({ zoning_category: 'UNKNOWN' })
          .eq('id', auction.id)
        skipped++
      }
    }

    // Count remaining
    const { count: remaining } = await supabase
      .from('multi_county_auctions')
      .select('id', { count: 'exact', head: true })
      .is('zoning_category', null)
      .not('parcel_id', 'is', null)

    return NextResponse.json({
      message: `Enriched ${enriched} auctions`,
      enriched,
      skipped,
      remaining: remaining || 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
