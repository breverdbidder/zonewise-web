// ZoneWise.AI — Brevard County Explorer Constants
// Explorer V2: choropleth metrics, zoning filters, Brevard ZIPs

export const BCPAO_BASE = 'https://gis.brevardfl.gov/gissrv/rest/services'

export const ENDPOINTS = {
  parcelExport: `${BCPAO_BASE}/Base_Map/Parcel_New_WKID102100/MapServer/export`,
  zoningExport: `${BCPAO_BASE}/Planning_Development/Zoning_WKID2881/MapServer/export`,
  fluExport: `${BCPAO_BASE}/Planning_Development/FLU_WKID2881/MapServer/export`,
  parcelIdentify: `${BCPAO_BASE}/Base_Map/Parcel_New_WKID102100/MapServer/identify`,
} as const

export const BREVARD_BOUNDS: [[number, number], [number, number]] = [
  [-81.15, 27.82],
  [-80.40, 28.77],
]

export const BREVARD_CENTER: [number, number] = [-80.72, 28.30]

// Default map view. Miami-Dade, not Brevard: Brevard is where the product
// started, and opening there read as a Brevard tool to everyone else. Miami-Dade
// is chosen on evidence, not brand — it is our LARGEST fully-mapped county
// (579,043 parcels, 578,936 with geometry = 100%), so first paint is a dense,
// working map rather than a sparse one. Counties like Pinellas (0% geometry) and
// Broward (30%) would open near-empty and must never be the default.
// Verified against mv_county_parcel_stats on 2026-08-17.
export const MIAMI_DADE_BOUNDS: [[number, number], [number, number]] = [
  [-80.87, 25.13],
  [-80.11, 25.98],
]

export const MIAMI_DADE_CENTER: [number, number] = [-80.30, 25.72]

// Statewide pan limit. The map previously used maxBounds [[-81.5,27.5],[-80.0,29.0]]
// — a Brevard-sized box that made every other county physically unreachable by
// panning, whatever the default center said. Florida plus a small margin.
export const FLORIDA_BOUNDS: [[number, number], [number, number]] = [
  [-88.0, 24.2],
  [-79.7, 31.2],
]

export const DEFAULT_MAP_BOUNDS = MIAMI_DADE_BOUNDS
export const DEFAULT_MAP_CENTER = MIAMI_DADE_CENTER

export const ZONING_COLORS: Record<string, string> = {
  RU: '#22C55E', BU: '#3B82F6', TU: '#8B5CF6', IU: '#EF4444',
  PUD: '#F59E0B', AU: '#A3E635', PA: '#06B6D4', GML: '#FB923C',
  ARR: '#84CC16', SP: '#F472B6',
}

export const ZONING_LABELS: Record<string, string> = {
  RU: 'Residential', BU: 'Business', TU: 'Tourist', IU: 'Industrial',
  PUD: 'Planned Unit Dev', AU: 'Agriculture', PA: 'Public/Semi-Public',
  GML: 'Govt Managed Lands', ARR: 'Agri Residential', SP: 'Special',
}

export function getZoningColor(code: string): string {
  const prefix = Object.keys(ZONING_COLORS).find(k => code?.startsWith(k))
  return prefix ? ZONING_COLORS[prefix] : '#94A3B8'
}

export function toWebMercator(lat: number, lng: number) {
  const x = (lng * 20037508.34) / 180
  const yRad = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)
  return { x, y: (yRad * 20037508.34) / 180 }
}

export interface ParcelAttributes {
  PARCEL_ID: string
  PROPERTY_ID: string
  STREET_NUMBER: string
  STREET_DIRECTION_PREFIX: string
  STREET_NAME: string
  STREET_TYPE: string
  CITY: string
  ZIP_CODE: string
  OWNER_NAME1: string
  OWNER_NAME2: string
  BLDG_VALUE: string
  LAND_VALUE: string
  HOMESTEAD_VALUE: string
  LIV_AREA: string
  ACRES: string
  USE_CODE_DESCRIPTION: string
  SUBDIVISION_NAME: string
  MILLAGE_CODE: string
}

export function formatAddress(a: ParcelAttributes): string {
  return [a.STREET_NUMBER, a.STREET_DIRECTION_PREFIX, a.STREET_NAME, a.STREET_TYPE]
    .filter(Boolean).join(' ').trim()
}

export function formatCurrency(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

// ── Explorer V2 additions ─────────────────────────────────────────────────────

export const BREVARD_ZIPS = [
  '32754', '32780', '32796', '32901', '32903', '32904', '32905', '32907',
  '32908', '32909', '32920', '32922', '32925', '32926', '32927', '32931',
  '32934', '32935', '32937', '32940', '32949', '32950', '32951', '32952',
  '32953', '32955', '32976',
] as const

export type BrevardZip = typeof BREVARD_ZIPS[number]

export const CHOROPLETH_METRICS = [
  { value: 'zhvi', label: 'Median Home Value' },
  { value: 'zori', label: 'Median Rent' },
  { value: 'yoy',  label: 'YoY Change %' },
] as const

export type ChoroplethMetric = typeof CHOROPLETH_METRICS[number]['value']

export const ZONING_FILTERS = [
  { value: 'all',  label: 'All Zones' },
  { value: 'RU',   label: 'Residential (RU)' },
  { value: 'BU',   label: 'Business (BU)' },
  { value: 'PUD',  label: 'Planned Unit (PUD)' },
  { value: 'AU',   label: 'Agriculture (AU)' },
  { value: 'IU',   label: 'Industrial (IU)' },
  { value: 'TU',   label: 'Tourist (TU)' },
] as const

export type ZoningFilter = typeof ZONING_FILTERS[number]['value']

// Blue → green → yellow/orange → red
export const CHOROPLETH_COLOR_STOPS: [number, string][] = [
  [0,       '#2563EB'],
  [180000,  '#22C55E'],
  [280000,  '#EAB308'],
  [380000,  '#F97316'],
  [500000,  '#EF4444'],
  [700000,  '#DC2626'],
]

// Free tier limits
export const FREE_PARCEL_CLICKS  = 5
export const FREE_CHAT_MESSAGES  = 3

export const EXPLORER_CHIPS = [
  { icon: '🏠', text: 'What is the zoning at 798 Ocean Dr, Satellite Beach?' },
  { icon: '📍', text: 'Show me RU-1 residential parcels in Merritt Island' },
  { icon: '🔥', text: 'Show median home values heatmap by ZIP code' },
  { icon: '📐', text: "What's the max lot coverage in an RU-1-11 zone?" },
  { icon: '💰', text: 'Best ZIP codes for investment in Florida' },
  { icon: '🏗️', text: 'Where can I build multi-family in Palm Bay?' },
] as const
