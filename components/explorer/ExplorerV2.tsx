'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import ExplorerChat from './ExplorerChat'
import ExplorerMobileSheet from './ExplorerMobileSheet'
import type { ExplorerMapHandle } from './ExplorerMap'
import type { ChoroplethGeoJSON } from '@/lib/explorer/zillow'
import {
  CHOROPLETH_METRICS, ZONING_FILTERS, FREE_PARCEL_CLICKS, FREE_CHAT_MESSAGES,
  ZONING_LABELS, getZoningColor,
  type ChoroplethMetric, type ZoningFilter,
} from '@/lib/explorer/constants'
import type { ParcelAttributes } from '@/lib/explorer/constants'
import { formatCurrency, formatAddress } from '@/lib/explorer/constants'

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
            className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 text-slate-950 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
          >
            Start Free Trial — $29/mo
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

// ── Parcel Detail Sidebar Panel ────────────────────────────────────────────────
function ParcelPanel({ parcel }: { parcel: ParcelAttributes }) {
  const addr = formatAddress(parcel)
  const pid = parcel.PARCEL_ID || ''
  const pidEnc = encodeURIComponent(pid)

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-white leading-tight">{addr || 'Unknown Address'}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{(parcel.CITY || '').trim()}, FL {parcel.ZIP_CODE || ''}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{pid} · {(parcel.USE_CODE_DESCRIPTION || '').trim()}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Building', value: formatCurrency(parcel.BLDG_VALUE) },
          { label: 'Land', value: formatCurrency(parcel.LAND_VALUE) },
          { label: 'Living Area', value: `${parseInt(parcel.LIV_AREA) || '—'} sqft` },
          { label: 'Lot', value: `${parseFloat(parcel.ACRES)?.toFixed(2) || '—'} ac` },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-md p-2.5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-md p-2.5">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Owner</div>
        <div className="text-sm font-semibold text-white">{parcel.OWNER_NAME1 || '—'}</div>
        {parcel.OWNER_NAME2 && <div className="text-xs text-slate-400">{parcel.OWNER_NAME2}</div>}
        <div className="text-[11px] text-slate-500 mt-1">Subdivision: {parcel.SUBDIVISION_NAME || '—'}</div>
        <div className="text-[11px] text-slate-500">Millage: {parcel.MILLAGE_CODE || '—'} · Homestead: {parseFloat(parcel.HOMESTEAD_VALUE) > 0 ? 'Yes ✓' : 'No'}</div>
      </div>

      <div className="space-y-2 pt-1">
        <a href={`/parcel/${pidEnc}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-md text-sm font-bold hover:bg-amber-500/25 transition-colors">
          🗺️ Full ZoneWise.AI Analysis
        </a>
        <a href={`https://www.bcpao.us/PropertySearch/#/account/${parcel.PROPERTY_ID}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md text-xs font-semibold hover:bg-blue-500/20 transition-colors">
          📋 View on BCPAO
        </a>
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
    if (next > FREE_PARCEL_CLICKS) {
      setGateModal('parcel')
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
        {choroplethVisible && (
          <div className="absolute top-3 right-3 z-10">
            <select
              value={choroplethMetric}
              onChange={e => {
                const m = e.target.value as ChoroplethMetric
                setChoroplethMetric(m)
                mapRef.current?.setChoroplethMetric(m)
              }}
              className="bg-slate-900/90 border border-slate-700 rounded-md px-2.5 py-1.5 text-[11px] text-white backdrop-blur-sm shadow-sm focus:outline-none focus:border-amber-500/60"
            >
              {CHOROPLETH_METRICS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        )}

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
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 backdrop-blur-sm pointer-events-auto">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Layers</div>
            <div className="space-y-1.5">
              {/* Choropleth toggle */}
              <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={choroplethVisible}
                  onChange={e => setChoroplethVisible(e.target.checked)}
                  className="accent-amber-500 w-3 h-3"
                />
                <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-gradient-to-r from-blue-500 to-red-500" />
                Heatmap
              </label>
              {/* Zoning toggle */}
              <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={layers.zoning}
                  onChange={e => {
                    setLayers(l => ({ ...l, zoning: e.target.checked }))
                    mapRef.current?.toggleLayer('zoning-layer', e.target.checked)
                  }}
                  className="accent-amber-500 w-3 h-3"
                />
                <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-blue-500" />
                Zoning
              </label>
              {/* Parcels toggle */}
              <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={layers.parcels}
                  onChange={e => {
                    setLayers(l => ({ ...l, parcels: e.target.checked }))
                    mapRef.current?.toggleLayer('parcels-layer', e.target.checked)
                  }}
                  className="accent-amber-500 w-3 h-3"
                />
                <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-amber-500" />
                Parcels
              </label>
              {/* FLU toggle */}
              <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={layers.flu}
                  onChange={e => {
                    setLayers(l => ({ ...l, flu: e.target.checked }))
                    mapRef.current?.toggleLayer('flu-layer', e.target.checked)
                  }}
                  className="accent-amber-500 w-3 h-3"
                />
                <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-purple-500" />
                FLU
              </label>
            </div>
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

          {/* Selected parcel mini-card */}
          {selectedParcel && (
            <div className="flex-1 bg-slate-950/90 border border-amber-500/30 rounded-xl p-3 backdrop-blur-sm pointer-events-auto max-w-[260px]">
              <ParcelPanel parcel={selectedParcel} />
            </div>
          )}

          {/* Zoning legend */}
          {!selectedParcel && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 backdrop-blur-sm pointer-events-auto">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Legend</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {Object.entries(ZONING_LABELS).slice(0, 6).map(([code, label]) => (
                  <div key={code} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: getZoningColor(code) }} />
                    {code}
                  </div>
                ))}
              </div>
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
