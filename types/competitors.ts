// types/competitors.ts
// Battle Cards Sprint S0a — shared TypeScript interfaces for competitor battle cards.
// Drives: data/competitors/*, components/competitors/*, app/(marketing)/competitors/[slug]/page.tsx

export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type RowOutcome = 'PARITY' | 'ADVANTAGE' | 'GAP' | 'TIE'

export interface PricingTier {
  label: string              // e.g., "Individual", "Professional", "Enterprise"
  competitor_price: string   // e.g., "$650/report", "$89/mo"
  zonewise_price: string     // e.g., "$99/mo", "Free"
  savings_pct?: number       // e.g., 85 (for "85% cheaper")
}

export interface CompetitorProfile {
  // Identity
  slug: string               // URL slug, e.g., 'propzone', 'mapwise', 'algoma'
  name: string               // Display name, e.g., 'PropZone / Gridics'
  tagline: string            // Their positioning line
  domain: string             // e.g., 'propzone.gridics.com'
  threat: ThreatLevel

  // Company context (VERIFIED from CI reports)
  founded_year?: number
  funding?: string           // e.g., '$3M + $5M filing'
  coverage?: string          // e.g., '10K+ cities', 'Florida only (67 counties)'
  customer_count?: string    // e.g., '2,000+ FL real estate professionals'

  // Positioning summary
  their_strengths: string[]  // 3-5 bullets
  their_weaknesses: string[] // 3-5 bullets
  our_edge: string[]         // 3-5 bullets — WHY we win

  // Pricing comparison (1-3 tiers)
  pricing: PricingTier[]

  // Head-to-head verdict
  zonewise_wins: number      // count of wins
  competitor_wins: number    // count of losses
  ties: number               // count of ties
  verdict_line: string       // e.g., "MapWise sells you a window into the data. ZoneWise sells you the data plus an AI that knows what to do with it."

  // KPI parity matrix — references STATIC_KPIS from lib/kpi-data.ts by kpi_code
  // Each kpi_code in `parity_kpi_codes` is a KPI both platforms cover.
  // Each kpi_code in `advantage_kpi_codes` is a ZoneWise-exclusive KPI.
  // Each kpi_code in `gap_kpi_codes` is a KPI the competitor has that we don't yet.
  parity_kpi_codes: string[]
  advantage_kpi_codes: string[]
  gap_kpi_codes: string[]

  // SEO / metadata
  meta_title: string
  meta_description: string

  // Honesty Protocol attribution
  sources: Array<{
    label: string
    url?: string
    date: string             // YYYY-MM-DD when the fact was verified
  }>
}

// Used by CompetitorKpiMatrix to render a single comparison row
export interface KpiMatrixRow {
  kpi_code: string
  kpi_name: string
  category: string
  subcategory: string | null
  description: string | null
  outcome: RowOutcome
  is_exclusive: boolean
}

// Used by the index page to list all 11 battle cards
export interface CompetitorCardSummary {
  slug: string
  name: string
  threat: ThreatLevel
  tagline: string
  zonewise_wins: number
  competitor_wins: number
  ties: number
}
