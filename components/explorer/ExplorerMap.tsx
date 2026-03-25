'use client'

import {
  useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle,
} from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getMapboxToken } from '@/lib/feasibility/constants'
import {
  ENDPOINTS, BREVARD_BOUNDS, BREVARD_CENTER, ZONING_LABELS,
  type ParcelAttributes, formatAddress, formatCurrency, getZoningColor,
  CHOROPLETH_COLOR_STOPS, type ChoroplethMetric, type ZoningFilter,
} from '@/lib/explorer/constants'
import type { ChoroplethGeoJSON } from '@/lib/explorer/zillow'

export interface ExplorerMapHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void
  highlightParcel: (parcelId: string) => void
  filterZoning: (prefix: ZoningFilter) => void
  toggleLayer: (id: string, on: boolean) => void
  setChoroplethMetric: (metric: ChoroplethMetric) => void
  setZoningOverlay: (visible: boolean) => void
}

interface Props {
  mapStyle?: string
  onParcelClick?: (parcel: ParcelAttributes, lngLat: [number, number]) => void
  choroplethData?: ChoroplethGeoJSON | null
  choroplethMetric?: ChoroplethMetric
  choroplethVisible?: boolean
  zoningFilter?: ZoningFilter
  zoningOverlayVisible?: boolean
}

