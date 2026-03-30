import { NextRequest, NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/server'
import { chatQuerySchema, sanitizeChatMessage, SECURITY_HEADERS } from '@/lib/validation'
import { resilientLLM } from '@/lib/llm-resilience'
import { logLLMCall } from '@/lib/llm-metrics'

// ─── CORS headers ─────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

// ─── Fallback zoning controls (mirrored from MassingEngine.tsx) ───────────────
const FALLBACK_CONTROLS: Record<string, {
  zone_name: string; max_height_ft: number; max_stories: number;
  front_setback_ft: number; side_setback_ft: number; rear_setback_ft: number;
  max_lot_coverage_pct: number; max_far: number; parking_per_unit: number;
  parking_per_1000sf: number; max_density_du_acre: number;
}> = {
  SFR:          { zone_name: 'Single Family Residential', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
  // NOTE: 'VAC-RES' removed — it is a BCPAO USE_CODE value, NOT a zoning designation.
  // Mapping it to development standards was producing fabricated data (35ft/2-story).
  'R-1A':       { zone_name: 'Single Family Residential A', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 6 },
  'R-1AA':      { zone_name: 'Single Family Residential AA', max_height_ft: 35, max_stories: 2, front_setback_ft: 30, side_setback_ft: 10, rear_setback_ft: 25, max_lot_coverage_pct: 35, max_far: 0.4, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 4 },
  'R1AA':       { zone_name: 'Single Family Residential AA', max_height_ft: 35, max_stories: 2, front_setback_ft: 30, side_setback_ft: 10, rear_setback_ft: 25, max_lot_coverage_pct: 35, max_far: 0.4, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 4 },
  'R-1B':       { zone_name: 'Single Family Residential B', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 45, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
  'R1B':        { zone_name: 'Single Family Residential B', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 45, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
  SRE:          { zone_name: 'Suburban Residential Estate', max_height_ft: 35, max_stories: 2, front_setback_ft: 30, side_setback_ft: 10, rear_setback_ft: 25, max_lot_coverage_pct: 35, max_far: 0.35, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 4 },
  RE:           { zone_name: 'Residential Estate', max_height_ft: 35, max_stories: 2, front_setback_ft: 35, side_setback_ft: 15, rear_setback_ft: 30, max_lot_coverage_pct: 30, max_far: 0.3, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 2 },
  REU:          { zone_name: 'Residential Estate Urban', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 6 },
  'MFR-CONDO':  { zone_name: 'Multi-Family Residential Condo', max_height_ft: 45, max_stories: 4, front_setback_ft: 20, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 60, max_far: 1.5, parking_per_unit: 1.5, parking_per_1000sf: 0, max_density_du_acre: 24 },
  TOWNHOUSE:    { zone_name: 'Townhouse Residential', max_height_ft: 40, max_stories: 3, front_setback_ft: 20, side_setback_ft: 0, rear_setback_ft: 15, max_lot_coverage_pct: 55, max_far: 1.2, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 16 },
  'RES-COMMON': { zone_name: 'Residential Common Area', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 10, rear_setback_ft: 20, max_lot_coverage_pct: 20, max_far: 0.2, parking_per_unit: 0, parking_per_1000sf: 0, max_density_du_acre: 0 },
  PUD:          { zone_name: 'Planned Unit Development', max_height_ft: 60, max_stories: 5, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 65, max_far: 2.0, parking_per_unit: 1.5, parking_per_1000sf: 3.5, max_density_du_acre: 30 },
  'TR-3':       { zone_name: 'Transitional Residential 3', max_height_ft: 45, max_stories: 3, front_setback_ft: 20, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 50, max_far: 1.0, parking_per_unit: 1.5, parking_per_1000sf: 0, max_density_du_acre: 15 },
  OFFICE:       { zone_name: 'Office', max_height_ft: 60, max_stories: 5, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 70, max_far: 2.5, parking_per_unit: 0, parking_per_1000sf: 3.33, max_density_du_acre: 0 },
  CP:           { zone_name: 'Commercial Professional', max_height_ft: 45, max_stories: 3, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 65, max_far: 2.0, parking_per_unit: 0, parking_per_1000sf: 4, max_density_du_acre: 0 },
  'C-CP':       { zone_name: 'Commercial Professional', max_height_ft: 45, max_stories: 3, front_setback_ft: 15, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 65, max_far: 2.0, parking_per_unit: 0, parking_per_1000sf: 4, max_density_du_acre: 0 },
  'GOV-MUNI':   { zone_name: 'Government Municipal', max_height_ft: 60, max_stories: 4, front_setback_ft: 20, side_setback_ft: 15, rear_setback_ft: 20, max_lot_coverage_pct: 60, max_far: 1.5, parking_per_unit: 0, parking_per_1000sf: 3, max_density_du_acre: 0 },
  'SCHOOL-PUB': { zone_name: 'Public School', max_height_ft: 45, max_stories: 3, front_setback_ft: 30, side_setback_ft: 20, rear_setback_ft: 25, max_lot_coverage_pct: 50, max_far: 1.0, parking_per_unit: 0, parking_per_1000sf: 3, max_density_du_acre: 0 },
  ACREAGE:      { zone_name: 'Agricultural Acreage', max_height_ft: 35, max_stories: 2, front_setback_ft: 40, side_setback_ft: 15, rear_setback_ft: 30, max_lot_coverage_pct: 25, max_far: 0.2, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 1 },
  GML:          { zone_name: 'General Mixed Land', max_height_ft: 45, max_stories: 3, front_setback_ft: 20, side_setback_ft: 10, rear_setback_ft: 15, max_lot_coverage_pct: 60, max_far: 1.5, parking_per_unit: 1.5, parking_per_1000sf: 3.5, max_density_du_acre: 20 },
}

function getFallbackControls(zoneCode: string) {
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
  // Unknown zone code — no basis for fabricating development standards
  return null
}

// ─── Intent classification ────────────────────────────────────────────────────
type Intent = 'ADDRESS_LOOKUP' | 'ZONE_QUESTION' | 'PERMITTED_USE' | 'CAPACITY' | 'COMPARISON' | 'GENERAL'

function classifyIntent(message: string): Intent {
  const m = message.toLowerCase()
  if (/\d+\s+\w+\s+(dr|drive|ln|lane|ave|avenue|blvd|boulevard|st|street|rd|road|ct|court|way|cir|circle|pl|place|terr|terrace|trail|pkwy|parkway|hwy|highway|cswy|causeway|cr|sr)\b/i.test(message)) {
    return 'ADDRESS_LOOKUP'
  }
  if (/\b(r-1|r-2|r-3|r-4|r-1a|r-1aa|r-1b|r-3a|rm-|mfr|sfr|bu-|c-|pud|re\b|reu|sre|tr-|office|cp|gml|acreage|townhouse)\b/i.test(message)) {
    return 'ZONE_QUESTION'
  }
  if (/can i build|is .+ allowed|permitted use|allowed use|can i put|can i operate|is .+ permitted/i.test(m)) {
    return 'PERMITTED_USE'
  }
  if (/how many unit|how tall|max height|how high|maximum height|density|floor area|far\b|lot coverage|how much can i build|what can i build/i.test(m)) {
    return 'CAPACITY'
  }
  if (/difference between|compare|vs\.?|versus/i.test(m)) {
    return 'COMPARISON'
  }
  return 'GENERAL'
}

function extractZoneCode(message: string): string | null {
  const match = message.match(/\b(R-1AA?|R-1B|R-[1-9]\w*|RM-?\w*|MFR-?\w*|SFR|RE\b|REU|SRE|BU-\w+|C-\w+|PUD\w*|TR-\w+|GML|ACREAGE|CP|OFFICE|TOWNHOUSE|GOV-MUNI|SCHOOL-PUB)\b/i)
  return match ? match[1].toUpperCase() : null
}

// ─── Street type normalization map ───────────────────────────────────────────
const STREET_TYPE_MAP: Record<string, string> = {
  street: 'st', drive: 'dr', lane: 'ln', avenue: 'ave',
  boulevard: 'blvd', road: 'rd', court: 'ct', circle: 'cir',
  place: 'pl', terrace: 'ter', parkway: 'pkwy', highway: 'hwy',
  causeway: 'cswy',
}

// Abbreviation-only map for GIS street type normalization (matches GIS STREET_TYPE field values)
const GIS_STREET_TYPE_ABBR: Record<string, string> = {
  street: 'st', drive: 'dr', lane: 'ln', avenue: 'ave',
  boulevard: 'blvd', road: 'rd', court: 'ct', circle: 'cir',
  place: 'pl', way: 'way', trail: 'trl', terrace: 'ter',
}

function normalizeStreetType(addr: string): string {
  let normalized = addr.toUpperCase()
  for (const [full, abbr] of Object.entries(STREET_TYPE_MAP)) {
    const re = new RegExp(`\\b${full}\\b`, 'gi')
    normalized = normalized.replace(re, abbr.toUpperCase())
  }
  return normalized
}

function extractAddress(message: string): string | null {
  // Extract street address ONLY (number + name + type). Stop at street type suffix.
  // Do NOT capture city — city is extracted separately by extractCity().
  // "1600 S Orlando Ave Cocoa Beach" → "1600 S Orlando Ave" (not "1600 S Orlando Ave Cocoa Beach")
  const match = message.match(/(\d+\s+[\w\s]+?(?:boulevard|causeway|parkway|highway|terrace|avenue|street|circle|court|drive|place|trail|lane|road|way|blvd|cswy|pkwy|hwy|ter|trl|ave|cir|ct|dr|pl|st|ln|rd|cr|sr))\b/i)
  return match ? match[1].trim() : null
}

// ─── Supabase data fetchers ───────────────────────────────────────────────────
interface ZoningContext {
  parcel: {
    parcel_id: string; address: string; acres: number | null;
    use_code: string | null; use_description: string | null; city: string | null;
    owner_name?: string | null; bldg_value?: number | null; land_value?: number | null;
    liv_area?: number | null; tax_acct?: number | null;
    _source?: 'supabase' | 'bcpao_gis';
  } | null
  zoning: {
    zone_code: string; jurisdiction: string | null;
    district_name: string; zone_description?: string | null;
    standards: Record<string, unknown>;
    permitted_uses: { use_description: string; use_type: string }[];
    isFallback: boolean;
  } | null
  error: string | null
}

// ─── City extractor ───────────────────────────────────────────────────────────
// FIX 1: Full Brevard County city list (case-insensitive). Multi-word cities listed first
// so they match before their substrings (e.g. "Satellite Beach" before "Melbourne Beach").
const BREVARD_CITIES = [
  'satellite beach', 'cocoa beach', 'indian harbour beach', 'melbourne beach',
  'west melbourne', 'cape canaveral', 'merritt island', 'barefoot bay',
  'palm bay', 'titusville', 'rockledge', 'indialantic', 'sebastian',
  'melbourne', 'cocoa', 'viera', 'suntree', 'malabar', 'grant', 'micco',
  'mims', 'brevard',
]

function extractCity(message: string): string | null {
  const lower = message.toLowerCase()
  // Longest / most-specific cities are first in the list — return on first match
  for (const city of BREVARD_CITIES) {
    if (lower.includes(city)) return city
  }
  return null
}

// ─── BCPAO GIS fallback ───────────────────────────────────────────────────────
// Covers all 350K+ Brevard parcels. Queried when Supabase sample_properties misses.
const BCPAO_GIS_URL =
  'https://gis.brevardfl.gov/gissrv/rest/services/Base_Map/Parcel_New_WKID2881/MapServer/5/query'

interface BCPAOFeatureAttributes {
  PARCEL_ID: string
  STREET_NUMBER: string
  STREET_NAME: string
  STREET_TYPE: string
  CITY: string
  ZIP_CODE: string
  ACRES: number
  USE_CODE: string
  USE_CODE_DESCRIPTION: string
  OWNER_NAME1: string
  BLDG_VALUE: number
  LAND_VALUE: number
  LIV_AREA: number
  TaxAcct: number
}

// FIX 2: Improved street-part parser.
// Input:  "625 Ocean Street Satellite Beach"
// Output: { num: "625", name: "OCEAN", streetType: "ST", city: "SATELLITE BEACH" }
// The street type suffix (Street/St/Ave/…) is stripped from the name so we get an
// exact match against the GIS STREET_NAME field (which never includes the type).
const STREET_TYPE_SUFFIXES: Record<string, string> = {
  street: 'ST', st: 'ST',
  avenue: 'AVE', ave: 'AVE',
  boulevard: 'BLVD', blvd: 'BLVD',
  drive: 'DR', dr: 'DR',
  road: 'RD', rd: 'RD',
  lane: 'LN', ln: 'LN',
  court: 'CT', ct: 'CT',
  way: 'WAY',
  place: 'PL', pl: 'PL',
  circle: 'CIR', cir: 'CIR',
  terrace: 'TER', ter: 'TER', terr: 'TER',
  trail: 'TRL', trl: 'TRL',
  parkway: 'PKWY', pkwy: 'PKWY',
  highway: 'HWY', hwy: 'HWY',
  causeway: 'CSWY', cswy: 'CSWY',
}

function parseStreetParts(address: string, detectedCity?: string | null): {
  num: string; name: string; streetType: string | null
} | null {
  // Extract street number and everything after it (before any comma)
  const m = address.trim().match(/^(\d+)\s+(.+?)(?:\s*,.*)?$/)
  if (!m) return null
  const num = m[1]
  const rest = m[2].trim()

  // Tokenise the remaining portion (uppercased)
  const tokens = rest.toUpperCase().split(/\s+/)

  // If a city was detected, strip matching city tokens from the tail of the token list
  let cityTokenCount = 0
  if (detectedCity) {
    const cityTokens = detectedCity.toUpperCase().split(/\s+/)
    const tail = tokens.slice(tokens.length - cityTokens.length)
    if (tail.join(' ') === cityTokens.join(' ')) {
      cityTokenCount = cityTokens.length
    }
  }
  const streetTokens = tokens.slice(0, tokens.length - cityTokenCount)

  // The last token of streetTokens may be the street type suffix
  let streetType: string | null = null
  if (streetTokens.length >= 2) {
    const lastTok = streetTokens[streetTokens.length - 1].toLowerCase()
    if (STREET_TYPE_SUFFIXES[lastTok]) {
      streetType = STREET_TYPE_SUFFIXES[lastTok]
      streetTokens.pop()
    }
  }

  // Strip directional prefix (N/S/E/W/NE/NW/SE/SW/NORTH/SOUTH/EAST/WEST) from the
  // first token — BCPAO GIS STREET_NAME does NOT include directional prefixes.
  // e.g. "S ORLANDO" → "ORLANDO", "NE PALM" → "PALM"
  // FIX: Strip directional prefixes before GIS query (N/S/E/W/NE/NW/SE/SW)
  const DIRECTIONAL_PREFIXES = new Set(['N','S','E','W','NE','NW','SE','SW','NORTH','SOUTH','EAST','WEST'])
  if (streetTokens.length >= 2 && DIRECTIONAL_PREFIXES.has(streetTokens[0])) {
    streetTokens.shift()
  }

  // Everything remaining is the street name (join with space for multi-word names)
  const name = streetTokens.join(' ')
  return { num, name, streetType }
}

async function fetchFromBCPAOGIS(address: string, detectedCity?: string | null): Promise<ZoningContext['parcel']> {
  try {
    // FIX 2+4: Pass detectedCity so parseStreetParts can strip city tokens from the tail
    const parts = parseStreetParts(address, detectedCity)
    if (!parts) return null

    // FIX 4: Exact match on STREET_NAME (no LIKE wildcard) — prevents cross-city false matches.
    // Add AND CITY LIKE '%…%' when a city is known.
    let where = `STREET_NUMBER='${parts.num}' AND STREET_NAME='${parts.name}'`
    if (detectedCity) {
      where += ` AND CITY LIKE '%${detectedCity.toUpperCase()}%'`
    }

    const params = new URLSearchParams({
      where,
      outFields: 'PARCEL_ID,STREET_NUMBER,STREET_NAME,STREET_TYPE,CITY,ZIP_CODE,ACRES,USE_CODE,USE_CODE_DESCRIPTION,OWNER_NAME1,BLDG_VALUE,LAND_VALUE,LIV_AREA,TaxAcct',
      returnGeometry: 'false',
      f: 'json',
      resultRecordCount: '5',
    })

    const res = await fetch(`${BCPAO_GIS_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null

    const json = await res.json()
    const features: { attributes: BCPAOFeatureAttributes }[] = json?.features ?? []
    if (features.length === 0) return null

    const a = features[0].attributes
    const streetAddr = `${a.STREET_NUMBER} ${a.STREET_NAME} ${a.STREET_TYPE}`.trim()
    const city = (a.CITY ?? '').trim()
    const zip = (a.ZIP_CODE ?? '').trim()
    const fullAddress = [streetAddr, city, zip].filter(Boolean).join(', ')

    return {
      parcel_id: a.PARCEL_ID,
      address: fullAddress,
      acres: a.ACRES ?? null,
      use_code: a.USE_CODE ?? null,
      use_description: (a.USE_CODE_DESCRIPTION ?? '').trim() || null,
      city: city || null,
      owner_name: (a.OWNER_NAME1 ?? '').trim() || null,
      bldg_value: a.BLDG_VALUE ?? null,
      land_value: a.LAND_VALUE ?? null,
      liv_area: a.LIV_AREA ?? null,
      tax_acct: a.TaxAcct ?? null,
      _source: 'bcpao_gis',
    }
  } catch {
    return null
  }
}

async function fetchZoningByAddress(address: string, originalMessage?: string): Promise<ZoningContext> {
  const supabase = createAnonClient()
  try {
    // Normalize address — convert full street type words to abbreviations, uppercase
    let normalizedAddr = normalizeStreetType(address)

    // FIX: Strip directional prefixes (N/S/E/W) from normalized address BEFORE any query.
    // BCPAO and sample_properties store "1600 ORLANDO AVE" not "1600 S ORLANDO AVE".
    // This fix applies to ALL lookup attempts, not just GIS.
    const addrParts = normalizedAddr.trim().split(/\s+/)
    const DIRS = new Set(['N','S','E','W','NE','NW','SE','SW','NORTH','SOUTH','EAST','WEST'])
    if (addrParts.length >= 3 && /^\d+$/.test(addrParts[0]) && DIRS.has(addrParts[1].toUpperCase())) {
      normalizedAddr = addrParts[0] + ' ' + addrParts.slice(2).join(' ')
    }

    // FIX 3: Extract city upfront from the original message so we can filter from the
    // very first Supabase query rather than only as a last-resort fallback.
    const detectedCity = originalMessage ? extractCity(originalMessage) : null

    // Attempt 1: search with normalized address (+ city filter when known)
    let query1 = supabase
      .from('sample_properties')
      .select('parcel_id, address, acres, use_code, use_description, city')
      .ilike('address', `%${normalizedAddr}%`)
    if (detectedCity) query1 = query1.ilike('city', `%${detectedCity}%`)
    let { data: parcels } = await query1.limit(5)

    // Attempt 2: fallback — search with street number + first word of street name (+ city)
    if (!parcels || parcels.length === 0) {
      const parts = normalizedAddr.trim().split(/\s+/)
      if (parts.length >= 2) {
        const shortSearch = `%${parts[0]} ${parts[1]}%`
        let query2 = supabase
          .from('sample_properties')
          .select('parcel_id, address, acres, use_code, use_description, city')
          .ilike('address', shortSearch)
        if (detectedCity) query2 = query2.ilike('city', `%${detectedCity}%`)
        const result = await query2.limit(5)
        parcels = result.data
      }
    }

    // Attempt 2b: if city-filtered attempts yield nothing, retry without city constraint
    // (guards against city field inconsistencies in the sample_properties table)
    if ((!parcels || parcels.length === 0) && detectedCity) {
      const parts = normalizedAddr.trim().split(/\s+/)
      const shortSearch = parts.length >= 2 ? `%${parts[0]} ${parts[1]}%` : `%${normalizedAddr}%`
      const result = await supabase
        .from('sample_properties')
        .select('parcel_id, address, acres, use_code, use_description, city')
        .ilike('address', shortSearch)
        .limit(5)
      parcels = result.data
    }

    // Attempt 3: BCPAO GIS fallback — covers all 350K+ Brevard parcels.
    // FIX 4: Pass detectedCity so the GIS query uses exact STREET_NAME + CITY filter.
    if (!parcels || parcels.length === 0) {
      const gisParcel = await fetchFromBCPAOGIS(address, detectedCity)
      if (!gisParcel) {
        return { parcel: null, zoning: null, error: `No parcels found for "${address}"` }
      }
      // Try zoning lookup via zoning_assignments — may not have a match for every parcel
      const zoningCtx = await fetchZoningByParcel(gisParcel.parcel_id)
      // Return parcel data even if zoning is missing so PropertyCard can render
      return { parcel: gisParcel, zoning: zoningCtx.zoning, error: zoningCtx.error }
    }

    const parcel = parcels[0]
    const zoningCtx = await fetchZoningByParcel(parcel.parcel_id)
    return { parcel, ...zoningCtx }
  } catch (e) {
    return { parcel: null, zoning: null, error: `Database error: ${e instanceof Error ? e.message : 'unknown'}` }
  }
}

async function fetchZoningByParcel(parcelId: string): Promise<{ zoning: ZoningContext['zoning']; error: string | null }> {
  const supabase = createAnonClient()
  try {
    const { data: za } = await supabase
      .from('zoning_assignments')
      .select('zone_code, jurisdiction')
      .eq('parcel_id', parcelId)
      .limit(1)
      .single()

    if (!za) return { zoning: null, error: 'No zoning assignment found for this parcel' }

    return fetchZoningByCode(za.zone_code, za.jurisdiction)
  } catch (e) {
    return { zoning: null, error: `Zoning lookup failed: ${e instanceof Error ? e.message : 'unknown'}` }
  }
}

async function fetchZoningByCode(zoneCode: string, jurisdiction?: string | null): Promise<{ zoning: ZoningContext['zoning']; error: string | null }> {
  const supabase = createAnonClient()
  try {
    const { data: zd } = await supabase
      .from('zoning_districts')
      .select('id, code, name, description')
      .eq('code', zoneCode)
      .limit(1)
      .single()

    if (!zd) {
      const fb = getFallbackControls(zoneCode)
      // If getFallbackControls returns null, this is a truly unknown code (e.g. a BCPAO
      // use-code like VAC-RES that was mistakenly stored as a zoning designation).
      // Return no-zoning so buildContextString injects the "NO ZONING DATA AVAILABLE" block.
      if (!fb) {
        return { zoning: null, error: `No zoning data available for code: ${zoneCode}` }
      }
      return {
        zoning: {
          zone_code: zoneCode,
          jurisdiction: jurisdiction ?? null,
          district_name: fb.zone_name,
          standards: fb as unknown as Record<string, unknown>,
          permitted_uses: [],
          isFallback: true,
        },
        error: null,
      }
    }

    const [{ data: zs }, { data: pu }] = await Promise.all([
      supabase.from('zone_standards').select('*').eq('zoning_district_id', zd.id).limit(1).single(),
      supabase.from('permitted_uses').select('use_description, use_type').eq('zoning_district_id', zd.id).limit(20),
    ])

    return {
      zoning: {
        zone_code: zoneCode,
        jurisdiction: jurisdiction ?? null,
        district_name: zd.name,
        zone_description: zd.description ?? null,
        standards: (zs ?? {}) as Record<string, unknown>,
        permitted_uses: pu ?? [],
        isFallback: false,
      },
      error: null,
    }
  } catch (e) {
    const fb = getFallbackControls(zoneCode)
    if (!fb) {
      return { zoning: null, error: `No zoning data available for code: ${zoneCode}` }
    }
    return {
      zoning: {
        zone_code: zoneCode,
        jurisdiction: jurisdiction ?? null,
        district_name: fb.zone_name,
        standards: fb as unknown as Record<string, unknown>,
        permitted_uses: [],
        isFallback: true,
      },
      error: null,
    }
  }
}

// ─── Context string builder ───────────────────────────────────────────────────
function buildContextString(ctx: ZoningContext): string {
  const lines: string[] = []

  if (ctx.parcel) {
    const p = ctx.parcel
    lines.push('=== PARCEL DATA ===')
    lines.push(`Address: ${p.address}${p.city ? ', ' + p.city : ''}`)
    lines.push(`Parcel ID: ${p.parcel_id}`)
    if (p.acres) lines.push(`Lot Size: ${p.acres} acres (${Math.round(p.acres * 43560).toLocaleString()} sq ft)`)
    if (p.use_description) lines.push(`Current Use: ${p.use_description.trim()} (code ${p.use_code})`)
  }

  if (ctx.parcel && !ctx.zoning) {
    // Parcel found but no zoning_assignment exists — do NOT fabricate.
    const city = ctx.parcel.city ?? 'Brevard County'
    const dept = ctx.parcel.city ? `the ${ctx.parcel.city} Planning Department` : 'the local Planning Department'
    lines.push('')
    lines.push('=== ZONING DATA ===')
    lines.push('STATUS: NO ZONING DATA AVAILABLE IN DATABASE')
    lines.push(`The property is in ${city}.`)
    lines.push(`INSTRUCTION: Tell the user that zoning data is not yet available for this parcel in our database. Direct them to verify the zoning designation with ${dept} or visit their municipal code. Do NOT estimate, infer, or fabricate any zoning code, development standards, height limits, or setbacks.`)
  }

  if (ctx.zoning) {
    const z = ctx.zoning
    const s = z.standards
    lines.push('')
    lines.push('=== ZONING DATA ===')
    lines.push(`Zone Code: ${z.zone_code}`)
    lines.push(`Zone Name: ${z.district_name}`)
    if (z.zone_description) lines.push(`Zone Description: ${z.zone_description}`)
    if (z.jurisdiction) lines.push(`Jurisdiction: ${z.jurisdiction}`)
    if (z.isFallback) lines.push('[Note: Using estimated controls — verify with local jurisdiction]')

    lines.push('')
    lines.push('--- Development Standards ---')
    const std = (key: string) => s[key] ?? s[key.replace('_ft', '')] ?? s[key.replace('_pct', '')] ?? null
    if (std('max_height_ft') !== null) lines.push(`Max Height: ${std('max_height_ft')} ft`)
    if (std('max_stories') !== null) lines.push(`Max Stories: ${std('max_stories')}`)
    if (std('front_setback_ft') !== null) lines.push(`Front Setback: ${std('front_setback_ft')} ft`)
    if (std('side_setback_ft') !== null) lines.push(`Side Setback: ${std('side_setback_ft')} ft`)
    if (std('rear_setback_ft') !== null) lines.push(`Rear Setback: ${std('rear_setback_ft')} ft`)
    if (std('max_lot_coverage_pct') !== null) lines.push(`Max Lot Coverage: ${std('max_lot_coverage_pct')}%`)
    if (std('max_far') !== null) lines.push(`Max FAR (Floor Area Ratio): ${std('max_far')}`)
    if (std('max_density_du_acre') !== null) lines.push(`Max Density: ${std('max_density_du_acre')} du/acre`)
    if (std('parking_per_unit') && Number(std('parking_per_unit')) > 0) lines.push(`Parking: ${std('parking_per_unit')} spaces/unit`)
    if (std('parking_per_1000sf') && Number(std('parking_per_1000sf')) > 0) lines.push(`Parking: ${std('parking_per_1000sf')} spaces/1,000 sf`)
    if (std('min_lot_size_sf') !== null) lines.push(`Min Lot Size: ${std('min_lot_size_sf')} sf`)
    if (std('min_lot_width_ft') !== null) lines.push(`Min Lot Width: ${std('min_lot_width_ft')} ft`)

    if (z.permitted_uses.length > 0) {
      lines.push('')
      lines.push('--- Permitted Uses ---')
      const byType: Record<string, string[]> = {}
      for (const u of z.permitted_uses) {
        const t = u.use_type || 'permitted'
        if (!byType[t]) byType[t] = []
        byType[t].push(u.use_description)
      }
      for (const [type, uses] of Object.entries(byType)) {
        lines.push(`${type.toUpperCase()}: ${uses.join(', ')}`)
      }
    }
  }

  return lines.join('\n')
}

// ─── Session persistence ──────────────────────────────────────────────────────
async function getOrCreateSession(sessionId: string | undefined): Promise<string> {
  const supabase = createAnonClient()
  if (sessionId) return sessionId
  try {
    const { data } = await supabase
      .from('zw_chat_sessions')
      .insert({ user_id: null })
      .select('id')
      .single()
    return data?.id ?? crypto.randomUUID()
  } catch {
    return crypto.randomUUID()
  }
}

async function persistMessages(sessionId: string, userMsg: string, assistantMsg: string) {
  const supabase = createAnonClient()
  try {
    await supabase.from('zw_chat_messages').insert([
      { session_id: sessionId, role: 'user', content: userMsg, metadata: {} },
      { session_id: sessionId, role: 'assistant', content: assistantMsg, metadata: {} },
    ])
  } catch {
    // Non-fatal — persistence failure should not block the response
  }
}

async function getSessionHistory(sessionId: string): Promise<{ role: string; content: string }[]> {
  const supabase = createAnonClient()
  try {
    const { data } = await supabase
      .from('zw_chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10)
    return data ?? []
  } catch {
    return []
  }
}

// ─── LLM call with Smart Router (Gemini → DeepSeek fallback) ──────────────────
function buildSystemPrompt(hasContext: boolean): string {
  if (hasContext) {
    return `You are ZoneWise AI, a Florida zoning intelligence assistant for Brevard County.
You have access to real zoning data from Brevard County's parcel and zoning records.

RULES:
- Use the CONTEXT data below as your primary source. Present it in clear, conversational language — NOT as raw data dumps.
- When citing development standards, use natural sentences like "The maximum building height is 35 feet" instead of listing raw fields.
- Bold key numbers with **value** for emphasis.
- If the data shows estimated/fallback controls, mention that the user should verify with the local jurisdiction.
- If the context shows "NO ZONING DATA AVAILABLE IN DATABASE", tell the user: "Zoning data is not yet available for this parcel in our database. The property is in [CITY] — please verify the zoning designation with the [CITY] Planning Department or visit their municipal code." Do NOT estimate or infer any zone code or development standards from the use code description.
- Keep answers concise — 2-4 paragraphs max.
- End with a practical tip or suggestion when relevant (e.g., "You may want to check with [jurisdiction] for any overlay districts").
- Never fabricate zoning codes, regulations, or numbers not present in the context data.`
  }

  return `You are ZoneWise AI, a Florida zoning intelligence assistant for Brevard County.
The user is asking a general zoning question without referencing a specific address or zone code.

RULES:
- Answer using your general knowledge of zoning concepts, Florida land use law, and Brevard County practices.
- Be helpful and educational. Explain concepts clearly with practical examples.
- Bold key terms with **term** for emphasis.
- Keep answers concise — 2-4 paragraphs max.
- When relevant, suggest the user search for a specific address or zone code for detailed data (e.g., "Try asking about a specific address like '123 Main St' to get exact development standards").
- Never fabricate specific Brevard County regulations. If unsure about a local detail, say so.
- Focus on Florida-specific context when applicable.`
}

async function callLLM(
  message: string,
  context: string,
  history: { role: string; content: string }[],
  ctx: ZoningContext,
  fallbackOverride?: () => string,
): Promise<string> {
  const hasContext = context.length > 0
  const systemPrompt = buildSystemPrompt(hasContext)

  const historyText = history.length > 0
    ? '\n\nPREVIOUS CONVERSATION:\n' + history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')
    : ''

  const userContent = (hasContext ? 'CONTEXT:\n' + context + '\n\n' : '')
    + historyText
    + 'USER: ' + message

  const result = await resilientLLM.callWithFallback(
    { systemPrompt, userContent },
    fallbackOverride ?? (() => formatFallbackResponse(ctx)),
  )

  // Fire-and-forget metrics log
  logLLMCall({
    provider: result.provider,
    model: result.provider === 'gemini' ? 'gemini-2.5-flash'
      : result.provider === 'deepseek' ? 'deepseek-chat'
      : 'db_fallback',
    latencyMs: result.latencyMs,
    success: result.provider !== 'db_fallback',
    route: '/api/zoning-chat',
  }).catch(() => { /* non-fatal */ })

  return result.text
}

// ─── Citation extractor ───────────────────────────────────────────────────────
function extractCitations(ctx: ZoningContext): { source: string; detail: string }[] {
  const citations: { source: string; detail: string }[] = []
  if (ctx.zoning) {
    const z = ctx.zoning
    const label = z.isFallback ? 'Estimated controls' : 'Supabase zoning_districts'
    citations.push({
      source: `${z.zone_code} — ${z.district_name}`,
      detail: `${label}${z.jurisdiction ? ' · ' + z.jurisdiction : ''}`,
    })
  }
  if (ctx.parcel) {
    const isGIS = ctx.parcel._source === 'bcpao_gis'
    citations.push({
      source: isGIS ? 'BCPAO GIS' : `Parcel ${ctx.parcel.parcel_id}`,
      detail: isGIS
        ? `Brevard County Property Appraiser · ${ctx.parcel.address}`
        : `sample_properties · ${ctx.parcel.address}`,
    })
  }
  return citations
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // DEPLOY_MARKER: 2026-03-30T14:05Z — directional prefix fix
  try {
    const body = await req.json()
    const rawMessage: string = (body.message ?? '').trim()
    const sessionId: string | undefined = body.sessionId
    const incomingHistory: { role: string; content: string }[] = body.history ?? []

    const messageParsed = chatQuerySchema.safeParse(rawMessage)
    if (!messageParsed.success) {
      return NextResponse.json(
        { error: 'message is required (1–500 characters)' },
        { status: 400, headers: { ...CORS, ...SECURITY_HEADERS } }
      )
    }
    const message = sanitizeChatMessage(messageParsed.data)

    const intent = classifyIntent(message)
    let ctx: ZoningContext = { parcel: null, zoning: null, error: null }

    if (intent === 'ADDRESS_LOOKUP') {
      let addr = extractAddress(message)
      if (addr) {
        // FIX: Strip detected city from extracted address BEFORE lookup.
        // extractAddress returns "1600 S Orlando Ave Cocoa Beach" but
        // sample_properties stores just "1600 ORLANDO AVE". The city
        // is used separately as a filter, not part of the address search.
        const city = extractCity(message)
        if (city) {
          const cityPattern = new RegExp('\\s+' + city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*$', 'i')
          addr = addr.replace(cityPattern, '').trim()
        }
        ctx = await fetchZoningByAddress(addr, message)
      }
    } else if (intent === 'ZONE_QUESTION' || intent === 'PERMITTED_USE' || intent === 'CAPACITY') {
      const zoneCode = extractZoneCode(message)
      if (zoneCode) {
        const result = await fetchZoningByCode(zoneCode)
        ctx = { parcel: null, ...result }
      }
    } else if (intent === 'COMPARISON') {
      const codes = [...(message.matchAll(/\b(R-1AA?|R-1B|R-[1-9]\w*|RM-?\w*|MFR-?\w*|SFR|RE\b|REU|SRE|BU-\w+|C-\w+|PUD\w*|TR-\w+|GML|ACREAGE|CP|OFFICE|TOWNHOUSE)\b/gi))].map(m => m[1].toUpperCase())
      if (codes.length >= 2) {
        const [r1, r2] = await Promise.all([
          fetchZoningByCode(codes[0]),
          fetchZoningByCode(codes[1]),
        ])
        const ctxStr1 = buildContextString({ parcel: null, ...r1 })
        const ctxStr2 = buildContextString({ parcel: null, ...r2 })
        const combinedCtx = ctxStr1 + '\n\n' + ctxStr2
        const activeSession = await getOrCreateSession(sessionId)
        const history = incomingHistory.length > 0 ? incomingHistory : await getSessionHistory(activeSession)
        const comparisonFallback = () =>
          `**${codes[0]}:** ${r1.zoning?.district_name ?? 'Unknown'}\n${buildContextString({ parcel: null, ...r1 })}\n\n**${codes[1]}:** ${r2.zoning?.district_name ?? 'Unknown'}\n${buildContextString({ parcel: null, ...r2 })}`
        const responseText = await callLLM(
          message,
          combinedCtx,
          history.slice(-5),
          { parcel: null, zoning: r1.zoning ?? null, error: null },
          comparisonFallback,
        )
        const citations = [...extractCitations({ parcel: null, ...r1 }), ...extractCitations({ parcel: null, ...r2 })]
        await persistMessages(activeSession, message, responseText)
        return NextResponse.json({ response: responseText, citations, sessionId: activeSession }, { headers: { ...CORS, ...SECURITY_HEADERS } })
      }
    }

    // GENERAL intent or any intent that didn't extract a zone/address —
    // still goes through Gemini (with or without context)
    const contextString = buildContextString(ctx)
    const activeSession = await getOrCreateSession(sessionId)
    const history = incomingHistory.length > 0 ? incomingHistory : await getSessionHistory(activeSession)

    const noContextFallback = !contextString
      ? () => ctx.error
        ? `I was unable to find that information. ${ctx.error}`
        : "I couldn't process that request right now. Try asking about a specific address (e.g., \"What can I build at 123 Main St?\") or zone code (e.g., \"What does R-1A allow?\")."
      : undefined
    const responseText = await callLLM(message, contextString, history.slice(-5), ctx, noContextFallback)

    const citations = extractCitations(ctx)
    await persistMessages(activeSession, message, responseText)

    return NextResponse.json(
      {
        response: responseText,
        citations,
        sessionId: activeSession,
        parcel: ctx.parcel ?? undefined,
        zoning: ctx.zoning ? {
          zone_code: ctx.zoning.zone_code,
          zone_name: ctx.zoning.district_name,
          jurisdiction: ctx.zoning.jurisdiction,
          standards: ctx.zoning.standards,
          permitted_uses: ctx.zoning.permitted_uses,
          isFallback: ctx.zoning.isFallback,
        } : undefined,
      },
      { headers: { ...CORS, ...SECURITY_HEADERS } }
    )
  } catch (err) {
    console.error('[zoning-chat] POST error:', err)
    return NextResponse.json(
      { error: 'Service unavailable', fallback: true },
      { status: 503, headers: { ...CORS, ...SECURITY_HEADERS } }
    )
  }
}

// ─── Fallback response formatter (when Gemini is down) ────────────────────────
function formatFallbackResponse(ctx: ZoningContext): string {
  const lines: string[] = []

  if (ctx.parcel) {
    const p = ctx.parcel
    lines.push(`**${p.address.trim()}${p.city ? ', ' + p.city.trim() : ''}**`)
    lines.push(`Parcel ID: ${p.parcel_id}`)
    if (p.acres) lines.push(`Lot Size: **${p.acres} acres** (${Math.round(p.acres * 43560).toLocaleString()} sq ft)`)
    if (p.use_description) lines.push(`Current Use: ${p.use_description.trim()}`)
    lines.push('')
  }

  if (ctx.parcel && !ctx.zoning) {
    const city = ctx.parcel.city ?? 'Brevard County'
    const dept = ctx.parcel.city ? `the ${ctx.parcel.city} Planning Department` : 'the local Planning Department'
    lines.push(`**Zoning:** Not available in our database`)
    lines.push(`Zoning data is not yet available for this parcel. The property is in **${city}** — please verify the zoning designation with ${dept} or visit their municipal code.`)
    lines.push('')
  }

  if (ctx.zoning) {
    const z = ctx.zoning
    const s = z.standards as Record<string, number>
    lines.push(`**Zoning: ${z.zone_code} — ${z.district_name}**`)
    if (z.jurisdiction) lines.push(`Jurisdiction: ${z.jurisdiction}`)
    if (z.isFallback) lines.push('*Note: These are estimated controls — verify with the local jurisdiction.*')
    lines.push('')

    const standards: string[] = []
    if (s.max_height_ft) standards.push(`Max height: **${s.max_height_ft} ft** (${s.max_stories ?? '?'} stories)`)
    if (s.front_setback_ft) standards.push(`Setbacks: front **${s.front_setback_ft}'**, side **${s.side_setback_ft}'**, rear **${s.rear_setback_ft}'**`)
    if (s.max_lot_coverage_pct) standards.push(`Max lot coverage: **${s.max_lot_coverage_pct}%**`)
    if (s.max_far) standards.push(`Max FAR: **${s.max_far}**`)
    if (s.max_density_du_acre) standards.push(`Max density: **${s.max_density_du_acre} units/acre**`)
    if (s.parking_per_unit && s.parking_per_unit > 0) standards.push(`Parking: **${s.parking_per_unit} spaces/unit**`)

    if (standards.length > 0) {
      lines.push('Development Standards:')
      for (const st of standards) lines.push(`• ${st}`)
    }

    if (z.permitted_uses.length > 0) {
      lines.push('')
      lines.push('Permitted Uses:')
      const byType: Record<string, string[]> = {}
      for (const u of z.permitted_uses) {
        const t = u.use_type || 'permitted'
        if (!byType[t]) byType[t] = []
        byType[t].push(u.use_description)
      }
      for (const [type, uses] of Object.entries(byType)) {
        lines.push(`• **${type}:** ${uses.join(', ')}`)
      }
    }
  }

  if (lines.length === 0) {
    return "I couldn't find data for that query. Try searching for a specific address or zone code."
  }

  return lines.join('\n')
}

