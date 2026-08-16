export const dynamic = 'force-dynamic'

import MassingEngine from '@/components/massing/MassingEngine'
import ErrorBoundary from '@/components/ErrorBoundary'
import ToolIntroBanner from '@/components/ToolIntroBanner'

export const metadata = {
  title: '3D Massing Engine | ZoneWise.AI',
  description: 'Address to zoning to 3D building envelope — capacity analysis, unit mix, and parking for Brevard County parcels',
}

export default function MassingPage() {
  return (
    <ErrorBoundary>
      <ToolIntroBanner
        title="3D Massing Engine"
        description="See what you can legally build on any parcel, in seconds"
        steps={[
          'Type a Brevard County address in the search box below.',
          'Select the property from the dropdown — its zoning district loads automatically.',
          'Review the building envelope: max height, setbacks, lot coverage, FAR, and parking requirements.',
          'Drag the 3D model to rotate, scroll to zoom, and check the unit mix / capacity metrics on the left.',
          'Click "Download Render" to save a PNG of the massing study for a deck or feasibility packet.',
        ]}
        tip="If a zone shows a yellow 'estimated controls' warning, the district isn't in the standards database yet — treat the numbers as a starting point, not a final answer."
      />
      <MassingEngine />
    </ErrorBoundary>
  )
}
