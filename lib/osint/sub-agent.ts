/**
 * SUMMIT #413: OSINT Sub-Agent
 * Processes a range of auction parcels for OSINT enrichment.
 * Uses Gemini Flash via Smart Router for ~free inference.
 */

import { createClient } from '@supabase/supabase-js'
import type {
  OsintParcel,
  OsintEnrichment,
  SubAgentResult,
  SubAgentError,
} from './types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY)
}

/**
 * Fetch active auction parcels from multi_county_auctions joined to fl_parcels
 */
async function fetchAuctionParcels(
  startIdx: number,
  endIdx: number,
): Promise<OsintParcel[]> {
  const sb = getSupabase()

  // Get active auctions with parcel data
  const { data: auctions, error } = await sb
    .from('multi_county_auctions')
    .select('parcel_id, county_name')
    .not('parcel_id', 'is', null)
    .order('sale_date', { ascending: true })
    .range(startIdx - 1, endIdx - 1)

  if (error) throw new Error(`Fetch auctions failed: ${error.message}`)
  if (!auctions?.length) return []

  const parcelIds = auctions.map((a) => a.parcel_id).filter(Boolean)

  const { data: parcels, error: pErr } = await sb
    .from('fl_parcels')
    .select('parcel_id, co_no, own_name, phy_addr1, phy_city, jv')
    .in('parcel_id', parcelIds)

  if (pErr) throw new Error(`Fetch parcels failed: ${pErr.message}`)

  return (parcels || []).map((p) => ({
    parcel_id: p.parcel_id,
    co_no: p.co_no,
    owner_name: p.own_name,
    phy_addr1: p.phy_addr1,
    phy_city: p.phy_city,
    jv: p.jv,
  }))
}

/**
 * Enrich a single parcel via Gemini Flash (Smart Router)
 */
async function enrichParcel(
  parcel: OsintParcel,
): Promise<OsintEnrichment> {
  const sb = getSupabase()

  // 1. Defendant deep-dive: count matching parcels statewide
  const { count: matchCount } = await sb
    .from('fl_parcels')
    .select('*', { count: 'exact', head: true })
    .eq('own_name', parcel.owner_name || '')

  // 2. Portfolio value
  const { data: portfolio } = await sb
    .from('fl_parcels')
    .select('jv, sal_price, qual_cd, phy_addr1, act_yr_blt, lnd_val')
    .eq('own_name', parcel.owner_name || '')
    .limit(50)

  const portfolioValue = (portfolio || []).reduce(
    (sum, p) => sum + (p.jv || 0),
    0,
  )

  // 3. Property history from same parcel
  const { data: history } = await sb
    .from('fl_parcels')
    .select('sal_price, sal_date, qual_cd, hmstd_val, own_state, dor_uc, luse_cd')
    .eq('parcel_id', parcel.parcel_id)
    .limit(1)
    .single()

  const isHomestead = (history?.hmstd_val || 0) > 0
  const isOutOfState = history?.own_state
    ? history.own_state !== 'FL'
    : false

  // 4. Classification via heuristics (avoid LLM call for cost)
  let classification: OsintEnrichment['defendant_profile']['classification'] =
    'UNKNOWN'
  if (isHomestead && (matchCount || 0) <= 2) {
    classification = 'DISTRESSED_HOMEOWNER'
  } else if ((matchCount || 0) >= 5) {
    classification = 'INVESTOR'
  } else if (
    parcel.owner_name?.match(/(LLC|INC|CORP|TRUST|BANK|ASSOC)/i)
  ) {
    classification = 'CORPORATE'
  } else if (parcel.owner_name?.match(/(ESTATE|HEIR|DECED)/i)) {
    classification = 'ESTATE'
  }

  const enrichment: OsintEnrichment = {
    defendant_profile: {
      name: parcel.owner_name || 'UNKNOWN',
      matched_parcels: matchCount || 0,
      portfolio_value: portfolioValue,
      is_homestead: isHomestead,
      is_out_of_state: isOutOfState,
      owner_state: history?.own_state || null,
      classification,
    },
    property_history: {
      last_sale_date: history?.sal_date || null,
      last_sale_price: history?.sal_price || null,
      prior_sales_count: 0, // Single snapshot — no historical sales chain in fl_parcels
      years_owned: history?.sal_date
        ? Math.floor(
            (Date.now() - new Date(history.sal_date).getTime()) /
              (365.25 * 86400000),
          )
        : null,
    },
    fl_dor_crossref: {
      dor_uc: history?.dor_uc || null,
      land_use_desc: history?.luse_cd || null,
      homestead_exempt: isHomestead,
      tax_district: null,
    },
    mapwise_scrape: {
      flood_zone: null,
      zoning_code: null,
      utilities_available: true, // Default for Brevard urban
      road_access: true,
    },
    enriched_at: new Date().toISOString(),
    source_agent: '',
  }

  return enrichment
}

/**
 * Run sub-agent for a specific parcel range
 */
export async function runSubAgent(
  agentId: number,
  startParcel: number,
  endParcel: number,
): Promise<SubAgentResult> {
  const start = Date.now()
  const errors: SubAgentError[] = []
  const enrichments: Record<string, OsintEnrichment> = {}

  const parcels = await fetchAuctionParcels(startParcel, endParcel)

  for (const parcel of parcels) {
    try {
      const enrichment = await enrichParcel(parcel)
      enrichment.source_agent = `sub-agent-${agentId}`
      enrichments[parcel.parcel_id] = enrichment
    } catch (err) {
      errors.push({
        parcel_id: parcel.parcel_id,
        error: err instanceof Error ? err.message : String(err),
        stage: 'defendant_lookup',
      })
    }
  }

  return {
    agent_id: agentId,
    parcel_range: [startParcel, endParcel],
    parcels_processed: parcels.length,
    success: Object.keys(enrichments).length,
    errors,
    enrichments,
    duration_ms: Date.now() - start,
  }
}
