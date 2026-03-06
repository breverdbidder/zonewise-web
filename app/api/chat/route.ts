export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { addCorsHeaders, handlePreflight } from '@/lib/api/cors'

/**
 * SEC-008: Handle preflight CORS requests.
 */
export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * SEC-001: Authenticate the request using Clerk auth.
 */
async function authenticateRequest(request: NextRequest): Promise<{ userId: string; email?: string } | null> {
  try {
    const { userId } = await auth()
    if (!userId) return null
    return { userId }
  } catch {
    return null
  }
}

/**
 * SEC-001: Check and decrement the user's query limit.
 */
async function checkAndDecrementQueryLimit(userId: string): Promise<number | null> {
  const supabase = getSupabase()
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('query_limit, queries_used')
    .eq('user_id', userId)
    .single()

  if (!subscription) return 100
  if (subscription.query_limit === -1) return -1
  const remaining = subscription.query_limit - subscription.queries_used
  if (remaining <= 0) return null
  return remaining
}

// Florida jurisdiction coordinates for map centering
const JURISDICTION_COORDS: Record<string, [number, number]> = {
  'satellite beach': [-80.5901, 28.1761],
  'melbourne': [-80.6081, 28.0836],
  'palm bay': [-80.5887, 28.0345],
  'titusville': [-80.8076, 28.6122],
  'cocoa beach': [-80.6048, 28.3200],
  'cocoa': [-80.7420, 28.3861],
  'rockledge': [-80.7253, 28.3506],
  'west melbourne': [-80.6520, 28.0719],
  'indialantic': [-80.5665, 28.0897],
  'indian harbour beach': [-80.5882, 28.1492],
  'cape canaveral': [-80.6048, 28.3922],
  'melbourne beach': [-80.5615, 28.0683],
  'malabar': [-80.5687, 27.9900],
  'jacksonville': [-81.6557, 30.3322],
  'miami': [-80.1918, 25.7617],
  'miami beach': [-80.1300, 25.7907],
  'tampa': [-82.4572, 27.9506],
  'orlando': [-81.3789, 28.5383],
  'fort lauderdale': [-80.1373, 26.1224],
  'st. petersburg': [-82.6403, 27.7676],
  'hialeah': [-80.2781, 25.8576],
  'tallahassee': [-84.2807, 30.4383],
  'naples': [-81.7948, 26.1420],
  'sarasota': [-82.5308, 27.3364],
  'fort myers': [-81.8723, 26.6406],
  'pensacola': [-87.2169, 30.4213],
  'panama city': [-85.6602, 30.1588],
  'daytona beach': [-81.0228, 29.2108],
  'gainesville': [-82.3248, 29.6516],
  'lakeland': [-81.9498, 28.0395],
  'clearwater': [-82.8001, 27.9659],
  'coral springs': [-80.2706, 26.2712],
  'pompano beach': [-80.1247, 26.2379],
  'west palm beach': [-80.0534, 26.7153],
  'boca raton': [-80.0831, 26.3587],
  'deerfield beach': [-80.0987, 26.3184],
  'kissimmee': [-81.4076, 28.2920],
  'ocala': [-82.1401, 29.1872],
  'winter haven': [-81.7328, 28.0222],
  'new smyrna beach': [-80.9270, 29.0258],
  'key west': [-81.7826, 24.5551],
  'brevard county': [-80.7214, 28.2639],
  'orange county': [-81.3089, 28.4747],
  'miami-dade county': [-80.3893, 25.5516],
  'broward county': [-80.2594, 26.1901],
  'palm beach county': [-80.2694, 26.6868],
  'hillsborough county': [-82.3012, 27.9904],
  'pinellas county': [-82.7401, 27.8764],
  'duval county': [-81.6557, 30.3322],
  'lee county': [-81.8723, 26.6406],
  'polk county': [-81.7109, 27.9947],
  'volusia county': [-81.1637, 29.0280],
  'seminole county': [-81.2362, 28.7163],
  'homestead': [-80.4776, 25.4687],
  'hialeah gardens': [-80.3240, 25.8650],
  'new port richey': [-82.7193, 28.2442],
  'port richey': [-82.7193, 28.2719],
  'land o lakes': [-82.4573, 28.2189],
  'hudson': [-82.6932, 28.3644],
  'doral': [-80.3553, 25.8195],
  'kendall': [-80.3176, 25.6790],
  'miramar': [-80.2323, 25.9860],
  'plantation': [-80.2331, 26.1276],
  'davie': [-80.2331, 26.0765],
  'hollywood': [-80.1495, 26.0112],
  'pembroke pines': [-80.2962, 26.0131],
  'sunrise': [-80.2561, 26.1333],
  'coral gables': [-80.2684, 25.7215],
};

// Florida county number → name mapping (FDOR alphabetical, CO_NO = position + 10)
const FL_COUNTY_MAP: Record<number, string> = {
  11: 'Alachua', 12: 'Baker', 13: 'Bay', 14: 'Bradford', 15: 'Brevard',
  16: 'Broward', 17: 'Calhoun', 18: 'Charlotte', 19: 'Citrus', 20: 'Clay',
  21: 'Collier', 22: 'Columbia', 23: 'Miami-Dade', 24: 'DeSoto', 25: 'Dixie',
  26: 'Duval', 27: 'Escambia', 28: 'Flagler', 29: 'Franklin', 30: 'Gadsden',
  31: 'Gilchrist', 32: 'Glades', 33: 'Gulf', 34: 'Hamilton', 35: 'Hardee',
  36: 'Hendry', 37: 'Hernando', 38: 'Highlands', 39: 'Hillsborough',
  40: 'Holmes', 41: 'Indian River', 42: 'Jackson', 43: 'Jefferson',
  44: 'Lafayette', 45: 'Lake', 46: 'Lee', 47: 'Leon', 48: 'Levy',
  49: 'Liberty', 50: 'Madison', 51: 'Manatee', 52: 'Marion', 53: 'Martin',
  54: 'Monroe', 55: 'Nassau', 56: 'Okaloosa', 57: 'Okeechobee',
  58: 'Orange', 59: 'Osceola', 60: 'Palm Beach', 61: 'Pasco',
  62: 'Pinellas', 63: 'Polk', 64: 'Putnam', 65: 'Santa Rosa',
  66: 'Sarasota', 67: 'Seminole', 68: 'St. Johns', 69: 'St. Lucie',
  70: 'Sumter', 71: 'Suwannee', 72: 'Taylor', 73: 'Union', 74: 'Volusia',
  75: 'Wakulla', 76: 'Walton', 77: 'Washington'
};

const SYSTEM_PROMPT = `You are ZoneWise.AI, an expert AI assistant for Florida real estate intelligence across all 67 counties.

DATABASE: You have access to a comprehensive Florida zoning + property database with:
- 67 counties, 369 jurisdictions, 5,395 zoning districts
- 10,202 permitted uses, 700 conditional uses
- 1,931 zone standards with setbacks, heights, lot sizes, FAR
- 2,190 ordinances with full text
- 10.5M+ Florida property parcels with valuations, sale history, owner info, building details
- Aerial/property photos for select counties (Miami-Dade coverage active)

PROPERTY DATA (fl_parcels): When parcel data is provided below, include these details:
- Physical address, city, zip
- Just Value (JV), Assessed Value, Land Value
- Living area (sq ft), year built, bedrooms/units
- Last sale price and date
- Owner name and mailing address
- Aerial photo URL (if available)
- County name

128-KPI PROPERTY INTELLIGENCE: When 128-KPI data is provided, present the key metrics organized by category:
- VALUATION: Just Value, Land Value, Building Value, $/sqft, vs Area Median
- ZONING: Zone Code, Max Height, Coverage, FAR, Setbacks, Expansion Potential
- INVESTMENT: Monthly Rent Est., Cap Rate, GRM, NOI, Cash-on-Cash, Break-Even Rent
- RISK: Risk Score (/100), Risk Level, Building Age Risk, Construction Quality
- FEMA FLOOD: Flood Zone (X/AE/VE/etc), SFHA status, Base Flood Elevation, Insurance requirement, FIRM panel
- NEIGHBORHOOD: Walkability Score (0-100), Education Score, Safety Score, Median Income, Median Rent, Poverty Rate, Walk/Transit/Bike commute %
- SCORING: Investment Grade (A+/A/B/C/D), Opportunity Score, Max Bid (Shapira Formula), Exit Strategy
- MARKET: Area Median, Price Percentile, Value Tier, Recent Sales Count
Format as a structured property intelligence card. Include the grade and key scores prominently.

CRITICAL: ONLY use data values provided in the RELEVANT DATA section below. NEVER substitute with your training data. If a value is not in the database context, say "not available in database" rather than guessing.

RESPONSE FORMAT:
- Always specify jurisdiction and zone code when discussing zoning
- Include specific dimensional standards when available
- Show permitted vs conditional uses clearly
- When showing property data, format valuations as currency ($XXX,XXX)
- Include aerial photo when available: ![Property Photo](photo_url)
- Note overlay districts if applicable
- End zoning answers with: "⚠️ Verify with [Jurisdiction] Planning Department before making development decisions."

ARTIFACT MARKERS - Use these when the query warrants visual output:
- For map-related responses: [MAP:Zone Title]
- For tabular data: [TABLE:Table Title]
- For reports: [REPORT:Report Title]
- For comparisons: [TABLE:Comparison Title]
- For property cards: [TABLE:Property Details]

Always include at least one artifact marker when discussing specific zones, jurisdictions, or properties.`

interface Message { role: 'user' | 'assistant'; content: string }

