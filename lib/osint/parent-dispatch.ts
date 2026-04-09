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
import { calculateMaxBid, getRecommendation } from '../scoring'
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
 * Re-run Shapira Formula V1 on enriched parcels
 * Recalculates max_bid and recommendation for all 197 auctions in scope
 */
async function rerunShapiraFormula(scope: number = 197): Promise<{
  scored: number
  bid: number
  review: number
  skip: number
}> {
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

  const { data: auctions, error } = await sb
    .from('multi_county_auctions')
    .select('id, parcel_id, opening_bid, final_judgment_amount')
    .not('parcel_id', 'is', null)
    .order('sale_date', { ascending: true })
    .limit(scope)

  if (error) throw new Error(`Fetch auctions for Shapira: ${error.message}`)
  if (!auctions?.length) return { scored: 0, bid: 0, review: 0, skip: 0 }

  const parcelIds = auctions.map((a) => a.parcel_id).filter(Boolean)

  const { data: parcels } = await sb
    .from('fl_parcels')
    .select('parcel_id, jv')
    .in('parcel_id', parcelIds)

  const parcelMap = new Map(
    (parcels || []).map((p) => [p.parcel_id, p.jv]),
  )

  let scored = 0
  let bid = 0
  let review = 0
  let skip = 0

  for (const auction of auctions) {
    const jv = parcelMap.get(auction.parcel_id)
    if (!jv) continue

    const openingBid = auction.opening_bid || auction.final_judgment_amount
    const result = getRecommendation(jv, openingBid)

    scored++
    if (result.recommendation === 'BID') bid++
    else if (result.recommendation === 'REVIEW') review++
    else if (result.recommendation === 'SKIP') skip++
  }

  return { scored, bid, review, skip }
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

  // Phase 3: Re-run Shapira Formula V1 on enriched parcels
  const shapiraResults = await rerunShapiraFormula(197)
  console.log(`[osint-dispatch] Shapira V1 re-scored ${shapiraResults.scored} auctions`)
  console.log(`[osint-dispatch]   BID: ${shapiraResults.bid} | REVIEW: ${shapiraResults.review} | SKIP: ${shapiraResults.skip}`)

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
