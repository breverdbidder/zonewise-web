// Development Analysis Types — ZoneWise.AI

export interface Parcel {
  id: string
  address: string
  city: string
  zip: string
  zone: string
  zoneDesc: string
  lotWidth: number
  lotDepth: number
  landValue: number
  improvValue: number
  yearBuilt: number
  photo: string | null
  setbacks: { front: number; side: number; rear: number }
  maxHeight: number
  maxCoverage: number
  far: number
  currentUse: string
  lat: number | null
  lng: number | null
  floodZone: string
  hasUtilities: boolean
  roadFrontage: number | null
  topography: string
}

export interface Envelope {
  bw: number
  bd: number
  lotArea: number
  footprint: number
  maxByCov: number
  effFP: number
  maxGFA: number
  floors: number
  actualGFA: number
  volume: number
  covPct: string | number
}

export interface HBUScenario {
  useType: string
  use: string
  legal: number
  physical: number
  financial: number
  maximal: number
  score: number
  roi: number
  risk: 'Low' | 'Medium' | 'High'
  timeline: string
  investReq: number
  buildCost: number
  projectedValue: number
  annualNOI: number
  maxBid: number
  isConditional: boolean
}

export interface CMAReport {
  parcel_id: string
  hbu_scenarios: HBUScenario[]
  best_use: string
  best_score: number
  max_bid_amount: number
  computed_at: string
}

export type DataSource = 'server' | 'client'
