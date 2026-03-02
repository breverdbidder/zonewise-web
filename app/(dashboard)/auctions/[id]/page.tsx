import AuctionDetail from '@/components/auctions/AuctionDetail'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return {
    title: `Auction #${id} | ZoneWise.AI`,
    description: 'Auction property detail — ZoneWise.AI',
  }
}

export default async function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AuctionDetail auctionId={id} />
}