const ExplorerMap = forwardRef<ExplorerMapHandle, Props>(function ExplorerMap(
  {
    onParcelClick,
    choroplethData,
    choroplethMetric = 'zhvi',
    choroplethVisible = true,
    zoningFilter = 'all',
    zoningOverlayVisible = false,
    mapStyle = 'streets-v12',
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const zoningFilterRef = useRef(zoningFilter)
  const choroplethMetricRef = useRef(choroplethMetric)
  const zoningOverlayVisibleRef = useRef(zoningOverlayVisible)
  const overlayFetchControllerRef = useRef<AbortController | null>(null)

  // ── Imperative handle ───────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    flyTo(lat, lng, zoom = 15) {
      mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1500 })
    },
    highlightParcel(_parcelId) {
      // Future: highlight via feature state when vector parcels added
    },
    filterZoning(prefix) {
      zoningFilterRef.current = prefix
      applyZoningFilter(mapRef.current, prefix)
    },
    toggleLayer(id, on) {
      const map = mapRef.current
      if (!map) return
      try { map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none') } catch {}
    },
    setChoroplethMetric(metric) {
      choroplethMetricRef.current = metric
      applyChoroplethPaint(mapRef.current, metric)
    },
    setZoningOverlay(visible) {
      zoningOverlayVisibleRef.current = visible
      const map = mapRef.current
      if (!map) return
      const vis = visible ? 'visible' : 'none'
      try {
        map.setLayoutProperty('zoning-overlay-fill', 'visibility', vis)
        map.setLayoutProperty('zoning-overlay-line', 'visibility', vis)
      } catch {}
      if (visible) fetchOverlayForCurrentBounds(map)
    },
  }))

  // ── Map init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const token = getMapboxToken()
    if (!token) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: BREVARD_CENTER,
      zoom: 10,
      minZoom: 9,
      maxZoom: 19,
      maxBounds: [[-81.5, 27.5], [-80.0, 29.0]] as mapboxgl.LngLatBoundsLike,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

    map.on('load', () => {
      // ── BCPAO raster sources ──────────────────────────────────────────────
      addArcGISSource(map, 'bcpao-parcels', ENDPOINTS.parcelExport)
      addArcGISSource(map, 'bcpao-zoning', ENDPOINTS.zoningExport)
      addArcGISSource(map, 'bcpao-flu', ENDPOINTS.fluExport)

      map.addLayer({
        id: 'parcels-layer', type: 'raster', source: 'bcpao-parcels',
        paint: { 'raster-opacity': 0.8 }, layout: { visibility: 'none' },
      })
      map.addLayer({
        id: 'zoning-layer', type: 'raster', source: 'bcpao-zoning',
        paint: { 'raster-opacity': 0.15 }, layout: { visibility: 'none' },
      })
      map.addLayer({
        id: 'flu-layer', type: 'raster', source: 'bcpao-flu',
        paint: { 'raster-opacity': 0.5 }, layout: { visibility: 'none' },
      })

      // ── Choropleth source (GeoJSON, populated by effect below) ────────────
      map.addSource('choropleth-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      // Check if boundaries are polygon or point
      map.addLayer({
        id: 'choropleth-fill',
        type: 'fill',
        source: 'choropleth-src',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: buildFillPaint('zhvi'),
        layout: { visibility: choroplethVisible ? 'visible' : 'none' },
      })
      map.addLayer({
        id: 'choropleth-fill-multi',
        type: 'fill',
        source: 'choropleth-src',
        filter: ['==', ['geometry-type'], 'MultiPolygon'],
        paint: buildFillPaint('zhvi'),
        layout: { visibility: choroplethVisible ? 'visible' : 'none' },
      })
      // Circle fallback for point-based choropleth
      map.addLayer({
        id: 'choropleth-circle',
        type: 'circle',
        source: 'choropleth-src',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 14, 12, 28],
          'circle-color': buildColorExpr('zhvi'),
          'circle-opacity': 0.7,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
        },
        layout: { visibility: choroplethVisible ? 'visible' : 'none' },
      })
      // ZIP label
      map.addLayer({
        id: 'choropleth-label',
        type: 'symbol',
        source: 'choropleth-src',
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 11,
          'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
          visibility: 'none', // shown at zoom 10-12 only
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0,0,0,0.6)',
          'text-halo-width': 1,
        },
      })

      // ── 3D buildings ──────────────────────────────────────────────────────
      const bldgLayers = map.getStyle().layers
      const labelLayer = bldgLayers?.find((l: mapboxgl.AnyLayer) => l.type === 'symbol' && (l as mapboxgl.SymbolLayer).layout?.['text-field'])
      if (labelLayer) {
        map.addLayer({
          id: 'zw-3d-buildings', source: 'composite', 'source-layer': 'building',
          filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 14,
          paint: {
            'fill-extrusion-color': '#d4d4d8',
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']],
            'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']],
            'fill-extrusion-opacity': 0.5,
          },
        }, labelLayer.id)
      }

      // ── Supabase-colored Zoning Overlay (GeoJSON fill layer) ─────────────
      map.addSource('zoning-overlay-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      // Data-driven fill: each feature carries zone_color property from API
      map.addLayer({
        id: 'zoning-overlay-fill',
        type: 'fill',
        source: 'zoning-overlay-src',
        paint: {
          'fill-color': ['coalesce', ['get', 'zone_color'], '#94A3B8'],
          'fill-opacity': 0.35,
        },
        layout: { visibility: 'none' },
      })
      map.addLayer({
        id: 'zoning-overlay-line',
        type: 'line',
        source: 'zoning-overlay-src',
        paint: {
          'line-color': ['coalesce', ['get', 'zone_color'], '#94A3B8'],
          'line-opacity': 0.6,
          'line-width': 0.8,
        },
        layout: { visibility: 'none' },
      })

      // Fetch on moveend when overlay is active (debounced via AbortController)
      const onMoveEnd = () => {
        if (zoningOverlayVisibleRef.current && map.getZoom() >= 13) {
          fetchOverlayForCurrentBounds(map)
        }
      }
      map.on('moveend', onMoveEnd)

      // ── Zoom-adaptive opacity ─────────────────────────────────────────────
      const applyZoomOpacity = () => {
        const z = map.getZoom()
        const choroplethOpacity = z < 12 ? 0.65 : z < 14 ? 0.3 : 0.1
        const zoningVisible = z >= 12
        const zoningOpacity = z < 13 ? 0.15 : z < 15 ? 0.35 : 0.55
        const parcelsVisible = z >= 14
        const labelVisible = z >= 10 && z <= 12

        try {
          map.setPaintProperty('choropleth-fill', 'fill-opacity', choroplethOpacity)
          map.setPaintProperty('choropleth-fill-multi', 'fill-opacity', choroplethOpacity)
          map.setPaintProperty('choropleth-circle', 'circle-opacity', choroplethOpacity)
          map.setLayoutProperty('zoning-layer', 'visibility', zoningVisible ? 'visible' : 'none')
          map.setPaintProperty('zoning-layer', 'raster-opacity', zoningOpacity)
          map.setLayoutProperty('parcels-layer', 'visibility', parcelsVisible ? 'visible' : 'none')
          map.setLayoutProperty('choropleth-label', 'visibility', labelVisible ? 'visible' : 'none')
          if (map.getLayer('zw-3d-buildings'))
            map.setLayoutProperty('zw-3d-buildings', 'visibility', z >= 14 ? 'visible' : 'none')
        } catch {}
      }
      map.on('zoom', applyZoomOpacity)
      applyZoomOpacity()

      // ── Style reload ──────────────────────────────────────────────────────
      map.on('style.load', () => {
        if (!map.getSource('bcpao-parcels')) {
          addArcGISSource(map, 'bcpao-parcels', ENDPOINTS.parcelExport)
          addArcGISSource(map, 'bcpao-zoning', ENDPOINTS.zoningExport)
          addArcGISSource(map, 'bcpao-flu', ENDPOINTS.fluExport)
          map.addLayer({ id: 'parcels-layer', type: 'raster', source: 'bcpao-parcels', paint: { 'raster-opacity': 0.8 }, layout: { visibility: 'none' } })
          map.addLayer({ id: 'zoning-layer', type: 'raster', source: 'bcpao-zoning', paint: { 'raster-opacity': 0.35 }, layout: { visibility: 'none' } })
          map.addLayer({ id: 'flu-layer', type: 'raster', source: 'bcpao-flu', paint: { 'raster-opacity': 0.5 }, layout: { visibility: 'none' } })
        }
      })

      // ── Choropleth popup ──────────────────────────────────────────────────
      const choroplethPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
      map.on('mousemove', ['choropleth-fill', 'choropleth-fill-multi', 'choropleth-circle'], (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const f = e.features?.[0]
        if (!f) return
        const p = f.properties as { zip: string; label: string }
        choroplethPopup
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:system-ui;font-size:13px;color:#fff;padding:4px 2px"><b>${p.zip}</b><br/>${p.label ?? ''}</div>`)
          .addTo(map)
      })
      map.on('mouseleave', ['choropleth-fill', 'choropleth-fill-multi', 'choropleth-circle'], () => {
        map.getCanvas().style.cursor = ''
        choroplethPopup.remove()
      })

      setMapReady(true)
    })

    // ── Parcel click identify ───────────────────────────────────────────────
    map.on('click', async (e) => {
      const z = map.getZoom()
      if (z < 13) return // don't identify at county zoom

      const { lng, lat } = e.lngLat
      const bounds = map.getBounds()
      const canvas = map.getCanvas()
      if (!bounds) return

      const url =
        `${ENDPOINTS.parcelIdentify}?geometry=${lng},${lat}` +
        `&geometryType=esriGeometryPoint&sr=4326&layers=all:5&tolerance=4` +
        `&mapExtent=${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}` +
        `&imageDisplay=${canvas.width},${canvas.height},96&returnGeometry=false&f=json`

      setLoading(true)
      try {
        const res = await fetch(url)
        const data = await res.json()
        if (data.results?.length) {
          const attrs = data.results[0].attributes as ParcelAttributes
          onParcelClick?.(attrs, [lng, lat])
          // Popup removed — sidebar panel shows full detail
        }
      } catch {}
      setLoading(false)
    })

    map.on('mouseenter', 'parcels-layer', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'parcels-layer', () => { map.getCanvas().style.cursor = '' })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Update choropleth data ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !choroplethData) return
    try {
      const src = map.getSource('choropleth-src') as mapboxgl.GeoJSONSource | undefined
      if (src) src.setData(choroplethData as unknown as GeoJSON.FeatureCollection)
    } catch {}
  }, [choroplethData, mapReady])

  // ── Update choropleth paint when metric changes ─────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    choroplethMetricRef.current = choroplethMetric
    applyChoroplethPaint(mapRef.current, choroplethMetric)
  }, [choroplethMetric, mapReady])

  // ── Toggle choropleth visibility ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const vis = choroplethVisible ? 'visible' : 'none'
    try {
      map.setLayoutProperty('choropleth-fill', 'visibility', vis)
      map.setLayoutProperty('choropleth-fill-multi', 'visibility', vis)
      map.setLayoutProperty('choropleth-circle', 'visibility', vis)
    } catch {}
  }, [choroplethVisible, mapReady])

  // ── Apply zoning filter ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    zoningFilterRef.current = zoningFilter
    applyZoningFilter(mapRef.current, zoningFilter)
  }, [zoningFilter, mapReady])

  // ── Toggle zoning overlay visibility ──────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    zoningOverlayVisibleRef.current = zoningOverlayVisible
    const vis = zoningOverlayVisible ? 'visible' : 'none'
    try {
      map.setLayoutProperty('zoning-overlay-fill', 'visibility', vis)
      map.setLayoutProperty('zoning-overlay-line', 'visibility', vis)
    } catch {}
    if (zoningOverlayVisible && map.getZoom() >= 13) {
      fetchOverlayForCurrentBounds(map)
    }
  }, [zoningOverlayVisible, mapReady])

  // ── Style switching ──────────────────────────────────────────────────────
  const prevStyleRef = useRef(mapStyle)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    // Skip if same style (prevents wiping layers on mount)
    if (prevStyleRef.current === mapStyle) return
    prevStyleRef.current = mapStyle
    
    const newUrl = `mapbox://styles/mapbox/${mapStyle}`
    
    // Listen for style.load BEFORE calling setStyle
    const onStyleLoad = () => {
      try {
        addArcGISSource(map, 'bcpao-parcels', ENDPOINTS.parcelExport)
        addArcGISSource(map, 'bcpao-zoning', ENDPOINTS.zoningExport)
        addArcGISSource(map, 'bcpao-flu', ENDPOINTS.fluExport)
        map.addLayer({ id: 'parcels-layer', type: 'raster', source: 'bcpao-parcels', paint: { 'raster-opacity': 0.8 }, layout: { visibility: 'none' } })
        map.addLayer({ id: 'zoning-layer', type: 'raster', source: 'bcpao-zoning', paint: { 'raster-opacity': 0.15 }, layout: { visibility: 'none' } })
        map.addLayer({ id: 'flu-layer', type: 'raster', source: 'bcpao-flu', paint: { 'raster-opacity': 0.5 }, layout: { visibility: 'none' } })
        map.addSource('choropleth-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      } catch (e) { console.warn('Style reload:', e) }
    }
    map.once('style.load', onStyleLoad)
    map.setStyle(newUrl)
  }, [mapStyle, mapReady])


  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full"
        role="application"
        aria-label="Interactive zoning map of Brevard County, Florida. Use arrow keys to pan, plus and minus to zoom."
        tabIndex={0}
      />
      {loading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 rounded-md px-4 py-2 text-xs text-amber-400 font-semibold backdrop-blur-sm z-10 pointer-events-none">
          Loading parcel data...
        </div>
      )}
    </div>
  )
})

