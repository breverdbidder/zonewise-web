/**
 * SUMMIT #413: Parent OSINT Dispatch
 * Fans out to 4 parallel sub-agents, consolidates results,
 * batch updates fl_parcels.osint_json via Supabase.
 *
 * Independence: 88 active auctions, embarrassingly parallel.
 * Sub-agent 1: parcels 1-22
 * Sub-agent 2: parcels 23-44
 * Sub-agent 3: parcels 45-66
 * Sub-agent 4: parcels 67-88
 */

import { createClient } from '@supabase/supabase-js'
import { runSubAgent } from './sub-agent'
import type { ParentDispatchResult, SubAgentResult } from './types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const TOTAL_PARCELS = 88
const NUM_AGENTS = 4
const BATCH_SIZE = Math.ceil(TOTAL_PARCELS / NUM_AGENTS) // 22

/**
 * Fan out to 4 sub-agents in parallel
 */
async function fanOut(): Promise<SubAgentResult[]> {
  const agents = Array.from({ length: NUM_AGENTS }, (_, i) => {
    const start = i * BATCH_SIZE + 1
    const end = Math.min((i + 1) * BATCH_SIZE, TOTAL_PARCELS)
    return runSubAgent(i + 1, start, end)
  })

  return Promise.all(agents)
}

/**
 * Batch update fl_parcels.osint_json from consolidated results
 */
async function batchUpdate(
  results: SubAgentResult[],
): Promise<{ updated: number; failed: number }> {
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
  let updated = 0
  let failed = 0

  for (const result of results) {
    for (const [parcelId, enrichment] of Object.entries(result.enrichments)) {
      const { error } = await sb
        .from('fl_parcels')
        .update({
          osint_json: enrichment,
          osint_enriched_at: enrichment.enriched_at,
        })
        .eq('parcel_id', parcelId)

      if (error) {
        console.error(`[osint-dispatch] Update failed for ${parcelId}: ${error.message}`)
        failed++
      } else {
        updated++
      }
    }
  }

  return { updated, failed }
}

/**
 * Main parent dispatch entry point
 */
export async function runParentDispatch(): Promise<ParentDispatchResult> {
  const dispatchId = `osint-${Date.now()}`
  const startedAt = new Date().toISOString()
  const startMs = Date.now()

  console.log(`[osint-dispatch] Starting dispatch ${dispatchId}`)
  console.log(`[osint-dispatch] Fan-out: ${NUM_AGENTS} sub-agents × ${BATCH_SIZE} parcels`)

  // Phase 1: Parallel fan-out
  const subAgentResults = await fanOut()

  const totalSuccess = subAgentResults.reduce((s, r) => s + r.success, 0)
  const totalErrors = subAgentResults.reduce((s, r) => s + r.errors.length, 0)

  console.log(`[osint-dispatch] Fan-out complete: ${totalSuccess} success, ${totalErrors} errors`)

  // Phase 2: Batch update Supabase
  const { updated, failed } = await batchUpdate(subAgentResults)
  console.log(`[osint-dispatch] Supabase update: ${updated} updated, ${failed} failed`)

  // Phase 3 (re-scoring auctions with the fixed max-bid formula) is removed:
  // that formula is retired (Ariel, 29 Sep / 1 Oct 2026) and the SIGNAL$ Max
  // Bid is withheld until its model validates.

  const completedAt = new Date().toISOString()
  const wallClockMs = Date.now() - startMs

  // Log errors per sub-agent
  for (const result of subAgentResults) {
    if (result.errors.length > 0) {
      console.log(`[osint-dispatch] Sub-agent ${result.agent_id} errors:`)
      for (const err of result.errors) {
        console.log(`  - ${err.parcel_id}: ${err.error} (stage: ${err.stage})`)
      }
    }
  }

  return {
    dispatch_id: dispatchId,
    started_at: startedAt,
    completed_at: completedAt,
    total_parcels: TOTAL_PARCELS,
    total_success: totalSuccess,
    total_errors: totalErrors,
    sub_agent_results: subAgentResults,
    wall_clock_ms: wallClockMs,
    cost_estimate_usd: 0, // Gemini Flash = free tier
  }
}
