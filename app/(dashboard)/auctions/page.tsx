import AuctionsLayout from '@/components/auctions/AuctionsLayout'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Auctions | ZoneWise.AI',
  description: 'Florida auction intelligence — foreclosures and tax deed sales across 67 counties'
}

export default function AuctionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6 px-4 sm:px-6 pt-6 max-w-7xl mx-auto">Florida Foreclosure Auctions</h1>
      <AuctionsLayout />
    </div>
  )
}
