'use client'

// ChoroplethLayer.tsx — Metric selector + visibility toggle for the heatmap
// Renders as a UI overlay (not a Mapbox layer directly).
// The actual GL layers live in ExplorerMap.tsx.

import { CHOROPLETH_METRICS, type ChoroplethMetric } from '@/lib/explorer/constants'
import { CHOROPLETH_LEGENDS } from '@/lib/explorer/choropleth'

interface Props {
  metric: ChoroplethMetric
  visible: boolean
  onMetricChange: (m: ChoroplethMetric) => void
  onVisibleChange: (v: boolean) => void
}

export default function ChoroplethLayer({ metric, visible, onMetricChange, onVisibleChange }: Props) {
  const legend = CHOROPLETH_LEGENDS[metric as keyof typeof CHOROPLETH_LEGENDS]

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 backdrop-blur-sm">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Heatmap</span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={visible}
            onChange={e => onVisibleChange(e.target.checked)}
            className="accent-amber-500 w-3 h-3"
          />
          <span className="text-[10px] text-slate-400">{visible ? 'On' : 'Off'}</span>
        </label>
      </div>

      {/* Metric selector */}
      <select
        value={metric}
        onChange={e => onMetricChange(e.target.value as ChoroplethMetric)}
        className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-amber-500/60 mb-2"
      >
        {CHOROPLETH_METRICS.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      {/* Color legend */}
      {visible && legend && (
        <div className="space-y-0.5">
          {legend.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm shrink-0" style={{ background: color }} />
              <span className="text-[10px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
