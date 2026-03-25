// ZoneWise.AI — Site Feasibility Platform Types

export interface SiteData {
  address: string
  parcelId: string
  parcelValue: number
  ownership: string
  zone: string
  zoneCity: string
  county: string
  flood: string
  qoz: string
  lotArea: number
  maxHeight: number
  far: number
  coverage: number
  setFront: number
  setSide: number
  setRear: number
  parking: number
  yearBuilt: number
  livingUnits: number
  lat: number
  lng: number
  // Water setback fields (CP5)
  waterBody?: string          // e.g. "Indian River Lagoon", "canal", "ocean"
  waterBodyType?: string      // seawall | canal | ocean | river | lagoon
  waterDistanceFt?: number    // distance from parcel boundary to water body
  setbackWater?: number       // required setback distance in feet
  setbackWaterfrontType?: string // regulation type: seawall | canal | ocean/river
  waterSetbackSource?: string // e.g. "Satellite Beach LDC §22-87"
}

// Lodging/STR permission types (CP5)
export type LodgingPermitStatus = 'permitted' | 'conditional' | 'not_permitted' | 'unknown'

export interface LodgingPermissions {
  hotel: LodgingPermitStatus
  motel: LodgingPermitStatus
  vacation_rental: LodgingPermitStatus
  str: LodgingPermitStatus       // short-term rental (Airbnb-style, <30 days)
  bnb: LodgingPermitStatus       // bed and breakfast
  notes?: string
  ordinanceRef?: string
}

export interface NearbyLodgingParcel {
  address: string
  zone: string
  distanceMi: number
  type: string   // e.g. "hotel", "vacation rental"
  units?: number
}

// Market demographics (CP5)
export interface MarketDemographics {
  zip: string
  medianHHIncome: number
  medianHHIncomeYoY?: number      // % change YoY
  population: number
  populationGrowthPct?: number    // % change
  vacancyRate: number             // % vacant housing units
  medianHomeValue: number
  medianHomeValueYoY?: number     // % change YoY
  ownerOccupiedPct: number        // % owner-occupied
  renterOccupiedPct: number       // % renter-occupied
  dataYear?: number               // e.g. 2024
  dataSource?: string             // e.g. "Census ACS 5-Year 2024"
}

export interface MarketScore {
  total: number    // 1–10
  incomeScore: number
  vacancyScore: number
  growthScore: number
  appreciationScore: number
  breakdown: string
}

export interface ZoningControl {
  control: string
  value: string
  assumption: string
  citation: string
}

export interface RentComp {
  name: string
  addr: string
  units: number
  year: number
  occ: number
  studio?: number
  one?: number
  two?: number
  three?: number
}

export interface UnitRent {
  type: string
  rent: number
  sf: number
  psf: number
}

export interface UnitMix {
  type: string
  pct: number
  sf: number
  rent: number
}

export interface UnitMixWithCount extends UnitMix {
  count: number
}

export interface ProFormaInputs {
  totalUnits: number
  vacancyPct: number
  opexPct: number
  capRatePct: number
  constructionPSF: number
  softCostPct: number
}

export interface ProFormaOutputs {
  gpr: number
  egi: number
  opexAmt: number
  noi: number
  stabilizedValue: number
  hardCost: number
  softCost: number
  totalDevCost: number
  profit: number
  margin: number
  yieldOnCost: number
  devSpread: number
  totalGSF: number
  adjustedUnits: number
}

export type FeasibilityTab = 'Site' | 'Market' | 'Lodging' | 'Comps' | 'Capacity' | 'Develop' | 'Generate'
export type SiteSubTab = 'Summary' | 'Zoning' | 'Map View'
export type CompsView = 'Map' | 'Table' | 'Charts'
