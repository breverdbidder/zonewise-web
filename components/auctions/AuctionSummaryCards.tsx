'use client'

import type { AuctionSummary } from '@/types/auctions'

interface Props {
  summary: AuctionSummary | null
  loading: boolean
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function AuctionSummaryCards({ summary, loading }: Props) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4 animate-pulse">
            <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-8 w-12 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const countyCount = Object.keys(summary.by_county).length
  const addressRate = summary.total > 0
    ? `${((summary.with_address / summary.total) * 100).toFixed(0)}%`
    : '0%'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Auctions" value={summary.total} sub={`${countyCount} counties`} />
      <StatCard label="With Address" value={summary.with_address} sub={addressRate} />
      <StatCard label="Vacant Land" value={summary.vacant_land} />
      <StatCard label="Condos" value={summary.condos} />
    </div>
  )
}
