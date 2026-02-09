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

const SYSTEM_PROMPT = `You are ZoneWise.AI, an expert AI assistant for Florida real estate intelligence across all 67 counties.

DATABASE: You have access to a comprehensive Florida zoning database with:
- 67 counties, 369 jurisdictions, 5,395 zoning districts
- 10,202 permitted uses, 700 conditional uses
- 1,931 zone standards with setbacks, heights, lot sizes, FAR
- 2,190 ordinances with full text
- 24,243 parcel zone records
- 68 overlay districts, 92 development bonuses

SKILLS:
1. Zoning Lookup - Setbacks, heights, FAR, permitted uses by zone code
2. District Compare - Side-by-side zoning district comparison
3. Parcel Research - Owner, zoning, tax history, liens for a parcel
4. Permit Check - Is a use permitted, conditional, or prohibited
5. Foreclosure Scanner - Search auctions by county, date, property type
6. Tax Deed Analyzer - Tax deed sales and certificate histories
7. Due Diligence Report - 63-KPI development analysis
8. Market Intelligence - ML-powered comps, ARV, investment scoring

RESPONSE FORMAT:
- Always specify jurisdiction and zone code
- Include specific dimensional standards when available
- Show permitted vs conditional uses clearly
- Note overlay districts if applicable
- End zoning answers with: "⚠️ Verify with [Jurisdiction] Planning Department before making development decisions."

For visual data include: [ARTIFACT:MAP|TABLE|REPORT:Title]`

interface Message { role: 'user' | 'assistant'; content: string }

export async function POST(request: NextRequest) {
  const anthropic = getAnthropic();
  const supabase = getSupabase();
  try {
    const { messages, sessionId } = await request.json()
    const zoningContext = await fetchRelevantZoningData(supabase, messages)
    
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
    const artifacts = parseArtifacts(assistantContent)
    const cleanedResponse = assistantContent.replace(/\[ARTIFACT:(MAP|TABLE|REPORT):([^\]]+)\]/g, '').trim()
    
    if (sessionId) {
      try {
        await supabase.from('zw_chat_messages').insert([
          { session_id: sessionId, role: 'user', content: messages[messages.length - 1]?.content || '' },
          { session_id: sessionId, role: 'assistant', content: cleanedResponse, artifacts }
        ])
        await supabase.rpc('increment_query_count', { session_uuid: sessionId })
      } catch (logError) { console.error('Log error:', logError) }
    }
    
    return NextResponse.json({ response: cleanedResponse, artifacts })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

async function fetchRelevantZoningData(supabase: any, messages: Message[]): Promise<string | null> {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''
  
  // Extract zone codes - match patterns like R-1, C-2, PUD, GU, BU-1, PCN-1, etc.
  const zoneCodeMatch = lastMessage.match(/\b([a-z]{1,4}-?\d{0,3}[a-z]?)\b/i)
  
  // Match Florida jurisdictions
  const jurisdictionKeywords = [
    'satellite beach', 'melbourne', 'palm bay', 'titusville', 'cocoa beach',
    'cocoa', 'rockledge', 'west melbourne', 'indialantic', 'indian harbour beach',
    'cape canaveral', 'melbourne beach', 'malabar', 'grant-valkaria',
    'jacksonville', 'miami', 'tampa', 'orlando', 'fort lauderdale',
    'st. petersburg', 'hialeah', 'tallahassee', 'naples', 'sarasota',
    'fort myers', 'pensacola', 'panama city', 'brooksville', 'new smyrna beach',
    'winter haven', 'palatka', 'crestview', 'deland', 'safety harbor',
    'cutler bay', 'keystone heights', 'baldwin', 'alachua', 'archer',
    'defuniak springs', 'fort walton beach', 'frostproof'
  ]
  let jurisdiction = null
  for (const kw of jurisdictionKeywords) {
    if (lastMessage.includes(kw)) { jurisdiction = kw; break }
  }
  
  if (!zoneCodeMatch && !jurisdiction) return null
  
  const results: string[] = []
  
  try {
    // 1. Query zoning districts with standards
    let query = supabase
      .from('zoning_districts')
      .select(`
        id, code, name, category, description,
        jurisdictions!inner(name, county),
        zone_standards(front_setback_ft, side_setback_ft, rear_setback_ft, max_height_ft, max_stories, min_lot_sqft, max_lot_coverage_pct, max_far, max_density_du_acre, min_open_space_pct)
      `)
    
    if (zoneCodeMatch) query = query.ilike('code', `%${zoneCodeMatch[1]}%`)
    if (jurisdiction) query = query.ilike('jurisdictions.name', `%${jurisdiction}%`)
    
    const { data: districts, error } = await query.limit(5)
    
    if (!error && districts && districts.length > 0) {
      for (const d of districts) {
        const j = Array.isArray(d.jurisdictions) ? d.jurisdictions[0] : d.jurisdictions
        const zs = Array.isArray(d.zone_standards) ? d.zone_standards[0] : d.zone_standards
        
        let entry = `ZONE: ${d.code} — ${d.name}\nJurisdiction: ${j?.name || 'N/A'}, ${j?.county || 'N/A'} County\nCategory: ${d.category || 'N/A'}`
        if (d.description) entry += `\nDescription: ${d.description}`
        
        if (zs) {
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
        results.push(entry)
      }
    }
    
    // 2. Query permitted uses for matched districts
    if (districts && districts.length > 0) {
      const districtIds = districts.map((d: any) => d.id)
      const { data: uses } = await supabase
        .from('permitted_uses')
        .select('use_type, use_category, use_description, requires_special_permit, special_conditions, zoning_district_id')
        .in('zoning_district_id', districtIds)
        .limit(20)
      
      if (uses && uses.length > 0) {
        const grouped: Record<number, any[]> = {}
        for (const u of uses) {
          if (!grouped[u.zoning_district_id]) grouped[u.zoning_district_id] = []
          grouped[u.zoning_district_id].push(u)
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
    
    // 3. Check for ordinance matches if query mentions ordinance/code/regulation
    if (lastMessage.match(/ordinance|code|regulation|section|chapter/i) && jurisdiction) {
      const { data: ordinances } = await supabase
        .from('ordinances')
        .select('ordinance_number, title, chapter, section, summary, source_url')
        .eq('jurisdiction_id', districts?.[0]?.jurisdictions?.id || 0)
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
    return null
  }
  
  return results.length > 0 ? results.join('\n\n---\n\n') : null
}

function parseArtifacts(response: string): any[] {
  const artifacts: any[] = []
  const artifactRegex = /\[ARTIFACT:(MAP|TABLE|REPORT):([^\]]+)\]/g
  let match
  while ((match = artifactRegex.exec(response)) !== null) {
    artifacts.push({
      id: crypto.randomUUID(),
      type: match[1].toLowerCase(),
      title: match[2],
      data: {}
    })
  }
  return artifacts
}
