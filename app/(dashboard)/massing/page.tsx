export const dynamic = 'force-dynamic'

import MassingEngine from '@/components/massing/MassingEngine'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata = {
  title: '3D Massing Engine | ZoneWise.AI',
  description: 'Address to zoning to 3D building envelope — capacity analysis, unit mix, and parking for Brevard County parcels',
}

export default function MassingPage() {
  return (
    <ErrorBoundary>
      <MassingEngine />
    </ErrorBoundary>
  )
}
