'use client'

/**
 * ComparePanel — Multi-select comparison bottom panel
 * Extracted from zonewise-dev-intel-v3.jsx
 * Shows side-by-side comparison of up to 4 selected parcels
 */

import type { Parcel } from '@/zonewise/lib/development-analysis/types'
import { computeEnvelope, calculateHBU } from '@/zonewise/lib/development-analysis/hbu-engine'

const ORANGE = '#F59E0B'
const SLATE = '#020617'
const CARD_BG = '#1e293b'
const GREEN = '#22c55e'

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}

export interface ComparePanelProps {
  parcels: Parcel[]
  onClose: () => void
}

export function ComparePanel({ parcels, onClose }: ComparePanelProps) {
  if (parcels.length < 2) return null

  const data = parcels.map((p) => {
    const env = computeEnvelope(
      p.lotWidth, p.lotDepth,
      p.setbacks.front, p.setbacks.side, p.setbacks.rear,
      p.maxHeight, p.maxCoverage, p.far
    )
    const hbu = calculateHBU(p, env)
    return { ...p, env, best: hbu[0] }
  })

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 p-3 max-h-[40vh] overflow-y-auto"
      style={{ background: CARD_BG, borderColor: ORANGE }}
    >
      <div className="flex items-center justify-between mb-2 max-w-4xl mx-auto">
        <span className="text-xs font-bold" style={{ color: ORANGE }}>
          Comparing {data.length} Parcels
        </span>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-white">
          ✕ Close
        </button>
      </div>
      <div
        className="grid gap-3 max-w-4xl mx-auto"
        style={{ gridTemplateColumns: `repeat(${Math.min(data.length, 4)}, 1fr)` }}
      >
        {data.map((d) => (
          <div
            key={d.id}
            className="rounded-lg p-2.5 border border-gray-600/50"
            style={{ background: `${SLATE}cc` }}
          >
            <div className="text-xs font-bold text-white truncate">{d.address}</div>
            <div className="text-[9px] text-gray-400 mb-2">
              {d.zone} · {d.city}
            </div>
            <div className="space-y-1 text-[10px]">
              {(
                [
                  ['HBU Score', d.best?.score ?? 0, ORANGE],
                  ['GFA', `${d.env.actualGFA.toLocaleString()} sf`, null],
                  ['Floors', d.env.floors, null],
                  ['ROI', `${d.best?.roi ?? 0}%`, GREEN],
                  ['Max Bid', fmt$(d.best?.maxBid ?? 0), ORANGE],
                  ['Best Use', d.best?.use ?? '—', null],
                ] as [string, string | number, string | null][]
              ).map(([l, v, c], i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-400">{l}</span>
                  <span className="font-medium" style={c ? { color: c } : { color: '#fff' }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ComparePanel
