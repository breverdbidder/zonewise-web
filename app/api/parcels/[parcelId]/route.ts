import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * GET /api/parcels/:parcelId
 * Returns parcel details + BidDeed/ZoneWise status + GeoJSON geometry.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ parcelId: string }> }
) {
  const { parcelId } = await params

  if (!parcelId) {
    return NextResponse.json({ error: 'parcelId required' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()

    // Parallel: parcel data + auction status + zoning + geojson
    const [parcelRes, auctionRes, zoningRes, geojsonRes] = await Promise.all([
      supabase
        .from('fl_parcels')
        .select('parcel_id, phy_addr1, phy_city, phy_zipcd, cent_lat, cent_lon, co_no, dor_uc, jv, tv_nsd, lnd_val, act_yr_blt')
        .eq('parcel_id', parcelId)
        .single(),
      supabase
        .from('multi_county_auctions')
        .select('status, auction_type, sale_date, opening_bid, final_judgment_amount')
        .eq('parcel_id', parcelId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('zoning_assignments')
        .select('zoning_code, jurisdiction')
        .eq('parcel_id', parcelId)
        .limit(1)
        .maybeSingle(),
      supabase.rpc('get_parcel_geojson', { p_parcel_id: parcelId }),
    ])

    if (parcelRes.error || !parcelRes.data) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 })
    }

    const p = parcelRes.data

    return NextResponse.json(
      {
        parcel: {
          parcel_id: p.parcel_id,
          address: p.phy_addr1,
          city: p.phy_city,
          zip: p.phy_zipcd,
          lat: p.cent_lat,
          lng: p.cent_lon,
          co_no: p.co_no,
          dor_uc: p.dor_uc,
          just_value: p.jv,
          taxable_value: p.tv_nsd,
          land_value: p.lnd_val,
          year_built: p.act_yr_blt,
        },
        biddeed: {
          status: auctionRes.data?.status ?? 'No active auction',
          auction_type: auctionRes.data?.auction_type ?? null,
          sale_date: auctionRes.data?.sale_date ?? null,
          opening_bid: auctionRes.data?.opening_bid ?? null,
          judgment_amount: auctionRes.data?.final_judgment_amount ?? null,
        },
        zonewise: {
          zoning_code: zoningRes.data?.zoning_code ?? null,
          jurisdiction: zoningRes.data?.jurisdiction ?? null,
          status: zoningRes.data
            ? `${zoningRes.data.zoning_code} (${zoningRes.data.jurisdiction})`
            : 'Not assigned',
        },
        geojson: geojsonRes.data ?? null,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
