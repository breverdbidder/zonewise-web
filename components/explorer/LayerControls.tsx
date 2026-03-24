'use client'

// LayerControls.tsx — Toggle panel for map layers (Parcels, Zoning, Heatmap, FLU, Satellite)

interface LayerState {
  parcels: boolean
  zoning: boolean
  flu: boolean
}

interface Props {
  layers: LayerState
  choroplethVisible: boolean
  onToggleLayer: (id: string, on: boolean, key: keyof LayerState) => void
  onToggleChoropleth: (on: boolean) => void
}

const LAYER_ITEMS = [
  { key: 'parcels' as const, id: 'parcels-layer', label: 'Parcels', color: '#F59E0B' },
  { key: 'zoning'  as const, id: 'zoning-layer',  label: 'Zoning',  color: '#3B82F6' },
  { key: 'flu'     as const, id: 'flu-layer',      label: 'FLU',     color: '#8B5CF6' },
]

export default function LayerControls({ layers, choroplethVisible, onToggleLayer, onToggleChoropleth }: Props) {
  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 backdrop-blur-sm">
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Layers</div>
      <div className="space-y-1.5">
        {/* Heatmap */}
        <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer hover:text-slate-200 min-h-[44px] md:min-h-0">
          <input
            type="checkbox"
            checked={choroplethVisible}
            onChange={e => onToggleChoropleth(e.target.checked)}
            className="accent-amber-500 w-3 h-3"
          />
          <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-gradient-to-r from-blue-500 to-red-500" />
          Heatmap
        </label>

        {/* BCPAO layers */}
        {LAYER_ITEMS.map(({ key, id, label, color }) => (
          <label key={key} className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer hover:text-slate-200 min-h-[44px] md:min-h-0">
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={e => onToggleLayer(id, e.target.checked, key)}
              className="accent-amber-500 w-3 h-3"
            />
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
            {label}
          </label>
        ))}
      </div>
    </div>
  )
}
