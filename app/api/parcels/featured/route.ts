import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// force-dynamic: same build-time prerender defect as /api/stats — the featured
// parcel lookup ran without DB access at build and pinned the hardcoded
// fallback parcel into the response.
export const dynamic = 'force-dynamic'
export const revalidate = 60

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const EMPTY_BIDDEED = {
  status: 'No active auction',
  auction_type: null as string | null,
  sale_date: null as string | null,
  opening_bid: null as number | null,
}

const EMPTY_ZONEWISE = {
  zoning_code: null as string | null,
  jurisdiction: null as string | null,
  status: 'Not assigned',
}

/**
 * GET /api/parcels/featured
 * Returns a featured Palm Bay foreclosure parcel from fl_parcels with
 * BidDeed auction status + ZoneWise zoning status (pairing rule).
 *
 * CONTRACT: response ALWAYS includes { parcel, biddeed, zonewise, fallback }.
 * The home page (Hero3DSection + HeroCornerCard) assumes all four fields are
 * present. Dropping any of them causes TypeError at HeroCornerCard render.
 */
export async function GET() {
  try {
    const supabase = getSupabase()

    const { data: parcel, error: parcelError } = await supabase
      .from('fl_parcels')
      .select('parcel_id, phy_addr1, phy_city, phy_zipcd, centroid_lat, centroid_lng, co_no, dor_uc, jv')
      .eq('co_no', 15) // Brevard is DOR co_no 15, not 5 — co_no=5 matched zero of 10.5M rows
      .ilike('phy_city', 'Palm Bay')
      .not('centroid_lat', 'is', null)
      .not('centroid_lng', 'is', null)
      .gt('jv', 100000)
      .limit(1)
      .single()

    if (parcelError || !parcel) {
      return NextResponse.json(
        {
          error: 'No featured parcel found',
          fallback: true,
          parcel: getFallbackParcel(),
          biddeed: EMPTY_BIDDEED,
          zonewise: EMPTY_ZONEWISE,
        },
        { status: 200 }
      )
    }

    const [auctionRes, zoningRes] = await Promise.all([
      supabase
        .from('multi_county_auctions')
        .select('status, auction_type, sale_date, opening_bid')
        .eq('parcel_id', parcel.parcel_id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('zoning_assignments')
        .select('zone_code, jurisdiction') // column is zone_code, not zoning_code
        .eq('parcel_id', parcel.parcel_id)
        .limit(1)
        .maybeSingle(),
    ])

    return NextResponse.json(
      {
        fallback: false,
        parcel: {
          parcel_id: parcel.parcel_id,
          address: parcel.phy_addr1,
          city: parcel.phy_city,
          zip: parcel.phy_zipcd,
          lat: parcel.centroid_lat,
          lng: parcel.centroid_lng,
          co_no: parcel.co_no,
          dor_uc: parcel.dor_uc,
          just_value: parcel.jv,
        },
        biddeed: {
          status: auctionRes.data?.status ?? 'No active auction',
          auction_type: auctionRes.data?.auction_type ?? null,
          sale_date: auctionRes.data?.sale_date ?? null,
          opening_bid: auctionRes.data?.opening_bid ?? null,
        },
        zonewise: {
          zoning_code: zoningRes.data?.zone_code ?? null,
          jurisdiction: zoningRes.data?.jurisdiction ?? null,
          status: zoningRes.data
            ? `${zoningRes.data.zoning_code} (${zoningRes.data.jurisdiction})`
            : 'Not assigned',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch {
    return NextResponse.json({
      fallback: true,
      parcel: getFallbackParcel(),
      biddeed: EMPTY_BIDDEED,
      zonewise: EMPTY_ZONEWISE,
    })
  }
}

function getFallbackParcel() {
  return {
    parcel_id: '05-25-36-00-00100.0-0001.00',
    address: '1234 Palm Bay Rd NE',
    city: 'Palm Bay',
    zip: '32905',
    lat: 28.0345,
    lng: -80.5887,
    co_no: 5,
    dor_uc: '0100',
    just_value: 185000,
  }
}
