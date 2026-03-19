// ZoneWise.AI — Zillow data types + Brevard fallback values
// Real data fetched server-side in /api/explorer/zillow

export interface ZipMetrics {
  zip: string
  zhvi: number   // median home value ($)
  zori: number   // median rent ($/mo)
  yoy: number    // year-over-year change (decimal, e.g. 0.052 = 5.2%)
}

export interface ChoroplethGeoJSON {
  type: 'FeatureCollection'
  features: ChoroplethFeature[]
}

export interface ChoroplethFeature {
  type: 'Feature'
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
  properties: {
    zip: string
    zhvi: number
    zori: number
    yoy: number
    label: string // "32901 · $290K"
  }
}

// Fallback: approximate 2024 median home values for Brevard County ZIPs
// Used when Census/Zillow APIs are unavailable
export const BREVARD_FALLBACK_METRICS: ZipMetrics[] = [
  { zip: '32754', zhvi: 248000, zori: 1650, yoy: 0.042 }, // Mims
  { zip: '32780', zhvi: 232000, zori: 1580, yoy: 0.038 }, // Titusville
  { zip: '32796', zhvi: 278000, zori: 1720, yoy: 0.045 }, // Titusville N
  { zip: '32901', zhvi: 291000, zori: 1820, yoy: 0.051 }, // Melbourne
  { zip: '32903', zhvi: 392000, zori: 2380, yoy: 0.063 }, // Indialantic
  { zip: '32904', zhvi: 341000, zori: 2050, yoy: 0.057 }, // Melbourne W
  { zip: '32905', zhvi: 248000, zori: 1640, yoy: 0.039 }, // Palm Bay N
  { zip: '32907', zhvi: 268000, zori: 1720, yoy: 0.044 }, // Palm Bay
  { zip: '32908', zhvi: 281000, zori: 1780, yoy: 0.046 }, // Palm Bay S
  { zip: '32909', zhvi: 293000, zori: 1830, yoy: 0.049 }, // Palm Bay SE
  { zip: '32920', zhvi: 332000, zori: 2100, yoy: 0.055 }, // Cape Canaveral
  { zip: '32922', zhvi: 241000, zori: 1620, yoy: 0.036 }, // Cocoa
  { zip: '32925', zhvi: 292000, zori: 1840, yoy: 0.050 }, // Patrick SFB
  { zip: '32926', zhvi: 259000, zori: 1680, yoy: 0.041 }, // Cocoa
  { zip: '32927', zhvi: 271000, zori: 1730, yoy: 0.043 }, // Cocoa
  { zip: '32931', zhvi: 421000, zori: 2560, yoy: 0.067 }, // Cocoa Beach
  { zip: '32934', zhvi: 372000, zori: 2210, yoy: 0.059 }, // Melbourne
  { zip: '32935', zhvi: 281000, zori: 1790, yoy: 0.047 }, // Melbourne
  { zip: '32937', zhvi: 361000, zori: 2180, yoy: 0.058 }, // Satellite Beach
  { zip: '32940', zhvi: 424000, zori: 2590, yoy: 0.068 }, // Viera
  { zip: '32949', zhvi: 283000, zori: 1800, yoy: 0.046 }, // Palm Bay S
  { zip: '32950', zhvi: 332000, zori: 2080, yoy: 0.053 }, // Malabar
  { zip: '32951', zhvi: 481000, zori: 2860, yoy: 0.071 }, // Melbourne Beach
  { zip: '32952', zhvi: 352000, zori: 2130, yoy: 0.056 }, // Merritt Island
  { zip: '32953', zhvi: 374000, zori: 2240, yoy: 0.060 }, // Merritt Island N
  { zip: '32955', zhvi: 341000, zori: 2060, yoy: 0.054 }, // Rockledge
  { zip: '32976', zhvi: 281000, zori: 1790, yoy: 0.046 }, // S Brevard
]

export function formatZhvi(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

export function formatYoy(value: number): string {
  const pct = (value * 100).toFixed(1)
  return value >= 0 ? `+${pct}%` : `${pct}%`
}
