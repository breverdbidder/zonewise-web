// Site Massing Solver — real parcel-polygon candidate footprint generation.
// Sibling to computeEnvelope(): that function solves ONE idealized rectangular
// lot. This module walks the actual parcel boundary, tries multiple building
// orientations aligned to the lot's own edges, and reuses computeEnvelope's
// setback/coverage/FAR math per orientation so the numbers stay consistent
// with the rest of the massing UI.

import { computeEnvelope } from './hbu-engine'
import type { Envelope } from './types'

// Same flat-earth approximation MassingEngine.tsx uses for its 3D lot render,
// so a candidate footprint drawn here lines up with what the UI already shows.
const LAT_FT = 364173
const LNG_FT = 320106

export type LngLat = [number, number]

// sample_properties.geometry is stored as Esri JSON (`{ rings: [...] }`),
// NOT GeoJSON — confirmed live: 351,421/351,421 non-null rows use `rings`,
// zero use GeoJSON `{type,coordinates}`. MassingEngine.tsx's own
// parseGeometry() only understands GeoJSON, so it silently falls back to an
// idealized rectangle for every real parcel today (pre-existing bug, out of
// scope here per the "3D pipeline stays as-is" non-goal). This parser
// handles the format the data is actually in, plus GeoJSON for robustness,
// so the solver/DXF path gets the real boundary.
export function parseParcelPolygon(geometry: unknown): LngLat[] | null {
  if (!geometry) return null
  try {
    const geo = typeof geometry === 'string' ? JSON.parse(geometry) : geometry
    const g = geo as { rings?: unknown; type?: string; coordinates?: unknown }
    if (Array.isArray(g.rings) && Array.isArray(g.rings[0])) {
      return g.rings[0] as LngLat[]
    }
    if (g.type === 'Polygon' && Array.isArray(g.coordinates) && Array.isArray((g.coordinates as unknown[])[0])) {
      return (g.coordinates as LngLat[][])[0]
    }
    if (g.type === 'MultiPolygon' && Array.isArray(g.coordinates) && Array.isArray((g.coordinates as unknown[])[0])) {
      return (g.coordinates as LngLat[][][])[0][0]
    }
  } catch { /* fall through */ }
  return null
}

export interface CandidateFootprint {
  rank: number
  angleDeg: number
  layoutType: string
  lotW: number
  lotD: number
  env: Envelope
  covPct: number
  farActual: number
  setbackCompliant: boolean
  fitScale: number // 1.0 = no shrink needed to stay inside real parcel boundary
  score: number
  footprintLngLat: LngLat[] // closed ring, BLDG-FOOTPRINT
  envelopeLngLat: LngLat[]  // closed ring, SETBACK-LINES (buildable envelope before footprint fit)
}

interface Pt { x: number; y: number }

function toLocalFeet(coords: LngLat[]): { pts: Pt[]; clng: number; clat: number } {
  const lngs = coords.map(c => c[0])
  const lats = coords.map(c => c[1])
  const clng = (Math.min(...lngs) + Math.max(...lngs)) / 2
  const clat = (Math.min(...lats) + Math.max(...lats)) / 2
  const pts = coords.map(([lng, lat]): Pt => ({
    x: (lng - clng) * LNG_FT,
    y: (lat - clat) * LAT_FT,
  }))
  return { pts, clng, clat }
}

function fromLocalFeet(pt: Pt, clng: number, clat: number): LngLat {
  return [clng + pt.x / LNG_FT, clat + pt.y / LAT_FT]
}

function crossZ(o: Pt, a: Pt, b: Pt): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

