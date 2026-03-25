/**
 * Stitch Usage Tracking
 * Tracks design system usage events for quota monitoring
 * Free tier: 350 queries/month → alert at 80% (280)
 */

type StitchEventType =
  | 'design_token_lookup'
  | 'component_spec_view'
  | 'design_md_read'
  | 'stitch_generate'
  | 'stitch_enhance'

interface StitchEvent {
  event: StitchEventType
  component?: string
  token?: string
  timestamp: string
  session_id?: string
}

/**
 * Log a Stitch design system usage event.
 * In production, this would fire to Supabase insights table.
 * Currently logs to console + localStorage for quota tracking.
 */
export function logStitchEvent(
  event: StitchEventType,
  metadata?: Partial<Omit<StitchEvent, 'event' | 'timestamp'>>
): void {
  const entry: StitchEvent = {
    event,
    timestamp: new Date().toISOString(),
    ...metadata,
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Stitch]', entry)
  }

  // Track monthly quota in localStorage
  if (typeof window !== 'undefined') {
    const monthKey = `stitch_count_${new Date().toISOString().slice(0, 7)}`
    const current = parseInt(localStorage.getItem(monthKey) ?? '0', 10)
    const next = current + 1
    localStorage.setItem(monthKey, String(next))

    // Warn at 80% of 350 free tier
    if (next === 280) {
      console.warn('[Stitch] ⚠️ 80% quota reached (280/350). Upgrade or reduce usage.')
    }
  }
}

/**
 * Get current month's Stitch usage count (client-side only)
 */
export function getStitchMonthlyCount(): number {
  if (typeof window === 'undefined') return 0
  const monthKey = `stitch_count_${new Date().toISOString().slice(0, 7)}`
  return parseInt(localStorage.getItem(monthKey) ?? '0', 10)
}
