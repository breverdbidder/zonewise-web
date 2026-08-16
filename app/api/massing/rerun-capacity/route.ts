// Server-side massing capacity endpoint for the ElevenLabs "rerun_capacity"
// voice tool (agent_8801kzppqvkqewtaabvh8wyg7tyv, tool_9201m04zbgfaeferwjhz5f17ngg3).
//
// #19148 wired that tool directly at the zonewise-floorplan Worker's
// POST /site-massing/generate, which took only {parcel_id, co_no} and did
// zoning + parcel-boundary resolution server-side itself. #19149's SSOT
// consolidation correctly deleted that Worker route as a duplicate of the
// canonical solver (lib/development-analysis/site-massing-solver.ts), but its
// caller — POST /api/massing/run — expects the resolution already done by
// the client (see MassingEngine.tsx), so the voice tool broke live (#19152).
//
// This endpoint does the same resolve-then-solve sequence as
// MassingEngine.tsx, server-side, reusing its exact zoning-resolution logic
// (lib/development-analysis/parcel-zoning-resolver.ts) rather than
// duplicating it. parcel_id here is the sample_properties/search_parcels
// format (e.g. "25 3605-25-*-17"), NOT zw_parcels.pin_clean's compact format
// — that is what search_sites (the tool the agent calls first) returns, and
// what rerun_capacity's own tool schema says it is given.
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  resolveZoningForParcel,
  zoningStandardsToSolverInputs,
} from '@/lib/development-analysis/parcel-zoning-resolver'
import {
  computeParcelCandidates,
  computeMultiUnitCandidates,
  parseParcelPolygon,
  type LayoutType,
} from '@/lib/development-analysis/site-massing-solver'

const ALL_LAYOUT_TYPES: LayoutType[] = ['single_family', 'townhome_row', 'multifamily_grid']

interface RerunCapacityInput {
  parcel_id: string
  co_no: number
  layout_types?: string[]
  stories?: number
}

interface PooledOption {
  layout_type: LayoutType
  unit_count: number
  gross_floor_area_sqft: number
  lot_coverage_pct: number
  setback_compliant: boolean
  score: number
}

