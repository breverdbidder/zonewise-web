'use client'

import { computeEnvelope, calculateHBU } from '@/lib/development-analysis/hbu-engine'
import type { Parcel } from '@/lib/development-analysis/types'

const NAVY = '#1E3A5F'
const ORANGE = '#F59E0B'
const SLATE = '#020617'
const CARD_BG = '#1e293b'
const GREEN = '#22c55e'

function fmt$(n: number) {
  return n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`
}

export interface ParcelCardProps {
  parcel: Parcel
  onClick: () => void
  selected: boolean
  onToggleCompare?: (id: string) => void
}

export function ParcelCard({ parcel, onClick, selected, onToggleCompare }: ParcelCardProps) {
  const env = computeEnvelope(
    parcel.lotWidth, parcel.lotDepth,
    parcel.setbacks.front, parcel.setbacks.side, parcel.setbacks.rear,
    parcel.maxHeight, parcel.maxCoverage, parcel.far
  )
  const scenarios = calculateHBU(parcel, env)
  const best = scenarios[0]

  // BCPAO photo URL is already in parcel.photo from mapRow()
  const photoStyle = parcel.photo
    ? { backgroundImage: `url(${parcel.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, ${NAVY} 0%, ${SLATE} 50%, ${NAVY}88 100%)` }

  return (
    <div
      className={`rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group border ${
        selected ? 'border-amber-400 ring-1 ring-amber-400/30' : 'border-gray-700/50 hover:border-amber-500/30'
      }`}
      style={{ background: CARD_BG }}
      role="article"
      aria-label={`${parcel.address}, HBU score ${best.score}`}
    >
      {/* Photo / map thumbnail */}
      <div className="h-24 sm:h-32 relative overflow-hidden" style={photoStyle}>
        {!parcel.photo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-80 transition-opacity">
            <div className="text-center">
              <div className="text-3xl">◇</div>
              <div className="text-[9px] text-gray-300">3D Envelope</div>
            </div>
          </div>
        )}
        {/* Compare checkbox */}
        <div className="absolute top-1.5 left-1.5">
          <button
            onClick={e => { e.stopPropagation(); onToggleCompare?.(parcel.id) }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] transition-colors ${
              selected
                ? 'border-amber-400 bg-amber-400/20 text-amber-400'
                : 'border-gray-500 bg-black/30 text-transparent hover:border-gray-300'
            }`}
            aria-label={selected ? 'Remove from comparison' : 'Add to comparison'}
          >
            {selected ? '✓' : ''}
          </button>
        </div>
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
          style={{ background: ORANGE, color: SLATE }}>
          {parcel.zone}
        </div>
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
          <span className="text-[9px] text-gray-300">HBU</span>
          <span className="text-sm font-black" style={{ color: ORANGE }}>{best.score}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-2" onClick={onClick}>
        <h3 className="text-xs font-bold text-white mb-0.5 truncate">{parcel.address}</h3>
        <p className="text-[9px] text-gray-400 mb-1.5">{parcel.city} · {fmt$(best.maxBid)} max bid</p>
        <div className="grid grid-cols-3 gap-1 text-center mb-1">
          <div className="bg-gray-800/60 rounded px-1 py-0.5">
            <div className="text-[8px] text-gray-500">GFA</div>
            <div className="text-[10px] font-bold text-white">{(env.actualGFA / 1000).toFixed(1)}K</div>
          </div>
          <div className="bg-gray-800/60 rounded px-1 py-0.5">
            <div className="text-[8px] text-gray-500">Floors</div>
            <div className="text-[10px] font-bold text-white">{env.floors}</div>
          </div>
          <div className="bg-gray-800/60 rounded px-1 py-0.5">
            <div className="text-[8px] text-gray-500">ROI</div>
            <div className="text-[10px] font-bold" style={{ color: ORANGE }}>{best.roi}%</div>
          </div>
        </div>
        <div className="text-[9px] text-gray-400 truncate">
          Best: <span className="text-gray-200">{best.use}</span>
        </div>
      </div>
    </div>
  )
}
