export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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
};

const SYSTEM_PROMPT = `You are ZoneWise.AI, an expert AI assistant for Florida real estate intelligence across all 67 counties.

DATABASE: You have access to a comprehensive Florida zoning database with:
- 67 counties, 369 jurisdictions, 5,395 zoning districts
- 10,202 permitted uses, 700 conditional uses
- 1,931 zone standards with setbacks, heights, lot sizes, FAR
- 2,190 ordinances with full text
- 24,243 parcel zone records
- 68 overlay districts, 92 development bonuses

CRITICAL: ONLY use data values provided in the RELEVANT DATA section below. NEVER substitute with your training data. If a value is not in the database context, say "not available in database" rather than guessing.

RESPONSE FORMAT:
- Always specify jurisdiction and zone code
- Include specific dimensional standards when available
- Show permitted vs conditional uses clearly
- Note overlay districts if applicable
- End zoning answers with: "⚠️ Verify with [Jurisdiction] Planning Department before making development decisions."

ARTIFACT MARKERS - Use these when the query warrants visual output:
- For map-related responses: [MAP:Zone Title]
- For tabular data: [TABLE:Table Title]
- For reports: [REPORT:Report Title]
- For comparisons: [TABLE:Comparison Title]

Always include at least one artifact marker when discussing specific zones or jurisdictions.`

interface Message { role: 'user' | 'assistant'; content: string }

export async function POST(request: NextRequest) {
  const anthropic = getAnthropic();
  const supabase = getSupabase();
  try {
    const { messages, sessionId } = await request.json()
    const { context: zoningContext, zoneData } = await fetchRelevantZoningData(supabase, messages)
    
    const claudeMessages = messages.map((m: Message) => ({ role: m.role, content: m.content }))
    let systemPrompt = SYSTEM_PROMPT
    if (zoningContext) systemPrompt += `\n\nRELEVANT DATA FROM DATABASE:\n${zoningContext}`
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: claudeMessages
    })
    
    const assistantContent = response.content[0].type === 'text' ? response.content[0].text : ''
    const artifacts = buildArtifacts(assistantContent, zoneData)
    const cleanedResponse = assistantContent
      .replace(/\[MAP:[^\]]+\]/g, '')
      .replace(/\[TABLE:[^\]]+\]/g, '')
      .replace(/\[REPORT:[^\]]+\]/g, '')
      .trim()
    
    if (sessionId) {
      try {
        await supabase.from('zw_chat_messages').insert([
          { session_id: sessionId, role: 'user', content: messages[messages.length - 1]?.content || '' },
          { session_id: sessionId, role: 'assistant', content: cleanedResponse, artifacts }
        ])
        try { await supabase.rpc('increment_query_count', { session_uuid: sessionId }) } catch (_) { /* ignore */ }
      } catch (logError) { console.error('Log error:', logError) }
    }
    
    return NextResponse.json({ response: cleanedResponse, artifacts })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

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
  
  // Extract zone codes
  const zoneCodeMatch = lastMessage.match(/\b([a-z]{1,4}-?\d{0,3}[a-z]?)\b/i)
  
  // Match jurisdictions
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
        
        // Build display data
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
          districtData.setbacks = {
            front: zs.front_setback_ft,
            side: zs.side_setback_ft,
            rear: zs.rear_setback_ft,
          }
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
      
      // Get jurisdiction coords from first result if not already set
      if (!coordinates && districts[0]) {
        const jName = (Array.isArray(districts[0].jurisdictions) ? districts[0].jurisdictions[0] : districts[0].jurisdictions)?.name?.toLowerCase()
        if (jName && JURISDICTION_COORDS[jName]) {
          coordinates = JURISDICTION_COORDS[jName]
          jurisdiction = jName
        }
      }
      
      // Query permitted uses
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
    
    // Ordinance lookup
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

function buildArtifacts(response: string, zoneData: ZoneDataResult['zoneData']): any[] {
  const artifacts: any[] = []
  
  // Parse markers from response
  const mapMatch = response.match(/\[MAP:([^\]]+)\]/)
  const tableMatch = response.match(/\[TABLE:([^\]]+)\]/)
  const reportMatch = response.match(/\[REPORT:([^\]]+)\]/)
  
  const primaryDistrict = zoneData.districts[0] || null
  
  // Build map artifact if there's zone data
  if (mapMatch || (primaryDistrict && zoneData.coordinates)) {
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
  
  // Build table artifact
  if (tableMatch || zoneData.districts.length > 1) {
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
  
  // Build report artifact
  if (reportMatch) {
    artifacts.push({
      id: crypto.randomUUID(),
      type: 'report',
      title: reportMatch[1],
      data: { ...primaryDistrict, permittedUses: zoneData.uses.map(u => u.use_description || u.use_type) },
      metadata: { jurisdiction: primaryDistrict?.jurisdiction }
    })
  }
  
  // If we have zone data but no explicit markers, auto-generate a map artifact
  if (artifacts.length === 0 && primaryDistrict) {
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
  
  return artifacts
}