export async function POST(request: NextRequest) {
  let body: RerunCapacityInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { parcel_id, co_no, layout_types, stories } = body
  if (!parcel_id || typeof co_no !== 'number') {
    return NextResponse.json(
      { ok: false, error: 'Missing required "parcel_id" (string) and/or "co_no" (number)' },
      { status: 400 },
    )
  }

  const requestedTypes = (Array.isArray(layout_types) && layout_types.length > 0
    ? layout_types
    : ALL_LAYOUT_TYPES) as LayoutType[]
  for (const t of requestedTypes) {
    if (!ALL_LAYOUT_TYPES.includes(t)) {
      return NextResponse.json(
        { ok: false, error: `Unknown layout_type "${t}" — must be one of ${ALL_LAYOUT_TYPES.join(', ')}` },
        { status: 400 },
      )
    }
  }

  const supabase = createServiceClient()

  const { data: parcel, error: parcelError } = await supabase
    .from('sample_properties')
    .select('parcel_id, acres, geometry')
    .eq('parcel_id', parcel_id)
    .limit(1)
    .single()

  if (parcelError || !parcel) {
    return NextResponse.json(
      { ok: false, error: `No sample_properties row for parcel_id="${parcel_id}".` },
      { status: 404 },
    )
  }

  const ring = parseParcelPolygon(parcel.geometry)
  if (!ring || ring.length < 3) {
    return NextResponse.json(
      { ok: false, error: `Parcel ${parcel_id} has no usable boundary geometry — cannot run the massing solver.` },
      { status: 422 },
    )
  }

  const zoning = await resolveZoningForParcel(supabase, parcel_id)
  if (!zoning) {
    return NextResponse.json(
      { ok: false, error: `No zoning assignment found for parcel_id="${parcel_id}".` },
      { status: 404 },
    )
  }

  // co_no is the caller's own confirmation of which county they mean — never
  // silently solve against a different county's parcel than what was asked.
  if (zoning.co_no != null && zoning.co_no !== co_no) {
    return NextResponse.json(
      {
        ok: false,
        error: `co_no mismatch: requested ${co_no}, but parcel_id="${parcel_id}" resolves to co_no ${zoning.co_no}.`,
      },
      { status: 422 },
    )
  }

  const solverInputs = zoningStandardsToSolverInputs(zoning.standards)
  const effectiveStories = stories ?? solverInputs.stories

  const pooled: PooledOption[] = []

  for (const layoutType of requestedTypes) {
    const group: PooledOption[] = []

    if (layoutType === 'single_family') {
      const candidates = computeParcelCandidates(
        ring,
        zoning.zone_code,
        { front: solverInputs.front, side: solverInputs.side, rear: solverInputs.rear },
        solverInputs.maxH,
        solverInputs.maxCov,
        solverInputs.far,
        5,
      )
      for (const c of candidates) {
        group.push({
          layout_type: 'single_family',
          unit_count: 1,
          gross_floor_area_sqft: Math.round(c.env.actualGFA * c.fitScale * c.fitScale * 10) / 10,
          lot_coverage_pct: Math.round(c.covPct * 100) / 100,
          setback_compliant: c.setbackCompliant,
          score: c.score,
        })
      }
    } else {
      const candidates = computeMultiUnitCandidates(
        ring,
        layoutType,
        { front: solverInputs.front, side: solverInputs.side, rear: solverInputs.rear },
        solverInputs.maxCov,
        { maxDensityDuAcre: solverInputs.maxDensityDuAcre, stories: effectiveStories, maxCandidates: 5 },
      )
      for (const c of candidates) {
        group.push({
          layout_type: layoutType,
          unit_count: c.unitCount,
          gross_floor_area_sqft: c.grossFloorAreaSqft,
          lot_coverage_pct: c.lotCoveragePct,
          setback_compliant: c.setbackCompliant,
          score: c.score,
        })
      }
    }

    // computeParcelCandidates (single_family) scores in raw actual-GFA sqft;
    // computeMultiUnitCandidates (townhome_row/multifamily_grid) scores on a
    // normalized 0-1 scale. Pooling those raw would let single_family's much
    // larger numbers always dominate the ranked list whenever more than one
    // layout_type is requested. Normalize each layout's own candidates against
    // its own max score before pooling, so "top 5 across layouts" reflects
    // relative quality within each layout, not incomparable score units.
    const maxGroupScore = Math.max(...group.map(o => o.score), 0)
    for (const o of group) pooled.push({ ...o, score: maxGroupScore > 0 ? o.score / maxGroupScore : 0 })
  }

  // Same pool-then-rerank-top-5 the old Worker did when multiple layout types
  // were requested — one flat ranked list across whatever was solved for.
  pooled.sort((a, b) => b.score - a.score)
  const options = pooled.slice(0, 5).map((o, i) => ({
    option_rank: i + 1,
    layout_type: o.layout_type,
    unit_count: o.unit_count,
    gross_floor_area_sqft: o.gross_floor_area_sqft,
    lot_coverage_pct: o.lot_coverage_pct,
    setback_compliant: o.setback_compliant,
  }))

  return NextResponse.json({
    ok: true,
    parcel_id,
    co_no,
    zoning_snapshot: {
      zoning_code: zoning.zone_code,
      jurisdiction: zoning.jurisdiction,
      district_name: zoning.district_name,
      standards_source: zoning.is_fallback ? 'pattern_fallback' : 'zone_standards_table',
      standards: {
        front_setback_ft: solverInputs.front,
        side_setback_ft: solverInputs.side,
        rear_setback_ft: solverInputs.rear,
        max_height_ft: solverInputs.maxH,
        max_lot_coverage_pct: solverInputs.maxCov,
        floor_area_ratio: solverInputs.far,
        max_stories: effectiveStories,
        max_density_du_acre: solverInputs.maxDensityDuAcre ?? null,
      },
    },
    options,
    ...(options.length === 0
      ? { skipped_reason: 'No compliant massing options for the requested layout type(s) under this parcel\'s real boundary and zoning standards.' }
      : {}),
  })
}
