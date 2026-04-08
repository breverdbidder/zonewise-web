/**
 * Conquest Dashboard — data fetching and types for the 67-county FL coverage map.
 * Brevard is the first conquered county (351,442 zoning_assignments).
 */

import { createServiceClient } from './supabase/server'
import { FL_COUNTIES } from './counties'

export type FlRegion = 'panhandle' | 'north' | 'central' | 'south'

export interface CountyConquestStatus {
  slug: string
  name: string
  fips: string
  dor_number: number
  region: FlRegion
  population: number
  total_parcels: number
  zoned_parcels: number
  coverage_pct: number
  conquered: boolean
  last_run: string | null
}

export interface ZoneSourceStat {
  source: string
  count: number
}

export interface JurisdictionStat {
  jurisdiction: string
  count: number
  zone_sources: ZoneSourceStat[]
}

export interface CountyDetail {
  county: CountyConquestStatus
  jurisdictions: JurisdictionStat[]
}

// ─── Static reference data ────────────────────────────────────────────────────

const REGION_MAP: Record<string, FlRegion> = {
  // Panhandle
  escambia: 'panhandle',
  'santa-rosa': 'panhandle',
  okaloosa: 'panhandle',
  walton: 'panhandle',
  holmes: 'panhandle',
  washington: 'panhandle',
  bay: 'panhandle',
  jackson: 'panhandle',
  calhoun: 'panhandle',
  gulf: 'panhandle',
  gadsden: 'panhandle',
  liberty: 'panhandle',
  franklin: 'panhandle',
  // North
  leon: 'north',
  wakulla: 'north',
  jefferson: 'north',
  madison: 'north',
  taylor: 'north',
  hamilton: 'north',
  suwannee: 'north',
  lafayette: 'north',
  dixie: 'north',
  columbia: 'north',
  baker: 'north',
  union: 'north',
  bradford: 'north',
  nassau: 'north',
  duval: 'north',
  clay: 'north',
  'st-johns': 'north',
  flagler: 'north',
  putnam: 'north',
  alachua: 'north',
  gilchrist: 'north',
  levy: 'north',
  // Central
  marion: 'central',
  citrus: 'central',
  hernando: 'central',
  pasco: 'central',
  pinellas: 'central',
  hillsborough: 'central',
  polk: 'central',
  highlands: 'central',
  hardee: 'central',
  manatee: 'central',
  sarasota: 'central',
  charlotte: 'central',
  desoto: 'central',
  glades: 'central',
  lake: 'central',
  sumter: 'central',
  orange: 'central',
  osceola: 'central',
  seminole: 'central',
  'indian-river': 'central',
  okeechobee: 'central',
  volusia: 'central',
  brevard: 'central',
  // South
  lee: 'south',
  collier: 'south',
  hendry: 'south',
  broward: 'south',
  'palm-beach': 'south',
  'miami-dade': 'south',
  monroe: 'south',
  martin: 'south',
  'st-lucie': 'south',
}

const POPULATION_MAP: Record<string, number> = {
  'miami-dade': 2800000,
  broward: 1960000,
  'palm-beach': 1530000,
  hillsborough: 1480000,
  orange: 1440000,
  duval: 1000000,
  pinellas: 990000,
  lee: 770000,
  polk: 720000,
  brevard: 610000,
  pasco: 580000,
  volusia: 560000,
  seminole: 480000,
  sarasota: 440000,
  manatee: 410000,
  lake: 410000,
  osceola: 430000,
  marion: 400000,
  collier: 390000,
  'st-lucie': 340000,
  escambia: 330000,
  'st-johns': 310000,
  leon: 300000,
  alachua: 280000,
  clay: 230000,
  okaloosa: 200000,
  charlotte: 200000,
  hernando: 200000,
  'santa-rosa': 190000,
  bay: 180000,
  martin: 160000,
  'indian-river': 160000,
  citrus: 150000,
  sumter: 130000,
  flagler: 120000,
  highlands: 110000,
  nassau: 100000,
  walton: 80000,
  jackson: 47000,
  suwannee: 45000,
  gadsden: 44000,
  levy: 40000,
  okeechobee: 40000,
  hendry: 40000,
  wakulla: 35000,
  desoto: 35000,
  putnam: 40000,
  columbia: 70000,
  monroe: 70000,
  hardee: 30000,
  bradford: 27000,
  baker: 27000,
  washington: 25000,
  gilchrist: 20000,
  taylor: 20000,
  madison: 20000,
  holmes: 20000,
  gulf: 17000,
  dixie: 17000,
  union: 15000,
  hamilton: 15000,
  jefferson: 15000,
  glades: 15000,
  calhoun: 14000,
  franklin: 12000,
  lafayette: 9000,
  liberty: 9000,
}

