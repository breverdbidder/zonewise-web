import { FeasibilityLayout } from '@/components/feasibility'
import {
  DEMO_SITE,
  DEMO_ZONING_CONTROLS,
  DEMO_COMPS,
  DEMO_UNIT_RENTS,
  DEMO_UNIT_MIX,
} from '@/lib/feasibility/demo-data'

export const metadata = {
  title: 'Site Feasibility | ZoneWise.AI',
  description: 'AI-powered site feasibility analysis for real estate investors',
}

export default function FeasibilityPage() {
  return (
    <FeasibilityLayout
      site={DEMO_SITE}
      zoningControls={DEMO_ZONING_CONTROLS}
      comps={DEMO_COMPS}
      unitRents={DEMO_UNIT_RENTS}
      unitMix={DEMO_UNIT_MIX}
    />
  )
}
