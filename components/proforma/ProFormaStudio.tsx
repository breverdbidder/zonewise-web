'use client'

import { useState, useCallback, useMemo } from 'react'
import { Calculator, Loader2, FileDown, Image as ImageIcon, X } from 'lucide-react'
import type { ConstructionType, DealType, ProFormaInputs } from '@/lib/development-analysis/proforma-engine'
import type { OutcomeReportData } from '@/lib/reports/proforma-outcome-report'
import { useLeadGate } from '@/hooks/useLeadGate'
import EmailGateInline from '@/components/gate/EmailGateInline'

const CONSTRUCTION_TYPES: { value: ConstructionType; label: string }[] = [
  { value: 'SF', label: 'Single Family' },
  { value: 'GARDEN_MF', label: 'Garden Multifamily' },
  { value: 'MID_RISE', label: 'Mid-Rise' },
  { value: 'HIGH_RISE', label: 'High-Rise' },
]

interface ScenarioForm {
  name: string
  address: string
  unitCount: string
  grossFloorAreaSqft: string
  constructionType: ConstructionType
  landBasis: string
  dealType: DealType
  monthlyRentPerUnit: string
  avgSalePricePerUnit: string
  holdPeriodYears: string
}

function emptyScenario(name: string): ScenarioForm {
  return {
    name,
    address: '',
    unitCount: '',
    grossFloorAreaSqft: '',
    constructionType: 'GARDEN_MF',
    landBasis: '',
    dealType: 'RENTAL',
    monthlyRentPerUnit: '',
    avgSalePricePerUnit: '',
    holdPeriodYears: '5',
  }
}

function toInputs(f: ScenarioForm): ProFormaInputs {
  return {
    unitCount: Number(f.unitCount),
    grossFloorAreaSqft: Number(f.grossFloorAreaSqft),
    constructionType: f.constructionType,
    landBasis: Number(f.landBasis || 0),
    dealType: f.dealType,
    holdPeriodYears: f.holdPeriodYears ? Number(f.holdPeriodYears) : undefined,
    monthlyRentPerUnit: f.dealType === 'RENTAL' && f.monthlyRentPerUnit ? Number(f.monthlyRentPerUnit) : undefined,
    avgSalePricePerUnit: f.dealType === 'FOR_SALE' && f.avgSalePricePerUnit ? Number(f.avgSalePricePerUnit) : undefined,
  }
}

function isScenarioComplete(f: ScenarioForm): boolean {
  if (!f.unitCount || !f.grossFloorAreaSqft) return false
  if (f.dealType === 'RENTAL' && !f.monthlyRentPerUnit) return false
  if (f.dealType === 'FOR_SALE' && !f.avgSalePricePerUnit) return false
  return true
}

const inputCls =
  'bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full'
const labelCls = 'block text-xs text-slate-400 mb-1'

