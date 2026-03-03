export interface Auction {
  id: number
  county: string
  case_number: string
  property_address: string | null
  auction_type: string
  auction_date: string | null
  plaintiff: string | null
  defendant?: string | null
  judgment_amount?: number | null
  assessed_value: number | null
  opening_bid: number | null
  parcel_id: string | null
  source_url: string | null
  scraped_at: string | null
  created_at: string | null
  fl_parcel_id: string | null
  fl_co_no: number | null
  just_value: number | null
  land_value: number | null
  total_living_area: number | null
  year_built: number | null
  owner_name: string | null
  lot_sqft: number | null
  centroid_lat: number | null
  centroid_lng: number | null
  photo_url: string | null
  enriched_at: string | null
  is_condo: boolean
  is_vacant_land: boolean
  address_status: string | null
  // Zoning intelligence fields
  dor_use_code: string | null
  zoning_category: string | null
  zone_code: string | null
  municipality: string | null
}

/** Enriched auction detail (from /api/auctions/[id]) */
export interface AuctionDetail extends Auction {
  bcpao_photo_url: string | null
  zoning: ZoningInfo | null
  recommendation: 'BID' | 'REVIEW' | 'SKIP' | 'UNKNOWN'
  recommendation_color: string
  max_bid: number | null
  bid_ratio: number | null
}

export interface ZoningInfo {
  dor_use_code: string | null
  dor_use_description: string | null
  zone_code: string | null
  municipality: string | null
  future_land_use: string | null
  improvement_quality: string | null
  construction_class: string | null
  last_sale_price: number | null
  last_sale_year: number | null
  homestead_value: number | null
}

export interface AuctionSummary {
  total: number
  by_county: Record<string, number>
  by_type: Record<string, number>
  by_zoning: Record<string, number>
  with_address: number
  vacant_land: number
  condos: number
}

export interface AuctionsResponse {
  data: Auction[]
  total: number
  limit: number
  offset: number
}

export type SortField = 'auction_date' | 'county' | 'just_value' | 'property_address' | 'zoning_category'
export type SortDirection = 'asc' | 'desc'
export type ViewMode = 'table' | 'map' | 'calendar' | 'spreadsheet'
