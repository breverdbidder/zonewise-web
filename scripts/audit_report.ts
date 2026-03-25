/**
 * audit_report.ts
 * Phase 1 — Zoning Audit Report Generator
 *
 * Reads from audit_zoning_accuracy table, generates summary:
 *   - Total accuracy %, mismatches by municipality, fabrication count
 *   - WARNING output if accuracy < 95%
 *   - Sends summary to Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID env vars)
 *
 * Usage:
 *   npx tsx scripts/audit_report.ts
 */

import { createClient } from '@supabase/supabase-js'

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── Telegram helper ──────────────────────────────────────────────────────────
async function sendTelegram(text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('  (Telegram not configured — skipping notification)')
    return
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(8_000),
      }
    )
    if (!res.ok) {
      const err = await res.text()
      console.warn('  Telegram send failed:', err.slice(0, 200))
    } else {
      console.log('  Telegram notification sent.')
    }
  } catch (err) {
    console.warn('  Telegram error:', err instanceof Error ? err.message : String(err))
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📊  Zoning Audit Report`)
  console.log(`   Started: ${new Date().toISOString()}\n`)

  const { data: rows, error } = await supabase
    .from('audit_zoning_accuracy')
    .select('*')
    .order('audit_date', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Failed to read audit_zoning_accuracy:', error.message)
    process.exit(1)
  }

  if (!rows || rows.length === 0) {
    console.log('No audit rows found. Run audit_zoning_accuracy.ts first.')
    process.exit(0)
  }

  // ── Aggregate ──────────────────────────────────────────────────────────
  interface AuditRow {
    parcel_id: string
    address: string | null
    db_zone_code: string | null
    chatbot_zone_code: string | null
    bcpao_zone_code: string | null
    match_chatbot: boolean | null
    match_bcpao: boolean | null
    fabricated: boolean
    audit_date: string
    notes: string | null
    jurisdiction?: string | null
  }

  const total = rows.length
  const chatbotChecked = rows.filter((r: AuditRow) => r.match_chatbot !== null)
  const chatbotMatches = chatbotChecked.filter((r: AuditRow) => r.match_chatbot === true).length
  const chatbotMismatches = chatbotChecked.filter((r: AuditRow) => r.match_chatbot === false && !r.fabricated).length
  const noResponse = rows.filter((r: AuditRow) => r.chatbot_zone_code === null).length
  const fabrications = rows.filter((r: AuditRow) => r.fabricated).length

  const bcpaoChecked = rows.filter((r: AuditRow) => r.match_bcpao !== null)
  const bcpaoMatches = bcpaoChecked.filter((r: AuditRow) => r.match_bcpao === true).length
  const bcpaoMismatches = bcpaoChecked.filter((r: AuditRow) => r.match_bcpao === false).length

  const chatbotAccuracy =
    chatbotChecked.length > 0 ? ((chatbotMatches / chatbotChecked.length) * 100).toFixed(1) : 'N/A'
  const bcpaoAccuracy =
    bcpaoChecked.length > 0 ? ((bcpaoMatches / bcpaoChecked.length) * 100).toFixed(1) : 'N/A'

  // ── Mismatches by municipality ─────────────────────────────────────────
  // Pull jurisdiction from zoning_assignments for the mismatch parcel IDs
  const mismatchParcelIds = rows
    .filter((r: AuditRow) => r.match_chatbot === false && !r.fabricated)
    .map((r: AuditRow) => r.parcel_id)

  const byJurisdiction: Record<string, number> = {}

  if (mismatchParcelIds.length > 0) {
    const { data: zoning } = await supabase
      .from('zoning_assignments')
      .select('parcel_id, jurisdiction')
      .in('parcel_id', mismatchParcelIds)

    for (const z of zoning ?? []) {
      const jur = (z.jurisdiction as string | null) ?? 'Unknown'
      byJurisdiction[jur] = (byJurisdiction[jur] ?? 0) + 1
    }
  }

  // ── Print Report ───────────────────────────────────────────────────────
  const auditDate = new Date().toISOString().split('T')[0]
  const chatbotAccuracyNum = chatbotChecked.length > 0 ? (chatbotMatches / chatbotChecked.length) * 100 : null
  const belowThreshold = chatbotAccuracyNum !== null && chatbotAccuracyNum < 95
  const belowPerfect = chatbotAccuracyNum !== null && chatbotAccuracyNum < 99

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  ZONING ACCURACY AUDIT — ${auditDate}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Total parcels audited:   ${total}`)
  console.log('')
  console.log('  CHATBOT vs DB:')
  console.log(`    Accuracy:              ${chatbotAccuracy}%  (${chatbotMatches}/${chatbotChecked.length} checked)`)
  console.log(`    Mismatches:            ${chatbotMismatches}`)
  console.log(`    No response:           ${noResponse}`)
  console.log(`    Fabricated zones:      ${fabrications}`)
  console.log('')
  console.log('  DB vs BCPAO (ground truth):')
  console.log(`    Accuracy:              ${bcpaoAccuracy}%  (${bcpaoMatches}/${bcpaoChecked.length} checked)`)
  console.log(`    Stale/mismatch:        ${bcpaoMismatches}`)

  if (Object.keys(byJurisdiction).length > 0) {
    console.log('\n  MISMATCHES BY MUNICIPALITY:')
    for (const [jur, count] of Object.entries(byJurisdiction).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${jur.padEnd(30)} ${count}`)
    }
  }

  if (fabrications > 0) {
    console.log('\n  🚨 FABRICATED ZONE CODES (not in DB):')
    rows
      .filter((r: AuditRow) => r.fabricated)
      .forEach((r: AuditRow) =>
        console.log(`    ${r.parcel_id} | ${r.address ?? ''} → ${r.chatbot_zone_code ?? '?'}`)
      )
  }

  if (belowThreshold) {
    console.log('\n  ⚠️  WARNING: Chatbot accuracy is below 95% threshold!')
    console.log('  Failing cases:')
    rows
      .filter((r: AuditRow) => r.match_chatbot === false || r.fabricated)
      .forEach((r: AuditRow) =>
        console.log(
          `    [${r.fabricated ? 'FABRICATED' : 'MISMATCH'}] ${r.address ?? r.parcel_id} | DB: ${r.db_zone_code ?? 'null'} | Chatbot: ${r.chatbot_zone_code ?? 'none'}`
        )
      )
  }

  console.log('\n  Disclaimer status:')
  if (!belowPerfect) {
    console.log('    ✅ Accuracy ≥ 99% — no disclaimer required')
  } else if (!belowThreshold) {
    console.log(`    ℹ️  Accuracy ${chatbotAccuracy}% (< 99%) — ZoningDisclaimer component should be shown`)
  } else {
    console.log(`    ⚠️  Accuracy ${chatbotAccuracy}% (< 95%) — ZoningDisclaimer + immediate investigation needed`)
  }

  console.log(`\n  Done: ${new Date().toISOString()}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // ── Telegram Notification ──────────────────────────────────────────────
  const statusEmoji = belowThreshold ? '🚨' : belowPerfect ? '⚠️' : '✅'
  const telegramMsg = [
    `${statusEmoji} *ZoneWise Zoning Audit — ${auditDate}*`,
    '',
    `📊 *Chatbot vs DB*`,
    `  Accuracy: *${chatbotAccuracy}%* (${chatbotMatches}/${chatbotChecked.length})`,
    `  Mismatches: ${chatbotMismatches} | No response: ${noResponse} | Fabricated: ${fabrications}`,
    '',
    `🏛️ *DB vs BCPAO*`,
    `  Accuracy: *${bcpaoAccuracy}%* (${bcpaoMatches}/${bcpaoChecked.length})`,
    `  Stale parcels: ${bcpaoMismatches}`,
    belowThreshold ? '\n⚠️ *WARNING: Accuracy below 95% — investigation required*' : '',
    fabrications > 0 ? `\n🚨 *${fabrications} fabricated zone codes detected*` : '',
  ].filter(Boolean).join('\n')

  await sendTelegram(telegramMsg)

  process.exit(belowThreshold ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
