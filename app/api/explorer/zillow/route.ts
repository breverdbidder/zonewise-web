// app/api/explorer/zillow/route.ts
// Returns Zillow ZHVI metrics merged with Census ZCTA GeoJSON for Brevard County
// Cached 24h (Next.js fetch cache). Falls back to static data if upstream fails.

import { NextResponse } from 'next/server'
import { BREVARD_ZIPS } from '@/lib/explorer/constants'
import {
  BREVARD_FALLBACK_METRICS,
  type ZipMetrics,
  type ChoroplethGeoJSON,
  formatZhvi,
  formatYoy,
} from '@/lib/explorer/zillow'

const ZHVI_URL =
  'https://files.zillowstatic.com/research/public_csvs/zhvi/' +
  'Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv'

const CENSUS_URL =
  'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/' +
  'PUMA_TAD_TAZ_UGA_ZCTA/MapServer/2/query'

// Simple in-process cache (survives reuse of Lambda containers)
let _cache: { data: ChoroplethGeoJSON; ts: number } | null = null
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

export async function GET() {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return NextResponse.json(_cache.data)
  }

  const metrics = await fetchZillowMetrics()
  const geojson = await buildGeoJSON(metrics)

  _cache = { data: geojson, ts: Date.now() }
  return NextResponse.json(geojson, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  })
}

// ── Zillow CSV fetch + parse ──────────────────────────────────────────────────

async function fetchZillowMetrics(): Promise<ZipMetrics[]> {
  try {
    const res = await fetch(ZHVI_URL, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`Zillow HTTP ${res.status}`)
    const csv = await res.text()
    return parseZhviCsv(csv)
  } catch {
    // Fallback to hardcoded data
    return BREVARD_FALLBACK_METRICS
  }
}

function parseZhviCsv(csv: string): ZipMetrics[] {
  const lines = csv.split('\n')
  const headers = lines[0].split(',')
  const zipIdx = headers.indexOf('RegionName')
  if (zipIdx < 0) return BREVARD_FALLBACK_METRICS

  // Find last two date columns for YoY calc
  const dateCols = headers.reduce<number[]>((acc, h, i) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(h.trim())) acc.push(i)
    return acc
  }, [])
  const latestIdx = dateCols[dateCols.length - 1]
  const yearAgoIdx = dateCols[dateCols.length - 13] ?? dateCols[0]

  const brevardSet = new Set(BREVARD_ZIPS as readonly string[])
  const result: ZipMetrics[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const zip = cols[zipIdx]?.trim()
    if (!brevardSet.has(zip)) continue

    const latest = parseFloat(cols[latestIdx])
    const yearAgo = parseFloat(cols[yearAgoIdx])
    if (isNaN(latest)) continue

    result.push({
      zip,
      zhvi: Math.round(latest),
      zori: Math.round(latest * 0.006), // rough rent estimate if ZORI not fetched
      yoy: yearAgo > 0 ? (latest - yearAgo) / yearAgo : 0,
    })
  }

  // Fill in any missing ZIPs with fallback
  const found = new Set(result.map(m => m.zip))
  for (const fb of BREVARD_FALLBACK_METRICS) {
    if (!found.has(fb.zip)) result.push(fb)
  }

  return result
}

// ── Census ZCTA boundary fetch ────────────────────────────────────────────────

async function fetchZctaBoundaries(): Promise<Map<string, object>> {
  const zipList = BREVARD_ZIPS.map(z => `'${z}'`).join(',')
  const params = new URLSearchParams({
    where: `ZCTA5 IN (${zipList})`,
    outFields: 'ZCTA5',
    outSR: '4326',
    f: 'geojson',
    returnGeometry: 'true',
    geometryPrecision: '4',
  })

  try {
    const res = await fetch(`${CENSUS_URL}?${params}`, {
      next: { revalidate: 604800 }, // 1 week — boundaries never change
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`Census HTTP ${res.status}`)
    const fc = await res.json() as { features?: Array<{ properties: { ZCTA5: string }; geometry: object }> }
    const map = new Map<string, object>()
    for (const f of fc.features ?? []) {
      map.set(f.properties.ZCTA5, f.geometry)
    }
    return map
  } catch {
    return new Map()
  }
}

// ── Build merged GeoJSON ──────────────────────────────────────────────────────

async function buildGeoJSON(metrics: ZipMetrics[]): Promise<ChoroplethGeoJSON> {
  const boundaries = await fetchZctaBoundaries()
  const metricMap = new Map(metrics.map(m => [m.zip, m]))

  // If Census boundaries returned, build proper polygon features
  if (boundaries.size > 0) {
    const features = Array.from(boundaries.entries()).map(([zip, geometry]) => {
      const m = metricMap.get(zip) ?? { zip, zhvi: 0, zori: 0, yoy: 0 }
      return {
        type: 'Feature' as const,
        geometry: geometry as GeoJSON.Polygon,
        properties: {
          zip,
          zhvi: m.zhvi,
          zori: m.zori,
          yoy: m.yoy,
          label: `${zip} · ${formatZhvi(m.zhvi)}`,
        },
      }
    })
    return { type: 'FeatureCollection', features }
  }

  // Fallback: point features at ZIP centroids (rendered as circles)
  const centroids = getZipCentroids()
  const features = metrics.map(m => {
    const [lng, lat] = centroids[m.zip] ?? [-80.72, 28.30]
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [lng, lat],
      } as unknown as GeoJSON.Polygon,
      properties: {
        zip: m.zip,
        zhvi: m.zhvi,
        zori: m.zori,
        yoy: m.yoy,
        label: `${m.zip} · ${formatZhvi(m.zhvi)} | ${formatYoy(m.yoy)} YoY`,
      },
    }
  })
  return { type: 'FeatureCollection', features }
}

// Approximate centroids for Brevard ZIPs (fallback only)
function getZipCentroids(): Record<string, [number, number]> {
  return {
    '32754': [-80.64, 28.67], '32780': [-80.82, 28.61], '32796': [-80.79, 28.71],
    '32901': [-80.63, 28.08], '32903': [-80.56, 28.09], '32904': [-80.71, 28.06],
    '32905': [-80.67, 28.02], '32907': [-80.69, 27.99], '32908': [-80.71, 27.94],
    '32909': [-80.65, 27.91], '32920': [-80.61, 28.46], '32922': [-80.74, 28.36],
    '32925': [-80.60, 28.23], '32926': [-80.75, 28.39], '32927': [-80.71, 28.44],
    '32931': [-80.60, 28.32], '32934': [-80.66, 28.14], '32935': [-80.62, 28.13],
    '32937': [-80.59, 28.18], '32940': [-80.73, 28.25], '32949': [-80.63, 27.88],
    '32950': [-80.62, 27.87], '32951': [-80.56, 28.07], '32952': [-80.69, 28.37],
    '32953': [-80.69, 28.46], '32955': [-80.73, 28.32], '32976': [-80.65, 27.85],
  }
}
