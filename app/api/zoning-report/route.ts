import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { parcelIdSchema, SECURITY_HEADERS } from '@/lib/validation'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ZoningReportData {
  parcel_id: string
  // Lot info
  lot_sqft: number | null
  lot_acres: number | null
  lot_type: string | null
  frontage_ft: number | null
  is_vacant: boolean | null
  legal_description: string | null
  // Existing property
  building_area_sqft: number | null
  use_code: string | null
  use_description: string | null
  year_built: number | null
  subdivision: string | null
  // Owner & valuation
  owner_name: string | null
  owner_address: string | null
  land_value: number | null
  building_value: number | null
  total_assessed_value: number | null
  homestead: boolean | null
  last_sale_date: string | null
  last_sale_price: number | null
  // Zoning
  zone_code: string | null
  zone_district: string | null
  zone_description: string | null
  jurisdiction: string | null
  municipal_code_url: string | null
  // Development capacity
  far: number | null
  max_height_ft: number | null
  lot_coverage_pct: number | null
  open_space_pct: number | null
  residential_density_du_acre: number | null
  max_building_area: number | null
  max_footprint: number | null
  max_units: number | null
  // Setbacks
  front_setback_ft: number | null
  side_setback_ft: number | null
  rear_setback_ft: number | null
  corner_setback_ft: number | null
  water_setback_ft: number | null
  // Permitted uses
  permitted_uses: PermittedUse[]
  // Media
  aerial_photo_url: string | null
  zoning_map_url: string | null
  // AI summary
  ai_summary: string | null
  // Market context
  median_home_value: number | null
  population_density: number | null
  vacancy_rate: number | null
}

interface PermittedUse {
  use_name: string
  category: string
  permission_type: 'by_right' | 'conditional' | 'not_permitted'
}

// ─── Parcel facts — normalized shape shared by both data sources ───────────────
interface ParcelFacts {
  source: 'fl_parcels' | 'brevard_gis'
  resolvedParcelId: string
  acres: number | null
  lotSqft: number | null
  livArea: number | null
  useCode: string | null
  useDescription: string | null
  isVacant: boolean | null
  legalDescription: string | null
  yearBuilt: number | null
  subdivision: string | null
  ownerName: string | null
  ownerAddress: string | null
  landValue: number | null
  buildingValue: number | null
  totalAssessedValue: number | null
  homestead: boolean | null
  lastSaleDate: string | null
  lastSalePrice: number | null
  municipality: string | null
  aerialPhotoUrl: string | null
}

// ─── fl_parcels (statewide, all 67 counties) ────────────────────────────────────
async function fetchFlParcel(
  supabase: ReturnType<typeof createServiceClient>,
  parcelId: string
): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .from('fl_parcels')
    .select(
      'parcel_id, co_no, dor_uc, pa_uc, jv, lnd_val, lnd_sqfoot, tot_lvg_ar, act_yr_blt, eff_yr_blt, ' +
        'own_name, own_addr1, own_city, own_state, own_zipcd, sale_prc1, sale_yr1, sale_mo1, ' +
        'jv_hmstd, jv_non_hms, municipality, photo_url'
    )
    .eq('parcel_id', parcelId)
    .maybeSingle()
  return data ?? null
}

