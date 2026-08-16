// ZoneWise.AI — Real rental comps for /feasibility DevelopTab revenue assumptions
//
// Interim/bootstrap source (Ariel, Aug 16 2026): HomeHarvest (Realtor.com scraper),
// ingested weekly into biddeed-cli's public.rental_listings
// (source='homeharvest_realtor_com', honesty_marker='INFERRED' — scraped, not
// MLS/Zillow/Redfin-licensed data). This is deliberately behind the
// getRentalComps() interface, not called directly from components, so a
// future swap to a licensed API (RentCast/Rentometer) only requires changing
// this file's implementation, not any call site.
//
// Informational only, same pattern as getLiveCompBenchmark: never silently
// overrides the Unit Mix table's manual rent assumptions in DevelopTab.

import { createServiceClient } from '@/lib/supabase/server'
import type { RentalComps } from '@/types/feasibility'

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// area: { county, zip } — county is a display name (e.g. "Brevard"), matched
// case-insensitively since rental_listings stores the lowercase/underscore
// slug convention (e.g. "brevard") used elsewhere in this schema.
export async function getRentalComps(area: { county?: string; zip?: string }): Promise<RentalComps | null> {
  const { county, zip } = area
  if (!county && !zip) return null

  const supabase = createServiceClient()
  let query = supabase
    .from('rental_listings')
    .select('bedrooms, rent_price')
    .eq('source', 'homeharvest_realtor_com')
    .not('rent_price', 'is', null)
    .not('bedrooms', 'is', null)
    .limit(500)

  if (zip) {
    query = query.eq('zip_code', zip)
  } else if (county) {
    query = query.ilike('county', county.trim().toLowerCase().replace(/\s+/g, '_'))
  }

  const { data, error } = await query
  if (error || !data || data.length === 0) return null

  const byBedroom = new Map<number, number[]>()
  for (const row of data) {
    const beds = Math.round(Number(row.bedrooms))
    const rent = Number(row.rent_price)
    if (!Number.isFinite(beds) || !Number.isFinite(rent) || rent <= 0) continue
    if (!byBedroom.has(beds)) byBedroom.set(beds, [])
    byBedroom.get(beds)!.push(rent)
  }

  const bedroomBreakdown = [...byBedroom.entries()]
    .map(([bedrooms, rents]) => ({ bedrooms, medianRent: Math.round(median(rents)), n: rents.length }))
    .sort((a, b) => a.bedrooms - b.bedrooms)

  if (bedroomBreakdown.length === 0) return null

  return {
    bedroomBreakdown,
    n: data.length,
    source: 'homeharvest_realtor_com',
  }
}
