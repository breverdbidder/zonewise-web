import { FeasibilityLayout } from '@/components/feasibility'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ParcelSearchBar } from '@/components/feasibility/ParcelSearchBar'
import { getLiveSiteData } from '@/lib/feasibility/live-data'
import { getLiveCompBenchmark } from '@/lib/feasibility/live-comps'
import { getRentalComps } from '@/lib/feasibility/live-rental-comps'
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

export const dynamic = 'force-dynamic'

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

  // Real rental comps (interim HomeHarvest/Realtor.com source, see
  // lib/feasibility/live-rental-comps.ts) — informational benchmark next to
  // the manual Unit Mix rents, same pattern as compBenchmark above. Only
  // fetched when a real parcel is present; demo path stays untouched.
  const rentalComps = live ? await getRentalComps({ county: site.county, zip: site.zip }) : null

  return (
    <ErrorBoundary>
      {/* Address entry. Without this the page always fell back to DEMO_SITE —
          ?parcel_id= was supported but unreachable from the UI.
          Bar brightened + highlighted per Ariel request Aug 16 2026: amber
          accent border/glow so it reads as the primary action, brighter
          placeholder/helper text so nothing on the dark bg goes dim. */}
      <div className="border-b-2 px-4 py-4 sm:px-6" style={{ borderColor: 'rgba(245,158,11,0.35)', background: '#020617', boxShadow: 'inset 0 -12px 24px -20px rgba(245,158,11,0.25)' }}>
        <div className="mx-auto max-w-3xl">
          <ParcelSearchBar currentAddress={live ? site.address : undefined} />
          {!live && (
            <p className="mt-2.5 text-center text-sm font-medium text-slate-300">
              Showing a sample site. Search any Florida address above to analyze a real parcel.
            </p>
          )}
        </div>
      </div>
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
        rentalComps={rentalComps}
      />
    </ErrorBoundary>
  )
}
