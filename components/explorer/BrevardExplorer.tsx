'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getMapboxToken } from '@/lib/feasibility/constants'
import {
  ENDPOINTS, BREVARD_BOUNDS, BREVARD_CENTER,
  type ParcelAttributes, formatAddress, formatCurrency,
  getZoningColor, ZONING_LABELS,
} from '@/lib/explorer/constants'

interface LayerState { parcels: boolean; zoning: boolean; flu: boolean; heatmap: boolean }

export default function BrevardExplorer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [layers, setLayers] = useState<LayerState>({ parcels: true, zoning: true, flu: false, heatmap: false })
  const [selectedParcel, setSelectedParcel] = useState<ParcelAttributes | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [parcelCount, setParcelCount] = useState('262K+')

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
      // BCPAO parcels — ALL of Brevard County via ArcGIS dynamic export
      addArcGISSource(map, 'bcpao-parcels', ENDPOINTS.parcelExport)
      addArcGISSource(map, 'bcpao-zoning', ENDPOINTS.zoningExport)
      addArcGISSource(map, 'bcpao-flu', ENDPOINTS.fluExport)

      map.addLayer({ id: 'parcels-layer', type: 'raster', source: 'bcpao-parcels', paint: { 'raster-opacity': 0.8 } })
      map.addLayer({ id: 'zoning-layer', type: 'raster', source: 'bcpao-zoning', paint: { 'raster-opacity': 0.55 } })
      map.addLayer({ id: 'flu-layer', type: 'raster', source: 'bcpao-flu', paint: { 'raster-opacity': 0.5 }, layout: { visibility: 'none' } })

      // Heatmap source (populated on parcel identify)
      map.addSource('value-heatmap', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })
      map.addLayer({
        id: 'heatmap-layer',
type: 'heatmap',
        source: 'value-heatmap',
        maxzoom: 18,
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 0, 0, 500000, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1, 18, 3],
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.2, '#2563EB', 0.4, '#22C55E', 0.6, '#F59E0B', 0.8, '#EF4444', 1, '#DC2626'],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 15, 18, 30],
          'heatmap-opacity': 0.65
        }
      })

      // 3D buildings (like Reventure.app)
      const bldgLayers = map.getStyle().layers
      const labelLayer = bldgLayers?.find((l: any) => l.type === 'symbol' && l.layout?.['text-field'])
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

      // Re-add BCPAO layers after style change (style switcher resets sources)
      map.on('style.load', () => {
        if (!map.getSource('bcpao-parcels')) {
          addArcGISSource(map, 'bcpao-parcels', ENDPOINTS.parcelExport)
          addArcGISSource(map, 'bcpao-zoning', ENDPOINTS.zoningExport)
          addArcGISSource(map, 'bcpao-flu', ENDPOINTS.fluExport)
          map.addLayer({ id: 'parcels-layer', type: 'raster', source: 'bcpao-parcels', paint: { 'raster-opacity': 0.8 } })
          map.addLayer({ id: 'zoning-layer', type: 'raster', source: 'bcpao-zoning', paint: { 'raster-opacity': 0.55 } })
          map.addLayer({ id: 'flu-layer', type: 'raster', source: 'bcpao-flu', paint: { 'raster-opacity': 0.5 }, layout: { visibility: 'none' } })
        }
      })

      setMapReady(true)
    })

    // Click to identify parcel
    map.on('click', async (e) => {
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
          setSelectedParcel(attrs)
          // Feed heatmap
          if (map.getSource('value-heatmap')) {
            const existing = (map.getSource('value-heatmap') as mapboxgl.GeoJSONSource)
            const bv = parseFloat(attrs.BLDG_VALUE) + parseFloat(attrs.LAND_VALUE)
            const prev = (window as any).__heatPts || []
            prev.push({ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [lng, lat] }, properties: { value: bv } })
            if (prev.length > 500) prev.shift()
            ;(window as any).__heatPts = prev
            existing.setData({ type: 'FeatureCollection', features: prev })
          }
          new mapboxgl.Popup({ maxWidth: '340px', className: 'zw-popup' })
            .setLngLat([lng, lat])
            .setHTML(popupHtml(attrs))
            .addTo(map)
        } else {
          setSelectedParcel(null)
        }
      } catch {
        setSelectedParcel(null)
      }
      setLoading(false)
    })

    map.on('mouseenter', 'parcels-layer', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'parcels-layer', () => { map.getCanvas().style.cursor = '' })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Sync layer visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    try {
      map.setLayoutProperty('parcels-layer', 'visibility', layers.parcels ? 'visible' : 'none')
      map.setLayoutProperty('zoning-layer', 'visibility', layers.zoning ? 'visible' : 'none')
      map.setLayoutProperty('flu-layer', 'visibility', layers.flu ? 'visible' : 'none')
      if (map.getLayer('heatmap-layer')) map.setLayoutProperty('heatmap-layer', 'visibility', layers.heatmap ? 'visible' : 'none')
    } catch {}
  }, [layers, mapReady])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !mapRef.current) return
    setLoading(true)
    try {
      const q = encodeURIComponent(searchQuery + ', Brevard County, FL')
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${getMapboxToken()}&bbox=-81.2,27.8,-80.4,28.8&limit=1`
      )
      const data = await res.json()
      if (data.features?.length) {
        const [lng, lat] = data.features[0].center
        mapRef.current.flyTo({ center: [lng, lat], zoom: 17, duration: 1500 })
      }
    } catch {}
    setLoading(false)
  }, [searchQuery])

  return (
    <div className="flex h-full">
      {/* SIDEBAR */}
      <div className="w-[380px] bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 max-md:hidden">
        {/* Search */}
        <div className="p-3 border-b border-slate-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search any Brevard address..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-zw-orange-400 transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-3 py-2 bg-zw-orange text-slate-950 rounded-md text-sm font-bold hover:brightness-110 disabled:opacity-40 transition-all"
            >
              🔍
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">{parcelCount} parcels · Click any parcel on the map</p>
        </div>

        {/* Layers */}
        <div className="p-3 border-b border-slate-800">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Map Layers</h4>
          {([
            { key: 'parcels' as const, label: 'All Brevard Parcels', color: '#F59E0B' },
            { key: 'zoning' as const, label: 'Zoning Districts', color: '#3B82F6' },
            { key: 'flu' as const, label: 'Future Land Use', color: '#A855F7' },
            { key: 'heatmap' as const, label: 'Value Heatmap', color: '#EF4444' },
          ]).map(l => (
            <label key={l.key} className="flex items-center gap-2 py-1 text-xs text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
              <input type="checkbox" checked={layers[l.key]} onChange={() => setLayers(p => ({ ...p, [l.key]: !p[l.key] }))} className="accent-zw-orange rounded" />
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: l.color }} />
              {l.label}
            </label>
          ))}
        </div>

        {/* Parcel Detail */}
        <div className="flex-1 overflow-y-auto p-3">
          {selectedParcel ? <ParcelDetail parcel={selectedParcel} /> : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4 opacity-15">🗺️</div>
              <p className="text-sm text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                Click any parcel on the map to see property details and open the full ZoneWise.AI analysis.
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-slate-800">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Zoning Legend</h4>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {Object.entries(ZONING_LABELS).slice(0, 8).map(([code, label]) => (
              <div key={code} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: getZoningColor(code) }} />
                {code} — {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          {([
            { id: 'streets-v12', label: 'Streets' },
            { id: 'satellite-streets-v12', label: 'Satellite' },
            { id: 'light-v11', label: 'Light' },
            { id: 'dark-v11', label: 'Dark' },
          ] as const).map(s => (
            <button
              key={s.id}
              onClick={() => { if (mapRef.current) mapRef.current.setStyle('mapbox://styles/mapbox/' + s.id) }}
              className="px-2.5 py-1.5 bg-white/90 border border-slate-300 rounded-md text-[11px] font-semibold text-slate-700 hover:bg-zw-orange/10 hover:border-zw-orange/50 hover:text-zw-orange-600 transition-all backdrop-blur-sm shadow-sm"
            >
              {s.label}
            </button>
          ))}
        </div>
        {loading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 rounded-md px-4 py-2 text-xs text-zw-orange font-semibold backdrop-blur-sm z-10">
            Loading parcel data...
          </div>
        )}
      </div>
    </div>
  )
}

/* ---- Parcel Detail ---- */
function ParcelDetail({ parcel }: { parcel: ParcelAttributes }) {
  const addr = formatAddress(parcel)
  const pid = parcel.PARCEL_ID || ''
  const pidEnc = encodeURIComponent(pid)

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-white leading-tight">{addr || 'Unknown Address'}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{(parcel.CITY || '').trim()}, FL {parcel.ZIP_CODE || ''}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{pid} · {(parcel.USE_CODE_DESCRIPTION || '').trim()}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Building', value: formatCurrency(parcel.BLDG_VALUE) },
          { label: 'Land', value: formatCurrency(parcel.LAND_VALUE) },
          { label: 'Living Area', value: `${parseInt(parcel.LIV_AREA) || '—'} sqft` },
          { label: 'Lot', value: `${parseFloat(parcel.ACRES)?.toFixed(2) || '—'} ac` },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-md p-2.5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-md p-2.5">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Owner</div>
        <div className="text-sm font-semibold text-white">{parcel.OWNER_NAME1 || '—'}</div>
        {parcel.OWNER_NAME2 && <div className="text-xs text-slate-400">{parcel.OWNER_NAME2}</div>}
        <div className="text-[11px] text-slate-500 mt-1">Subdivision: {parcel.SUBDIVISION_NAME || '—'}</div>
        <div className="text-[11px] text-slate-500">Millage: {parcel.MILLAGE_CODE || '—'} · Homestead: {parseFloat(parcel.HOMESTEAD_VALUE) > 0 ? 'Yes ✓' : 'No'}</div>
      </div>

      <div className="space-y-2 pt-1">
        <a href={`/parcel/${pidEnc}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-zw-orange/15 border border-zw-orange/30 text-zw-orange rounded-md text-sm font-bold hover:bg-zw-orange/25 transition-colors">
          🗺️ Full ZoneWise.AI Analysis
        </a>
        <a href={`https://www.bcpao.us/PropertySearch/#/account/${parcel.PROPERTY_ID}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md text-xs font-semibold hover:bg-blue-500/20 transition-colors">
          📋 View on BCPAO
        </a>
      </div>
    </div>
  )
}

/* ---- Helpers ---- */
function addArcGISSource(map: mapboxgl.Map, id: string, url: string) {
  map.addSource(id, {
    type: 'raster',
    tiles: [`${url}?bbox={bbox-epsg-3857}&bboxSR=102100&size=256,256&dpi=96&format=png32&transparent=true&f=image`],
    tileSize: 256,
    bounds: [BREVARD_BOUNDS[0][0], BREVARD_BOUNDS[0][1], BREVARD_BOUNDS[1][0], BREVARD_BOUNDS[1][1]],
  })
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
