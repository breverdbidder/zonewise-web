import { describe, it, expect } from 'vitest'
import { npv } from 'financial'
import { calculateProForma, HARD_COST_PSF } from '@/lib/development-analysis/proforma-engine'

// ─── Scenario 1 — RENTAL, single-year hold, growth/disposition cost zeroed
// out so the whole pro forma is closed-form (no iterative IRR solving
// needed to hand-verify — a 1-period cash flow schedule [C0, C1] has an
// exact algebraic IRR: r = C1 / -C0 - 1).
//
// Hand-derived (see PR description for the full derivation):
//   hardCost      = 8500 sqft x $175/sf (GARDEN_MF)   = 1,487,500
//   softCost      = 1,487,500 x 17.5%                 =   260,312.50
//   totalDevCost  = 500,000 + 1,487,500 + 260,312.50  = 2,247,812.50
//   loanAmount    = 2,247,812.50 x 65%                = 1,461,078.125
//   equity        = 2,247,812.50 - 1,461,078.125      =   786,734.375
//   debtService   = 1,461,078.125 x 6.5%               =    94,970.078125
//   grossRevenue  = $1,500/unit/mo x 10 units x 12      =   180,000
//   EGI           = 180,000 x 93% occupancy             =   167,400
//   opex          = 167,400 x 35%                       =    58,590
//   NOI           = 167,400 - 58,590                    =   108,810
//   capRateValue  = 108,810 / 6%                        = 1,813,500
//   year1CF       = 108,810 - 94,970.078125              =    13,839.921875
//   cashOnCash    = 13,839.921875 / 786,734.375           =     0.017592 (1.76%)
//   exitValue     = NOI / 6% (growth=0, so terminal NOI == year1 NOI)  = 1,813,500
//   netSaleProceeds = 1,813,500 - loanAmount(1,461,078.125) = 352,421.875
//   schedule      = [-786,734.38, 13,839.921875 + 352,421.875 = 366,261.80]
//   IRR (closed form, 1 period): 366,261.80 / 786,734.38 - 1 ≈ -0.5345 (-53.45%)
describe('proforma-engine — Scenario 1 (RENTAL, 1-year, closed-form IRR)', () => {
  const result = calculateProForma({
    unitCount: 10,
    grossFloorAreaSqft: 8500,
    constructionType: 'GARDEN_MF',
    landBasis: 500_000,
    dealType: 'RENTAL',
    monthlyRentPerUnit: 1500,
    holdPeriodYears: 1,
    rentGrowthPct: 0,
    expenseGrowthPct: 0,
    dispositionCostPct: 0,
  })

  it('hard cost uses the GARDEN_MF $/sf assumption table', () => {
    expect(HARD_COST_PSF.GARDEN_MF.psf).toBe(175)
    expect(result.hardCosts.result).toBeCloseTo(1_487_500, 2)
  })

  it('soft cost, total development cost', () => {
    expect(result.softCosts.result).toBeCloseTo(260_312.5, 2)
    expect(result.totalDevelopmentCost.result).toBeCloseTo(2_247_812.5, 2)
  })

  it('leverage: loan amount, equity required, annual debt service', () => {
    expect(result.loanAmount.result).toBeCloseTo(1_461_078.13, 2)
    expect(result.equityRequired.result).toBeCloseTo(786_734.38, 2)
    expect(result.annualDebtService.result).toBeCloseTo(94_970.08, 2)
  })

  it('revenue, NOI, cap-rate-implied value', () => {
    expect(result.grossPotentialRevenue.result).toBeCloseTo(180_000, 2)
    expect(result.effectiveGrossIncome.result).toBeCloseTo(167_400, 2)
    expect(result.operatingExpenses.result).toBeCloseTo(58_590, 2)
    expect(result.noi.result).toBeCloseTo(108_810, 2)
    expect(result.capRateImpliedValue.result).toBeCloseTo(1_813_500, 2)
  })

  it('year 1 cash flow and cash-on-cash return — independently computed ratio', () => {
    expect(result.year1CashFlow.result).toBeCloseTo(13_839.92, 2)
    const expectedCashOnCash = 13_839.921875 / 786_734.375
    expect(result.cashOnCashReturn.result).toBeCloseTo(expectedCashOnCash, 3)
  })

  it('cash flow schedule matches the hand-derived [equity outlay, year1 CF + net sale proceeds]', () => {
    expect(result.cashFlowSchedule).toHaveLength(2)
    expect(result.cashFlowSchedule[0]).toBeCloseTo(-786_734.38, 2)
    expect(result.cashFlowSchedule[1]).toBeCloseTo(366_261.80, 2)
  })

  it('IRR matches the exact closed-form single-period solution r = C1 / -C0 - 1', () => {
    const [c0, c1] = result.cashFlowSchedule
    const expectedIrr = c1 / -c0 - 1
    expect(result.irr.result).toBeCloseTo(expectedIrr, 3)
    expect(result.irr.result).toBeCloseTo(-0.5345, 2)
  })
})

