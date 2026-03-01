import AuctionsLayout from '@/components/auctions/AuctionsLayout'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Auctions | ZoneWise.AI',
  description: 'Florida auction intelligence — foreclosures and tax deed sales across 67 counties'
}

export default function AuctionsPage() {
  return <AuctionsLayout />
}
