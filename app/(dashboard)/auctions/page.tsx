import AuctionsLayout from '@/components/auctions/AuctionsLayout'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '67-County Auction Calendar | ZoneWise.AI',
  description: 'Florida foreclosure & tax deed auctions — live data across all 67 counties',
}

export default function AuctionsPage() {
  return (
    <div className="bg-[#020617] min-h-screen">
      {/* Dark header */}
      <div className="border-b border-slate-700/50 bg-[#162D4A]/80 px-4 sm:px-6 pt-6 pb-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white">67-County Auction Calendar</h1>
        <p className="text-slate-400 text-sm mt-1">Florida foreclosure &amp; tax deed auctions — live data</p>
      </div>
      <AuctionsLayout />
    </div>
  )
}
