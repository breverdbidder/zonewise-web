'use client'

import { useState } from 'react'
import type { SiteData } from '@/types/feasibility'
import { COLORS, fmt } from '@/lib/feasibility/constants'
import { Card, SectionLabel } from './ui'
import dynamic from 'next/dynamic'
// mapbox-gl is ~731KB and blocks the main thread for ~1.9s at init.
// Loading it on demand keeps it out of the initial bundle.
const MapboxMap = dynamic(() => import('./MapboxMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-slate-900 rounded-xl w-full h-full" style={{ minHeight: 180 }}>
      <span className="text-slate-400 text-sm animate-pulse">Loading map…</span>
    </div>
  ),
})

interface CapacityTabProps {
  site: SiteData
}

export default function CapacityTab({ site }: CapacityTabProps) {
  const [scenario, setScenario] = useState('Mixed')
  const buildableFootprint = Math.round(site.lotArea * site.coverage * 0.65)

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="flex-1">
        <MapboxMap lat={site.lat} lng={site.lng} zoom={18} pitch={60} style={{ height: 420 }} />

        <div className="grid grid-cols-4 gap-2.5 mt-3.5">
          {[
            ['Est. Max Units', '16', COLORS.brand],
            ['Buildable Area', `${fmt(site.lotArea * site.coverage)} SF`, COLORS.success],
            ['Max Height', `${site.maxHeight} ft`, '#7c3aed'],
            ['FAR Used', `${site.far} (100%)`, COLORS.danger],
          ].map(([l, v, c]) => (
            <div key={l} className="bg-white rounded-lg p-3.5 border border-slate-200" style={{ borderLeft: `3px solid ${c}` }}>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{l}</div>
              <div className="text-xl font-bold text-slate-900 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-3.5 rounded-lg p-3.5" style={{ background: COLORS.brandLight, border: `1px solid ${COLORS.brand}30` }}>
          <div className="text-xs font-semibold mb-1" style={{ color: COLORS.brandDark }}>🏗️ ZoneWise Capacity Analysis</div>
          <div className="text-xs text-slate-500 leading-relaxed">
            After setbacks ({site.setFront}ft front, {site.setSide}ft sides, {site.setRear}ft rear), buildable footprint
            is ~{fmt(buildableFootprint)} SF. At 3 stories with {site.parking}/unit surface parking, optimal
            configuration yields 14-16 units in a garden apartment layout.
            Townhome alternative: 6-8 units at higher per-unit rent ($2,800-3,200/mo).
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[260px] flex-shrink-0">
        <Card className="p-4">
          <div className="text-[13px] font-bold text-slate-900 mb-3">Massing Controls</div>
          <SectionLabel text="Scenario" />
          <div className="flex gap-1 mb-4">
            {['Townhome', 'Garden Apt', 'Mixed'].map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`flex-1 py-2 rounded-md text-[10px] font-semibold border transition-all ${
                  scenario === s
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <SectionLabel text="Overrides" />
          {[
            ['Height', `${site.maxHeight} ft`],
            ['FAR', `${site.far}`],
            ['Front Setback', `${site.setFront} ft`],
            ['Side Setback', `${site.setSide} ft`],
            ['Rear Setback', `${site.setRear} ft`],
            ['Parking', `${site.parking}/unit`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 text-xs border-b border-slate-50">
              <span className="text-slate-500">{k}</span>
              <span className="font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
