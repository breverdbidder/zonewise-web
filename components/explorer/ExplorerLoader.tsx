'use client'

import dynamic from 'next/dynamic'

const ExplorerV2 = dynamic(() => import('@/components/explorer/ExplorerV2'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-950">
      <div className="text-center">
        <div className="text-4xl animate-spin inline-block mb-3">◐</div>
        <p className="text-sm text-slate-400">Loading Explorer V2...</p>
        <p className="text-xs text-slate-600 mt-1">262K+ parcels · Choropleth · AI Chat</p>
      </div>
    </div>
  ),
})

export default function ExplorerLoader() {
  return <ExplorerV2 />
}
