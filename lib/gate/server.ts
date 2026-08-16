// Server-side (Route Handler) helpers for the anonymous PLG gate. See
// lib/gate/config.ts for the constants and rationale.
import { NextRequest, NextResponse } from 'next/server'
import { LEAD_GATE_COOKIE, FREE_RUN_COOKIE, FREE_RUN_CAP, GATE_COOKIE_MAX_AGE } from './config'

export function isLeadGated(request: NextRequest): boolean {
  return request.cookies.get(LEAD_GATE_COOKIE)?.value === '1'
}

export function setLeadGateCookie(response: NextResponse) {
  response.cookies.set(LEAD_GATE_COOKIE, '1', {
    maxAge: GATE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  })
}

export function checkFreeRunCap(request: NextRequest): { blocked: boolean; count: number } {
  if (isLeadGated(request)) return { blocked: false, count: 0 }
  const count = parseInt(request.cookies.get(FREE_RUN_COOKIE)?.value ?? '0', 10) || 0
  return { blocked: count >= FREE_RUN_CAP, count }
}

// Call once per successful full tool-run (massing generate / floorplan
// compile / proforma calculate). No-op once the visitor is lead-gated —
// gated visitors are unmetered.
export function recordFreeRun(request: NextRequest, response: NextResponse) {
  if (isLeadGated(request)) return
  const count = parseInt(request.cookies.get(FREE_RUN_COOKIE)?.value ?? '0', 10) || 0
  response.cookies.set(FREE_RUN_COOKIE, String(count + 1), {
    maxAge: GATE_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  })
}

export function usageCapBody() {
  return {
    ok: false,
    code: 'usage_cap_reached' as const,
    error: "You've used your free lookups for this session — enter your email to keep going.",
  }
}

export function leadRequiredBody() {
  return {
    ok: false,
    code: 'lead_required' as const,
    error: 'Enter your email to unlock this export.',
  }
}