// ─── Scenario 2 — RENTAL, 3-year hold with rent/expense growth and a
// forward-cap exit. Cash flow schedule is hand-derived year by year below;
// IRR is cross-checked against financial's own npv() (an independently
// implemented function from the same tested library) to confirm the
// returned rate actually satisfies NPV(schedule, r) = 0 — this catches
// sign/indexing bugs in schedule construction that "the function ran"
// would not.
describe('proforma-engine — Scenario 2 (RENTAL, 3-year DCF)', () => {
  const result = calculateProForma({
    unitCount: 20,
    grossFloorAreaSqft: 17_000,
    constructionType: 'MID_RISE',
    landBasis: 1_000_000,
    dealType: 'RENTAL',
    monthlyRentPerUnit: 1800,
    stabilizedOccupancyPct: 0.95,
    opexRatioPct: 0.30,
    exitCapRatePct: 0.055,
    holdPeriodYears: 3,
    rentGrowthPct: 0.03,
    expenseGrowthPct: 0.02,
    dispositionCostPct: 0.02,
    loanToCostPct: 0.60,
    loanInterestRatePct: 0.06,
    softCostPct: 0.18,
  })

  it('development cost and leverage', () => {
    expect(result.hardCosts.result).toBeCloseTo(3_910_000, 2) // 17,000 x $230/sf MID_RISE
    expect(result.softCosts.result).toBeCloseTo(703_800, 2)
    expect(result.totalDevelopmentCost.result).toBeCloseTo(5_613_800, 2)
    expect(result.loanAmount.result).toBeCloseTo(3_368_280, 2)
    expect(result.equityRequired.result).toBeCloseTo(2_245_520, 2)
    expect(result.annualDebtService.result).toBeCloseTo(202_096.8, 1)
  })

  it('cash flow schedule matches year-by-year hand derivation', () => {
    // Year 1: NOI = (432,000 x 0.95) - (410,400 x 0.30) = 410,400 - 123,120 = 287,280
    //         CF  = 287,280 - 202,096.8 = 85,183.2
    // Year 2: revenue 410,400 x 1.03 = 422,712; expenses 123,120 x 1.02 = 125,582.4
    //         NOI = 297,129.6; CF = 297,129.6 - 202,096.8 = 95,032.8
    // Year 3: revenue 422,712 x 1.03 = 435,393.36; expenses 125,582.4 x 1.02 = 128,094.048
    //         NOI = 307,299.312; operating CF = 105,202.512
    //         terminal NOI (fwd-cap) = 435,393.36x1.03 - 128,094.048x1.02 = 317,799.23184
    //         exitValue = 317,799.23184 / 0.055 = 5,778,167.85
    //         netSaleProceeds = 5,778,167.85 x 0.98 - 3,368,280 = 2,294,324.49
    //         Year 3 total CF = 105,202.512 + 2,294,324.49 = 2,399,527.01
    expect(result.cashFlowSchedule).toHaveLength(4)
    expect(result.cashFlowSchedule[0]).toBeCloseTo(-2_245_520, 2)
    expect(result.cashFlowSchedule[1]).toBeCloseTo(85_183.2, 1)
    expect(result.cashFlowSchedule[2]).toBeCloseTo(95_032.8, 1)
    expect(result.cashFlowSchedule[3]).toBeCloseTo(2_399_527.01, 0)
  })

  it('IRR satisfies NPV(schedule, irr) = 0 — cross-checked via financial.npv (independent function)', () => {
    const npvAtIrr = npv(result.irr.result, result.cashFlowSchedule)
    // Solver converges to its internal tolerance, not exact zero — $2 of
    // residual on a ~$5.6M schedule is 4e-7 relative error, i.e. converged.
    expect(Math.abs(npvAtIrr)).toBeLessThan(10)
  })

  it('equity multiple is the sum of undiscounted distributions over equity invested', () => {
    const totalDistributions = result.cashFlowSchedule.slice(1).reduce((a, b) => a + b, 0)
    const expected = totalDistributions / -result.cashFlowSchedule[0]
    expect(result.equityMultiple.result).toBeCloseTo(expected, 3)
    expect(result.equityMultiple.result).toBeCloseTo(1.1488, 2)
  })
})