export default ExplorerMap

// ── Overlay fetch ─────────────────────────────────────────────────────────────

function fetchOverlayForCurrentBounds(map: mapboxgl.Map) {
  const bounds = map.getBounds()
  if (!bounds) return
  const west  = bounds.getWest()
  const south = bounds.getSouth()
  const east  = bounds.getEast()
  const north = bounds.getNorth()
  const url = `/api/explorer/zoning-overlay?west=${west}&south=${south}&east=${east}&north=${north}`
  fetch(url)
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (!data) return
      try {
        const src = map.getSource('zoning-overlay-src') as mapboxgl.GeoJSONSource | undefined
        if (src) src.setData(data)
      } catch {}
    })
    .catch(() => {})
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function addArcGISSource(map: mapboxgl.Map, id: string, url: string) {
  map.addSource(id, {
    type: 'raster',
    tiles: [`${url}?bbox={bbox-epsg-3857}&bboxSR=102100&size=256,256&dpi=96&format=png32&transparent=true&f=image`],
    tileSize: 256,
    bounds: [BREVARD_BOUNDS[0][0], BREVARD_BOUNDS[0][1], BREVARD_BOUNDS[1][0], BREVARD_BOUNDS[1][1]],
  })
}

function buildColorExpr(metric: ChoroplethMetric): mapboxgl.Expression {
  const stops = CHOROPLETH_COLOR_STOPS
  const expr: mapboxgl.Expression = ['interpolate', ['linear'], ['get', metric]]
  for (const [val, color] of stops) {
    expr.push(val, color)
  }
  return expr
}

