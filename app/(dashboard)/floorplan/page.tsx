export const dynamic = 'force-dynamic'

import FloorPlanStudio from '@/components/floorplan/FloorPlanStudio'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata = {
  title: 'Floor Plan Studio | ZoneWise.AI',
  description: 'Parcel-aware floor plan compiler — draft, compile, and check floor plans against zoning constraints for Brevard County parcels',
}

export default function FloorPlanPage() {
  return (
    <ErrorBoundary>
      <FloorPlanStudio />
    </ErrorBoundary>
  )
}