function mapFlParcel(row: Record<string, unknown>, fallbackParcelId: string): ParcelFacts {
  const lndSqfoot = row.lnd_sqfoot != null ? Number(row.lnd_sqfoot) : null
  const jv = row.jv != null ? Number(row.jv) : null
  const lndVal = row.lnd_val != null ? Number(row.lnd_val) : null
  const saleYr = row.sale_yr1 != null ? Number(row.sale_yr1) : null
  const salePrc = row.sale_prc1 != null ? Number(row.sale_prc1) : null
  const jvHmstd = row.jv_hmstd != null ? Number(row.jv_hmstd) : null
  const jvNonHms = row.jv_non_hms != null ? Number(row.jv_non_hms) : null
  const useCode = (row.dor_uc as string | null) ?? (row.pa_uc as string | null) ?? null
  // FL DOR use codes: 00 = vacant residential, 10 = vacant commercial (verified against
  // fl_parcels live data — every dor_uc="000"/"010" row has tot_lvg_ar=0; dor_uc="001"
  // (single family) etc. do not). A naive "starts with 0" check is wrong: codes 01-09
  // (single family, mobile home, condo, co-op...) are all improved, not vacant.
  const useCodeNum = useCode != null ? parseInt(useCode, 10) : null

  return {
    source: 'fl_parcels',
    resolvedParcelId: (row.parcel_id as string | null) ?? fallbackParcelId,
    acres: lndSqfoot != null ? lndSqfoot / 43560 : null,
    lotSqft: lndSqfoot,
    livArea: row.tot_lvg_ar != null ? Number(row.tot_lvg_ar) : null,
    useCode,
    // fl_parcels stores only the raw DOR/PA use code, no description text — leave
    // honest-null rather than fabricate a label the way the Brevard layer provides one.
    useDescription: null,
    isVacant: useCodeNum != null && !Number.isNaN(useCodeNum) ? useCodeNum === 0 || useCodeNum === 10 : null,
    legalDescription: null, // not present in fl_parcels — Brevard-GIS-only field
    yearBuilt: row.act_yr_blt != null ? Number(row.act_yr_blt) : row.eff_yr_blt != null ? Number(row.eff_yr_blt) : null,
    subdivision: null, // not present in fl_parcels — Brevard-GIS-only field
    ownerName: (row.own_name as string | null) ?? null,
    ownerAddress:
      [row.own_addr1, row.own_city, row.own_state, row.own_zipcd].filter(Boolean).join(', ') || null,
    landValue: lndVal,
    buildingValue: jv != null && lndVal != null ? jv - lndVal : null,
    totalAssessedValue: jv,
    homestead: jvHmstd != null && jvNonHms != null ? jvHmstd > 0 : null,
    lastSaleDate:
      saleYr != null && saleYr > 0
        ? `${saleYr}-${String(row.sale_mo1 != null ? Number(row.sale_mo1) : 1).padStart(2, '0')}-01`
        : null,
    lastSalePrice: salePrc != null && salePrc > 0 ? salePrc : null,
    municipality: (row.municipality as string | null) ?? null,
    aerialPhotoUrl: (row.photo_url as string | null) ?? null,
  }
}

// ─── BCPAO GIS URL (Brevard-only fallback) ──────────────────────────────────────
const BCPAO_GIS_URL =
  'https://gis.brevardfl.gov/gissrv/rest/services/Base_Map/Parcel_New_WKID2881/MapServer/5/query'

