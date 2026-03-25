import { NextRequest, NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/server'

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
  'VAC-RES':    { zone_name: 'Vacant Residential', max_height_ft: 35, max_stories: 2, front_setback_ft: 25, side_setback_ft: 7.5, rear_setback_ft: 20, max_lot_coverage_pct: 40, max_far: 0.5, parking_per_unit: 2, parking_per_1000sf: 0, max_density_du_acre: 8 },
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
  return { ...FALLBACK_CONTROLS['SFR'], zone_name: 'Unknown Zone: ' + c }
}

// ─── Intent classification ────────────────────────────────────────────────────
type Intent = 'ADDRESS_LOOKUP' | 'ZONE_QUESTION' | 'PERMITTED_USE' | 'CAPACITY' | 'COMPARISON' | 'GENERAL'

function classifyIntent(message: string): Intent {
  const m = message.toLowerCase()
  if (/\b\d+\s+\w+\s+(dr|ln|ave|blvd|st|rd|ct|way|cir|pl|terr?|trail|pkwy|hwy)\b/i.test(message)) {
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
  const match = message.match(/\b(R-1AA?|R-1B|R-[1-9]\w*|RM-?\w*|MFR-?\w*|SFR|RE\b|REU|SRE|BU-\w+|C-\w+|PUD\w*|TR-\w+|GML|ACREAGE|CP|OFFICE|TOWNHOUSE|GOV-MUNI|SCHOOL-PUB|VAC-RES)\b/i)
  return match ? match[1].toUpperCase() : null
}

function extractAddress(message: string): string | null {
  const match = message.match(/(\d+\s+[\w\s]+(dr|ln|ave|blvd|st|rd|ct|way|cir|pl|terr?|trail|pkwy|hwy)\b[\w\s,]*)/i)
  return match ? match[1].trim() : null
}

// ─── Supabase data fetchers ───────────────────────────────────────────────────
interface ZoningContext {
  parcel: {
    parcel_id: string; address: string; acres: number | null;
    use_code: string | null; use_description: string | null; city: string | null;
  } | null
  zoning: {
    zone_code: string; jurisdiction: string | null;
    district_name: string; standards: Record<string, unknown>;
    permitted_uses: { use_description: string; use_type: string }[];
    isFallback: boolean;
  } | null
  error: string | null
}

async function fetchZoningByAddress(address: string): Promise<ZoningContext> {
  const supabase = createAnonClient()
  try {
    const { data: parcels } = await supabase
      .from('sample_properties')
      .select('parcel_id, address, acres, use_code, use_description, city')
      .ilike('address', `%${address}%`)
      .limit(5)

    if (!parcels || parcels.length === 0) {
      return { parcel: null, zoning: null, error: `No parcels found for "${address}"` }
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
      .select('id, code, name')
      .eq('code', zoneCode)
      .limit(1)
      .single()

    if (!zd) {
      const fb = getFallbackControls(zoneCode)
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
        standards: (zs ?? {}) as Record<string, unknown>,
        permitted_uses: pu ?? [],
        isFallback: false,
      },
      error: null,
    }
  } catch (e) {
    const fb = getFallbackControls(zoneCode)
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

  if (ctx.zoning) {
    const z = ctx.zoning
    const s = z.standards
    lines.push('')
    lines.push('=== ZONING DATA ===')
    lines.push(`Zone Code: ${z.zone_code}`)
    lines.push(`Zone Name: ${z.district_name}`)
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

// ─── Gemini LLM call ──────────────────────────────────────────────────────────
function buildSystemPrompt(hasContext: boolean): string {
  if (hasContext) {
    return `You are ZoneWise AI, a Florida zoning intelligence assistant for Brevard County.
You have access to real zoning data from Brevard County's parcel and zoning records.

RULES:
- Use the CONTEXT data below as your primary source. Present it in clear, conversational language — NOT as raw data dumps.
- When citing development standards, use natural sentences like "The maximum building height is 35 feet" instead of listing raw fields.
- Bold key numbers with **value** for emphasis.
- If the data shows estimated/fallback controls, mention that the user should verify with the local jurisdiction.
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

async function callGemini(message: string, context: string, history: { role: string; content: string }[]): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured')

  const hasContext = context.length > 0
  const systemPrompt = buildSystemPrompt(hasContext)

  const historyText = history.length > 0
    ? '\n\nPREVIOUS CONVERSATION:\n' + history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')
    : ''

  const fullPrompt = systemPrompt
    + (hasContext ? '\n\nCONTEXT:\n' + context : '')
    + historyText
    + '\n\nUSER: ' + message

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const json = await res.json()
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated.'
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
    citations.push({
      source: `Parcel ${ctx.parcel.parcel_id}`,
      detail: `sample_properties · ${ctx.parcel.address}`,
    })
  }
  return citations
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message: string = (body.message ?? '').trim()
    const sessionId: string | undefined = body.sessionId
    const incomingHistory: { role: string; content: string }[] = body.history ?? []

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400, headers: CORS })
    }

    const intent = classifyIntent(message)
    let ctx: ZoningContext = { parcel: null, zoning: null, error: null }

    if (intent === 'ADDRESS_LOOKUP') {
      const addr = extractAddress(message)
      if (addr) ctx = await fetchZoningByAddress(addr)
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
        let responseText: string
        try {
          responseText = await callGemini(message, combinedCtx, history.slice(-5))
        } catch {
          responseText = `**${codes[0]}:** ${r1.zoning?.district_name ?? 'Unknown'}\n${buildContextString({ parcel: null, ...r1 })}\n\n**${codes[1]}:** ${r2.zoning?.district_name ?? 'Unknown'}\n${buildContextString({ parcel: null, ...r2 })}`
        }
        const citations = [...extractCitations({ parcel: null, ...r1 }), ...extractCitations({ parcel: null, ...r2 })]
        await persistMessages(activeSession, message, responseText)
        return NextResponse.json({ response: responseText, citations, sessionId: activeSession }, { headers: CORS })
      }
    }

    // GENERAL intent or any intent that didn't extract a zone/address —
    // still goes through Gemini (with or without context)
    const contextString = buildContextString(ctx)
    const activeSession = await getOrCreateSession(sessionId)
    const history = incomingHistory.length > 0 ? incomingHistory : await getSessionHistory(activeSession)

    let responseText: string
    try {
      responseText = await callGemini(message, contextString, history.slice(-5))
    } catch (geminiErr: any) {
      console.error("[zoning-chat] Gemini error:", geminiErr?.message ?? geminiErr)
      // Fallback: structured response without LLM formatting
      if (contextString) {
        // Even in fallback, format nicely instead of raw dump
        responseText = formatFallbackResponse(ctx)
      } else {
        responseText = ctx.error
          ? `I was unable to find that information. ${ctx.error}`
          : "I couldn't process that request right now. Try asking about a specific address (e.g., \"What can I build at 123 Main St?\") or zone code (e.g., \"What does R-1A allow?\")."
      }
    }

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
      { headers: CORS }
    )
  } catch (err) {
    console.error('[zoning-chat] POST error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'unknown' },
      { status: 500, headers: CORS }
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

