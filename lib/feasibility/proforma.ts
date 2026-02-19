// ZoneWise.AI — Pro Forma Calculation Engine
// Pure functions. No UI. No side effects.

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
