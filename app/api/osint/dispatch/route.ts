/**
 * SUMMIT #413: OSINT Dispatch API
 * POST /api/osint/dispatch — Trigger parent OSINT dispatch with 4 sub-agent fan-out
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY for write access.
 * Cost: ~$0 (Gemini Flash free tier via Smart Router)
 */

import { NextResponse } from 'next/server'
import { runParentDispatch } from '@/lib/osint'

export const maxDuration = 300 // 5 min max for serverless

export async function POST(request: Request) {
  // Verify service key is available (no auth — internal dispatch only)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
      { status: 500 },
    )
  }

  try {
    const result = await runParentDispatch()

    return NextResponse.json({
      status: 'completed',
      dispatch_id: result.dispatch_id,
      total_parcels: result.total_parcels,
      total_success: result.total_success,
      total_errors: result.total_errors,
      wall_clock_ms: result.wall_clock_ms,
      cost_estimate_usd: result.cost_estimate_usd,
      sub_agents: result.sub_agent_results.map((r) => ({
        agent_id: r.agent_id,
        parcel_range: r.parcel_range,
        success: r.success,
        errors: r.errors.length,
        duration_ms: r.duration_ms,
      })),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[osint-dispatch] Fatal error: ${message}`)
    return NextResponse.json(
      { error: message, status: 'failed' },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/osint/dispatch',
    method: 'POST',
    description: 'SUMMIT #413: OSINT enrichment dispatch — 4 parallel sub-agents × 22 parcels',
    total_parcels: 88,
    sub_agents: 4,
    cost: '$0 (Gemini Flash free tier)',
  })
}
