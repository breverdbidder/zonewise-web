// ZoneWise.AI — Live parcel/zoning data for /feasibility
// Replaces DEMO_SITE / DEMO_ZONING_CONTROLS when a real parcel_id is present.
// Falls back to null (caller uses demo data) when the parcel isn't found.

import { createServiceClient } from '@/lib/supabase/server'
import type { SiteData, ZoningControl } from '@/types/feasibility'

export interface LiveSiteResult {
  site: SiteData
  zoningControls: ZoningControl[]
}

// zw_zoning currently has real ordinance detail (height/setbacks/FAR) for zero
// counties — every county's zoning_max_ht/zoning_setbacks columns are null as
// of Aug 2026 (verified via PostgREST). Where zw_zoning has no matching row,
// these dimensional controls fall back to a labeled generic assumption rather
// than a fabricated per-parcel ordinance citation.
const GENERIC_DIMENSIONAL_ASSUMPTION =
  'No jurisdiction-specific ordinance record found for this parcel in zw_zoning — showing a conservative statewide multifamily default, not a verified citation.'

function normalizePin(parcelId: string): string {
  return parcelId.replace(/[\s.\-]/g, '').toUpperCase()
}

export async function getLiveSiteData(parcelId: string): Promise<LiveSiteResult | null> {
  const supabase = createServiceClient()

  const { data: parcel, error } = await supabase
    .from('fl_parcels')
    .select('parcel_id, co_no, phy_addr1, phy_city, phy_zipcd, own_name, jv, lnd_sqfoot, zone_code, municipality, future_land_use, centroid_lat, centroid_lng, eff_yr_blt, act_yr_blt, no_res_unt, tot_lvg_ar')
    .eq('parcel_id', parcelId)
    .maybeSingle()

  if (error || !parcel) return null

  const [{ data: county }, { data: zw }] = await Promise.all([
    supabase.from('fl_counties').select('name').eq('co_no', parcel.co_no).maybeSingle(),
    supabase
      .from('zw_zoning')
      .select('zoning_code, zoning_desc, zoning_max_ht, zoning_min_lot, zoning_setbacks, zoning_jurisdiction, flu_code, source_url')
      .eq('co_no', parcel.co_no)
      .eq('pin_clean', normalizePin(parcelId))
      .maybeSingle(),
  ])

  const zoneCode = zw?.zoning_code || parcel.zone_code || 'Unknown'
  const countyName = county?.name || String(parcel.co_no)
  const jurisdiction = zw?.zoning_jurisdiction || parcel.municipality || `Unincorporated ${countyName}`

  const site: SiteData = {
    address: [parcel.phy_addr1, parcel.phy_city, 'FL', parcel.phy_zipcd].filter(Boolean).join(', ') || parcelId,
    parcelId: parcel.parcel_id,
    parcelValue: parcel.jv ?? 0,
    ownership: parcel.own_name || 'Unknown',
    zone: zoneCode,
    zoneCity: jurisdiction,
    county: countyName,
    zip: parcel.phy_zipcd || undefined,
    flood: 'X', // no per-parcel FEMA flood zone source wired in this pass
    qoz: 'No', // no per-parcel QOZ source wired in this pass
    lotArea: parcel.lnd_sqfoot ?? 0,
    // Dimensional controls: zw_zoning has no populated height/FAR/setback data
    // for any county yet (verified) — these are conservative multifamily
    // defaults, not per-parcel ordinance lookups. Surfaced honestly below.
    maxHeight: zw?.zoning_max_ht ?? 35,
    far: 2.0,
    coverage: 0.5,
    setFront: 25,
    setSide: 10,
    setRear: 20,
    parking: 1.5,
    yearBuilt: parcel.act_yr_blt || parcel.eff_yr_blt || 0,
    livingUnits: parcel.no_res_unt ?? 0,
    lat: parcel.centroid_lat ?? 0,
    lng: parcel.centroid_lng ?? 0,
  }

  const zoningControls: ZoningControl[] = [
    {
      control: 'Zone',
      value: zoneCode,
      assumption: zw?.zoning_code ? 'zw_zoning county zoning layer' : 'fl_parcels DOR/appraiser zone_code (zw_zoning has no match for this parcel)',
      citation: zw?.source_url || 'fl_parcels',
    },
    {
      control: 'Max Height',
      value: `${site.maxHeight} ft`,
      assumption: zw?.zoning_max_ht ? 'zw_zoning county zoning layer' : GENERIC_DIMENSIONAL_ASSUMPTION,
      citation: zw?.zoning_max_ht ? (zw.source_url || 'zw_zoning') : 'assumption',
    },
    {
      control: 'FAR',
      value: String(site.far),
      assumption: GENERIC_DIMENSIONAL_ASSUMPTION,
      citation: 'assumption',
    },
    {
      control: 'Lot Coverage',
      value: `${site.coverage * 100}%`,
      assumption: GENERIC_DIMENSIONAL_ASSUMPTION,
      citation: 'assumption',
    },
    {
      control: 'Front / Side / Rear Setback',
      value: `${site.setFront} / ${site.setSide} / ${site.setRear} ft`,
      assumption: GENERIC_DIMENSIONAL_ASSUMPTION,
      citation: 'assumption',
    },
    {
      control: 'Parking',
      value: `${site.parking}/unit`,
      assumption: GENERIC_DIMENSIONAL_ASSUMPTION,
      citation: 'assumption',
    },
  ]

  return { site, zoningControls }
}
