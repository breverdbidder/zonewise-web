'use client'

interface ParcelData {
  parcel_id: string
  address: string | null
  city: string | null
  zip: string | null
  dor_uc: string | null
  just_value: number | null
}

interface BidDeedData {
  status: string
  auction_type: string | null
  sale_date: string | null
  opening_bid: number | null
}

interface ZoneWiseData {
  status: string
  zoning_code: string | null
  jurisdiction: string | null
}

interface HeroCornerCardProps {
  parcel: ParcelData
  biddeed: BidDeedData
  zonewise: ZoneWiseData
}

export function HeroCornerCard({ parcel, biddeed, zonewise }: HeroCornerCardProps) {
  return (
    <div className="absolute bottom-6 right-6 z-40 w-72 space-y-3 pointer-events-auto">
      {/* Parcel Details */}
      <div className="bg-[#020617]/90 backdrop-blur-md border border-[#1E3A5F]/60 rounded-lg p-4 shadow-2xl">
        <h2 className="text-xs font-semibold text-[#F59E0B] tracking-wider uppercase mb-2">
          Featured Parcel
        </h2>
        <p className="text-white text-sm font-mono leading-tight mb-1">
          {parcel.parcel_id}
        </p>
        <p className="text-slate-300 text-xs">
          {parcel.address ?? 'Address N/A'}
        </p>
        <p className="text-slate-400 text-xs">
          {parcel.city}, FL {parcel.zip}
        </p>
        {parcel.just_value && (
          <p className="text-white text-sm font-semibold mt-2">
            Just Value: <span className="text-[#F59E0B]">${parcel.just_value.toLocaleString()}</span>
          </p>
        )}
      </div>

      {/* BidDeed.AI — Foreclosure Status */}
      <div className="bg-[#020617]/90 backdrop-blur-md border border-[#1E3A5F]/60 rounded-lg p-3 shadow-2xl">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-xs font-semibold text-[#F59E0B] tracking-wider uppercase">
            BidDeed.AI
          </h3>
        </div>
        <p className="text-slate-300 text-xs">
          {biddeed.status}
        </p>
        {biddeed.auction_type && (
          <p className="text-slate-400 text-[10px] mt-0.5">
            Type: {biddeed.auction_type}
          </p>
        )}
        {biddeed.opening_bid && (
          <p className="text-white text-xs font-semibold mt-1">
            Opening Bid: ${biddeed.opening_bid.toLocaleString()}
          </p>
        )}
      </div>

      {/* ZoneWise.AI — Zoning Status */}
      <div className="bg-[#020617]/90 backdrop-blur-md border border-[#1E3A5F]/60 rounded-lg p-3 shadow-2xl">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          <h3 className="text-xs font-semibold text-[#F59E0B] tracking-wider uppercase">
            ZoneWise.AI
          </h3>
        </div>
        <p className="text-slate-300 text-xs">
          {zonewise.status}
        </p>
        {zonewise.jurisdiction && (
          <p className="text-slate-400 text-[10px] mt-0.5">
            Jurisdiction: {zonewise.jurisdiction}
          </p>
        )}
      </div>
    </div>
  )
}
