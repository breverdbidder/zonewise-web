// Persist a Massing Engine search as a shareable/re-fetchable run + its
// ranked candidate footprints. Called once per parcel selection from the
// client (see MassingEngine.tsx) — not on every render/frame.
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkFreeRunCap, recordFreeRun, usageCapBody } from '@/lib/gate/server'

interface SubFootprintInput { kind: 'building' | 'access_drive'; label?: string; ringLngLat: [number, number][] }

interface CandidateInput {
  rank: number
  layoutType: string
  footprintLngLat: [number, number][]
  unitCount: number
  grossFloorAreaSqft: number
  lotCoveragePct: number
  setbackCompliant: boolean
  score: number
  subFootprints?: SubFootprintInput[] // present for townhome_row / multifamily_grid — real per-unit + access-drive rings
}

interface RunInput {
  parcel_id: string
  co_no: number
  county?: string
  zoning: Record<string, unknown>
  boundaryLngLat: [number, number][]
  candidates: CandidateInput[]
  created_by?: string
}

function ringToEwkt(ring: [number, number][]): string {
  const closed = ring.length > 0 &&
    (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])
    ? [...ring, ring[0]]
    : ring
  const coords = closed.map(([lng, lat]) => `${lng} ${lat}`).join(', ')
  return `SRID=4326;POLYGON((${coords}))`
}

export async function POST(request: NextRequest) {
  let body: RunInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { parcel_id, co_no, zoning, boundaryLngLat, candidates } = body
  if (!parcel_id || typeof co_no !== 'number' || !zoning || !Array.isArray(boundaryLngLat) || boundaryLngLat.length < 3) {
    return NextResponse.json({ error: 'parcel_id, co_no, zoning, and a boundaryLngLat ring of >=3 points are required' }, { status: 400 })
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return NextResponse.json({ error: 'At least one candidate footprint is required' }, { status: 400 })
  }

  // PLG usage cap: 3 free massing/floorplan/proforma tool-runs per anonymous
  // session before the email gate is required (see lib/gate/server.ts).
  if (checkFreeRunCap(request).blocked) {
    return NextResponse.json(usageCapBody(), { status: 402 })
  }

  const supabase = createServiceClient()

  const { data: run, error: runError } = await supabase
    .from('site_massing_runs')
    .insert({
      parcel_id,
      co_no,
      zoning_snapshot: zoning,
      parcel_boundary: ringToEwkt(boundaryLngLat),
      status: 'complete',
      created_by: body.created_by ?? null,
    })
    .select('id')
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: `Failed to persist run: ${runError?.message ?? 'unknown error'}` }, { status: 500 })
  }

  const optionRows = candidates.map(c => ({
    run_id: run.id,
    option_rank: c.rank,
    layout_type: c.layoutType,
    footprints: c.subFootprints
      ? { footprintLngLat: c.footprintLngLat, subFootprints: c.subFootprints }
      : { footprintLngLat: c.footprintLngLat },
    unit_count: c.unitCount,
    gross_floor_area_sqft: c.grossFloorAreaSqft,
    lot_coverage_pct: c.lotCoveragePct,
    setback_compliant: c.setbackCompliant,
    score: c.score,
  }))

  const { data: options, error: optionsError } = await supabase
    .from('site_massing_options')
    .insert(optionRows)
    .select('id, option_rank')

  if (optionsError) {
    // Run row is already written; report partial success rather than hiding it.
    const partial = NextResponse.json(
      { run_id: run.id, options: [], error: `Run persisted but options failed: ${optionsError.message}` },
      { status: 207 },
    )
    recordFreeRun(request, partial)
    return partial
  }

  const success = NextResponse.json({ run_id: run.id, options: options ?? [] })
  recordFreeRun(request, success)
  return success
}
