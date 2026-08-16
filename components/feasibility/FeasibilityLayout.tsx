'use client'

import { useState } from 'react'
import type {
  FeasibilityTab, SiteData, ZoningControl, RentComp, UnitRent, UnitMix,
  LodgingPermissions, NearbyLodgingParcel, MarketDemographics, MarketScore, CompBenchmark, RentalComps,
} from '@/types/feasibility'
import { COLORS } from '@/lib/feasibility/constants'
import DemoDataBadge from '@/components/ui/DemoDataBadge'
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
  compBenchmark?: CompBenchmark | null
  rentalComps?: RentalComps | null
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
  compBenchmark = null,
  rentalComps = null,
}: FeasibilityLayoutProps) {
  const [tab, setTab] = useState<FeasibilityTab>('Site')
  const [betaBannerDismissed, setBetaBannerDismissed] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: COLORS.surface, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav Bar */}
      <nav
        className="flex items-center border-b-2 px-6 h-[54px] sticky top-0 z-50 gap-2"
        style={{ background: COLORS.navy, borderColor: COLORS.border }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2 sm:mr-9 shrink-0">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-extrabold text-white"
            style={{ background: `linear-gradient(135deg, ${COLORS.brand}, ${COLORS.accent})` }}
          >
            Z
          </div>
          <span className="hidden sm:inline font-bold text-[17px] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}>
            ZoneWise<span style={{ color: COLORS.accent }}>.AI</span>
          </span>
        </div>

        {/* Tabs — horizontally scrollable so they never collide with the user/chat controls on mobile */}
        <div className="flex items-center flex-1 min-w-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="shrink-0 bg-transparent border-none px-4 py-4 text-[13px] font-medium transition-all cursor-pointer"
              style={{
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.5)',
                borderBottom: tab === t ? `2px solid ${COLORS.brand}` : '2px solid transparent',
                marginBottom: -2,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* NLP Chat — click to open Export tab */}
        <button
          onClick={() => setTab('Generate')}
          className="hidden sm:flex items-center gap-2 bg-white/[0.08] px-3.5 py-1.5 rounded-lg cursor-pointer hover:bg-white/[0.12] transition-colors border-none shrink-0"
        >
          <span className="text-xs opacity-70">💬</span>
          <span className="text-xs text-white/50 italic">Ask anything about this site...</span>
        </button>

        {/* User */}
        <div className="ml-1 sm:ml-3 flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-[10px] font-semibold text-white px-2.5 py-0.5 rounded-full" style={{ background: COLORS.brand }}>
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

      {/* Beta Banner */}
      {!betaBannerDismissed && (
        <div
          className="flex items-center justify-between px-6 py-2.5 text-[12px]"
          style={{ background: '#F59E0B1A', borderBottom: '1px solid #F59E0B33' }}
        >
          <div className="flex items-center gap-2">
            <DemoDataBadge label="Beta" />
            <span className="text-slate-700">
              Feasibility tools are in beta. Some data uses sample values. Coverage expanding weekly.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBetaBannerDismissed(true)}
            className="text-slate-400 hover:text-slate-600 text-[13px] cursor-pointer border-none bg-transparent px-1"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-5 py-5 pb-16">
        {/* Address header */}
        <div className="flex items-center flex-wrap gap-2.5 mb-4">
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
        {tab === 'Develop'  && <DevelopTab site={site} unitMix={unitMix} compBenchmark={compBenchmark} rentalComps={rentalComps} />}
        {tab === 'Generate' && <ExportTab site={site} />}
      </main>
    </div>
  )
}
