'use client'

import type { SiteData } from '@/types/feasibility'
import { COLORS } from '@/lib/feasibility/constants'
import { Card, SectionLabel } from './ui'
import MapboxMap from './MapboxMap'

interface MarketTabProps {
  site: SiteData
}

export default function MarketTab({ site }: MarketTabProps) {
  return (
    <div className="flex gap-5">
      <div className="flex-1">
        <Card className="p-5">
          <div className="flex items-center mb-4">
            <span className="text-base font-bold text-slate-900">{site.county} County Market Intelligence</span>
            <span className="ml-2 text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ background: COLORS.success + '15', color: COLORS.success }}>
              Live Data
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              ['Median HH Income', '$82,100', '+3.8% YoY', COLORS.brand],
              ['Population Growth', '+2.6%', '2024–2025', COLORS.info],
              ['Building Permits', '2,147', 'trailing 12mo', COLORS.accent],
              ['Median Home Price', '$345,000', '+5.2% YoY', COLORS.success],
              ['Avg Rent (1BR)', '$1,790', '+4.8% YoY', COLORS.brand],
              ['MF Vacancy', '5.2%', `${site.county} County`, COLORS.danger],
            ].map(([label, val, sub, color]) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3.5" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</div>
                <div className="text-xl font-bold text-slate-900 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg p-3.5" style={{ background: COLORS.brandLight }}>
              <div className="text-xs font-semibold mb-2" style={{ color: COLORS.brandDark }}>🏠 HUD Fair Market Rent (2026)</div>
              {[['Studio', '$1,280'], ['1-BR', '$1,450'], ['2-BR', '$1,750'], ['3-BR', '$2,200']].map(([t, v]) => (
                <div key={t} className="flex justify-between text-xs py-0.5">
                  <span className="text-slate-500">{t}</span>
                  <span className="font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-3.5 bg-amber-50">
              <div className="text-xs font-semibold text-amber-800 mb-2">🚀 Key Employment Drivers</div>
              {['Kennedy Space Center', 'Patrick SFB', 'L3Harris Technologies', 'Health First', 'SpaceX / Blue Origin'].map((e) => (
                <div key={e} className="text-xs text-slate-500 py-0.5">• {e}</div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <SectionLabel text="Data Sources" />
            <div className="text-xs text-slate-500 leading-relaxed">
              Census ACS 5-Year (2024) · Bureau of Labor Statistics · HUD FMR (2026) · Census Building Permits Survey · {site.county} County Property Appraiser
            </div>
          </div>
        </Card>
      </div>
      <div className="w-[300px] flex-shrink-0">
        <SectionLabel text="Location Context" />
        <div className="text-sm font-bold text-slate-900 mb-3">{site.address}</div>
        <MapboxMap lat={site.lat} lng={site.lng} zoom={12} pitch={0} style={{ height: 280 }} />
      </div>
    </div>
  )
}
