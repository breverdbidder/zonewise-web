// ZoneWise.AI — Real sold-comp benchmark for /feasibility DevelopTab
// Source: v_brevard_td_sold_cma (Brevard-only tax-deed sold-price CMA).
// This is a SALE-price comp, not a rent comp — do not use it to derive unit
// rents (that would be fabricating a sale-to-rent conversion formula that
// isn't market-sourced). It's surfaced as a labeled real-data valuation
// benchmark instead. Gated on n_comps>0 per the issue's honesty guardrail —
// as of Aug 2026 that gate is verified to pass for 0 of 2,504 Brevard sold
// rows (upstream parcel_id join mismatch between pipeline.brevard_account_parcel
// and fl_parcels — a separate pipeline data-quality issue, out of scope here).

import { createServiceClient } from '@/lib/supabase/server'
import type { CompBenchmark } from '@/types/feasibility'

export async function getLiveCompBenchmark(parcelId: string, county: string): Promise<CompBenchmark | null> {
  if (county.toLowerCase() !== 'brevard') return null // view has zero coverage outside Brevard

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('v_brevard_td_sold_cma')
    .select('median_comp, n_comps, pct_of_market, sold_price, auction_date')
    .eq('parcel_id', parcelId)
    .gt('n_comps', 0)
    .maybeSingle()

  if (error || !data || data.median_comp == null) return null

  return {
    medianComp: data.median_comp,
    nComps: data.n_comps,
    pctOfMarket: data.pct_of_market,
    soldPrice: data.sold_price,
    auctionDate: data.auction_date,
  }
}
