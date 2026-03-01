export interface Auction {
  id: number
  county: string
  case_number: string
  property_address: string | null
  auction_type: string
  auction_date: string | null
  plaintiff: string | null
  defendant: string | null
  just_value: number | null
  judgment_amount: number | null
  centroid_lat: number | null
  centroid_lng: number | null
  is_vacant_land: boolean
  is_condo: boolean
  address_status: string | null
  parcel_id: string | null
  owner_name: string | null
  year_built: number | null
  total_living_area: number | null
  lot_sqft: number | null
  photo_url: string | null
  enriched_at: string | null
}

export interface AuctionSummary {
  total: number
  by_county: Record<string, number>
  by_type: Record<string, number>
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

export type SortField = 'auction_date' | 'county' | 'just_value' | 'property_address'
export type SortDirection = 'asc' | 'desc'
export type ViewMode = 'table' | 'map'
