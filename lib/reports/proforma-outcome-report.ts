// ZoneWise.AI — Pro Forma Outcome Report (Algoma before/after case-study style)
// Pure function, server-safe: uses jsPDF's core drawing API (text/lines/rects/
// images) only — no DOM, no svg2pdf.js (that's the browser-only path used by
// FloorPlanStudio for SVG floor plans; this report has no SVG to embed).

import { jsPDF } from 'jspdf'
import type { SiteData, ProFormaOutputs } from '@/types/feasibility'
import type { MultiYearOutputs } from '@/lib/feasibility/proforma'

// Only these SiteData fields are used in the report — callers (e.g. the API
// route) don't need to supply/validate the full SiteData shape.
export type OutcomeReportSite = Pick<SiteData, 'address' | 'zone' | 'county'>

export interface OutcomeReportScenario {
  label: string
  units: number
  vacancyPct: number
  opexPct: number
  capRatePct: number
  constructionPSF: number
  softCostPct: number
  holdYears: number
  exitCapRatePct: number
  pf: ProFormaOutputs
  returns: MultiYearOutputs
}

export interface OutcomeReportInput {
  site: OutcomeReportSite
  optimized: OutcomeReportScenario
  /** Optional as-of-right baseline for a before/after comparison block. */
  baseline?: OutcomeReportScenario
  /** Optional PNG data URL (data:image/png;base64,...) from MassingEngine's snapshot export. */
  massingPngDataUrl?: string
  /** ISO timestamp supplied by the caller — Date.now() is intentionally not called here. */
  generatedAt: string
}

const NAVY: [number, number, number] = [30, 58, 95] // #1E3A5F
const AMBER: [number, number, number] = [245, 158, 11] // #F59E0B
const VOID: [number, number, number] = [2, 6, 23] // #020617
const SLATE: [number, number, number] = [100, 116, 139]

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
const pct = (n: number) => `${n.toFixed(1)}%`

function drawStatBox(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, value: string) {
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(1)
  doc.roundedRect(x, y, w, h, 4, 4, 'S')
  doc.setTextColor(...SLATE)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(label.toUpperCase(), x + 10, y + 16)
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(value, x + 10, y + 34)
}

