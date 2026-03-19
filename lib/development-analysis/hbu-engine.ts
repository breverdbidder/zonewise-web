// HBU Engine — ZoneWise.AI Development Intelligence
// Brevard County 2025-2026 construction costs and market data

import type { Parcel, Envelope, HBUScenario } from './types'

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

// Market cap rates and rent $/sf by use type (Brevard 2025-2026)
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

// Permitted uses by zone category
export const ZONE_PERMITTED: Record<string, { uses: string[]; conditional: string[]; prohibited: string[] }> = {
  'R-1':  { uses: ['sfr', 'adu'], conditional: ['duplex'], prohibited: ['retail', 'office', 'hotel', 'multifamily', 'mixed_use'] },
  'RM-6': { uses: ['sfr', 'duplex', 'townhome', 'multifamily'], conditional: ['adu'], prohibited: ['retail', 'office', 'hotel'] },
  'BU-1': { uses: ['retail', 'office', 'mixed_use'], conditional: ['hotel', 'multifamily'], prohibited: ['sfr', 'adu'] },
  'BU-2': { uses: ['retail', 'office', 'mixed_use', 'hotel', 'multifamily'], conditional: ['coworking'], prohibited: ['sfr', 'adu'] },
}

// Min lot requirements by use type
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

export function computeEnvelope(
  lotW: number, lotD: number,
  front: number, side: number, rear: number,
  maxH: number, maxCov: number, farVal: number
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
  const covPct = lotArea > 0 ? ((effFP / lotArea) * 100).toFixed(1) : 0
  return { bw, bd, lotArea, footprint, maxByCov, effFP, maxGFA, floors, actualGFA, volume, covPct }
}

// Real 4-Test HBU Calculator
export function calculateHBU(parcel: Parcel, env: Envelope): HBUScenario[] {
  const zone = parcel.zone
  const permitted = ZONE_PERMITTED[zone] || ZONE_PERMITTED['R-1']
  const lotArea = env.lotArea
  const allUseTypes = [...permitted.uses, ...permitted.conditional]

  const timelineMap: Record<string, string> = {
    sfr: '8-12 mo', adu: '4-6 mo', duplex: '10-14 mo', townhome: '14-18 mo',
    multifamily: '12-18 mo', retail: '6-10 mo', office: '8-12 mo',
    mixed_use: '18-24 mo', hotel: '24-30 mo', coworking: '8-12 mo',
  }

  const scenarios: HBUScenario[] = allUseTypes.map(useType => {
    const isConditional = permitted.conditional.includes(useType)
    const costs = CONSTRUCTION_COSTS[useType === 'sfr' ? 'sfr_new' : useType] || CONSTRUCTION_COSTS.sfr_new
    const market = MARKET_DATA[useType] || MARKET_DATA.sfr
    const minLot = MIN_LOT_REQS[useType] || MIN_LOT_REQS.sfr

    // TEST 1: LEGAL PERMISSIBILITY (0-100)
    let legal = 0
    if (permitted.uses.includes(useType)) legal = 95
    else if (isConditional) legal = 60
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
    const annualNOI = env.actualGFA * market.rentSf * 12 * 0.65
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
    const overall = Math.round(legal * 0.15 + physical * 0.2 + financial * 0.4 + maximal * 0.25)

    const risk: 'Low' | 'Medium' | 'High' =
      roi > 25 && legal >= 80 ? 'Low' : roi > 10 && legal >= 50 ? 'Medium' : 'High'

    // Max bid formula: (ARV×70%)-Repairs-$10K-MIN($25K,15%ARV)
    const arv = projectedValue * market.arvMultiplier
    const repairs = parcel.yearBuilt < 1980 ? env.actualGFA * 35 : env.actualGFA * 15
    const maxBid = Math.max(0, (arv * 0.7) - repairs - 10000 - Math.min(25000, arv * 0.15))

    return {
      useType,
      use: (CONSTRUCTION_COSTS[useType === 'sfr' ? 'sfr_new' : useType] || { label: useType }).label,
      legal, physical, financial, maximal, score: overall,
      roi: Math.round(roi), risk, timeline: timelineMap[useType] || '12-18 mo',
      investReq: totalInvest, buildCost, projectedValue: Math.round(projectedValue),
      annualNOI: Math.round(annualNOI), maxBid: Math.round(maxBid),
      isConditional,
    }
  })

  // As-is / hold scenario
  const currentROI = parcel.improvValue > 0
    ? ((parcel.improvValue * 0.06) / (parcel.landValue + parcel.improvValue)) * 100
    : 3
  scenarios.unshift({
    useType: 'hold', use: `${parcel.currentUse} (as-is)`,
    legal: 100, physical: 100,
    financial: Math.min(60, Math.round(currentROI * 5)),
    maximal: Math.round(currentROI * 4),
    score: Math.round(30 + currentROI * 3),
    roi: Math.round(currentROI), risk: 'Low', timeline: '0 mo',
    investReq: 0, buildCost: 0,
    projectedValue: parcel.landValue + parcel.improvValue,
    annualNOI: Math.round((parcel.landValue + parcel.improvValue) * 0.06),
    maxBid: 0, isConditional: false,
  })

  return scenarios.sort((a, b) => b.score - a.score)
}

// Map envelope_cache DB row → Parcel type
export function mapRow(row: Record<string, unknown>): Parcel {
  const parcel_id = row.parcel_id as string | undefined
  const prefix = parcel_id?.substring(0, 4) || ''
  const account = parcel_id?.replace(/[-.]/g, '') || ''
  const photo = (row.bcpao_photo_url as string | null) ||
    `https://www.bcpao.us/photos/${prefix}/${account}011.jpg`

  return {
    id: parcel_id || '',
    address: row.address as string || '',
    city: row.city as string || '',
    zip: row.zip as string || '',
    zone: row.zone_code as string || 'R-1',
    zoneDesc: row.zone_description as string || '',
    lotWidth: (row.lot_width_ft as number) || 0,
    lotDepth: (row.lot_depth_ft as number) || 0,
    landValue: (row.land_value as number) || 0,
    improvValue: (row.improvement_value as number) || 0,
    yearBuilt: (row.year_built as number) || 1970,
    photo,
    setbacks: {
      front: (row.front_setback as number) || 25,
      side: (row.side_setback as number) || 7.5,
      rear: (row.rear_setback as number) || 20,
    },
    maxHeight: (row.max_height_ft as number) || 35,
    maxCoverage: (row.max_lot_coverage_pct as number) || 40,
    far: (row.floor_area_ratio as number) || 0.5,
    currentUse: (row.current_use as string) || 'Residential',
    lat: (row.latitude as number | null) ?? null,
    lng: (row.longitude as number | null) ?? null,
    floodZone: (row.flood_zone as string) || 'X',
    hasUtilities: (row.has_utilities as boolean) ?? true,
    roadFrontage: (row.road_frontage_ft as number | null) ?? null,
    topography: (row.topography as string) || 'flat',
  }
}