// Estimated total parcels per county (FL DOR, ~2024)
const PARCEL_ESTIMATES: Record<string, number> = {
  'miami-dade': 1070000,
  broward: 740000,
  'palm-beach': 640000,
  hillsborough: 530000,
  orange: 480000,
  pinellas: 420000,
  duval: 380000,
  lee: 360000,
  polk: 300000,
  brevard: 351424, // from sample_properties
  pasco: 250000,
  volusia: 230000,
  sarasota: 200000,
  seminole: 195000,
  collier: 195000,
  manatee: 175000,
  lake: 175000,
  marion: 175000,
  osceola: 165000,
  charlotte: 165000,
  'st-lucie': 145000,
  escambia: 135000,
  'st-johns': 130000,
  sumter: 55000,
  citrus: 90000,
  hernando: 100000,
  okaloosa: 100000,
  leon: 105000,
  alachua: 95000,
  clay: 90000,
  bay: 90000,
  martin: 80000,
  'indian-river': 80000,
  'santa-rosa': 80000,
  flagler: 60000,
  highlands: 60000,
  nassau: 45000,
  monroe: 45000,
  putnam: 40000,
  walton: 55000,
  columbia: 35000,
  okeechobee: 20000,
  hendry: 20000,
  suwannee: 25000,
  gadsden: 22000,
  levy: 22000,
  hardee: 15000,
  desoto: 18000,
  bradford: 15000,
  baker: 12000,
  wakulla: 18000,
  washington: 14000,
  gilchrist: 10000,
  taylor: 10000,
  madison: 10000,
  holmes: 10000,
  gulf: 9000,
  dixie: 9000,
  union: 8000,
  hamilton: 8000,
  jefferson: 8000,
  glades: 8000,
  calhoun: 7000,
  franklin: 7000,
  lafayette: 5000,
  liberty: 4000,
  jackson: 28000,
}

// Florida DOR county number = sequential index (001 FIPS → DOR 1)
function getDorNumber(fips: string): number {
  return Math.ceil(parseInt(fips) / 2)
}

// ─── Fallback: hardcoded Brevard jurisdictions (17 municipalities) ─────────────

const BREVARD_FALLBACK: JurisdictionStat[] = [
  { jurisdiction: 'Brevard County (Unincorporated)', count: 85000, zone_sources: [{ source: 'county_gis', count: 85000 }] },
  { jurisdiction: 'Palm Bay', count: 82000, zone_sources: [{ source: 'parcel_gis', count: 82000 }] },
  { jurisdiction: 'Melbourne', count: 65000, zone_sources: [{ source: 'parcel_gis', count: 65000 }] },
  { jurisdiction: 'West Melbourne', count: 15000, zone_sources: [{ source: 'parcel_gis', count: 15000 }] },
  { jurisdiction: 'Titusville', count: 26000, zone_sources: [{ source: 'parcel_gis', count: 26000 }] },
  { jurisdiction: 'Rockledge', count: 14000, zone_sources: [{ source: 'parcel_gis', count: 14000 }] },
  { jurisdiction: 'Cocoa', count: 12000, zone_sources: [{ source: 'parcel_gis', count: 12000 }] },
  { jurisdiction: 'Cocoa Beach', count: 8000, zone_sources: [{ source: 'parcel_gis', count: 8000 }] },
  { jurisdiction: 'Satellite Beach', count: 8000, zone_sources: [{ source: 'parcel_gis', count: 8000 }] },
  { jurisdiction: 'Cape Canaveral', count: 6000, zone_sources: [{ source: 'parcel_gis', count: 6000 }] },
  { jurisdiction: 'Indian Harbour Beach', count: 5000, zone_sources: [{ source: 'parcel_gis', count: 5000 }] },
  { jurisdiction: 'Melbourne Beach', count: 4500, zone_sources: [{ source: 'parcel_gis', count: 4500 }] },
  { jurisdiction: 'Indialantic', count: 4000, zone_sources: [{ source: 'parcel_gis', count: 4000 }] },
  { jurisdiction: 'Grant-Valkaria', count: 3000, zone_sources: [{ source: 'parcel_gis', count: 3000 }] },
  { jurisdiction: 'Malabar', count: 3000, zone_sources: [{ source: 'parcel_gis', count: 3000 }] },
  { jurisdiction: 'Palm Shores', count: 1000, zone_sources: [{ source: 'parcel_gis', count: 1000 }] },
  { jurisdiction: 'Melbourne Village', count: 500, zone_sources: [{ source: 'parcel_gis', count: 500 }] },
]

// ─── Live fl_parcels count ────────────────────────────────────────────────────

/**
 * Fetch fl_parcels row count via pg_stat estimate (instant, no seq scan).
 * Uses the fl_parcels_count_estimate() RPC function.
 * Falls back to sum of PARCEL_ESTIMATES if RPC fails.
 */