export function buildProFormaOutcomeReportPdf(input: OutcomeReportInput): Buffer {
  const { site, optimized, baseline, massingPngDataUrl, generatedAt } = input
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 48
  const contentWidth = pageWidth - margin * 2
  let y = 0

  // Header band
  doc.setFillColor(...VOID)
  doc.rect(0, 0, pageWidth, 92, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('ZoneWise.AI — Development Outcome Report', margin, 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...AMBER)
  doc.text(site.address, margin, 58)
  doc.setTextColor(220, 220, 220)
  doc.text(`${site.zone} · ${site.county} County, FL · Generated ${generatedAt}`, margin, 74)

  y = 118

  // Headline stat callouts — Algoma's "+47 units / $27.7M revenue / 12,500x ROI" format
  const returnLabel = optimized.returns.irr != null ? 'IRR' : 'Equity Multiple'
  const returnValue = optimized.returns.irr != null
    ? pct(optimized.returns.irr * 100)
    : `${optimized.returns.equityMultiple.toFixed(2)}x`
  const boxW = (contentWidth - 24) / 3
  drawStatBox(doc, margin, y, boxW, 50, 'Units', String(optimized.pf.adjustedUnits))
  drawStatBox(doc, margin + boxW + 12, y, boxW, 50, 'Projected Revenue (GPR)', money(optimized.pf.gpr))
  drawStatBox(doc, margin + (boxW + 12) * 2, y, boxW, 50, returnLabel, returnValue)
  y += 74

  // Massing render — reuses MassingEngine's existing PNG snapshot capability.
  // No second renderer is built here; if the caller has no snapshot on hand
  // (e.g. the Develop tab isn't rendering a live 3D scene), this section is
  // omitted rather than faked.
  if (massingPngDataUrl) {
    const imgH = 200
    try {
      doc.addImage(massingPngDataUrl, 'PNG', margin, y, contentWidth, imgH)
      y += imgH + 16
    } catch {
      doc.setFontSize(9)
      doc.setTextColor(...SLATE)
      doc.text('Massing render image could not be embedded.', margin, y)
      y += 20
    }
  } else {
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, y, contentWidth, 40, 'F')
    doc.setFontSize(9)
    doc.setTextColor(...SLATE)
    doc.text('Massing render not available for this scenario.', margin + 10, y + 24)
    y += 56
  }

  // Formula transparency — every number shows its formula and inputs, no black box.
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...NAVY)
  doc.text('Formula Transparency', margin, y)
  y += 16

  const formulaRows: Array<[string, string]> = [
    ['Gross Potential Rent (GPR)', `sum(units x rent x 12) = ${money(optimized.pf.gpr)}`],
    ['Effective Gross Income (EGI)', `GPR x (1 - ${optimized.vacancyPct}% vacancy) = ${money(optimized.pf.egi)}`],
    ['Net Operating Income (NOI)', `EGI x (1 - ${optimized.opexPct}% opex) = ${money(optimized.pf.noi)}`],
    ['Stabilized Value', `NOI ÷ ${optimized.capRatePct}% cap rate = ${money(optimized.pf.stabilizedValue)}`],
    ['Total Development Cost', `(${optimized.pf.totalGSF.toLocaleString('en-US')} SF × $${optimized.constructionPSF}/SF hard) × (1 + ${optimized.softCostPct}% soft) = ${money(optimized.pf.totalDevCost)}`],
    ['Exit Value', `Year ${optimized.holdYears} NOI ÷ ${optimized.exitCapRatePct}% exit cap rate = ${money(optimized.returns.exitValue)}`],
    [returnLabel, optimized.returns.irr != null
      ? `IRR solved from ${optimized.holdYears + 1}-period cash flow (financial pkg irr()) = ${returnValue}`
      : `Total distributions ÷ initial equity = ${returnValue}`],
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  for (const [label, formula] of formulaRows) {
    doc.setTextColor(...NAVY)
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SLATE)
    const lines = doc.splitTextToSize(formula, contentWidth - 4) as string[]
    doc.text(lines, margin, y + 12)
    y += 12 + lines.length * 11 + 6
  }

  // Optional as-of-right vs optimized comparison block
  if (baseline) {
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...NAVY)
    doc.text('As-of-Right vs. Optimized', margin, y)
    y += 16

    const deltaUnits = optimized.pf.adjustedUnits - baseline.pf.adjustedUnits
    const deltaRevenue = optimized.pf.gpr - baseline.pf.gpr
    const compareRows: Array<[string, string, string, string]> = [
      ['Units', String(baseline.pf.adjustedUnits), String(optimized.pf.adjustedUnits), `${deltaUnits >= 0 ? '+' : ''}${deltaUnits}`],
      ['Projected Revenue', money(baseline.pf.gpr), money(optimized.pf.gpr), `${deltaRevenue >= 0 ? '+' : ''}${money(deltaRevenue)}`],
      ['NOI', money(baseline.pf.noi), money(optimized.pf.noi), `${money(optimized.pf.noi - baseline.pf.noi)}`],
      ['Stabilized Value', money(baseline.pf.stabilizedValue), money(optimized.pf.stabilizedValue), money(optimized.pf.stabilizedValue - baseline.pf.stabilizedValue)],
    ]
    doc.setFontSize(9)
    const colW = contentWidth / 4
    ;['Metric', 'As-of-Right', 'Optimized', 'Delta'].forEach((h, i) => {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...SLATE)
      doc.text(h, margin + i * colW, y)
    })
    y += 14
    for (const row of compareRows) {
      row.forEach((cell, i) => {
        doc.setFont('helvetica', i === 0 ? 'bold' : 'normal')
        doc.setTextColor(...NAVY)
        doc.text(cell, margin + i * colW, y)
      })
      y += 14
    }
  }

  // Footer disclosure
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(7)
  doc.setTextColor(...SLATE)
  doc.text(
    'Assumptions shown above are user-adjustable inputs, not verified market data unless explicitly labeled as a live comp. ZoneWise.AI.',
    margin,
    pageHeight - 24
  )

  return Buffer.from(doc.output('arraybuffer'))
}
