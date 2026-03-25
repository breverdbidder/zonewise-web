/**
 * audit_zoning_accuracy.ts
 * Phase 1 — Zoning Accuracy Audit
 *
 * 1. Fetch 50 random parcels from zoning_assignments (spread across municipalities)
 * 2. POST each address to /api/zoning-chat
 * 3. Compare chatbot zone_code vs DB zone_code
 * 4. Classify: match | mismatch | no_response | fabricated
 * 5. Upsert results into audit_zoning_accuracy table
 *
 * Usage:
 *   npx tsx scripts/audit_zoning_accuracy.ts
 *   BASE_URL=http://localhost:3000 npx tsx scripts/audit_zoning_accuracy.ts
 */

import { createClient } from '@supabase/supabase-js'

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL = process.env.BASE_URL ?? 'https://zonewise.ai'
const SAMPLE_SIZE = 50
const CHAT_TIMEOUT_MS = 15_000

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── Types ───────────────────────────────────────────────────────────────────
type MatchStatus = 'match' | 'mismatch' | 'no_response' | 'fabricated'

interface AuditRow {
  parcel_id: string
  address: string | null
  db_zone_code: string | null
  chatbot_zone_code: string | null
  bcpao_zone_code: string | null   // filled by audit_zoning_bcpao.ts
  match_chatbot: boolean | null
  match_bcpao: boolean | null      // filled by audit_zoning_bcpao.ts
  fabricated: boolean
  audit_date: string
  notes: string | null
}

interface ZoningAssignment {
  parcel_id: string
  address: string | null
  zone_code: string | null
  jurisdiction: string | null
}

// ── Step 1: Fetch sample parcels spread across jurisdictions ─────────────────
async function fetchSampleParcels(): Promise<ZoningAssignment[]> {
  console.log(`Fetching ${SAMPLE_SIZE} sample parcels from zoning_assignments...`)

  // Get distinct jurisdictions first
  const { data: jurisdictions, error: jErr } = await supabase
    .from('zoning_assignments')
    .select('jurisdiction')
    .not('jurisdiction', 'is', null)
    .not('address', 'is', null)
    .not('zone_code', 'is', null)
    .limit(100)

  if (jErr) {
    console.error('Failed to fetch jurisdictions:', jErr.message)
    process.exit(1)
  }

  const uniqueJurisdictions = [...new Set((jurisdictions ?? []).map(r => r.jurisdiction as string))]
  console.log(`Found ${uniqueJurisdictions.length} jurisdictions: ${uniqueJurisdictions.join(', ')}`)

  const parcelsPerJurisdiction = Math.max(1, Math.floor(SAMPLE_SIZE / Math.max(uniqueJurisdictions.length, 1)))
  const allParcels: ZoningAssignment[] = []

  for (const jurisdiction of uniqueJurisdictions) {
    if (allParcels.length >= SAMPLE_SIZE) break

    const { data, error } = await supabase
      .from('zoning_assignments')
      .select('parcel_id, address, zone_code, jurisdiction')
      .eq('jurisdiction', jurisdiction)
      .not('address', 'is', null)
      .not('zone_code', 'is', null)
      .limit(parcelsPerJurisdiction)

    if (error) {
      console.warn(`Skipping jurisdiction ${jurisdiction}: ${error.message}`)
      continue
    }

    allParcels.push(...(data ?? []))
  }

  // Top up to SAMPLE_SIZE if we got fewer via jurisdiction spread
  if (allParcels.length < SAMPLE_SIZE) {
    const needed = SAMPLE_SIZE - allParcels.length
    const existingIds = allParcels.map(p => p.parcel_id)

    const { data: extra, error } = await supabase
      .from('zoning_assignments')
      .select('parcel_id, address, zone_code, jurisdiction')
      .not('parcel_id', 'in', `(${existingIds.map(id => `"${id}"`).join(',')})`)
      .not('address', 'is', null)
      .not('zone_code', 'is', null)
      .limit(needed)

    if (!error && extra) allParcels.push(...extra)
  }

  const sample = allParcels.slice(0, SAMPLE_SIZE)
  console.log(`Sample size: ${sample.length} parcels`)
  return sample
}

// ── Step 2: POST to /api/zoning-chat ─────────────────────────────────────────
async function queryChatbot(address: string): Promise<{ zone_code: string | null; raw: string }> {
  const url = `${BASE_URL}/api/zoning-chat`
  const query = `What is the zoning for ${address}?`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query }),
      signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
    })

    if (!res.ok) {
      return { zone_code: null, raw: `HTTP ${res.status}` }
    }

    const body = await res.json() as Record<string, unknown>

    // Prefer explicit zone_code field; fall back to regex extraction from message
    const explicit = (body.zone_code as string | undefined) ?? null
    if (explicit) return { zone_code: explicit.toUpperCase().trim(), raw: JSON.stringify(body) }

    // Extract from text response
    const text = (body.message as string | undefined) ?? (body.response as string | undefined) ?? ''
    const match = text.match(/\b(R-1AA?|R-1B|R-[1-9]\w*|RM-?\w*|MFR-?\w*|SFR|RE\b|REU|SRE|BU-\w+|C-\w+|PUD\w*|TR-\w+|GML|ACREAGE|CP\b|OFFICE|TOWNHOUSE|RU-\d+\w*|AU-\d*\w*|IU-?\w*)\b/i)
    const extracted = match ? match[1].toUpperCase().trim() : null

    return { zone_code: extracted, raw: text.slice(0, 300) }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { zone_code: null, raw: `ERROR: ${msg}` }
  }
}

