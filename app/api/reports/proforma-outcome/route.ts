export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SECURITY_HEADERS } from '@/lib/validation'
import { calcProForma, calcMultiYearReturns } from '@/lib/feasibility/proforma'
import { buildProFormaOutcomeReportPdf, type OutcomeReportScenario } from '@/lib/reports/develop-tab-outcome-report'

const scenarioInputSchema = z.object({
  label: z.string().min(1).max(60),
  totalUnits: z.number().int().min(1).max(2000),
  vacancyPct: z.number().min(0).max(100),
  opexPct: z.number().min(0).max(100),
  capRatePct: z.number().gt(0).max(50),
  constructionPSF: z.number().min(0).max(5000),
  softCostPct: z.number().min(0).max(200),
  holdYears: z.number().int().min(1).max(50),
  exitCapRatePct: z.number().gt(0).max(50),
})

const bodySchema = z.object({
  site: z.object({
    address: z.string().min(1).max(300),
    zone: z.string().min(1).max(120),
    county: z.string().min(1).max(60),
  }),
  unitMix: z.array(z.object({
    type: z.string().min(1).max(40),
    pct: z.number().min(0).max(100),
    sf: z.number().min(1).max(20000),
    rent: z.number().min(0).max(100000),
  })).min(1).max(20),
  optimized: scenarioInputSchema,
  baseline: scenarioInputSchema.optional(),
  massingPngDataUrl: z.string().startsWith('data:image/png;base64,').max(5_000_000).optional(),
  generatedAt: z.string().min(1).max(40),
})

function buildScenario(input: z.infer<typeof scenarioInputSchema>, unitMix: z.infer<typeof bodySchema>['unitMix']): OutcomeReportScenario {
  const pf = calcProForma({
    totalUnits: input.totalUnits,
    vacancyPct: input.vacancyPct,
    opexPct: input.opexPct,
    capRatePct: input.capRatePct,
    constructionPSF: input.constructionPSF,
    softCostPct: input.softCostPct,
  }, unitMix)
  const returns = calcMultiYearReturns(pf, {
    holdYears: input.holdYears,
    exitCapRatePct: input.exitCapRatePct,
  })
  return {
    label: input.label,
    units: input.totalUnits,
    vacancyPct: input.vacancyPct,
    opexPct: input.opexPct,
    capRatePct: input.capRatePct,
    constructionPSF: input.constructionPSF,
    softCostPct: input.softCostPct,
    holdYears: input.holdYears,
    exitCapRatePct: input.exitCapRatePct,
    pf,
    returns,
  }
}

export async function POST(req: NextRequest) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: SECURITY_HEADERS })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.data === undefined ? parsed.error.issues : undefined },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }
  const { site, unitMix, optimized, baseline, massingPngDataUrl, generatedAt } = parsed.data

  // Server recomputes every pro forma number from the raw sliders rather than
  // trusting client-supplied results — the PDF's figures always come from
  // the same engine (lib/feasibility/proforma.ts) that renders DevelopTab.
  const optimizedScenario = buildScenario(optimized, unitMix)
  const baselineScenario = baseline ? buildScenario(baseline, unitMix) : undefined

  const pdfBuffer = buildProFormaOutcomeReportPdf({
    site,
    optimized: optimizedScenario,
    baseline: baselineScenario,
    massingPngDataUrl,
    generatedAt,
  })

  const safeName = site.address.replace(/[^a-z0-9]/gi, '_').substring(0, 40) || 'outcome-report'

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      ...SECURITY_HEADERS,
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ZoneWise_Outcome_${safeName}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
}
