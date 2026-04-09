/**
 * SUMMIT #413: OSINT Enrichment Types
 * Parent + 4 sub-agent fan-out for parallel parcel enrichment
 */

export interface OsintParcel {
  parcel_id: string
  co_no: string
  owner_name: string | null
  phy_addr1: string | null
  phy_city: string | null
  jv: number | null
}

export interface OsintEnrichment {
  defendant_profile: {
    name: string
    matched_parcels: number
    portfolio_value: number
    is_homestead: boolean
    is_out_of_state: boolean
    owner_state: string | null
    classification: 'DISTRESSED_HOMEOWNER' | 'INVESTOR' | 'CORPORATE' | 'ESTATE' | 'UNKNOWN'
  }
  property_history: {
    last_sale_date: string | null
    last_sale_price: number | null
    prior_sales_count: number
    years_owned: number | null
  }
  fl_dor_crossref: {
    dor_uc: string | null
    land_use_desc: string | null
    homestead_exempt: boolean
    tax_district: string | null
  }
  mapwise_scrape: {
    flood_zone: string | null
    zoning_code: string | null
    utilities_available: boolean
    road_access: boolean
  }
  enriched_at: string
  source_agent: string
}

export interface SubAgentResult {
  agent_id: number
  parcel_range: [number, number]
  parcels_processed: number
  success: number
  errors: SubAgentError[]
  enrichments: Record<string, OsintEnrichment>
  duration_ms: number
}

export interface SubAgentError {
  parcel_id: string
  error: string
  stage: 'defendant_lookup' | 'property_history' | 'fl_dor' | 'mapwise' | 'supabase_write'
}

export interface ParentDispatchResult {
  dispatch_id: string
  started_at: string
  completed_at: string
  total_parcels: number
  total_success: number
  total_errors: number
  sub_agent_results: SubAgentResult[]
  wall_clock_ms: number
  cost_estimate_usd: number
}
