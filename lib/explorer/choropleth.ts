// lib/explorer/choropleth.ts
// Choropleth utilities: YoY color scale (red → yellow → green), metric formatters

export type YoyTier = 'falling' | 'flat' | 'rising' | 'hot'

/** Classify YoY change into a color tier */
export function classifyYoy(yoy: number): YoyTier {
  if (yoy < -0.03) return 'falling'
  if (yoy < 0.01)  return 'flat'
  if (yoy < 0.06)  return 'rising'
  return 'hot'
}

/** CSS color for a YoY value (red → yellow → green) */
export function yoyToColor(yoy: number): string {
  if (yoy <= -0.05) return '#EF4444'  // deep red
  if (yoy <= -0.02) return '#F97316'  // orange-red
  if (yoy <= 0.01)  return '#EAB308'  // yellow
  if (yoy <= 0.04)  return '#84CC16'  // lime
  if (yoy <= 0.07)  return '#22C55E'  // green
  return '#16A34A'                    // deep green
}

/** Mapbox expression stops for YoY color scale */
export const YOY_COLOR_STOPS: [number, string][] = [
  [-0.05, '#EF4444'],
  [-0.02, '#F97316'],
  [0.01,  '#EAB308'],
  [0.04,  '#84CC16'],
  [0.07,  '#22C55E'],
  [0.12,  '#16A34A'],
]

/** Mapbox expression stops for ZHVI (home value) color scale */
export const ZHVI_COLOR_STOPS: [number, string][] = [
  [150000, '#2563EB'],
  [230000, '#22C55E'],
  [310000, '#EAB308'],
  [400000, '#F97316'],
  [500000, '#EF4444'],
  [700000, '#DC2626'],
]

/** Mapbox expression stops for ZORI (rent) color scale */
export const ZORI_COLOR_STOPS: [number, string][] = [
  [1000,  '#2563EB'],
  [1600,  '#22C55E'],
  [2000,  '#EAB308'],
  [2400,  '#F97316'],
  [3000,  '#EF4444'],
  [4000,  '#DC2626'],
]

/** Format ZORI value: $1,820/mo */
export function formatZori(value: number): string {
  if (!value || isNaN(value)) return '—'
  return `$${Math.round(value).toLocaleString()}/mo`
}

/** Legend entries for each metric */
export const CHOROPLETH_LEGENDS = {
  zhvi: [
    { label: '<$230K', color: '#2563EB' },
    { label: '$230K–$310K', color: '#22C55E' },
    { label: '$310K–$400K', color: '#EAB308' },
    { label: '$400K–$500K', color: '#F97316' },
    { label: '>$500K', color: '#EF4444' },
  ],
  zori: [
    { label: '<$1.6K/mo', color: '#2563EB' },
    { label: '$1.6K–$2K', color: '#22C55E' },
    { label: '$2K–$2.4K', color: '#EAB308' },
    { label: '$2.4K–$3K', color: '#F97316' },
    { label: '>$3K/mo', color: '#EF4444' },
  ],
  yoy: [
    { label: 'Falling >3%', color: '#EF4444' },
    { label: 'Flat ±1%', color: '#EAB308' },
    { label: 'Rising 1–4%', color: '#84CC16' },
    { label: 'Rising 4–7%', color: '#22C55E' },
    { label: 'Hot >7%', color: '#16A34A' },
  ],
} as const

export type ChoroplethMetricKey = keyof typeof CHOROPLETH_LEGENDS
