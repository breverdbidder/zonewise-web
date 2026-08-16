import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

const { POST } = await import('@/app/api/reports/proforma/route')

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/reports/proforma', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

const validScenario = {
  name: 'Optimized — 20-unit multifamily',
  address: '123 Test St, Melbourne, FL',
  inputs: {
    unitCount: 20,
    grossFloorAreaSqft: 17000,
    constructionType: 'MID_RISE',
    landBasis: 1_000_000,
    dealType: 'RENTAL',
    monthlyRentPerUnit: 1800,
    holdPeriodYears: 3,
  },
}

const validBaseline = {
  name: 'As-of-right — 6 single family lots',
  address: '123 Test St, Melbourne, FL',
  inputs: {
    unitCount: 6,
    grossFloorAreaSqft: 9000,
    constructionType: 'SF',
    landBasis: 1_000_000,
    dealType: 'FOR_SALE',
    avgSalePricePerUnit: 420_000,
    holdPeriodYears: 2,
  },
}

describe('POST /api/reports/proforma', () => {
  it('returns a computed report for a single scenario (no baseline)', async () => {
    const res = await POST(makeRequest({ scenario: validScenario }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.report.scenario.outputs.totalDevelopmentCost.result).toBeGreaterThan(0)
    expect(data.report.baseline).toBeUndefined()
    expect(data.report.comparison).toBeUndefined()
    expect(data.report.headline.length).toBeGreaterThan(0)
  })

  it('returns a comparison block when a baseline scenario is supplied', async () => {
    const res = await POST(makeRequest({ scenario: validScenario, baseline: validBaseline }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.report.comparison).toBeDefined()
    expect(data.report.comparison.find((r: any) => r.label === 'Units').optimized).toBe('20')
    expect(data.report.comparison.find((r: any) => r.label === 'Units').baseline).toBe('6')
  })

  it('rejects a malformed request body (schema validation)', async () => {
    const res = await POST(makeRequest({ scenario: { name: 'x' } }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid request')
  })

  it('rejects RENTAL scenario missing monthlyRentPerUnit — engine refuses to fabricate a comp', async () => {
    const res = await POST(
      makeRequest({
        scenario: {
          ...validScenario,
          inputs: { ...validScenario.inputs, monthlyRentPerUnit: undefined },
        },
      })
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/monthlyRentPerUnit is required/)
  })

  it('rejects non-JSON body', async () => {
    const req = new NextRequest('http://localhost/api/reports/proforma', {
      method: 'POST',
      body: 'not json',
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
