'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import ExplorerChat from './ExplorerChat'
import ExplorerMobileSheet from './ExplorerMobileSheet'
import type { ExplorerMapHandle } from './ExplorerMap'
import type { ChoroplethGeoJSON } from '@/lib/explorer/zillow'
import {
  ZONING_FILTERS, FREE_PARCEL_CLICKS, FREE_CHAT_MESSAGES,
  type ChoroplethMetric, type ZoningFilter,
} from '@/lib/explorer/constants'
import type { ParcelAttributes } from '@/lib/explorer/constants'
import ChoroplethLayer from './ChoroplethLayer'
import LayerControls from './LayerControls'
import ZoningLegend from './ZoningLegend'
import ParcelIdentify from './ParcelIdentify'
import { trackEvent } from '@/lib/explorer/tracking'

const ExplorerMap = dynamic(() => import('./ExplorerMap'), { ssr: false, loading: () => null })

// ── Upgrade Modal ─────────────────────────────────────────────────────────────
function UpgradeModal({ reason, onClose }: { reason: 'parcel' | 'chat'; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="text-4xl mb-3 text-center">{reason === 'parcel' ? '🗺️' : '💬'}</div>
        <h2 className="text-lg font-bold text-white text-center mb-2">
          {reason === 'parcel'
            ? 'Unlock unlimited parcel intelligence'
            : 'Continue the conversation'}
        </h2>
        <p className="text-sm text-slate-400 text-center mb-4 leading-relaxed">
          {reason === 'parcel'
            ? `You've used your ${FREE_PARCEL_CLICKS} free parcel clicks. Upgrade to Pro for unlimited access to Brevard's 262K+ parcels.`
            : `You've used your ${FREE_CHAT_MESSAGES} free AI messages. Upgrade to Pro for unlimited ZoneWise AI chat.`}
        </p>
        <div className="space-y-2">
          <a
            href="/pricing"
            onClick={() => trackEvent({ event: 'cta_clicked', cta_label: 'upgrade_modal_pricing' })}
            className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 text-slate-950 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
          >
            See Plans — From $39/mo
          </a>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-slate-500 text-sm hover:text-slate-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
          {['Unlimited parcel clicks', 'Unlimited AI chat', 'Zoning filters', 'Export CSV/PDF'].map(f => (
            <div key={f} className="flex items-center gap-1.5">
              <span className="text-amber-500">✓</span> {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ExplorerV2 ───────────────────────────────────────────────────────────
export default function ExplorerV2() {
  const mapRef = useRef<ExplorerMapHandle>(null)

  // Choropleth state
  const [choroplethData, setChoroplethData] = useState<ChoroplethGeoJSON | null>(null)
  const [choroplethMetric, setChoroplethMetric] = useState<ChoroplethMetric>('zhvi')
  const [choroplethVisible, setChoroplethVisible] = useState(true)

  // Layer / filter state
  const [zoningFilter, setZoningFilter] = useState<ZoningFilter>('all')
  const [layers, setLayers] = useState({ parcels: true, zoning: true, flu: false })

  // Conversion gate state (persisted in localStorage)
  const [parcelClicks, setParcelClicks] = useState(0)
  const [chatCount, setChatCount] = useState(0)
  const [gateModal, setGateModal] = useState<'parcel' | 'chat' | null>(null)

  // Selected parcel
  const [selectedParcel, setSelectedParcel] = useState<ParcelAttributes | null>(null)

  // Active map style
  const [mapStyle, setMapStyle] = useState<'streets-v12' | 'satellite-streets-v12' | 'light-v11'>('streets-v12')

  // ── Load counters from localStorage ──────────────────────────────────────
  useEffect(() => {
    try {
      const todayKey = new Date().toISOString().split('T')[0]
      const pc = parseInt(localStorage.getItem(`zw_parcels_${todayKey}`) || '0')
      const cc = parseInt(localStorage.getItem(`zw_chat_${todayKey}`) || '0')
      setParcelClicks(pc)
      setChatCount(cc)
    } catch {}
  }, [])

  // ── Persist counters ──────────────────────────────────────────────────────
  const persistParcelClicks = useCallback((n: number) => {
    try {
      const todayKey = new Date().toISOString().split('T')[0]
      localStorage.setItem(`zw_parcels_${todayKey}`, String(n))
    } catch {}
  }, [])

  const persistChatCount = useCallback((n: number) => {
    try {
      const todayKey = new Date().toISOString().split('T')[0]
      localStorage.setItem(`zw_chat_${todayKey}`, String(n))
    } catch {}
  }, [])

  // ── Fetch choropleth data ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/explorer/zillow')
      .then(r => r.json())
      .then(data => setChoroplethData(data))
      .catch(() => {}) // fail silently — choropleth stays empty
  }, [])

  // ── Parcel click handler ──────────────────────────────────────────────────
  const handleParcelClick = useCallback((parcel: ParcelAttributes) => {
    const next = parcelClicks + 1
    setParcelClicks(next)
    persistParcelClicks(next)
    setSelectedParcel(parcel)
    trackEvent({ event: 'parcel_click', parcel_id: parcel.PARCEL_ID, zip: parcel.ZIP_CODE })
    if (next > FREE_PARCEL_CLICKS) {
      setGateModal('parcel')
      trackEvent({ event: 'upgrade_modal_shown' })
    }
  }, [parcelClicks, persistParcelClicks])

  const handleChatCountChange = useCallback((n: number) => {
    setChatCount(n)
    persistChatCount(n)
  }, [persistChatCount])

  const handleGate = useCallback(() => {
    setGateModal(chatCount >= FREE_CHAT_MESSAGES ? 'chat' : 'parcel')
  }, [chatCount])

  return (
    <div className="flex h-full bg-slate-950 overflow-hidden">
      {/* ── LEFT: Chat Panel (desktop only) ──────────────────────────────── */}
      <div className="w-[360px] shrink-0 hidden lg:flex flex-col border-r border-slate-800">
        <ExplorerChat
          mapRef={mapRef}
          chatCount={chatCount}
          onChatCountChange={handleChatCountChange}
          onGate={handleGate}
        />
      </div>

      {/* ── RIGHT: Map + controls ─────────────────────────────────────────── */}
      <div className="flex-1 relative flex flex-col">
        {/* Map style switcher */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          {(['streets-v12', 'satellite-streets-v12', 'light-v11'] as const).map(s => {
            const labels = { 'streets-v12': 'Streets', 'satellite-streets-v12': 'Satellite', 'light-v11': 'Light' }
            return (
              <button
                key={s}
                onClick={() => setMapStyle(s)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold backdrop-blur-sm shadow-sm transition-all border ${
                  mapStyle === s
                    ? 'bg-amber-500 border-amber-500 text-slate-950'
                    : 'bg-white/90 border-slate-300 text-slate-700 hover:bg-amber-500/10 hover:border-amber-500/50'
                }`}
              >
                {labels[s]}
              </button>
            )
          })}
        </div>

        {/* Choropleth metric selector */}
        <div className="absolute top-3 right-3 z-10">
          <ChoroplethLayer
            metric={choroplethMetric}
            visible={choroplethVisible}
            onMetricChange={m => { setChoroplethMetric(m); mapRef.current?.setChoroplethMetric(m) }}
            onVisibleChange={v => setChoroplethVisible(v)}
          />
        </div>

        {/* Map */}
        <div className="flex-1">
          <ExplorerMap
            ref={mapRef}
            onParcelClick={handleParcelClick}
            choroplethData={choroplethData}
            choroplethMetric={choroplethMetric}
            choroplethVisible={choroplethVisible}
            zoningFilter={zoningFilter}
            mapStyle={mapStyle}
          />
        </div>

        {/* Bottom controls bar */}
        <div className="absolute bottom-8 left-3 right-3 z-10 flex items-end gap-2 pointer-events-none">
          {/* Layer controls */}
          <div className="pointer-events-auto">
            <LayerControls
              layers={layers}
              choroplethVisible={choroplethVisible}
              onToggleLayer={(id, on, key) => {
                setLayers(l => ({ ...l, [key]: on }))
                mapRef.current?.toggleLayer(id, on)
              }}
              onToggleChoropleth={v => setChoroplethVisible(v)}
            />
          </div>

          {/* Zoning filter */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 backdrop-blur-sm pointer-events-auto">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Zone Filter</div>
            <select
              value={zoningFilter}
              onChange={e => setZoningFilter(e.target.value as ZoningFilter)}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500/60 w-full"
            >
              {ZONING_FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Selected parcel detail card */}
          {selectedParcel && (
            <div className="flex-1 pointer-events-auto max-w-[280px]">
              <ParcelIdentify
                parcel={selectedParcel}
                onClose={() => setSelectedParcel(null)}
              />
            </div>
          )}

          {/* Zoning legend when no parcel selected */}
          {!selectedParcel && (
            <div className="pointer-events-auto">
              <ZoningLegend />
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="absolute bottom-2 left-3 right-3 z-10 pointer-events-none">
          <div className="text-[10px] text-slate-600 text-center">
            262K parcels · 27 ZIPs · Brevard County, FL
            {parcelClicks > 0 && ` · ${Math.max(0, FREE_PARCEL_CLICKS - parcelClicks)} clicks left`}
          </div>
        </div>
      </div>

      {/* ── MOBILE: Bottom sheet ──────────────────────────────────────────── */}
      <div className="lg:hidden">
        <ExplorerMobileSheet
          mapRef={mapRef}
          chatCount={chatCount}
          onChatCountChange={handleChatCountChange}
          onGate={handleGate}
        />
      </div>

      {/* ── Upgrade Modal ─────────────────────────────────────────────────── */}
      {gateModal && (
        <UpgradeModal reason={gateModal} onClose={() => setGateModal(null)} />
      )}
    </div>
  )
}
