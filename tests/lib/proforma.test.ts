import { describe, it, expect } from 'vitest'
import { npv } from 'financial'
import { calcMultiYearReturns, type MultiYearOutputs } from '@/lib/feasibility/proforma'
import type { ProFormaOutputs } from '@/types/feasibility'

// Minimal ProFormaOutputs stub — calcMultiYearReturns only reads .noi and .totalDevCost.
function baseOutputs(noi: number, totalDevCost: number): ProFormaOutputs {
  return {
    gpr: 0, egi: 0, opexAmt: 0, noi, stabilizedValue: 0,
    hardCost: 0, softCost: 0, totalDevCost, profit: 0, margin: 0,
    yieldOnCost: 0, devSpread: 0, totalGSF: 0, adjustedUnits: 0,
  }
}

// IRR is, by definition, the rate at which NPV(cashFlows, rate) === 0.
// Verifying against that definition is a hand-derivable check independent of
// trusting the `financial` package's internal IRR solver.
function assertIsIrr(result: MultiYearOutputs) {
  expect(result.irr).not.toBeNull()
  const n = npv(result.irr as number, result.cashFlows)
  expect(Math.abs(n)).toBeLessThan(0.01)
}

describe('calcMultiYearReturns', () => {
  it('scenario 1 — flat NOI, 1-year hold, all-cash, no selling costs', () => {
    // Hand calc: exitValue = 100,000 / 6.5% = 1,538,461.538...
    // cashFlows = [-1,000,000, 100,000 + 1,538,461.538] = [-1,000,000, 1,638,461.538]
    // equityMultiple = 1,638,461.538 / 1,000,000 = 1.638461538
    // single-period IRR = (1,638,461.538 / 1,000,000) - 1 = 0.638461538
    const base = baseOutputs(100_000, 1_000_000)
    const r = calcMultiYearReturns(base, {
      holdYears: 1,
      exitCapRatePct: 6.5,
      rentGrowthPct: 0,
      sellingCostPct: 0,
      equityPct: 100,
    })

    expect(r.initialEquity).toBeCloseTo(1_000_000, 6)
    expect(r.exitValue).toBeCloseTo(100_000 / 0.065, 6)
    expect(r.netSaleProceeds).toBeCloseTo(100_000 / 0.065, 6)
    expect(r.cashFlows).toHaveLength(2)
    expect(r.cashFlows[0]).toBeCloseTo(-1_000_000, 6)
    expect(r.cashFlows[1]).toBeCloseTo(100_000 + 100_000 / 0.065, 6)
    expect(r.equityMultiple).toBeCloseTo(1.638461538, 6)
    expect(r.irr).toBeCloseTo(0.638461538, 6)
    assertIsIrr(r)
  })

  it('scenario 2 — 3-year hold, 3% NOI growth, 80% leverage, 2% selling costs', () => {
    // Hand calc:
    //   initialEquity = 500,000 * 0.80 = 400,000
    //   yearlyNOI = [50,000, 51,500, 53,045]           (50,000 * 1.03^0, ^1, ^2)
    //   exitNOI   = 53,045 * 1.03 = 54,636.35
    //   exitValue = 54,636.35 / 0.05 = 1,092,727.00
    //   netSaleProceeds = 1,092,727.00 * 0.98 = 1,070,872.46
    //   cashFlows = [-400,000, 50,000, 51,500, 53,045 + 1,070,872.46]
    //             = [-400,000, 50,000, 51,500, 1,123,917.46]
    //   totalDistributions = 50,000 + 51,500 + 1,123,917.46 = 1,225,417.46
    //   equityMultiple = 1,225,417.46 / 400,000 = 3.06354365
    const base = baseOutputs(50_000, 500_000)
    const r = calcMultiYearReturns(base, {
      holdYears: 3,
      exitCapRatePct: 5,
      rentGrowthPct: 3,
      sellingCostPct: 2,
      equityPct: 80,
    })

    expect(r.initialEquity).toBeCloseTo(400_000, 6)
    expect(r.yearlyNOI[0]).toBeCloseTo(50_000, 6)
    expect(r.yearlyNOI[1]).toBeCloseTo(51_500, 6)
    expect(r.yearlyNOI[2]).toBeCloseTo(53_045, 6)
    expect(r.exitNOI).toBeCloseTo(54_636.35, 2)
    expect(r.exitValue).toBeCloseTo(1_092_727, 0)
    expect(r.netSaleProceeds).toBeCloseTo(1_070_872.46, 1)
    expect(r.cashFlows).toEqual([
      expect.closeTo(-400_000, 6),
      expect.closeTo(50_000, 6),
      expect.closeTo(51_500, 6),
      expect.closeTo(1_123_917.46, 1),
    ])
    expect(r.totalDistributions).toBeCloseTo(1_225_417.46, 1)
    expect(r.equityMultiple).toBeCloseTo(3.06354365, 5)
    assertIsIrr(r)
  })

  it('returns irr=null and equityMultiple=0 when equityPct is 0 (no capital at risk)', () => {
    const base = baseOutputs(50_000, 500_000)
    const r = calcMultiYearReturns(base, {
      holdYears: 2,
      exitCapRatePct: 6,
      equityPct: 0,
    })
    expect(r.initialEquity).toBe(0)
    expect(r.irr).toBeNull()
    expect(r.equityMultiple).toBe(0)
  })
})
