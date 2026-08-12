// Server-only client for the BidDeed MCP report engine — the SSOT for S5
// report math (packages/biddeed-mcp/src/report/composer.js in cli-anything-biddeed).
// ZoneWise never reimplements composer.js; it fetches the finished JSON.
//
// GET {base}/report/json?mca_id=... returns { mca_id, report } where `report`
// is the exact S5 object produced by buildReport() — same auth as /mcp
// (Authorization: Bearer bd_live_xxx), no billing (see biddeed-mcp/src/http.js
// handleReportJsonRequest).
import { createServiceClient } from '@/lib/supabase/server'

const MCP_BASE_URL = (process.env.BIDDEED_MCP_BASE_URL || 'https://mcp.biddeed.ai').replace(/\/$/, '')

// Allow-listed per CLAUDE.md CREDENTIAL HANDLING (GTM-22D) — cli_anything_get_secret
// only returns names matching cli_anything_shared_secret / everest_*_pat / cli_anything_*.
const VAULT_SECRET_NAME = 'cli_anything_biddeed_mcp_server_key'

export type ServerKeySource = 'vault' | 'env' | 'none'

let cachedKey: { value: string; source: ServerKeySource } | null = null

// Resolves the server-held bd_live_ key used to call the MCP report engine.
// Never logs or returns the raw value to a caller outside this module — only
// the source label is safe to surface (e.g. in API responses / UI copy).
export async function resolveServerKey(): Promise<{ key: string | null; source: ServerKeySource }> {
  if (cachedKey) return { key: cachedKey.value, source: cachedKey.source }

  // (a) Sanctioned vault accessor. Never SELECT vault.decrypted_secrets directly
  // (retired per GTM-22D — that pattern caused the 2026-07-19 credential leak).
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('cli_anything_get_secret', { name: VAULT_SECRET_NAME })
    const value = typeof data === 'string' ? data : null
    if (!error && value && value.startsWith('bd_live_')) {
      cachedKey = { value, source: 'vault' }
      return { key: value, source: 'vault' }
    }
  } catch {
    // RPC unavailable or secret not present — fall through to env
  }

  // (b) env var, set by Ariel on the Vercel project when no vault secret exists.
  const envKey = process.env.BIDDEED_MCP_SERVER_KEY
  if (envKey) {
    cachedKey = { value: envKey, source: 'env' }
    return { key: envKey, source: 'env' }
  }

  return { key: null, source: 'none' }
}

export interface S5ReportEnvelope {
  mca_id: string
  report: Record<string, unknown>
}

export type S5ReportResult =
  | { ok: true; data: S5ReportEnvelope; keySource: ServerKeySource }
  | { ok: false; status: number; error: string; keySource: ServerKeySource }

// Fetches the full S5 report JSON for a given multi_county_auctions.id.
// `report` is composer.js's output verbatim — v_s5_report_template.report_field
// keys index into it directly, so the SSOT stays the DB view, not this function.
export async function fetchS5Report(mcaId: string): Promise<S5ReportResult> {
  const { key, source } = await resolveServerKey()
  if (!key) {
    return { ok: false, status: 0, error: 'server key not configured', keySource: source }
  }

  try {
    const res = await fetch(`${MCP_BASE_URL}/report/json?mca_id=${encodeURIComponent(mcaId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, status: res.status, error: body?.error || `HTTP ${res.status}`, keySource: source }
    }
    const data = (await res.json()) as S5ReportEnvelope
    return { ok: true, data, keySource: source }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : 'fetch failed',
      keySource: source,
    }
  }
}
