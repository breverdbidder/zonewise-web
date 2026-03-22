import type { Metadata } from 'next'
import ExplorerLoader from '@/components/explorer/ExplorerLoader'

export const metadata: Metadata = {
  title: 'Florida Parcel Explorer — ZoneWise.AI',
  description: 'Interactive map of all 262K+ Brevard County FL parcels with zoning districts, future land use, and property intelligence. All 67 counties coming soon.',
}

export default function ExplorerPage() {
  return (
    <div className="bg-[#020617] min-h-screen">
      <ExplorerLoader />
    </div>
  )
}
