'use client'

/**
 * MiniMap — Deliverable 2
 *
 * Two modes:
 *   variant="static"  → Mapbox Static Images API (card grid, low bandwidth)
 *   variant="gl"      → Interactive mapbox-gl map with orange parcel pin (detail view)
 *
 * Token priority: NEXT_PUBLIC_MAPBOX_TOKEN → VITE_MAPBOX_TOKEN → hardcoded fallback
 * Style: mapbox://styles/mapbox/dark-v11
 * Brand: Orange #F59E0B pin, bg #020617
 */

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// ---------------------------------------------------------------------------
// Token resolution
// ---------------------------------------------------------------------------
const FALLBACK_TOKEN =
  'pk.eyJ1IjoiZXZlcmVzdDE4IiwiYSI6ImNtanB5cDQ5ZzF1eWgzaHB2cGVhZXdqbjMifQ.4RPrkTf84GL1-clmhmCnTw'

function resolveToken(): string {
  if (typeof process !== 'undefined') {
    const t =
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      (process.env as Record<string, string | undefined>)['VITE_MAPBOX_TOKEN']
    if (t) return t
  }
  return FALLBACK_TOKEN
}

// ---------------------------------------------------------------------------
// Static image helper (card grid)
// ---------------------------------------------------------------------------
function staticImageUrl(lat: number, lng: number, zoom = 12, w = 320, h = 200): string {
  const token = resolveToken()
  return (
    `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/` +
    `pin-s+f59e0b(${lng},${lat})/` +
    `${lng},${lat},${zoom},0/${w}x${h}@2x` +
    `?access_token=${token}`
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface MiniMapProps {
  lat: number
  lng: number
  /** "static" = Static Images API (grid card), "gl" = interactive GL (detail) */
  variant?: 'static' | 'gl'
  className?: string
  /** Width in px for static variant (defaults 320) */
  width?: number
  /** Height in px for static variant (defaults 200) */
  height?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MiniMap({ lat, lng, variant = 'static', className = '', width = 320, height = 200 }: MiniMapProps) {
  if (!lat || !lng) return null

  if (variant === 'static') {
    return (
      <StaticMiniMap
        lat={lat}
        lng={lng}
        width={width}
        height={height}
        className={className}
      />
    )
  }

  return <GLMiniMap lat={lat} lng={lng} className={className} />
}

// ---------------------------------------------------------------------------
// Static variant — <img> pointing at Mapbox Static Images API
// ---------------------------------------------------------------------------
function StaticMiniMap({
  lat,
  lng,
  width,
  height,
  className,
}: {
  lat: number
  lng: number
  width: number
  height: number
  className: string
}) {
  const src = staticImageUrl(lat, lng, 12, width, height)

  return (
    <div
      className={className}
      style={{
        width,
        height,
        background: '#020617',
        borderRadius: 8,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Parcel location map"
        loading="lazy"
        width={width}
        height={height}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={(e) => {
          // On token / network failure, show dark placeholder
          const el = e.currentTarget as HTMLImageElement
          el.style.display = 'none'
          const parent = el.parentElement
          if (parent) {
            parent.style.background =
              'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
          }
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// GL variant — Interactive mapbox-gl map with orange pin
// ---------------------------------------------------------------------------
function GLMiniMap({ lat, lng, className }: { lat: number; lng: number; className: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const token = resolveToken()
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: 15,
      interactive: true,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    // Orange pin marker
    const el = document.createElement('div')
    el.style.cssText = [
      'width:20px',
      'height:20px',
      'border-radius:50% 50% 50% 0',
      'background:#F59E0B',
      'transform:rotate(-45deg)',
      'border:2px solid #1E3A5F',
      'box-shadow:0 2px 8px rgba(245,158,11,0.6)',
      'cursor:pointer',
    ].join(';')

    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(map)

    mapRef.current = map
    markerRef.current = marker

    return () => {
      marker.remove()
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fly to new location when lat/lng props change
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 800 })
    markerRef.current?.setLngLat([lng, lat])
  }, [lat, lng])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ background: '#020617', borderRadius: 8, overflow: 'hidden', minHeight: 240 }}
    />
  )
}

export default MiniMap
