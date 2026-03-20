import type { Metadata } from 'next'
import ExploreWithChat from '@/components/enterprise/ExploreWithChat'

export const metadata: Metadata = {
  title: 'Development Intelligence — ZoneWise.AI',
  description: '3D buildable envelope, HBU analysis, and max bid calculator for Brevard County parcels.',
}

interface Props {
  params: Promise<{ parcelId: string }>
}

export default async function ExploreParcelPage({ params }: Props) {
  const { parcelId } = await params
  return <ExploreWithChat initialParcelId={decodeURIComponent(parcelId)} />
}
