import AuctionDetail from '@/components/auctions/AuctionDetail'
import OwnerIntelPanel from '@/components/parcel/OwnerIntelPanel'
import { Suspense } from 'react'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return {
    title: `Auction #${id} | ZoneWise.AI`,
    description: 'Auction detail — property info, parcel data, zoning, and map',
  }
}

async function getAuctionCaseNumber(id: string): Promise<string | null> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('multi_county_auctions')
      .select('case_number')
      .eq('id', id)
      .limit(1)
      .maybeSingle()
    return data?.case_number ?? null
  } catch {
    return null
  }
}

export default async function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const caseNumber = await getAuctionCaseNumber(id)

  return (
    <div className="space-y-6">
      <AuctionDetail auctionId={id} />
      {caseNumber && (
        <div className="max-w-4xl mx-auto px-4">
          <Suspense fallback={
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-40 mb-3" />
              <div className="h-8 bg-slate-800 rounded w-60" />
            </div>
          }>
            <OwnerIntelPanel identifier={caseNumber} />
          </Suspense>
        </div>
      )}
    </div>
  )
}
