'use client'

import React, { useEffect, useState } from 'react'
import { useClickTracker } from './ClickTracker'
import { StatsDisplay } from '@/components/tool-ui/stats-display'
import type { StatItem } from '@/components/tool-ui/stats-display/schema'

interface PlatformStats {
  counties: number
  fl_parcels: number
  fl_parcels_alive: boolean
  brevard_parcels: number
  zoning_assignments: number
  auctions: number
  zoning_codes: number
}

const FALLBACK_STATS: PlatformStats = {
  counties: 67,
  fl_parcels: 0,
  fl_parcels_alive: false,
  brevard_parcels: 0,
  zoning_assignments: 0,
  auctions: 0,
  zoning_codes: 0,
}

// Aug 16 2026 fix: this whole panel was BidDeed.AI's dashboard shipped
// verbatim onto ZoneWise.AI — "Auctions Tracked" KPI, a "Recent Auctions"
// table of FABRICATED case numbers (2024-CA-001234 etc. do not exist), and
// an upgrade banner selling "Real-time auctions". scripts/audit-site.mjs
// flagged the banned SSOT term "auction" plus a genuine layout bug (the
// banner's fixed-width button squeezed its own copy into a 78px column on
// mobile). Swapped for zoning-native KPIs/content; auctions belong on
// BidDeed.AI only.
function buildKpiStats(stats: PlatformStats): StatItem[] {
  return [
    {
      key: 'fl-parcels',
      label: 'FL Parcels',
      value: stats.fl_parcels,
      format: { kind: 'number', compact: true },
    },
    {
      key: 'zoning-codes',
      label: 'Zoning Codes Mapped',
      value: stats.zoning_codes,
      format: { kind: 'number', compact: true },
    },
    {
      key: 'counties-tracked',
      label: 'Counties',
      value: stats.counties,
      format: { kind: 'number' },
    },
    {
      key: 'zoning-assignments',
      label: 'Zoning Assignments',
      value: stats.zoning_assignments,
      format: { kind: 'number', compact: true },
    },
  ]
}

export default function DashboardContainer() {
  const { trackClick } = useClickTracker()
  const [stats, setStats] = useState<PlatformStats>(FALLBACK_STATS)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
  }, [])

  const kpiStats = buildKpiStats(stats)

  return (
    <div
      className="flex flex-col w-full h-full p-6 gap-6"
      style={{ background: '#020617', color: '#FFFFFF' }}
      onClick={trackClick}
    >
      {/* KPI grid — tool-ui StatsDisplay */}
      <div>
        <h2 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Key Metrics
        </h2>
        <StatsDisplay
          id="dashboard-kpis"
          stats={kpiStats}
          className="max-w-full min-w-0 [&_.card]:!bg-[#1E3A5F] [&_.card]:!border-[rgba(245,158,11,0.15)]"
        />
      </div>

      {/* Upgrade banner — flex-wrap added so the button never squeezes the
          copy into an unreadable column on narrow viewports. */}
      <div
        className="mt-auto rounded-lg px-5 py-4 flex flex-wrap items-center justify-between gap-4"
        style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#F59E0B' }}>Upgrade to unlock full coverage</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Live parcel zoning, AI feasibility scoring, and personalized alerts across 67 counties
          </p>
        </div>
        <button
          className="rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap"
          style={{ background: '#F59E0B', color: '#020617', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); trackClick() }}
        >
          Upgrade — $99/mo
        </button>
      </div>
    </div>
  )
}
