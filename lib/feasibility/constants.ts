// ZoneWise.AI — Feasibility Platform Design Constants

/** Brand color tokens — keep in sync with tailwind.config.ts */
export const COLORS = {
  brand: '#0D9488',
  brandDark: '#0F766E',
  brandLight: '#CCFBF1',
  accent: '#F59E0B',
  navy: '#0F172A',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  success: '#059669',
  danger: '#DC2626',
  info: '#2563EB',
} as const

/** Format integer with commas */
export function fmt(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

/** Format as USD currency (no decimals) */
export function fmtD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

/** Mapbox access token — loaded from env in production */
export function getMapboxToken(): string {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
}

/** Default map settings */
export const MAP_DEFAULTS = {
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  zoom: 16,
  pitch: 45,
  bearing: -17.6,
} as const
