/**
 * audit_zoning_bcpao.ts
 * Phase 1 — BCPAO Ground-Truth Comparison
 *
 * For the same 50 parcels stored by audit_zoning_accuracy.ts,
 * query the BCPAO GIS API directly to get the authoritative zone_code.
 * Compare vs our Supabase zoning_assignments value.
 * Update audit_zoning_accuracy rows with bcpao_zone_code + match_bcpao.
 *
 * Usage:
 *   npx tsx scripts/audit_zoning_bcpao.ts
 */

import { createClient } from '@supabase/supabase-js'

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BCPAO_GIS_URL =
  'https://gis.brevardfl.gov/gissrv/rest/services/Base_Map/Parcel_New_WKID2881/MapServer/5/query'
const GIS_TIMEOUT_MS = 12_000

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── BCPAO GIS query ──────────────────────────────────────────────────────────
async function fetchBcpaoZone(parcelId: string): Promise<string | null> {
  // Determine query predicate: TaxAcct (pure digits) vs DOR PARCEL_ID
  const isTaxAcct = /^\d+$/.test(parcelId)
  const sanitized = parcelId.replace(/[^0-9A-Za-z \-*.]/g, '')
  const where = isTaxAcct ? `TaxAcct=${sanitized}` : `PARCEL_ID='${sanitized}'`

  const params = new URLSearchParams({
    where,
    outFields: 'ZONE_CODE,ZONING,ZONE,ZONING_DIST,TaxAcct,PARCEL_ID',
    returnGeometry: 'false',
    f: 'json',
    resultRecordCount: '1',
  })

  try {
    const res = await fetch(`${BCPAO_GIS_URL}?${params}`, {
      headers: { 'User-Agent': 'ZoneWise-Audit/1.0' },
      signal: AbortSignal.timeout(GIS_TIMEOUT_MS),
    })

    if (!res.ok) {
      console.warn(`  BCPAO HTTP ${res.status} for ${parcelId}`)
      return null
    }

    const json = await res.json() as { features?: { attributes: Record<string, unknown> }[] }
    const features = json?.features

    if (!Array.isArray(features) || features.length === 0) return null

    const attrs = features[0].attributes
    // BCPAO uses different field names depending on layer version — try all
    const raw = (
      (attrs.ZONE_CODE as string | null) ??
      (attrs.ZONING as string | null) ??
      (attrs.ZONE as string | null) ??
      (attrs.ZONING_DIST as string | null)
    )

    return raw ? raw.toUpperCase().trim() : null
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  BCPAO error for ${parcelId}: ${msg}`)
    return null
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏛️   BCPAO Ground-Truth Comparison`)
  console.log(`   GIS endpoint: ${BCPAO_GIS_URL}`)
  console.log(`   Started: ${new Date().toISOString()}\n`)

  // Load rows from audit table that haven't had BCPAO checked yet
  const { data: rows, error } = await supabase
    .from('audit_zoning_accuracy')
    .select('id, parcel_id, address, db_zone_code')
    .is('bcpao_zone_code', null)
    .order('audit_date', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Failed to read audit_zoning_accuracy:', error.message)
    process.exit(1)
  }

  if (!rows || rows.length === 0) {
    console.log('No rows to process. Run audit_zoning_accuracy.ts first.')
    process.exit(0)
  }

  console.log(`Processing ${rows.length} parcels...\n`)

  const counters = { match: 0, mismatch: 0, not_found: 0 }
  const staleParcels: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    process.stdout.write(`[${i + 1}/${rows.length}] ${(row.parcel_id as string).padEnd(25)} DB: ${((row.db_zone_code as string) ?? 'null').padEnd(12)}`)

    const bcpaoZone = await fetchBcpaoZone(row.parcel_id as string)

    if (!bcpaoZone) {
      counters.not_found++
      process.stdout.write(`→ ⚠️  not found in BCPAO\n`)

      await supabase
        .from('audit_zoning_accuracy')
        .update({ bcpao_zone_code: null, match_bcpao: null, notes: 'BCPAO parcel not found' })
        .eq('id', row.id)

      continue
    }

    const dbZone = (row.db_zone_code as string | null)?.toUpperCase().trim() ?? null
    const matchBcpao = dbZone !== null && dbZone === bcpaoZone

    if (!matchBcpao && dbZone !== null) {
      counters.mismatch++
      staleParcels.push(`  ${row.parcel_id} | DB: ${dbZone} | BCPAO: ${bcpaoZone} | ${row.address ?? ''}`)
    } else {
      counters.match++
    }

    const icon = matchBcpao ? '✅' : '❌'
    process.stdout.write(`→ ${icon} BCPAO: ${bcpaoZone}\n`)

    await supabase
      .from('audit_zoning_accuracy')
      .update({ bcpao_zone_code: bcpaoZone, match_bcpao: matchBcpao })
      .eq('id', row.id)

    // Throttle to stay under GIS rate limits
    if (i < rows.length - 1) await new Promise(r => setTimeout(r, 300))
  }

  // ── Results ─────────────────────────────────────────────────────────────
  const checked = counters.match + counters.mismatch
  const dbAccuracy = checked > 0 ? ((counters.match / checked) * 100).toFixed(1) : 'N/A'

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  BCPAO COMPARISON RESULTS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  ✅ DB matches BCPAO:  ${counters.match}`)
  console.log(`  ❌ DB stale vs BCPAO: ${counters.mismatch}`)
  console.log(`  ⚠️  Not found in GIS:  ${counters.not_found}`)
  console.log(`  DB vs BCPAO accuracy: ${dbAccuracy}%`)

  if (staleParcels.length > 0) {
    console.log('\n  STALE PARCELS (DB differs from BCPAO):')
    staleParcels.forEach(s => console.log(s))
  }

  console.log(`\n  Done: ${new Date().toISOString()}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
