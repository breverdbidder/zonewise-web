'use client'

// ZoningLegend.tsx — Color legend for Brevard zoning categories (RU/BU/PUD/AU/IU)

import { ZONING_LABELS, ZONING_COLORS } from '@/lib/explorer/constants'

// Show the 6 most common zone types
const LEGEND_CODES = ['RU', 'BU', 'PUD', 'AU', 'IU', 'TU'] as const

interface Props {
  visible?: boolean
}

export default function ZoningLegend({ visible = true }: Props) {
  if (!visible) return null
  return (
    <div className="bg-[rgb(var(--zw-page)/0.9)] border border-[rgb(var(--zw-border2))] rounded-xl p-3 backdrop-blur-sm">
      <div className="text-[9px] font-bold text-[rgb(var(--zw-ink2))] uppercase tracking-wider mb-1.5">Zoning</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {LEGEND_CODES.map(code => (
          <div key={code} className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--zw-ink2))]">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ background: ZONING_COLORS[code] ?? 'rgb(var(--zw-elev))' }}
            />
            <span className="font-mono text-[rgb(var(--zw-ink2))]">{code}</span>
            <span className="truncate">{ZONING_LABELS[code] ?? ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
