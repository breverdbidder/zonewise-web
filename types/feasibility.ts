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

export type FeasibilityTab = 'Site' | 'Market' | 'Comps' | 'Capacity' | 'Develop' | 'Export'
export type SiteSubTab = 'Summary' | 'Zoning' | 'Map View'
export type CompsView = 'Map' | 'Table' | 'Charts'
