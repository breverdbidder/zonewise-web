'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { type CountyConquestStatus, type FlRegion, subscribeToConquestUpdates } from '@/lib/conquest'
import { createClient } from '@/lib/supabase/client'

const REGION_LABELS: Record<FlRegion, string> = {
  panhandle: 'Panhandle',
  north: 'North',
  central: 'Central',
  south: 'South',
}

const REGION_COLORS: Record<FlRegion, string> = {
  panhandle: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  north: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  central: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  south: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

type SortKey = 'alpha' | 'population' | 'dor'

function CountyCard({ county }: { county: CountyConquestStatus }) {
  const isConquered = county.conquered
  const coverageWidth = `${county.coverage_pct}%`

  return (
    <Link
      href={`/conquest/${county.slug}`}
      className={`group relative rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
        isConquered
          ? 'border-emerald-500/50 bg-emerald-950/30 hover:border-emerald-400/70'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm text-white leading-tight">{county.name}</h3>
          <span className="text-xs text-slate-400">DOR #{String(county.dor_number).padStart(2, '0')}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${REGION_COLORS[county.region]}`}
          >
            {REGION_LABELS[county.region]}
          </span>
          {isConquered && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              CONQUERED
            </span>
          )}
        </div>
      </div>

      {/* Coverage bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Coverage</span>
          <span
            className={`text-xs font-bold tabular-nums ${
              isConquered ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {county.coverage_pct.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isConquered ? 'bg-emerald-400' : 'bg-slate-600'
            }`}
            style={{ width: coverageWidth }}
          />
        </div>
      </div>

      {/* Parcel count if conquered */}
      {isConquered && (
        <div className="text-xs text-emerald-400/80 font-mono">
          {county.zoned_parcels.toLocaleString()} parcels zoned
        </div>
      )}
      {!isConquered && (
        <div className="text-xs text-slate-600 font-mono">
          ~{(county.total_parcels / 1000).toFixed(0)}K parcels pending
        </div>
      )}

      {/* Hover arrow */}
      <span className="absolute bottom-3 right-3 text-slate-600 group-hover:text-slate-400 transition-colors text-xs">
        →
      </span>
    </Link>
  )
}

interface CountyGridProps {
  initialData: CountyConquestStatus[]
}

type RegionFilter = 'all' | FlRegion

export default function CountyGrid({ initialData }: CountyGridProps) {
  const [counties, setCounties] = useState<CountyConquestStatus[]>(initialData)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState<RegionFilter>('all')
  const [sort, setSort] = useState<SortKey>('alpha')

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const unsubscribe = subscribeToConquestUpdates(supabase, (slug, updates) => {
      setCounties(prev =>
        prev.map(c => (c.slug === slug ? { ...c, ...updates } : c))
      )
    })
    return unsubscribe
  }, [])

  const filtered = useMemo(() => {
    let list = [...counties]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q))
    }

    if (region !== 'all') {
      list = list.filter(c => c.region === region)
    }

    switch (sort) {
      case 'alpha':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'population':
        list.sort((a, b) => b.population - a.population)
        break
      case 'dor':
        list.sort((a, b) => a.dor_number - b.dor_number)
        break
    }

    // Conquered always first
    const conquered = list.filter(c => c.conquered)
    const pending = list.filter(c => !c.conquered)
    return [...conquered, ...pending]
  }, [counties, search, region, sort])

  const conqueredCount = counties.filter(c => c.conquered).length

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <input
          type="text"
          placeholder="Search county..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] max-w-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-colors"
        />

        {/* Region filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {(['all', 'panhandle', 'north', 'central', 'south'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                region === r
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {r === 'all' ? `All (${counties.length})` : r}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 cursor-pointer"
        >
          <option value="alpha">A–Z</option>
          <option value="population">Population</option>
          <option value="dor">DOR Number</option>
        </select>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* Results summary */}
      <div className="text-xs text-slate-400">
        Showing {filtered.length} of {counties.length} counties
        {conqueredCount > 0 && (
          <span className="text-emerald-400 ml-2">
            · {conqueredCount} conquered
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map(county => (
          <CountyCard key={county.slug} county={county} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">
          No counties match your search.
        </div>
      )}
    </div>
  )
}
