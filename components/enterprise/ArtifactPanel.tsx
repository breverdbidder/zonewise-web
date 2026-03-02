'use client'

import { useEffect, useRef, useState } from 'react'
import { Artifact } from '@/types'
import { useTheme } from '@/lib/theme-context'
import { OnboardingTooltip } from '@/components/onboarding'


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
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const { theme } = useTheme()

  // Initialize map — dynamic import to avoid SSR crash
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    if (!MAPBOX_TOKEN) {
      setMapError('Mapbox token not configured')
      return
    }

    let cancelled = false

    import('mapbox-gl').then((mapboxglModule) => {
      if (cancelled || !mapContainer.current) return
      const mapboxgl = mapboxglModule.default
      import('mapbox-gl/dist/mapbox-gl.css')

      mapboxgl.accessToken = MAPBOX_TOKEN

      try {
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

        mapRef.current.on('error', (e: any) => {
          console.error('Map error:', e)
        })
      } catch (err) {
        setMapError('Failed to initialize map')
      }
    }).catch(() => {
      setMapError('Failed to load map library')
    })

    return () => {
      cancelled = true
      markerRef.current?.remove()
      mapRef.current?.remove()
      mapRef.current = null
      setMapLoaded(false)
    }
  }, [])

  // Satellite style doesn't change with theme — no-op
  useEffect(() => {}, [theme, mapLoaded])

  // Update map when artifact changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    // Remove old marker
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }

    if (!artifact?.metadata?.coordinates) return

    import('mapbox-gl').then((mapboxglModule) => {
      if (!mapRef.current) return
      const mapboxgl = mapboxglModule.default
      const coords = artifact.metadata!.coordinates!
      const zoom = (artifact.metadata as any)?.zoom || 13

      // Create custom marker
      const el = document.createElement('div')
      el.innerHTML = `<div style="
        width: 32px; height: 32px;
        background: linear-gradient(135deg, #2A4F7A, #1E3A5F);
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      "><span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 12px;">Z</span></div>`

      markerRef.current = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .addTo(mapRef.current)

      // Add popup with zone info
      if (artifact.data?.zoneCode) {
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setHTML(`
            <div style="padding: 8px; font-family: Arial, sans-serif;">
              <strong style="color: #1E3A5F; font-size: 14px;">${artifact.data.zoneCode}</strong>
              <div style="color: #666; font-size: 12px;">${artifact.data.zoneName || ''}</div>
              <div style="color: #888; font-size: 11px;">${artifact.data.jurisdiction || ''}</div>
            </div>
          `)
        markerRef.current.setPopup(popup).togglePopup()
      }

      mapRef.current.flyTo({ center: coords, zoom, duration: 1200 })
    })
  }, [artifact, mapLoaded])

  const panelBg = "bg-white dark:bg-slate-900"
  const borderColor = "border-gray-200 dark:border-slate-800"
  const cardBg = "bg-gray-50 dark:bg-slate-800/50"
  const cardBorder = "border-gray-200 dark:border-slate-700"
  const headingText = "text-gray-800 dark:text-slate-200"
  const bodyText = "text-gray-700 dark:text-slate-300"
  const mutedText = "text-gray-400 dark:text-slate-500"
  const overlayBg = "bg-white/90 dark:bg-slate-900/90"

  // Empty state
  if (!artifact && artifacts.length === 0) {
    return (
      <div className={`w-[480px] ${panelBg} border-l ${borderColor} flex flex-col transition-colors`}>
        <div className={`h-14 px-4 flex items-center border-b ${borderColor}`}>
          <h3 className={`font-medium ${headingText}`}>Artifact Panel</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className={`w-20 h-20 ${cardBg} rounded-2xl flex items-center justify-center mb-6 border ${cardBorder}`}>
            <svg className="w-10 h-10 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h4 className={`text-lg font-medium ${bodyText} mb-2`}>No Artifact Selected</h4>
          <p className={`text-sm ${mutedText} text-center max-w-xs`}>Ask a zoning question to see maps, data, and reports here.</p>
        </div>
        {/* Default Florida map */}
        <div className={`h-64 border-t ${borderColor} relative`}>
          {mapError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className={`text-sm ${mutedText}`}>{mapError}</p>
            </div>
          ) : (
            <div ref={mapContainer} className="absolute inset-0" />
          )}
          <div className={`absolute bottom-3 left-3 ${overlayBg} backdrop-blur px-3 py-1.5 rounded-lg border ${cardBorder}`}>
            <span className={`text-xs ${mutedText}`}>Florida — 67 Counties</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-[480px] ${panelBg} border-l ${borderColor} flex flex-col transition-colors`}>
      {/* Onboarding Tooltip */}
      <OnboardingTooltip />
      
      {/* Header */}
      <div className={`h-14 px-4 flex items-center justify-between border-b ${borderColor}`}>
        <h3 className={`font-medium ${headingText} truncate flex-1 mr-3`}>{artifact?.title || 'Artifact'}</h3>
        <div className="flex items-center gap-2">
          <div className={`flex ${cardBg} rounded-lg p-0.5 border ${cardBorder}`}>
            {(['map', 'data', 'report'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === mode ? 'bg-zw-navy-600 text-white' : `${mutedText} hover:text-gray-700 dark:hover:text-slate-200`
                }`}>
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

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'map' && (
          <div className="h-full relative">
            {mapError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className={`text-sm ${mutedText}`}>{mapError}</p>
              </div>
            ) : (
              <div ref={mapContainer} className="absolute inset-0" />
            )}
            {/* Info overlay */}
            {artifact?.data?.zoneCode && (
              <div className={`absolute top-3 left-3 ${overlayBg} backdrop-blur px-4 py-3 rounded-xl border ${cardBorder} max-w-[240px]`}>
                <p className="text-xs text-zw-navy-500 font-semibold uppercase tracking-wide">Zone</p>
                <p className={`text-lg font-bold ${headingText}`}>{artifact.data.zoneCode}</p>
                {artifact.data.zoneName && <p className={`text-sm ${bodyText}`}>{artifact.data.zoneName}</p>}
                {artifact.metadata?.jurisdiction && <p className={`text-xs ${mutedText} mt-1`}>{artifact.metadata.jurisdiction}, {artifact.data.county || 'FL'}</p>}
              </div>
            )}
            {/* Quick stats overlay */}
            {artifact?.data?.setbacks && (
              <div className={`absolute bottom-3 left-3 right-3 ${overlayBg} backdrop-blur px-4 py-3 rounded-xl border ${cardBorder}`}>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className={`text-xs ${mutedText}`}>Front</p>
                    <p className={`text-sm font-bold text-zw-navy-600 dark:text-zw-navy-400`}>{artifact.data.setbacks.front || '—'}ft</p>
                  </div>
                  <div>
                    <p className={`text-xs ${mutedText}`}>Side</p>
                    <p className={`text-sm font-bold text-zw-navy-600 dark:text-zw-navy-400`}>{artifact.data.setbacks.side || '—'}ft</p>
                  </div>
                  <div>
                    <p className={`text-xs ${mutedText}`}>Rear</p>
                    <p className={`text-sm font-bold text-zw-navy-600 dark:text-zw-navy-400`}>{artifact.data.setbacks.rear || '—'}ft</p>
                  </div>
                  <div>
                    <p className={`text-xs ${mutedText}`}>Height</p>
                    <p className={`text-sm font-bold text-zw-navy-600 dark:text-zw-navy-400`}>{artifact.data.maxHeight || '—'}ft</p>
                  </div>
                </div>
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

      {/* Artifacts list */}
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
                <TypeIcon type={a.type} />
                <span className="text-xs font-medium truncate max-w-[100px]">{a.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
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

function TypeIcon({ type }: { type: string }) {
  const cls = "w-4 h-4 text-zw-navy-500"
  if (type === 'map') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  if (type === 'table') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
  return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
}

function DataView({ artifact }: { artifact: Artifact }) {
  const data = artifact.data || {}
  const cardCls = "bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 p-4"

  return (
    <div className="space-y-4">
      {/* Zone info */}
      <div className={cardCls}>
        <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Zone Information</h4>
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Zone Code" value={data.zoneCode || '—'} />
          <InfoItem label="Jurisdiction" value={data.jurisdiction || '—'} />
          <InfoItem label="Zone Name" value={data.zoneName || '—'} />
          <InfoItem label="Category" value={data.zoneType || '—'} />
          {data.county && <InfoItem label="County" value={data.county} />}
        </div>
      </div>

      {/* Setbacks */}
      {data.setbacks && (
        <div className={cardCls}>
          <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Setback Requirements</h4>
          <div className="grid grid-cols-3 gap-3">
            <InfoItem label="Front" value={data.setbacks.front ? `${data.setbacks.front} ft` : '—'} highlight />
            <InfoItem label="Side" value={data.setbacks.side ? `${data.setbacks.side} ft` : '—'} highlight />
            <InfoItem label="Rear" value={data.setbacks.rear ? `${data.setbacks.rear} ft` : '—'} highlight />
          </div>
        </div>
      )}

      {/* Building standards */}
      {(data.maxHeight || data.coverage || data.far || data.lotSize) && (
        <div className={cardCls}>
          <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Building Standards</h4>
          <div className="grid grid-cols-2 gap-3">
            {data.maxHeight && <InfoItem label="Max Height" value={`${data.maxHeight} ft`} highlight />}
            {data.maxStories && <InfoItem label="Max Stories" value={`${data.maxStories}`} />}
            {data.coverage && <InfoItem label="Lot Coverage" value={`${data.coverage}%`} />}
            {data.far && <InfoItem label="FAR" value={`${data.far}`} />}
            {data.lotSize?.min && <InfoItem label="Min Lot Size" value={`${Number(data.lotSize.min).toLocaleString()} sf`} />}
            {data.maxDensity && <InfoItem label="Max Density" value={`${data.maxDensity} du/acre`} />}
          </div>
        </div>
      )}

      {/* Permitted uses */}
      {data.permittedUses && data.permittedUses.length > 0 && (
        <div className={cardCls}>
          <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Permitted Uses ({data.permittedUses.length})</h4>
          <div className="flex flex-wrap gap-2">
            {data.permittedUses.map((use: string, i: number) => (
              <span key={i} className="px-2 py-1 bg-zw-navy-50 dark:bg-zw-navy-600/20 text-zw-navy-700 dark:text-zw-navy-300 text-xs rounded-md border border-zw-navy-200 dark:border-zw-navy-500/20">
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
        {data.zoneCode && (
          <>
            <h4>Zone Summary</h4>
            <p>The <strong>{data.zoneCode}</strong> zone in <strong>{data.jurisdiction}</strong>{data.county ? `, ${data.county} County` : ''} is classified as <strong>{data.zoneName || data.zoneType || 'General'}</strong>.</p>
          </>
        )}
        {data.setbacks && (
          <>
            <h4>Setback Requirements</h4>
            <p>Front setback: <strong>{data.setbacks.front || 'N/A'} ft</strong> | Side: <strong>{data.setbacks.side || 'N/A'} ft</strong> | Rear: <strong>{data.setbacks.rear || 'N/A'} ft</strong></p>
          </>
        )}
        {data.maxHeight && (
          <>
            <h4>Building Height</h4>
            <p>Maximum building height is <strong>{data.maxHeight} ft</strong>{data.maxStories ? ` (${data.maxStories} stories)` : ''}.</p>
          </>
        )}
        {data.permittedUses && data.permittedUses.length > 0 && (
          <>
            <h4>Permitted Uses ({data.permittedUses.length})</h4>
            <p>{data.permittedUses.join(', ')}</p>
          </>
        )}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
          <p className="text-amber-800 dark:text-amber-200 text-xs m-0">
            <strong>Disclaimer:</strong> This information is for guidance only. Always verify with the local Planning Department.
          </p>
        </div>
      </div>
    </div>
  )
}
