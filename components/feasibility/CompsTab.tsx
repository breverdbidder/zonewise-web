'use client'

import { useState } from 'react'
import type { SiteData, RentComp, UnitRent, CompsView } from '@/types/feasibility'
import { COLORS, fmt, fmtD } from '@/lib/feasibility/constants'
import { Badge, Card } from './ui'
import MapboxMap from './MapboxMap'

interface CompsTabProps {
  site: SiteData
  comps: RentComp[]
  unitRents: UnitRent[]
}

export default function CompsTab({ site, comps, unitRents }: CompsTabProps) {
  const [view, setView] = useState<CompsView>('Table')
  const views: CompsView[] = ['Map', 'Table', 'Charts']

  const avgUnits = Math.round(comps.reduce((s, c) => s + c.units, 0) / comps.length)
  const avgYear = Math.round(comps.reduce((s, c) => s + c.year, 0) / comps.length)
  const avgOcc = Math.round(comps.reduce((s, c) => s + c.occ, 0) / comps.length)

  return (
    <div className="flex gap-5">
      <div className="flex-1 min-w-0">
        <div className="flex gap-1.5 mb-4">
          {views.map((t) => (
            <button
              key={t}
              onClick={() => setView(t)}
              className={`px-5 py-2 rounded-full text-[13px] font-medium border transition-all ${
                view === t
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {view === 'Map' && (
          <MapboxMap lat={site.lat} lng={site.lng} zoom={14} pitch={30} style={{ height: 400, marginBottom: 16 }} />
        )}

        {view !== 'Map' && (
          <Card>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50">
                  {['Property', 'Address', 'Units', 'Year', 'Occ', '1BR', '2BR'].map((h) => (
                    <th key={h} className="px-2.5 py-2.5 text-left font-semibold text-slate-500 border-b-2 border-slate-200 text-[10px] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comps.map((c, i) => (
                  <tr key={c.name} className={`border-b border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="px-2.5 py-2.5 font-semibold text-slate-900">{c.name}</td>
                    <td className="px-2.5 py-2.5 text-slate-500">{c.addr}</td>
                    <td className="px-2.5 py-2.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.units}</td>
                    <td className="px-2.5 py-2.5 text-slate-500">{c.year}</td>
                    <td className="px-2.5 py-2.5 font-semibold" style={{ color: COLORS.success }}>{c.occ}%</td>
                    <td className="px-2.5 py-2.5 font-semibold" style={{ color: COLORS.brand, fontFamily: "'JetBrains Mono', monospace" }}>{c.one ? fmtD(c.one) : '—'}</td>
                    <td className="px-2.5 py-2.5 font-semibold" style={{ color: COLORS.brand, fontFamily: "'JetBrains Mono', monospace" }}>{c.two ? fmtD(c.two) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Rent Summary */}
        <Card className="p-4 mt-4">
          <div className="flex items-center mb-2.5">
            <span className="text-sm font-bold text-slate-900">Rent Summary</span>
            <Badge text={`${comps.length} Comps · 3mi Radius`} color={COLORS.brand} />
          </div>
          <div className="flex gap-5 mb-2.5 text-xs text-slate-400">
            <span>Avg Units: <strong className="text-slate-900">{avgUnits}</strong></span>
            <span>Avg Year: <strong className="text-slate-900">{avgYear}</strong></span>
            <span>Avg Occ: <strong className="text-slate-900">{avgOcc}%</strong></span>
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200">
                {['Unit Type', 'Avg Rent', 'Avg SF', '$/SF/Mo'].map((h) => (
                  <th key={h} className="px-2.5 py-2 text-right font-semibold text-slate-500 text-[10px] uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unitRents.map((u) => (
                <tr key={u.type} className="border-b border-slate-50">
                  <td className="px-2.5 py-2 font-semibold text-right">{u.type}</td>
                  <td className="px-2.5 py-2 text-right font-bold" style={{ color: COLORS.brand, fontFamily: "'JetBrains Mono', monospace" }}>{fmtD(u.rent)}</td>
                  <td className="px-2.5 py-2 text-right text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(u.sf)}</td>
                  <td className="px-2.5 py-2 text-right text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>${u.psf.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="w-[260px] flex-shrink-0">
        <Card className="p-4">
          <div className="text-[13px] font-bold mb-3" style={{ color: COLORS.brand }}>Comp Filters</div>
          {[
            ['Max Comps', '10'],
            ['Radius', '3 mi'],
            ['Year Built ≥', '2015'],
            ['Asset Type', 'Multifamily'],
            ['Class', 'B+, A'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 text-xs border-b border-slate-50">
              <span className="text-slate-500">{k}</span>
              <span className="font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
            </div>
          ))}
          <button className="w-full mt-3 py-2.5 rounded-lg border-none bg-teal-600 text-white font-semibold text-xs cursor-pointer hover:bg-teal-700 transition-colors">
            🔄 Refresh Comps
          </button>
        </Card>
      </div>
    </div>
  )
}
