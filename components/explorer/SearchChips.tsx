'use client'

// SearchChips.tsx — Quick-action chips for Explorer
// Shows suggested queries / actions as pill buttons.
// Used in ExplorerChat (empty state) and ExplorerMobileSheet.

import { EXPLORER_CHIPS } from '@/lib/explorer/constants'

interface Props {
  onSelect: (text: string) => void
  /** Max number of chips to show (default: all 6) */
  max?: number
  /** Layout: grid (2-col) or row (horizontal scroll) */
  layout?: 'grid' | 'row'
}

export default function SearchChips({ onSelect, max = 6, layout = 'grid' }: Props) {
  const chips = EXPLORER_CHIPS.slice(0, max)

  if (layout === 'row') {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {chips.map(chip => (
          <button
            key={chip.text}
            onClick={() => onSelect(chip.text)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-800 rounded-full text-[11px] text-slate-400 hover:border-amber-500/40 hover:text-slate-200 transition-colors whitespace-nowrap min-h-[44px]"
          >
            <span>{chip.icon}</span>
            <span>{chip.text.length > 32 ? chip.text.slice(0, 32) + '…' : chip.text}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {chips.map(chip => (
        <button
          key={chip.text}
          onClick={() => onSelect(chip.text)}
          className="text-left px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-400 hover:border-amber-500/40 hover:text-slate-200 transition-colors leading-tight min-h-[44px]"
        >
          <span className="mr-1">{chip.icon}</span>
          {chip.text.length > 38 ? chip.text.slice(0, 38) + '…' : chip.text}
        </button>
      ))}
    </div>
  )
}
