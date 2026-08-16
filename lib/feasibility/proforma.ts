// ZoneWise.AI — Pro Forma Calculation Engine
// Pure functions. No UI. No side effects.

import { irr as calcIrrRaw } from 'financial'
import type { UnitMix, UnitMixWithCount, ProFormaInputs, ProFormaOutputs } from '@/types/feasibility'

/**
 * Distribute total units across unit mix based on percentages.
 * Ensures at least 1 unit per type and total matches.
 */
export function distributeUnits(mix: UnitMix[], totalUnits: number): UnitMixWithCount[] {
  return mix.map((m) => ({
    ...m,
    count: Math.max(1, Math.round(totalUnits * m.pct / 100)),
  }))
}

/** Gross Potential Rent = Σ(units × rent × 12) */
export function calcGPR(mix: UnitMixWithCount[]): number {
  return mix.reduce((sum, u) => sum + u.count * u.rent * 12, 0)
}

/** Effective Gross Income = GPR × (1 − vacancy%) */
export function calcEGI(gpr: number, vacancyPct: number): number {
  return gpr * (1 - vacancyPct / 100)
}

/** Net Operating Income = EGI − (EGI × opex%) */
export function calcNOI(egi: number, opexPct: number): number {
  return egi * (1 - opexPct / 100)
}

/** Stabilized Value = NOI ÷ cap rate */
export function calcStabilizedValue(noi: number, capRatePct: number): number {
  if (capRatePct <= 0) return 0
  return noi / (capRatePct / 100)
}

/** Total development cost = hard × (1 + soft%) */
export function calcDevCost(totalGSF: number, costPSF: number, softCostPct: number): {
  hard: number
  soft: number
  total: number
} {
  const hard = totalGSF * costPSF
  const soft = hard * (softCostPct / 100)
  return { hard, soft, total: hard + soft }
}

/** Total gross square footage from unit mix */
export function calcTotalGSF(mix: UnitMixWithCount[]): number {
  return mix.reduce((sum, m) => sum + m.count * m.sf, 0)
}

/** Full pro forma calculation from inputs + unit mix */
export function calcProForma(inputs: ProFormaInputs, mix: UnitMix[]): ProFormaOutputs {
  const distributed = distributeUnits(mix, inputs.totalUnits)
  const adjustedUnits = distributed.reduce((s, m) => s + m.count, 0)
  const totalGSF = calcTotalGSF(distributed)
  const gpr = calcGPR(distributed)
  const egi = calcEGI(gpr, inputs.vacancyPct)
  const opexAmt = egi * (inputs.opexPct / 100)
  const noi = egi - opexAmt
  const stabilizedValue = calcStabilizedValue(noi, inputs.capRatePct)
  const { hard, soft, total: totalDevCost } = calcDevCost(totalGSF, inputs.constructionPSF, inputs.softCostPct)
  const profit = stabilizedValue - totalDevCost
  const margin = stabilizedValue > 0 ? (profit / stabilizedValue) * 100 : 0
  const yieldOnCost = totalDevCost > 0 ? (noi / totalDevCost) * 100 : 0
  const devSpread = yieldOnCost - inputs.capRatePct

  return {
    gpr,
    egi,
    opexAmt,
    noi,
    stabilizedValue,
    hardCost: hard,
    softCost: soft,
    totalDevCost,
    profit,
    margin,
    yieldOnCost,
    devSpread,
    totalGSF,
    adjustedUnits,
  }
}

/** Multi-year hold inputs for IRR / equity-multiple. Additive — does not touch ProFormaInputs. */
export interface MultiYearInputs {
  holdYears: number
  exitCapRatePct: number
  /** Annual NOI growth rate applied compounding each year. Default 0 (flat). */
  rentGrowthPct?: number
  /** % of exit value consumed by selling costs (broker fees, closing). Default 0. */
  sellingCostPct?: number
  /** % of totalDevCost funded by equity; remainder assumed debt-free/all-cash if omitted. Default 100. */
  equityPct?: number
}

export interface MultiYearOutputs {
  /** Year 0..holdYears. Index 0 = -initialEquity. Last index includes exit sale proceeds. */
  cashFlows: number[]
  /** NOI per year, year 1..holdYears, with rentGrowthPct compounding applied. */
  yearlyNOI: number[]
  exitNOI: number
  exitValue: number
  netSaleProceeds: number
  /** Annual IRR as a decimal (e.g. 0.12 = 12%), or null if unsolvable for the given cash flows. */
  irr: number | null
  equityMultiple: number
  totalDistributions: number
  initialEquity: number
}

/**
 * IRR + equity multiple over a multi-year hold, exiting at a cap-rate-implied sale value.
 * Uses the `financial` package (numpy-financial port) for IRR — not hand-rolled.
 */
export function calcMultiYearReturns(base: ProFormaOutputs, mv: MultiYearInputs): MultiYearOutputs {
  const holdYears = Math.max(1, Math.round(mv.holdYears))
  const rentGrowthPct = mv.rentGrowthPct ?? 0
  const sellingCostPct = mv.sellingCostPct ?? 0
  const equityPct = mv.equityPct ?? 100
  const initialEquity = base.totalDevCost * (equityPct / 100)

  const yearlyNOI: number[] = []
  for (let y = 1; y <= holdYears; y++) {
    yearlyNOI.push(base.noi * Math.pow(1 + rentGrowthPct / 100, y - 1))
  }

  const exitNOI = yearlyNOI[yearlyNOI.length - 1] * (1 + rentGrowthPct / 100)
  const exitValue = mv.exitCapRatePct > 0 ? exitNOI / (mv.exitCapRatePct / 100) : 0
  const netSaleProceeds = exitValue * (1 - sellingCostPct / 100)

  const cashFlows: number[] = [-initialEquity]
  yearlyNOI.forEach((noi, i) => {
    const isLastYear = i === yearlyNOI.length - 1
    cashFlows.push(noi + (isLastYear ? netSaleProceeds : 0))
  })

  let irrResult: number | null = null
  if (initialEquity > 0) {
    const r = calcIrrRaw(cashFlows)
    irrResult = typeof r === 'number' && Number.isFinite(r) ? r : null
  }

  const totalDistributions = cashFlows.slice(1).reduce((s, v) => s + v, 0)
  const equityMultiple = initialEquity > 0 ? totalDistributions / initialEquity : 0

  return {
    cashFlows,
    yearlyNOI,
    exitNOI,
    exitValue,
    netSaleProceeds,
    irr: irrResult,
    equityMultiple,
    totalDistributions,
    initialEquity,
  }
}
