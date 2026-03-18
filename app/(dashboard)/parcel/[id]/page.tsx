import type { Metadata } from 'next'
import ParcelLoader from '@/components/explorer/ParcelLoader'

export const metadata: Metadata = {
  title: 'Parcel Analysis — ZoneWise.AI',
  description: 'Full property intelligence analysis for Brevard County parcels.',
}

export default async function ParcelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ParcelLoader parcelId={id} />
}
