'use client'

import React from 'react'
import { useClickTracker } from './ClickTracker'

const KPI_CARDS = [
  { label: 'Active Auctions', value: '247', delta: '+12%' },
  { label: 'Avg Bid Price', value: '$184K', delta: '-3%' },
  { label: 'Counties Tracked', value: '67', delta: '100%' },
  { label: 'Zoning Alerts', value: '31', delta: '+8' },
]

const RECENT_AUCTIONS = [
  { case: '2024-CA-001234', county: 'Brevard', address: '123 Ocean Dr, Titusville', bid: '$148,500', date: '2026-04-03' },
  { case: '2024-CA-005671', county: 'Orange', address: '456 Pine Ave, Orlando', bid: '$312,000', date: '2026-04-04' },
  { case: '2024-CA-009982', county: 'Miami-Dade', address: '789 Coral Way, Miami', bid: '$520,000', date: '2026-04-05' },
]

export default function DashboardContainer() {
  const { trackClick } = useClickTracker()

  return (
    <div
      className="flex flex-col w-full h-full p-6 gap-6"
      style={{ background: '#020617', color: '#FFFFFF' }}
      onClick={trackClick}
    >
      {/* KPI grid */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          KEY METRICS
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {KPI_CARDS.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg p-4 cursor-pointer"
              style={{
                background: '#1E3A5F',
                border: '1px solid rgba(245, 158, 11, 0.15)',
              }}
              onClick={(e) => { e.stopPropagation(); trackClick() }}
            >
              <div className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                {kpi.value}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {kpi.label}
              </div>
              <div className="text-xs mt-1 font-medium" style={{ color: '#F59E0B' }}>
                {kpi.delta}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent auctions table */}
      <div className="flex-1">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
          RECENT AUCTIONS
        </h2>
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(30, 58, 95, 0.6)' }}>
                <th
                  className="text-left px-4 py-3 font-medium"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Case #
                </th>
                <th
                  className="text-left px-4 py-3 font-medium"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  County
                </th>
                <th
                  className="text-left px-4 py-3 font-medium hidden sm:table-cell"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Address
                </th>
                <th
                  className="text-left px-4 py-3 font-medium"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Opening Bid
                </th>
                <th
                  className="text-left px-4 py-3 font-medium hidden sm:table-cell"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  Date
                </th>
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
                  <td className="px-4 py-3" style={{ color: '#F59E0B', fontFamily: 'monospace' }}>
                    {auction.case}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {auction.county}
                  </td>
                  <td
                    className="px-4 py-3 hidden sm:table-cell"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    {auction.address}
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#FFFFFF' }}>
                    {auction.bid}
                  </td>
                  <td
                    className="px-4 py-3 hidden sm:table-cell"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {auction.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade banner */}
      <div
        className="rounded-lg px-5 py-4 flex items-center justify-between gap-4"
        style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
            Upgrade to unlock live data
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Real-time auctions, AI deal scoring, and personalized alerts across 67 counties
          </p>
        </div>
        <button
          className="rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap"
          style={{
            background: '#F59E0B',
            color: '#020617',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={(e) => { e.stopPropagation(); trackClick() }}
        >
          Upgrade — $99/mo
        </button>
      </div>
    </div>
  )
}
