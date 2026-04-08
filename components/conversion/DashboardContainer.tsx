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

function buildKpiStats(stats: PlatformStats): StatItem[] {
  return [
    {
      key: 'fl-parcels',
      label: 'FL Parcels',
      value: stats.fl_parcels,
      format: { kind: 'number', compact: true },
    },
    {
      key: 'auctions',
      label: 'Auctions Tracked',
      value: stats.auctions,
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

const RECENT_AUCTIONS = [
  { case: '2024-CA-001234', county: 'Brevard', address: '123 Ocean Dr, Titusville', bid: '$148,500', date: '2026-04-03' },
  { case: '2024-CA-005671', county: 'Orange', address: '456 Pine Ave, Orlando', bid: '$312,000', date: '2026-04-04' },
  { case: '2024-CA-009982', county: 'Miami-Dade', address: '789 Coral Way, Miami', bid: '$520,000', date: '2026-04-05' },
]

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

      {/* Recent auctions table */}
      <div className="flex-1">
        <h2 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Recent Auctions
        </h2>
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(30, 58, 95, 0.6)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Case #</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>County</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell" style={{ color: 'rgba(255,255,255,0.5)' }}>Address</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Opening Bid</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell" style={{ color: 'rgba(255,255,255,0.5)' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_AUCTIONS.map((auction, i) => (
                <tr
                  key={auction.case}
                  className="cursor-pointer"
                  style={{
                    background: i % 2 === 0 ? 'rgba(30, 58, 95, 0.2)' : 'transparent',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                  }}
                  onClick={(e) => { e.stopPropagation(); trackClick() }}
                >
                  <td className="px-4 py-3 font-mono" style={{ color: '#F59E0B' }}>{auction.case}</td>
                  <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.85)' }}>{auction.county}</td>
                  <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'rgba(255,255,255,0.6)' }}>{auction.address}</td>
                  <td className="px-4 py-3 font-semibold">{auction.bid}</td>
                  <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'rgba(255,255,255,0.5)' }}>{auction.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade banner */}
      <div
        className="rounded-lg px-5 py-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: '#F59E0B' }}>Upgrade to unlock live data</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Real-time auctions, AI deal scoring, and personalized alerts across 67 counties
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
