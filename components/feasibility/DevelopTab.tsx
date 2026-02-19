'use client'

import { useState, useMemo } from 'react'
import type { SiteData, UnitMix } from '@/types/feasibility'
import { COLORS, fmt, fmtD } from '@/lib/feasibility/constants'
import { calcProForma, distributeUnits } from '@/lib/feasibility/proforma'
import { Badge, Card, SectionLabel } from './ui'

interface DevelopTabProps {
  site: SiteData
  unitMix: UnitMix[]
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

export default function DevelopTab({ site, unitMix }: DevelopTabProps) {
  const [units, setUnits] = useState(16)
  const [vacancy, setVacancy] = useState(5)
  const [opex, setOpex] = useState(38)
  const [capRate, setCapRate] = useState(6.5)
  const [costPSF, setCostPSF] = useState(185)
  const [softPct, setSoftPct] = useState(18)

  const pf = useMemo(() => calcProForma({
    totalUnits: units,
    vacancyPct: vacancy,
    opexPct: opex,
    capRatePct: capRate,
    constructionPSF: costPSF,
    softCostPct: softPct,
  }, unitMix), [units, vacancy, opex, capRate, costPSF, softPct, unitMix])

  const mix = useMemo(() => distributeUnits(unitMix, units), [unitMix, units])

  const sliders: SliderConfig[] = [
    { label: 'Total Units', value: units, setter: setUnits, min: 4, max: 40, step: 1, format: (x) => String(x) },
    { label: 'Vacancy %', value: vacancy, setter: setVacancy, min: 0, max: 15, step: 0.5, format: (x) => x + '%' },
    { label: 'OpEx Ratio %', value: opex, setter: setOpex, min: 25, max: 50, step: 1, format: (x) => x + '%' },
    { label: 'Cap Rate %', value: capRate, setter: setCapRate, min: 4, max: 9, step: 0.25, format: (x) => x + '%' },
    { label: 'Construction $/SF', value: costPSF, setter: setCostPSF, min: 120, max: 350, step: 5, format: (x) => '$' + x },
    { label: 'Soft Cost %', value: softPct, setter: setSoftPct, min: 10, max: 30, step: 1, format: (x) => x + '%' },
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

      {/* KPI Strip */}
      <div className="grid grid-cols-6 gap-2.5 mb-5">
        {[
          ['NOI', fmtD(pf.noi), true],
          ['Value', fmtD(pf.stabilizedValue), true],
          ['Dev Cost', fmtD(pf.totalDevCost), false],
          ['Profit', fmtD(pf.profit), pf.profit > 0],
          ['YoC', `${pf.yieldOnCost.toFixed(1)}%`, pf.devSpread > 0],
          ['Spread', `${pf.devSpread > 0 ? '+' : ''}${pf.devSpread.toFixed(1)}%`, pf.devSpread > 0],
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

      <div className="flex gap-5">
        {/* LEFT: Sliders + Unit Mix */}
        <div className="w-[360px] flex-shrink-0">
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
            Unit Mix<Badge text="Comp-Derived" color={COLORS.success} />
          </div>
          <Card>
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
          </Card>
        </div>
      </div>
    </div>
  )
}
