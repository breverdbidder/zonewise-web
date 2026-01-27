'use client'

import { useEffect, useRef, useState } from 'react'
import { Artifact } from '@/types'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Mapbox token from environment
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface ArtifactPanelProps {
  artifact: Artifact | null
  artifacts: Artifact[]
  onSelectArtifact: (artifact: Artifact) => void
  onClose: () => void
}

export default function ArtifactPanel({
  artifact,
  artifacts,
  onSelectArtifact,
  onClose
}: ArtifactPanelProps) {
  const [viewMode, setViewMode] = useState<'map' | 'data' | 'report'>('map')
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return
    
    mapboxgl.accessToken = MAPBOX_TOKEN
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-80.7, 28.3], // Brevard County center
      zoom: 10,
      pitch: 0,
      bearing: 0
    })
    
    map.current.on('load', () => {
      setMapLoaded(true)
      
      // Add navigation controls
      map.current?.addControl(new mapboxgl.NavigationControl(), 'top-right')
      
      // Add zoning layer source (will be populated with data)
      map.current?.addSource('zoning-polygons', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })
      
      // Add fill layer for polygons
      map.current?.addLayer({
        id: 'zoning-fill',
        type: 'fill',
        source: 'zoning-polygons',
        paint: {
          'fill-color': [
            'match',
            ['get', 'zone_type'],
            'residential', '#14b8a6',
            'commercial', '#f59e0b',
            'industrial', '#8b5cf6',
            'agricultural', '#22c55e',
            'mixed-use', '#3b82f6',
            '#6b7280'
          ],
          'fill-opacity': 0.4
        }
      })
      
      // Add outline layer
      map.current?.addLayer({
        id: 'zoning-outline',
        type: 'line',
        source: 'zoning-polygons',
        paint: {
          'line-color': '#14b8a6',
          'line-width': 2
        }
      })
      
      // Add highlight layer
      map.current?.addLayer({
        id: 'zoning-highlight',
        type: 'fill',
        source: 'zoning-polygons',
        paint: {
          'fill-color': '#14b8a6',
          'fill-opacity': 0.6
        },
        filter: ['==', ['get', 'id'], '']
      })
    })
    
    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])
  
  // Update map when artifact changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !artifact) return
    
    if (artifact.type === 'map' && artifact.data?.geometry) {
      // Update source with new geometry
      const source = map.current.getSource('zoning-polygons') as mapboxgl.GeoJSONSource
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: artifact.data.geometry,
            properties: {
              zone_type: artifact.data.zoneType || 'residential',
              zone_code: artifact.data.zoneCode,
              jurisdiction: artifact.data.jurisdiction
            }
          }]
        })
      }
      
      // Fly to bounds if available
      if (artifact.metadata?.bounds) {
        map.current.fitBounds(artifact.metadata.bounds, {
          padding: 50,
          duration: 1000
        })
      } else if (artifact.metadata?.coordinates) {
        map.current.flyTo({
          center: artifact.metadata.coordinates,
          zoom: 14,
          duration: 1000
        })
      }
    }
  }, [artifact, mapLoaded])
  
  // Default view when no artifact
  if (!artifact && artifacts.length === 0) {
    return (
      <div className="w-[480px] bg-slate-900 border-l border-slate-800 flex flex-col">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800">
          <h3 className="font-medium text-slate-200">Artifact Panel</h3>
        </div>
        
        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 border border-slate-700">
            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-slate-300 mb-2">No Artifact Selected</h4>
          <p className="text-sm text-slate-500 text-center max-w-xs">
            Ask a zoning question to see maps, tables, and data visualizations here.
          </p>
        </div>
        
        {/* Map Preview (always visible) */}
        <div className="h-64 border-t border-slate-800 relative">
          <div ref={mapContainer} className="absolute inset-0" />
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400">Brevard County, FL</span>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-[480px] bg-slate-900 border-l border-slate-800 flex flex-col">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <ArtifactTypeIcon type={artifact?.type || 'map'} />
          <h3 className="font-medium text-slate-200 truncate">
            {artifact?.title || 'Artifact'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Tabs */}
          <div className="flex bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'map' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setViewMode('data')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'data' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Data
            </button>
            <button
              onClick={() => setViewMode('report')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'report' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Report
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'map' && (
          <div className="h-full relative">
            <div ref={mapContainer} className="absolute inset-0" />
            
            {/* Map Overlay Info */}
            {artifact?.metadata?.jurisdiction && (
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur px-4 py-2 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400">Jurisdiction</p>
                <p className="text-sm font-medium text-slate-200">{artifact.metadata.jurisdiction}</p>
              </div>
            )}
            
            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Zone Types</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-500 rounded-sm" />
                  <span className="text-xs text-slate-300">Residential</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-sm" />
                  <span className="text-xs text-slate-300">Commercial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-violet-500 rounded-sm" />
                  <span className="text-xs text-slate-300">Industrial</span>
                </div>
              </div>
            </div>
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
      
      {/* Artifacts List */}
      {artifacts.length > 1 && (
        <div className="border-t border-slate-800 p-3">
          <p className="text-xs text-slate-500 mb-2">All Artifacts ({artifacts.length})</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {artifacts.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelectArtifact(a)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  artifact?.id === a.id
                    ? 'bg-teal-600/20 border-teal-500/50 text-teal-100'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <ArtifactTypeIcon type={a.type} small />
                <span className="text-xs font-medium truncate max-w-[100px]">{a.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Action Bar */}
      <div className="p-3 border-t border-slate-800 flex items-center gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </button>
        <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
        <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ArtifactTypeIcon({ type, small = false }: { type: string; small?: boolean }) {
  const size = small ? 'w-4 h-4' : 'w-5 h-5'
  const color = 'text-teal-500'
  
  switch (type) {
    case 'map':
      return (
        <svg className={`${size} ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    case 'table':
      return (
        <svg className={`${size} ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    case 'comparison':
      return (
        <svg className={`${size} ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    default:
      return (
        <svg className={`${size} ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
  }
}

function DataView({ artifact }: { artifact: Artifact }) {
  const data = artifact.data || {}
  
  return (
    <div className="space-y-4">
      {/* Zone Info Card */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Zone Information</h4>
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Zone Code" value={data.zoneCode || '-'} />
          <InfoItem label="Jurisdiction" value={data.jurisdiction || '-'} />
          <InfoItem label="Zone Name" value={data.zoneName || '-'} />
          <InfoItem label="Zone Type" value={data.zoneType || '-'} />
        </div>
      </div>
      
      {/* Setbacks Card */}
      {data.setbacks && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Setback Requirements</h4>
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Front" value={`${data.setbacks.front} ft`} highlight />
            <InfoItem label="Side" value={`${data.setbacks.side} ft`} highlight />
            <InfoItem label="Rear" value={`${data.setbacks.rear} ft`} highlight />
            <InfoItem label="Corner" value={`${data.setbacks.corner || data.setbacks.side} ft`} highlight />
          </div>
        </div>
      )}
      
      {/* Building Standards */}
      {(data.maxHeight || data.maxDensity || data.coverage) && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Building Standards</h4>
          <div className="grid grid-cols-2 gap-3">
            {data.maxHeight && <InfoItem label="Max Height" value={`${data.maxHeight} ft`} highlight />}
            {data.maxDensity && <InfoItem label="Max Density" value={`${data.maxDensity} units/acre`} />}
            {data.coverage && <InfoItem label="Lot Coverage" value={`${data.coverage}%`} />}
            {data.lotSize?.min && <InfoItem label="Min Lot Size" value={`${data.lotSize.min.toLocaleString()} sf`} />}
          </div>
        </div>
      )}
      
      {/* Permitted Uses */}
      {data.permittedUses && data.permittedUses.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Permitted Uses</h4>
          <div className="flex flex-wrap gap-2">
            {data.permittedUses.map((use: string, i: number) => (
              <span key={i} className="px-2 py-1 bg-teal-600/20 text-teal-300 text-xs rounded-md border border-teal-500/20">
                {use}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-teal-400' : 'text-slate-200'}`}>{value}</p>
    </div>
  )
}

function ReportView({ artifact }: { artifact: Artifact }) {
  const data = artifact.data || {}
  
  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="text-center pb-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100">{artifact.title}</h3>
        <p className="text-sm text-slate-400 mt-1">
          Generated {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      {/* Report Content */}
      <div className="prose prose-invert prose-sm max-w-none">
        <h4>Zone Summary</h4>
        <p>
          The <strong>{data.zoneCode}</strong> zone in <strong>{data.jurisdiction}</strong> is classified as{' '}
          <strong>{data.zoneName || data.zoneType}</strong>.
        </p>
        
        {data.setbacks && (
          <>
            <h4>Setback Requirements</h4>
            <ul>
              <li><strong>Front setback:</strong> {data.setbacks.front} feet</li>
              <li><strong>Side setback:</strong> {data.setbacks.side} feet</li>
              <li><strong>Rear setback:</strong> {data.setbacks.rear} feet</li>
            </ul>
          </>
        )}
        
        {data.maxHeight && (
          <>
            <h4>Building Height</h4>
            <p>Maximum building height is <strong>{data.maxHeight} feet</strong>.</p>
          </>
        )}
        
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-amber-200 text-xs m-0">
            <strong>⚠️ Disclaimer:</strong> This information is for guidance only. Always verify with the local Planning Department before making development decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
