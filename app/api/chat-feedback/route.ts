import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { chatFeedbackSchema, SECURITY_HEADERS } from '@/lib/validation'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: SECURITY_HEADERS })
  }

  const parsed = chatFeedbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422, headers: SECURITY_HEADERS }
    )
  }

  const { sessionId, query, response, rating, feedbackText, parcelId, zoneCode, municipality } = parsed.data

  const { error } = await getSupabase()
    .from('chat_feedback')
    .insert({
      session_id:    sessionId,
      query,
      response,
      rating,
      feedback_text: feedbackText ?? null,
      parcel_id:     parcelId ?? null,
      zone_code:     zoneCode ?? null,
      municipality:  municipality ?? null,
    })

  if (error) {
    console.error('[chat-feedback] insert error:', error.message)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500, headers: SECURITY_HEADERS })
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: SECURITY_HEADERS })
}
