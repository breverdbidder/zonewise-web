'use client'

import { useState } from 'react'
import { COLORS, getMapboxToken } from '@/lib/feasibility/constants'

/**
 * Non-interactive map thumbnail rendered via the Mapbox Static Images API.
 *
 * Why this exists: mapbox-gl creates a WebGL context on mount, and that context
 * creation is a synchronous main-thread block (measured at ~1.9s on software
 * rendering, and non-trivial even with a GPU). Small sidebar previews don't need
 * pan/zoom/3D, so paying the WebGL cost for them is pure waste — and because the
 * sidebar sits above the fold, the block landed on every /feasibility page load.
 *
 * An <img> costs zero WebGL contexts. Use MapboxMap only where the user actually
 * interacts with the map (e.g. the full Map View tab).
 */

interface StaticMapPreviewProps {
  lat: number
  lng: number
  zoom?: number
  width?: number
  height?: number
  /** Draw a marker at the center point. */
  marker?: boolean
  style?: React.CSSProperties
  className?: string
  alt?: string
}

const STATIC_STYLE = 'mapbox/satellite-streets-v12'

export default function StaticMapPreview({
  lat,
  lng,
  zoom = 15,
  width = 600,
  height = 360,
  marker = true,
  style = {},
  className = '',
  alt = 'Site location map',
}: StaticMapPreviewProps) {
  const [failed, setFailed] = useState(false)
  const token = getMapboxToken()

  // Mapbox caps static image dimensions at 1280px per side.
  const w = Math.min(Math.round(width), 1280)
  const h = Math.min(Math.round(height), 1280)

  const overlay = marker
    ? `pin-s+${COLORS.brand.replace('#', '')}(${lng},${lat})/`
    : ''

  const src = token
    ? `https://api.mapbox.com/styles/v1/${STATIC_STYLE}/static/${overlay}${lng},${lat},${zoom},0/${w}x${h}@2x?access_token=${token}`
    : ''

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-900 ${className}`}
      style={{ minHeight: 120, ...style }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          width={w}
          height={h}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-slate-400 text-xs">
            {token ? 'Map preview unavailable' : 'Mapbox token not configured'}
          </span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white">
        ZoneWise.AI · Satellite
      </div>
    </div>
  )
}