// ─── Scenario 3 — FOR_SALE (build-and-sell), 2-year hold. No stabilized
// NOI; single sellout event at exit. Cash-on-cash and equity multiple are
// hand-derived exactly; IRR is cross-checked via NPV=0 as in Scenario 2.
describe('proforma-engine — Scenario 3 (FOR_SALE, 2-year)', () => {
  const result = calculateProForma({
    unitCount: 8,
    grossFloorAreaSqft: 6000,
    constructionType: 'SF',
    landBasis: 300_000,
    dealType: 'FOR_SALE',
    avgSalePricePerUnit: 450_000,
    softCostPct: 0.15,
    loanToCostPct: 0.60,
    loanInterestRatePct: 0.07,
    holdPeriodYears: 2,
  })

  it('development cost and leverage', () => {
    expect(result.hardCosts.result).toBeCloseTo(1_170_000, 2) // 6,000 x $195/sf SF
    expect(result.totalDevelopmentCost.result).toBeCloseTo(1_645_500, 2)
    expect(result.loanAmount.result).toBeCloseTo(987_300, 2)
    expect(result.equityRequired.result).toBeCloseTo(658_200, 2)
    expect(result.annualDebtService.result).toBeCloseTo(69_111, 2)
  })

  it('gross sale revenue and selling costs', () => {
    expect(result.grossPotentialRevenue.result).toBeCloseTo(3_600_000, 2) // $450k x 8 units
    expect(result.operatingExpenses.result).toBeCloseTo(216_000, 2) // 6% selling cost
  })

  it('NOI and cap-rate-implied value are explicitly N/A for a for-sale product', () => {
    expect(result.noi.result).toBe(0)
    expect(result.noi.formula).toMatch(/N\/A/)
    expect(result.capRateImpliedValue.result).toBe(0)
  })

  it('cash-on-cash return is the exact construction-carry ratio (-69,111 / 658,200 = -10.5%)', () => {
    expect(result.cashOnCashReturn.result).toBeCloseTo(-0.105, 4)
  })

  it('cash flow schedule: [-equity, -carry, -carry + net sale proceeds]', () => {
    // netSaleProceeds = (3,600,000 - 216,000) - 987,300 = 2,396,700
    // year 2 total = -69,111 + 2,396,700 = 2,327,589
    expect(result.cashFlowSchedule).toEqual([-658_200, -69_111, 2_327_589])
  })

  it('equity multiple is the hand-derived ratio of total distributions to equity', () => {
    expect(result.equityMultiple.result).toBeCloseTo(3.4313, 2)
  })

  it('IRR satisfies NPV(schedule, irr) = 0 — cross-checked via financial.npv', () => {
    const npvAtIrr = npv(result.irr.result, result.cashFlowSchedule)
    expect(npvAtIrr).toBeCloseTo(0, 0)
  })
})

// ─── Negative tests — required by CC_META_PROMPT §2.4 / issue guardrails.
// The engine must refuse to fabricate comps, not silently default them.
describe('proforma-engine — negative tests (no fabricated comps, invalid inputs rejected)', () => {
  it('throws for RENTAL with no monthlyRentPerUnit — refuses to fabricate a rent comp', () => {
    expect(() =>
      calculateProForma({
        unitCount: 10,
        grossFloorAreaSqft: 8000,
        constructionType: 'SF',
        landBasis: 100_000,
        dealType: 'RENTAL',
      })
    ).toThrow(/monthlyRentPerUnit is required/)
  })

  it('throws for FOR_SALE with no avgSalePricePerUnit — refuses to fabricate a sale comp', () => {
    expect(() =>
      calculateProForma({
        unitCount: 10,
        grossFloorAreaSqft: 8000,
        constructionType: 'SF',
        landBasis: 100_000,
        dealType: 'FOR_SALE',
      })
    ).toThrow(/avgSalePricePerUnit is required/)
  })

  it('throws for unitCount <= 0', () => {
    expect(() =>
      calculateProForma({
        unitCount: 0,
        grossFloorAreaSqft: 8000,
        constructionType: 'SF',
        landBasis: 100_000,
        dealType: 'RENTAL',
        monthlyRentPerUnit: 1500,
      })
    ).toThrow(/unitCount must be/)
  })

  it('throws for grossFloorAreaSqft <= 0', () => {
    expect(() =>
      calculateProForma({
        unitCount: 10,
        grossFloorAreaSqft: 0,
        constructionType: 'SF',
        landBasis: 100_000,
        dealType: 'RENTAL',
        monthlyRentPerUnit: 1500,
      })
    ).toThrow(/grossFloorAreaSqft must be/)
  })
})
