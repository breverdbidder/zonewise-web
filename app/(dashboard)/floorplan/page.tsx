export const dynamic = 'force-dynamic'

import FloorPlanStudio from '@/components/floorplan/FloorPlanStudio'
import VoiceDraftsman from '@/components/floorplan/VoiceDraftsman'
import ErrorBoundary from '@/components/ErrorBoundary'
import ToolIntroBanner from '@/components/ToolIntroBanner'

export const metadata = {
  title: 'Floor Plan Studio | ZoneWise.AI',
  description: 'Parcel-aware floor plan compiler — draft, compile, and check floor plans against zoning constraints for Brevard County parcels',
}

export default function FloorPlanPage() {
  return (
    <ErrorBoundary>
      <ToolIntroBanner
        title="Floor Plan Studio"
        description="Draft and edit interior floor plans, checked against zoning as you go"
        steps={[
          'Describe the floor plan you want in plain language (e.g. "3 bed, 2 bath, 1800 sq ft ranch") or upload an existing plan to start from.',
          'The studio compiles a draft plan and shows room layout, dimensions, and a zoning-fit check (lot coverage, bedroom/septic caps) for the linked parcel.',
          'Ask for changes in chat — move a wall, resize a room, add a door — and the plan recompiles live.',
          'Use the voice draftsman below for hands-free editing: describe changes out loud and confirm before it saves.',
          'Export the finished plan or save it to revisit later.',
        ]}
        tip="Uploaded plans are used for reference only — the studio won't reproduce a third party's original drawing, only build a new one informed by it."
      />
      <FloorPlanStudio />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <VoiceDraftsman />
      </div>
    </ErrorBoundary>
  )
}
