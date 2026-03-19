import type { Metadata } from 'next'
import { ExploreWithChat } from '@/components/envelope/ExploreWithChat'

interface Props {
  params: Promise<{ parcelId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { parcelId } = await params
  return {
    title: `Parcel ${decodeURIComponent(parcelId)} — Development Intelligence — ZoneWise.AI`,
    description: `3D building envelope, HBU analysis, and max bid calculator for parcel ${decodeURIComponent(parcelId)}.`,
  }
}

export default async function ExploreParcelPage({ params }: Props) {
  const { parcelId } = await params
  return <ExploreWithChat initialParcelId={decodeURIComponent(parcelId)} />
}