// Andrew's monotone chain convex hull. Parcel boundaries in this dataset are
// simple polygons (quads/pentagons); the hull is a safe, dependency-free
// substitute for full non-convex offsetting.
function convexHull(points: Pt[]): Pt[] {
  const pts = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))
  if (pts.length <= 2) return pts
  const lower: Pt[] = []
  for (const p of pts) {
    while (lower.length >= 2 && crossZ(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Pt[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && crossZ(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return [...lower, ...upper]
}

function rotate(p: Pt, angleRad: number): Pt {
  const c = Math.cos(angleRad)
  const s = Math.sin(angleRad)
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c }
}

function bbox(points: Pt[]): { minX: number; maxX: number; minY: number; maxY: number; w: number; d: number } {
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  return { minX, maxX, minY, maxY, w: maxX - minX, d: maxY - minY }
}

// Ray-casting point-in-polygon (polygon given as open or closed ring).
function pointInPolygon(pt: Pt, poly: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y
    const xj = poly[j].x, yj = poly[j].y
    const intersect = (yi > pt.y) !== (yj > pt.y) &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function typologyLabel(zoneCode: string): string {
  const z = (zoneCode || '').toUpperCase()
  if (z.startsWith('R-1') || z.startsWith('R-2') || z === 'SF' || z.startsWith('RS') || z.startsWith('RE')) return 'SF'
  if (z.startsWith('R-3') || z.startsWith('R-4') || z.startsWith('RM') || z.startsWith('MFR') || z.startsWith('RA')) return 'GARDEN_MF'
  if (z.startsWith('R-5') || z.startsWith('RM-24') || z.startsWith('RU') || z.startsWith('R-6') || z.startsWith('R-10')) return 'MID_RISE'
  if (z.startsWith('C') || z.startsWith('B') || z.startsWith('CBD') || z.startsWith('MU') || z.startsWith('IU')) return 'HIGH_RISE'
  return 'GARDEN_MF'
}

/**
 * Generate ranked candidate building footprints within the REAL parcel
 * boundary polygon, one per distinct lot-edge orientation, each solved via
 * the existing computeEnvelope() setback/coverage/FAR math.
 */
export function computeParcelCandidates(
  parcelPolygonLngLat: LngLat[],
  zoneCode: string,
  setbacks: { front: number; side: number; rear: number },
  maxH: number, maxCov: number, farVal: number,
  maxCandidates = 5,
): CandidateFootprint[] {
  const ring = parcelPolygonLngLat.length > 2 &&
    parcelPolygonLngLat[0][0] === parcelPolygonLngLat[parcelPolygonLngLat.length - 1][0] &&
    parcelPolygonLngLat[0][1] === parcelPolygonLngLat[parcelPolygonLngLat.length - 1][1]
    ? parcelPolygonLngLat.slice(0, -1)
    : parcelPolygonLngLat

  if (ring.length < 3) return []

  const { pts, clng, clat } = toLocalFeet(ring)
  const hull = convexHull(pts)
  if (hull.length < 3) return []

  // Candidate orientations: the angle of each hull edge, deduped within 3deg
  // (edges of a rectangular-ish lot come in parallel pairs — no need to solve
  // the same orientation twice).
  const angles: number[] = []
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]
    const b = hull[(i + 1) % hull.length]
    let deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
    deg = ((deg % 90) + 90) % 90 // rectangles built on this edge only need the 0-90 range
    if (!angles.some(existing => Math.abs(existing - deg) < 3)) angles.push(deg)
  }

  const { front, side, rear } = setbacks
  const label = typologyLabel(zoneCode)
  const candidates: CandidateFootprint[] = []

  for (const deg of angles) {
    const rad = (-deg * Math.PI) / 180
    const rotatedAll = pts.map(p => rotate(p, rad))
    const rotatedHull = hull.map(p => rotate(p, rad))
    const bb = bbox(rotatedAll)
    if (bb.w <= 0 || bb.d <= 0) continue

    const env = computeEnvelope(bb.w, bb.d, front, side, rear, maxH, maxCov, farVal)
    if (env.effFP <= 0 || env.floors <= 0) continue

    const cx = (bb.minX + bb.maxX) / 2
    // Same front/rear convention as deriveMetrics()/MassingEngine's 3D scene:
    // depth axis offset by (front - rear) / 2 so the footprint sits between
    // the front and rear setback lines, not centered on the raw bbox.
    const cy = bb.minY + rear + env.bd / 2

    function footprintCorners(scale: number): Pt[] {
      const hw = (env.bw * scale) / 2
      const hd = (env.bd * scale) / 2
      return [
        { x: cx - hw, y: cy - hd },
        { x: cx + hw, y: cy - hd },
        { x: cx + hw, y: cy + hd },
        { x: cx - hw, y: cy + hd },
      ]
    }

    // Shrink toward the setback-envelope center until every corner lands
    // inside the true (possibly non-rectangular) parcel boundary — this is
    // the check an idealized-rectangle solve skips entirely.
    let fitScale = 1.0
    let compliant = footprintCorners(1.0).every(c => pointInPolygon(c, rotatedAll))
    if (!compliant) {
      for (let s = 0.95; s >= 0.5; s -= 0.05) {
        if (footprintCorners(s).every(c => pointInPolygon(c, rotatedAll))) {
          fitScale = s
          compliant = true
          break
        }
      }
    }

    const finalCorners = footprintCorners(fitScale)
    const envelopeCorners: Pt[] = [
      { x: cx - env.bw / 2, y: cy - env.bd / 2 },
      { x: cx + env.bw / 2, y: cy - env.bd / 2 },
      { x: cx + env.bw / 2, y: cy + env.bd / 2 },
      { x: cx - env.bw / 2, y: cy + env.bd / 2 },
    ]

    const unrotate = (p: Pt) => rotate(p, -rad)
    const footprintLngLat = finalCorners.map(p => fromLocalFeet(unrotate(p), clng, clat))
    footprintLngLat.push(footprintLngLat[0])
    const envelopeLngLat = envelopeCorners.map(p => fromLocalFeet(unrotate(p), clng, clat))
    envelopeLngLat.push(envelopeLngLat[0])

    const effFPScaled = env.effFP * fitScale * fitScale
    const actualGFAScaled = env.actualGFA * fitScale * fitScale
    const lotArea = bb.w * bb.d
    const covPct = lotArea > 0 ? (effFPScaled / lotArea) * 100 : 0
    const farActual = lotArea > 0 ? actualGFAScaled / lotArea : 0

    // Bigger buildable GFA wins; a footprint that needed shrinking to fit the
    // real boundary (or still doesn't fit) is penalized so idealized-bbox
    // orientations don't outrank ones that respect the true parcel shape.
    const score = actualGFAScaled * (compliant ? 1 : 0.5) * fitScale

    candidates.push({
      rank: 0,
      angleDeg: deg,
      layoutType: `${label}-${Math.round(deg)}deg`,
      lotW: bb.w,
      lotD: bb.d,
      env,
      covPct,
      farActual,
      setbackCompliant: compliant,
      fitScale,
      score,
      footprintLngLat,
      envelopeLngLat,
    })
  }

  candidates.sort((a, b) => b.score - a.score)
  const top = candidates.slice(0, maxCandidates)
  top.forEach((c, i) => { c.rank = i + 1 })
  return top
}

// ---------------------------------------------------------------------------
// Multi-layout massing — townhome_row / multifamily_grid
// ---------------------------------------------------------------------------
// Ported from workers/zonewise-floorplan/site-massing.js (cli-anything-biddeed
// Worker, shipped 2026-08-16, decommissioned by the SSOT consolidation in
// issue #19149). That version's buildable envelope was an axis-aligned
// bounding-box inset by setbacks at ONE fixed orientation, and its fit-to-
// parcel check was a single boolean (`envelopeFullyInsideParcel`) that never
// adjusted the layout when it was false. This port keeps the Worker's
// unit-packing patterns (row placement, grid placement, access-drive
// reservation) and its 0.4/0.3/0.2/0.1 scoring formula, but runs them once
// per hull-edge orientation (the same angle search computeParcelCandidates
// uses above) and replaces the boolean flag with the same corner-by-corner
// point-in-polygon shrink used for single_family, so an irregular lot still
// gets a footprint that actually fits inside its true boundary rather than
// just its setback-inset bounding box.

const ACCESS_DRIVE_WIDTH_FT = 24
const GRID_STEP_FT = 5
const MAX_RAW_PLACEMENTS_PER_ANGLE = 120

export type LayoutType = 'single_family' | 'townhome_row' | 'multifamily_grid'

export interface SubFootprint {
  kind: 'building' | 'access_drive'
  label?: string
  ringLngLat: LngLat[] // closed ring
}

export interface MultiUnitCandidate {
  rank: number
  angleDeg: number
  layoutType: LayoutType
  unitCount: number
  grossFloorAreaSqft: number
  lotCoveragePct: number
  setbackCompliant: boolean
  fitScale: number // 1.0 = no shrink needed to stay inside the real parcel boundary
  score: number
  footprintLngLat: LngLat[] // closed ring, overall bounding box of all units — backward-compatible single-ring rendering
  envelopeLngLat: LngLat[] // closed ring, buildable envelope (setback-inset bbox) at this orientation — SETBACK-LINES
  subFootprints: SubFootprint[] // real per-unit + access-drive rings, for DXF/UI that wants the actual layout
}

interface RawRect { kind: 'building' | 'access_drive'; label?: string; corners: Pt[] }
interface RawPlacement { unitCount: number; footprintSqft: number; grossFloorAreaSqft: number; rects: RawRect[] }

function polygonAreaFeet(ring: Pt[]): number {
  let area = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    area += a.x * b.y - b.x * a.y
  }
  return Math.abs(area) / 2
}

function rectCorners(x: number, y: number, w: number, d: number): Pt[] {
  return [{ x, y }, { x: x + w, y }, { x: x + w, y: y + d }, { x, y: y + d }]
}

// Same 24x40ft row-of-units + near-edge access-drive strip pattern as the
// Worker's generateTownhomeCandidates, operating within [envMinX..envMinX+
// envWidth] x [envMinY..envMinY+envDepth] instead of its bbox-derived envelope.
function generateTownhomeRaw(
  envMinX: number, envMinY: number, envWidth: number, envDepth: number,
  opts: { stories?: number; unitWidthFt?: number; unitDepthFt?: number },
  maxFootprintSqft: number, densityCap: number,
): RawPlacement[] {
  const stories = opts.stories ?? 2
  const unitWidth = opts.unitWidthFt ?? 24
  const unitDepth = opts.unitDepthFt ?? 40
  const raw: RawPlacement[] = []

  const coverageUnitCap = Math.floor(maxFootprintSqft / (unitWidth * unitDepth))
  const availableDepth = envDepth - ACCESS_DRIVE_WIDTH_FT
  if (availableDepth < unitDepth || coverageUnitCap < 2 || densityCap < 2) return raw

  const maxUnitsInRow = Math.min(Math.floor(envWidth / unitWidth), coverageUnitCap, densityCap)
  if (maxUnitsInRow < 2) return raw

  const unitCounts = Array.from(new Set([maxUnitsInRow, Math.max(2, Math.floor(maxUnitsInRow * 0.75)), Math.max(2, Math.floor(maxUnitsInRow * 0.5))]))

  for (const unitCount of unitCounts) {
    if (raw.length >= MAX_RAW_PLACEMENTS_PER_ANGLE) break
    const rowWidth = unitCount * unitWidth
    const slackX = envWidth - rowWidth
    const steps = Math.max(1, Math.floor(slackX / GRID_STEP_FT) + 1)

    for (let s = 0; s < steps && raw.length < MAX_RAW_PLACEMENTS_PER_ANGLE; s++) {
      const baseX = envMinX + s * GRID_STEP_FT
      const baseY = envMinY + ACCESS_DRIVE_WIDTH_FT // units sit behind the near-edge access drive

      const rects: RawRect[] = []
      for (let u = 0; u < unitCount; u++) {
        rects.push({ kind: 'building', label: `unit_${u + 1}`, corners: rectCorners(baseX + u * unitWidth, baseY, unitWidth, unitDepth) })
      }
      rects.push({ kind: 'access_drive', corners: rectCorners(baseX, envMinY, rowWidth, ACCESS_DRIVE_WIDTH_FT) })

      raw.push({
        unitCount,
        footprintSqft: unitCount * unitWidth * unitDepth,
        grossFloorAreaSqft: unitCount * unitWidth * unitDepth * stories,
        rects,
      })
    }
  }
  return raw
}

// Same 1x1/1x2/2x1/2x2 grid-of-buildings pattern as the Worker's
// generateMultifamilyCandidates.
function generateMultifamilyRaw(
  envMinX: number, envMinY: number, envWidth: number, envDepth: number,
  opts: { stories?: number; sqftPerUnit?: number },
  maxFootprintSqft: number, densityCap: number,
): RawPlacement[] {
  const stories = opts.stories ?? 3
  const sqftPerUnit = opts.sqftPerUnit ?? 900
  const raw: RawPlacement[] = []
  const gridConfigs = [{ rows: 1, cols: 1 }, { rows: 1, cols: 2 }, { rows: 2, cols: 1 }, { rows: 2, cols: 2 }]

  for (const { rows, cols } of gridConfigs) {
    if (raw.length >= MAX_RAW_PLACEMENTS_PER_ANGLE) break
    const totalDriveW = (cols - 1) * ACCESS_DRIVE_WIDTH_FT
    const totalDriveD = (rows - 1) * ACCESS_DRIVE_WIDTH_FT
    const usableW = envWidth - totalDriveW
    const usableD = envDepth - totalDriveD
    if (usableW <= 0 || usableD <= 0) continue

    // Worker's original tier list was [0.9, 0.7, 0.5] — verified live against
    // a real 9.75ac Brevard RU-2-15 parcel (Cocoa's real 15 du/acre cap,
    // zone_standards id 71) and found it produces ZERO surviving candidates:
    // those fractions at the default stories(3)/sqftPerUnit(900) imply
    // 29-52 units/acre, which blows past any real Brevard multi-family zone's
    // density cap before the per-candidate density filter even runs. Added
    // two lower tiers so real low-density zones (most of Brevard's RU-2-*
    // districts are 10-25 du/acre) still produce compliant options instead
    // of silently returning nothing.
    for (const frac of [0.9, 0.7, 0.5, 0.3, 0.15]) {
      const targetTotalFootprint = maxFootprintSqft * frac
      const perCellTarget = targetTotalFootprint / (rows * cols)
      const cellAspect = (usableW / cols) / (usableD / rows)
      let bldgW = Math.sqrt(perCellTarget * cellAspect)
      let bldgD = perCellTarget / bldgW
      if (bldgW > usableW / cols) { bldgW = usableW / cols; bldgD = perCellTarget / bldgW }
      if (bldgD > usableD / rows) { bldgD = usableD / rows; bldgW = perCellTarget / bldgD }
      if (bldgW < 20 || bldgD < 20) continue

      const totalW = cols * bldgW + totalDriveW
      const totalD = rows * bldgD + totalDriveD
      const slackX = envWidth - totalW
      const slackY = envDepth - totalD
      if (slackX < 0 || slackY < 0) continue
      const stepsX = Math.max(1, Math.floor(slackX / GRID_STEP_FT) + 1)
      const stepsY = Math.max(1, Math.floor(slackY / GRID_STEP_FT) + 1)

      for (let sx = 0; sx < stepsX && raw.length < MAX_RAW_PLACEMENTS_PER_ANGLE; sx++) {
        for (let sy = 0; sy < stepsY && raw.length < MAX_RAW_PLACEMENTS_PER_ANGLE; sy++) {
          const originX = envMinX + sx * GRID_STEP_FT
          const originY = envMinY + sy * GRID_STEP_FT
          const rects: RawRect[] = []
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const px = originX + c * (bldgW + ACCESS_DRIVE_WIDTH_FT)
              const py = originY + r * (bldgD + ACCESS_DRIVE_WIDTH_FT)
              rects.push({ kind: 'building', label: `bldg_${r + 1}_${c + 1}`, corners: rectCorners(px, py, bldgW, bldgD) })
            }
          }
          if (rows * cols > 1) rects.push({ kind: 'access_drive', corners: rectCorners(originX, originY, totalW, totalD) })

          const buildingFootprintSqft = rows * cols * bldgW * bldgD
          const unitsPerBuilding = Math.max(1, Math.floor((bldgW * bldgD * stories) / sqftPerUnit))
          const unitCount = unitsPerBuilding * rows * cols
          if (unitCount > densityCap) continue

          raw.push({
            unitCount,
            footprintSqft: buildingFootprintSqft,
            grossFloorAreaSqft: buildingFootprintSqft * stories,
            rects,
          })
        }
      }
    }
  }
  return raw
}

