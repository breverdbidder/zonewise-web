'use client'

import type { SiteData, MarketDemographics, MarketScore } from '@/types/feasibility'
import { COLORS } from '@/lib/feasibility/constants'
import { Badge, Card, SectionLabel } from './ui'
import MapboxMap from './MapboxMap'

interface MarketContextProps {
  site: SiteData
  demographics: MarketDemographics
  score: MarketScore
}

function TrendArrow({ value }: { value?: number }) {
  if (value === undefined || value === null) return <span className="text-slate-300">—</span>
  if (value > 0) return <span style={{ color: COLORS.success }}>▲ {value.toFixed(1)}%</span>
  if (value < 0) return <span style={{ color: COLORS.danger }}>▼ {Math.abs(value).toFixed(1)}%</span>
  return <span className="text-slate-400">→ flat</span>
}

function ScoreDot({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100
  const color = pct >= 70 ? COLORS.success : pct >= 40 ? COLORS.accent : COLORS.danger
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold w-5 text-right" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
        {score}
      </span>
    </div>
  )
}

function MarketScoreGauge({ score }: { score: MarketScore }) {
  const color = score.total >= 7 ? COLORS.success : score.total >= 4 ? COLORS.accent : COLORS.danger
  const label = score.total >= 7 ? 'Strong Market' : score.total >= 4 ? 'Moderate Market' : 'Weak Market'

  return (
    <Card className="p-5 mb-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <div
            className="text-5xl font-extrabold leading-none"
            style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {score.total}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">/10</div>
        </div>
        <div className="flex-1">
          <div className="text-base font-bold text-slate-900 mb-0.5">{label}</div>
          <div className="text-[11px] text-slate-500 leading-relaxed">{score.breakdown}</div>
        </div>
      </div>

      <SectionLabel text="Score Breakdown" />
      <div className="space-y-2">
        {[
          ['Income Level', score.incomeScore],
          ['Low Vacancy', score.vacancyScore],
          ['Population Growth', score.growthScore],
          ['Home Appreciation', score.appreciationScore],
        ].map(([label, s]) => (
          <div key={label as string} className="flex items-center gap-3">
            <div className="text-[11px] text-slate-500 w-[140px] flex-shrink-0">{label as string}</div>
            <div className="flex-1">
              <ScoreDot score={s as number} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function MarketContext({ site, demographics, score }: MarketContextProps) {
  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const fmtNum = (n: number) => new Intl.NumberFormat('en-US').format(n)

  return (
    <div className="flex gap-5">
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center mb-4 gap-3">
          <div className="flex-1">
            <SectionLabel text="Market Context" />
            <div className="text-[13px] text-slate-500">
              ZIP {demographics.zip} · {site.county} County · {demographics.dataSource}
            </div>
          </div>
          <Badge text="Census ACS" color={COLORS.info} />
        </div>

        {/* Market Score Gauge */}
        <MarketScoreGauge score={score} />

        {/* Demographics KPI Grid */}
        <div className="text-[13px] font-bold mb-2.5 flex items-center">
          Demographics<Badge text={`ZIP ${demographics.zip}`} color={COLORS.brand} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            {
              label: 'Median HH Income',
              value: fmtCurrency(demographics.medianHHIncome),
              yoy: demographics.medianHHIncomeYoY,
              color: COLORS.brand,
              icon: '💰',
            },
            {
              label: 'Population',
              value: fmtNum(demographics.population),
              yoy: demographics.populationGrowthPct,
              color: COLORS.info,
              icon: '👥',
            },
            {
              label: 'Housing Vacancy',
              value: `${demographics.vacancyRate.toFixed(1)}%`,
              yoy: undefined,
              color: demographics.vacancyRate < 6 ? COLORS.success : COLORS.danger,
              icon: '🏠',
              note: demographics.vacancyRate < 6 ? 'Low — strong demand' : 'Elevated — soft market',
            },
            {
              label: 'Median Home Value',
              value: fmtCurrency(demographics.medianHomeValue),
              yoy: demographics.medianHomeValueYoY,
              color: COLORS.success,
              icon: '📈',
            },
          ].map(({ label, value, yoy, color, icon, note }) => (
            <div
              key={label}
              className="rounded-lg p-4"
              style={{ background: color + '08', borderLeft: `3px solid ${color}` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{icon}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</span>
              </div>
              <div
                className="text-xl font-extrabold text-slate-900"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {value}
              </div>
              <div className="text-[11px] mt-1 text-slate-500">
                {note ?? <TrendArrow value={yoy} />}
              </div>
            </div>
          ))}
        </div>

        {/* Ownership Split */}
        <Card className="p-4 mb-4">
          <SectionLabel text="Owner vs. Renter Split" />
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500">Owner-Occupied</span>
                <span className="font-bold" style={{ color: COLORS.brand }}>{demographics.ownerOccupiedPct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${demographics.ownerOccupiedPct}%`, background: COLORS.brand }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500">Renter-Occupied</span>
                <span className="font-bold" style={{ color: COLORS.accent }}>{demographics.renterOccupiedPct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${demographics.renterOccupiedPct}%`, background: COLORS.accent }}
                />
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-2.5">
            {demographics.renterOccupiedPct >= 35
              ? `Strong renter base (${demographics.renterOccupiedPct}%) — favorable for rental investment strategy.`
              : `Owner-dominant market (${demographics.ownerOccupiedPct}% owners). Rental demand may be softer — validate with comp vacancy data.`}
          </div>
        </Card>

        {/* Employment Drivers */}
        <Card className="p-4">
          <SectionLabel text={`Key Employment Drivers — ${site.county} County`} />
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {['Kennedy Space Center', 'Patrick SFB / USSF', 'L3Harris Technologies', 'Health First', 'SpaceX / Blue Origin', 'Embraer / GITAM'].map((e) => (
              <div key={e} className="text-[12px] text-slate-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: COLORS.brand }} />
                {e}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="w-[300px] flex-shrink-0">
        <SectionLabel text="Location" />
        <div className="text-sm font-bold text-slate-900 mb-3 leading-snug">{site.address}</div>
        <MapboxMap lat={site.lat} lng={site.lng} zoom={12} pitch={0} style={{ height: 220, marginBottom: 16 }} />

        <Card className="p-4">
          <SectionLabel text="HUD Fair Market Rent 2026" />
          {[['Studio', '$1,280'], ['1-BR', '$1,450'], ['2-BR', '$1,750'], ['3-BR', '$2,200']].map(([t, v]) => (
            <div key={t} className="flex justify-between py-1 text-xs border-b border-slate-50">
              <span className="text-slate-500">{t}</span>
              <span className="font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
            </div>
          ))}
          <div className="text-[10px] text-slate-400 mt-2">Source: HUD FMR 2026 · {site.county} County</div>
        </Card>

        <div className="mt-3 rounded-lg p-3.5" style={{ background: COLORS.brandLight, border: `1px solid ${COLORS.brand}30` }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: COLORS.brandDark }}>
            Data Sources
          </div>
          <div className="text-[11px] text-slate-500 leading-relaxed">
            Census ACS 5-Year ({demographics.dataYear}) · Bureau of Labor Statistics · HUD FMR 2026 · {site.county} County Property Appraiser
          </div>
        </div>
      </div>
    </div>
  )
}
