import AuctionsLayout from '@/components/auctions/AuctionsLayout'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '67-County Auction Calendar | ZoneWise.AI',
  description: 'Florida foreclosure & tax deed auctions — live data across all 67 counties',
}

export default function AuctionsPage() {
  return (
    <div className="bg-[rgb(var(--zw-page))] min-h-screen">
      {/* Dark header */}
      <div className="border-b border-[rgb(var(--zw-border2)/0.5)] bg-[rgb(var(--zw-elev)/0.8)] px-4 sm:px-6 pt-6 pb-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-[rgb(var(--zw-ink))]">67-County Auction Calendar</h1>
        <p className="text-[rgb(var(--zw-ink2))] text-sm mt-1">Florida foreclosure &amp; tax deed auctions — live data</p>
      </div>
      <AuctionsLayout />
    </div>
  )
}
