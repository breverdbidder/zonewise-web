'use client'

import type { ViewMode } from '@/types/auctions'

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
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selectedCounty}
        onChange={(e) => onCountyChange(e.target.value)}
        className="px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-zw-navy-500/30"
      >
        <option value="">All Counties</option>
        {counties.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={selectedType}
        onChange={(e) => onTypeChange(e.target.value)}
        className="px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-zw-navy-500/30"
      >
        <option value="">All Types</option>
        <option value="foreclosure">Foreclosure</option>
        <option value="tax_deed">Tax Deed</option>
      </select>

      <div className="ml-auto flex items-center bg-gray-100 dark:bg-slate-800 rounded-md p-0.5">
        <button
          onClick={() => onViewModeChange('table')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            viewMode === 'table'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          Table
        </button>
        <button
          onClick={() => onViewModeChange('map')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            viewMode === 'map'
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          Map
        </button>
      </div>
    </div>
  )
}
