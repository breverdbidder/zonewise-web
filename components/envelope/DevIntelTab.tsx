'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { computeEnvelope, calculateHBU, CONSTRUCTION_COSTS, ZONE_PERMITTED } from '@/lib/development-analysis/hbu-engine'
import type { Parcel, HBUScenario, DataSource } from '@/lib/development-analysis/types'
import { useEnvelopeData } from '@/lib/hooks/useEnvelopeData'
import { ParcelCard } from './ParcelCard'
import { ComparePanel } from './ComparePanel'
import { MiniMap } from './MiniMap'
import { ScoreBar } from './ScoreBar'
import { Stat } from './Stat'
import { ParamSlider } from './ParamSliders'
import { SourceBadge } from './SourceBadge'

const Envelope3D = dynamic(() => import('./Envelope3D').then(m => ({ default: m.Envelope3D })), { ssr: false })

const NAVY = '#1E3A5F'
const ORANGE = '#F59E0B'
const SLATE = '#020617'
const CARD_BG = '#1e293b'
const GREEN = '#22c55e'
const RED = '#ef4444'

function fmt$(n: number) {
  return n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`
}

const ZONE_PRESETS: Record<string, { front: number; side: number; rear: number; maxHeight: number; maxCoverage: number; far: number }> = {
  'RS-1 (SFR)':    { front: 25, side: 7.5, rear: 20, maxHeight: 35, maxCoverage: 40, far: 0.5 },
  'RM-6 (Duplex)': { front: 25, side: 10, rear: 20, maxHeight: 45, maxCoverage: 50, far: 0.8 },
  'BU-1 (Comm.)':  { front: 0, side: 0, rear: 10, maxHeight: 65, maxCoverage: 80, far: 2.0 },
  'BU-2 (Mixed)':  { front: 0, side: 0, rear: 5, maxHeight: 80, maxCoverage: 90, far: 3.0 },
}

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 600, height: 360 })
  useEffect(() => {
    if (!ref.current) return
    const obs = new ResizeObserver(entries => {
      const w = Math.floor(entries[0].contentRect.width)
      setSize({ width: Math.max(280, w), height: Math.max(240, Math.floor(w * 0.55)) })
    })
    obs.observe(ref.current)
    const w = ref.current.clientWidth
    setSize({ width: Math.max(280, w), height: Math.max(240, Math.floor(w * 0.55)) })
    return () => obs.disconnect()
  }, [ref])
  return size
}

function copyAnalysis(parcel: Parcel, env: ReturnType<typeof computeEnvelope>, best: HBUScenario) {
  const text = `ZoneWise.AI — Development Intelligence Report
${parcel.address}, ${parcel.city}, FL ${parcel.zip}
Parcel: ${parcel.id} | Zone: ${parcel.zone} (${parcel.zoneDesc})
Lot: ${env.lotArea.toLocaleString()} sf (${parcel.lotWidth}' × ${parcel.lotDepth}')
Buildable: ${env.actualGFA.toLocaleString()} sf GFA | ${env.floors} floors | ${env.covPct}% coverage
HBU Recommendation: ${best.use} (Score: ${best.score}/100)
  Legal: ${best.legal} | Physical: ${best.physical} | Financial: ${best.financial} | Maximal: ${best.maximal}
  ROI: ${best.roi}% | Risk: ${best.risk} | Timeline: ${best.timeline}
  Investment: $${best.investReq.toLocaleString()} | Projected Value: $${best.projectedValue.toLocaleString()}
  Max Bid (70% rule): $${best.maxBid.toLocaleString()}
Generated: ${new Date().toISOString().split('T')[0]}`
  navigator.clipboard.writeText(text).catch(() => {})
  return text
}

// ─── DETAIL VIEW ─────────────────────────────────────────────
function ParcelDetail({ parcel, onBack, hbuSource = 'client' }: { parcel: Parcel; onBack: () => void; hbuSource?: DataSource }) {
  const [tab, setTab] = useState<'3d' | 'hbu' | 'facts'>('3d')
  const cRef = useRef<HTMLDivElement>(null)
  const resetRef = useRef<(() => void) | null>(null)
  const { width: cW, height: cH } = useContainerSize(cRef)
  const [copied, setCopied] = useState(false)
  const [showCompare, setShowCompare] = useState(false)

  const [front, setFront] = useState(parcel.setbacks.front)
  const [side, setSide] = useState(parcel.setbacks.side)
  const [rear, setRear] = useState(parcel.setbacks.rear)
  const [maxH, setMaxH] = useState(parcel.maxHeight)
  const [maxCov, setMaxCov] = useState(parcel.maxCoverage)
  const [far, setFar] = useState(parcel.far)

  const env = useMemo(() => computeEnvelope(parcel.lotWidth, parcel.lotDepth, front, side, rear, maxH, maxCov, far),
    [parcel.lotWidth, parcel.lotDepth, front, side, rear, maxH, maxCov, far])
  const scenarios = useMemo(() => calculateHBU(parcel, env), [parcel, env])
  const best = scenarios[0]

  const compareData = useMemo(() =>
    Object.entries(ZONE_PRESETS).map(([name, z]) => ({
      name, ...z,
      ...computeEnvelope(parcel.lotWidth, parcel.lotDepth, z.front, z.side, z.rear, z.maxHeight, z.maxCoverage, z.far),
    })), [parcel.lotWidth, parcel.lotDepth])

  function applyPreset(n: string) {
    const z = ZONE_PRESETS[n]; if (!z) return
    setFront(z.front); setSide(z.side); setRear(z.rear)
    setMaxH(z.maxHeight); setMaxCov(z.maxCoverage); setFar(z.far)
  }
  function reset() {
    setFront(parcel.setbacks.front); setSide(parcel.setbacks.side); setRear(parcel.setbacks.rear)
    setMaxH(parcel.maxHeight); setMaxCov(parcel.maxCoverage); setFar(parcel.far)
  }
  function handleShare() { copyAnalysis(parcel, env, best); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="min-h-screen" style={{ background: SLATE, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-800">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm" aria-label="Back to list">← Back</button>
        <div className="flex-1" />
        <SourceBadge source={hbuSource} />
        <button onClick={handleShare}
          className="text-[10px] px-2 py-1 rounded border transition-colors"
          style={{ borderColor: copied ? GREEN : '#4b5563', color: copied ? GREEN : '#9ca3af' }}
          aria-label="Copy analysis to clipboard">
          {copied ? '✓ Copied' : 'Share'}
        </button>
        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: NAVY, color: ORANGE }}>{parcel.zone}</span>
      </div>

      <div className="p-3 sm:p-4 max-w-4xl mx-auto">
        <div className="mb-3">
          <MiniMap lat={parcel.lat} lng={parcel.lng} w={Math.min(640, cW || 600)} h={140} />
        </div>

        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">{parcel.address}</h1>
            <p className="text-gray-400 text-[10px] sm:text-xs">{parcel.city}, FL {parcel.zip} · {parcel.id}</p>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-gray-400">HBU</div>
            <div className="text-2xl font-black" style={{ color: ORANGE }}>{best.score}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-3">
          <Stat label="Lot" value={env.lotArea.toLocaleString()} unit="sf" />
          <Stat label="GFA" value={env.actualGFA.toLocaleString()} unit="sf" />
          <Stat label="Floors" value={env.floors} />
          <Stat label="Height" value={maxH} unit="ft" />
          <Stat label="FAR" value={far} />
          <Stat label="Max Bid" value={fmt$(best.maxBid)} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/80 rounded-lg p-1 mb-3" role="tablist">
          {([{ id: '3d', label: '3D Envelope' }, { id: 'hbu', label: 'HBU Analysis' }, { id: 'facts', label: 'Zoning Facts' }] as const).map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all ${tab === t.id ? 'text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
              style={tab === t.id ? { background: NAVY, color: ORANGE } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 3D TAB */}
        {tab === '3d' && (
          <div role="tabpanel" aria-label="3D Envelope view">
            <div ref={cRef} className="rounded-xl overflow-hidden border border-gray-700 mb-3" style={{ background: SLATE }}>
              <Envelope3D lotW={parcel.lotWidth} lotD={parcel.lotDepth} front={front} side={side} rear={rear}
                maxH={maxH} maxCov={maxCov} far={far} width={cW} height={cH} onResetView={resetRef} />
            </div>
            <div className="flex gap-1 mb-2">
              <button onClick={reset} className="text-[10px] text-gray-400 hover:text-white px-2 py-0.5 rounded border border-gray-600 hover:border-gray-400 transition-colors">Reset Params</button>
              <button onClick={() => resetRef.current?.()} className="text-[10px] text-gray-400 hover:text-white px-2 py-0.5 rounded border border-gray-600 hover:border-gray-400 transition-colors">Reset View</button>
            </div>

            <div className="rounded-lg p-3 mb-3 border border-gray-700/50" style={{ background: CARD_BG }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ORANGE }}>What-If Controls</span>
                <span className="text-[9px] text-gray-500">Arrow keys also work</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                <ParamSlider label="Front" value={front} min={0} max={50} step={1} onChange={setFront} unit="ft" />
                <ParamSlider label="Side" value={side} min={0} max={25} step={0.5} onChange={setSide} unit="ft" />
                <ParamSlider label="Rear" value={rear} min={0} max={40} step={1} onChange={setRear} unit="ft" />
                <ParamSlider label="Height" value={maxH} min={15} max={120} step={5} onChange={setMaxH} unit="ft" />
                <ParamSlider label="Coverage" value={maxCov} min={10} max={100} step={5} onChange={setMaxCov} unit="%" />
                <ParamSlider label="FAR" value={far} min={0.1} max={5.0} step={0.1} onChange={setFar} />
              </div>
            </div>

            <div className="rounded-lg p-3 mb-3 border border-gray-700/50" style={{ background: CARD_BG }}>
              <button onClick={() => setShowCompare(!showCompare)} className="w-full flex items-center justify-between"
                aria-expanded={showCompare} aria-label="Compare zoning scenarios">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ORANGE }}>Compare Zoning Scenarios</span>
                <span className="text-gray-500 text-sm">{showCompare ? '▲' : '▼'}</span>
              </button>
              {showCompare && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {compareData.map(c => (
                    <button key={c.name} onClick={() => applyPreset(c.name)}
                      className="rounded-lg p-2 text-left border border-gray-600/50 hover:border-amber-500/40 transition-all" style={{ background: `${SLATE}cc` }}>
                      <div className="text-[10px] font-bold text-white mb-1">{c.name}</div>
                      <div className="text-[9px] space-y-0.5">
                        <div className="flex justify-between"><span className="text-gray-400">GFA</span><span className="font-bold" style={{ color: ORANGE }}>{c.actualGFA.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Floors</span><span className="text-gray-200">{c.floors}</span></div>
                      </div>
                      <div className="w-full h-1 bg-gray-700 rounded mt-1">
                        <div className="h-1 rounded" style={{ background: ORANGE, width: `${Math.min(100, (c.actualGFA / Math.max(...compareData.map(x => x.actualGFA))) * 100)}%` }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800/60 rounded-lg p-2.5">
                <h3 className="text-[9px] font-bold text-gray-400 uppercase mb-1.5">Setbacks</h3>
                <div className="space-y-0.5 text-[11px]">
                  {([['Front', front], ['Side', side], ['Rear', rear]] as [string, number][]).map(([l, v]) => (
                    <div key={l} className="flex justify-between"><span className="text-gray-300">{l}</span><span className="text-white font-medium">{v} ft</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-800/60 rounded-lg p-2.5">
                <h3 className="text-[9px] font-bold text-gray-400 uppercase mb-1.5">Buildable</h3>
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-300">Footprint</span><span className="text-white font-medium">{env.effFP.toLocaleString()} sf</span></div>
                  <div className="flex justify-between"><span className="text-gray-300">Coverage</span><span className="text-white font-medium">{env.covPct}%</span></div>
                  <div className="flex justify-between"><span className="text-gray-300">Volume</span><span className="text-white font-medium">{env.volume.toLocaleString()} cf</span></div>
                </div>
              </div>
            </div>
            <p className="text-[9px] text-gray-500 mt-2 text-center">Drag to rotate · Scroll to zoom · ↑↓←→ keys · Red cone = North</p>
          </div>
        )}

        {/* HBU TAB */}
        {tab === 'hbu' && (
          <div role="tabpanel" aria-label="Highest and Best Use analysis">
            <div className="rounded-xl p-3 mb-3 border" style={{ background: `${NAVY}33`, borderColor: `${ORANGE}44` }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ORANGE }}>Recommended Highest & Best Use</div>
                <div className="text-[9px] text-gray-400">4-Test | Parcel-Specific</div>
              </div>
              <div className="text-base sm:text-lg font-bold text-white mb-2">{best.use}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <ScoreBar score={best.legal} label="Legal" />
                <ScoreBar score={best.physical} label="Physical" />
                <ScoreBar score={best.financial} label="Financial" />
                <ScoreBar score={best.maximal} label="Maximal" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {[['Investment', fmt$(best.investReq), 'white'], ['Projected Value', fmt$(best.projectedValue), GREEN], ['Annual NOI', fmt$(best.annualNOI), 'white'], ['Max Bid (70%)', fmt$(best.maxBid), ORANGE]].map(([l, v, c]) => (
                  <div key={l} className="bg-gray-800/40 rounded p-1.5">
                    <div className="text-[9px] text-gray-400">{l}</div>
                    <div className="text-xs font-bold" style={{ color: c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">All Scenarios Ranked ({scenarios.length})</h3>
            <div className="space-y-2">
              {scenarios.map((s, i) => (
                <div key={i} className={`rounded-lg p-2.5 border transition-all ${i === 0 ? 'border-amber-500/40' : 'border-gray-700/50'}`}
                  style={{ background: i === 0 ? `${NAVY}44` : `${CARD_BG}88` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: ORANGE, color: SLATE }}>BEST</span>}
                      {s.isConditional && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-900/40 text-amber-400">CU</span>}
                      <span className="text-xs sm:text-sm font-semibold text-white">{s.use}</span>
                    </div>
                    <span className="text-base font-black" style={{ color: s.score >= 80 ? GREEN : s.score >= 60 ? ORANGE : RED }}>{s.score}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 mb-1.5">
                    <ScoreBar score={s.legal} label="Legal" />
                    <ScoreBar score={s.physical} label="Phys." />
                    <ScoreBar score={s.financial} label="Fin." />
                    <ScoreBar score={s.maximal} label="Max" />
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px]">
                    <div><span className="text-gray-400">ROI</span><br /><span className="text-white font-medium">{s.roi}%</span></div>
                    <div><span className="text-gray-400">Risk</span><br /><span className={s.risk === 'Low' ? 'text-green-400' : s.risk === 'Medium' ? 'text-amber-400' : 'text-red-400'}>{s.risk}</span></div>
                    <div><span className="text-gray-400">Timeline</span><br /><span className="text-white">{s.timeline}</span></div>
                    <div><span className="text-gray-400">Invest</span><br /><span className="text-white">{fmt$(s.investReq)}</span></div>
                    <div><span className="text-gray-400">Value</span><br /><span className="text-white">{fmt$(s.projectedValue)}</span></div>
                    <div><span className="text-gray-400">Max Bid</span><br /><span style={{ color: ORANGE }}>{fmt$(s.maxBid)}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg p-3 mt-3 bg-gray-800/40">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase mb-2">Brevard County Construction Costs ($/sf)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[10px]">
                {Object.entries(CONSTRUCTION_COSTS).slice(0, 6).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-700/30 pb-0.5">
                    <span className="text-gray-300">{v.label}</span>
                    <span className="text-white">${v.low}-${v.high}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FACTS TAB */}
        {tab === 'facts' && (
          <div role="tabpanel" aria-label="Zoning facts" className="space-y-3">
            <div className="bg-gray-800/60 rounded-lg p-3">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Permitted Uses — {parcel.zone}</h3>
              <div className="flex flex-wrap gap-1.5">
                {(ZONE_PERMITTED[parcel.zone]?.uses || []).map((u, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/30 text-green-300 border border-green-800/30">
                    {CONSTRUCTION_COSTS[u === 'sfr' ? 'sfr_new' : u]?.label || u}
                  </span>
                ))}
                {(ZONE_PERMITTED[parcel.zone]?.conditional || []).map((u, i) => (
                  <span key={`c${i}`} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-300 border border-amber-800/30">
                    {CONSTRUCTION_COSTS[u === 'sfr' ? 'sfr_new' : u]?.label || u} (CU)
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-3">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Dimensional Standards</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                {[
                  ['Front Setback', `${parcel.setbacks.front} ft`], ['Side Setback', `${parcel.setbacks.side} ft`],
                  ['Rear Setback', `${parcel.setbacks.rear} ft`], ['Max Height', `${parcel.maxHeight} ft`],
                  ['Max Coverage', `${parcel.maxCoverage}%`], ['FAR', `${parcel.far}`],
                  ['Flood Zone', parcel.floodZone], ['Year Built', `${parcel.yearBuilt}`],
                ].map(([l, v], i) => (
                  <div key={i} className="flex justify-between text-[11px] border-b border-gray-700/30 pb-0.5">
                    <span className="text-gray-300">{l}</span><span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-3">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Value Analysis</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><div className="text-[9px] text-gray-400">Land</div><div className="text-sm font-bold text-white">{fmt$(parcel.landValue)}</div></div>
                <div><div className="text-[9px] text-gray-400">Improved</div><div className="text-sm font-bold text-white">{fmt$(parcel.improvValue)}</div></div>
                <div><div className="text-[9px] text-gray-400">HBU Uplift</div><div className="text-sm font-bold" style={{ color: ORANGE }}>+{best.roi}%</div></div>
              </div>
            </div>
            <div className="rounded-lg p-3 border" style={{ background: `${NAVY}22`, borderColor: `${NAVY}66` }}>
              <h3 className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: ORANGE }}>Development Potential</h3>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                This {env.lotArea.toLocaleString()} sf {parcel.zone}-zoned lot supports {env.floors} floors / {env.actualGFA.toLocaleString()} sf GFA.
                HBU recommends <span className="text-white font-semibold">{best.use}</span> (score {best.score}/100, {best.roi}% ROI).
                {parcel.floodZone !== 'X' ? ` Flood zone ${parcel.floodZone} adds insurance cost and regulatory constraints.` : ''}
                {' '}Max auction bid under 70% rule: <span style={{ color: ORANGE }} className="font-semibold">{fmt$(best.maxBid)}</span>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN TAB ─────────────────────────────────────────────────
export interface DevIntelTabProps {
  onParcelSelect?: (parcel: Parcel | null) => void
  externalSelectedParcel?: string | null
  compareMode?: boolean
}

export function DevIntelTab({ onParcelSelect, externalSelectedParcel, compareMode }: DevIntelTabProps) {
  const { parcels, loading, error, fetchParcels, fetchParcelById, fetchHBU } = useEnvelopeData()
  const [selected, setSelected] = useState<Parcel | null>(null)
  const [hbuSource, setHbuSource] = useState<DataSource>('client')
  const [search, setSearch] = useState('')
  const [compareIds, setCompareIds] = useState<string[]>([])

  useEffect(() => { fetchParcels() }, [fetchParcels])

  // Handle external parcel selection (from chat)
  useEffect(() => {
    if (!externalSelectedParcel) return
    const found = parcels.find(p => p.id === externalSelectedParcel)
    if (found) {
      handleSelect(found)
    } else {
      fetchParcelById(externalSelectedParcel).then(p => { if (p) handleSelect(p) })
    }
  }, [externalSelectedParcel, parcels])

  const handleSelect = useCallback(async (parcel: Parcel) => {
    setSelected(parcel)
    onParcelSelect?.(parcel)
    const { source } = await fetchHBU(parcel)
    setHbuSource(source)
  }, [fetchHBU, onParcelSelect])

  const handleBack = useCallback(() => {
    setSelected(null)
    onParcelSelect?.(null)
  }, [onParcelSelect])

  const filtered = parcels.filter(p =>
    p.address.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase()) ||
    p.zone.toLowerCase().includes(search.toLowerCase())
  )

  const toggleCompare = (id: string) =>
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev)
  const compareParcels = parcels.filter(p => compareIds.includes(p.id))

  if (selected) return <ParcelDetail parcel={selected} onBack={handleBack} hbuSource={hbuSource} />

  return (
    <div className="min-h-full" style={{ background: SLATE, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="px-3 sm:px-4 pt-3 pb-2 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: NAVY }}>
              <span style={{ color: ORANGE, fontSize: 13, fontWeight: 900 }}>Z</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">Development Intelligence</h1>
              <p className="text-[9px] sm:text-[10px] text-gray-400">3D Envelope · HBU Analysis · Max Bid Calculator</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-gray-500">Brevard County</div>
            <div className="text-[10px]" style={{ color: ORANGE }}>{parcels.length} parcels</div>
          </div>
        </div>

        <div className="relative mb-2">
          <input type="text" placeholder="Search address, city, or zone..." value={search} onChange={e => setSearch(e.target.value)}
            aria-label="Search parcels"
            className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors" />
        </div>

        <div className="flex items-center gap-3 mb-2 text-[9px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />≥80</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }} />60-79</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />&lt;60</span>
          {compareIds.length > 0 && <span className="ml-auto" style={{ color: ORANGE }}>{compareIds.length} selected — {compareIds.length >= 2 ? 'comparing below ↓' : 'select 1 more'}</span>}
          {compareIds.length === 0 && <span className="ml-auto hidden sm:inline">☐ checkbox to compare · click card for detail</span>}
        </div>
      </div>

      <div className="px-3 sm:px-4 pb-6 max-w-4xl mx-auto" style={{ paddingBottom: compareIds.length >= 2 ? '45vh' : '1.5rem' }}>
        {loading && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-700/50 animate-pulse" style={{ background: CARD_BG }}>
                <div className="h-24 sm:h-32 bg-gray-700/50" /><div className="p-2.5 space-y-2"><div className="h-3 bg-gray-700/50 rounded w-3/4" /><div className="h-2 bg-gray-700/50 rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        )}
        {error && !loading && (
          <div className="text-center py-12 rounded-xl border border-red-500/30 bg-red-500/10">
            <div className="text-red-400 text-sm mb-1">Failed to load</div>
            <div className="text-xs text-gray-400">{error}</div>
            <button onClick={() => fetchParcels()} className="mt-3 text-xs px-3 py-1 rounded border border-gray-600 text-gray-300">Retry</button>
          </div>
        )}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {filtered.map(p => (
              <ParcelCard key={p.id} parcel={p} onClick={() => handleSelect(p)}
                selected={compareIds.includes(p.id)} onToggleCompare={toggleCompare} />
            ))}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">No matches.</div>
        )}
      </div>

      {compareIds.length >= 2 && <ComparePanel parcels={compareParcels} onClose={() => setCompareIds([])} />}

      <div className="px-4 py-2 border-t border-gray-800 text-center">
        <p className="text-[9px] text-gray-600">ZoneWise.AI · BCPAO + Municipal GIS · HBU by Everest Capital · Construction costs: Brevard 2025-2026</p>
      </div>
    </div>
  )
}
