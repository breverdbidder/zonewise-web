import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SYSTEM_PROMPT = `You are ZoneWise.AI, an expert AI assistant for Brevard County zoning regulations. You have comprehensive knowledge of zoning codes, setbacks, building heights, permitted uses, and land development regulations for all 17 jurisdictions in Brevard County, Florida.

JURISDICTIONS YOU COVER:
- Brevard County (Unincorporated)
- City of Cocoa
- City of Cocoa Beach
- City of Melbourne
- City of Melbourne Beach
- City of Palm Bay
- City of Rockledge
- City of Satellite Beach
- City of Titusville
- City of West Melbourne
- Town of Grant-Valkaria
- Town of Indialantic
- Town of Indian Harbour Beach
- Town of Malabar
- Town of Melbourne Village
- Town of Palm Shores
- Cape Canaveral

RESPONSE FORMAT:
When answering zoning questions:
1. Identify the jurisdiction and zone code
2. Provide specific dimensional standards (setbacks, height, etc.)
3. List relevant permitted and conditional uses
4. Include any special conditions or overlay districts
5. Always remind users to verify with the local Planning Department

For queries that would benefit from visual data, include an artifact marker like this:
[ARTIFACT:MAP:Zone Code in Jurisdiction]
[ARTIFACT:TABLE:Comparison Title]
[ARTIFACT:REPORT:Report Title]

Always be accurate, helpful, and remind users that this information is for guidance only.`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionId } = await request.json()
    
    // Fetch zoning data from Supabase if available
    const zoningContext = await fetchRelevantZoningData(messages)
    
    // Build the messages array for Claude
    const claudeMessages = messages.map((m: Message) => ({
      role: m.role,
      content: m.content
    }))
    
    // Add zoning context to system prompt if available
    let systemPrompt = SYSTEM_PROMPT
    if (zoningContext) {
      systemPrompt += `\n\nRELEVANT ZONING DATA:\n${zoningContext}`
    }
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages
    })
    
    const assistantContent = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''
    
    // Parse artifacts from response
    const artifacts = parseArtifacts(assistantContent, messages[messages.length - 1]?.content || '')
    
    // Clean artifact markers from response
    const cleanedResponse = assistantContent
      .replace(/\[ARTIFACT:(MAP|TABLE|REPORT):([^\]]+)\]/g, '')
      .trim()
    
    // Log to Supabase if session exists
    if (sessionId) {
      try {
        await supabase.from('chat_messages').insert([
          {
            session_id: sessionId,
            role: 'user',
            content: messages[messages.length - 1]?.content || '',
            created_at: new Date().toISOString()
          },
          {
            session_id: sessionId,
            role: 'assistant',
            content: cleanedResponse,
            artifacts: artifacts,
            created_at: new Date().toISOString()
          }
        ])
        
        // Update session query count
        await supabase.rpc('increment_query_count', { session_uuid: sessionId })
      } catch (logError) {
        console.error('Failed to log messages:', logError)
      }
    }
    
    return NextResponse.json({ 
      response: cleanedResponse,
      artifacts
    })
    
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

async function fetchRelevantZoningData(messages: Message[]): Promise<string | null> {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''
  
  // Extract potential zone codes and jurisdictions
  const zoneCodeMatch = lastMessage.match(/\b([a-z]+-?\d+|r-1|r-2|r-3|c-1|c-2|m-1|pd|pud)\b/i)
  const jurisdictionKeywords = [
    'satellite beach', 'melbourne', 'palm bay', 'titusville', 'cocoa beach',
    'cocoa', 'rockledge', 'west melbourne', 'indialantic', 'indian harbour',
    'brevard county', 'cape canaveral', 'melbourne beach', 'malabar'
  ]
  
  let jurisdiction = null
  for (const kw of jurisdictionKeywords) {
    if (lastMessage.includes(kw)) {
      jurisdiction = kw
      break
    }
  }
  
  if (!zoneCodeMatch && !jurisdiction) return null
  
  try {
    let query = supabase.from('zoning_districts').select('*')
    
    if (zoneCodeMatch) {
      query = query.ilike('zone_code', `%${zoneCodeMatch[1]}%`)
    }
    if (jurisdiction) {
      query = query.ilike('jurisdiction', `%${jurisdiction}%`)
    }
    
    const { data, error } = await query.limit(5)
    
    if (error || !data || data.length === 0) return null
    
    return data.map(d => `
Zone: ${d.zone_code} (${d.jurisdiction})
Name: ${d.zone_name || 'N/A'}
Setbacks: Front ${d.front_setback || 'N/A'}ft, Side ${d.side_setback || 'N/A'}ft, Rear ${d.rear_setback || 'N/A'}ft
Max Height: ${d.max_height || 'N/A'}ft
Permitted Uses: ${d.permitted_uses || 'See local code'}
`).join('\n---\n')
    
  } catch (error) {
    console.error('Failed to fetch zoning data:', error)
    return null
  }
}

