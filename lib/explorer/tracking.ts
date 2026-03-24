// lib/explorer/tracking.ts
// Lightweight conversion funnel event tracker — writes to Supabase conversion_funnel table
// AND fires typed PostHog events. All failures are silent (never block UX).

import { createClient } from '@/lib/supabase/client'
import { track } from '@/lib/posthog'

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
  // Extended fields for PostHog
  query?: string
  county?: string
  zoning?: string
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
  // Dual-fire: PostHog typed events
  try {
    switch (payload.event) {
      case 'parcel_click':
        track({
          name: 'parcel_clicked',
          properties: {
            parcel_id: payload.parcel_id ?? '',
            county: payload.county ?? 'brevard',
            zoning: payload.zoning ?? payload.metric ?? '',
          },
        })
        break
      case 'chat_message':
        track({
          name: 'chat_query_sent',
          properties: {
            query: payload.query ?? '',
            county: payload.county,
          },
        })
        break
      case 'upgrade_modal_shown':
        track({
          name: 'upgrade_modal_shown',
          properties: { trigger: payload.cta_label ?? 'conversion_gate' },
        })
        break
      case 'cta_clicked':
        track({
          name: 'signup_clicked',
          properties: {
            location: payload.cta_label ?? 'unknown',
          },
        })
        break
    }
  } catch {
    // PostHog fail-silent
  }

  // Supabase funnel write
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
