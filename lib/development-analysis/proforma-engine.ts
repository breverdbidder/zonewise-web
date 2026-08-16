// Pro Forma Engine — ZoneWise.AI Development Financial Modeling
// Sibling to hbu-engine.ts. Turns a unit_count + gross_floor_area_sqft
// (already produced by computeEnvelope / MassingEngine's deriveMetrics —
// see hbu-engine.ts) into a full development pro forma: cost, revenue, NOI,
// cap-rate-implied value, leverage, cash-on-cash, multi-year DCF IRR, and
// equity multiple.
//
// This file does NOT recompute the building envelope or unit count — callers
// pass those in as inputs, sourced from MassingEngine's existing output.
//
// IRR/NPV use the `financial` npm package (TypeScript port of numpy-financial,
// zero deps, MIT) — no hand-rolled IRR/NPV math, per issue guardrail.
//
// Every output is a FormulaLine: { label, formula, inputs, result }. There is
// no bare number anywhere in ProFormaOutputs — this is a finance tool, and a
// wrong-but-confident number is worse than no number.

import { irr as computeIrr } from 'financial'

// financial's irr() uses Newton-Raphson from a single starting guess (default
// 0.1) and returns Infinity when that guess diverges — which happens on
// legitimate cash flow schedules (e.g. a deal that loses money, deeply
// negative IRR). Retry from a spread of guesses rather than reporting a
// bogus Infinity/NaN as a rate of return. Throws if none converge, per the
// "blank is better than wrong" rule — this file never silently emits a
// non-finite number labeled as an IRR.
const IRR_GUESSES = [0.1, 0, -0.2, 0.3, -0.5, 0.6, -0.8, 1]
function solveIrr(schedule: number[]): number {
  for (const guess of IRR_GUESSES) {
    const rate = computeIrr(schedule, guess)
    if (Number.isFinite(rate)) return rate
  }
  throw new Error(`IRR did not converge for cash flow schedule [${schedule.join(', ')}] from any of the standard starting guesses`)
}

export type ConstructionType = 'SF' | 'GARDEN_MF' | 'MID_RISE' | 'HIGH_RISE'
export type DealType = 'RENTAL' | 'FOR_SALE'

// ─── Static assumption tables (NOT market-sourced comps) ──────────────────
// Hard cost $/sf is a STARTING ASSUMPTION, not a live market feed. Baseline
// anchored to hbu-engine.ts's CONSTRUCTION_COSTS Brevard County 2025-2026
// mid-point figures (sfr_new=195, multifamily=175) and extended for mid/
// high-rise construction-type premiums (structural system change, not a
// Brevard-specific data point). Tune per market before underwriting a real
// deal on these numbers — surface this source string in any UI that renders
// hard cost.
export const HARD_COST_PSF: Record<ConstructionType, { psf: number; label: string }> = {
  SF:        { psf: 195, label: 'Single Family (wood frame, 1-2 story)' },
  GARDEN_MF: { psf: 175, label: 'Garden Multifamily (wood frame, 2-3 story)' },
  MID_RISE:  { psf: 230, label: 'Mid-Rise (wood-over-podium, 4-7 story)' },
  HIGH_RISE: { psf: 310, label: 'High-Rise (steel/concrete, 8+ story)' },
}
export const HARD_COST_SOURCE =
  'Starting assumption (Brevard County 2025-2026), anchored to hbu-engine.ts CONSTRUCTION_COSTS. Not a live market feed — tune per market.'

export const DEFAULT_SOFT_COST_PCT = 0.175 // mid of the standard 15-20% of hard cost range
export const DEFAULT_STABILIZED_OCCUPANCY_PCT = 0.93
export const DEFAULT_OPEX_RATIO_PCT = 0.35 // of effective gross income
export const DEFAULT_EXIT_CAP_RATE_PCT = 0.06
export const DEFAULT_HOLD_PERIOD_YEARS = 5
export const DEFAULT_RENT_GROWTH_PCT = 0.03
export const DEFAULT_EXPENSE_GROWTH_PCT = 0.025
export const DEFAULT_LOAN_TO_COST_PCT = 0.65
export const DEFAULT_LOAN_INTEREST_RATE_PCT = 0.065 // interest-only, simplifying assumption — see annualDebtService formula note
export const DEFAULT_DISPOSITION_COST_PCT = 0.02 // rental exit sale (broker + closing)
export const DEFAULT_SELLING_COST_PCT = 0.06 // for-sale unit sellout (commission + closing)

