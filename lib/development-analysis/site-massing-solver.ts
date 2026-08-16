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
