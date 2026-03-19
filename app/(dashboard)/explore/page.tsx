import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: 'Development Intelligence — ZoneWise.AI',
  description: '3D buildable envelope, Highest & Best Use analysis, and max bid calculator for every Brevard County parcel.',
}

const DevIntelTab = dynamic(
  () => import('@/components/envelope/DevIntelTab').then(m => ({ default: m.DevIntelTab })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-950">
        <div className="text-center">
          <div className="text-4xl animate-spin inline-block mb-3">◈</div>
          <p className="text-sm text-slate-400">Loading Development Intelligence...</p>
          <p className="text-xs text-slate-600 mt-1">3D Envelope · HBU Analysis · Max Bid</p>
        </div>
      </div>
    ),
  }
)

export default function ExplorePage() {
  return <DevIntelTab />
}
