// Pro Forma Outcome Report Generator — ZoneWise.AI
// Mirrors Algoma's before/after case-study format (headline stat callouts,
// one massing render, formula-transparency section, optional comparison
// block) for pro forma scenarios computed by lib/development-analysis/
// proforma-engine.ts. Comparison is optional — a single scenario renders a
// standalone report.
//
// buildOutcomeReportData() is pure/isomorphic (server or client). PDF export
// reuses the already-installed jsPDF the same way components/floorplan/
// FloorPlanStudio.tsx does (dynamic client-side import — jsPDF touches
// Canvas for text metrics, so it can never run at SSR time). Unlike the
// floor plan export, there is no SVG source to convert, so this draws
// directly with jsPDF's text/rect/image primitives instead of svg2pdf —
// same library, no new PDF dependency added.

import type { ProFormaOutputs, FormulaLine } from '@/lib/development-analysis/proforma-engine'

export interface HeadlineStat {
  label: string
  value: string
  sublabel?: string
}

export interface OutcomeReportScenario {
  name: string
  address: string
  unitCount: number
  grossFloorAreaSqft: number
  outputs: ProFormaOutputs
}

export interface ComparisonRow {
  label: string
  baseline: string
  optimized: string
  delta: string
}

export interface OutcomeReportData {
  generatedAt: string
  scenario: OutcomeReportScenario
  baseline?: OutcomeReportScenario
  headline: HeadlineStat[]
  comparison?: ComparisonRow[]
  formulaLines: FormulaLine[]
  massingSnapshotDataUrl?: string
  assumptionsNote: string
}

function fmtUSD(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}
function fmtX(n: number): string {
  return `${n.toFixed(2)}x`
}
function fmtDeltaUSD(n: number): string {
  return `${n >= 0 ? '+' : ''}${fmtUSD(n)}`
}

const FORMULA_ORDER: (keyof ProFormaOutputs)[] = [
  'hardCosts', 'softCosts', 'totalDevelopmentCost',
  'grossPotentialRevenue', 'effectiveGrossIncome', 'operatingExpenses', 'noi',
  'capRateImpliedValue', 'loanAmount', 'equityRequired', 'annualDebtService',
  'year1CashFlow', 'cashOnCashReturn', 'irr', 'equityMultiple',
]

/**
 * Build the report data structure from already-computed pro forma outputs
 * (see calculateProForma). Does not compute anything itself — it only
 * reshapes engine output into the case-study layout. `generatedAt` must be
 * supplied by the caller (ISO string) — this module never calls Date.now()
 * itself so it stays safely reusable from any calling context.
 */
export function buildOutcomeReportData(params: {
  scenario: OutcomeReportScenario
  baseline?: OutcomeReportScenario
  massingSnapshotDataUrl?: string
  generatedAt: string
}): OutcomeReportData {
  const { scenario, baseline, massingSnapshotDataUrl, generatedAt } = params
  const o = scenario.outputs

  const unitDelta = baseline ? scenario.unitCount - baseline.unitCount : null
  const revenueDelta = baseline ? o.grossPotentialRevenue.result - baseline.outputs.grossPotentialRevenue.result : null

  const headline: HeadlineStat[] = [
    {
      label: 'Units',
      value: String(scenario.unitCount),
      sublabel: baseline && unitDelta !== null ? `${unitDelta >= 0 ? '+' : ''}${unitDelta} vs ${baseline.unitCount}-unit baseline` : undefined,
    },
    { label: 'Total Development Cost', value: fmtUSD(o.totalDevelopmentCost.result) },
    {
      label: 'Projected Gross Revenue',
      value: fmtUSD(o.grossPotentialRevenue.result),
      sublabel: baseline && revenueDelta !== null ? `${fmtDeltaUSD(revenueDelta)} vs baseline` : undefined,
    },
    { label: `${o.assumptions.holdPeriodYears}-Year IRR`, value: fmtPct(o.irr.result) },
    { label: 'Equity Multiple', value: fmtX(o.equityMultiple.result) },
  ]

  let comparison: ComparisonRow[] | undefined
  if (baseline) {
    const b = baseline.outputs
    comparison = [
      { label: 'Units', baseline: String(baseline.unitCount), optimized: String(scenario.unitCount), delta: `${(unitDelta ?? 0) >= 0 ? '+' : ''}${unitDelta}` },
      { label: 'Total Development Cost', baseline: fmtUSD(b.totalDevelopmentCost.result), optimized: fmtUSD(o.totalDevelopmentCost.result), delta: fmtDeltaUSD(o.totalDevelopmentCost.result - b.totalDevelopmentCost.result) },
      { label: 'Projected Gross Revenue', baseline: fmtUSD(b.grossPotentialRevenue.result), optimized: fmtUSD(o.grossPotentialRevenue.result), delta: fmtDeltaUSD(o.grossPotentialRevenue.result - b.grossPotentialRevenue.result) },
      { label: 'NOI', baseline: fmtUSD(b.noi.result), optimized: fmtUSD(o.noi.result), delta: fmtDeltaUSD(o.noi.result - b.noi.result) },
      { label: `${o.assumptions.holdPeriodYears}-Year IRR`, baseline: fmtPct(b.irr.result), optimized: fmtPct(o.irr.result), delta: fmtPct(o.irr.result - b.irr.result) },
      { label: 'Equity Multiple', baseline: fmtX(b.equityMultiple.result), optimized: fmtX(o.equityMultiple.result), delta: `${(o.equityMultiple.result - b.equityMultiple.result) >= 0 ? '+' : ''}${(o.equityMultiple.result - b.equityMultiple.result).toFixed(2)}x` },
    ]
  }

  const formulaLines = FORMULA_ORDER.map((key) => o[key] as FormulaLine)

  return {
    generatedAt,
    scenario,
    baseline,
    headline,
    comparison,
    formulaLines,
    massingSnapshotDataUrl,
    assumptionsNote: `${o.assumptions.hardCostSource} Soft cost: ${o.assumptions.softCostPctSource}. Comps: ${o.assumptions.comps.note}`,
  }
}