async function fetchBcpaoGis(parcelId: string) {
  // Decode in case the ID arrived URL-encoded (e.g. "27%203701-50-7-4" → "27 3701-50-7-4")
  const decoded = decodeURIComponent(parcelId).trim()
  const isTaxAcct = /^\d+$/.test(decoded)
  // For TaxAcct (pure digits) use bare numeric equality; for DOR format preserve spaces/dashes
  // Use encodeURIComponent on the value inside the where string so spaces → %20 in the URL
  const where = isTaxAcct
    ? `TaxAcct=${decoded}`
    : `PARCEL_ID='${decoded}'`

  const params = new URLSearchParams({
    where,
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
    resultRecordCount: '1',
  })

  try {
    const res = await fetch(`${BCPAO_GIS_URL}?${params}`, {
      headers: { 'User-Agent': 'BidDeed.AI/2.0' },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const features = data?.features
    if (!Array.isArray(features) || features.length === 0) return null
    return features[0]?.attributes ?? null
  } catch {
    return null
  }
}

function mapBcpaoGis(gisAttrs: Record<string, unknown>, fallbackParcelId: string): ParcelFacts {
  const acres: number | null = gisAttrs?.ACRES != null ? Number(gisAttrs.ACRES) : null
  const taxAcct: string | null = gisAttrs?.TaxAcct != null ? String(gisAttrs.TaxAcct) : null

  return {
    source: 'brevard_gis',
    resolvedParcelId: (gisAttrs?.PARCEL_ID as string | null) ?? fallbackParcelId,
    acres,
    lotSqft: acres != null ? acres * 43560 : null,
    livArea: gisAttrs?.LIV_AREA != null ? Number(gisAttrs.LIV_AREA) : null,
    useCode: gisAttrs?.USE_CODE ? String(gisAttrs.USE_CODE) : null,
    useDescription: (gisAttrs?.USE_CODE_DESCRIPTION as string | null) ?? null,
    isVacant: gisAttrs?.USE_CODE != null ? String(gisAttrs.USE_CODE).startsWith('0') : null,
    legalDescription: (gisAttrs?.LEGAL_DESC as string | null) ?? null,
    yearBuilt: gisAttrs?.YEAR_BUILT != null ? Number(gisAttrs.YEAR_BUILT) : null,
    subdivision: (gisAttrs?.SUBDIVISION_NAME as string | null) ?? null,
    ownerName: (gisAttrs?.OWNER_NAME1 as string | null) ?? null,
    ownerAddress:
      [gisAttrs?.OWNER_STREET_NAME, gisAttrs?.OWNER_CITY, gisAttrs?.OWNER_STATE, gisAttrs?.OWNER_ZIP5]
        .filter(Boolean)
        .join(', ') || null,
    landValue: gisAttrs?.LAND_VALUE != null ? Number(gisAttrs.LAND_VALUE) : null,
    buildingValue: gisAttrs?.BLDG_VALUE != null ? Number(gisAttrs.BLDG_VALUE) : null,
    totalAssessedValue:
      gisAttrs?.LAND_VALUE != null && gisAttrs?.BLDG_VALUE != null
        ? Number(gisAttrs.LAND_VALUE) + Number(gisAttrs.BLDG_VALUE)
        : null,
    homestead: gisAttrs?.EXEMPTION_CODE ? String(gisAttrs.EXEMPTION_CODE).includes('H') : null,
    lastSaleDate: (gisAttrs?.SALE_DATE as string | null) ?? null,
    lastSalePrice: gisAttrs?.SALE_PRICE != null ? Number(gisAttrs.SALE_PRICE) : null,
    municipality: (gisAttrs?.CITY as string | null) ?? null,
    aerialPhotoUrl:
      taxAcct && taxAcct.length >= 4
        ? `/api/bcpao-photo?url=${encodeURIComponent(`https://www.bcpao.us/photos/${taxAcct.substring(0, 2)}/${taxAcct}011.jpg`)}`
        : null,
  }
}

async function generateAiSummary(reportData: Partial<ZoningReportData>): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const prompt = `You are a Florida real estate and zoning expert. Given the following parcel data, write a concise 3-4 sentence analysis of what can be built on this property, key opportunities, and constraints. Be specific with numbers. Do not use bullet points — write in clear prose.

Parcel: ${reportData.parcel_id}
Zone: ${reportData.zone_code ?? 'Unknown'} — ${reportData.zone_description ?? ''}
Lot: ${reportData.lot_acres != null ? reportData.lot_acres.toFixed(2) + ' acres' : 'unknown size'} (${reportData.lot_sqft != null ? Math.round(reportData.lot_sqft).toLocaleString() + ' sq ft' : '—'})
FAR: ${reportData.far ?? '—'} | Max Height: ${reportData.max_height_ft ?? '—'} ft | Lot Coverage: ${reportData.lot_coverage_pct ?? '—'}%
Max Building Area: ${reportData.max_building_area != null ? Math.round(reportData.max_building_area).toLocaleString() + ' sq ft' : '—'}
Max Units: ${reportData.max_units != null ? Math.round(reportData.max_units) : '—'}
Setbacks: Front ${reportData.front_setback_ft ?? '—'}ft / Side ${reportData.side_setback_ft ?? '—'}ft / Rear ${reportData.rear_setback_ft ?? '—'}ft
Use: ${reportData.use_description ?? 'Unknown'} | Vacant: ${reportData.is_vacant ? 'Yes' : 'No'}
Assessed Value: $${reportData.total_assessed_value != null ? reportData.total_assessed_value.toLocaleString() : '—'}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
        }),
        signal: AbortSignal.timeout(15_000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
  } catch {
    return null
  }
}

// ─── GET handler ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const rawParcelId = searchParams.get('parcelId')
    ? decodeURIComponent(searchParams.get('parcelId')!).trim()
    : undefined

  const parsed = parcelIdSchema.safeParse(rawParcelId)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parcelId' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }
  const parcelId = parsed.data

  try {
    const supabase = createServiceClient()

    // 1. fl_parcels (statewide, all 67 counties) is the primary source. Brevard's own
    //    external GIS is queried as a fallback for two cases: fl_parcels has no row for
    //    this parcel_id at all, or the row it does have is (verified live 2026-08-15)
    //    actually Brevard data mislabeled under the wrong co_no — see BREVARD_CO_NO_
    //    VALUES_IN_FL_PARCELS below. Either way Brevard GIS also naturally supplies the
    //    clean 404 for parcels that don't exist anywhere.
    //
    //    KNOWN DATA BUG (out of scope to fix here, flagged for a follow-up issue):
    //    fl_parcels.co_no is unreliable for at least Brevard/Broward/Dixie — e.g.
    //    co_no=15 ("Dixie" per fl_counties) holds ~348K rows whose municipality is
    //    Titusville/Palm Bay/Melbourne/Merritt Island/etc — i.e. Brevard, not Dixie —
    //    and the count (348,015) matches Brevard's known ~351K parcel total almost
    //    exactly. Real Dixie (Cross City) data lives under co_no=25 instead. The two
    //    canonical co_no values are trusted here (5 = correct label, 15 = confirmed
    //    mislabel) so a real Brevard parcel_id still prefers Brevard's richer GIS
    //    instead of silently regressing to the mislabeled fl_parcels row.
    const BREVARD_CO_NO_VALUES_IN_FL_PARCELS = [5, 15]

    const flParcelRow = await fetchFlParcel(supabase, parcelId)
    const flParcelLooksBrevard =
      flParcelRow != null && BREVARD_CO_NO_VALUES_IN_FL_PARCELS.includes(Number(flParcelRow.co_no))

    let facts: ParcelFacts | null
    if (flParcelRow && !flParcelLooksBrevard) {
      facts = mapFlParcel(flParcelRow, parcelId)
    } else {
      const gisAttrs = await fetchBcpaoGis(parcelId)
      facts = gisAttrs
        ? mapBcpaoGis(gisAttrs, parcelId)
        : flParcelRow
          ? mapFlParcel(flParcelRow, parcelId)
          : null
    }

    if (!facts) {
      return NextResponse.json(
        { error: 'Parcel not found', parcelId },
        { status: 404 }
      )
    }

    // Use the resolved PARCEL_ID (DOR format like "27 3701-50-7-4" for Brevard GIS,
    // or the fl_parcels parcel_id as-is) for the zoning_assignments lookup.
    const zoningParcelId = facts.resolvedParcelId

    const zoningAssignment = await supabase
      .from('zoning_assignments')
      .select('zone_code, jurisdiction')
      .eq('parcel_id', zoningParcelId)
      .maybeSingle()

    const zoneCode: string | null = zoningAssignment.data?.zone_code ?? null
    const jurisdiction: string | null = zoningAssignment.data?.jurisdiction ?? null
    // municipal_code_url column added by migration 011 — may not exist in all environments
    const assignmentMunicipalCodeUrl: string | null = null

    // 2. Fetch zoning district using the same pattern as the chatbot (direct table query by code)
    const zdRes = zoneCode
      ? await supabase
          .from('zoning_districts')
          .select('id, code, name, description')
          .eq('code', zoneCode)
          .limit(1)
          .single()
      : null

    const zd = zdRes?.data ?? null

    // 3. Fetch zone_standards + permitted_uses in parallel using zoning_district_id FK
    //    (same pattern as chatbot's fetchZoningByCode — select('*') then read actual column names)
    const [standardsRes, usesRes] = await Promise.all([
      zd?.id
        ? supabase
            .from('zone_standards')
            .select('*')
            .eq('zoning_district_id', zd.id)
            .limit(1)
            .single()
        : Promise.resolve({ data: null }),
      zd?.id
        ? supabase
            .from('permitted_uses')
            .select('use_description, use_type, is_commercial, is_industrial, is_single_family, is_multi_family, is_adu, use_category, requires_special_permit, requires_public_hearing')
            .eq('zoning_district_id', zd.id)
            .limit(50)
        : Promise.resolve({ data: [] }),
    ])

    // Map permitted_uses rows to the report's PermittedUse shape
    const districtRes = {
      data: zd ? { zone_district: zd.name, zone_description: zd.description } : null,
    }

    // zone_standards uses real column names (max_far, max_lot_coverage_pct, max_density_du_acre, etc.)
    const rawStandards = standardsRes.data as Record<string, unknown> | null
    const mappedStandards = rawStandards
      ? {
          far: rawStandards.max_far as number | null ?? null,
          max_height_ft: rawStandards.max_height_ft as number | null ?? null,
          lot_coverage_pct: rawStandards.max_lot_coverage_pct as number | null ?? null,
          open_space_pct: rawStandards.min_open_space_pct as number | null ?? null,
          residential_density_du_acre: rawStandards.max_density_du_acre as number | null ?? null,
          front_setback_ft: rawStandards.front_setback_ft as number | null ?? null,
          side_setback_ft: rawStandards.side_setback_ft as number | null ?? null,
          rear_setback_ft: rawStandards.rear_setback_ft as number | null ?? null,
          corner_setback_ft: rawStandards.corner_setback_ft as number | null ?? null,
          water_setback_ft: rawStandards.water_setback_ft as number | null ?? null,
        }
      : null

    const mappedUses: PermittedUse[] = ((usesRes.data ?? []) as Array<{
      use_description: string; use_type: string; is_commercial: boolean; is_industrial: boolean;
      is_single_family: boolean; is_multi_family: boolean; is_adu: boolean;
      use_category: string | null; requires_special_permit: boolean; requires_public_hearing: boolean;
    }>).map((u) => ({
      use_name: u.use_description,
      category: u.is_commercial ? 'commercial' : u.is_industrial ? 'industrial' : 'residential',
      permission_type: (u.use_type === 'prohibited'
        ? 'not_permitted'
        : (u.requires_special_permit || u.requires_public_hearing || u.use_type === 'conditional')
          ? 'conditional'
          : 'by_right') as 'by_right' | 'conditional' | 'not_permitted',
    }))

    // 4. Standards (now using mapped column names)
    const standards = mappedStandards
    const far: number | null = standards?.far ?? null
    const lotCoverage: number | null = standards?.lot_coverage_pct ?? null
    const density: number | null = standards?.residential_density_du_acre ?? null

    // 5. Derived fields
    const maxBuildingArea: number | null = far != null && facts.lotSqft != null ? far * facts.lotSqft : null
    const maxFootprint: number | null =
      lotCoverage != null && facts.lotSqft != null ? (lotCoverage / 100) * facts.lotSqft : null
    const maxUnits: number | null = density != null && facts.acres != null ? density * facts.acres : null

    // Jurisdiction default: Brevard-GIS branch keeps its historical hardcoded fallback;
    // fl_parcels branch falls back to the parcel's own municipality field per the goal.
    const jurisdictionFallback = facts.source === 'brevard_gis' ? 'Brevard County' : facts.municipality

    // 6. Assemble report
    const report: ZoningReportData = {
      parcel_id: parcelId,
      // Lot
      lot_sqft: facts.lotSqft,
      lot_acres: facts.acres,
      lot_type: facts.useDescription,
      frontage_ft: null, // not available from either source
      is_vacant: facts.isVacant,
      legal_description: facts.legalDescription,
      // Existing property
      building_area_sqft: facts.livArea,
      use_code: facts.useCode,
      use_description: facts.useDescription,
      year_built: facts.yearBuilt,
      subdivision: facts.subdivision,
      // Owner & valuation
      owner_name: facts.ownerName,
      owner_address: facts.ownerAddress,
      land_value: facts.landValue,
      building_value: facts.buildingValue,
      total_assessed_value: facts.totalAssessedValue,
      homestead: facts.homestead,
      last_sale_date: facts.lastSaleDate,
      last_sale_price: facts.lastSalePrice,
      // Zoning
      zone_code: zoneCode,
      zone_district: districtRes.data?.zone_district ?? null,
      zone_description: districtRes.data?.zone_description ?? null,
      jurisdiction: zoningAssignment.data?.jurisdiction ?? jurisdictionFallback,
      municipal_code_url: assignmentMunicipalCodeUrl ?? (jurisdiction ? `https://library.municode.com/fl/${jurisdiction}/codes/code_of_ordinances` : null),
      // Development capacity
      far,
      max_height_ft: standards?.max_height_ft ?? null,
      lot_coverage_pct: lotCoverage,
      open_space_pct: standards?.open_space_pct ?? null,
      residential_density_du_acre: density,
      max_building_area: maxBuildingArea,
      max_footprint: maxFootprint,
      max_units: maxUnits,
      // Setbacks
      front_setback_ft: standards?.front_setback_ft ?? null,
      side_setback_ft: standards?.side_setback_ft ?? null,
      rear_setback_ft: standards?.rear_setback_ft ?? null,
      corner_setback_ft: standards?.corner_setback_ft ?? null,
      water_setback_ft: standards?.water_setback_ft ?? null,
      // Permitted uses
      permitted_uses: mappedUses,
      // Media
      aerial_photo_url: facts.aerialPhotoUrl,
      zoning_map_url: null,
      // Market context (static placeholders — future: enrich from external API)
      median_home_value: null,
      population_density: null,
      vacancy_rate: null,
      // AI summary — generated last
      ai_summary: null,
    }

    // 7. Generate AI summary
    report.ai_summary = await generateAiSummary(report)

    return NextResponse.json(report, {
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500, headers: SECURITY_HEADERS })
  }
}
