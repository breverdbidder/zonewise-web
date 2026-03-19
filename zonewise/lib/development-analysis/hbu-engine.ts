// zonewise/lib/development-analysis/hbu-engine.ts
// Extracted from zonewise-dev-intel-v3.jsx — Real 4-Test HBU Scoring Engine
// Brevard County 2025-2026 data tables

import type { Parcel, Envelope, HBUScenario } from './types'

// ─── CONSTRUCTION COSTS ─────────────────────────────────────
// Brevard County construction costs $/sf (2025-2026 actuals)
export const CONSTRUCTION_COSTS: Record<string, { low: number; mid: number; high: number; label: string }> = {
  sfr_new:     { low: 150, mid: 195, high: 260, label: 'New SFR' },
  adu:         { low: 130, mid: 175, high: 220, label: 'ADU' },
  duplex:      { low: 140, mid: 180, high: 235, label: 'Duplex' },
  townhome:    { low: 145, mid: 185, high: 240, label: 'Townhome' },
  multifamily: { low: 135, mid: 175, high: 230, label: 'Multi-Family' },
  retail:      { low: 120, mid: 160, high: 210, label: 'Retail' },
  office:      { low: 140, mid: 185, high: 250, label: 'Office' },
  mixed_use:   { low: 155, mid: 200, high: 270, label: 'Mixed Use' },
  hotel:       { low: 180, mid: 240, high: 320, label: 'Hotel' },
  coworking:   { low: 90,  mid: 130, high: 180, label: 'Co-Working TI' },
}

// ─── MARKET DATA ────────────────────────────────────────────
// Rent $/sf/mo, cap rates, ARV multipliers by use type (Brevard 2025-2026)
export const MARKET_DATA: Record<string, { rentSf: number; capRate: number; arvMultiplier: number }> = {
  sfr:         { rentSf: 1.45, capRate: 0.06,  arvMultiplier: 1.0 },
  duplex:      { rentSf: 1.30, capRate: 0.065, arvMultiplier: 0.95 },
  townhome:    { rentSf: 1.35, capRate: 0.06,  arvMultiplier: 0.97 },
  multifamily: { rentSf: 1.20, capRate: 0.07,  arvMultiplier: 0.90 },
  retail:      { rentSf: 1.60, capRate: 0.075, arvMultiplier: 0.85 },
  office:      { rentSf: 1.80, capRate: 0.08,  arvMultiplier: 0.80 },
  mixed_use:   { rentSf: 1.50, capRate: 0.07,  arvMultiplier: 0.88 },
  hotel:       { rentSf: 2.20, capRate: 0.09,  arvMultiplier: 0.75 },
}

// ─── ZONE PERMITTED ─────────────────────────────────────────
// Permitted/conditional/prohibited uses per zone
export const ZONE_PERMITTED: Record<string, { uses: string[]; conditional: string[]; prohibited: string[] }> = {
  'R-1':  { uses: ['sfr', 'adu'],                                  conditional: ['duplex'],              prohibited: ['retail', 'office', 'hotel', 'multifamily', 'mixed_use'] },
  'RM-6': { uses: ['sfr', 'duplex', 'townhome', 'multifamily'],    conditional: ['adu'],                 prohibited: ['retail', 'office', 'hotel'] },
  'BU-1': { uses: ['retail', 'office', 'mixed_use'],               conditional: ['hotel', 'multifamily'], prohibited: ['sfr', 'adu'] },
  'BU-2': { uses: ['retail', 'office', 'mixed_use', 'hotel', 'multifamily'], conditional: ['coworking'], prohibited: ['sfr', 'adu'] },
}