export async function POST(request: NextRequest) {
  const authUser = await authenticateRequest(request)
  if (!authUser) {
    return addCorsHeaders(request, NextResponse.json(
      { error: 'Authentication required. Please sign in to use the chat API.' },
      { status: 401 }
    ))
  }

  // Feature flag: proxy to agents backend when enabled
  if (process.env.USE_AGENTS_BACKEND === 'true') {
    try {
      const agentsUrl = process.env.AGENTS_BACKEND_URL || 'https://zonewise-agents.onrender.com'
      const body = await request.clone().json()
      const proxyRes = await fetch(`${agentsUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
          'X-User-Id': authUser.userId,
        },
        body: JSON.stringify(body),
      })
      const proxyData = await proxyRes.json()
      return addCorsHeaders(request, NextResponse.json(proxyData, { status: proxyRes.status }))
    } catch (proxyErr: any) {
      console.error('Agents backend proxy failed, falling back:', proxyErr.message)
      // Fall through to local handler
    }
  }

  const remaining = await checkAndDecrementQueryLimit(authUser.userId)
  if (remaining === null) {
    return addCorsHeaders(request, NextResponse.json(
      { error: 'Query limit exceeded. Please upgrade your plan.' },
      { status: 429 }
    ))
  }

  const anthropic = getAnthropic();
  const supabase = getSupabase();
  try {
    const { messages, sessionId } = await request.json()
    const [zoningResult, parcelResult] = await Promise.all([
      fetchRelevantZoningData(supabase, messages),
      fetchParcelData(supabase, messages)
    ])

    // ── Compute 128 KPIs for primary parcel ──
    let kpiResult: KPIResult | null = null
    if (parcelResult.parcels.length > 0) {
      try {
        // Find the raw parcel from fl_parcels (parcelResult.parcels has transformed keys)
        const primaryParcel = parcelResult.parcels[0]
        const { data: rawParcels } = await supabase.from('fl_parcels').select('*')
          .eq('parcel_id', primaryParcel.parcelId).limit(1)
        if (rawParcels?.length) {
          kpiResult = await computePropertyKPIs(
            supabase, rawParcels[0],
            zoningResult.zoneData.districts, zoningResult.zoneData.uses
          )
        }
      } catch (e) { console.error('KPI computation error (non-fatal):', e) }
    }

    const claudeMessages = messages.map((m: Message) => ({ role: m.role, content: m.content }))
    let systemPrompt = SYSTEM_PROMPT

    const contextParts: string[] = []
    if (zoningResult.context) contextParts.push(zoningResult.context)
    if (parcelResult.context) contextParts.push(parcelResult.context)
    if (kpiResult?.summary) contextParts.push(kpiResult.summary)
    if (contextParts.length > 0) {
      systemPrompt += `\n\nRELEVANT DATA FROM DATABASE:\n${contextParts.join('\n\n---\n\n')}`
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: claudeMessages
    })

    const assistantContent = response.content[0].type === 'text' ? response.content[0].text : ''

    // Merge zone + parcel data for artifact building
    const mergedZoneData = {
      districts: zoningResult.zoneData.districts,
      uses: zoningResult.zoneData.uses,
      jurisdiction: zoningResult.zoneData.jurisdiction || parcelResult.jurisdiction,
      coordinates: zoningResult.zoneData.coordinates || parcelResult.coordinates,
    }
    const artifacts = buildArtifacts(assistantContent, mergedZoneData, parcelResult.parcels, kpiResult)

    const cleanedResponse = assistantContent
      .replace(/\[MAP:[^\]]+\]/g, '')
      .replace(/\[TABLE:[^\]]+\]/g, '')
      .replace(/\[REPORT:[^\]]+\]/g, '')
      .trim()

    try {
      await supabase.rpc('increment_query_count', { p_user_id: authUser.userId })
    } catch (_) { /* non-fatal */ }

    if (sessionId) {
      try {
        await supabase.from('zw_chat_messages').insert([
          { session_id: sessionId, role: 'user', content: messages[messages.length - 1]?.content || '' },
          { session_id: sessionId, role: 'assistant', content: cleanedResponse, artifacts }
        ])
      } catch (logError) { console.error('Log error:', logError) }
    }

    return addCorsHeaders(request, NextResponse.json({ response: cleanedResponse, artifacts }))
  } catch (error) {
    console.error('Chat API error:', error)
    return addCorsHeaders(request, NextResponse.json({ error: 'Failed to process request' }, { status: 500 }))
  }
}

// ============================================================================
// PARCEL DATA FETCHING (fl_parcels — 10.5M rows)
// ============================================================================

interface ParcelResult {
  context: string | null;
  parcels: any[];
  jurisdiction: string | null;
  coordinates: [number, number] | null;
}

/**
 * Extract parcel search signals from the user's message and query fl_parcels.
 * Supports: address search, parcel ID lookup, city/zip browsing, owner search.
 */
async function fetchParcelData(supabase: any, messages: Message[]): Promise<ParcelResult> {
  const lastMessage = messages[messages.length - 1]?.content || ''
  const msgLower = lastMessage.toLowerCase()
  const empty: ParcelResult = { context: null, parcels: [], jurisdiction: null, coordinates: null }

  // Skip if message is clearly only about zoning concepts (no property reference)
  if (/^(what is|explain|define|how does|difference between)\b/i.test(lastMessage) &&
      !/(address|property|parcel|owner|value|worth|sale|house|home|lot|building)/i.test(lastMessage)) {
    return empty
  }

  let parcels: any[] = []
  let searchMethod = ''

  try {
    // ── Strategy 1: Parcel ID lookup (exact match) ──
    const parcelIdMatch = lastMessage.match(/\b(\d{1,2}-\d{2}-\d{2}-\d{4}-\d{5}-\d{4})\b/) ||  // Pasco/Hillsborough format
                          lastMessage.match(/\b(\d{10,15})\b/) ||                                  // Miami-Dade folio
                          lastMessage.match(/\b(\d{2}-\d{6}-\d{4})\b/)                             // other county formats
    if (parcelIdMatch) {
      const { data } = await supabase
        .from('fl_parcels')
        .select('*')
        .eq('parcel_id', parcelIdMatch[1])
        .limit(5)
      if (data?.length) {
        parcels = data
        searchMethod = 'parcel_id'
      }
    }

    // ── Strategy 2: Street address search ──
    if (!parcels.length) {
      // Match patterns like "123 Main St", "4500 NW 7th Ave", "6739 Emerald Spring"
      const addrMatch = lastMessage.match(/\b(\d{1,6}\s+(?:[NSEW]{1,2}\s+)?[A-Za-z][A-Za-z\s]{2,30}(?:st|street|ave|avenue|blvd|boulevard|dr|drive|rd|road|ln|lane|ct|court|way|pl|place|ter|terrace|cir|circle|spring|springs|trail|trl|pkwy|parkway)?)\b/i)
      if (addrMatch) {
        const addrSearch = addrMatch[1].toUpperCase().trim()

        // Build query — search by address, optionally filtered by city
        let query = supabase
          .from('fl_parcels')
          .select('*')
          .ilike('phy_addr1', `%${addrSearch}%`)
          .limit(10)

        // If a city is mentioned, narrow the search
        for (const [cityName] of Object.entries(JURISDICTION_COORDS)) {
          if (msgLower.includes(cityName)) {
            query = query.ilike('phy_city', `%${cityName}%`)
            break
          }
        }

        const { data } = await query
        if (data?.length) {
          parcels = data
          searchMethod = 'address'
        }
      }
    }

    // ── Strategy 3: Owner name search ──
    if (!parcels.length) {
      const ownerMatch = lastMessage.match(/(?:owner|owned by|belongs to|who owns)\s+["']?([A-Za-z][A-Za-z\s,]{2,40})["']?/i)
      if (ownerMatch) {
        const ownerSearch = ownerMatch[1].toUpperCase().trim()
        const { data } = await supabase
          .from('fl_parcels')
          .select('*')
          .ilike('own_name', `%${ownerSearch}%`)
          .limit(10)
        if (data?.length) {
          parcels = data
          searchMethod = 'owner'
        }
      }
    }

    // ── Strategy 4: Zip code search (with property context) ──
    if (!parcels.length) {
      const zipMatch = lastMessage.match(/\b(3\d{4})\b/) // Florida zips start with 3
      const hasPropertyIntent = /(propert|parcel|house|home|lot|land|value|sale|owner|building|address|listing)/i.test(lastMessage)
      if (zipMatch && hasPropertyIntent) {
        const { data } = await supabase
          .from('fl_parcels')
          .select('*')
          .eq('phy_zipcd', zipMatch[1])
          .order('jv', { ascending: false })
          .limit(10)
        if (data?.length) {
          parcels = data
          searchMethod = 'zip'
        }
      }
    }

    // ── Strategy 5: City-level property summary ──
    if (!parcels.length) {
      const hasPropertyIntent = /(propert|parcel|house|home|lot|land|value|sale|average|median|market|real estate)/i.test(lastMessage)
      if (hasPropertyIntent) {
        for (const [cityName] of Object.entries(JURISDICTION_COORDS)) {
          if (msgLower.includes(cityName) && cityName.length > 3) {
            const { data } = await supabase
              .from('fl_parcels')
              .select('*')
              .ilike('phy_city', `%${cityName}%`)
              .order('jv', { ascending: false })
              .limit(10)
            if (data?.length) {
              parcels = data
              searchMethod = 'city'
            }
            break
          }
        }
      }
    }

    if (!parcels.length) return empty

    // ── Build context string for Claude ──
    const results: string[] = [`PROPERTY DATA (${parcels.length} parcels found via ${searchMethod} search):`]
    let jurisdiction: string | null = null
    let coordinates: [number, number] | null = null

    for (const p of parcels) {
      const countyName = FL_COUNTY_MAP[p.co_no] || `County ${p.co_no}`
      const city = p.phy_city || 'N/A'

      if (!jurisdiction && city !== 'N/A') {
        const cityKey = city.toLowerCase()
        jurisdiction = cityKey
        const jCoords = JURISDICTION_COORDS[cityKey]
        if (jCoords) coordinates = jCoords
      }

      // Use centroid if available, otherwise try jurisdiction coords
      if (!coordinates && p.centroid_lat && p.centroid_lng) {
        coordinates = [p.centroid_lng, p.centroid_lat]
      }

      let entry = `\nPARCEL: ${p.parcel_id}`
      entry += `\n  Address: ${p.phy_addr1 || 'N/A'}${p.phy_addr2 ? ' ' + p.phy_addr2 : ''}, ${city}, FL ${p.phy_zipcd || ''}`
      entry += `\n  County: ${countyName} (co_no: ${p.co_no})`

      // Valuations
      if (p.jv) entry += `\n  Just Value: $${Number(p.jv).toLocaleString()}`
      if (p.av_sd) entry += `\n  Assessed Value (School): $${Number(p.av_sd).toLocaleString()}`
      if (p.tv_sd) entry += `\n  Taxable Value (School): $${Number(p.tv_sd).toLocaleString()}`
      if (p.lnd_val) entry += `\n  Land Value: $${Number(p.lnd_val).toLocaleString()}`

      // Building details
      if (p.tot_lvg_ar) entry += `\n  Living Area: ${Number(p.tot_lvg_ar).toLocaleString()} sq ft`
      if (p.lnd_sqfoot) entry += `\n  Lot Size: ${Number(p.lnd_sqfoot).toLocaleString()} sq ft`
      if (p.eff_yr_blt) entry += `\n  Year Built (Effective): ${p.eff_yr_blt}`
      if (p.act_yr_blt) entry += `\n  Year Built (Actual): ${p.act_yr_blt}`
      if (p.no_buldng) entry += `\n  Buildings: ${p.no_buldng}`
      if (p.no_res_unt) entry += `\n  Residential Units: ${p.no_res_unt}`
      if (p.imp_qual) entry += `\n  Improvement Quality: ${p.imp_qual}`
      if (p.const_clas) entry += `\n  Construction Class: ${p.const_clas}`

      // Sale history
      if (p.sale_prc1) {
        entry += `\n  Last Sale: $${Number(p.sale_prc1).toLocaleString()}`
        if (p.sale_mo1 && p.sale_yr1) entry += ` (${p.sale_mo1}/${p.sale_yr1})`
        else if (p.sale_yr1) entry += ` (${p.sale_yr1})`
        if (p.qual_cd1) entry += ` [Qual: ${p.qual_cd1}]`
      }

      // Owner info
      if (p.own_name) entry += `\n  Owner: ${p.own_name}`
      if (p.own_addr1) {
        entry += `\n  Owner Address: ${p.own_addr1}`
        if (p.own_city) entry += `, ${p.own_city}`
        if (p.own_state) entry += `, ${p.own_state}`
        if (p.own_zipcd) entry += ` ${p.own_zipcd}`
      }

      // Use codes
      if (p.dor_uc) entry += `\n  DOR Use Code: ${p.dor_uc}`
      if (p.pa_uc) entry += `\n  PA Use Code: ${p.pa_uc}`

      // Zoning (if enriched)
      if (p.zone_code) entry += `\n  Zone Code: ${p.zone_code}`
      if (p.municipality) entry += `\n  Municipality: ${p.municipality}`
      if (p.future_land_use) entry += `\n  Future Land Use: ${p.future_land_use}`

      // Photo
      if (p.photo_url) entry += `\n  📸 Aerial Photo: ${p.photo_url}`

      // Coordinates
      if (p.centroid_lat && p.centroid_lng) {
        entry += `\n  Coordinates: ${p.centroid_lat}, ${p.centroid_lng}`
      }

      results.push(entry)
    }

    return {
      context: results.join('\n'),
      parcels: parcels.map(p => ({
        parcelId: p.parcel_id,
        address: `${p.phy_addr1 || ''}${p.phy_addr2 ? ' ' + p.phy_addr2 : ''}, ${p.phy_city || ''}, FL ${p.phy_zipcd || ''}`.trim(),
        county: FL_COUNTY_MAP[p.co_no] || `County ${p.co_no}`,
        coNo: p.co_no,
        justValue: p.jv,
        assessedValue: p.av_sd,
        taxableValue: p.tv_sd,
        landValue: p.lnd_val,
        livingArea: p.tot_lvg_ar,
        lotSize: p.lnd_sqfoot,
        yearBuilt: p.eff_yr_blt || p.act_yr_blt,
        buildings: p.no_buldng,
        resUnits: p.no_res_unt,
        salePrice: p.sale_prc1,
        saleYear: p.sale_yr1,
        saleMonth: p.sale_mo1,
        owner: p.own_name,
        ownerCity: p.own_city,
        ownerState: p.own_state,
        dorUseCode: p.dor_uc,
        zoneCode: p.zone_code,
        municipality: p.municipality,
        photoUrl: p.photo_url,
        lat: p.centroid_lat,
        lng: p.centroid_lng,
      })),
      jurisdiction,
      coordinates,
    }
  } catch (error) {
    console.error('Parcel data fetch error:', error)
    return empty
  }
}


// ============================================================================
// 128-KPI COMPUTATION ENGINE (Beats PropertyOnion 96 + PropZone 74)
// ============================================================================

const DOR_USE_CODES: Record<string, string> = {
  '000': 'Vacant Residential', '001': 'Single Family', '002': 'Mobile Home',
  '003': 'Multi-Family (2-4)', '004': 'Condominium', '005': 'Cooperatives',
  '006': 'Retirement Homes', '007': 'Misc Residential', '008': 'Multi-Family (5+)',
  '009': 'Residential Common', '010': 'Vacant Commercial', '011': 'Stores/Retail',
  '012': 'Mixed Use', '014': 'Supermarket', '016': 'Community Shopping',
  '017': 'Office (1 story)', '018': 'Office (multi)', '019': 'Medical Office',
  '020': 'AC Warehouse', '021': 'Restaurant', '022': 'Gas Station',
  '023': 'Financial', '027': 'Auto Sales', '033': 'Hotel', '034': 'Motel',
  '040': 'Vacant Industrial', '041': 'Light Manufacturing', '048': 'Warehousing',
  '070': 'Church', '071': 'Private School', '080': 'Government',
}

const CONSTRUCTION_CLASS: Record<number, string> = {
  1: 'Superior/Fireproof', 2: 'Excellent/Masonry', 3: 'Good/Frame',
  4: 'Average', 5: 'Below Average', 6: 'Economy', 0: 'N/A'
}

const IMP_QUALITY: Record<number, string> = {
  1: 'Excellent', 2: 'Very Good', 3: 'Good',
  4: 'Average', 5: 'Below Average', 6: 'Poor', 0: 'N/A'
}

const DOR_TO_ZONE_HINT: Record<string, string> = {
  '001': 'R-1', '002': 'R-1', '003': 'R-2', '004': 'R-3', '008': 'R-3',
  '011': 'C-1', '017': 'C-1', '018': 'C-2', '041': 'I-1', '048': 'I-1',
}

const DOR_TO_CATEGORY: Record<string, string> = {
  '000':'residential','001':'residential','002':'residential','003':'residential',
  '004':'residential','005':'residential','006':'residential','008':'residential',
  '010':'commercial','011':'commercial','012':'mixed_use','017':'commercial',
  '018':'commercial','021':'commercial','033':'commercial','040':'industrial',
  '041':'industrial','048':'industrial','070':'special',
}

const BREVARD_MILLAGE = 0.01812
const INSURANCE_RATE_PER_SQFT = 1.25
const RENTAL_RATE_PER_SQFT = 1.15

// FEMA NFHL Flood Zone lookup (free, no API key)
const FEMA_NFHL_URL = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer'

interface FemaFloodData {
  zone: string; subtype: string; sfha: boolean; bfe: number | null
  depth: number | null; velocity: number | null; riskTier: string
  insuranceReq: string; dfirmId: string | null; firmPanel: string | null
  firmEffDate: string | null; sourceCitation: string | null
}

async function fetchFemaFloodZone(lat: number, lng: number): Promise<FemaFloodData | null> {
  try {
    const floodUrl = `${FEMA_NFHL_URL}/28/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,DEPTH,VELOCITY,SOURCE_CIT,DFIRM_ID&returnGeometry=false&f=json`
    const firmUrl = `${FEMA_NFHL_URL}/3/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FIRM_PAN,EFF_DATE,DFIRM_ID&returnGeometry=false&f=json`

    const [floodRes, firmRes] = await Promise.all([
      fetch(floodUrl, { signal: AbortSignal.timeout(10000) }).then(r => r.json()).catch(() => null),
      fetch(firmUrl, { signal: AbortSignal.timeout(10000) }).then(r => r.json()).catch(() => null),
    ])

    const flood = floodRes?.features?.[0]?.attributes
    if (!flood) return null
    const firm = firmRes?.features?.[0]?.attributes

    const zone = flood.FLD_ZONE || 'Unknown'
    const sfha = flood.SFHA_TF === 'T'
    const bfe = flood.STATIC_BFE > -9000 ? flood.STATIC_BFE : null
    const depth = flood.DEPTH > -9000 ? flood.DEPTH : null
    const velocity = flood.VELOCITY > -9000 ? flood.VELOCITY : null

    let riskTier: string, insuranceReq: string
    if (['VE', 'V'].some(z => zone.startsWith(z))) {
      riskTier = 'EXTREME'; insuranceReq = 'MANDATORY (Coastal High Velocity)'
    } else if (['AE', 'A', 'AH', 'AO', 'AR', 'A99'].some(z => zone.startsWith(z))) {
      riskTier = 'HIGH'; insuranceReq = 'MANDATORY (100-Year Floodplain)'
    } else if (flood.ZONE_SUBTY?.includes('0.2 PCT')) {
      riskTier = 'MODERATE'; insuranceReq = 'Recommended (500-Year Floodplain)'
    } else if (['X', 'C', 'B'].includes(zone)) {
      riskTier = 'LOW'; insuranceReq = 'Optional (Minimal Flood Hazard)'
    } else {
      riskTier = 'UNDETERMINED'; insuranceReq = 'Check with insurer'
    }

    let firmEffDate: string | null = null
    if (firm?.EFF_DATE) firmEffDate = new Date(firm.EFF_DATE).toISOString().split('T')[0]

    return {
      zone, subtype: flood.ZONE_SUBTY || '', sfha, bfe, depth, velocity,
      riskTier, insuranceReq, dfirmId: flood.DFIRM_ID,
      firmPanel: firm?.FIRM_PAN || null, firmEffDate,
      sourceCitation: flood.SOURCE_CIT,
    }
  } catch { return null }
}

// Census ACS 5-Year API (free, no key required)
const CENSUS_ACS_VARS = [
  'B08301_001E','B08301_003E','B08301_010E','B08301_018E','B08301_019E',  // Commute mode
  'B25044_003E',                                                           // Zero-vehicle HH
  'B15003_001E','B15003_022E','B15003_023E','B15003_025E',                // Education
  'B19013_001E',                                                           // Median HH income
  'B17001_001E','B17001_002E',                                            // Poverty
  'B25002_001E','B25002_002E','B25002_003E',                              // Occupancy
  'B25003_002E','B25003_003E',                                            // Tenure
  'B25064_001E',                                                           // Median rent
  'B01003_001E','B01002_001E',                                            // Pop & age
].join(',')

interface CensusData {
  totalPop: number; medianAge: number; medianIncome: number; medianRent: number
  povertyRate: number; vacancyRate: number; ownerOccupiedPct: number; renterPct: number
  walkPct: number; transitPct: number; bikePct: number; droveAlonePct: number
  zeroVehiclePct: number; bachelorsPlusPct: number
  walkabilityScore: number; educationScore: number; safetyScore: number
  totalWorkers: number; totalHousingUnits: number
}

async function fetchCensusData(zipCode: string): Promise<CensusData | null> {
  try {
    const url = `https://api.census.gov/data/2022/acs/acs5?get=${CENSUS_ACS_VARS}&for=zip%20code%20tabulation%20area:${zipCode}`
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
    const data = await res.json()
    if (!data || data.length < 2) return null

    const v: Record<string, number> = {}
    for (let i = 0; i < data[0].length; i++) {
      v[data[0][i]] = data[0][i] === 'B01002_001E' ? parseFloat(data[1][i]) || 0 : parseInt(data[1][i]) || 0
    }

    const totalWorkers = v['B08301_001E'] || 1
    const totalHU = v['B25002_001E'] || 1
    const occupied = v['B25002_002E'] || 1
    const pop25 = v['B15003_001E'] || 1
    const povUniverse = v['B17001_001E'] || 1

    const walkPct = (v['B08301_018E'] / totalWorkers) * 100
    const transitPct = (v['B08301_010E'] / totalWorkers) * 100
    const bikePct = (v['B08301_019E'] / totalWorkers) * 100
    const droveAlonePct = (v['B08301_003E'] / totalWorkers) * 100
    const zeroVehiclePct = (v['B25044_003E'] / totalHU) * 100
    const bachelorsPlusPct = ((v['B15003_022E'] + v['B15003_023E'] + v['B15003_025E']) / pop25) * 100
    const povertyRate = (v['B17001_002E'] / povUniverse) * 100
    const vacancyRate = (v['B25002_003E'] / totalHU) * 100
    const ownerOccupiedPct = (v['B25003_002E'] / occupied) * 100
    const renterPct = (v['B25003_003E'] / occupied) * 100

    // Walkability Score (0-100): weighted commute modes + zero-vehicle density
    const walkabilityScore = Math.min(100, Math.round(
      walkPct * 3 + transitPct * 3 + bikePct * 2 + zeroVehiclePct * 2
    ))

    // Education Score (0-100): bachelor's+ percentage scaled
    const educationScore = Math.min(100, Math.round(bachelorsPlusPct * 2))

    // Safety Score (0-100): inverse of poverty + high ownership = safer
    const safetyScore = Math.min(100, Math.max(0, Math.round(
      100 - (povertyRate * 3) - Math.max(0, 30 - ownerOccupiedPct) * 0.5
    )))

    return {
      totalPop: v['B01003_001E'], medianAge: v['B01002_001E'],
      medianIncome: v['B19013_001E'], medianRent: v['B25064_001E'],
      povertyRate: Math.round(povertyRate * 10) / 10,
      vacancyRate: Math.round(vacancyRate * 10) / 10,
      ownerOccupiedPct: Math.round(ownerOccupiedPct * 10) / 10,
      renterPct: Math.round(renterPct * 10) / 10,
      walkPct: Math.round(walkPct * 10) / 10,
      transitPct: Math.round(transitPct * 10) / 10,
      bikePct: Math.round(bikePct * 10) / 10,
      droveAlonePct: Math.round(droveAlonePct * 10) / 10,
      zeroVehiclePct: Math.round(zeroVehiclePct * 10) / 10,
      bachelorsPlusPct: Math.round(bachelorsPlusPct * 10) / 10,
      walkabilityScore, educationScore, safetyScore,
      totalWorkers, totalHousingUnits: totalHU,
    }
  } catch { return null }
}

function parseDimsJson(description: string | null): any {
  if (!description) return null
  const match = description.match(/<!--DIMS:(\{[\s\S]*?\})-->/)
  if (!match) return null
  try { return JSON.parse(match[1]) } catch { return null }
}

interface KPIEntry { name: string; value: any; unit?: string; source: string; url?: string; note?: string }
interface KPIResult {
  kpis: Record<string, Record<string, KPIEntry>>
  summary: string
  populated: number
  total: number
}

async function computePropertyKPIs(
  supabase: any,
  parcel: any,
  zoningDistricts: any[] = [],
  zoningUses: any[] = []
): Promise<KPIResult | null> {
  if (!parcel || !parcel.parcel_id) return null
  const p = parcel

  // ── Infer zoning if not provided ──
  let zoneDims: any = null
  let zoneCode = p.zone_code || ''
  let zoneName = ''
  let zoneCategory = ''
  let standards: any = null
  let uses = zoningUses
  let jurisdictionName = p.phy_city || ''

  if (zoningDistricts.length > 0) {
    const zd = zoningDistricts[0]
    zoneCode = zd.zoneCode || zd.code || zoneCode
    zoneName = zd.zoneName || zd.name || ''
    zoneCategory = zd.category || ''
    zoneDims = parseDimsJson(zd.description)
  }

  // If no zone data, infer from DOR use code + city
  if (!zoneCode && p.phy_city) {
    try {
      const cityTitleCase = p.phy_city.split(' ').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
      // Try exact match, then fuzzy
      let { data: jurs } = await supabase.from('jurisdictions')
        .select('id,name').eq('county', 'Brevard').eq('name', cityTitleCase).limit(1)
      if (!jurs?.length) {
        const res = await supabase.from('jurisdictions')
          .select('id,name').eq('county', 'Brevard').ilike('name', `%${p.phy_city}%`).limit(5)
        jurs = res.data?.sort((a: any, b: any) => a.name.length - b.name.length) || []
      }
      if (jurs?.length) {
        jurisdictionName = jurs[0].name
        const dorUc = p.dor_uc || '001'
        const cat = DOR_TO_CATEGORY[dorUc] || 'residential'
        const hint = DOR_TO_ZONE_HINT[dorUc] || 'R-1'

        const { data: zones } = await supabase.from('zoning_districts')
          .select('id,code,name,category,description').eq('jurisdiction_id', jurs[0].id)

        if (zones?.length) {
          const best = zones.find((z: any) => z.code === hint && z.description?.includes('DIMS'))
            || zones.find((z: any) => z.category === cat && z.description?.includes('DIMS'))
            || zones.find((z: any) => z.category === cat)
            || zones[0]
          zoneCode = best.code
          zoneName = best.name
          zoneCategory = best.category || ''
          zoneDims = parseDimsJson(best.description)

          // Fetch standards and uses for inferred zone
          const [stRes, usRes] = await Promise.all([
            supabase.from('zone_standards').select('*').eq('zoning_district_id', best.id).limit(1),
            uses.length === 0 ? supabase.from('permitted_uses').select('*').eq('zoning_district_id', best.id).limit(20) : Promise.resolve({ data: uses })
          ])
          standards = stRes.data?.[0] || null
          uses = usRes.data || []
        }
      }
    } catch (e) { /* zone inference non-fatal */ }
  }

  // ── Fetch area stats (200 comps from same ZIP) ──
  let areaStats: any[] = []
  try {
    const { data } = await supabase.from('fl_parcels')
      .select('jv,tot_lvg_ar,lnd_sqfoot,sale_prc1,sale_yr1')
      .eq('co_no', p.co_no).eq('phy_zipcd', p.phy_zipcd)
      .gt('jv', 0).gt('tot_lvg_ar', 0).limit(200)
    areaStats = data || []
  } catch { /* non-fatal */ }

  // ── Fetch FEMA NFHL flood zone data ──
  let fema: FemaFloodData | null = null
  if (p.centroid_lat && p.centroid_lng) {
    try { fema = await fetchFemaFloodZone(p.centroid_lat, p.centroid_lng) } catch { /* non-fatal */ }
  }

  // ── Fetch Census ACS neighborhood data ──
  let census: CensusData | null = null
  if (p.phy_zipcd) {
    try { census = await fetchCensusData(p.phy_zipcd) } catch { /* non-fatal */ }
  }

  // ── Computed values ──
  const d = zoneDims || {}
  const s = standards || {}
  const addrParts = (p.phy_addr1 || '').match(/^(\d+)\s+(.+)$/) || []
  const buildingValue = Math.max(0, (p.jv || 0) - (p.lnd_val || 0))
  const pricePerSqft = p.tot_lvg_ar > 0 ? p.jv / p.tot_lvg_ar : 0
  const landPricePerSqft = p.lnd_sqfoot > 0 ? p.lnd_val / p.lnd_sqfoot : 0
  const improvementRatio = p.jv > 0 ? buildingValue / p.jv : 0
  const appreciationSinceSale = p.sale_prc1 > 0 ? ((p.jv - p.sale_prc1) / p.sale_prc1 * 100) : null
  const annualTax = Math.round((p.jv || 0) * BREVARD_MILLAGE)
  const insuranceEst = Math.round((p.tot_lvg_ar || 0) * INSURANCE_RATE_PER_SQFT)
  const monthlyRentEst = Math.round((p.tot_lvg_ar || 0) * RENTAL_RATE_PER_SQFT)
  const annualRentEst = monthlyRentEst * 12
  const grossRentMult = annualRentEst > 0 ? (p.jv / annualRentEst).toFixed(1) : 'N/A'
  const capRate = p.jv > 0 ? ((annualRentEst - annualTax - insuranceEst) / p.jv * 100) : 0
  const priceToRent = monthlyRentEst > 0 ? (p.jv / (monthlyRentEst * 12)).toFixed(1) : 'N/A'
  const noi = annualRentEst - annualTax - insuranceEst
  const cocReturn = p.jv > 0 ? ((noi - p.jv * 0.75 * 0.065) / (p.jv * 0.25) * 100).toFixed(1) : 'N/A'
  const breakEvenRent = Math.round((annualTax + insuranceEst + (p.jv || 0) * 0.75 * 0.065) / 12)

  // Area stats
  const areaValues = areaStats.filter((a: any) => a.jv > 0).map((a: any) => a.jv)
  const areaMedianValue = areaValues.length > 0 ? areaValues.sort((a, b) => a - b)[Math.floor(areaValues.length / 2)] : 0
  const areaPPSqft = areaStats.filter((a: any) => a.tot_lvg_ar > 0)
  const areaAvgPPSqft = areaPPSqft.length > 0 ? Math.round(areaPPSqft.reduce((s: number, a: any) => s + a.jv / a.tot_lvg_ar, 0) / areaPPSqft.length) : 0
  const valueVsMedian = areaMedianValue > 0 ? ((p.jv - areaMedianValue) / areaMedianValue * 100).toFixed(1) : 'N/A'
  const recentSales = areaStats.filter((a: any) => a.sale_yr1 >= 2023 && a.sale_prc1 > 0)
  const pricePctile = areaValues.length > 0 ? Math.round(areaValues.filter(v => v < p.jv).length / areaValues.length * 100) : null

  // Zoning computations
  const maxFar = d.floor_area_ratio || s.max_far || null
  const maxCoverage = d.coverage_pct || s.max_lot_coverage_pct || null
  const maxBuildingArea = maxFar && p.lnd_sqfoot ? Math.round(p.lnd_sqfoot * maxFar) : null
  const unusedRights = maxBuildingArea ? Math.max(0, maxBuildingArea - (p.tot_lvg_ar || 0)) : null
  const farUtilization = maxFar && p.lnd_sqfoot && p.tot_lvg_ar ? ((p.tot_lvg_ar / p.lnd_sqfoot / maxFar) * 100).toFixed(1) : null

  // Permitted uses
  const permittedList = uses.filter((u: any) => u.use_type === 'permitted').map((u: any) => u.use_description)
  const conditionalList = uses.filter((u: any) => u.requires_special_permit).map((u: any) => u.use_description)
  const isSTRAllowed = uses.some((u: any) => u.is_short_term_rental)
  const isADUAllowed = uses.some((u: any) => u.is_adu)
  const isMixedUse = uses.some((u: any) => u.is_mixed_use)

  // Risk scoring
  let riskScore = 50
  if (p.eff_yr_blt > 0 && p.eff_yr_blt < 1970) riskScore += 10
  if ((p.const_clas || 0) >= 5) riskScore += 10
  if ((p.imp_qual || 0) >= 5) riskScore += 10
  if (p.jv > areaMedianValue * 1.5) riskScore += 5
  if (buildingValue < (p.lnd_val || 1) * 0.3) riskScore += 5
  // FEMA flood risk adjustments
  if (fema) {
    if (fema.riskTier === 'EXTREME') riskScore += 20
    else if (fema.riskTier === 'HIGH') riskScore += 15
    else if (fema.riskTier === 'MODERATE') riskScore += 5
    else if (fema.riskTier === 'LOW') riskScore -= 5
  }
  riskScore = Math.min(100, Math.max(0, riskScore))

  // Opportunity scoring
  let oppScore = 50
  if (appreciationSinceSale !== null && appreciationSinceSale > 20) oppScore += 10
  if (pricePerSqft > 0 && pricePerSqft < areaAvgPPSqft * 0.85) oppScore += 15
  if (unusedRights && unusedRights > (p.tot_lvg_ar || 0)) oppScore += 10
  if (p.av_hmstd > 0) oppScore -= 5
  oppScore = Math.min(100, Math.max(0, oppScore))
  const investGrade = oppScore >= 80 ? 'A+' : oppScore >= 70 ? 'A' : oppScore >= 60 ? 'B' : oppScore >= 40 ? 'C' : 'D'
  const arvEstimate = Math.round((areaMedianValue || p.jv) * 1.05)
  const maxBid = Math.round(((areaMedianValue || p.jv) * 0.7) - 10000 - Math.min(25000, (areaMedianValue || p.jv) * 0.15))
  const repairEst = (p.eff_yr_blt > 0 && p.eff_yr_blt < 1990) ? Math.round((p.tot_lvg_ar || 0) * 25) : Math.round((p.tot_lvg_ar || 0) * 10)

  // ── Build 128 KPI sections ──
  const kpis: Record<string, Record<string, KPIEntry>> = {
    property_identification: {
      KPI_001: { name: 'Parcel ID', value: p.parcel_id, source: 'FDOR' },
      KPI_002: { name: 'County', value: FL_COUNTY_MAP[p.co_no] || `County ${p.co_no}`, source: 'FDOR' },
      KPI_003: { name: 'Full Address', value: `${p.phy_addr1 || ''}, ${p.phy_city || ''}, FL ${p.phy_zipcd || ''}`, source: 'FDOR' },
      KPI_004: { name: 'Street Number', value: addrParts[1] || '', source: 'Parsed' },
      KPI_005: { name: 'Street Name', value: addrParts[2] || p.phy_addr1 || '', source: 'Parsed' },
      KPI_006: { name: 'City', value: p.phy_city, source: 'FDOR' },
      KPI_007: { name: 'State', value: 'FL', source: 'FDOR' },
      KPI_008: { name: 'ZIP Code', value: p.phy_zipcd, source: 'FDOR' },
      KPI_009: { name: 'Owner Name', value: p.own_name, source: 'FDOR' },
      KPI_010: { name: 'Owner Address', value: `${p.own_addr1||''}, ${p.own_city||''}, ${p.own_state||''} ${p.own_zipcd||''}`.trim(), source: 'FDOR' },
      KPI_011: { name: 'Property Type', value: DOR_USE_CODES[p.dor_uc] || `Code ${p.dor_uc}`, source: 'FDOR' },
      KPI_012: { name: 'PA Use Code', value: p.pa_uc, source: 'FDOR' },
    },
    physical_characteristics: {
      KPI_013: { name: 'Total Living Area', value: p.tot_lvg_ar, unit: 'sq ft', source: 'FDOR' },
      KPI_014: { name: 'Lot Size', value: p.lnd_sqfoot, unit: 'sq ft', source: 'FDOR' },
      KPI_015: { name: 'Lot Size (Acres)', value: p.lnd_sqfoot ? (p.lnd_sqfoot / 43560).toFixed(2) : null, unit: 'acres', source: 'Calculated' },
      KPI_016: { name: 'Year Built (Actual)', value: p.act_yr_blt || null, source: 'FDOR' },
      KPI_017: { name: 'Year Built (Effective)', value: p.eff_yr_blt || null, source: 'FDOR' },
      KPI_018: { name: 'Building Age', value: p.eff_yr_blt > 0 ? (2026 - p.eff_yr_blt) : null, unit: 'years', source: 'Calculated' },
      KPI_019: { name: 'Number of Buildings', value: p.no_buldng, source: 'FDOR' },
      KPI_020: { name: 'Residential Units', value: p.no_res_unt, source: 'FDOR' },
      KPI_021: { name: 'Construction Class', value: CONSTRUCTION_CLASS[p.const_clas] || 'N/A', source: 'FDOR' },
      KPI_022: { name: 'Improvement Quality', value: IMP_QUALITY[p.imp_qual] || 'N/A', source: 'FDOR' },
      KPI_023: { name: 'Special Features Value', value: p.spec_feat_ || 0, unit: '$', source: 'FDOR' },
      KPI_024: { name: 'Land Units', value: p.no_lnd_unt, source: 'FDOR' },
      KPI_025: { name: 'Aerial Photo', value: p.photo_url ? 'Available' : 'N/A', url: p.photo_url, source: 'Esri' },
    },
    financial_valuation: {
      KPI_026: { name: 'Just (Market) Value', value: p.jv, unit: '$', source: 'FDOR' },
      KPI_027: { name: 'Land Value', value: p.lnd_val, unit: '$', source: 'FDOR' },
      KPI_028: { name: 'Building Value', value: buildingValue, unit: '$', source: 'Calculated' },
      KPI_029: { name: 'Assessed Value (Homestead)', value: p.av_hmstd, unit: '$', source: 'FDOR' },
      KPI_030: { name: 'Assessed Value (Non-Hmstd)', value: p.av_non_hms, unit: '$', source: 'FDOR' },
      KPI_031: { name: 'Assessed Value (School)', value: p.av_sd, unit: '$', source: 'FDOR' },
      KPI_032: { name: 'Assessed Value (Non-School)', value: p.av_nsd, unit: '$', source: 'FDOR' },
      KPI_033: { name: 'Taxable Value (School)', value: p.tv_sd, unit: '$', source: 'FDOR' },
      KPI_034: { name: 'Taxable Value (Non-School)', value: p.tv_nsd, unit: '$', source: 'FDOR' },
      KPI_035: { name: 'Price Per Sq Ft', value: Math.round(pricePerSqft), unit: '$/sqft', source: 'Calculated' },
      KPI_036: { name: 'Land Price Per Sq Ft', value: Math.round(landPricePerSqft * 100) / 100, unit: '$/sqft', source: 'Calculated' },
      KPI_037: { name: 'Improvement Ratio', value: (improvementRatio * 100).toFixed(1), unit: '%', source: 'Calculated' },
      KPI_038: { name: 'Homestead Exemption', value: p.av_hmstd > 0 ? 'Yes' : 'No', source: 'FDOR' },
      KPI_039: { name: 'Special Features Value', value: p.spec_feat_ || 0, unit: '$', source: 'FDOR' },
      KPI_040: { name: 'Last Sale Price', value: p.sale_prc1 || 0, unit: '$', source: 'FDOR' },
      KPI_041: { name: 'Last Sale Year', value: p.sale_yr1 || null, source: 'FDOR' },
      KPI_042: { name: 'Last Sale Month', value: p.sale_mo1 || null, source: 'FDOR' },
      KPI_043: { name: 'Appreciation Since Sale', value: appreciationSinceSale !== null ? `${appreciationSinceSale.toFixed(1)}%` : null, source: 'Calculated' },
      KPI_044: { name: 'Annual Tax Estimate', value: annualTax, unit: '$', source: 'Calculated' },
      KPI_045: { name: 'Insurance Estimate', value: insuranceEst, unit: '$/yr', source: 'Calculated' },
    },
    market_analysis: {
      KPI_046: { name: 'Area Median Value', value: areaMedianValue || null, unit: '$', source: 'fl_parcels' },
      KPI_047: { name: 'Area Avg $/SqFt', value: areaAvgPPSqft || null, unit: '$/sqft', source: 'fl_parcels' },
      KPI_048: { name: 'Value vs Area Median', value: valueVsMedian !== 'N/A' ? `${valueVsMedian}%` : null, source: 'Calculated' },
      KPI_049: { name: 'Properties in ZIP', value: areaStats.length, source: 'fl_parcels' },
      KPI_050: { name: 'Recent Sales (2023+)', value: recentSales.length, source: 'fl_parcels' },
      KPI_051: { name: 'Median Recent Sale', value: recentSales.length > 0 ? recentSales.map((r: any)=>r.sale_prc1).sort((a: number,b: number)=>a-b)[Math.floor(recentSales.length/2)] : null, unit: '$', source: 'Calculated' },
      KPI_052: { name: 'Walkability Score', value: census?.walkabilityScore ?? null, unit: '/100', source: 'Census ACS' },
      KPI_053: { name: 'Walk Commute %', value: census ? `${census.walkPct}%` : null, source: 'Census ACS' },
      KPI_054: { name: 'Transit Commute %', value: census ? `${census.transitPct}%` : null, source: 'Census ACS' },
      KPI_055: { name: 'Bike Commute %', value: census ? `${census.bikePct}%` : null, source: 'Census ACS' },
      KPI_056: { name: 'Latitude', value: p.centroid_lat, source: 'FDOR' },
      KPI_057: { name: 'Longitude', value: p.centroid_lng, source: 'FDOR' },
      KPI_058: { name: 'Price Percentile (ZIP)', value: pricePctile, unit: '%ile', source: 'Calculated' },
      KPI_059: { name: 'Median HH Income (ZIP)', value: census?.medianIncome || null, unit: '$', source: 'Census ACS' },
      KPI_060: { name: 'Median Gross Rent (ZIP)', value: census?.medianRent || null, unit: '$/mo', source: 'Census ACS' },
      KPI_061: { name: 'Education Score', value: census?.educationScore ?? null, unit: '/100', source: 'Census ACS' },
      KPI_062: { name: 'Safety Score', value: census?.safetyScore ?? null, unit: '/100', source: 'Census ACS' },
      KPI_063: { name: 'Poverty Rate (ZIP)', value: census ? `${census.povertyRate}%` : null, source: 'Census ACS' },
    },
    zoning_regulatory: {
      KPI_064: { name: 'Zone Code', value: zoneCode || null, source: 'zoning_districts' },
      KPI_065: { name: 'Zone Name', value: zoneName || null, source: 'zoning_districts' },
      KPI_066: { name: 'Zone Category', value: zoneCategory || null, source: 'zoning_districts' },
      KPI_067: { name: 'Max Height', value: d.max_height_ft || s.max_height_ft || null, unit: 'ft', source: 'DIMS' },
      KPI_068: { name: 'Max Stories', value: d.max_stories || s.max_stories || null, source: 'DIMS' },
      KPI_069: { name: 'Max Lot Coverage', value: maxCoverage ? `${maxCoverage}%` : null, source: 'DIMS' },
      KPI_070: { name: 'Front Setback', value: d.setbacks_ft?.front || s.front_setback_ft || null, unit: 'ft', source: 'DIMS' },
      KPI_071: { name: 'Side Setback', value: d.setbacks_ft?.side || s.side_setback_ft || null, unit: 'ft', source: 'DIMS' },
      KPI_072: { name: 'Rear Setback', value: d.setbacks_ft?.rear || s.rear_setback_ft || null, unit: 'ft', source: 'DIMS' },
      KPI_073: { name: 'Corner Setback', value: d.setbacks_ft?.corner || s.corner_setback_ft || null, unit: 'ft', source: 'DIMS' },
      KPI_074: { name: 'Floor Area Ratio', value: maxFar, source: 'DIMS' },
      KPI_075: { name: 'Max Density', value: d.density_max_du_acre || s.max_density_du_acre || null, unit: 'DU/acre', source: 'DIMS' },
      KPI_076: { name: 'Min Lot Size', value: d.min_lot_sqft || s.min_lot_sqft || null, unit: 'sq ft', source: 'DIMS' },
      KPI_077: { name: 'Min Lot Width', value: d.min_lot_width_ft || s.min_lot_width_ft || null, unit: 'ft', source: 'DIMS' },
      KPI_078: { name: 'Parking Required', value: d.parking_min || d.parking_min_per_1000sf || s.parking_per_unit || null, source: 'DIMS' },
      KPI_079: { name: 'Max Building Area', value: maxBuildingArea, unit: 'sq ft', source: 'Calculated' },
      KPI_080: { name: 'Unused Dev Rights', value: unusedRights, unit: 'sq ft', source: 'Calculated' },
      KPI_081: { name: 'FAR Utilization', value: farUtilization ? `${farUtilization}%` : null, source: 'Calculated' },
      KPI_082: { name: 'Expansion Potential', value: unusedRights && (p.tot_lvg_ar||0) > 0 ? `${Math.round(unusedRights/(p.tot_lvg_ar)*100)}%` : null, source: 'Calculated' },
      KPI_083: { name: 'Jurisdiction', value: jurisdictionName, source: 'Inferred' },
    },
    permitted_uses: {
      KPI_084: { name: 'Permitted Uses Count', value: permittedList.length, source: 'permitted_uses' },
      KPI_085: { name: 'Top Permitted Uses', value: permittedList.slice(0, 5).join('; ') || null, source: 'permitted_uses' },
      KPI_086: { name: 'Conditional Uses Count', value: conditionalList.length, source: 'permitted_uses' },
      KPI_087: { name: 'Short-Term Rental', value: isSTRAllowed ? 'Allowed' : 'Not Listed', source: 'permitted_uses' },
      KPI_088: { name: 'ADU Allowed', value: isADUAllowed ? 'Yes' : 'Not Listed', source: 'permitted_uses' },
      KPI_089: { name: 'Mixed Use', value: isMixedUse ? 'Yes' : 'Not Listed', source: 'permitted_uses' },
      KPI_090: { name: 'Live Local Act', value: 'Check Required', source: 'State Law' },
      KPI_091: { name: 'Ordinance Source', value: d.source_url || s.source_url || null, source: 'DIMS' },
    },
    investment_metrics: {
      KPI_092: { name: 'Monthly Rent Estimate', value: monthlyRentEst, unit: '$', source: 'Calculated' },
      KPI_093: { name: 'Annual Rent Estimate', value: annualRentEst, unit: '$', source: 'Calculated' },
      KPI_094: { name: 'Gross Rent Multiplier', value: grossRentMult, source: 'Calculated' },
      KPI_095: { name: 'Cap Rate Estimate', value: `${capRate.toFixed(1)}%`, source: 'Calculated' },
      KPI_096: { name: 'Price-to-Rent Ratio', value: priceToRent, source: 'Calculated' },
      KPI_097: { name: 'NOI Estimate', value: noi, unit: '$/yr', source: 'Calculated' },
      KPI_098: { name: 'Cash-on-Cash (25% down)', value: cocReturn !== 'N/A' ? `${cocReturn}%` : null, source: 'Calculated' },
      KPI_099: { name: 'Annual Tax', value: annualTax, unit: '$', source: 'Calculated' },
      KPI_100: { name: 'Annual Insurance', value: insuranceEst, unit: '$', source: 'Calculated' },
      KPI_101: { name: 'Annual Expenses', value: annualTax + insuranceEst, unit: '$', source: 'Calculated' },
      KPI_102: { name: 'Expense Ratio', value: annualRentEst > 0 ? `${((annualTax + insuranceEst) / annualRentEst * 100).toFixed(1)}%` : null, source: 'Calculated' },
      KPI_103: { name: 'Break-Even Rent', value: breakEvenRent, unit: '$/mo', source: 'Calculated' },
    },
    risk_assessment: {
      KPI_104: { name: 'Risk Score', value: riskScore, unit: '/100', source: 'BidDeed.AI' },
      KPI_105: { name: 'Risk Level', value: riskScore >= 70 ? 'HIGH' : riskScore >= 50 ? 'MODERATE' : 'LOW', source: 'BidDeed.AI' },
      KPI_106: { name: 'Building Age Risk', value: p.eff_yr_blt > 0 && p.eff_yr_blt < 1970 ? 'Pre-1970' : p.eff_yr_blt < 1990 ? 'Aging (30+yr)' : 'Acceptable', source: 'Calculated' },
      KPI_107: { name: 'Construction Risk', value: (p.const_clas||0) >= 5 ? 'Below Average' : 'Acceptable', source: 'FDOR' },
      KPI_108: { name: 'Quality Risk', value: (p.imp_qual||0) >= 5 ? 'Below Average' : 'Acceptable', source: 'FDOR' },
      KPI_109: { name: 'Overvalued vs Area', value: (p.jv||0) > areaMedianValue * 1.5 ? 'Above Median' : 'Within Range', source: 'Calculated' },
      KPI_110: { name: 'Teardown Candidate', value: buildingValue < (p.lnd_val||1) * 0.3 ? 'Yes' : 'No', source: 'Calculated' },
      KPI_111: { name: 'Homestead Protected', value: (p.av_hmstd||0) > 0 ? 'Yes' : 'No', source: 'FDOR' },
      KPI_112: { name: 'FEMA Flood Zone', value: fema?.zone || 'Not queried', source: 'FEMA NFHL' },
      KPI_113: { name: 'Flood Zone Description', value: fema?.subtype || 'N/A', source: 'FEMA NFHL' },
      KPI_114: { name: 'Special Flood Hazard Area', value: fema ? (fema.sfha ? 'YES (SFHA)' : 'No') : 'N/A', source: 'FEMA NFHL' },
      KPI_115: { name: 'Base Flood Elevation', value: fema?.bfe ? `${fema.bfe} ft` : 'N/A', source: 'FEMA NFHL' },
      KPI_116: { name: 'Flood Insurance Required', value: fema?.insuranceReq || 'Check with insurer', source: 'FEMA NFHL' },
    },
    biddeed_scoring: {
      KPI_117: { name: 'Opportunity Score', value: oppScore, unit: '/100', source: 'BidDeed.AI' },
      KPI_118: { name: 'Investment Grade', value: investGrade, source: 'BidDeed.AI' },
      KPI_119: { name: 'Recommendation', value: oppScore >= 70 ? 'REVIEW' : oppScore >= 50 ? 'MONITOR' : 'PASS', source: 'BidDeed.AI' },
      KPI_120: { name: 'Estimated ARV', value: arvEstimate, unit: '$', source: 'BidDeed.AI' },
      KPI_121: { name: 'Max Bid (Shapira Formula)', value: maxBid, unit: '$', source: 'Shapira Formula' },
      KPI_122: { name: 'Estimated Repair Cost', value: repairEst, unit: '$', source: 'BidDeed.AI' },
      KPI_123: { name: 'Estimated Profit', value: null, note: 'Requires auction data', source: 'BidDeed.AI' },
      KPI_124: { name: 'Estimated ROI', value: null, note: 'Requires auction data', source: 'BidDeed.AI' },
      KPI_125: { name: 'Exit Strategy', value: monthlyRentEst > 2000 ? 'Rent (strong cashflow)' : 'Fix & Flip', source: 'BidDeed.AI' },
      KPI_126: { name: 'Time to Exit', value: monthlyRentEst > 2000 ? 'Hold (rental)' : '90-120 days', source: 'BidDeed.AI' },
      KPI_127: { name: 'Deal Quality Flags', value: [
        pricePerSqft > 0 && pricePerSqft < areaAvgPPSqft * 0.85 ? 'Below-market $/sqft' : null,
        unusedRights && unusedRights > (p.tot_lvg_ar||1) ? 'High expansion potential' : null,
        p.eff_yr_blt >= 2000 ? 'Modern construction' : null,
        (p.av_hmstd||0) === 0 ? 'Non-homestead' : null,
      ].filter(Boolean).join('; ') || 'None', source: 'BidDeed.AI' },
      KPI_128: { name: 'Data Confidence', value: [p.jv > 0, (p.tot_lvg_ar||0) > 0, (p.eff_yr_blt||0) > 0, p.centroid_lat, zoneCode].filter(Boolean).length >= 4 ? 'HIGH' : 'MODERATE', source: 'BidDeed.AI' },
    },
  }

  // Count populated
  let populated = 0, total = 0
  for (const section of Object.values(kpis)) {
    for (const [key, kpi] of Object.entries(section)) {
      if (!key.startsWith('KPI_')) continue
      total++
      if (kpi.value !== null && kpi.value !== undefined && kpi.value !== 'N/A' && kpi.value !== '') populated++
    }
  }

  // Build context summary for Claude
  const fmtDollar = (v: any) => v ? `$${Number(v).toLocaleString()}` : 'N/A'
  const summary = `
128-KPI PROPERTY INTELLIGENCE (${populated}/${total} populated):
  Grade: ${investGrade} | Risk: ${riskScore >= 70 ? 'HIGH' : riskScore >= 50 ? 'MODERATE' : 'LOW'} (${riskScore}/100) | Opportunity: ${oppScore}/100

  VALUATION: Just Value ${fmtDollar(p.jv)} | Land ${fmtDollar(p.lnd_val)} | Building ${fmtDollar(buildingValue)} | ${Math.round(pricePerSqft)} $/sqft
  MARKET: Area Median ${fmtDollar(areaMedianValue)} | vs Median ${valueVsMedian}% | ${pricePctile || 'N/A'}th percentile | ${areaStats.length} comps
  ZONING: ${zoneCode || 'N/A'} (${zoneName || 'Unknown'}) | Height ${d.max_height_ft || 'N/A'}ft | Coverage ${maxCoverage || 'N/A'}% | FAR ${maxFar || 'N/A'}
  INVESTMENT: Rent Est. $${monthlyRentEst}/mo | Cap Rate ${capRate.toFixed(1)}% | GRM ${grossRentMult} | NOI ${fmtDollar(noi)}/yr | CoC ${cocReturn}%
  SCORING: Max Bid ${fmtDollar(maxBid)} (Shapira Formula) | ARV ${fmtDollar(arvEstimate)} | Repair ${fmtDollar(repairEst)} | Exit: ${monthlyRentEst > 2000 ? 'Rent' : 'Flip'}
  FEMA FLOOD: Zone ${fema?.zone || 'N/A'} (${fema?.subtype || 'Unknown'}) | SFHA: ${fema?.sfha ? 'YES' : 'No'} | BFE: ${fema?.bfe || 'N/A'} ft | Risk: ${fema?.riskTier || 'N/A'} | Insurance: ${fema?.insuranceReq || 'N/A'} | FIRM: ${fema?.firmPanel || 'N/A'}
  NEIGHBORHOOD (Census ACS): Walkability ${census?.walkabilityScore ?? 'N/A'}/100 | Education ${census?.educationScore ?? 'N/A'}/100 | Safety ${census?.safetyScore ?? 'N/A'}/100 | Income $${census?.medianIncome?.toLocaleString() || 'N/A'} | Rent $${census?.medianRent || 'N/A'}/mo | Poverty ${census?.povertyRate || 'N/A'}% | Walk ${census?.walkPct || 'N/A'}% | Transit ${census?.transitPct || 'N/A'}%
  USES: ${permittedList.length} permitted | STR: ${isSTRAllowed ? 'Yes' : 'N/A'} | ADU: ${isADUAllowed ? 'Yes' : 'N/A'} | Mixed: ${isMixedUse ? 'Yes' : 'N/A'}
`.trim()

  return { kpis, summary, populated, total }
}


// ============================================================================
// ZONING DATA FETCHING (existing)
// ============================================================================

interface ZoneDataResult {
  context: string | null;
  zoneData: {
    districts: any[];
    uses: any[];
    jurisdiction: string | null;
    coordinates: [number, number] | null;
  };
}

async function fetchRelevantZoningData(supabase: any, messages: Message[]): Promise<ZoneDataResult> {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''
  const emptyResult: ZoneDataResult = { context: null, zoneData: { districts: [], uses: [], jurisdiction: null, coordinates: null } }

  const zoneCodeMatch = lastMessage.match(/\b([a-z]{1,4}-?\d{0,3}[a-z]?)\b/i)

  let jurisdiction: string | null = null
  let coordinates: [number, number] | null = null
  for (const [name, coords] of Object.entries(JURISDICTION_COORDS)) {
    if (lastMessage.includes(name)) {
      jurisdiction = name
      coordinates = coords
      break
    }
  }

  if (!zoneCodeMatch && !jurisdiction) return emptyResult

  const results: string[] = []
  const allDistricts: any[] = []
  const allUses: any[] = []

  try {
    let query = supabase
      .from('zoning_districts')
      .select(`
        id, code, name, category, description,
        jurisdictions!inner(id, name, county, state),
        zone_standards(front_setback_ft, side_setback_ft, rear_setback_ft, max_height_ft, max_stories, min_lot_sqft, max_lot_coverage_pct, max_far, max_density_du_acre, min_open_space_pct)
      `)

    if (zoneCodeMatch) query = query.ilike('code', `%${zoneCodeMatch[1]}%`)
    if (jurisdiction) query = query.ilike('jurisdictions.name', `%${jurisdiction}%`)

    const { data: districts, error } = await query.limit(5)

    if (!error && districts && districts.length > 0) {
      for (const d of districts) {
        const j = Array.isArray(d.jurisdictions) ? d.jurisdictions[0] : d.jurisdictions
        const zs = Array.isArray(d.zone_standards) ? d.zone_standards[0] : d.zone_standards

        const districtData: any = {
          id: d.id,
          zoneCode: d.code,
          zoneName: d.name,
          zoneType: d.category || 'general',
          jurisdiction: j?.name || 'N/A',
          county: j?.county || 'N/A',
        }

        let entry = `ZONE: ${d.code} — ${d.name}\nJurisdiction: ${j?.name || 'N/A'}, ${j?.county || 'N/A'} County\nCategory: ${d.category || 'N/A'}`
        if (d.description) entry += `\nDescription: ${d.description}`

        if (zs) {
          districtData.setbacks = { front: zs.front_setback_ft, side: zs.side_setback_ft, rear: zs.rear_setback_ft }
          districtData.maxHeight = zs.max_height_ft
          districtData.maxStories = zs.max_stories
          districtData.coverage = zs.max_lot_coverage_pct
          districtData.far = zs.max_far
          districtData.lotSize = { min: zs.min_lot_sqft }
          districtData.maxDensity = zs.max_density_du_acre

          entry += `\nDimensional Standards:`
          if (zs.front_setback_ft) entry += `\n  Front Setback: ${zs.front_setback_ft} ft`
          if (zs.side_setback_ft) entry += `\n  Side Setback: ${zs.side_setback_ft} ft`
          if (zs.rear_setback_ft) entry += `\n  Rear Setback: ${zs.rear_setback_ft} ft`
          if (zs.max_height_ft) entry += `\n  Max Height: ${zs.max_height_ft} ft`
          if (zs.max_stories) entry += `\n  Max Stories: ${zs.max_stories}`
          if (zs.min_lot_sqft) entry += `\n  Min Lot Size: ${zs.min_lot_sqft} sq ft`
          if (zs.max_lot_coverage_pct) entry += `\n  Max Lot Coverage: ${zs.max_lot_coverage_pct}%`
          if (zs.max_far) entry += `\n  FAR: ${zs.max_far}`
          if (zs.max_density_du_acre) entry += `\n  Max Density: ${zs.max_density_du_acre} du/acre`
        }

        allDistricts.push(districtData)
        results.push(entry)
      }

      if (!coordinates && districts[0]) {
        const jName = (Array.isArray(districts[0].jurisdictions) ? districts[0].jurisdictions[0] : districts[0].jurisdictions)?.name?.toLowerCase()
        if (jName && JURISDICTION_COORDS[jName]) {
          coordinates = JURISDICTION_COORDS[jName]
          jurisdiction = jName
        }
      }

      const districtIds = districts.map((d: any) => d.id)
      const { data: uses } = await supabase
        .from('permitted_uses')
        .select('use_type, use_category, use_description, requires_special_permit, special_conditions, zoning_district_id')
        .in('zoning_district_id', districtIds)
        .limit(25)

      if (uses && uses.length > 0) {
        const grouped: Record<number, any[]> = {}
        for (const u of uses) {
          if (!grouped[u.zoning_district_id]) grouped[u.zoning_district_id] = []
          grouped[u.zoning_district_id].push(u)
          allUses.push(u)
        }

        for (const [dId, useList] of Object.entries(grouped)) {
          const dist = districts.find((d: any) => d.id === parseInt(dId))
          if (!dist) continue
          let usesEntry = `\nPERMITTED USES for ${dist.code}:`
          for (const u of useList) {
            const status = u.requires_special_permit ? '⚠️ Special Permit' : '✅ Permitted'
            usesEntry += `\n  ${status}: ${u.use_description || u.use_type}`
            if (u.special_conditions) usesEntry += ` (${u.special_conditions})`
          }
          results.push(usesEntry)
        }
      }
    }

    if (lastMessage.match(/ordinance|code|regulation|section|chapter/i)) {
      const { data: ordinances } = await supabase
        .from('ordinances')
        .select('ordinance_number, title, chapter, section, summary, source_url')
        .limit(3)

      if (ordinances && ordinances.length > 0) {
        let ordEntry = '\nRELEVANT ORDINANCES:'
        for (const o of ordinances) {
          ordEntry += `\n  ${o.ordinance_number}: ${o.title}`
          if (o.summary) ordEntry += `\n    Summary: ${o.summary.slice(0, 150)}`
          if (o.source_url) ordEntry += `\n    Source: ${o.source_url}`
        }
        results.push(ordEntry)
      }
    }

  } catch (error) {
    console.error('Failed to fetch zoning data:', error)
    return emptyResult
  }

  return {
    context: results.length > 0 ? results.join('\n\n---\n\n') : null,
    zoneData: { districts: allDistricts, uses: allUses, jurisdiction, coordinates }
  }
}


// ============================================================================
// ARTIFACT BUILDING (zoning + parcel data)
// ============================================================================

function buildArtifacts(response: string, zoneData: ZoneDataResult['zoneData'], parcels: any[] = [], kpiResult: KPIResult | null = null): any[] {
  const artifacts: any[] = []

  const mapMatch = response.match(/\[MAP:([^\]]+)\]/)
  const tableMatch = response.match(/\[TABLE:([^\]]+)\]/)
  const reportMatch = response.match(/\[REPORT:([^\]]+)\]/)

  const primaryDistrict = zoneData.districts[0] || null
  const primaryParcel = parcels[0] || null

  // ── Property parcel artifact (NEW) ──
  if (primaryParcel) {
    artifacts.push({
      id: crypto.randomUUID(),
      type: 'table',
      title: tableMatch ? tableMatch[1] : `Property: ${primaryParcel.address}`,
      data: {
        parcels: parcels,
        primary: primaryParcel,
        districts: zoneData.districts,
        kpis: kpiResult?.kpis || null,
        kpiSummary: kpiResult ? {
          populated: kpiResult.populated,
          total: kpiResult.total,
          grade: kpiResult.kpis?.biddeed_scoring?.KPI_118?.value,
          riskLevel: kpiResult.kpis?.risk_assessment?.KPI_105?.value,
          capRate: kpiResult.kpis?.investment_metrics?.KPI_095?.value,
          maxBid: kpiResult.kpis?.biddeed_scoring?.KPI_121?.value,
          monthlyRent: kpiResult.kpis?.investment_metrics?.KPI_092?.value,
          zoneCode: kpiResult.kpis?.zoning_regulatory?.KPI_064?.value,
          floodZone: kpiResult.kpis?.risk_assessment?.KPI_112?.value,
          walkabilityScore: kpiResult.kpis?.market_analysis?.KPI_052?.value,
          educationScore: kpiResult.kpis?.market_analysis?.KPI_061?.value,
          safetyScore: kpiResult.kpis?.market_analysis?.KPI_062?.value,
          medianIncome: kpiResult.kpis?.market_analysis?.KPI_059?.value,
        } : null,
      },
      metadata: {
        coordinates: primaryParcel.lat && primaryParcel.lng
          ? [primaryParcel.lng, primaryParcel.lat]
          : zoneData.coordinates || [-81.5, 27.6],
        jurisdiction: primaryParcel.county || zoneData.jurisdiction,
        photoUrl: primaryParcel.photoUrl,
        searchType: 'parcel',
        kpiCount: kpiResult ? `${kpiResult.populated}/${kpiResult.total}` : null,
      }
    })

    // If parcel has coordinates, also build a map artifact
    if (primaryParcel.lat && primaryParcel.lng) {
      artifacts.push({
        id: crypto.randomUUID(),
        type: 'map',
        title: mapMatch ? mapMatch[1] : `${primaryParcel.address}`,
        data: {
          parcels: parcels.filter((p: any) => p.lat && p.lng).map((p: any) => ({
            lat: p.lat,
            lng: p.lng,
            label: p.address,
            value: p.justValue,
            photo: p.photoUrl,
          })),
        },
        metadata: {
          coordinates: [primaryParcel.lng, primaryParcel.lat],
          zoom: 16,
        }
      })
    }
  }

  // ── Zoning map artifact (existing) ──
  if ((mapMatch || (primaryDistrict && zoneData.coordinates)) && !primaryParcel) {
    const title = mapMatch ? mapMatch[1] : `${primaryDistrict?.zoneCode} — ${primaryDistrict?.jurisdiction}`
    artifacts.push({
      id: crypto.randomUUID(),
      type: 'map',
      title,
      data: primaryDistrict || {},
      metadata: {
        coordinates: zoneData.coordinates || [-81.5, 27.6],
        jurisdiction: primaryDistrict?.jurisdiction || zoneData.jurisdiction,
        county: primaryDistrict?.county,
        zoom: 13
      }
    })
  }

  // ── Zoning table artifact (existing) ──
  if ((tableMatch || zoneData.districts.length > 1) && !primaryParcel) {
    const title = tableMatch ? tableMatch[1] : 'Zone Comparison'
    artifacts.push({
      id: crypto.randomUUID(),
      type: 'table',
      title,
      data: {
        districts: zoneData.districts,
        permittedUses: zoneData.uses.map(u => u.use_description || u.use_type),
        ...primaryDistrict
      },
      metadata: { jurisdiction: primaryDistrict?.jurisdiction }
    })
  }

  // ── Report artifact ──
  if (reportMatch) {
    artifacts.push({
      id: crypto.randomUUID(),
      type: 'report',
      title: reportMatch[1],
      data: {
        ...(primaryDistrict || {}),
        permittedUses: zoneData.uses.map(u => u.use_description || u.use_type),
        parcels: parcels,
      },
      metadata: { jurisdiction: primaryDistrict?.jurisdiction || primaryParcel?.county }
    })
  }

  // ── Auto-generate artifacts if we have data but no explicit markers ──
  if (artifacts.length === 0) {
    if (primaryParcel) {
      artifacts.push({
        id: crypto.randomUUID(),
        type: 'table',
        title: `Property: ${primaryParcel.address}`,
        data: { parcels, primary: primaryParcel },
        metadata: {
          coordinates: primaryParcel.lat && primaryParcel.lng
            ? [primaryParcel.lng, primaryParcel.lat]
            : zoneData.coordinates || [-81.5, 27.6],
          jurisdiction: primaryParcel.county,
          photoUrl: primaryParcel.photoUrl,
        }
      })
    } else if (primaryDistrict) {
      artifacts.push({
        id: crypto.randomUUID(),
        type: 'map',
        title: `${primaryDistrict.zoneCode} — ${primaryDistrict.jurisdiction}`,
        data: primaryDistrict,
        metadata: {
          coordinates: zoneData.coordinates || [-81.5, 27.6],
          jurisdiction: primaryDistrict.jurisdiction,
          county: primaryDistrict.county,
          zoom: 13
        }
      })
    }
  }

  return artifacts
}
