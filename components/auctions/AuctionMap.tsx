'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useTheme } from '@/lib/theme-context'
import { getRecommendation } from '@/lib/scoring'
import { getZoningCategory, ZONING_CATEGORY_COLORS, ZONING_CATEGORY_LABELS, type ZoningCategory } from '@/lib/zoning'
import type { Auction } from '@/types/auctions'

interface Props {
  auctions: Auction[]
  loading: boolean
  onSelectAuction: (auction: Auction) => void
}

type ColorMode = 'type' | 'zoning'

function formatCurrency(val: number | null): string {
  if (val == null) return '—'
  return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const STREETS_STYLE = 'mapbox://styles/mapbox/streets-v12'
const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12'

export default function AuctionMap({ auctions, loading, onSelectAuction }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSatellite, setIsSatellite] = useState(true)
  const [colorMode, setColorMode] = useState<ColorMode>('type')
  const auctionLookup = useRef<Map<number, Auction>>(new Map())
  const { theme } = useTheme()

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  const toggleStyle = useCallback(() => {
    setIsSatellite((prev) => !prev)
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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    if (!MAPBOX_TOKEN) {
      setMapError('Mapbox token not configured')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: isSatellite ? SATELLITE_STYLE : STREETS_STYLE,
      center: [-81.5, 27.6],
      zoom: 6,
    })

    mapRef.current.on('load', () => {
      setMapLoaded(true)
      mapRef.current?.addControl(new mapboxgl.NavigationControl(), 'top-right')
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Update style on toggle
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    const style = isSatellite ? SATELLITE_STYLE : STREETS_STYLE
    mapRef.current.setStyle(style)

    mapRef.current.once('style.load', () => {
      addClusterLayers()
    })
  }, [isSatellite])

  function getPointColor(auction: Auction): string {
    if (colorMode === 'zoning') {
      const cat = (auction.zoning_category as ZoningCategory) || getZoningCategory(auction.dor_use_code)
      if (cat && ZONING_CATEGORY_COLORS[cat]) return ZONING_CATEGORY_COLORS[cat].hex
      return '#6B7280'
    }
    // Type mode
    if (auction.auction_type === 'foreclosure') return '#EF4444'
    if (auction.auction_type === 'tax_deed') return '#F59E0B'
    return '#6B7280'
  }

  function buildGeoJSON() {
    const features = auctions
      .filter((a) => a.centroid_lat && a.centroid_lng)
      .map((a) => {
        const score = getRecommendation(a.just_value, a.opening_bid)
        auctionLookup.current.set(a.id, a)
        const cat = (a.zoning_category as ZoningCategory) || getZoningCategory(a.dor_use_code)
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [a.centroid_lng!, a.centroid_lat!],
          },
          properties: {
            id: a.id,
            address: a.property_address || 'No address',
            county: a.county,
            auction_type: a.auction_type,
            just_value: a.just_value,
            opening_bid: a.opening_bid,
            auction_date: a.auction_date,
            recommendation: score.recommendation,
            rec_color: score.color,
            zoning_category: cat || 'UNKNOWN',
            type_code: a.auction_type === 'foreclosure' ? 0 : a.auction_type === 'tax_deed' ? 1 : 2,
            zoning_code: cat === 'RES' ? 0 : cat === 'COM' ? 1 : cat === 'IND' ? 2 : cat === 'AGR' ? 3 : cat === 'INST' ? 4 : 5,
          },
        }
      })

    return {
      type: 'FeatureCollection' as const,
      features,
    }
  }

  function getUnclusteredPaint(): any {
    if (colorMode === 'zoning') {
      return {
        'circle-color': [
          'match',
          ['get', 'zoning_code'],
          0, ZONING_CATEGORY_COLORS.RES.hex,
          1, ZONING_CATEGORY_COLORS.COM.hex,
          2, ZONING_CATEGORY_COLORS.IND.hex,
          3, ZONING_CATEGORY_COLORS.AGR.hex,
          4, ZONING_CATEGORY_COLORS.INST.hex,
          ZONING_CATEGORY_COLORS.MISC.hex,
        ],
        'circle-radius': 7,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      }
    }
    return {
      'circle-color': [
        'match',
        ['get', 'type_code'],
        0, '#EF4444',
        1, '#F59E0B',
        '#6B7280',
      ],
      'circle-radius': 7,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    }
  }

  function addClusterLayers() {
    const map = mapRef.current
    if (!map) return

    const layersToRemove = ['clusters', 'cluster-count', 'unclustered-point']
    layersToRemove.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id)
    })
    if (map.getSource('auctions')) map.removeSource('auctions')

    const geojson = buildGeoJSON()

    map.addSource('auctions', {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    })

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'auctions',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#22C55E',
          10, '#F59E0B',
          50, '#EF4444',
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          18,
          10, 24,
          50, 32,
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    })

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'auctions',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#ffffff',
      },
    })

    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'auctions',
      filter: ['!', ['has', 'point_count']],
      paint: getUnclusteredPaint(),
    })

    // Click cluster → zoom in
    map.on('click', 'clusters', (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
      const clusterId = features[0].properties.cluster_id
      map.getSource('auctions').getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
        })
      })
    })

    // Click individual pin → popup + select auction
    map.on('click', 'unclustered-point', (e: any) => {
      const coords = e.features[0].geometry.coordinates.slice()
      const props = e.features[0].properties
      const auction = auctionLookup.current.get(props.id)

      const typeLabel = props.auction_type === 'foreclosure' ? 'Foreclosure' : 'Tax Deed'
      const recBadge = props.recommendation !== 'UNKNOWN'
        ? `<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;color:#fff;background:${props.rec_color}">${props.recommendation}</span>`
        : ''
      const zoneBadge = props.zoning_category && props.zoning_category !== 'UNKNOWN'
        ? `<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;color:#555;background:#e5e7eb;margin-left:4px">${props.zoning_category}</span>`
        : ''

      new mapboxgl.Popup({ offset: 15, maxWidth: '280px' })
        .setLngLat(coords)
        .setHTML(`
          <div style="font-family:system-ui;font-size:12px;">
            <p style="font-weight:600;margin:0 0 4px 0;">${props.address}</p>
            <p style="color:#666;margin:0 0 2px 0;">${props.county} — ${typeLabel} ${recBadge}${zoneBadge}</p>
            ${props.just_value ? `<p style="color:#666;margin:0 0 2px 0;">Value: ${formatCurrency(props.just_value)}</p>` : ''}
            ${props.opening_bid ? `<p style="color:#666;margin:0 0 2px 0;">Opening Bid: ${formatCurrency(props.opening_bid)}</p>` : ''}
            ${props.auction_date ? `<p style="color:#666;margin:0;">Date: ${props.auction_date}</p>` : ''}
          </div>
        `)
        .addTo(map)

      if (auction) onSelectAuction(auction)
    })

    // Cursor changes
    map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })
    map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = '' })

    // Fit bounds
    const pins = auctions.filter((a) => a.centroid_lat && a.centroid_lng)
    if (pins.length > 1) {
      const bounds = new mapboxgl.LngLatBounds()
      pins.forEach((a) => bounds.extend([a.centroid_lng!, a.centroid_lat!]))
      map.fitBounds(bounds, { padding: 50, maxZoom: 12 })
    } else if (pins.length === 1) {
      map.flyTo({
        center: [pins[0].centroid_lng!, pins[0].centroid_lat!],
        zoom: 10,
      })
    }
  }

  // Update cluster data when auctions or colorMode change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    auctionLookup.current.clear()

    if (mapRef.current.getSource('auctions')) {
      const geojson = buildGeoJSON()
      mapRef.current.getSource('auctions').setData(geojson)

      // Update pin colors for color mode change
      if (mapRef.current.getLayer('unclustered-point')) {
        const paint = getUnclusteredPaint()
        mapRef.current.setPaintProperty('unclustered-point', 'circle-color', paint['circle-color'])
      }

      const pins = auctions.filter((a) => a.centroid_lat && a.centroid_lng)
      if (pins.length > 1) {
        const bounds = new mapboxgl.LngLatBounds()
        pins.forEach((a) => bounds.extend([a.centroid_lng!, a.centroid_lat!]))
        mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 12 })
      } else if (pins.length === 1) {
        mapRef.current.flyTo({
          center: [pins[0].centroid_lng!, pins[0].centroid_lat!],
          zoom: 10,
        })
      }
    } else {
      addClusterLayers()
    }
  }, [auctions, mapLoaded, colorMode])

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

      {/* Top-left controls */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-md px-3 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1.5"
          title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen map'}
        >
          {isFullscreen ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
              Exit
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

        {/* Satellite/Streets toggle */}
        <button
          onClick={toggleStyle}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-md px-3 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1.5"
          title={isSatellite ? 'Switch to streets' : 'Switch to satellite'}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          {isSatellite ? 'Streets' : 'Satellite'}
        </button>

        {/* Color mode toggle */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-md overflow-hidden shadow-sm">
          <button
            onClick={() => setColorMode('type')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              colorMode === 'type'
                ? 'bg-zw-navy-500 text-white'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            Type
          </button>
          <button
            onClick={() => setColorMode('zoning')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              colorMode === 'zoning'
                ? 'bg-zw-navy-500 text-white'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
            }`}
          >
            Zoning
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className={`absolute ${isFullscreen ? 'bottom-6 left-6' : 'bottom-3 left-3'} bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-md px-3 py-2 text-xs text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 z-20`}>
        {colorMode === 'type' ? (
          <>
            <div className="flex items-center gap-3">
              <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" /> Foreclosure</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" /> Tax Deed</span>
            </div>
            <div className="flex items-center gap-3 mt-1 pt-1 border-t border-gray-200 dark:border-slate-700">
              <span><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1 text-[8px] text-white text-center leading-3">n</span> &lt;10</span>
              <span><span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1 text-[8px] text-white text-center leading-3">n</span> 10-49</span>
              <span><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1 text-[8px] text-white text-center leading-3">n</span> 50+</span>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {(Object.entries(ZONING_CATEGORY_COLORS) as [ZoningCategory, typeof ZONING_CATEGORY_COLORS[ZoningCategory]][]).map(([cat, colors]) => (
              <span key={cat} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: colors.hex }} />
                {cat}
              </span>
            ))}
          </div>
        )}
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
