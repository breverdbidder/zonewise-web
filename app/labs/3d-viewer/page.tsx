import { createAnonClient } from '@/lib/supabase/server'
import Viewer3DClient from './Viewer3DClient'

export const metadata = {
  title: 'Google 3D Tiles POC | ZoneWise Labs',
  description: 'Photorealistic 3D Tiles viewer for Florida foreclosure parcels',
}

interface ParcelRow {
  parcel_id: string
  phy_addr1: string | null
  phy_city: string | null
  phy_zipcd: string | null
  cent_lat: number
  cent_lon: number
  co_no: number
  dor_uc: string | null
  jv: number | null
}

async function fetchParcel(): Promise<ParcelRow | null> {
  try {
    const supabase = createAnonClient()

    // Fetch one Palm Bay parcel with centroid data
    const { data, error } = await supabase
      .from('fl_parcels')
      .select('parcel_id, phy_addr1, phy_city, phy_zipcd, cent_lat, cent_lon, co_no, dor_uc, jv')
      .eq('co_no', 5) // Brevard
      .ilike('phy_city', 'Palm Bay')
      .not('cent_lat', 'is', null)
      .not('cent_lon', 'is', null)
      .limit(1)
      .single()

    if (error) {
      console.error('Supabase parcel fetch error:', error.message)
      return null
    }

    return data
  } catch {
    return null
  }
}

async function fetchAuctionStatus(parcelId: string): Promise<{
  bidDeedStatus: string | null
  zoneWiseStatus: string | null
}> {
  try {
    const supabase = createAnonClient()

    // Check BidDeed auction status
    const { data: auction } = await supabase
      .from('multi_county_auctions')
      .select('status, auction_type')
      .eq('parcel_id', parcelId)
      .limit(1)
      .maybeSingle()

    // Check zoning assignment status
    const { data: zoning } = await supabase
      .from('zoning_assignments')
      .select('zoning_code, jurisdiction')
      .eq('parcel_id', parcelId)
      .limit(1)
      .maybeSingle()

    return {
      bidDeedStatus: auction?.status ?? 'No active auction',
      zoneWiseStatus: zoning ? `${zoning.zoning_code} (${zoning.jurisdiction})` : 'Not assigned',
    }
  } catch {
    return { bidDeedStatus: null, zoneWiseStatus: null }
  }
}

export default async function Labs3DViewerPage() {
  const parcel = await fetchParcel()
  let auctionInfo = { bidDeedStatus: 'No active auction', zoneWiseStatus: 'Not assigned' }

  if (parcel) {
    auctionInfo = await fetchAuctionStatus(parcel.parcel_id)
  }

  // Fallback if no parcel found
  const displayParcel = parcel ?? {
    parcel_id: 'DEMO-001',
    phy_addr1: '1234 Palm Bay Rd NE',
    phy_city: 'Palm Bay',
    phy_zipcd: '32905',
    cent_lat: 28.0345,
    cent_lon: -80.5887,
    co_no: 5,
    dor_uc: '0100',
    jv: 185000,
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">
              ZoneWise Labs
              <span className="ml-2 text-xs bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded-full">
                POC
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Google Photorealistic 3D Tiles</p>
          </div>
          <a
            href="/"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Back to ZoneWise
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* 3D Viewer — full viewport */}
          <div className="lg:col-span-3 rounded-lg overflow-hidden">
            <Viewer3DClient
              parcelId={displayParcel.parcel_id}
              lat={displayParcel.cent_lat}
              lng={displayParcel.cent_lon}
            />
          </div>

          {/* Corner card — parcel info + BidDeed/ZoneWise pairing */}
          <div className="space-y-4">
            {/* Parcel Info Card */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-[#F59E0B] mb-3">Parcel Details</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs">Parcel ID</dt>
                  <dd className="text-white font-mono text-xs">{displayParcel.parcel_id}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Address</dt>
                  <dd className="text-white">
                    {displayParcel.phy_addr1 ?? 'N/A'}
                    <br />
                    <span className="text-slate-400">
                      {displayParcel.phy_city}, FL {displayParcel.phy_zipcd}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">DOR Use Code</dt>
                  <dd className="text-white font-mono">{displayParcel.dor_uc ?? 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Just Value</dt>
                  <dd className="text-white">
                    {displayParcel.jv
                      ? `$${displayParcel.jv.toLocaleString()}`
                      : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* BidDeed Auction Status */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-[#F59E0B] mb-3">
                BidDeed.AI — Foreclosure
              </h2>
              <p className="text-sm text-slate-300">
                {auctionInfo.bidDeedStatus ?? 'Unknown'}
              </p>
            </div>

            {/* ZoneWise Tax Deed Status */}
            <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-[#F59E0B] mb-3">
                ZoneWise.AI — Zoning
              </h2>
              <p className="text-sm text-slate-300">
                {auctionInfo.zoneWiseStatus ?? 'Unknown'}
              </p>
            </div>

            {/* POC Info */}
            <div className="bg-[#1E3A5F]/20 border border-[#1E3A5F]/40 rounded-lg p-4">
              <h2 className="text-xs font-semibold text-slate-400 mb-2">POC Status</h2>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>CesiumJS 1.115 (MIT)</li>
                <li>Google 3D Tiles API</li>
                <li>requestRenderMode: true</li>
                <li>
                  Coords: {displayParcel.cent_lat.toFixed(4)}, {displayParcel.cent_lon.toFixed(4)}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
