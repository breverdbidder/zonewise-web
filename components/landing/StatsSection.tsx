'use client'

import { useEffect, useState } from 'react'

interface StatsData {
  counties: number
  fl_parcels: number
  auctions: number
  zoning_assignments: number
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`
  return String(n)
}

export function StatsSection() {
  const [stats, setStats] = useState<StatsData>({
    counties: 67,
    fl_parcels: 9410902,
    auctions: 245000,
    zoning_assignments: 351518,
  })

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d: StatsData) => {
        if (d?.counties) setStats(d)
      })
      .catch(() => {
        // Keep defaults
      })
  }, [])

  const items = [
    { value: formatNumber(stats.auctions), label: 'Auction records' },
    { value: formatNumber(stats.fl_parcels), label: 'FL parcels' },
    { value: String(stats.counties), label: 'Florida counties' },
    { value: '93.3%', label: 'Brevard zoning coverage' },
  ]

  return (
    <section className="border-y border-slate-800 bg-slate-900/30 py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {items.map((s) => (
            <div key={s.label}>
              <div className="text-3xl sm:text-4xl font-bold text-[#F59E0B] mb-1">
                {s.value}
              </div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
