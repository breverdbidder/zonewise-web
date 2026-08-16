'use client'

import { useState, useMemo } from 'react'
import type { SiteData, UnitMix, CompBenchmark, RentalComps } from '@/types/feasibility'
import { COLORS, fmt, fmtD } from '@/lib/feasibility/constants'
import { calcProForma, calcMultiYearReturns, distributeUnits } from '@/lib/feasibility/proforma'
import { Badge, Card, SectionLabel } from './ui'

interface DevelopTabProps {
  site: SiteData
  unitMix: UnitMix[]
  compBenchmark?: CompBenchmark | null
  rentalComps?: RentalComps | null
}

function bedroomLabel(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio'
  if (bedrooms === 1) return 'One BR'
  if (bedrooms === 2) return 'Two BR'
  if (bedrooms === 3) return 'Three BR'
  return `${bedrooms} BR`
}

interface SliderConfig {
  label: string
  value: number
  setter: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
}

export default function DevelopTab({ site, unitMix, compBenchmark = null, rentalComps = null }: DevelopTabProps) {
  const [units, setUnits] = useState(16)
  const [vacancy, setVacancy] = useState(5)
  const [opex, setOpex] = useState(38)
  const [capRate, setCapRate] = useState(6.5)
  const [costPSF, setCostPSF] = useState(185)
  const [softPct, setSoftPct] = useState(18)
  const [holdYears, setHoldYears] = useState(5)
  const [exitCapRate, setExitCapRate] = useState(7.0)

  const pf = useMemo(() => calcProForma({
    totalUnits: units,
    vacancyPct: vacancy,
    opexPct: opex,
    capRatePct: capRate,
    constructionPSF: costPSF,
    softCostPct: softPct,
  }, unitMix), [units, vacancy, opex, capRate, costPSF, softPct, unitMix])

  const returns = useMemo(() => calcMultiYearReturns(pf, {
    holdYears,
    exitCapRatePct: exitCapRate,
  }), [pf, holdYears, exitCapRate])

  const mix = useMemo(() => distributeUnits(unitMix, units), [unitMix, units])

  const [downloadingReport, setDownloadingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  const handleDownloadReport = async () => {
    setDownloadingReport(true)
    setReportError(null)
    try {
      const res = await fetch('/api/reports/proforma-outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: { address: site.address, zone: site.zone, county: site.county },
          unitMix,
          optimized: {
            label: 'Optimized',
            totalUnits: units,
            vacancyPct: vacancy,
            opexPct: opex,
            capRatePct: capRate,
            constructionPSF: costPSF,
            softCostPct: softPct,
            holdYears,
            exitCapRatePct: exitCapRate,
          },
          generatedAt: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error(`Report generation failed (${res.status})`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const addrSlug = site.address.replace(/[^a-z0-9]/gi, '_').substring(0, 40)
      link.href = url
      link.download = `ZoneWise_Outcome_${addrSlug}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setReportError(err.message || 'Report generation failed.')
    } finally {
      setDownloadingReport(false)
    }
  }

  const sliders: SliderConfig[] = [
    { label: 'Total Units', value: units, setter: setUnits, min: 4, max: 40, step: 1, format: (x) => String(x) },
    { label: 'Vacancy %', value: vacancy, setter: setVacancy, min: 0, max: 15, step: 0.5, format: (x) => x + '%' },
    { label: 'OpEx Ratio %', value: opex, setter: setOpex, min: 25, max: 50, step: 1, format: (x) => x + '%' },
    { label: 'Cap Rate %', value: capRate, setter: setCapRate, min: 4, max: 9, step: 0.25, format: (x) => x + '%' },
    { label: 'Construction $/SF', value: costPSF, setter: setCostPSF, min: 120, max: 350, step: 5, format: (x) => '$' + x },
    { label: 'Soft Cost %', value: softPct, setter: setSoftPct, min: 10, max: 30, step: 1, format: (x) => x + '%' },
    { label: 'Hold Period (yrs)', value: holdYears, setter: setHoldYears, min: 1, max: 15, step: 1, format: (x) => String(x) },
    { label: 'Exit Cap Rate %', value: exitCapRate, setter: setExitCapRate, min: 4, max: 9, step: 0.25, format: (x) => x + '%' },
  ]

  const proFormaSections = [
    {
      title: 'Revenue',
      color: COLORS.brand,
      rows: [
        { label: 'Gross Potential Rent', value: fmtD(pf.gpr) },
        { label: `Less Vacancy (${vacancy}%)`, value: `(${fmtD(pf.gpr * vacancy / 100)})`, color: COLORS.danger },
        { label: 'Effective Gross Income', value: fmtD(pf.egi), color: COLORS.success, bold: true },
      ],
    },
    {
      title: 'Expenses',
      color: COLORS.danger,
      rows: [
        { label: `Operating Expenses (${opex}%)`, value: `(${fmtD(pf.opexAmt)})`, color: COLORS.danger },
        { label: 'Net Operating Income', value: fmtD(pf.noi), color: COLORS.success, bold: true },
      ],
    },
    {
      title: 'Valuation',
      color: COLORS.info,
      bg: '#EFF6FF',
      rows: [
        { label: 'NOI ÷ Cap Rate', value: `${fmtD(pf.noi)} ÷ ${capRate}%` },
        { label: 'Stabilized Value', value: fmtD(pf.stabilizedValue), color: COLORS.info, bold: true },
        { label: 'Per Unit', value: fmtD(Math.round(pf.stabilizedValue / pf.adjustedUnits)) },
      ],
    },
    {
      title: 'Development Cost',
      color: '#92400E',
      rows: [
        { label: `Hard (${fmt(pf.totalGSF)} SF × $${costPSF})`, value: fmtD(pf.hardCost) },
        { label: `Soft Costs (${softPct}%)`, value: fmtD(pf.softCost) },
        { label: 'Total Dev Cost', value: fmtD(pf.totalDevCost), color: '#92400E', bold: true },
        { label: 'Per Unit', value: fmtD(Math.round(pf.totalDevCost / pf.adjustedUnits)) },
      ],
    },
    {
      title: 'Returns',
      color: pf.profit > 0 ? COLORS.success : COLORS.danger,
      bg: pf.profit > 0 ? '#F0FDF4' : '#FEF2F2',
      rows: [
        { label: 'Developer Profit', value: fmtD(pf.profit), color: pf.profit > 0 ? COLORS.success : COLORS.danger, bold: true },
        { label: 'Profit Margin', value: `${pf.margin.toFixed(1)}%` },
        { label: 'Yield on Cost', value: `${pf.yieldOnCost.toFixed(2)}%` },
        { label: 'Dev Spread', value: `${pf.devSpread > 0 ? '+' : ''}${pf.devSpread.toFixed(2)}%`, color: pf.devSpread > 0 ? COLORS.success : COLORS.danger },
      ],
    },
    {
      title: `${holdYears}-Year Hold Returns`,
      color: COLORS.info,
      bg: '#EFF6FF',
      rows: [
        { label: `Exit Value (Yr ${holdYears} NOI ÷ ${exitCapRate}%)`, value: fmtD(returns.exitValue) },
        { label: 'Net Sale Proceeds', value: fmtD(returns.netSaleProceeds) },
        { label: 'IRR', value: returns.irr != null ? `${(returns.irr * 100).toFixed(1)}%` : '—', color: COLORS.info, bold: true },
        { label: 'Equity Multiple', value: `${returns.equityMultiple.toFixed(2)}x`, color: COLORS.info, bold: true },
      ],
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-4 gap-3">
        <div className="flex-1">
          <SectionLabel text="Development Pro Forma" />
          <div className="text-[13px] text-slate-500">
            {site.zone} · {fmt(site.lotArea)} SF lot · FAR {site.far} · {site.maxHeight}ft max
          </div>
        </div>
        <Badge text="Interactive" color={COLORS.accent} />
      </div>

      {/* Real comp benchmark — Brevard sold tax-deed CMA (sale-price, not rent).
          Only renders when a live match exists; never fabricates a rent conversion. */}
      {compBenchmark && (
        <div
          className="rounded-lg px-3.5 py-2.5 mb-4 text-xs"
          style={{ background: COLORS.brandLight, border: `1px solid ${COLORS.brand}40` }}
        >
          <span className="font-bold" style={{ color: COLORS.brandDark }}>Live Comp Benchmark (Brevard sold tax-deed CMA):</span>{' '}
          Median comp {fmtD(compBenchmark.medianComp)} from {compBenchmark.nComps} comps
          {compBenchmark.pctOfMarket != null && ` · sold at ${compBenchmark.pctOfMarket}% of market value`}
          {compBenchmark.soldPrice != null && ` · this parcel sold ${fmtD(compBenchmark.soldPrice)}`}.
          <span className="text-slate-500"> Sale-price comp, not a rent comp — informational only, does not set unit rents below.</span>
        </div>
      )}

      {/* Real rental comps — HomeHarvest/Realtor.com (interim source, see
          lib/feasibility/live-rental-comps.ts). Informational benchmark next
          to the manual Unit Mix rents; never overrides them. */}
      {rentalComps && (
        <div
          className="rounded-lg px-3.5 py-2.5 mb-4 text-xs"
          style={{ background: COLORS.brandLight, border: `1px solid ${COLORS.brand}40` }}
        >
          <span className="font-bold" style={{ color: COLORS.brandDark }}>Live Rental Comps (Realtor.com, {rentalComps.n} listings):</span>{' '}
          {rentalComps.bedroomBreakdown.map((b, i) => (
            <span key={b.bedrooms}>
              {i > 0 && ' · '}{bedroomLabel(b.bedrooms)} median {fmtD(b.medianRent)} (n={b.n})
            </span>
          ))}
          <span className="text-slate-500"> Scraped Realtor.com data, not MLS/Zillow/Redfin-licensed — informational only, does not set unit rents below.</span>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
        {[
          ['NOI', fmtD(pf.noi), true],
          ['Value', fmtD(pf.stabilizedValue), true],
          ['Dev Cost', fmtD(pf.totalDevCost), false],
          ['Profit', fmtD(pf.profit), pf.profit > 0],
          ['IRR', returns.irr != null ? `${(returns.irr * 100).toFixed(1)}%` : '—', (returns.irr ?? 0) > 0],
          ['Eq. Multiple', `${returns.equityMultiple.toFixed(2)}x`, returns.equityMultiple > 1],
        ].map(([l, v, hi]) => (
          <div
            key={l as string}
            className="rounded-lg px-3.5 py-3"
            style={{
              background: hi ? COLORS.brandLight : COLORS.surface,
              border: `1px solid ${hi ? COLORS.brand + '40' : COLORS.border}`,
            }}
          >
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">{l as string}</div>
            <div
              className="text-base font-bold mt-0.5"
              style={{
                color: hi ? COLORS.brandDark : COLORS.textPrimary,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {v as string}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* LEFT: Sliders + Unit Mix */}
        <div className="w-full lg:w-[360px] lg:flex-shrink-0">
          <div className="text-[13px] font-bold mb-2.5 flex items-center">
            Assumptions<Badge text="ADJUST" color={COLORS.accent} />
          </div>
          <Card className="p-4">
            {sliders.map((sl) => (
              <div key={sl.label} className="mb-3">
                <div className="flex justify-between mb-0.5">
                  <span className="text-xs text-slate-500">{sl.label}</span>
                  <span className="text-xs font-bold text-slate-900" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {sl.format(sl.value)}
                  </span>
                </div>
                <input
                  type="range"
                  min={sl.min}
                  max={sl.max}
                  step={sl.step}
                  value={sl.value}
                  onChange={(e) => sl.setter(Number(e.target.value))}
                  className="w-full h-1 accent-teal-600"
                />
              </div>
            ))}
          </Card>

          <div className="text-[13px] font-bold mt-4 mb-2.5 flex items-center">
            Unit Mix<Badge text="Manual Assumption" color={COLORS.accent} />
          </div>
          <Card>
            <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50">
                  {['Type', '%', 'Units', 'SF', 'Rent', 'Annual'].map((h) => (
                    <th key={h} className="px-1.5 py-2 text-right font-semibold text-slate-500 border-b-2 border-slate-200 text-[10px] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mix.map((m) => (
                  <tr key={m.type} className="border-b border-slate-50">
                    <td className="px-1.5 py-2 font-semibold text-right">{m.type}</td>
                    <td className="px-1.5 py-2 text-right text-slate-500">{m.pct}%</td>
                    <td className="px-1.5 py-2 text-right font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.count}</td>
                    <td className="px-1.5 py-2 text-right text-slate-500">{fmt(m.sf)}</td>
                    <td className="px-1.5 py-2 text-right font-semibold" style={{ color: COLORS.brand, fontFamily: "'JetBrains Mono', monospace" }}>{fmtD(m.rent)}</td>
                    <td className="px-1.5 py-2 text-right text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtD(m.count * m.rent * 12)}</td>
                  </tr>
                ))}
                <tr style={{ background: COLORS.brandLight }}>
                  <td className="px-1.5 py-2 font-bold text-right">Total</td>
                  <td className="px-1.5 py-2 text-right font-semibold">100%</td>
                  <td className="px-1.5 py-2 text-right font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{pf.adjustedUnits}</td>
                  <td className="px-1.5 py-2 text-right">{fmt(Math.round(pf.totalGSF / pf.adjustedUnits))}</td>
                  <td className="px-1.5 py-2 text-right">—</td>
                  <td className="px-1.5 py-2 text-right font-bold" style={{ color: COLORS.brand, fontFamily: "'JetBrains Mono', monospace" }}>{fmtD(pf.gpr)}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </Card>
        </div>

        {/* RIGHT: Pro Forma Statement */}
        <div className="flex-1">
          <div className="text-[13px] font-bold mb-2.5 flex items-center">
            Pro Forma Statement<Badge text="LIVE" color={COLORS.brand} />
          </div>
          <Card>
            {proFormaSections.map((sec) => (
              <div key={sec.title} className="px-4 py-3.5 border-b border-slate-200" style={{ background: sec.bg || 'transparent' }}>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: sec.color }}>
                  {sec.title}
                </div>
                {sec.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between py-1"
                    style={{
                      borderTop: row.bold ? `1.5px solid ${sec.color}` : 'none',
                      marginTop: row.bold ? 4 : 0,
                    }}
                  >
                    <span className={`text-xs text-slate-500 ${row.bold ? 'font-semibold' : ''}`}>{row.label}</span>
                    <span
                      className={row.bold ? 'font-extrabold' : 'font-medium'}
                      style={{
                        fontSize: row.bold ? 15 : 12,
                        color: row.color || COLORS.textPrimary,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            <div className="px-4 py-3.5">
              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                className="w-full text-xs font-bold py-2.5 rounded-lg cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: COLORS.brand, color: '#fff' }}
              >
                {downloadingReport ? 'Generating…' : 'Download Outcome Report (PDF)'}
              </button>
              {reportError && (
                <div className="text-xs mt-2" style={{ color: COLORS.danger }}>{reportError}</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
