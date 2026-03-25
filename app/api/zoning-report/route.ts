import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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

// ─── BCPAO GIS URL ─────────────────────────────────────────────────────────────
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
  const parcelId = searchParams.get('parcelId') ? decodeURIComponent(searchParams.get('parcelId')!).trim() : undefined

  if (!parcelId) {
    return NextResponse.json({ error: 'parcelId is required' }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()

    // 1. Fetch BCPAO GIS data in parallel with Supabase queries
    const [gisAttrs, zoningAssignment] = await Promise.all([
      fetchBcpaoGis(parcelId),
      supabase
        .from('zoning_assignments')
        .select('zone_code, jurisdiction')
        .eq('parcel_id', parcelId)
        .maybeSingle(),
    ])

    const zoneCode: string | null = zoningAssignment.data?.zone_code ?? null
    const jurisdiction: string | null = zoningAssignment.data?.jurisdiction ?? null

    // 2. Fetch zoning district + standards + permitted uses based on zone_code
    // Uses compatibility views (zoning_districts_by_code, zone_standards_by_code, permitted_uses_by_code)
    // created by migration 011_cp3_deep_zoning_intel.sql
    // Falls back to direct table queries with correct column names if views are unavailable
    const [districtRes, standardsRes, usesRes] = await Promise.all([
      zoneCode
        ? supabase
            .from('zoning_districts_by_code')
            .select('zone_district, zone_description')
            .eq('zone_code', zoneCode)
            .maybeSingle()
            .then(async (res) => {
              // Fallback: query zoning_districts directly using 'code' column
              if (res.error || !res.data) {
                return supabase
                  .from('zoning_districts')
                  .select('name, description')
                  .eq('code', zoneCode)
                  .maybeSingle()
                  .then((r) => ({
                    data: r.data ? { zone_district: r.data.name, zone_description: r.data.description } : null,
                  }))
              }
              return res
            })
        : Promise.resolve({ data: null }),
      zoneCode
        ? supabase
            .from('zone_standards_by_code')
            .select(
              'far, max_height_ft, lot_coverage_pct, open_space_pct, residential_density_du_acre, front_setback_ft, side_setback_ft, rear_setback_ft, corner_setback_ft, water_setback_ft'
            )
            .eq('zone_code', zoneCode)
            .maybeSingle()
            .then(async (res) => {
              // Fallback: join through zoning_districts
              if (res.error || !res.data) {
                const distLookup = await supabase
                  .from('zoning_districts')
                  .select('id')
                  .eq('code', zoneCode)
                  .limit(1)
                if (distLookup.data?.[0]?.id) {
                  return supabase
                    .from('zone_standards')
                    .select(
                      'max_far as far, max_height_ft, max_lot_coverage_pct as lot_coverage_pct, min_open_space_pct as open_space_pct, max_density_du_acre as residential_density_du_acre, front_setback_ft, side_setback_ft, rear_setback_ft, corner_setback_ft, water_setback_ft'
                    )
                    .eq('zoning_district_id', distLookup.data[0].id)
                    .maybeSingle()
                }
              }
              return res
            })
        : Promise.resolve({ data: null }),
      zoneCode
        ? supabase
            .from('permitted_uses_by_code')
            .select('use_name, category, permission_type')
            .eq('zone_code', zoneCode)
            .limit(50)
            .then(async (res) => {
              // Fallback: join through zoning_districts
              if (res.error || !res.data || res.data.length === 0) {
                const distLookup = await supabase
                  .from('zoning_districts')
                  .select('id')
                  .eq('code', zoneCode)
                  .limit(1)
                if (distLookup.data?.[0]?.id) {
                  return supabase
                    .from('permitted_uses')
                    .select('use_description, use_type, is_commercial, is_industrial, is_single_family, is_multi_family, is_adu, use_category, requires_special_permit, requires_public_hearing')
                    .eq('zoning_district_id', distLookup.data[0].id)
                    .limit(50)
                    .then((r) => ({
                      data: (r.data ?? []).map((u) => ({
                        use_name: u.use_description,
                        category: u.is_commercial ? 'commercial' : u.is_industrial ? 'industrial' : 'residential',
                        permission_type: u.use_type === 'prohibited' ? 'not_permitted'
                          : (u.requires_special_permit || u.requires_public_hearing || u.use_type === 'conditional') ? 'conditional'
                          : 'by_right',
                      })),
                    }))
                }
              }
              return res
            })
        : Promise.resolve({ data: [] }),
    ])

    // 3. Extract GIS attributes
    const acres: number | null = gisAttrs?.ACRES != null ? Number(gisAttrs.ACRES) : null
    const lotSqft: number | null = acres != null ? acres * 43560 : null
    const livArea: number | null = gisAttrs?.LIV_AREA != null ? Number(gisAttrs.LIV_AREA) : null
    const taxAcct: string | null = gisAttrs?.TaxAcct != null ? String(gisAttrs.TaxAcct) : null
    const aerialPhotoUrl =
      taxAcct && taxAcct.length >= 4
        ? `/api/bcpao-photo?url=${encodeURIComponent(`https://www.bcpao.us/photos/${taxAcct.substring(0, 2)}/${taxAcct}011.jpg`)}`
        : null

    // 4. Standards
    const standards = standardsRes.data
    const far: number | null = standards?.far ?? null
    const lotCoverage: number | null = standards?.lot_coverage_pct ?? null
    const density: number | null = standards?.residential_density_du_acre ?? null

    // 5. Derived fields
    const maxBuildingArea: number | null = far != null && lotSqft != null ? far * lotSqft : null
    const maxFootprint: number | null = lotCoverage != null && lotSqft != null ? (lotCoverage / 100) * lotSqft : null
    const maxUnits: number | null = density != null && acres != null ? density * acres : null

    // 6. Assemble report
    const report: ZoningReportData = {
      parcel_id: parcelId,
      // Lot
      lot_sqft: lotSqft,
      lot_acres: acres,
      lot_type: gisAttrs?.USE_CODE_DESCRIPTION ?? null,
      frontage_ft: null, // not in GIS layer 5
      is_vacant: gisAttrs?.USE_CODE != null ? String(gisAttrs.USE_CODE).startsWith('0') : null,
      legal_description: gisAttrs?.LEGAL_DESC ?? null,
      // Existing property
      building_area_sqft: livArea,
      use_code: gisAttrs?.USE_CODE ? String(gisAttrs.USE_CODE) : null,
      use_description: gisAttrs?.USE_CODE_DESCRIPTION ?? null,
      year_built: gisAttrs?.YEAR_BUILT != null ? Number(gisAttrs.YEAR_BUILT) : null,
      subdivision: gisAttrs?.SUBDIVISION_NAME ?? null,
      // Owner & valuation
      owner_name: gisAttrs?.OWNER_NAME1 ?? null,
      owner_address: [
        gisAttrs?.OWNER_STREET_NAME,
        gisAttrs?.OWNER_CITY,
        gisAttrs?.OWNER_STATE,
        gisAttrs?.OWNER_ZIP5,
      ]
        .filter(Boolean)
        .join(', ') || null,
      land_value: gisAttrs?.LAND_VALUE != null ? Number(gisAttrs.LAND_VALUE) : null,
      building_value: gisAttrs?.BLDG_VALUE != null ? Number(gisAttrs.BLDG_VALUE) : null,
      total_assessed_value:
        gisAttrs?.LAND_VALUE != null && gisAttrs?.BLDG_VALUE != null
          ? Number(gisAttrs.LAND_VALUE) + Number(gisAttrs.BLDG_VALUE)
          : null,
      homestead: gisAttrs?.EXEMPTION_CODE
        ? String(gisAttrs.EXEMPTION_CODE).includes('H')
        : null,
      last_sale_date: gisAttrs?.SALE_DATE ?? null,
      last_sale_price: gisAttrs?.SALE_PRICE != null ? Number(gisAttrs.SALE_PRICE) : null,
      // Zoning
      zone_code: zoneCode,
      zone_district: districtRes.data?.zone_district ?? null,
      zone_description: districtRes.data?.zone_description ?? null,
      jurisdiction: zoningAssignment.data?.jurisdiction ?? 'Brevard County',
      municipal_code_url: jurisdiction ? `https://library.municode.com/fl/${jurisdiction}/codes/code_of_ordinances` : null,
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
      permitted_uses: (usesRes.data ?? []) as PermittedUse[],
      // Media
      aerial_photo_url: aerialPhotoUrl,
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
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
