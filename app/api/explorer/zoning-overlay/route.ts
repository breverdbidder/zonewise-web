import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Zone category prefix → color (matches ZONING_COLORS in lib/explorer/constants.ts)
const ZONE_CATEGORY_MAP: Record<string, string> = {
  RU: '#22C55E',
  BU: '#3B82F6',
  TU: '#8B5CF6',
  IU: '#EF4444',
  PU: '#F59E0B', // PUD prefix
  AU: '#A3E635',
  PA: '#06B6D4',
  GM: '#FB923C', // GML prefix
  AR: '#84CC16', // ARR prefix
  SP: '#F472B6',
}

function zoneCategory(code: string): string {
  const upper = (code ?? '').toUpperCase().trim()
  for (const prefix of Object.keys(ZONE_CATEGORY_MAP)) {
    if (upper.startsWith(prefix)) return prefix
  }
  return 'OTHER'
}

function zoneColor(category: string): string {
  return ZONE_CATEGORY_MAP[category] ?? '#94A3B8'
}

const BCPAO_ZONING_QUERY =
  'https://gis.brevardfl.gov/gissrv/rest/services/Planning_Development/Zoning_WKID2881/MapServer/0/query'

/**
 * GET /api/explorer/zoning-overlay?west&south&east&north
 *
 * Fetches zoning polygons from BCPAO ArcGIS Feature Service for the given
 * bounding box, adds zone_category + color properties for data-driven Mapbox
 * styling, and returns a GeoJSON FeatureCollection.
 *
 * Used by ExplorerMap.tsx to render the Supabase-colored zoning overlay.
 * Performance: BCPAO limits to ~1000 features; only loaded at zoom ≥ 13.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const west  = parseFloat(sp.get('west')  ?? '')
  const south = parseFloat(sp.get('south') ?? '')
  const east  = parseFloat(sp.get('east')  ?? '')
  const north = parseFloat(sp.get('north') ?? '')

  if ([west, south, east, north].some(isNaN)) {
    return NextResponse.json({ error: 'west, south, east, north required' }, { status: 400 })
  }

  // Clamp to Brevard County bounds to avoid runaway queries
  const clampedWest  = Math.max(west,  -81.5)
  const clampedSouth = Math.max(south, 27.5)
  const clampedEast  = Math.min(east,  -80.0)
  const clampedNorth = Math.min(north, 29.0)

  const geom = JSON.stringify({
    xmin: clampedWest,
    ymin: clampedSouth,
    xmax: clampedEast,
    ymax: clampedNorth,
    spatialReference: { wkid: 4326 },
  })

  const params = new URLSearchParams({
    geometry: geom,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'ZONING,JURISDICTION',
    outSR: '4326',
    returnGeometry: 'true',
    f: 'geojson',
    resultRecordCount: '1000',
  })

  try {
    const res = await fetch(`${BCPAO_ZONING_QUERY}?${params}`, {
      headers: { 'User-Agent': 'ZoneWise.AI/2.0' },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 300 }, // 5-min edge cache
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'BCPAO fetch failed', status: res.status }, { status: 502 })
    }

    const geojson = await res.json()

    // Enrich each feature with zone_category + color for data-driven Mapbox styling
    if (geojson?.features) {
      geojson.features = geojson.features.map((f: GeoJSON.Feature) => {
        const code = (f.properties as { ZONING?: string })?.ZONING ?? ''
        const cat = zoneCategory(code)
        return {
          ...f,
          properties: {
            ...f.properties,
            zone_category: cat,
            zone_color: zoneColor(cat),
          },
        }
      })
    }

    return NextResponse.json(geojson, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('[zoning-overlay] bbox query error:', err)
    // Return empty GeoJSON so the map layer renders cleanly without crashing
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      { status: 200 }
    )
  }
}
