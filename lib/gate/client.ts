'use client'

import { LEAD_GATE_COOKIE, LEAD_ENDPOINT } from './config'

export function hasLeadCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c === `${LEAD_GATE_COOKIE}=1`)
}

export function isValidEmail(e: string): boolean {
  if (!e || e.indexOf(' ') !== -1) return false
  const at = e.indexOf('@')
  if (at < 1 || e.indexOf('@', at + 1) !== -1) return false
  const domain = e.slice(at + 1)
  const dot = domain.indexOf('.')
  return dot > 0 && dot < domain.length - 1
}

// Same endpoint the ZoneWise Voice Assistant email gate already uses
// (writes to floorplan_voice_leads, sets the LEAD_GATE_COOKIE on success).
export async function captureLead(email: string, source: string): Promise<boolean> {
  try {
    const res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source }),
    })
    return res.ok
  } catch {
    return false
  }
}