export interface FormulaLine {
  label: string
  formula: string
  inputs: Record<string, number | string>
  result: number
  note?: string
}

export interface ProFormaInputs {
  /** From computeEnvelope/MassingEngine output — reused, not recomputed here. */
  unitCount: number
  /** From computeEnvelope/MassingEngine output (actualGFA) — reused, not recomputed here. */
  grossFloorAreaSqft: number
  constructionType: ConstructionType
  /** Parcel purchase price — user input or public sale record. */
  landBasis: number
  dealType: DealType

  hardCostPsfOverride?: number
  softCostPct?: number

  /** RENTAL — manual comps input (see rent_comps table / user-entered $/unit/month). Not fabricated. */
  monthlyRentPerUnit?: number
  stabilizedOccupancyPct?: number
  opexRatioPct?: number
  exitCapRatePct?: number
  holdPeriodYears?: number
  rentGrowthPct?: number
  expenseGrowthPct?: number
  dispositionCostPct?: number

  /** FOR_SALE — manual comps input (user-entered $/unit sale price). Not fabricated. */
  avgSalePricePerUnit?: number
  sellingCostPct?: number

  loanToCostPct?: number
  loanInterestRatePct?: number
}

export interface ProFormaOutputs {
  hardCosts: FormulaLine
  softCosts: FormulaLine
  totalDevelopmentCost: FormulaLine
  grossPotentialRevenue: FormulaLine
  effectiveGrossIncome: FormulaLine
  operatingExpenses: FormulaLine
  noi: FormulaLine
  capRateImpliedValue: FormulaLine
  loanAmount: FormulaLine
  equityRequired: FormulaLine
  annualDebtService: FormulaLine
  year1CashFlow: FormulaLine
  cashOnCashReturn: FormulaLine
  irr: FormulaLine
  equityMultiple: FormulaLine
  /** Full leveraged cash flow schedule, year 0 (equity outlay) .. year N (incl. exit). For charting / transparency. */
  cashFlowSchedule: number[]
  assumptions: {
    hardCostSource: string
    softCostPctSource: string
    dealType: DealType
    holdPeriodYears: number
    comps: { source: 'manual_input'; note: string }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Compute a full pro forma from unit_count + GFA (already produced upstream
 * by MassingEngine/computeEnvelope) plus user-supplied cost/revenue/leverage
 * assumptions. Throws on missing required comps input rather than fabricating
 * a market number — RENTAL requires monthlyRentPerUnit, FOR_SALE requires
 * avgSalePricePerUnit.
 */
export function calculateProForma(inputs: ProFormaInputs): ProFormaOutputs {
  const {
    unitCount,
    grossFloorAreaSqft,
    constructionType,
    landBasis,
    dealType,
    hardCostPsfOverride,
    softCostPct = DEFAULT_SOFT_COST_PCT,
    holdPeriodYears = DEFAULT_HOLD_PERIOD_YEARS,
    loanToCostPct = DEFAULT_LOAN_TO_COST_PCT,
    loanInterestRatePct = DEFAULT_LOAN_INTEREST_RATE_PCT,
  } = inputs

  if (!(unitCount > 0)) throw new Error('unitCount must be > 0')
  if (!(grossFloorAreaSqft > 0)) throw new Error('grossFloorAreaSqft must be > 0')
  if (!(landBasis >= 0)) throw new Error('landBasis must be >= 0')
  if (!(holdPeriodYears >= 1)) throw new Error('holdPeriodYears must be >= 1')

  // ─── Development cost ───────────────────────────────────────────────
  const hardCostPsf = hardCostPsfOverride ?? HARD_COST_PSF[constructionType].psf
  const hardCostTotal = grossFloorAreaSqft * hardCostPsf
  const hardCosts: FormulaLine = {
    label: 'Hard Costs',
    formula: 'gross_floor_area_sqft × hard_cost_$/sf',
    inputs: { grossFloorAreaSqft, hardCostPsf },
    result: round2(hardCostTotal),
    note: HARD_COST_SOURCE,
  }

  const softCostTotal = hardCostTotal * softCostPct
  const softCosts: FormulaLine = {
    label: 'Soft Costs',
    formula: 'hard_costs × soft_cost_pct',
    inputs: { hardCostTotal: round2(hardCostTotal), softCostPct },
    result: round2(softCostTotal),
    note: 'Starting assumption — 15-20% of hard cost is a standard soft-cost range (design, permitting, financing, contingency). Tune per project.',
  }

  const totalDevCost = landBasis + hardCostTotal + softCostTotal
  const totalDevelopmentCost: FormulaLine = {
    label: 'Total Development Cost',
    formula: 'land_basis + hard_costs + soft_costs',
    inputs: { landBasis, hardCostTotal: round2(hardCostTotal), softCostTotal: round2(softCostTotal) },
    result: round2(totalDevCost),
  }

  // ─── Leverage (shared by both deal types) ───────────────────────────
  const loanAmountVal = totalDevCost * loanToCostPct
  const loanAmount: FormulaLine = {
    label: 'Loan Amount',
    formula: 'total_development_cost × loan_to_cost_pct',
    inputs: { totalDevCost: round2(totalDevCost), loanToCostPct },
    result: round2(loanAmountVal),
  }
  const equityRequiredVal = totalDevCost - loanAmountVal
  const equityRequired: FormulaLine = {
    label: 'Equity Required',
    formula: 'total_development_cost - loan_amount',
    inputs: { totalDevCost: round2(totalDevCost), loanAmount: round2(loanAmountVal) },
    result: round2(equityRequiredVal),
  }
  const annualDebtServiceVal = loanAmountVal * loanInterestRatePct
  const annualDebtService: FormulaLine = {
    label: 'Annual Debt Service',
    formula: 'loan_amount × loan_interest_rate_pct',
    inputs: { loanAmount: round2(loanAmountVal), loanInterestRatePct },
    result: round2(annualDebtServiceVal),
    note: 'Interest-only assumption (no principal amortization) — simplifies the DCF to a level annual carry cost; a fully-amortizing loan would show a declining balance and rising principal component instead.',
  }

  let result: ProFormaOutputs

  if (dealType === 'RENTAL') {
    const monthlyRentPerUnit = inputs.monthlyRentPerUnit
    if (!monthlyRentPerUnit || monthlyRentPerUnit <= 0) {
      throw new Error(
        'monthlyRentPerUnit is required for RENTAL deals — this engine does not fabricate rent comps. Supply a manual $/unit/month input (see rent_comps table for saved comps).'
      )
    }
    const occupancyPct = inputs.stabilizedOccupancyPct ?? DEFAULT_STABILIZED_OCCUPANCY_PCT
    const opexRatioPct = inputs.opexRatioPct ?? DEFAULT_OPEX_RATIO_PCT
    const exitCapRatePct = inputs.exitCapRatePct ?? DEFAULT_EXIT_CAP_RATE_PCT
    const rentGrowthPct = inputs.rentGrowthPct ?? DEFAULT_RENT_GROWTH_PCT
    const expenseGrowthPct = inputs.expenseGrowthPct ?? DEFAULT_EXPENSE_GROWTH_PCT
    const dispositionCostPct = inputs.dispositionCostPct ?? DEFAULT_DISPOSITION_COST_PCT

    const grossPotentialRevenueVal = monthlyRentPerUnit * unitCount * 12
    const grossPotentialRevenue: FormulaLine = {
      label: 'Gross Potential Revenue (Year 1, stabilized)',
      formula: 'monthly_rent_per_unit × unit_count × 12',
      inputs: { monthlyRentPerUnit, unitCount },
      result: round2(grossPotentialRevenueVal),
    }

    const effectiveGrossIncomeVal = grossPotentialRevenueVal * occupancyPct
    const effectiveGrossIncome: FormulaLine = {
      label: 'Effective Gross Income (Year 1)',
      formula: 'gross_potential_revenue × stabilized_occupancy_pct',
      inputs: { grossPotentialRevenue: round2(grossPotentialRevenueVal), occupancyPct },
      result: round2(effectiveGrossIncomeVal),
    }

    const operatingExpensesVal = effectiveGrossIncomeVal * opexRatioPct
    const operatingExpenses: FormulaLine = {
      label: 'Operating Expenses (Year 1)',
      formula: 'effective_gross_income × opex_ratio_pct',
      inputs: { effectiveGrossIncome: round2(effectiveGrossIncomeVal), opexRatioPct },
      result: round2(operatingExpensesVal),
      note: 'Starting assumption — 35% expense ratio is a typical garden multifamily starting point. Tune per property type.',
    }

    const noiVal = effectiveGrossIncomeVal - operatingExpensesVal
    const noi: FormulaLine = {
      label: 'Net Operating Income (Year 1)',
      formula: 'effective_gross_income - operating_expenses',
      inputs: { effectiveGrossIncome: round2(effectiveGrossIncomeVal), operatingExpenses: round2(operatingExpensesVal) },
      result: round2(noiVal),
    }

    const capRateImpliedValueVal = noiVal / exitCapRatePct
    const capRateImpliedValue: FormulaLine = {
      label: 'Cap-Rate-Implied Value (Year 1)',
      formula: 'noi ÷ exit_cap_rate_pct',
      inputs: { noi: round2(noiVal), exitCapRatePct },
      result: round2(capRateImpliedValueVal),
    }

    const year1CashFlowVal = noiVal - annualDebtServiceVal
    const year1CashFlow: FormulaLine = {
      label: 'Year 1 Levered Cash Flow',
      formula: 'noi - annual_debt_service',
      inputs: { noi: round2(noiVal), annualDebtService: round2(annualDebtServiceVal) },
      result: round2(year1CashFlowVal),
    }

    const cashOnCashReturnVal = equityRequiredVal > 0 ? year1CashFlowVal / equityRequiredVal : 0
    const cashOnCashReturn: FormulaLine = {
      label: 'Cash-on-Cash Return (Year 1)',
      formula: 'year1_levered_cash_flow ÷ equity_required',
      inputs: { year1CashFlow: round2(year1CashFlowVal), equityRequired: round2(equityRequiredVal) },
      result: round2(cashOnCashReturnVal * 10000) / 10000,
    }

    // ─── Multi-year DCF for IRR / equity multiple ──────────────────────
    // NOI grows via rentGrowthPct on revenue and expenseGrowthPct on
    // expenses independently, then nets. Debt service held level
    // (interest-only, see annualDebtService note). At exit, the property
    // is sold off the NEXT year's NOI at the stated exit cap rate (standard
    // forward-cap convention), less disposition cost, less loan payoff
    // (principal balance unchanged under the interest-only assumption).
    const schedule: number[] = [-round2(equityRequiredVal)]
    let revenue = grossPotentialRevenueVal * occupancyPct
    let expenses = operatingExpensesVal
    for (let year = 1; year <= holdPeriodYears; year++) {
      revenue = year === 1 ? revenue : revenue * (1 + rentGrowthPct)
      expenses = year === 1 ? expenses : expenses * (1 + expenseGrowthPct)
      const noiYear = revenue - expenses
      let cashFlowYear = noiYear - annualDebtServiceVal
      if (year === holdPeriodYears) {
        const terminalNoi = (revenue * (1 + rentGrowthPct)) - (expenses * (1 + expenseGrowthPct))
        const exitValue = terminalNoi / exitCapRatePct
        const netSaleProceeds = exitValue * (1 - dispositionCostPct) - loanAmountVal
        cashFlowYear += netSaleProceeds
      }
      schedule.push(round2(cashFlowYear))
    }

    const irrVal = solveIrr(schedule)
    const irrLine: FormulaLine = {
      label: `${holdPeriodYears}-Year Levered IRR`,
      formula: 'irr(cash_flow_schedule) — financial npm package (numpy-financial port), solves NPV(schedule, r) = 0',
      inputs: { holdPeriodYears, cashFlowSchedule: schedule.join(', ') },
      result: round2(irrVal * 10000) / 10000,
    }

    const totalDistributions = schedule.slice(1).reduce((a, b) => a + b, 0)
    const equityMultipleVal = equityRequiredVal > 0 ? totalDistributions / equityRequiredVal : 0
    const equityMultiple: FormulaLine = {
      label: 'Equity Multiple',
      formula: 'sum(cash_flow_schedule[1..N]) ÷ equity_required',
      inputs: { totalDistributions: round2(totalDistributions), equityRequired: round2(equityRequiredVal) },
      result: round2(equityMultipleVal * 10000) / 10000,
      note: 'Assumes equity is fully funded at t0 with no additional capital calls; any negative interim year is absorbed against the initial equity, not called separately.',
    }

    result = {
      hardCosts, softCosts, totalDevelopmentCost,
      grossPotentialRevenue, effectiveGrossIncome, operatingExpenses, noi,
      capRateImpliedValue, loanAmount, equityRequired, annualDebtService,
      year1CashFlow, cashOnCashReturn, irr: irrLine, equityMultiple,
      cashFlowSchedule: schedule,
      assumptions: {
        hardCostSource: HARD_COST_SOURCE,
        softCostPctSource: '15-20% of hard cost, starting assumption',
        dealType,
        holdPeriodYears,
        comps: { source: 'manual_input', note: 'monthlyRentPerUnit supplied by caller — not scraped or fabricated. See rent_comps table for saved comps.' },
      },
    }
  } else {
    // FOR_SALE — build-and-sell product. No stabilized operating income;
    // revenue realizes as a single sellout event. NOI/cap-rate-implied-value
    // are not meaningful for this deal type (income approach doesn't apply
    // to a for-sale product) and are reported as N/A (0, explicitly labeled)
    // rather than silently omitted or fabricated.
    const avgSalePricePerUnit = inputs.avgSalePricePerUnit
    if (!avgSalePricePerUnit || avgSalePricePerUnit <= 0) {
      throw new Error(
        'avgSalePricePerUnit is required for FOR_SALE deals — this engine does not fabricate sale comps. Supply a manual $/unit price input.'
      )
    }
    const sellingCostPct = inputs.sellingCostPct ?? DEFAULT_SELLING_COST_PCT

    const grossPotentialRevenueVal = avgSalePricePerUnit * unitCount
    const grossPotentialRevenue: FormulaLine = {
      label: 'Gross Sale Revenue',
      formula: 'avg_sale_price_per_unit × unit_count',
      inputs: { avgSalePricePerUnit, unitCount },
      result: round2(grossPotentialRevenueVal),
    }

    const sellingCostsVal = grossPotentialRevenueVal * sellingCostPct
    const effectiveGrossIncome: FormulaLine = {
      label: 'Net Sale Revenue (after selling costs)',
      formula: 'gross_sale_revenue × (1 - selling_cost_pct)',
      inputs: { grossSaleRevenue: round2(grossPotentialRevenueVal), sellingCostPct },
      result: round2(grossPotentialRevenueVal - sellingCostsVal),
      note: 'For-sale product has no vacancy/occupancy concept — this line is net of selling costs (commission + closing), not net of vacancy.',
    }

    const operatingExpenses: FormulaLine = {
      label: 'Selling Costs',
      formula: 'gross_sale_revenue × selling_cost_pct',
      inputs: { grossSaleRevenue: round2(grossPotentialRevenueVal), sellingCostPct },
      result: round2(sellingCostsVal),
      note: 'Starting assumption — 6% commission + closing is a typical for-sale disposition cost.',
    }

    const noi: FormulaLine = {
      label: 'Net Operating Income',
      formula: 'N/A — income approach does not apply to a for-sale (build-and-sell) product',
      inputs: {},
      result: 0,
      note: 'For-sale products realize value through a single sellout event, not recurring NOI. See netSaleProceeds in the cash flow schedule instead.',
    }
    const capRateImpliedValue: FormulaLine = {
      label: 'Cap-Rate-Implied Value',
      formula: 'N/A — no stabilized NOI for a for-sale product',
      inputs: {},
      result: 0,
      note: 'Cap rate valuation is an income-approach method; it does not apply to a build-and-sell product with no held NOI.',
    }

    const year1CashFlow: FormulaLine = {
      label: 'Year 1 Cash Flow (construction-loan carry only)',
      formula: '0 - annual_debt_service',
      inputs: { annualDebtService: round2(annualDebtServiceVal) },
      result: round2(-annualDebtServiceVal),
      note: 'No operating income during construction/sellout — this is the interest-carry cost on the construction loan, not a return metric.',
    }
    const cashOnCashReturnVal = equityRequiredVal > 0 ? year1CashFlow.result / equityRequiredVal : 0
    const cashOnCashReturn: FormulaLine = {
      label: 'Cash-on-Cash Return (Year 1)',
      formula: 'year1_cash_flow ÷ equity_required',
      inputs: { year1CashFlow: year1CashFlow.result, equityRequired: round2(equityRequiredVal) },
      result: round2(cashOnCashReturnVal * 10000) / 10000,
      note: 'Not a standard metric for a for-sale product — shown for output-shape consistency with RENTAL. Negative by construction (construction-loan carry, no interim income). Equity Multiple and IRR are the meaningful for-sale return metrics.',
    }

    const schedule: number[] = [-round2(equityRequiredVal)]
    for (let year = 1; year < holdPeriodYears; year++) {
      schedule.push(round2(-annualDebtServiceVal))
    }
    const netSaleProceeds = (grossPotentialRevenueVal - sellingCostsVal) - loanAmountVal
    schedule.push(round2(-annualDebtServiceVal + netSaleProceeds))

    const irrVal = solveIrr(schedule)
    const irrLine: FormulaLine = {
      label: `${holdPeriodYears}-Year IRR (construction + sellout)`,
      formula: 'irr(cash_flow_schedule) — financial npm package (numpy-financial port), solves NPV(schedule, r) = 0',
      inputs: { holdPeriodYears, cashFlowSchedule: schedule.join(', ') },
      result: round2(irrVal * 10000) / 10000,
    }

    const totalDistributions = schedule.slice(1).reduce((a, b) => a + b, 0)
    const equityMultipleVal = equityRequiredVal > 0 ? totalDistributions / equityRequiredVal : 0
    const equityMultiple: FormulaLine = {
      label: 'Equity Multiple',
      formula: 'sum(cash_flow_schedule[1..N]) ÷ equity_required',
      inputs: { totalDistributions: round2(totalDistributions), equityRequired: round2(equityRequiredVal) },
      result: round2(equityMultipleVal * 10000) / 10000,
    }

    result = {
      hardCosts, softCosts, totalDevelopmentCost,
      grossPotentialRevenue, effectiveGrossIncome, operatingExpenses, noi,
      capRateImpliedValue, loanAmount, equityRequired, annualDebtService,
      year1CashFlow, cashOnCashReturn, irr: irrLine, equityMultiple,
      cashFlowSchedule: schedule,
      assumptions: {
        hardCostSource: HARD_COST_SOURCE,
        softCostPctSource: '15-20% of hard cost, starting assumption',
        dealType,
        holdPeriodYears,
        comps: { source: 'manual_input', note: 'avgSalePricePerUnit supplied by caller — not scraped or fabricated.' },
      },
    }
  }

  return result
}