function ScenarioFields({
  form, onChange, title,
}: {
  form: ScenarioForm
  onChange: (f: ScenarioForm) => void
  title: string
}) {
  const set = <K extends keyof ScenarioForm>(k: K, v: ScenarioForm[K]) => onChange({ ...form, [k]: v })
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>Scenario Name</label>
          <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Address</label>
          <input className={inputCls} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St, Brevard County, FL" />
        </div>
        <div>
          <label className={labelCls}>Unit Count</label>
          <input
            className={inputCls}
            type="number"
            min={1}
            value={form.unitCount}
            onChange={(e) => set('unitCount', e.target.value)}
            placeholder="From Massing Studio"
          />
        </div>
        <div>
          <label className={labelCls}>Gross Floor Area (sqft)</label>
          <input
            className={inputCls}
            type="number"
            min={1}
            value={form.grossFloorAreaSqft}
            onChange={(e) => set('grossFloorAreaSqft', e.target.value)}
            placeholder="From Massing Studio"
          />
        </div>
        <div>
          <label className={labelCls}>Construction Type</label>
          <select className={inputCls} value={form.constructionType} onChange={(e) => set('constructionType', e.target.value as ConstructionType)}>
            {CONSTRUCTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Land Basis ($)</label>
          <input className={inputCls} type="number" min={0} value={form.landBasis} onChange={(e) => set('landBasis', e.target.value)} placeholder="Purchase price" />
        </div>
        <div>
          <label className={labelCls}>Deal Type</label>
          <select className={inputCls} value={form.dealType} onChange={(e) => set('dealType', e.target.value as DealType)}>
            <option value="RENTAL">Rental (hold)</option>
            <option value="FOR_SALE">For-Sale (build &amp; sell)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Hold Period (years)</label>
          <input className={inputCls} type="number" min={1} max={40} value={form.holdPeriodYears} onChange={(e) => set('holdPeriodYears', e.target.value)} />
        </div>
        {form.dealType === 'RENTAL' ? (
          <div className="sm:col-span-2">
            <label className={labelCls}>Monthly Rent / Unit ($) — manual comps input</label>
            <input className={inputCls} type="number" min={0} value={form.monthlyRentPerUnit} onChange={(e) => set('monthlyRentPerUnit', e.target.value)} placeholder="You supply this — not scraped or fabricated" />
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label className={labelCls}>Avg Sale Price / Unit ($) — manual comps input</label>
            <input className={inputCls} type="number" min={0} value={form.avgSalePricePerUnit} onChange={(e) => set('avgSalePricePerUnit', e.target.value)} placeholder="You supply this — not scraped or fabricated" />
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProFormaStudio() {
  const [scenario, setScenario] = useState<ScenarioForm>(() => emptyScenario('Optimized Scenario'))
  const [compareEnabled, setCompareEnabled] = useState(false)
  const [baseline, setBaseline] = useState<ScenarioForm>(() => emptyScenario('Baseline Scenario'))
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | undefined>(undefined)
  const [snapshotName, setSnapshotName] = useState<string | undefined>(undefined)
  const [report, setReport] = useState<OutcomeReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gate = useLeadGate()

  const canCalculate = useMemo(
    () => isScenarioComplete(scenario) && (!compareEnabled || isScenarioComplete(baseline)),
    [scenario, compareEnabled, baseline]
  )

  const handleSnapshotUpload = useCallback((file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSnapshotDataUrl(reader.result as string)
    reader.readAsDataURL(file)
    setSnapshotName(file.name)
  }, [])

  const handleCalculate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const res = await fetch('/api/reports/proforma', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scenario: { name: scenario.name, address: scenario.address, inputs: toInputs(scenario) },
          baseline: compareEnabled ? { name: baseline.name, address: baseline.address, inputs: toInputs(baseline) } : undefined,
          massingSnapshotDataUrl: snapshotDataUrl,
        }),
      })
      const data = await res.json()
      if (res.status === 402 && data.code === 'usage_cap_reached') {
        gate.requireGate(null, 'proforma_usage_cap', data.error)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Calculation failed')
      setReport(data.report)
    } catch (err: any) {
      setError(err.message || 'Calculation failed')
    } finally {
      setLoading(false)
    }
  }, [scenario, compareEnabled, baseline, snapshotDataUrl])

  const handleDownloadPdf = useCallback(async () => {
    if (!report) return
    setExportingPdf(true)
    setError(null)
    try {
      // Dynamically imported — jsPDF touches Canvas/DOM and must never load
      // during SSR. Same pattern as FloorPlanStudio's PDF export.
      const { generateProFormaPdf } = await import('@/lib/reports/proforma-outcome-report')
      await generateProFormaPdf(report, report.scenario.name)
    } catch (err: any) {
      setError(`PDF export failed: ${err.message}`)
    } finally {
      setExportingPdf(false)
    }
  }, [report])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-400" />
              Pro Forma Studio
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">ZoneWise.AI — development financial modeling &amp; outcome reports</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={compareEnabled} onChange={(e) => setCompareEnabled(e.target.checked)} className="accent-orange-500" />
            Compare against a baseline scenario
          </label>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className={`grid gap-4 ${compareEnabled ? 'md:grid-cols-2' : ''}`}>
          <ScenarioFields form={scenario} onChange={setScenario} title="Optimized / Proposed Scenario" />
          {compareEnabled && <ScenarioFields form={baseline} onChange={setBaseline} title="Baseline Scenario (e.g. as-of-right)" />}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-3 py-1.5 cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            {snapshotName ? snapshotName : 'Attach Massing Render (PNG)'}
            <input type="file" accept="image/png" className="hidden" onChange={(e) => handleSnapshotUpload(e.target.files?.[0])} />
          </label>
          {snapshotDataUrl && (
            <button onClick={() => { setSnapshotDataUrl(undefined); setSnapshotName(undefined) }} className="text-slate-500 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="text-xs text-slate-500">
            Download a render from the 3D Massing Studio, then attach it here to include in the outcome report.
          </span>
        </div>

        <button
          onClick={handleCalculate}
          disabled={!canCalculate || loading}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-semibold rounded px-4 py-2 text-sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          Calculate Pro Forma
        </button>

        {error && (
          <div className="bg-red-950/50 border border-red-900 rounded-lg px-4 py-3 text-sm text-red-300">{error}</div>
        )}

        {report && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Outcome Report</h2>
                <button
                  onClick={() => gate.requireGate(handleDownloadPdf, 'proforma_pdf_export', 'Enter your email to download the full Pro Forma PDF.')}
                  disabled={exportingPdf}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-3 py-1.5 text-sm font-medium text-slate-200 disabled:opacity-50"
                >
                  {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                  Download PDF
                </button>
              </div>

              <div className={`grid gap-4 mb-6 ${report.headline.length > 3 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-3'}`}>
                {report.headline.map((stat) => (
                  <div key={stat.label} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-xl font-bold text-orange-400">{stat.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                    {stat.sublabel && <div className="text-[11px] text-slate-500 mt-0.5">{stat.sublabel}</div>}
                  </div>
                ))}
              </div>

              {gate.unlocked ? (
                <>
                  {report.comparison && (
                    <div className="mb-6 overflow-x-auto">
                      <h3 className="text-sm font-semibold text-slate-200 mb-2">Baseline vs Optimized</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-800">
                            <th className="py-1.5 font-medium">Metric</th>
                            <th className="py-1.5 font-medium">Baseline</th>
                            <th className="py-1.5 font-medium">Optimized</th>
                            <th className="py-1.5 font-medium">Delta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.comparison.map((row) => (
                            <tr key={row.label} className="border-b border-slate-800/50">
                              <td className="py-1.5 text-slate-300">{row.label}</td>
                              <td className="py-1.5 text-slate-400">{row.baseline}</td>
                              <td className="py-1.5 text-slate-200">{row.optimized}</td>
                              <td className="py-1.5 text-orange-400">{row.delta}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-2">Formula Transparency</h3>
                    <div className="space-y-2">
                      {report.formulaLines.map((line) => (
                        <div key={line.label} className="border-b border-slate-800/50 pb-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">{line.label}</span>
                            <span className="text-slate-100 font-mono">{line.result.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono">= {line.formula}</div>
                          {line.note && <div className="text-xs text-slate-600 italic mt-0.5">{line.note}</div>}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 italic mt-4 border-t border-slate-800 pt-3">{report.assumptionsNote}</p>
                  </div>
                </>
              ) : (
                <div className="border-t border-slate-800 pt-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">Formula Transparency — locked</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    See the full per-line formula breakdown{report.comparison ? ' and baseline comparison' : ''} — enter your email to unlock.
                  </p>
                  <EmailGateInline
                    onSubmit={(email) => gate.unlockWithSource(email, 'proforma_pdf_export')}
                    ctaLabel="Unlock full breakdown"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {gate.showGate && (
          <EmailGateInline onSubmit={gate.submitGate} ctaLabel="Continue" message={gate.gateMessage ?? undefined} />
        )}
      </div>
    </div>
  )
}
