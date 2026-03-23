'use client'

export interface MiniMapProps {
  lat: number | null
  lng: number | null
  zoom?: number
  w?: number
  h?: number
  className?: string
}

// Mapbox static image for card grid (low bandwidth, fast load)
export function MiniMap({ lat, lng, zoom = 15, w = 300, h = 160, className = '' }: MiniMapProps) {
  if (!lat || !lng) return null

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return null

  const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+F59E0B(${lng},${lat})/${lng},${lat},${zoom},0/${w}x${h}@2x?access_token=${token}`

  return (
    <img
      src={url}
      alt={`Map showing parcel at ${lat}, ${lng}`}
      loading="lazy"
      className={`w-full rounded-lg border border-gray-700/50 ${className}`}
      style={{ height: h, objectFit: 'cover' }}
    />
  )
}
