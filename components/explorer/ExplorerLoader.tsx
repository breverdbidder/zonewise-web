'use client'

import dynamic from 'next/dynamic'

const BrevardExplorer = dynamic(() => import('@/components/explorer/BrevardExplorer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-950">
      <div className="text-center">
        <div className="text-4xl animate-spin inline-block mb-3">◐</div>
        <p className="text-sm text-slate-400">Loading Brevard County Explorer...</p>
        <p className="text-xs text-slate-600 mt-1">262K+ parcels · Zoning · Future Land Use</p>
      </div>
    </div>
  ),
})

export default function ExplorerLoader() {
  return <BrevardExplorer />
}
