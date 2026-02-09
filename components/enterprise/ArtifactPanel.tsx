'use client'

import { useEffect, useRef, useState } from 'react'
import { Artifact } from '@/types'
import { useTheme } from '@/lib/theme-context'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface ArtifactPanelProps {
  artifact: Artifact | null
  artifacts: Artifact[]
  onSelectArtifact: (artifact: Artifact) => void
  onClose: () => void
}

export default function ArtifactPanel({ artifact, artifacts, onSelectArtifact, onClose }: ArtifactPanelProps) {
  const [viewMode, setViewMode] = useState<'map' | 'data' | 'report'>('map')
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    mapboxgl.accessToken = MAPBOX_TOKEN
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: [-81.5, 27.6], zoom: 6, pitch: 0, bearing: 0
    })
    map.current.on('load', () => {
      setMapLoaded(true)
      map.current?.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.current?.addSource('zoning-polygons', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.current?.addLayer({
        id: 'zoning-fill', type: 'fill', source: 'zoning-polygons',
        paint: {
          'fill-color': ['match', ['get', 'zone_type'],
            'residential', '#1E3A5F', 'commercial', '#f59e0b', 'industrial', '#8b5cf6',
            'agricultural', '#22c55e', 'mixed-use', '#3b82f6', '#6b7280'],
          'fill-opacity': 0.4
        }
      })
      map.current?.addLayer({ id: 'zoning-outline', type: 'line', source: 'zoning-polygons', paint: { 'line-color': '#1E3A5F', 'line-width': 2 } })
    })
    return () => { map.current?.remove(); map.current = null }
  }, [])

  // Update map style when theme changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.setStyle(theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11')
    }
  }, [theme, mapLoaded])

  useEffect(() => {
    if (!mapLoaded || !map.current || !artifact) return
    if (artifact.type === 'map' && artifact.data?.geometry) {
      const source = map.current.getSource('zoning-polygons') as mapboxgl.GeoJSONSource
      if (source) {
        source.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: artifact.data.geometry, properties: { zone_type: artifact.data.zoneType || 'residential', zone_code: artifact.data.zoneCode, jurisdiction: artifact.data.jurisdiction } }] })
      }
      if (artifact.metadata?.bounds) map.current.fitBounds(artifact.metadata.bounds, { padding: 50, duration: 1000 })
      else if (artifact.metadata?.coordinates) map.current.flyTo({ center: artifact.metadata.coordinates, zoom: 14, duration: 1000 })
    }
  }, [artifact, mapLoaded])

  const panelBg = "bg-white dark:bg-slate-900"
  const borderColor = "border-gray-200 dark:border-slate-800"
  const cardBg = "bg-gray-50 dark:bg-slate-800/50"
  const cardBorder = "border-gray-200 dark:border-slate-700"
  const headingText = "text-gray-800 dark:text-slate-200"
  const bodyText = "text-gray-700 dark:text-slate-300"
  const mutedText = "text-gray-400 dark:text-slate-500"
  const overlayBg = "bg-white/90 dark:bg-slate-900/90"

  if (!artifact && artifacts.length === 0) {
    return (
      <div className={`w-[480px] ${panelBg} border-l ${borderColor} flex flex-col transition-colors`}>
        <div className={`h-14 px-4 flex items-center justify-between border-b ${borderColor}`}>
          <h3 className={`font-medium ${headingText}`}>Artifact Panel</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className={`w-20 h-20 ${cardBg} rounded-2xl flex items-center justify-center mb-6 border ${cardBorder}`}>
            <svg className={`w-10 h-10 text-gray-300 dark:text-slate-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h4 className={`text-lg font-medium ${bodyText} mb-2`}>No Artifact Selected</h4>
          <p className={`text-sm ${mutedText} text-center max-w-xs`}>Ask a zoning question to see maps, tables, and data visualizations here.</p>
        </div>
        <div className={`h-64 border-t ${borderColor} relative`}>
          <div ref={mapContainer} className="absolute inset-0" />
          <div className={`absolute bottom-3 left-3 ${overlayBg} backdrop-blur px-3 py-1.5 rounded-lg border ${cardBorder}`}>
            <span className={`text-xs ${mutedText}`}>Florida</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-[480px] ${panelBg} border-l ${borderColor} flex flex-col transition-colors`}>
      <div className={`h-14 px-4 flex items-center justify-between border-b ${borderColor}`}>
        <div className="flex items-center gap-3">
          <h3 className={`font-medium ${headingText} truncate`}>{artifact?.title || 'Artifact'}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex ${cardBg} rounded-lg p-0.5 border ${cardBorder}`}>
            {(['map', 'data', 'report'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === mode ? 'bg-zw-navy-600 text-white' : `${mutedText} hover:text-gray-700 dark:hover:text-slate-200`}`}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <svg className={`w-4 h-4 ${mutedText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'map' && (
          <div className="h-full relative">
            <div ref={mapContainer} className="absolute inset-0" />
            {artifact?.metadata?.jurisdiction && (
              <div className={`absolute top-3 left-3 ${overlayBg} backdrop-blur px-4 py-2 rounded-lg border ${cardBorder}`}>
                <p className={`text-xs ${mutedText}`}>Jurisdiction</p>
                <p className={`text-sm font-medium ${headingText}`}>{artifact.metadata.jurisdiction}</p>
              </div>
            )}
          </div>
        )}
        {viewMode === 'data' && artifact && (
          <div className="h-full overflow-y-auto p-4">
            <DataView artifact={artifact} />
          </div>
        )}
        {viewMode === 'report' && artifact && (
          <div className="h-full overflow-y-auto p-4">
            <ReportView artifact={artifact} />
          </div>
        )}
      </div>

      {artifacts.length > 1 && (
        <div className={`border-t ${borderColor} p-3`}>
          <p className={`text-xs ${mutedText} mb-2`}>All Artifacts ({artifacts.length})</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {artifacts.map((a) => (
              <button key={a.id} onClick={() => onSelectArtifact(a)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  artifact?.id === a.id
                    ? 'bg-zw-navy-50 dark:bg-zw-navy-600/20 border-zw-navy-200 dark:border-zw-navy-500/50 text-zw-navy-700 dark:text-slate-100'
                    : `${cardBg} ${cardBorder} ${bodyText} hover:border-gray-300 dark:hover:border-slate-600`
                }`}>
                <span className="text-xs font-medium truncate max-w-[100px]">{a.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`p-3 border-t ${borderColor} flex items-center gap-2`}>
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zw-navy-600 hover:bg-zw-navy-700 text-white rounded-lg text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </button>
        <button className={`p-2 ${cardBg} hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors border ${cardBorder}`}>
          <svg className={`w-5 h-5 ${bodyText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function DataView({ artifact }: { artifact: Artifact }) {
  const data = artifact.data || {}
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Zone Information</h4>
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Zone Code" value={data.zoneCode || '-'} />
          <InfoItem label="Jurisdiction" value={data.jurisdiction || '-'} />
          <InfoItem label="Zone Name" value={data.zoneName || '-'} />
          <InfoItem label="Zone Type" value={data.zoneType || '-'} />
        </div>
      </div>
      {data.setbacks && (
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Setback Requirements</h4>
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Front" value={`${data.setbacks.front} ft`} highlight />
            <InfoItem label="Side" value={`${data.setbacks.side} ft`} highlight />
            <InfoItem label="Rear" value={`${data.setbacks.rear} ft`} highlight />
            <InfoItem label="Corner" value={`${data.setbacks.corner || data.setbacks.side} ft`} highlight />
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-zw-navy-600 dark:text-zw-navy-400' : 'text-gray-800 dark:text-slate-200'}`}>{value}</p>
    </div>
  )
}

function ReportView({ artifact }: { artifact: Artifact }) {
  const data = artifact.data || {}
  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{artifact.title}</h3>
        <p className="text-sm text-gray-400 dark:text-slate-400 mt-1">
          Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <h4>Zone Summary</h4>
        <p>The <strong>{data.zoneCode}</strong> zone in <strong>{data.jurisdiction}</strong> is classified as <strong>{data.zoneName || data.zoneType}</strong>.</p>
        {data.setbacks && (<><h4>Setback Requirements</h4><ul><li><strong>Front:</strong> {data.setbacks.front} ft</li><li><strong>Side:</strong> {data.setbacks.side} ft</li><li><strong>Rear:</strong> {data.setbacks.rear} ft</li></ul></>)}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
          <p className="text-amber-800 dark:text-amber-200 text-xs m-0">
            <strong>Disclaimer:</strong> This information is for guidance only. Always verify with the local Planning Department before making development decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
