// Shared config for the PLG email-capture gate on /massing, /floorplan,
// /proforma. Same target table + endpoint as the existing ZoneWise Voice
// Assistant email gate (components/chat/VoiceZoningAssistant.tsx,
// components/floorplan/VoiceDraftsman.tsx -> app/api/floorplan/lead/route.ts
// -> floorplan_voice_leads), reused here rather than inventing a new table.
export const LEAD_ENDPOINT = '/api/floorplan/lead'

// Non-httpOnly so the gate state survives navigation between the three tool
// pages without re-prompting. Soft session marker, not an auth token.
export const LEAD_GATE_COOKIE = 'zw_lead_gated'

// Anonymous per-session cap on full tool-runs (massing generate / floorplan
// compile / proforma calculate) across all three tools combined. Soft nudge
// against unmetered anonymous compute + HomeHarvest comp calls, not a
// security boundary — a cleared cookie resets it, and that's fine.
export const FREE_RUN_COOKIE = 'zw_free_runs'
export const FREE_RUN_CAP = 3

// 24h — long enough to cover one visitor session, short-lived by design.
export const GATE_COOKIE_MAX_AGE = 60 * 60 * 24