// ─── MIN LOT REQUIREMENTS ────────────────────────────────────
// Minimum lot width/area/frontage per use type (Brevard LDC)
export const MIN_LOT_REQS: Record<string, { minWidth: number; minArea: number; minFrontage: number }> = {
  sfr:         { minWidth: 60,  minArea: 6000,  minFrontage: 50 },
  adu:         { minWidth: 50,  minArea: 5000,  minFrontage: 40 },
  duplex:      { minWidth: 75,  minArea: 7500,  minFrontage: 60 },
  townhome:    { minWidth: 80,  minArea: 8000,  minFrontage: 70 },
  multifamily: { minWidth: 100, minArea: 10000, minFrontage: 80 },
  retail:      { minWidth: 50,  minArea: 5000,  minFrontage: 40 },
  office:      { minWidth: 60,  minArea: 6000,  minFrontage: 50 },
  mixed_use:   { minWidth: 80,  minArea: 8000,  minFrontage: 60 },
  hotel:       { minWidth: 100, minArea: 15000, minFrontage: 80 },
  coworking:   { minWidth: 60,  minArea: 5000,  minFrontage: 50 },
}

// ─── ENVELOPE CALCULATOR ─────────────────────────────────────
export function computeEnvelope(
  lotW: number,
  lotD: number,
  front: number,
  side: number,
  rear: number,
  maxH: number,
  maxCov: number,
  farVal: number
): Envelope {
  const bw = Math.max(0, lotW - side * 2)
  const bd = Math.max(0, lotD - front - rear)
  const lotArea = lotW * lotD
  const footprint = bw * bd
  const maxByCov = lotArea * (maxCov / 100)
  const effFP = Math.min(footprint, maxByCov)
  const maxGFA = lotArea * farVal
  const floors = effFP > 0 ? Math.min(Math.floor(maxH / 10), Math.ceil(maxGFA / effFP)) : 0
  const actualGFA = effFP * floors
  const volume = effFP * Math.min(maxH, floors * 10)
  const covPct = lotArea > 0 ? ((effFP / lotArea) * 100).toFixed(1) : '0'
  return { bw, bd, lotArea, footprint, maxByCov, effFP, maxGFA, floors, actualGFA, volume, covPct }
}

