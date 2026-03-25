import { FeasibilityLayout } from '@/components/feasibility'
import ErrorBoundary from '@/components/ErrorBoundary'
import {
  DEMO_SITE,
  DEMO_ZONING_CONTROLS,
  DEMO_COMPS,
  DEMO_UNIT_RENTS,
  DEMO_UNIT_MIX,
  DEMO_LODGING,
  DEMO_NEARBY_LODGING,
  DEMO_MARKET_DEMOGRAPHICS,
  DEMO_MARKET_SCORE,
} from '@/lib/feasibility/demo-data'

export const metadata = {
  title: 'Site Feasibility | ZoneWise.AI',
  description: 'AI-powered site feasibility analysis for real estate investors',
}

export default function FeasibilityPage() {
  return (
    <ErrorBoundary>
      <FeasibilityLayout
        site={DEMO_SITE}
        zoningControls={DEMO_ZONING_CONTROLS}
        comps={DEMO_COMPS}
        unitRents={DEMO_UNIT_RENTS}
        unitMix={DEMO_UNIT_MIX}
        lodging={DEMO_LODGING}
        nearbyLodging={DEMO_NEARBY_LODGING}
        demographics={DEMO_MARKET_DEMOGRAPHICS}
        marketScore={DEMO_MARKET_SCORE}
      />
    </ErrorBoundary>
  )
}