export interface MultiUnitOptions {
  maxDensityDuAcre?: number
  stories?: number
  unitWidthFt?: number
  unitDepthFt?: number
  sqftPerUnit?: number
  maxCandidates?: number
}

/**
 * Generate ranked townhome_row / multifamily_grid candidates against the
 * REAL parcel boundary polygon: same per-orientation hull-edge search and
 * point-in-polygon shrink-to-fit as computeParcelCandidates, using the
 * Worker's unit-packing patterns for placement and its 0.4/0.3/0.2/0.1
 * formula for ranking. A placement that still doesn't fit the true boundary
 * at maximum shrink (fitScale 0.5) is dropped, not silently kept out-of-bounds.
 */
export function computeMultiUnitCandidates(
  parcelPolygonLngLat: LngLat[],
  layoutType: Exclude<LayoutType, 'single_family'>,
  setbacks: { front: number; side: number; rear: number },
  maxCovPct: number,
  opts: MultiUnitOptions = {},
): MultiUnitCandidate[] {
  const ring = parcelPolygonLngLat.length > 2 &&
    parcelPolygonLngLat[0][0] === parcelPolygonLngLat[parcelPolygonLngLat.length - 1][0] &&
    parcelPolygonLngLat[0][1] === parcelPolygonLngLat[parcelPolygonLngLat.length - 1][1]
    ? parcelPolygonLngLat.slice(0, -1)
    : parcelPolygonLngLat
  if (ring.length < 3) return []

  const { pts, clng, clat } = toLocalFeet(ring)
  const hull = convexHull(pts)
  if (hull.length < 3) return []

  const angles: number[] = []
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]
    const b = hull[(i + 1) % hull.length]
    let deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
    deg = ((deg % 90) + 90) % 90
    if (!angles.some(existing => Math.abs(existing - deg) < 3)) angles.push(deg)
  }

  const parcelAreaSqft = polygonAreaFeet(pts)
  const densityCap = densityCapUnits(parcelAreaSqft, opts.maxDensityDuAcre)

  interface Pooled { angleDeg: number; rad: number; rects: RawRect[]; unitCount: number; grossFloorAreaSqft: number; footprintSqft: number; fitScale: number; envMinX: number; envMaxX: number; envMinY: number; envMaxY: number }
  const pooled: Pooled[] = []

  for (const deg of angles) {
    const rad = (-deg * Math.PI) / 180
    const rotatedAll = pts.map(p => rotate(p, rad))
    const bb = bbox(rotatedAll)
    if (bb.w <= 0 || bb.d <= 0) continue

    const envMinX = bb.minX + setbacks.side
    const envMaxX = bb.maxX - setbacks.side
    const envMinY = bb.minY + setbacks.front
    const envMaxY = bb.maxY - setbacks.rear
    const envWidth = envMaxX - envMinX
    const envDepth = envMaxY - envMinY
    if (envWidth <= 0 || envDepth <= 0) continue

    const maxFootprintSqft = maxFootprintSqftFor(bb.w * bb.d, maxCovPct)
    const raw = layoutType === 'townhome_row'
      ? generateTownhomeRaw(envMinX, envMinY, envWidth, envDepth, opts, maxFootprintSqft, densityCap)
      : generateMultifamilyRaw(envMinX, envMinY, envWidth, envDepth, opts, maxFootprintSqft, densityCap)

    const cx = (envMinX + envMaxX) / 2
    const cy = (envMinY + envMaxY) / 2

    for (const placement of raw) {
      const allCorners = placement.rects.flatMap(r => r.corners)
      let fitScale = 1.0
      let compliant = allCorners.every(c => pointInPolygon(c, rotatedAll))
      if (!compliant) {
        for (let s = 0.95; s >= 0.5; s -= 0.05) {
          const scaled = allCorners.map(c => ({ x: cx + (c.x - cx) * s, y: cy + (c.y - cy) * s }))
          if (scaled.every(c => pointInPolygon(c, rotatedAll))) { fitScale = s; compliant = true; break }
        }
      }
      // Even the deepest shrink didn't fit this orientation — drop it rather
      // than fabricate a footprint outside the real boundary.
      if (!compliant) continue
      pooled.push({
        angleDeg: deg, rad, rects: placement.rects,
        unitCount: placement.unitCount,
        grossFloorAreaSqft: placement.grossFloorAreaSqft * fitScale * fitScale,
        footprintSqft: placement.footprintSqft * fitScale * fitScale,
        fitScale,
        envMinX, envMaxX, envMinY, envMaxY,
      })
    }
  }

  if (pooled.length === 0) return []

  const targetCoveragePct = Math.min(maxCovPct, 60)
  const maxUnits = Math.max(...pooled.map(p => p.unitCount))
  const maxGfa = Math.max(...pooled.map(p => p.grossFloorAreaSqft))

  const survivors = pooled
    .map(p => ({ ...p, coveragePct: parcelAreaSqft > 0 ? (p.footprintSqft / parcelAreaSqft) * 100 : 0 }))
    .filter(p => p.coveragePct <= maxCovPct)

  if (survivors.length === 0) return []

  const scored = survivors.map(p => {
    const unitNorm = maxUnits > 0 ? p.unitCount / maxUnits : 0
    const gfaNorm = maxGfa > 0 ? p.grossFloorAreaSqft / maxGfa : 0
    const coverageFit = 1 - Math.min(1, Math.abs(p.coveragePct - targetCoveragePct) / 100)
    const hasAccessDrive = p.rects.some(r => r.kind === 'access_drive')
    const accessQuality = hasAccessDrive ? 1 : 0.5
    const score = 0.4 * unitNorm + 0.3 * gfaNorm + 0.2 * coverageFit + 0.1 * accessQuality
    return { ...p, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.slice(0, opts.maxCandidates ?? 5)

  return top.map((p, i) => {
    const unrotate = (pt: Pt) => rotate(pt, -p.rad)
    const subFootprints: SubFootprint[] = p.rects.map(r => {
      const lngLatRing = r.corners.map(c => fromLocalFeet(unrotate(c), clng, clat))
      lngLatRing.push(lngLatRing[0])
      return { kind: r.kind, label: r.label, ringLngLat: lngLatRing }
    })
    const allX = p.rects.flatMap(r => r.corners.map(c => c.x))
    const allY = p.rects.flatMap(r => r.corners.map(c => c.y))
    const minX = Math.min(...allX), maxX = Math.max(...allX)
    const minY = Math.min(...allY), maxY = Math.max(...allY)
    const overallCorners: Pt[] = [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }]
    const footprintLngLat = overallCorners.map(c => fromLocalFeet(unrotate(c), clng, clat))
    footprintLngLat.push(footprintLngLat[0])

    const envelopeCorners: Pt[] = [
      { x: p.envMinX, y: p.envMinY }, { x: p.envMaxX, y: p.envMinY },
      { x: p.envMaxX, y: p.envMaxY }, { x: p.envMinX, y: p.envMaxY },
    ]
    const envelopeLngLat = envelopeCorners.map(c => fromLocalFeet(unrotate(c), clng, clat))
    envelopeLngLat.push(envelopeLngLat[0])

    return {
      rank: i + 1,
      angleDeg: p.angleDeg,
      layoutType,
      unitCount: p.unitCount,
      grossFloorAreaSqft: Math.round(p.grossFloorAreaSqft * 10) / 10,
      lotCoveragePct: Math.round(p.coveragePct * 100) / 100,
      setbackCompliant: true,
      fitScale: p.fitScale,
      score: Math.round(p.score * 10000) / 10000,
      footprintLngLat,
      envelopeLngLat,
      subFootprints,
    }
  })
}

function maxFootprintSqftFor(lotAreaFt: number, maxCovPct: number): number {
  return lotAreaFt * (maxCovPct / 100)
}

function densityCapUnits(lotAreaFt: number, maxDensityDuAcre?: number): number {
  if (typeof maxDensityDuAcre !== 'number') return Infinity
  return Math.floor((maxDensityDuAcre * lotAreaFt) / 43560)
}
