'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { COLORS, getMapboxToken, MAP_DEFAULTS } from '@/lib/feasibility/constants'

interface MapboxMapProps {
  lat: number
  lng: number
  zoom?: number
  pitch?: number
  bearing?: number
  parcelGeojson?: GeoJSON.Polygon | null
  style?: React.CSSProperties
  showBuildings3D?: boolean
  className?: string
}

export default function MapboxMap({
  lat,
  lng,
  zoom = MAP_DEFAULTS.zoom,
  pitch = MAP_DEFAULTS.pitch,
  bearing = MAP_DEFAULTS.bearing,
  parcelGeojson,
  style = {},
  showBuildings3D = true,
  className = '',
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const token = getMapboxToken()
    if (!token) {
      setError('Mapbox token not configured')
      return
    }

    try {
      mapboxgl.accessToken = token

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAP_DEFAULTS.style,
        center: [lng, lat],
        zoom,
        pitch,
        bearing,
        antialias: true,
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')

      new mapboxgl.Marker({ color: COLORS.brand })
        .setLngLat([lng, lat])
        .addTo(map)

      map.on('load', () => {
        // 3D buildings
        if (showBuildings3D) {
          const layers = map.getStyle().layers
          const labelLayer = layers?.find(
            (l) => l.type === 'symbol' && l.layout?.['text-field']
          )

          map.addLayer(
            {
              id: 'zw-3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 15,
              paint: {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                  'interpolate', ['linear'], ['zoom'],
                  15, 0, 15.05, ['get', 'height'],
                ],
                'fill-extrusion-base': [
                  'interpolate', ['linear'], ['zoom'],
                  15, 0, 15.05, ['get', 'min_height'],
                ],
                'fill-extrusion-opacity': 0.6,
              },
            },
            labelLayer?.id
          )
        }

        // Parcel boundary
        if (parcelGeojson) {
          map.addSource('zw-parcel', {
            type: 'geojson',
            data: { type: 'Feature', geometry: parcelGeojson, properties: {} },
          })
          map.addLayer({
            id: 'zw-parcel-fill',
            type: 'fill',
            source: 'zw-parcel',
            paint: { 'fill-color': COLORS.brand, 'fill-opacity': 0.2 },
          })
          map.addLayer({
            id: 'zw-parcel-line',
            type: 'line',
            source: 'zw-parcel',
            paint: {
              'line-color': COLORS.brand,
              'line-width': 2.5,
              'line-dasharray': [2, 1],
            },
          })
        } else {
          // Simulated parcel rectangle if no GeoJSON provided
          const offset = 0.0004
          map.addSource('zw-parcel', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [lng - offset, lat - offset * 0.6],
                  [lng + offset, lat - offset * 0.6],
                  [lng + offset, lat + offset * 0.6],
                  [lng - offset, lat + offset * 0.6],
                  [lng - offset, lat - offset * 0.6],
                ]],
              },
            },
          })
          map.addLayer({
            id: 'zw-parcel-fill',
            type: 'fill',
            source: 'zw-parcel',
            paint: { 'fill-color': COLORS.brand, 'fill-opacity': 0.15 },
          })
          map.addLayer({
            id: 'zw-parcel-line',
            type: 'line',
            source: 'zw-parcel',
            paint: {
              'line-color': COLORS.brand,
              'line-width': 2,
              'line-dasharray': [2, 1],
            },
          })
        }

        setLoaded(true)
      })

      mapRef.current = map
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize map')
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng])

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ minHeight: 200, ...style }}
    >
      <div ref={containerRef} className="w-full h-full" />

      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-slate-400 text-sm animate-pulse">Loading satellite imagery...</div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="text-red-400 text-xs">Map error: {error}</div>
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
        ZoneWise.AI · Satellite
      </div>
    </div>
  )
}
