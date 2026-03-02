'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useTheme } from '@/lib/theme-context'
import type { Auction } from '@/types/auctions'

interface Props {
  auctions: Auction[]
  loading: boolean
  onSelectAuction: (auction: Auction) => void
}

function pinColor(type: string): string {
  switch (type) {
    case 'foreclosure': return '#EF4444'
    case 'tax_deed': return '#F59E0B'
    default: return '#6B7280'
  }
}

function formatCurrency(val: number | null): string {
  if (val == null) return '—'
  return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function AuctionMap({ auctions, loading, onSelectAuction }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { theme } = useTheme()

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isFullscreen])

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isFullscreen])

  // Resize map when fullscreen changes
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      setTimeout(() => mapRef.current?.resize(), 50)
    }
  }, [isFullscreen, mapLoaded])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    if (!MAPBOX_TOKEN) {
      setMapError('Mapbox token not configured')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-81.5, 27.6],
      zoom: 6,
    })

    mapRef.current.on('load', () => {
      setMapLoaded(true)
      mapRef.current?.addControl(new mapboxgl.NavigationControl(), 'top-right')
    })

    return () => {
      markersRef.current.forEach((m: any) => m.remove())
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Update style on theme change
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      const style = theme === 'dark'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/satellite-streets-v12'
      mapRef.current.setStyle(style)
    }
  }, [theme, mapLoaded])

  // Update markers when auctions change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    markersRef.current.forEach((m: any) => m.remove())
    markersRef.current = []

    const pins = auctions.filter((a) => a.centroid_lat && a.centroid_lng)

    for (const auction of pins) {
      const color = pinColor(auction.auction_type)

      const el = document.createElement('div')
      el.style.cssText = `
        width: 12px; height: 12px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      `

      const popup = new mapboxgl.Popup({ offset: 15, maxWidth: '260px' })
        .setHTML(`
          <div style="font-family: system-ui; font-size: 12px;">
            <p style="font-weight: 600; margin: 0 0 4px 0;">${auction.property_address || 'No address'}</p>
            <p style="color: #666; margin: 0 0 2px 0;">${auction.county} — ${auction.auction_type === 'foreclosure' ? 'Foreclosure' : 'Tax Deed'}</p>
            ${auction.just_value ? `<p style="color: #666; margin: 0;">Value: ${formatCurrency(auction.just_value)}</p>` : ''}
            ${auction.auction_date ? `<p style="color: #666; margin: 0;">Date: ${auction.auction_date}</p>` : ''}
            <p style="margin: 6px 0 0 0;"><a href="/auctions/${auction.id}" style="color: #2A4F7A; text-decoration: underline; font-size: 11px;">View details →</a></p>
          </div>
        `)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([auction.centroid_lng!, auction.centroid_lat!])
        .setPopup(popup)
        .addTo(mapRef.current!)

      el.addEventListener('click', () => onSelectAuction(auction))

      markersRef.current.push(marker)
    }

    if (pins.length > 1) {
      const bounds = new mapboxgl.LngLatBounds()
      pins.forEach((a) => bounds.extend([a.centroid_lng!, a.centroid_lat!]))
      mapRef.current!.fitBounds(bounds, { padding: 50, maxZoom: 12 })
    } else if (pins.length === 1) {
      mapRef.current!.flyTo({
        center: [pins[0].centroid_lng!, pins[0].centroid_lat!],
        zoom: 10,
      })
    }
  }, [auctions, mapLoaded])

  if (mapError) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-8 text-center">
        <p className="text-gray-500 dark:text-slate-400">{mapError}</p>
      </div>
    )
  }

  return (
    <div
      ref={wrapperRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950'
          : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden relative'
      }
    >
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-10 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zw-navy-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div
        ref={mapContainer}
        className={isFullscreen ? 'w-full h-full' : 'w-full h-[600px]'}
      />

      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 left-3 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-md px-3 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1.5"
        title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen map'}
      >
        {isFullscreen ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
            Exit Fullscreen
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
            Fullscreen
          </>
        )}
      </button>

      {/* Legend */}
      <div className={`absolute ${isFullscreen ? 'bottom-6 left-6' : 'bottom-3 left-3'} bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-md px-3 py-2 text-xs text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 z-20`}>
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" /> Foreclosure
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-3 mr-1" /> Tax Deed
      </div>

      {/* Fullscreen: Esc hint */}
      {isFullscreen && (
        <div className="absolute top-3 right-16 z-20 bg-black/60 backdrop-blur-sm rounded-md px-2.5 py-1.5 text-xs text-white/70">
          Press <kbd className="bg-white/20 px-1 py-0.5 rounded text-white font-mono">Esc</kbd> to exit
        </div>
      )}
    </div>
  )
}
