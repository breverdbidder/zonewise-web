// Stitch design system usage tracking
// Tracks component generation events for quota monitoring (350 free/mo)

interface StitchUsageEvent {
  event: 'component_generated' | 'spec_viewed' | 'token_exported'
  component?: string
  timestamp: string
}

export function logStitchUsage(event: StitchUsageEvent['event'], component?: string): void {
  // Log to console in dev, could wire to Supabase for quota tracking
  if (process.env.NODE_ENV === 'development') {
    console.log('[Stitch]', event, component || '')
  }
  // TODO: wire to Supabase stitch_usage table when quota monitoring needed
  // See DESIGNWISE-TODO.md P3-1e
}
