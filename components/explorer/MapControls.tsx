'use client'

// MapControls.tsx — Map style switcher buttons with accessible aria-labels

type MapStyle = 'streets-v12' | 'satellite-streets-v12' | 'light-v11'

interface Props {
  current: MapStyle
  onChange: (style: MapStyle) => void
}

const STYLE_OPTIONS: { id: MapStyle; label: string; ariaLabel: string }[] = [
  { id: 'streets-v12',           label: 'Streets',   ariaLabel: 'Switch to Streets map style' },
  { id: 'satellite-streets-v12', label: 'Satellite', ariaLabel: 'Switch to Satellite map style' },
  { id: 'light-v11',             label: 'Light',     ariaLabel: 'Switch to Light map style' },
]

export default function MapControls({ current, onChange }: Props) {
  return (
    <div role="group" aria-label="Map style controls" className="flex gap-1.5">
      {STYLE_OPTIONS.map(s => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          aria-label={s.ariaLabel}
          aria-pressed={current === s.id}
          className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold backdrop-blur-sm shadow-sm transition-all border ${
            current === s.id
              ? 'bg-amber-500 border-amber-500 text-slate-950'
              : 'bg-white/90 border-slate-300 text-slate-700 hover:bg-amber-500/10 hover:border-amber-500/50'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
