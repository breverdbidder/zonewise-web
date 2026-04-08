'use client'

import { useEffect, useRef, useState } from 'react'

interface Photorealistic3DViewerProps {
  parcelId: string
  lat: number
  lng: number
  zoom?: number
  parcelGeoJson?: GeoJSON.FeatureCollection | null
}

/**
 * Loads CesiumJS from CDN (avoids bundler zip.js resolution issues).
 * Returns the global Cesium object once loaded.
 */
function loadCesiumFromCDN(): Promise<typeof import('cesium')> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as Record<string, unknown>).Cesium) {
      return resolve((window as Record<string, unknown>).Cesium as typeof import('cesium'))
    }

    // Load CSS
    if (!document.querySelector('link[href*="cesium"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/Widgets/widgets.css'
      document.head.appendChild(link)
    }

    // Load JS
    const script = document.createElement('script')
    script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.115/Build/Cesium/Cesium.js'
    script.onload = () => {
      const Cesium = (window as Record<string, unknown>).Cesium as typeof import('cesium')
      if (Cesium) resolve(Cesium)
      else reject(new Error('CesiumJS loaded but global not found'))
    }
    script.onerror = () => reject(new Error('Failed to load CesiumJS from CDN'))
    document.head.appendChild(script)
  })
}

export default function Photorealistic3DViewer({
  parcelId,
  lat,
  lng,
  zoom = 800,
  parcelGeoJson,
}: Photorealistic3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false

    async function initViewer() {
      try {
        const Cesium = await loadCesiumFromCDN()

        if (destroyed || !containerRef.current) return

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
        if (!apiKey) {
          setError('GOOGLE_API_KEY not configured. Set NEXT_PUBLIC_GOOGLE_API_KEY in environment.')
          setLoading(false)
          return
        }

        const viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          requestRenderMode: true,
          maximumRenderTimeChange: Infinity,
        })

        viewerRef.current = viewer

        // Remove default globe — Google 3D tiles include imagery
        viewer.scene.globe.show = false

        // Load Google Photorealistic 3D Tiles
        try {
          const tileset = await Cesium.Cesium3DTileset.fromUrl(
            `https://tile.googleapis.com/v1/3dtiles/root.json?key=${apiKey}`
          )
          viewer.scene.primitives.add(tileset)
        } catch (tileError) {
          console.error('Failed to load 3D tiles:', tileError)
          setError('Failed to load Google 3D Tiles. Check API key and billing.')
          setLoading(false)
          return
        }

        // Fly to parcel location (3s ease)
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lng, lat, zoom),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
          duration: 3,
        })

        // Overlay parcel polygon as red outline
        if (parcelGeoJson) {
          const dataSource = await Cesium.GeoJsonDataSource.load(parcelGeoJson, {
            stroke: Cesium.Color.RED,
            strokeWidth: 3,
            fill: Cesium.Color.RED.withAlpha(0.1),
            clampToGround: true,
          })
          viewer.dataSources.add(dataSource)
        }

        setLoading(false)
      } catch (err) {
        console.error('CesiumJS initialization error:', err)
        setError(`Failed to initialize 3D viewer: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setLoading(false)
      }
    }

    initViewer()

    return () => {
      destroyed = true
      const viewer = viewerRef.current as { isDestroyed?: () => boolean; destroy?: () => void } | null
      if (viewer && !viewer.isDestroyed?.()) {
        viewer.destroy?.()
        viewerRef.current = null
      }
    }
  }, [lat, lng, zoom, parcelGeoJson])

  return (
    <div className="relative w-full h-full" style={{ minHeight: '400px' }}>
      {/* Navy branded chrome bezel */}
      <div className="absolute inset-0 border-2 border-[#1E3A5F] rounded-lg overflow-hidden z-0">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Loading state */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-300 text-sm">Loading 3D tiles...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 rounded-lg z-10">
          <div className="text-center max-w-md px-6">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-red-400 text-xl">!</span>
            </div>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Parcel ID badge */}
      <div className="absolute top-3 left-3 bg-[#1E3A5F]/90 backdrop-blur-sm px-3 py-1.5 rounded-md z-20">
        <span className="text-[#F59E0B] text-xs font-mono">{parcelId}</span>
      </div>
    </div>
  )
}
