'use client'

import { useState } from 'react'
import type {
  FeasibilityTab, SiteData, ZoningControl, RentComp, UnitRent, UnitMix,
  LodgingPermissions, NearbyLodgingParcel, MarketDemographics, MarketScore,
} from '@/types/feasibility'
import { COLORS } from '@/lib/feasibility/constants'
import SiteTab from './SiteTab'
import MarketContext from './MarketContext'
import LodgingTab from './LodgingTab'
import CompsTab from './CompsTab'
import CapacityTab from './CapacityTab'
import DevelopTab from './DevelopTab'
import ExportTab from './ExportTab'

interface FeasibilityLayoutProps {
  site: SiteData
  zoningControls: ZoningControl[]
  comps: RentComp[]
  unitRents: UnitRent[]
  unitMix: UnitMix[]
  lodging: LodgingPermissions
  nearbyLodging?: NearbyLodgingParcel[]
  demographics: MarketDemographics
  marketScore: MarketScore
}

const TABS: FeasibilityTab[] = ['Site', 'Market', 'Lodging', 'Comps', 'Capacity', 'Develop', 'Generate']

export default function FeasibilityLayout({
  site,
  zoningControls,
  comps,
  unitRents,
  unitMix,
  lodging,
  nearbyLodging = [],
  demographics,
  marketScore,
}: FeasibilityLayoutProps) {
  const [tab, setTab] = useState<FeasibilityTab>('Site')

  return (
    <div className="min-h-screen" style={{ background: COLORS.surface, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav Bar */}
      <nav
        className="flex items-center border-b-2 px-6 h-[54px] sticky top-0 z-50"
        style={{ background: COLORS.navy, borderColor: COLORS.border }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mr-9">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-extrabold text-white"
            style={{ background: `linear-gradient(135deg, ${COLORS.brand}, ${COLORS.accent})` }}
          >
            Z
          </div>
          <span className="font-bold text-[17px] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}>
            ZoneWise<span style={{ color: COLORS.accent }}>.AI</span>
          </span>
        </div>

        {/* Tabs */}
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="bg-transparent border-none px-4 py-4 text-[13px] font-medium transition-all cursor-pointer"
            style={{
              color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)',
              borderBottom: tab === t ? `2px solid ${COLORS.brand}` : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {t}
          </button>
        ))}

        <div className="flex-1" />

        {/* NLP Chat — click to open Export tab */}
        <button
          onClick={() => setTab('Generate')}
          className="flex items-center gap-2 bg-white/[0.08] px-3.5 py-1.5 rounded-lg cursor-pointer hover:bg-white/[0.12] transition-colors border-none"
        >
          <span className="text-xs opacity-70">💬</span>
          <span className="text-xs text-white/50 italic">Ask anything about this site...</span>
        </button>

        {/* User */}
        <div className="ml-3 flex items-center gap-2">
          <span className="text-[10px] font-semibold text-white px-2.5 py-0.5 rounded-full" style={{ background: COLORS.brand }}>
            PRO
          </span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: COLORS.brand }}
          >
            AS
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-5 py-5 pb-16">
        {/* Address header */}
        <div className="flex items-center gap-2.5 mb-4">
          <h1 className="text-lg font-bold text-slate-900 m-0">{site.address}</h1>
          <span className="text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-500">
            {site.zone}
          </span>
          {site.flood !== 'X' && (
            <span className="text-[11px] bg-amber-50 px-2 py-0.5 rounded-md text-amber-800 font-semibold">
              Flood: {site.flood}
            </span>
          )}
          {site.waterBody && (
            <span className="text-[11px] bg-blue-50 px-2 py-0.5 rounded-md text-blue-800 font-semibold">
              🌊 {site.waterBody}
            </span>
          )}
        </div>

        {/* Tab Content */}
        {tab === 'Site'     && <SiteTab site={site} zoningControls={zoningControls} />}
        {tab === 'Market'   && <MarketContext site={site} demographics={demographics} score={marketScore} />}
        {tab === 'Lodging'  && <LodgingTab site={site} lodging={lodging} nearbyLodging={nearbyLodging} />}
        {tab === 'Comps'    && <CompsTab site={site} comps={comps} unitRents={unitRents} />}
        {tab === 'Capacity' && <CapacityTab site={site} />}
        {tab === 'Develop'  && <DevelopTab site={site} unitMix={unitMix} />}
        {tab === 'Generate' && <ExportTab site={site} />}
      </main>
    </div>
  )
}