function buildFillPaint(metric: ChoroplethMetric): mapboxgl.FillPaint {
  return {
    'fill-color': buildColorExpr(metric),
    'fill-opacity': 0.65,
    'fill-outline-color': 'rgba(255,255,255,0.2)',
  }
}

function applyChoroplethPaint(map: mapboxgl.Map | null, metric: ChoroplethMetric) {
  if (!map) return
  const colorExpr = buildColorExpr(metric)
  try {
    map.setPaintProperty('choropleth-fill', 'fill-color', colorExpr)
    map.setPaintProperty('choropleth-fill-multi', 'fill-color', colorExpr)
    map.setPaintProperty('choropleth-circle', 'circle-color', colorExpr)
  } catch {}
}

function applyZoningFilter(map: mapboxgl.Map | null, filter: ZoningFilter) {
  if (!map) return
  // Zoning is a raster layer — we rebuild the source URL with a layerDefs filter
  // Only triggered when a user selects a specific zone type
  if (!map.getSource('bcpao-zoning')) return
  try {
    const layerDefs = filter === 'all' ? '' : `&layerDefs={"0":"ZONING LIKE '${filter}%'"}`
    const url = `${ENDPOINTS.zoningExport}${layerDefs}`
    // Replace raster source by updating tiles
    // Mapbox doesn't support live tile URL updates on raster sources,
    // so we remove and re-add the source + layer
    const currentVis = map.getLayoutProperty('zoning-layer', 'visibility')
    const currentOpacity = map.getPaintProperty('zoning-layer', 'raster-opacity') as number
    map.removeLayer('zoning-layer')
    map.removeSource('bcpao-zoning')
    map.addSource('bcpao-zoning', {
      type: 'raster',
      tiles: [`${url}?bbox={bbox-epsg-3857}&bboxSR=102100&size=256,256&dpi=96&format=png32&transparent=true&f=image`],
      tileSize: 256,
      bounds: [BREVARD_BOUNDS[0][0], BREVARD_BOUNDS[0][1], BREVARD_BOUNDS[1][0], BREVARD_BOUNDS[1][1]],
    })
    map.addLayer({
      id: 'zoning-layer', type: 'raster', source: 'bcpao-zoning',
      paint: { 'raster-opacity': currentOpacity ?? 0.35 },
      layout: { visibility: currentVis ?? 'visible' },
    })
  } catch {}
}

