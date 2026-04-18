// app/api/parcel-cards/create/route.ts
// SUMMIT 77c39794 Phase 1b — public endpoint for card creation
// Called by:
//   1. Dify on Hetzner via HTTP node on each completed chat turn
//   2. Server-side from zoning-chat/route.ts (future integration)
//   3. BidDeed analysis workers
//
// Security: requires INTERNAL_AUTH_TOKEN header (shared secret between Next.js and Dify).
//          Rate-limited by middleware. Service-role Supabase access is server-side only.

import { NextRequest, NextResponse } from 'next/server'
import { createParcelCard, type ParcelCardApp, type ParcelCardCitation } from '@/lib/parcel-cards'
import { SECURITY_HEADERS } from '@/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const INTERNAL_AUTH = process.env.INTERNAL_AUTH_TOKEN
if (!INTERNAL_AUTH) {
  // Don't throw at import time — Vercel build would fail if env missing.
  // Route handler checks presence at request time.
  console.warn('[parcel-cards/create] INTERNAL_AUTH_TOKEN not set — route will 503 until configured')
}

type Body = {
  parcel_id: number
  user_id: string | null
  app: ParcelCardApp
  question: string
  answer: { summary: string; confidence?: string; [k: string]: unknown }
  citations?: ParcelCardCitation[]
}

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status, headers: SECURITY_HEADERS })
}

export async function POST(req: NextRequest) {
  // 1. Auth
  if (!INTERNAL_AUTH) return json(503, { error: 'integration_disabled' })
  const provided = req.headers.get('x-internal-auth')
  if (provided !== INTERNAL_AUTH) return json(401, { error: 'unauthorized' })

  // 2. Parse + validate
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json(400, { error: 'invalid_json' })
  }

  const { parcel_id, user_id, app, question, answer, citations } = body
  if (typeof parcel_id !== 'number' || parcel_id <= 0) {
    return json(400, { error: 'invalid_parcel_id' })
  }
  if (!['zonewise', 'biddeed'].includes(app)) {
    return json(400, { error: 'invalid_app' })
  }
  if (!question || typeof question !== 'string' || question.length < 3) {
    return json(400, { error: 'invalid_question' })
  }
  if (!answer || typeof answer !== 'object' || !answer.summary) {
    return json(400, { error: 'invalid_answer' })
  }

  // 3. Create
  try {
    const result = await createParcelCard({
      parcelId: parcel_id,
      userId: user_id ?? null,
      app,
      question,
      answer: answer as { summary: string; [k: string]: unknown },
      citations,
    })
    return json(200, {
      card_id: result.cardId,
      share_url: result.shareUrl,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown_error'
    // FK violations ⇒ 404 (parcel missing), anything else ⇒ 500
    if (msg.includes('violates foreign key constraint')) {
      return json(404, { error: 'parcel_not_found' })
    }
    return json(500, { error: 'create_failed', detail: msg.slice(0, 200) })
  }
}

// Explicit method guards — GET/PUT/DELETE all return 405
export async function GET() {
  return json(405, { error: 'method_not_allowed' })
}
