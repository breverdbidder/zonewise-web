'use client'

import { useState } from 'react'
import type { SiteData, ZoningControl, SiteSubTab } from '@/types/feasibility'
import { COLORS, fmt, fmtD } from '@/lib/feasibility/constants'
import { Badge, Card, SectionLabel } from './ui'
import MapboxMap from './MapboxMap'

interface SiteTabProps {
  site: SiteData
  zoningControls: ZoningControl[]
}

export default function SiteTab({ site, zoningControls }: SiteTabProps) {
  const [subTab, setSubTab] = useState<SiteSubTab>('Summary')
  const subtabs: SiteSubTab[] = ['Summary', 'Zoning', 'Map View']

  return (
    <div className="flex gap-5">
      <div className="flex-1 min-w-0">
        <div className="flex gap-1.5 mb-4">
          {subtabs.map((t) => (
            <button
              key={t}
              onClick={() => setSubTab(t)}
              className={`px-5 py-2 rounded-full text-[13px] font-medium border transition-all ${
                subTab === t
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {subTab === 'Summary' && <SiteSummary site={site} />}
        {subTab === 'Zoning' && <ZoningReport site={site} controls={zoningControls} />}
        {subTab === 'Map View' && (
          <MapboxMap lat={site.lat} lng={site.lng} zoom={17} pitch={50} style={{ height: 480 }} />
        )}
      </div>

      {/* Sidebar */}
      <div className="w-[300px] flex-shrink-0">
        <SectionLabel text="Subject Property" />
        <div className="text-sm font-bold text-slate-900 mb-3 leading-snug">{site.address}</div>
        <MapboxMap lat={site.lat} lng={site.lng} zoom={15} pitch={0} style={{ height: 180, marginBottom: 16 }} />
        <Card className="p-4">
          <SectionLabel text="Quick Stats" />
          {[
            ['Lot Area', `${fmt(site.lotArea)} SF`],
            ['Max Height', `${site.maxHeight} ft`],
            ['FAR', `${site.far}`],
            ['Max Coverage', `${site.coverage * 100}%`],
            ['Parking Req', `${site.parking}/unit`],
            ['Flood Zone', site.flood],
            ['Max Buildable', `${fmt(site.lotArea * site.far)} SF`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1 text-xs border-b border-slate-50">
              <span className="text-slate-500">{k}</span>
              <span className="font-semibold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

function SiteSummary({ site }: { site: SiteData }) {
  const insights = [
    ['Location & Zoning', `${site.zoneCity} site (${site.county} County) zoned ${site.zone}. Prime corridor with strong demographics and employment base.`],
    ['Site Characteristics', `${fmt(site.lotArea)} sq ft lot with existing ${site.yearBuilt} structure. FEMA Zone ${site.flood}. Lot dimensions support multifamily redevelopment.`],
    ['Development Potential', `FAR ${site.far} allows up to ${fmt(site.lotArea * site.far)} SF buildable area. Height limit ${site.maxHeight} ft. Strong MTR demand from nearby employers.`],
    ['Market Signal', `Low vacancy with consistent rent growth. Permits trending upward in ${site.county} County trailing 12 months.`],
    ['Investment Thesis', `Mid-term rental opportunity driven by workforce housing demand. Below-market acquisition basis enables strong yield on cost.`],
  ]

  return (
    <Card>
      <div className="p-5 border-b border-slate-200" style={{ background: `linear-gradient(135deg, ${COLORS.brandLight}, #fff)` }}>
        <div className="flex items-center mb-3.5">
          <span className="text-[15px] font-bold" style={{ color: COLORS.brand }}>AI Site Intelligence</span>
          <Badge text="Claude-Powered" color={COLORS.brand} />
        </div>
        {insights.map(([title, text]) => (
          <div key={title} className="mb-2.5 text-[13px] leading-relaxed text-slate-500">
            <strong className="text-slate-900">{title}:</strong> {text}
          </div>
        ))}
      </div>
      <div className="p-5">
        <div className="text-sm font-bold text-slate-900 mb-3.5">Property Summary</div>
        {([
          ['Parcel', [
            ['Parcel ID', site.parcelId],
            ['Assessed Value', fmtD(site.parcelValue)],
            ['Ownership', site.ownership],
            ['Year Built', String(site.yearBuilt)],
          ]],
          ['Zoning', [
            ['District', site.zone],
            ['Municipality', site.zoneCity],
            ['Opportunity Zone', site.qoz],
            ['FEMA Flood Zone', site.flood],
          ]],
          ['Market Context', [
            ['County', site.county],
          ]],
        ] as [string, [string, string][]][]).map(([section, rows]) => (
          <div key={section} className="mb-4">
            <SectionLabel text={section} />
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 text-[13px] border-b border-slate-50">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-900">{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}

function ZoningReport({ site, controls }: { site: SiteData; controls: ZoningControl[] }) {
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center mb-1.5">
          <span className="text-base font-bold" style={{ color: COLORS.brand }}>Zoning Analysis</span>
          <Badge text="Claude-Powered" color={COLORS.brand} />
        </div>
        <div className="text-xs text-slate-400 mb-5">
          Data source: {site.county} County Land Development Code
        </div>

        <div className="text-sm font-bold mb-2.5">1. District Overview</div>
        {[
          ['Site Address', site.address],
          ['Zoning District', site.zone],
          ['Jurisdiction', `${site.zoneCity} / ${site.county} County`],
        ].map(([k, v]) => (
          <div key={k} className="text-[13px] mb-2 leading-relaxed">
            <strong>{k}:</strong> {v}
          </div>
        ))}

        <div className="text-sm font-bold mt-6 mb-3">2. Development Controls</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                {['Control', 'Value', 'Basis', 'Code Reference'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500 border-b-2 border-slate-200 text-[10px] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {controls.map((r, i) => (
                <tr key={r.control} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{r.control}</td>
                  <td className="px-3 py-2.5 font-bold" style={{ color: COLORS.brand }}>{r.value}</td>
                  <td className="px-3 py-2.5 text-slate-500 text-[11px]">{r.assumption}</td>
                  <td className="px-3 py-2.5 text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{r.citation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded-lg p-3.5" style={{ background: COLORS.brandLight, border: `1px solid ${COLORS.brand}30` }}>
          <div className="text-xs font-semibold mb-1" style={{ color: COLORS.brandDark }}>💡 ZoneWise Insight</div>
          <div className="text-xs text-slate-500 leading-relaxed">
            {site.zone} zoning with {site.maxHeight}ft height and {site.far} FAR supports a 3-story garden apartment or townhome product.
            The {site.parking}/unit parking requirement is manageable with surface parking on a {fmt(site.lotArea)} SF lot.
          </div>
        </div>
      </div>
    </Card>
  )
}