const NAVY: [number, number, number] = [30, 58, 95] // #1E3A5F
const AMBER: [number, number, number] = [245, 158, 11] // #F59E0B
const SLATE_900: [number, number, number] = [15, 23, 42]
const SLATE_500: [number, number, number] = [100, 116, 139]

/**
 * Render an OutcomeReportData into a downloadable PDF and trigger the
 * browser download. Client-only — call from a button handler, never at
 * module load or during SSR (jsPDF needs Canvas for text-width metrics).
 */
export async function generateProFormaPdf(data: OutcomeReportData, filenameHint?: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 40
  let y = 0

  // ─── Header band ────────────────────────────────────────────────────
  pdf.setFillColor(...NAVY)
  pdf.rect(0, 0, pageWidth, 70, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ZoneWise.AI — Pro Forma Outcome Report', margin, 30)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(data.scenario.address || data.scenario.name, margin, 48)
  pdf.setTextColor(...AMBER)
  pdf.text(`Generated ${data.generatedAt}`, margin, 62)
  y = 95

  // ─── Headline stat callouts ─────────────────────────────────────────
  const statCount = data.headline.length
  const statW = (pageWidth - margin * 2) / statCount
  data.headline.forEach((stat, i) => {
    const x = margin + i * statW
    pdf.setTextColor(...AMBER)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(stat.value, x, y, { maxWidth: statW - 6 })
    pdf.setTextColor(...SLATE_900)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(stat.label, x, y + 14, { maxWidth: statW - 6 })
    if (stat.sublabel) {
      pdf.setTextColor(...SLATE_500)
      pdf.setFontSize(7)
      pdf.text(stat.sublabel, x, y + 25, { maxWidth: statW - 6 })
    }
  })
  y += 45
  pdf.setDrawColor(...NAVY)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 20

  // ─── Massing render ──────────────────────────────────────────────────
  if (data.massingSnapshotDataUrl) {
    try {
      const imgW = pageWidth - margin * 2
      const imgH = imgW * (2 / 3) // matches MassingEngine's 2400x1600 snapshot AR
      pdf.addImage(data.massingSnapshotDataUrl, 'PNG', margin, y, imgW, imgH)
      y += imgH + 16
    } catch {
      // Bad/unsupported data URL — skip the image rather than fail the whole PDF.
    }
  }

  // ─── Comparison block (optional) ────────────────────────────────────
  if (data.comparison && data.comparison.length > 0) {
    pdf.setTextColor(...NAVY)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Baseline vs Optimized', margin, y)
    y += 16
    pdf.setFontSize(9)
    const colW = (pageWidth - margin * 2) / 4
    pdf.setFont('helvetica', 'bold')
    pdf.text('Metric', margin, y)
    pdf.text('Baseline', margin + colW, y)
    pdf.text('Optimized', margin + colW * 2, y)
    pdf.text('Delta', margin + colW * 3, y)
    y += 4
    pdf.setDrawColor(...SLATE_500)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 12
    pdf.setFont('helvetica', 'normal')
    for (const row of data.comparison) {
      if (y > 720) { pdf.addPage(); y = 40 }
      pdf.setTextColor(...SLATE_900)
      pdf.text(row.label, margin, y)
      pdf.text(row.baseline, margin + colW, y)
      pdf.text(row.optimized, margin + colW * 2, y)
      pdf.setTextColor(...AMBER)
      pdf.text(row.delta, margin + colW * 3, y)
      y += 14
    }
    y += 12
  }

  // ─── Formula transparency section ───────────────────────────────────
  pdf.setTextColor(...NAVY)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  if (y > 700) { pdf.addPage(); y = 40 }
  pdf.text('Formula Transparency', margin, y)
  y += 16
  pdf.setFontSize(8.5)
  for (const line of data.formulaLines) {
    if (y > 730) { pdf.addPage(); y = 40 }
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...SLATE_900)
    pdf.text(`${line.label}: ${line.result.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, margin, y)
    y += 11
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...SLATE_500)
    pdf.text(`= ${line.formula}`, margin + 8, y, { maxWidth: pageWidth - margin * 2 - 8 })
    y += 11
    if (line.note) {
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(7.5)
      const noteLines = pdf.splitTextToSize(line.note, pageWidth - margin * 2 - 8)
      pdf.text(noteLines, margin + 8, y)
      y += noteLines.length * 9
      pdf.setFontSize(8.5)
    }
    y += 4
  }

  // ─── Assumptions footer ──────────────────────────────────────────────
  if (y > 700) { pdf.addPage(); y = 40 }
  y += 10
  pdf.setDrawColor(...NAVY)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 14
  pdf.setFont('helvetica', 'italic')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...SLATE_500)
  const assumptionLines = pdf.splitTextToSize(`Assumptions: ${data.assumptionsNote}`, pageWidth - margin * 2)
  pdf.text(assumptionLines, margin, y)

  const safeName = (filenameHint || data.scenario.name || 'proforma-outcome-report').replace(/[^a-z0-9_-]+/gi, '-')
  pdf.save(`${safeName}.pdf`)
}
