import { FeasibilityLayout } from '@/components/feasibility'
import ErrorBoundary from '@/components/ErrorBoundary'
import { getLiveSiteData } from '@/lib/feasibility/live-data'
import { getLiveCompBenchmark } from '@/lib/feasibility/live-comps'
import { parcelIdSchema } from '@/lib/validation'
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

interface FeasibilityPageProps {
  searchParams: Promise<{ parcel_id?: string }>
}

export default async function FeasibilityPage({ searchParams }: FeasibilityPageProps) {
  const { parcel_id } = await searchParams
  const parsed = parcel_id ? parcelIdSchema.safeParse(parcel_id) : null

  const live = parsed?.success ? await getLiveSiteData(parsed.data) : null
  const site = live?.site ?? DEMO_SITE
  const zoningControls = live?.zoningControls ?? DEMO_ZONING_CONTROLS

  // Real sold-comp benchmark only exists for Brevard tax-deed parcels with
  // n_comps>0 (gated inside getLiveCompBenchmark). It's a SALE-price CMA, not
  // a rent comp, so it's surfaced as a labeled valuation reference in
  // DevelopTab rather than silently rewriting DEMO_UNIT_RENTS/DEMO_UNIT_MIX —
  // those stay as the manual revenue-assumption inputs in both paths.
  const compBenchmark = live ? await getLiveCompBenchmark(site.parcelId, site.county) : null

  return (
    <ErrorBoundary>
      <FeasibilityLayout
        site={site}
        zoningControls={zoningControls}
        comps={DEMO_COMPS}
        unitRents={DEMO_UNIT_RENTS}
        unitMix={DEMO_UNIT_MIX}
        lodging={DEMO_LODGING}
        nearbyLodging={DEMO_NEARBY_LODGING}
        demographics={DEMO_MARKET_DEMOGRAPHICS}
        marketScore={DEMO_MARKET_SCORE}
        compBenchmark={compBenchmark}
      />
    </ErrorBoundary>
  )
}
