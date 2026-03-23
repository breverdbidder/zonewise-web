// lib/explorer/tracking.ts
// Lightweight conversion funnel event tracker — writes to Supabase conversion_funnel table.
// All failures are silent (never block UX).

import { createClient } from '@/lib/supabase/client'

export type FunnelEvent =
  | 'parcel_click'
  | 'chat_message'
  | 'upgrade_modal_shown'
  | 'cta_clicked'

interface TrackPayload {
  event: FunnelEvent
  zip?: string
  parcel_id?: string
  metric?: string
  cta_label?: string
}

let _sessionId: string | null = null

function getSessionId(): string {
  if (_sessionId) return _sessionId
  try {
    let id = sessionStorage.getItem('zw_session')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem('zw_session', id)
    }
    _sessionId = id
    return id
  } catch {
    return 'anon'
  }
}

export async function trackEvent(payload: TrackPayload): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from('conversion_funnel').insert({
      event: payload.event,
      session_id: getSessionId(),
      zip: payload.zip ?? null,
      parcel_id: payload.parcel_id ?? null,
      metric: payload.metric ?? null,
      cta_label: payload.cta_label ?? null,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Table may not exist yet — fail silently
  }
}
