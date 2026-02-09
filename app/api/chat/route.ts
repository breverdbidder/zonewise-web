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
- Identify jurisdiction and zone code
- Provide specific dimensional standards
- List permitted and conditional uses
- Include overlay districts if applicable
- Remind users to verify with local Planning Department

For visual data include: [ARTIFACT:MAP|TABLE|REPORT:Title]

Always accurate, always include disclaimer for guidance only.`

interface Message { role: 'user' | 'assistant'; content: string }

export async function POST(request: NextRequest) {
  const anthropic = getAnthropic();
  const supabase = getSupabase();
  try {
    const { messages, sessionId } = await request.json()
    const zoningContext = await fetchRelevantZoningData(messages)
    
    const claudeMessages = messages.map((m: Message) => ({ role: m.role, content: m.content }))
    let systemPrompt = SYSTEM_PROMPT
    if (zoningContext) systemPrompt += `\n\nRELEVANT ZONING DATA:\n${zoningContext}`
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages
    })
    
    const assistantContent = response.content[0].type === 'text' ? response.content[0].text : ''
    const artifacts = parseArtifacts(assistantContent, messages[messages.length - 1]?.content || '')
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

async function fetchRelevantZoningData(messages: Message[]): Promise<string | null> {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''
  const zoneCodeMatch = lastMessage.match(/\b([a-z]+-?\d+|r-1|r-2|r-3|c-1|c-2|m-1|pd|pud)\b/i)
  const jurisdictionKeywords = [
    'satellite beach', 'melbourne', 'palm bay', 'titusville', 'cocoa beach',
    'cocoa', 'rockledge', 'west melbourne', 'indialantic', 'indian harbour',
    'cape canaveral', 'melbourne beach', 'malabar',
    'jacksonville', 'miami', 'tampa', 'orlando', 'fort lauderdale',
    'st. petersburg', 'hialeah', 'tallahassee', 'naples', 'sarasota'
  ]
  let jurisdiction = null
  for (const kw of jurisdictionKeywords) {
    if (lastMessage.includes(kw)) { jurisdiction = kw; break }
  }
  if (!zoneCodeMatch && !jurisdiction) return null
  try {
    let query = getSupabase().from('zoning_districts').select('*')
    if (zoneCodeMatch) query = query.ilike('zone_code', `%${zoneCodeMatch[1]}%`)
    if (jurisdiction) query = query.ilike('jurisdiction', `%${jurisdiction}%`)
    const { data, error } = await query.limit(5)
    if (error || !data || data.length === 0) return null
    return data.map(d => `Zone: ${d.zone_code} (${d.jurisdiction})\nName: ${d.zone_name || 'N/A'}\nSetbacks: Front ${d.front_setback || 'N/A'}ft, Side ${d.side_setback || 'N/A'}ft, Rear ${d.rear_setback || 'N/A'}ft\nMax Height: ${d.max_height || 'N/A'}ft\nPermitted Uses: ${d.permitted_uses || 'See local code'}`).join('\n---\n')
  } catch { return null }
}

function parseArtifacts(response: string, query: string): any[] {
  const artifacts: any[] = []
  const artifactRegex = /\[ARTIFACT:(MAP|TABLE|REPORT):([^\]]+)\]/g
  let match
  while ((match = artifactRegex.exec(response)) !== null) {
    artifacts.push({
      id: crypto.randomUUID(),
      type: match[1].toLowerCase(),
      title: match[2],
      data: { zoneCode: extractZoneCode(response), jurisdiction: extractJurisdiction(response) }
    })
  }
  return artifacts
}

function extractZoneCode(text: string): string | null {
  const match = text.match(/\b([A-Z]+-?\d+[A-Z]?)\b/i)
  return match ? match[1].toUpperCase() : null
}

function extractJurisdiction(text: string): string | null {
  const jurisdictions = ['Satellite Beach','Melbourne','Palm Bay','Cocoa Beach','Titusville','Jacksonville','Miami','Tampa','Orlando','Fort Lauderdale','Tallahassee','Naples','Sarasota']
  for (const j of jurisdictions) { if (text.toLowerCase().includes(j.toLowerCase())) return j }
  return null
}