// ── Step 3: Check if a zone code exists in our DB ────────────────────────────
async function knownZoneCodes(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('zoning_assignments')
    .select('zone_code')
    .not('zone_code', 'is', null)
    .limit(2000)

  if (error || !data) return new Set()
  return new Set(data.map(r => (r.zone_code as string).toUpperCase().trim()))
}

// ── Step 4: Classify result ───────────────────────────────────────────────────
function classify(
  dbZone: string | null,
  chatbotZone: string | null,
  allKnownZones: Set<string>,
): { status: MatchStatus; fabricated: boolean } {
  if (!chatbotZone) return { status: 'no_response', fabricated: false }

  const isFabricated = chatbotZone !== null && !allKnownZones.has(chatbotZone)
  if (isFabricated) return { status: 'fabricated', fabricated: true }

  const isMatch = dbZone !== null && dbZone.toUpperCase().trim() === chatbotZone
  return { status: isMatch ? 'match' : 'mismatch', fabricated: false }
}

// ── Step 5: Write results to Supabase ────────────────────────────────────────
async function upsertAuditRows(rows: AuditRow[]): Promise<void> {
  // Insert in batches of 20 to stay within payload limits
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20)
    const { error } = await supabase
      .from('audit_zoning_accuracy')
      .upsert(batch, { onConflict: 'parcel_id' })

    if (error) console.error(`Upsert batch ${i / 20 + 1} failed:`, error.message)
    else console.log(`  Stored batch ${i / 20 + 1} (${batch.length} rows)`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔍  ZoneWise Zoning Accuracy Audit`)
  console.log(`   Target endpoint: ${BASE_URL}/api/zoning-chat`)
  console.log(`   Sample size: ${SAMPLE_SIZE}`)
  console.log(`   Started: ${new Date().toISOString()}\n`)

  const [parcels, knownZones] = await Promise.all([
    fetchSampleParcels(),
    knownZoneCodes(),
  ])

  console.log(`Known zone codes in DB: ${knownZones.size}\n`)

  const counters = { match: 0, mismatch: 0, no_response: 0, fabricated: 0 }
  const auditRows: AuditRow[] = []
  const mismatches: string[] = []
  const fabrications: string[] = []

  for (let i = 0; i < parcels.length; i++) {
    const parcel = parcels[i]
    const address = parcel.address ?? ''
    const dbZone = parcel.zone_code?.toUpperCase().trim() ?? null

    process.stdout.write(`[${i + 1}/${parcels.length}] ${address.padEnd(50)} DB: ${(dbZone ?? 'null').padEnd(12)}`)

    const { zone_code: chatbotZone, raw } = await queryChatbot(address)
    const { status, fabricated } = classify(dbZone, chatbotZone, knownZones)

    counters[status]++

    const statusIcon = { match: '✅', mismatch: '❌', no_response: '⚠️ ', fabricated: '🚨' }[status]
    process.stdout.write(`→ ${statusIcon} ${status.padEnd(12)} Chatbot: ${chatbotZone ?? 'none'}\n`)

    if (status === 'mismatch') {
      mismatches.push(`  ${address} | DB: ${dbZone} | Chatbot: ${chatbotZone} | ${parcel.jurisdiction ?? ''}`)
    }
    if (fabricated && chatbotZone) {
      fabrications.push(`  ${address} | Fabricated zone: ${chatbotZone}`)
    }

    auditRows.push({
      parcel_id: parcel.parcel_id,
      address: parcel.address,
      db_zone_code: dbZone,
      chatbot_zone_code: chatbotZone,
      bcpao_zone_code: null,
      match_chatbot: status === 'match' ? true : status === 'no_response' ? null : false,
      match_bcpao: null,
      fabricated,
      audit_date: new Date().toISOString(),
      notes: raw.slice(0, 200) || null,
    })

    // Small delay to avoid hammering the endpoint
    if (i < parcels.length - 1) await new Promise(r => setTimeout(r, 200))
  }

  // ── Results Summary ─────────────────────────────────────────────────────
  const total = parcels.length
  const accuracy = total > 0 ? ((counters.match / total) * 100).toFixed(1) : '0.0'

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  AUDIT RESULTS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Total parcels:   ${total}`)
  console.log(`  ✅ Match:        ${counters.match}`)
  console.log(`  ❌ Mismatch:     ${counters.mismatch}`)
  console.log(`  ⚠️  No response:  ${counters.no_response}`)
  console.log(`  🚨 Fabricated:   ${counters.fabricated}`)
  console.log(`  Accuracy:        ${accuracy}%`)

  if (parseFloat(accuracy) < 95) {
    console.log('\n  ⚠️  WARNING: Accuracy below 95% threshold')
  }

  if (mismatches.length > 0) {
    console.log('\n  MISMATCHES:')
    mismatches.forEach(m => console.log(m))
  }

  if (fabrications.length > 0) {
    console.log('\n  FABRICATIONS (zone codes not in DB):')
    fabrications.forEach(f => console.log(f))
  }

  // ── Store to Supabase ──────────────────────────────────────────────────
  console.log('\n  Storing results to audit_zoning_accuracy...')
  await upsertAuditRows(auditRows)

  console.log(`\n  Done: ${new Date().toISOString()}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  process.exit(parseFloat(accuracy) < 95 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