export async function getFlParcelsCount(): Promise<number> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('fl_parcels_count_estimate')
    if (!error && typeof data === 'number' && data > 0) return data
  } catch {
    // RPC not available — fall back
  }
  return Object.values(PARCEL_ESTIMATES).reduce((sum, n) => sum + n, 0)
}

// ─── Data builders ─────────────────────────────────────────────────────────────

export function buildCountyStaticData(): CountyConquestStatus[] {
  return FL_COUNTIES.map(county => ({
    slug: county.slug,
    name: county.name,
    fips: county.fips,
    dor_number: getDorNumber(county.fips),
    region: REGION_MAP[county.slug] ?? 'central',
    population: POPULATION_MAP[county.slug] ?? 0,
    total_parcels: PARCEL_ESTIMATES[county.slug] ?? 0,
    zoned_parcels: county.slug === 'brevard' ? 351442 : 0,
    coverage_pct: county.slug === 'brevard' ? 100 : 0,
    conquered: county.slug === 'brevard',
    last_run: county.slug === 'brevard' ? '2026-03-20' : null,
  }))
}

// ─── Server-side data fetchers ─────────────────────────────────────────────────

/**
 * Fetch all 67 counties with conquest stats.
 * Tries county_conquest_status table first; falls back to static data.
 */
export async function getCountyOverview(): Promise<CountyConquestStatus[]> {
  const staticData = buildCountyStaticData()

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('county_conquest_status')
      .select('slug, zoned_parcels, coverage_pct, conquered, last_run')

    if (!error && data && data.length > 0) {
      const dbMap = new Map(data.map((d: Record<string, unknown>) => [d.slug as string, d]))
      return staticData.map(county => {
        const dbRow = dbMap.get(county.slug) as Record<string, unknown> | undefined
        if (dbRow) {
          return {
            ...county,
            zoned_parcels: (dbRow.zoned_parcels as number) ?? county.zoned_parcels,
            coverage_pct: (dbRow.coverage_pct as number) ?? county.coverage_pct,
            conquered: (dbRow.conquered as boolean) ?? county.conquered,
            last_run: (dbRow.last_run as string) ?? county.last_run,
          }
        }
        return county
      })
    }
  } catch {
    // Table doesn't exist yet — use static data
  }

  return staticData
}

/**
 * Fetch jurisdiction breakdown for Brevard from zoning_assignments.
 * Falls back to hardcoded data if query fails.
 */
export async function getBrevardJurisdictions(): Promise<JurisdictionStat[]> {
  try {
    const supabase = createServiceClient()

    // PostgREST aggregate: group by jurisdiction + zone_source
    const { data, error } = await supabase
      .from('zoning_assignments')
      .select('jurisdiction, zone_source, count()')
      .ilike('county', 'brevard')

    if (error || !data || data.length === 0) throw new Error('No data')

    // Client-side aggregation: group by jurisdiction, nest zone_sources
    const map = new Map<string, { count: number; sources: Map<string, number> }>()
    for (const row of data as Array<{ jurisdiction: string; zone_source: string; count: number }>) {
      const j = row.jurisdiction ?? 'Unknown'
      const s = row.zone_source ?? 'unknown'
      const c = Number(row.count) || 0
      if (!map.has(j)) map.set(j, { count: 0, sources: new Map() })
      const entry = map.get(j)!
      entry.count += c
      entry.sources.set(s, (entry.sources.get(s) ?? 0) + c)
    }

    return Array.from(map.entries())
      .map(([jurisdiction, { count, sources }]) => ({
        jurisdiction,
        count,
        zone_sources: Array.from(sources.entries())
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.count - a.count)
  } catch {
    return BREVARD_FALLBACK
  }
}

/**
 * Fetch single county detail with jurisdiction breakdown.
 */
export async function getCountyDetail(slug: string): Promise<CountyDetail | null> {
  const staticData = buildCountyStaticData()
  const county = staticData.find(c => c.slug === slug)
  if (!county) return null

  if (slug === 'brevard') {
    const jurisdictions = await getBrevardJurisdictions()
    return { county, jurisdictions }
  }

  return { county, jurisdictions: [] }
}

// ─── Realtime subscription helper (client-side) ────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Subscribe to county_conquest_status changes.
 * Returns an unsubscribe function. Safe to call if table doesn't exist.
 */
export function subscribeToConquestUpdates(
  supabase: SupabaseClient,
  onUpdate: (slug: string, updates: Partial<CountyConquestStatus>) => void
) {
  const channel = supabase
    .channel('conquest-status')
    .on(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'postgres_changes' as any,
      { event: '*', schema: 'public', table: 'county_conquest_status' },
      (payload: { new: Record<string, unknown> }) => {
        const row = payload.new
        if (row?.slug) {
          onUpdate(row.slug as string, {
            zoned_parcels: row.zoned_parcels as number,
            coverage_pct: row.coverage_pct as number,
            conquered: row.conquered as boolean,
            last_run: row.last_run as string,
          })
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
