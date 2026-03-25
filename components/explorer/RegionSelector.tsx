'use client'

// RegionSelector.tsx — Accessible zoning filter listbox
// Uses role="listbox" + aria-selected for screen reader compatibility.

import { ZONING_FILTERS, type ZoningFilter } from '@/lib/explorer/constants'

interface Props {
  value: ZoningFilter
  onChange: (value: ZoningFilter) => void
}

export default function RegionSelector({ value, onChange }: Props) {
  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 backdrop-blur-sm">
      <div
        id="zone-filter-label"
        className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2"
      >
        Zone Filter
      </div>
      <ul
        role="listbox"
        aria-labelledby="zone-filter-label"
        aria-label="Zoning filter"
        className="flex flex-col gap-0.5"
      >
        {ZONING_FILTERS.map(f => (
          <li
            key={f.value}
            role="option"
            aria-selected={value === f.value}
            onClick={() => onChange(f.value as ZoningFilter)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChange(f.value as ZoningFilter)
              }
            }}
            tabIndex={0}
            className={`px-2 py-1 rounded-md text-[11px] cursor-pointer transition-colors ${
              value === f.value
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
            }`}
          >
            {f.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
