'use client'

import dynamic from 'next/dynamic'

const ParcelDetail = dynamic(() => import('@/components/explorer/ParcelDetail'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-950">
      <div className="text-3xl animate-spin inline-block">◐</div>
    </div>
  ),
})

export default function ParcelLoader({ parcelId }: { parcelId: string }) {
  return <ParcelDetail parcelId={parcelId} />
}
