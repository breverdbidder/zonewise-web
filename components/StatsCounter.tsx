'use client'

import { useEffect, useState } from 'react'

interface Stats {
  counties: number
  parcels: number
}

function formatLarge(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

interface StatItemProps {
  label: string
  value: number
  formatter?: (n: number) => string
  suffix?: string
  loading: boolean
}

function StatItem({ label, value, formatter, suffix, loading }: StatItemProps) {
  const displayValue = formatter ? formatter(value) : String(value)
  return (
    <div className="text-center">
      {loading ? (
        <div className="h-10 w-24 mx-auto rounded-lg bg-slate-700/60 animate-pulse mb-2" />
      ) : (
        <p className="text-3xl sm:text-4xl font-bold text-[#F59E0B]">
          {displayValue}{suffix}
        </p>
      )}
      <p className="text-slate-300 text-sm mt-1">{label}</p>
    </div>
  )
}

export default function StatsCounter() {
  // Initialize with real values — no skeleton flash on load
  const [stats, setStats] = useState<Stats>({ counties: 67, parcels: 10_800_000 })
  const [loading] = useState(false)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then((data: Stats) => setStats(data))
      .catch(() => {}) // keep fallback values on error
  }, [])

  return (
    <div className="grid grid-cols-2 gap-6 sm:flex sm:items-center sm:justify-center sm:gap-16 py-2">
      <StatItem
        label="Florida Counties"
        value={stats?.counties ?? 67}
        loading={loading}
      />
      <StatItem
        label="Parcels Analyzed"
        value={stats?.parcels ?? 10_800_000}
        formatter={formatLarge}
        suffix="+"
        loading={loading}
      />
    </div>
  )
}
