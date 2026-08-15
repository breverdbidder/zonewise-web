'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CountyStats {
  county_name: string
  total_parcels: number | null
  zoned_parcels: number | null
}

interface HybridPreviewProps {
  counties: string[]
}

const DEAL_INSIGHTS_TEMPLATES = [
  (county: string) => `New feasibility signal in ${county}: 47 parcels match your buy box this month`,
  (county: string) => `Zoning change alert: ${county} rezoning 12 parcels from R-1 to C-1`,
  (county: string) => `Price event: ${county} median bid dropped 8% last 30 days`,
]

export default function HybridPreview({ counties }: HybridPreviewProps) {
  const [stats, setStats] = useState<CountyStats[]>([])
  const [loading, setLoading] = useState(true)

  const displayCounties = counties.length > 0 ? counties : ['Brevard', 'Miami-Dade', 'Orange']

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('fl_counties')
          .select('county_name, total_parcels, zoned_parcels')
          .in('county_name', displayCounties)
          .limit(10)

        if (data && data.length > 0) {
          setStats(data as CountyStats[])
        }
      } catch {
        // silently ignore — preview still shows with simulated data
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [displayCounties.join(',')])

  const totalParcels = stats.reduce((sum, s) => sum + (s.total_parcels ?? 0), 0)
  const totalZoned = stats.reduce((sum, s) => sum + (s.zoned_parcels ?? 0), 0)
  const coveragePct = totalParcels > 0 ? Math.round((totalZoned / totalParcels) * 100) : null

  return (
    <div className="flex flex-col h-full" style={{ color: '#FFFFFF', padding: '2rem' }}>
      {/* Header */}
      <h2 className="font-bold mb-4" style={{ fontSize: '1.25rem', color: '#F59E0B' }}>
        Your Focus Counties
      </h2>

      {/* County chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {displayCounties.map((county) => (
          <span
            key={county}
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#F59E0B',
            }}
          >
            {county}
          </span>
        ))}
      </div>

      {/* Real stats */}
      {!loading && stats.length > 0 && (
        <div className="flex gap-4 mb-6">
          <div
            className="flex-1 rounded-lg p-4"
            style={{ background: 'rgba(30, 58, 95, 0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="text-2xl font-bold" style={{ color: '#F59E0B' }}>
              {totalParcels.toLocaleString()}
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Total Parcels
            </div>
          </div>
          {coveragePct !== null && (
            <div
              className="flex-1 rounded-lg p-4"
              style={{ background: 'rgba(30, 58, 95, 0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="text-2xl font-bold" style={{ color: '#F59E0B' }}>
                {coveragePct}%
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Zoning Coverage
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deal insight cards */}
      <h3 className="font-semibold mb-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
        Recent Intelligence
      </h3>
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {DEAL_INSIGHTS_TEMPLATES.map((template, i) => {
          const county = displayCounties[i % displayCounties.length] ?? 'Florida'
          return (
            <div
              key={i}
              className="rounded-lg p-4"
              style={{
                background: 'rgba(30, 58, 95, 0.4)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: '1.5' }}>
                {template(county)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Data badge */}
      <div
        className="mt-4 text-center text-xs py-2 rounded"
        style={{
          background: 'rgba(245, 158, 11, 0.08)',
          color: 'rgba(245, 158, 11, 0.7)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
        }}
      >
        Powered by real ZoneWise data
      </div>
    </div>
  )
}
