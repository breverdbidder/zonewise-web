export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// ─── BCPAO GIS ────────────────────────────────────────────────────────────────
const BCPAO_GIS_URL =
  'https://gis.brevardfl.gov/gissrv/rest/services/Base_Map/Parcel_New_WKID2881/MapServer/5/query'

async function fetchBcpaoGis(parcelId: string) {
  const isTaxAcct = /^\d+$/.test(parcelId.trim())
  const sanitized = parcelId.replace(/[^0-9A-Za-z \-*.]/g, '')
  const where = isTaxAcct ? `TaxAcct=${sanitized}` : `PARCEL_ID='${sanitized}'`

  const params = new URLSearchParams({
    where,
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
    resultRecordCount: '1',
  })

  const res = await fetch(`${BCPAO_GIS_URL}?${params}`, {
    headers: { 'User-Agent': 'ZoneWise.AI/2.0' },
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: 3600 },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data?.features?.[0]?.attributes ?? null
}

// ─── Supabase zoning fetch ────────────────────────────────────────────────────
async function fetchZoningData(parcelId: string) {
  const supabase = createServiceClient()

  // 1. zoning_assignments → get zone_code + district_id
  const { data: assignment } = await supabase
    .from('zoning_assignments')
    .select('zone_code, zoning_district_id, jurisdiction')
    .or(`parcel_id.eq.${parcelId},parcel_id.ilike.${parcelId.replace(/-/g, '%')}`)
    .limit(1)
    .maybeSingle()

  if (!assignment) return null

  // 2. zoning_districts
  const { data: district } = await supabase
    .from('zoning_districts')
    .select('*')
    .eq('id', assignment.zoning_district_id)
    .maybeSingle()

  // 3. zone_standards
  const { data: standards } = await supabase
    .from('zone_standards')
    .select('*')
    .eq('zoning_district_id', assignment.zoning_district_id)
    .limit(1)
    .maybeSingle()

  // 4. permitted_uses
  const { data: uses } = await supabase
    .from('permitted_uses')
    .select('use_description, use_type, use_category')
    .eq('zoning_district_id', assignment.zoning_district_id)

  return {
    zone_code: assignment.zone_code,
    jurisdiction: assignment.jurisdiction ?? 'Brevard County',
    district: district ?? null,
    standards: standards ?? null,
    permitted_uses: uses ?? [],
  }
}

// ─── Gemini AI analysis ───────────────────────────────────────────────────────
async function fetchGeminiAnalysis(context: {
  address: string
  zone_code: string
  zone_name: string
  acres: number | null
  standards: Record<string, unknown> | null
  permitted_uses: { use_description: string; use_type: string }[]
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return 'AI analysis unavailable — GEMINI_API_KEY not configured.'

  const prompt = `You are a licensed Florida real estate analyst. Provide a concise professional zoning analysis for this parcel.

Property: ${context.address}
Zone: ${context.zone_code} — ${context.zone_name}
Lot Size: ${context.acres ? `${context.acres.toFixed(2)} acres` : 'unknown'}
${context.standards ? `Max Height: ${context.standards.max_height_ft ?? 'N/A'} ft | FAR: ${context.standards.max_far ?? 'N/A'} | Max Coverage: ${context.standards.max_lot_coverage_pct ?? 'N/A'}%` : ''}
Permitted Uses (sample): ${context.permitted_uses.slice(0, 8).map(u => u.use_description).join(', ')}

Write 3 short paragraphs:
1. What you can build here (plain English, investor-focused)
2. Key development considerations and constraints
3. Top recommendation for highest-and-best use

Keep each paragraph under 60 words. No bullet points. Direct, professional tone.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(15_000),
      }
    )
    if (!res.ok) return 'AI analysis temporarily unavailable.'
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'AI analysis unavailable.'
  } catch {
    return 'AI analysis temporarily unavailable.'
  }
}

// ─── Development capacity calculator ─────────────────────────────────────────
function calcDevCapacity(acres: number | null, standards: Record<string, unknown> | null) {
  if (!acres || !standards) return null

  const sqft = acres * 43560
  const far = Number(standards.max_far ?? 0)
  const coverage = Number(standards.max_lot_coverage_pct ?? 0) / 100
  const density = Number(standards.max_density_du_acre ?? 0)
  const lodgingDensity = Number(standards.max_lodging_rooms_per_acre ?? 0)
  const maxHeightFt = Number(standards.max_height_ft ?? 0)
  const maxStories = Number(standards.max_stories ?? 0)

  const maxBuildingArea = far > 0 ? Math.round(far * sqft) : null
  const maxBuildingFootprint = coverage > 0 ? Math.round(coverage * sqft) : null
  const minOpenSpace = coverage > 0 ? Math.round((1 - coverage) * sqft) : null
  const maxResidentialUnits = density > 0 ? Math.floor(density * acres) : null
  const maxLodgingRooms = lodgingDensity > 0 ? Math.floor(lodgingDensity * acres) : null

  return {
    max_building_area_sqft: maxBuildingArea,
    max_height_stories: maxStories || null,
    max_height_ft: maxHeightFt || null,
    far: far || null,
    max_lot_coverage_pct: Number(standards.max_lot_coverage_pct ?? 0) || null,
    max_building_footprint_sqft: maxBuildingFootprint,
    min_open_space_sqft: minOpenSpace,
    residential_density_du_acre: density || null,
    max_residential_units: maxResidentialUnits,
    max_residential_area_sqft: maxResidentialUnits
      ? Math.round(maxResidentialUnits * 1400)
      : null,
    max_lodging_rooms: maxLodgingRooms,
    max_lodging_area_sqft: maxLodgingRooms ? Math.round(maxLodgingRooms * 400) : null,
    max_office_area_sqft: maxBuildingArea ? Math.round(maxBuildingArea * 0.4) : null,
    max_commercial_area_sqft: maxBuildingArea ? Math.round(maxBuildingArea * 0.6) : null,
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parcelId = searchParams.get('parcelId')?.trim()

  if (!parcelId) {
    return NextResponse.json({ error: 'parcelId is required' }, { status: 400 })
  }

  try {
    // Parallel fetch: BCPAO GIS + Supabase zoning
    const [gis, zoning] = await Promise.all([
      fetchBcpaoGis(parcelId),
      fetchZoningData(parcelId),
    ])

    if (!gis) {
      return NextResponse.json({ error: 'Parcel not found in BCPAO GIS' }, { status: 404 })
    }

    // ── Section 1: Lot Information ─────────────────────────────────────────
    const taxAcct = gis.TaxAcct != null ? String(gis.TaxAcct) : null
    const photoUrl = taxAcct && taxAcct.length >= 4
      ? `/api/bcpao-photo?url=${encodeURIComponent(`https://www.bcpao.us/photos/${taxAcct.substring(0, 2)}/${taxAcct}011.jpg`)}`
      : null

    const address = [
      gis.STREET_NUMBER,
      gis.STREET_DIRECTION_PREFIX,
      gis.STREET_NAME,
      gis.STREET_TYPE,
    ].filter(Boolean).join(' ')

    const lotInfo = {
      parcel_id: gis.PARCEL_ID ?? parcelId,
      tax_acct: taxAcct,
      address,
      city: gis.CITY ?? null,
      zip: gis.ZIP_CODE ?? null,
      acres: gis.ACRES ?? null,
      sqft: gis.ACRES ? Math.round(gis.ACRES * 43560) : null,
      lot_type: gis.USE_CODE ?? null,
      frontage_length: gis.FRONTAGE ?? null,
      vacant: gis.USE_CODE_DESCRIPTION?.toLowerCase().includes('vac') ?? false,
      legal_desc: gis.LEGAL_DESC ?? null,
      subdivision_name: gis.SUBDIVISION_NAME ?? null,
      plat_book: gis.PLAT_BOOK ?? null,
      plat_page: gis.PLAT_PAGE ?? null,
    }

    // ── Section 2: Existing Property ──────────────────────────────────────
    const existingProperty = {
      building_area_sqft: gis.LIV_AREA ?? null,
      existing_use: gis.USE_CODE_DESCRIPTION ?? null,
      use_code: gis.USE_CODE ?? null,
      year_built: gis.YEAR_BUILT ?? null,
      neighborhood: gis.NEIGHBORHOOD ?? null,
      number_of_units: gis.NO_UNITS ?? null,
    }

    // ── Section 3: Zoning Information ─────────────────────────────────────
    const zoningInfo = zoning
      ? {
          zone_code: zoning.zone_code,
          zoning_district: zoning.district?.district_name ?? zoning.zone_code,
          zoning_description: zoning.district?.description ?? null,
          jurisdiction: zoning.jurisdiction,
          additional_regulations: zoning.district?.additional_regulations ?? null,
          code_link: zoning.district?.code_link ?? null,
          is_fallback: false,
        }
      : {
          zone_code: gis.ZONING ?? 'Unknown',
          zoning_district: gis.ZONING ?? 'Unknown',
          zoning_description: null,
          jurisdiction: 'Brevard County',
          additional_regulations: null,
          code_link: null,
          is_fallback: true,
        }

    // ── Section 4: Development Capacity ───────────────────────────────────
    const devCapacity = calcDevCapacity(
      gis.ACRES ?? null,
      zoning?.standards ?? null
    )

    // ── Section 5: Setbacks ────────────────────────────────────────────────
    const s = zoning?.standards ?? {}
    const setbacks = {
      primary_frontage_ft: Number(s.front_setback_ft ?? s.front_setback ?? 0) || null,
      secondary_frontage_ft: Number(s.corner_setback_ft ?? 0) || null,
      side_ft: Number(s.side_setback_ft ?? s.side_setback ?? 0) || null,
      rear_ft: Number(s.rear_setback_ft ?? s.rear_setback ?? 0) || null,
      water_ft: Number(s.water_setback_ft ?? 0) || null,
    }

    // ── Section 6: Permitted Uses ──────────────────────────────────────────
    const useCategoryMap: Record<string, { right: string[]; warrant: string[]; exception: string[] }> = {}
    for (const u of (zoning?.permitted_uses ?? [])) {
      const cat = u.use_category ?? 'General'
      if (!useCategoryMap[cat]) useCategoryMap[cat] = { right: [], warrant: [], exception: [] }
      const type = (u.use_type ?? '').toLowerCase()
      if (type === 'warrant' || type === 'conditional') {
        useCategoryMap[cat].warrant.push(u.use_description)
      } else if (type === 'exception' || type === 'special') {
        useCategoryMap[cat].exception.push(u.use_description)
      } else {
        useCategoryMap[cat].right.push(u.use_description)
      }
    }

    // ── Section 8: AI Analysis ─────────────────────────────────────────────
    const aiAnalysis = await fetchGeminiAnalysis({
      address: `${address}, ${gis.CITY ?? ''} FL ${gis.ZIP_CODE ?? ''}`,
      zone_code: zoningInfo.zone_code,
      zone_name: zoningInfo.zoning_district,
      acres: gis.ACRES ?? null,
      standards: zoning?.standards ?? null,
      permitted_uses: zoning?.permitted_uses ?? [],
    })

    // ── Section 9: BCPAO Property Intelligence ─────────────────────────────
    const bcpaoIntel = {
      owner_name: [gis.OWNER_NAME1, gis.OWNER_NAME2].filter(Boolean).join(' / ') || null,
      mailing_address: gis.MAILING_ADDRESS ?? null,
      building_value: gis.BLDG_VALUE ?? null,
      land_value: gis.LAND_VALUE ?? null,
      total_assessed_value: (gis.BLDG_VALUE ?? 0) + (gis.LAND_VALUE ?? 0) || null,
      homestead_exemption: gis.HOMESTEAD_VALUE ?? null,
      subdivision_name: gis.SUBDIVISION_NAME ?? null,
      millage_code: gis.MILLAGE_CODE ?? null,
      exemption_code: gis.EXEMPTION_CODE ?? null,
    }

    // ── Section 10: 3D Massing Preview ────────────────────────────────────
    const massingPreview = {
      interactive_url: `/massing?parcel=${encodeURIComponent(parcelId)}`,
      static_preview_url: null as string | null,
      description: devCapacity
        ? `Up to ${devCapacity.max_height_stories ?? '?'} stories / ${devCapacity.max_height_ft ?? '?'} ft — ${devCapacity.max_building_area_sqft?.toLocaleString() ?? '?'} sq ft max GFA`
        : 'View interactive 3D building envelope',
    }

    // ── Section 11: ML Risk Score (placeholder) ───────────────────────────
    const mlRiskScore = {
      note: 'BidDeed.AI integration — coming soon',
      purchase_probability: null as number | null,
      foreclosure_risk: null as string | null,
      market_trend: null as string | null,
    }

    const report = {
      generated_at: new Date().toISOString(),
      parcel_id: parcelId,
      photo_url: photoUrl,
      sections: {
        lot_information: lotInfo,
        existing_property: existingProperty,
        zoning_information: zoningInfo,
        development_capacity: devCapacity,
        setbacks,
        permitted_uses: useCategoryMap,
        maps_visuals: {
          aerial_photo_url: photoUrl,
          zoning_map_url: null,
          mapbox_static_url: null,
        },
        ai_analysis: {
          summary: aiAnalysis,
          powered_by: 'Gemini 2.5 Flash',
        },
        bcpao_intelligence: bcpaoIntel,
        massing_preview: massingPreview,
        ml_risk_score: mlRiskScore,
      },
    }

    return NextResponse.json(report, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
