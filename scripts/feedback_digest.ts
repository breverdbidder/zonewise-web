/**
 * feedback_digest.ts
 * ZoneWise — Chatbot Feedback Digest
 *
 * Queries chat_feedback from the last 7 days, calculates summary stats,
 * and sends a Telegram report.
 *
 * Usage:
 *   npx tsx scripts/feedback_digest.ts
 */

import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TELEGRAM_BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN ?? ''
const TELEGRAM_CHAT_ID    = process.env.TELEGRAM_CHAT_ID ?? ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── Telegram helper ───────────────────────────────────────────────────────────
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
      console.warn('  Telegram send failed:', (await res.text()).slice(0, 200))
    } else {
      console.log('  Telegram notification sent.')
    }
  } catch (err) {
    console.warn('  Telegram error:', err instanceof Error ? err.message : String(err))
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface FeedbackRow {
  id: number
  session_id: string
  query: string
  response: string
  rating: 'positive' | 'negative'
  feedback_text: string | null
  parcel_id: string | null
  zone_code: string | null
  municipality: string | null
  created_at: string
}

async function main() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const reportDate = new Date().toISOString().split('T')[0]

  console.log(`\n💬  Chatbot Feedback Digest — Last 7 Days`)
  console.log(`   Since: ${since.split('T')[0]}`)
  console.log(`   Run:   ${reportDate}\n`)

  const { data: rows, error } = await supabase
    .from('chat_feedback')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to query chat_feedback:', error.message)
    process.exit(1)
  }

  if (!rows || rows.length === 0) {
    console.log('No feedback in the last 7 days.')
    await sendTelegram(`💬 *Chatbot Feedback Digest — ${reportDate}*\n\nNo feedback received in the last 7 days.`)
    process.exit(0)
  }

  const total     = rows.length
  const positive  = rows.filter((r: FeedbackRow) => r.rating === 'positive').length
  const negative  = rows.filter((r: FeedbackRow) => r.rating === 'negative').length
  const positivePct = ((positive / total) * 100).toFixed(1)

  // Top negative queries (with feedback text, most recent first)
  const negativeWithText = rows
    .filter((r: FeedbackRow) => r.rating === 'negative' && r.feedback_text)
    .slice(0, 5) as FeedbackRow[]

  // Top negative queries without text
  const negativeNoText = rows
    .filter((r: FeedbackRow) => r.rating === 'negative' && !r.feedback_text)
    .slice(0, 5) as FeedbackRow[]

  // ── Console output ──────────────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  CHATBOT FEEDBACK DIGEST — ${reportDate}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Total feedback:    ${total}`)
  console.log(`  Positive:          ${positive}  (${positivePct}%)`)
  console.log(`  Negative:          ${negative}`)

  if (negativeWithText.length > 0) {
    console.log('\n  TOP NEGATIVE QUERIES (with feedback text):')
    negativeWithText.forEach((r, i) => {
      console.log(`  ${i + 1}. "${r.query.slice(0, 80)}"`)
      console.log(`     → ${r.feedback_text}`)
    })
  }

  if (negativeNoText.length > 0) {
    console.log('\n  OTHER NEGATIVE QUERIES:')
    negativeNoText.forEach((r, i) => {
      console.log(`  ${i + 1}. "${r.query.slice(0, 80)}"`)
    })
  }

  console.log(`\n  Done: ${new Date().toISOString()}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // ── Telegram ────────────────────────────────────────────────────────────
  const ratingEmoji = positive / total >= 0.8 ? '✅' : positive / total >= 0.6 ? '⚠️' : '🚨'

  const topNegLines = negativeWithText
    .map((r, i) => `  ${i + 1}. "${r.query.slice(0, 60)}" — _${r.feedback_text}_`)
    .join('\n')

  const telegramMsg = [
    `💬 *Chatbot Feedback Digest — ${reportDate}*`,
    '',
    `${ratingEmoji} *Summary (last 7 days)*`,
    `  Total: *${total}* | 👍 ${positive} (${positivePct}%) | 👎 ${negative}`,
    negativeWithText.length > 0
      ? `\n*Top Negative Queries:*\n${topNegLines}`
      : '',
  ].filter(Boolean).join('\n')

  await sendTelegram(telegramMsg)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