function popupHtml(a: ParcelAttributes): string {
  const addr = formatAddress(a)
  const pid = a.PARCEL_ID || ''
  const pidEnc = encodeURIComponent(pid)
  const r = (k: string, v: string) =>
    `<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:11px"><span style="color:#64748B">${k}</span><span style="color:#F59E0B;font-weight:600;font-family:monospace">${v}</span></div>`

  return `<div style="font-family:system-ui,sans-serif">
    <div style="font-weight:700;color:#fff;font-size:14px;margin-bottom:6px;border-bottom:1px solid #1E293B;padding-bottom:5px">${addr || 'Parcel'}</div>
    ${r('Parcel', pid)}${r('Owner', (a.OWNER_NAME1 || '—').substring(0, 22))}
    ${r('Building', formatCurrency(a.BLDG_VALUE))}${r('Land', formatCurrency(a.LAND_VALUE))}
    ${r('Use', (a.USE_CODE_DESCRIPTION || '—').trim())}
    <div style="margin-top:8px;display:flex;flex-direction:column;gap:5px;border-top:1px solid #1E293B;padding-top:6px">
      <a href="/parcel/${pidEnc}" style="display:block;text-align:center;padding:6px;background:rgba(245,158,11,.12);color:#F59E0B;border:1px solid rgba(245,158,11,.3);border-radius:4px;font-size:11px;font-weight:700;text-decoration:none">🗺️ ZoneWise.AI Analysis</a>
      <a href="https://www.bcpao.us/PropertySearch/#/account/${a.PROPERTY_ID}" target="_blank" style="display:block;text-align:center;padding:5px;background:rgba(59,130,246,.1);color:#3B82F6;border:1px solid rgba(59,130,246,.2);border-radius:4px;font-size:10px;font-weight:600;text-decoration:none">📋 BCPAO Property Search</a>
    </div></div>`
}

export { ZONING_LABELS, getZoningColor }
