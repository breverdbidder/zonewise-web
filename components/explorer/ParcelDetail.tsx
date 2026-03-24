'use client'

import { useEffect, useState, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getMapboxToken } from '@/lib/feasibility/constants'
import { ENDPOINTS, type ParcelAttributes, formatAddress, formatCurrency, getZoningColor, ZONING_LABELS } from '@/lib/explorer/constants'
import Link from 'next/link'
import { MiniMap } from '@/components/envelope/MiniMap'

interface Props { parcelId: string }

export default function ParcelDetail({ parcelId }: Props) {
  const [parcel, setParcel] = useState<ParcelAttributes | null>(null)
  const [nearby, setNearby] = useState<ParcelAttributes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // Query BCPAO for this parcel by ID
        const where = encodeURIComponent(`PARCEL_ID='${decodeURIComponent(parcelId)}'`)
        const url = `${ENDPOINTS.parcelExport.replace('/export', '/query')}?where=${where}&outFields=*&outSR=4326&returnGeometry=true&f=geojson&resultRecordCount=1`
        const res = await fetch(url)
        const data = await res.json()

        if (!data.features?.length) {
          setError('Parcel not found: ' + decodeURIComponent(parcelId))
          setLoading(false)
          return
        }

        const feat = data.features[0]
        const attrs = feat.properties as ParcelAttributes
        setParcel(attrs)

        // Get centroid for map + nearby query
        const coords = feat.geometry?.coordinates
        let cLng = 0, cLat = 0
        if (feat.geometry?.type === 'Polygon' && coords?.[0]) {
          const ring = coords[0]
          cLng = ring.reduce((s: number, c: number[]) => s + c[0], 0) / ring.length
          cLat = ring.reduce((s: number, c: number[]) => s + c[1], 0) / ring.length
        } else if (feat.geometry?.type === 'MultiPolygon' && coords?.[0]?.[0]) {
          const ring = coords[0][0]
          cLng = ring.reduce((s: number, c: number[]) => s + c[0], 0) / ring.length
          cLat = ring.reduce((s: number, c: number[]) => s + c[1], 0) / ring.length
        }

        // Store centroid for MiniMap
        if (cLat && cLng) setCoords({ lat: cLat, lng: cLng })

        // Init map
        if (containerRef.current && !mapRef.current) {
          const token = getMapboxToken()
          if (token) {
            mapboxgl.accessToken = token
            const map = new mapboxgl.Map({
              container: containerRef.current,
              style: 'mapbox://styles/mapbox/streets-v12',
              center: [cLng, cLat],
              zoom: 17,
              pitch: 45,
              attributionControl: false,
            })
            map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

            map.on('load', () => {
              // Add parcel boundary
              map.addSource('target-parcel', { type: 'geojson', data: feat })
              map.addLayer({ id: 'target-fill', type: 'fill', source: 'target-parcel', paint: { 'fill-color': '#F59E0B', 'fill-opacity': 0.3 } })
              map.addLayer({ id: 'target-line', type: 'line', source: 'target-parcel', paint: { 'line-color': '#F59E0B', 'line-width': 3 } })

              // BCPAO parcel overlay
              map.addSource('bcpao-parcels', {
                type: 'raster',
                tiles: [`${ENDPOINTS.parcelExport}?bbox={bbox-epsg-3857}&bboxSR=102100&size=256,256&dpi=96&format=png32&transparent=true&f=image`],
                tileSize: 256,
              })
              map.addLayer({ id: 'parcels-layer', type: 'raster', source: 'bcpao-parcels', paint: { 'raster-opacity': 0.6 } })

              // 3D buildings
              const layers = map.getStyle().layers
              const label = layers?.find((l: any) => l.type === 'symbol' && l.layout?.['text-field'])
              if (label) {
                map.addLayer({
                  id: 'buildings-3d', source: 'composite', 'source-layer': 'building',
                  filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 14,
                  paint: {
                    'fill-extrusion-color': '#d4d4d8',
                    'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']],
                    'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']],
                    'fill-extrusion-opacity': 0.5,
                  },
                }, label.id)
              }
            })

            new mapboxgl.Marker({ color: '#F59E0B' }).setLngLat([cLng, cLat]).addTo(map)
            mapRef.current = map
          }
        }

        // Nearby parcels
        if (cLng && cLat) {
          const buf = 0.003
          const geom = JSON.stringify({ xmin: cLng - buf, ymin: cLat - buf, xmax: cLng + buf, ymax: cLat + buf, spatialReference: { wkid: 4326 } })
          const nUrl = `${ENDPOINTS.parcelExport.replace('/export', '/query')}?geometry=${encodeURIComponent(geom)}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=PARCEL_ID,STREET_NUMBER,STREET_NAME,STREET_TYPE,BLDG_VALUE,LAND_VALUE,LIV_AREA,ACRES,USE_CODE_DESCRIPTION,PROPERTY_ID&outSR=4326&returnGeometry=false&f=json&resultRecordCount=20`
          const nRes = await fetch(nUrl)
          const nData = await nRes.json()
          const nParcels = (nData.features || [])
            .map((f: any) => f.attributes as ParcelAttributes)
            .filter((p: ParcelAttributes) => p.PARCEL_ID !== attrs.PARCEL_ID)
          setNearby(nParcels.slice(0, 12))
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load parcel')
      }
      setLoading(false)
    }
    load()
    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [parcelId])

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-slate-950">
      <div className="text-center">
        <div className="text-3xl animate-spin inline-block mb-3">◐</div>
        <p className="text-sm text-slate-400">Loading parcel {decodeURIComponent(parcelId)}...</p>
      </div>
    </div>
  )

  if (error || !parcel) return (
    <div className="flex items-center justify-center h-full bg-slate-950">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-sm text-red-400 mb-4">{error || 'Parcel not found'}</p>
        <Link href="/explorer" className="px-4 py-2 bg-zw-orange text-slate-950 rounded-md text-sm font-bold">
          ← Back to Explorer
        </Link>
      </div>
    </div>
  )

  const addr = formatAddress(parcel)
  const totalValue = (parseFloat(parcel.BLDG_VALUE) || 0) + (parseFloat(parcel.LAND_VALUE) || 0)

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-[420px] bg-slate-950 border-r border-slate-800 overflow-y-auto shrink-0 max-md:hidden">
        <div className="p-4 border-b border-slate-800">
          <Link href="/explorer" className="text-xs text-zw-orange hover:underline">← Back to Explorer</Link>
          {coords && (
            <div className="mt-3 rounded-lg overflow-hidden" style={{ height: 160 }}>
              <MiniMap lat={coords.lat} lng={coords.lng} className="w-full h-full" />
            </div>
          )}
          <h1 className="text-lg font-bold text-white mt-2">{addr || 'Unknown Address'}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{(parcel.CITY || '').trim()}, FL {parcel.ZIP_CODE || ''}</p>
          <p className="text-[11px] text-slate-400 font-mono mt-1">{parcel.PARCEL_ID}</p>
        </div>

        {/* Values */}
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Property Values</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total Value', value: formatCurrency(totalValue) },
              { label: 'Building', value: formatCurrency(parcel.BLDG_VALUE) },
              { label: 'Land', value: formatCurrency(parcel.LAND_VALUE) },
              { label: 'Homestead', value: formatCurrency(parcel.HOMESTEAD_VALUE) },
              { label: 'Living Area', value: `${parseInt(parcel.LIV_AREA) || '—'} sqft` },
              { label: 'Lot Size', value: `${parseFloat(parcel.ACRES)?.toFixed(2) || '—'} ac` },
            ].map(s => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-md p-2.5">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Owner & Details */}
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Owner & Details</h3>
          <div className="space-y-1.5 text-xs">
            {[
              ['Owner', parcel.OWNER_NAME1 || '—'],
              ['Use', (parcel.USE_CODE_DESCRIPTION || '—').trim()],
              ['Subdivision', parcel.SUBDIVISION_NAME || '—'],
              ['Millage Code', parcel.MILLAGE_CODE || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-400">{k}</span>
                <span className="text-white font-medium text-right max-w-[60%]">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="p-4 border-b border-slate-800 space-y-2">
          <a href={`https://www.bcpao.us/PropertySearch/#/account/${parcel.PROPERTY_ID}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md text-sm font-semibold hover:bg-blue-500/20 transition-colors">
            📋 Full BCPAO Record
          </a>
          <Link href="/explorer"
            className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-md text-xs font-semibold hover:bg-slate-700 transition-colors">
            🗺️ Back to County Explorer
          </Link>
        </div>

        {/* Nearby */}
        {nearby.length > 0 && (
          <div className="p-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nearby Parcels</h3>
            {nearby.map(n => {
              const nAddr = [n.STREET_NUMBER, n.STREET_NAME, n.STREET_TYPE].filter(Boolean).join(' ')
              return (
                <Link key={n.PARCEL_ID} href={`/parcel/${encodeURIComponent(n.PARCEL_ID)}`}
                  className="block bg-slate-900 border border-slate-800 rounded-md p-2 mb-1.5 hover:border-zw-orange/50 transition-colors">
                  <div className="text-xs font-semibold text-white">{nAddr || n.PARCEL_ID}</div>
                  <div className="flex gap-3 mt-0.5 text-[10px] text-slate-400">
                    <span>Bldg: <span className="text-zw-orange font-mono">{formatCurrency(n.BLDG_VALUE)}</span></span>
                    <span>{parseInt(n.LIV_AREA) || '—'} sqft</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  )
}
