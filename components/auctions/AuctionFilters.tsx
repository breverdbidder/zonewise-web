'use client'

import type { ViewMode } from '@/types/auctions'

/**
 * The zoning dropdown was removed on Aug 17 2026. multi_county_auctions has no
 * zoning_category column, so selecting a zone sent zoning_category= to
 * /api/auctions and produced a hard 500 - the control could never have worked.
 * Real zoning filtering requires joining auctions to zoning_assignments and is
 * tracked as its own piece of work; shipping a control that silently does
 * nothing is worse than not shipping it.
 */

interface Props {
  counties: string[]
  selectedCounty: string
  selectedType: string
  viewMode: ViewMode
  onCountyChange: (county: string) => void
  onTypeChange: (type: string) => void
  onViewModeChange: (mode: ViewMode) => void
}

export default function AuctionFilters({
  counties,
  selectedCounty,
  selectedType,
  viewMode,
  onCountyChange,
  onTypeChange,
  onViewModeChange,
}: Props) {
  const selectClass = 'px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-zw-navy-500/30'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selectedCounty}
        onChange={(e) => onCountyChange(e.target.value)}
        className={selectClass}
      >
        <option value="">All Counties</option>
        {counties.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={selectedType}
        onChange={(e) => onTypeChange(e.target.value)}
        className={selectClass}
      >
        <option value="">All Types</option>
        <option value="foreclosure">Foreclosure</option>
        <option value="tax_deed">Tax Deed</option>
      </select>

      <div className="ml-auto flex items-center bg-gray-100 dark:bg-slate-800 rounded-md p-0.5">
        {(['table', 'map', 'calendar', 'spreadsheet'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              viewMode === mode
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}