// ─── 4-TEST HBU CALCULATOR ───────────────────────────────────
// Max bid formula: (ARV×70%) - Repairs - $10K - MIN($25K, ARV×15%)
export function calculateHBU(parcel: Parcel, env: Envelope): HBUScenario[] {
  const zone = parcel.zone
  const permitted = ZONE_PERMITTED[zone] || ZONE_PERMITTED['R-1']
  const lotArea = env.lotArea
  const allUseTypes = [...permitted.uses, ...permitted.conditional]

  const scenarios: HBUScenario[] = allUseTypes.map(useType => {
    const isConditional = permitted.conditional.includes(useType)
    const costs = CONSTRUCTION_COSTS[useType === 'sfr' ? 'sfr_new' : useType] || CONSTRUCTION_COSTS['sfr_new']
    const market = MARKET_DATA[useType] || MARKET_DATA['sfr']
    const minLot = MIN_LOT_REQS[useType] || MIN_LOT_REQS['sfr']

    // TEST 1: LEGAL PERMISSIBILITY (0-100)
    let legal = 0
    if (permitted.uses.includes(useType)) legal = 95
    else if (isConditional) legal = 60 // needs CU approval
    if (parcel.floodZone === 'AE' || parcel.floodZone === 'VE') legal -= 10
    legal = Math.max(0, Math.min(100, legal))

    // TEST 2: PHYSICAL POSSIBILITY (0-100)
    let physical = 100
    if (parcel.lotWidth < minLot.minWidth) physical -= 25
    if (lotArea < minLot.minArea) physical -= 25
    if (parcel.roadFrontage && parcel.roadFrontage < minLot.minFrontage) physical -= 15
    if (!parcel.hasUtilities) physical -= 20
    if (parcel.topography === 'steep') physical -= 15
    if (parcel.floodZone === 'VE') physical -= 20
    else if (parcel.floodZone === 'AE') physical -= 10
    const aspectRatio = parcel.lotWidth / parcel.lotDepth
    if (aspectRatio < 0.3 || aspectRatio > 3) physical -= 15
    physical = Math.max(0, Math.min(100, physical))

    // TEST 3: FINANCIAL FEASIBILITY (0-100)
    const buildCost = env.actualGFA * costs.mid
    const landCost = parcel.landValue
    const totalInvest = buildCost + landCost
    const annualNOI = env.actualGFA * market.rentSf * 12 * 0.65 // 65% NOI margin
    const projectedValue = annualNOI > 0 ? annualNOI / market.capRate : 0
    const profit = projectedValue - totalInvest
    const roi = totalInvest > 0 ? (profit / totalInvest) * 100 : 0
    let financial = 0
    if (roi > 40) financial = 95
    else if (roi > 25) financial = 85
    else if (roi > 15) financial = 75
    else if (roi > 8) financial = 60
    else if (roi > 0) financial = 40
    else financial = 15
    if (parcel.floodZone === 'AE') financial -= 5
    if (parcel.floodZone === 'VE') financial -= 12
    financial = Math.max(0, Math.min(100, financial))

    // TEST 4: MAXIMALLY PRODUCTIVE (weighted composite)
    const maximal = Math.round(legal * 0.2 + physical * 0.2 + financial * 0.6)

    // Overall HBU score
    const score = Math.round(legal * 0.15 + physical * 0.2 + financial * 0.4 + maximal * 0.25)

    // Risk assessment
    const risk: 'Low' | 'Medium' | 'High' =
      roi > 25 && legal >= 80 ? 'Low' : roi > 10 && legal >= 50 ? 'Medium' : 'High'

    // Timeline by use type
    const timelineMap: Record<string, string> = {
      sfr: '8-12 mo', adu: '4-6 mo', duplex: '10-14 mo', townhome: '14-18 mo',
      multifamily: '12-18 mo', retail: '6-10 mo', office: '8-12 mo',
      mixed_use: '18-24 mo', hotel: '24-30 mo', coworking: '8-12 mo',
    }

    // Max bid formula: (ARV×70%) - Repairs - $10K - MIN($25K, ARV×15%)
    const arv = projectedValue * market.arvMultiplier
    const repairs = parcel.yearBuilt < 1980 ? env.actualGFA * 35 : env.actualGFA * 15
    const maxBid = Math.max(0, arv * 0.7 - repairs - 10000 - Math.min(25000, arv * 0.15))

    return {
      useType,
      use: (CONSTRUCTION_COSTS[useType === 'sfr' ? 'sfr_new' : useType] || { label: useType }).label,
      legal,
      physical,
      financial,
      maximal,
      score,
      roi: Math.round(roi),
      risk,
      timeline: timelineMap[useType] || '12-18 mo',
      investReq: totalInvest,
      buildCost,
      projectedValue: Math.round(projectedValue),
      annualNOI: Math.round(annualNOI),
      maxBid: Math.round(maxBid),
      isConditional,
    }
  })

  // Add "as-is / hold" scenario
  const currentROI =
    parcel.improvValue > 0
      ? ((parcel.improvValue * 0.06) / (parcel.landValue + parcel.improvValue)) * 100
      : 3

  scenarios.unshift({
    useType: 'hold',
    use: `${parcel.currentUse} (as-is)`,
    legal: 100,
    physical: 100,
    financial: Math.min(60, Math.round(currentROI * 5)),
    maximal: Math.round(currentROI * 4),
    score: Math.round(30 + currentROI * 3),
    roi: Math.round(currentROI),
    risk: 'Low',
    timeline: '0 mo',
    investReq: 0,
    buildCost: 0,
    projectedValue: parcel.landValue + parcel.improvValue,
    annualNOI: Math.round((parcel.landValue + parcel.improvValue) * 0.06),
    maxBid: 0,
    isConditional: false,
  })

  return scenarios.sort((a, b) => b.score - a.score)
}
