// Shared zoning resolution — the same zoning_assignments -> zoning_districts ->
// zone_standards chain (with pattern-based fallback controls) that
// MassingEngine.tsx has always used client-side before invoking the site
// massing solver. Extracted so app/api/massing/rerun-capacity (server-side,
// #19152) can reuse it instead of re-implementing parcel/zoning resolution a
// third way.

export interface ZoningStandards {
  [key: string]: unknown
}

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ResolvedZoning {
  zone_code: string
  jurisdiction: string | null
  county: string | null
  co_no: number | null
  district_id: string
  district_name: string
  standards: ZoningStandards
  uses: { use_description: string; use_type: string }[]
  is_fallback: boolean
}

export const FALLBACK_CONTROLS: Record<string, {
  zone_name: string, max_height_ft: number, max_stories: number,
  front_setback_ft: number, side_setback_ft: number, rear_setback_ft: number,
  max_lot_coverage_pct: number, max_far: number, parking_per_unit: number,
  parking_per_1000sf: number, max_density_du_acre: number
}> = {
  // Single Family Residential
  SFR:          { zone_name: 'Single Family Residential', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
  'VAC-RES':    { zone_name: 'Vacant Residential', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
  'R-1A':       { zone_name: 'Single Family Residential A', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 6 },
  'R-1AA':      { zone_name: 'Single Family Residential AA', max_height_ft: 35, max_stories: 2, front_setback_ft: 30, side_setback_ft: 10, rear_setback_ft: 25, max_lot_coverage_pct: 35, max_far: 0.4, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 4 },
  R1AA:         { zone_name: 'Single Family Residential AA', max_height_ft: 35, max_stories: 2, front_setback_ft: 30, side_setback_ft: 10, rear_setback_ft: 25, max_lot_coverage_pct: 35, max_far: 0.4, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 4 },
  'R-1B':       { zone_name: 'Single Family Residential B', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 45, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
  R1B:          { zone_name: 'Single Family Residential B', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 45, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
  SRE:          { zone_name: 'Suburban Residential Estate', max_height_ft: 35, max_stories: 2, front_setback_ft: 30, side_setback_ft: 10, rear_setback_ft: 25, max_lot_coverage_pct: 35, max_far: 0.35, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 4 },
  RE:           { zone_name: 'Residential Estate', max_height_ft: 35, max_stories: 2, front_setback_ft: 35, side_setback_ft: 15, rear_setback_ft: 30, max_lot_coverage_pct: 30, max_far: 0.3, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 2 },
  REU:          { zone_name: 'Residential Estate Urban', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 6 },
  // Multifamily
  'MFR-CONDO':  { zone_name: 'Multi-Family Residential Condo', max_height_ft: 45, max_stories: 4, front_setback_ft: 20, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 60, max_far: 1.5, parking_per_unit: 1.5, parking_per_1000sf: 0, max_density_du_acre: 24 },
  TOWNHOUSE:    { zone_name: 'Townhouse Residential', max_height_ft: 40, max_stories: 3, front_setback_ft: 20, side_setback_ft: 0, rear_setback_ft: 15, max_lot_coverage_pct: 55, max_far: 1.2, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 16 },
  'RES-COMMON': { zone_name: 'Residential Common Area', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 10, rear_setback_ft: 20, max_lot_coverage_pct: 20, max_far: 0.2, parking_per_unit: 0, parking_per_1000sf: 0, max_density_du_acre: 0 },
  // PUD / Mixed
  PUD:          { zone_name: 'Planned Unit Development', max_height_ft: 60, max_stories: 5, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 65, max_far: 2.0, parking_per_unit: 1.5, parking_per_1000sf: 3.5, max_density_du_acre: 30 },
  // Transitional / Special
  'TR-3':       { zone_name: 'Transitional Residential 3', max_height_ft: 45, max_stories: 3, front_setback_ft: 20, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 50, max_far: 1.0, parking_per_unit: 1.5, parking_per_1000sf: 0, max_density_du_acre: 15 },
  // Commercial
  OFFICE:       { zone_name: 'Office', max_height_ft: 60, max_stories: 5, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 70, max_far: 2.5, parking_per_unit: 0, parking_per_1000sf: 3.33, max_density_du_acre: 0 },
  CP:           { zone_name: 'Commercial Professional', max_height_ft: 45, max_stories: 3, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 65, max_far: 2.0, parking_per_unit: 0, parking_per_1000sf: 4, max_density_du_acre: 0 },
  'C-CP':       { zone_name: 'Commercial Professional', max_height_ft: 45, max_stories: 3, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 65, max_far: 2.0, parking_per_unit: 0, parking_per_1000sf: 4, max_density_du_acre: 0 },
  // Institutional / Government
  'GOV-MUNI':   { zone_name: 'Government Municipal', max_height_ft: 60, max_stories: 4, front_setback_ft: 20, side_setback_ft: 15, rear_setback_ft: 20, max_lot_coverage_pct: 60, max_far: 1.5, parking_per_unit: 0, parking_per_1000sf: 3, max_density_du_acre: 0 },
  'SCHOOL-PUB': { zone_name: 'Public School', max_height_ft: 45, max_stories: 3, front_setback_ft: 30, side_setback_ft: 20, rear_setback_ft: 25, max_lot_coverage_pct: 50, max_far: 1.0, parking_per_unit: 0, parking_per_1000sf: 3, max_density_du_acre: 0 },
  // Agricultural
  ACREAGE:      { zone_name: 'Agricultural Acreage', max_height_ft: 35, max_stories: 2, front_setback_ft: 40, side_setback_ft: 15, rear_setback_ft: 30, max_lot_coverage_pct: 25, max_far: 0.2, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 1 },
  GML:          { zone_name: 'General Mixed Land', max_height_ft: 45, max_stories: 3, front_setback_ft: 20, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 60, max_far: 1.5, parking_per_unit: 1.5, parking_per_1000sf: 3.5, max_density_du_acre: 20 },
}

export function getFallbackControls(zoneCode: string) {
  const c = (zoneCode || '').toUpperCase().trim()
  if (FALLBACK_CONTROLS[c]) return FALLBACK_CONTROLS[c]
  if (c.startsWith('R-1') || c.startsWith('R1') || c.startsWith('RS')) return FALLBACK_CONTROLS['SFR']
  if (c.startsWith('R-2') || c.startsWith('R2')) return { ...FALLBACK_CONTROLS['SFR'], zone_name: 'Residential ' + c, max_density_du_acre: 10 }
  if (c.startsWith('R-3') || c.startsWith('R3') || c.startsWith('RM') || c.startsWith('MFR') || c.startsWith('RU-2')) return FALLBACK_CONTROLS['MFR-CONDO']
  if (c.startsWith('RU-1') || c.startsWith('RU-')) return { ...FALLBACK_CONTROLS['SFR'], zone_name: 'Rural Residential ' + c }
  if (c.startsWith('C-') || c.startsWith('BU') || c.startsWith('GU')) return FALLBACK_CONTROLS['OFFICE']
  if (c.startsWith('I-') || c.startsWith('M-')) return { ...FALLBACK_CONTROLS['OFFICE'], zone_name: 'Industrial ' + c, max_height_ft: 50, max_lot_coverage_pct: 70 }
  if (c.startsWith('PUD') || c.startsWith('MU') || c.startsWith('MXD')) return FALLBACK_CONTROLS['PUD']
  if (c.startsWith('AG') || c.startsWith('AU')) return FALLBACK_CONTROLS['ACREAGE']
  if (c.includes('MULTIPLE') || c.includes('MULTI')) return FALLBACK_CONTROLS['MFR-CONDO']
  return { ...FALLBACK_CONTROLS['SFR'], zone_name: 'Unknown Zone: ' + c }
}

/**
 * Resolves a parcel_id's zoning district + dimensional standards via
 * zoning_assignments -> zoning_districts -> zone_standards, falling back to
 * pattern-matched FALLBACK_CONTROLS when no zoning_districts row matches the
 * assigned zone code (same chain MassingEngine.tsx's handleSelect() has
 * always run client-side). Returns null only when there is no
 * zoning_assignments row at all for this parcel.
 */
export async function resolveZoningForParcel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  parcelId: string,
): Promise<ResolvedZoning | null> {
  const { data: za, error: e1 } = await supabase
    .from('zoning_assignments')
    .select('zone_code, jurisdiction, county, co_no')
    .eq('parcel_id', parcelId)
    .limit(1)
    .single()
  if (e1 || !za) return null

  const zoneCode = za.zone_code as string
  const { data: zd, error: e2 } = await supabase
    .from('zoning_districts')
    .select('id, code, name')
    .eq('code', zoneCode)
    .limit(1)
    .single()

  let standards: ZoningStandards
  let districtName: string
  let uses: { use_description: string; use_type: string }[]
  let districtId: string
  let isFallback = false

  if (e2 || !zd) {
    const fb = getFallbackControls(zoneCode)
    standards = fb as unknown as ZoningStandards
    districtName = fb.zone_name
    uses = []
    districtId = ''
    isFallback = true
  } else {
    const { data: zs } = await supabase
      .from('zone_standards')
      .select('*')
      .eq('zoning_district_id', zd.id)
      .limit(1)
      .single()

    const { data: pu } = await supabase
      .from('permitted_uses')
      .select('use_description, use_type')
      .eq('zoning_district_id', zd.id)
      .limit(20)

    // Matches the original inline behavior exactly: a matched zoning_districts
    // row with no zone_standards row yields standards={} (all solver defaults
    // apply via zoningStandardsToSolverInputs), not the FALLBACK_CONTROLS
    // pattern table — that table is reserved for the "no district match at
    // all" branch above.
    standards = (zs ?? {}) as ZoningStandards
    districtName = zd.name as string
    uses = pu ?? []
    districtId = zd.id as string
  }

  return {
    zone_code: zoneCode,
    jurisdiction: (za.jurisdiction as string) ?? null,
    county: (za.county as string) ?? null,
    co_no: (za.co_no as number) ?? null,
    district_id: districtId,
    district_name: districtName,
    standards,
    uses,
    is_fallback: isFallback,
  }
}

export interface SolverInputs {
  front: number
  side: number
  rear: number
  maxH: number
  maxCov: number
  far: number
  stories: number
  maxDensityDuAcre: number | undefined
}

/**
 * Maps a resolved zone_standards (or FALLBACK_CONTROLS) row to the setback/
 * height/coverage/FAR/density inputs site-massing-solver.ts needs — the same
 * defaults deriveMetrics() has always applied in MassingEngine.tsx.
 */
export function zoningStandardsToSolverInputs(s: ZoningStandards): SolverInputs {
  const front = (s.front_setback_ft as number) ?? (s.front_setback as number) ?? 25
  const side = (s.side_setback_ft as number) ?? (s.side_setback as number) ?? 7.5
  const rear = (s.rear_setback_ft as number) ?? (s.rear_setback as number) ?? 20
  const maxH = (s.max_height_ft as number) ?? 35
  const maxCov = (s.max_lot_coverage_pct as number) ?? (s.max_coverage_pct as number) ?? 40
  const far = (s.floor_area_ratio as number) ?? 0.5
  const stories = (s.max_stories as number) ?? Math.floor(maxH / 11) ?? 2
  const maxDensityDuAcre = (s.max_density_du_acre as number) ?? undefined
  return { front, side, rear, maxH, maxCov, far, stories, maxDensityDuAcre }
}
