import type { Metadata } from 'next'
import ExplorerLoader from '@/components/explorer/ExplorerLoader'

export const metadata: Metadata = {
  title: 'Brevard Explorer — ZoneWise.AI',
  description: 'Interactive map of all 262K+ Brevard County FL parcels with zoning districts, future land use, and property intelligence.',
}

export default function ExplorerPage() {
  return <ExplorerLoader />
}
