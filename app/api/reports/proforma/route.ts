export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SECURITY_HEADERS } from '@/lib/validation'
import { checkFreeRunCap, recordFreeRun, usageCapBody } from '@/lib/gate/server'
import {
  calculateProForma,
  type ProFormaInputs,
} from '@/lib/development-analysis/proforma-engine'
import {
  buildOutcomeReportData,
  type OutcomeReportScenario,
} from '@/lib/reports/proforma-outcome-report'

/**
 * POST /api/reports/proforma
 *
 * Computes a pro forma (lib/development-analysis/proforma-engine.ts) and
 * shapes it into outcome-report data (lib/reports/proforma-outcome-report.ts)
 * server-side, so the engine only ever runs in one place regardless of
 * which client renders the report. Returns JSON only — PDF rendering is
 * client-side (see generateProFormaPdf), same pattern FloorPlanStudio uses
 * for its export.
 *
 * Body:
 * {
 *   scenario: { name, address, inputs: ProFormaInputs },
 *   baseline?: { name, address, inputs: ProFormaInputs },
 *   massingSnapshotDataUrl?: string   // PNG data URL from MassingEngine's existing snapshot capability
 * }
 */

const proFormaInputsSchema = z.object({
  unitCount: z.number().positive(),
  grossFloorAreaSqft: z.number().positive(),
  constructionType: z.enum(['SF', 'GARDEN_MF', 'MID_RISE', 'HIGH_RISE']),
  landBasis: z.number().nonnegative(),
  dealType: z.enum(['RENTAL', 'FOR_SALE']),
  hardCostPsfOverride: z.number().positive().optional(),
  softCostPct: z.number().min(0).max(1).optional(),
  monthlyRentPerUnit: z.number().positive().optional(),
  stabilizedOccupancyPct: z.number().min(0).max(1).optional(),
  opexRatioPct: z.number().min(0).max(1).optional(),
  exitCapRatePct: z.number().min(0.001).max(1).optional(),
  holdPeriodYears: z.number().int().min(1).max(40).optional(),
  rentGrowthPct: z.number().min(-1).max(1).optional(),
  expenseGrowthPct: z.number().min(-1).max(1).optional(),
  dispositionCostPct: z.number().min(0).max(1).optional(),
  avgSalePricePerUnit: z.number().positive().optional(),
  sellingCostPct: z.number().min(0).max(1).optional(),
  loanToCostPct: z.number().min(0).max(1).optional(),
  loanInterestRatePct: z.number().min(0).max(1).optional(),
})

const scenarioInputSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(200),
  inputs: proFormaInputsSchema,
})

const requestSchema = z.object({
  scenario: scenarioInputSchema,
  baseline: scenarioInputSchema.optional(),
  massingSnapshotDataUrl: z.string().startsWith('data:image/').optional(),
})

function toScenario(input: z.infer<typeof scenarioInputSchema>): OutcomeReportScenario {
  const outputs = calculateProForma(input.inputs as ProFormaInputs)
  return {
    name: input.name,
    address: input.address,
    unitCount: input.inputs.unitCount,
    grossFloorAreaSqft: input.inputs.grossFloorAreaSqft,
    outputs,
  }
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: SECURITY_HEADERS })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.error.issues },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }

  if (checkFreeRunCap(req).blocked) {
    return NextResponse.json(usageCapBody(), { status: 402, headers: SECURITY_HEADERS })
  }

  try {
    const scenario = toScenario(parsed.data.scenario)
    const baseline = parsed.data.baseline ? toScenario(parsed.data.baseline) : undefined

    const report = buildOutcomeReportData({
      scenario,
      baseline,
      massingSnapshotDataUrl: parsed.data.massingSnapshotDataUrl,
      generatedAt: new Date().toISOString(),
    })

    const res = NextResponse.json({ ok: true, report }, { headers: SECURITY_HEADERS })
    recordFreeRun(req, res)
    return res
  } catch (err: any) {
    // Thrown by calculateProForma for missing/invalid comps input — this is
    // an expected, user-correctable 400, not a server error. The engine
    // refuses to fabricate a rent/sale comp rather than silently defaulting one.
    return NextResponse.json(
      { error: err?.message || 'Pro forma calculation failed' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }
}