function parseArtifacts(response: string, query: string): any[] {
  const artifacts: any[] = []
  
  // Parse explicit artifact markers
  const artifactRegex = /\[ARTIFACT:(MAP|TABLE|REPORT):([^\]]+)\]/g
  let match
  
  while ((match = artifactRegex.exec(response)) !== null) {
    const type = match[1].toLowerCase()
    const title = match[2]
    
    artifacts.push({
      id: crypto.randomUUID(),
      type,
      title,
      data: extractArtifactData(response, type, title, query)
    })
  }
  
  // Auto-generate map artifact for setback/zone queries if no artifacts
  if (artifacts.length === 0) {
    const hasZoneQuery = /setback|zone|height|building|permit|r-\d|c-\d|m-\d/i.test(query)
    if (hasZoneQuery) {
      // Extract zone info from response
      const zoneMatch = response.match(/\b([A-Z]+-?\d+[A-Z]?)\b/i)
      const jurisdictionMatch = response.match(/(Satellite Beach|Melbourne|Palm Bay|Cocoa Beach|Titusville|Brevard County)/i)
      
      if (zoneMatch || jurisdictionMatch) {
        artifacts.push({
          id: crypto.randomUUID(),
          type: 'map',
          title: `${zoneMatch?.[1] || 'Zone'} in ${jurisdictionMatch?.[1] || 'Brevard County'}`,
          data: {
            zoneCode: zoneMatch?.[1] || null,
            jurisdiction: jurisdictionMatch?.[1] || 'Brevard County',
            setbacks: extractSetbacks(response),
            maxHeight: extractHeight(response),
            zoneType: determineZoneType(zoneMatch?.[1] || '')
          },
          metadata: {
            jurisdiction: jurisdictionMatch?.[1] || 'Brevard County',
            zoneCode: zoneMatch?.[1] || null,
            coordinates: getJurisdictionCenter(jurisdictionMatch?.[1] || 'Brevard County')
          }
        })
      }
    }
  }
  
  return artifacts
}

function extractArtifactData(response: string, type: string, title: string, query: string): any {
  // Extract structured data from response based on artifact type
  return {
    zoneCode: extractZoneCode(response),
    jurisdiction: extractJurisdiction(response),
    setbacks: extractSetbacks(response),
    maxHeight: extractHeight(response),
    zoneType: determineZoneType(extractZoneCode(response) || '')
  }
}

function extractZoneCode(text: string): string | null {
  const match = text.match(/\b([A-Z]+-?\d+[A-Z]?)\b/i)
  return match ? match[1].toUpperCase() : null
}

function extractJurisdiction(text: string): string | null {
  const jurisdictions = [
    'Satellite Beach', 'Melbourne', 'Palm Bay', 'Cocoa Beach', 'Titusville',
    'Cocoa', 'Rockledge', 'West Melbourne', 'Indialantic', 'Indian Harbour Beach',
    'Brevard County', 'Cape Canaveral', 'Melbourne Beach', 'Malabar'
  ]
  
  for (const j of jurisdictions) {
    if (text.toLowerCase().includes(j.toLowerCase())) return j
  }
  return null
}

function extractSetbacks(text: string): { front: number; side: number; rear: number } | null {
  const frontMatch = text.match(/front[:\s]+(\d+)/i)
  const sideMatch = text.match(/side[:\s]+(\d+)/i)
  const rearMatch = text.match(/rear[:\s]+(\d+)/i)
  
  if (frontMatch || sideMatch || rearMatch) {
    return {
      front: frontMatch ? parseInt(frontMatch[1]) : 25,
      side: sideMatch ? parseInt(sideMatch[1]) : 7.5,
      rear: rearMatch ? parseInt(rearMatch[1]) : 20
    }
  }
  return null
}

function extractHeight(text: string): number | null {
  const match = text.match(/(?:max(?:imum)?|height)[:\s]+(\d+)/i)
  return match ? parseInt(match[1]) : null
}

function determineZoneType(zoneCode: string): string {
  if (!zoneCode) return 'unknown'
  const code = zoneCode.toUpperCase()
  if (code.startsWith('R') || code.includes('RES')) return 'residential'
  if (code.startsWith('C') || code.includes('COM')) return 'commercial'
  if (code.startsWith('M') || code.startsWith('I') || code.includes('IND')) return 'industrial'
  if (code.startsWith('A') || code.includes('AG')) return 'agricultural'
  if (code.includes('MU') || code.includes('MIX')) return 'mixed-use'
  return 'other'
}

function getJurisdictionCenter(jurisdiction: string): [number, number] {
  const centers: Record<string, [number, number]> = {
    'Satellite Beach': [-80.5900, 28.1761],
    'Melbourne': [-80.6081, 28.0836],
    'Palm Bay': [-80.5887, 28.0345],
    'Cocoa Beach': [-80.6070, 28.3200],
    'Titusville': [-80.8076, 28.6122],
    'Cocoa': [-80.7420, 28.3861],
    'Rockledge': [-80.7253, 28.3167],
    'West Melbourne': [-80.6520, 28.0720],
    'Indialantic': [-80.5660, 28.0897],
    'Indian Harbour Beach': [-80.5880, 28.1497],
    'Brevard County': [-80.7000, 28.3000],
    'Cape Canaveral': [-80.6050, 28.3922],
    'Melbourne Beach': [-80.5600, 28.0680],
    'Malabar': [-80.5700, 27.9900]
  }
  return centers[jurisdiction] || [-80.7, 28.3]
}
