// Generates and streams the CAD/DXF export for a selected massing candidate.
// Parallel export path alongside the existing client-side PNG snapshot
// (handleSnapshot in MassingEngine.tsx) — does not touch that code path.
//
// If runId + optionId are supplied (the run was persisted via /api/massing/run
// first), the generated DXF is also uploaded to the private `site-dxf`
// Storage bucket and the option row's dxf_path is updated — same bucket/path
// convention (`site-dxf/<run_id>/<option_id>.dxf`) as the decommissioned
// Worker's site-massing-persistence.js, reused per the #19149 SSOT
// consolidation. Persistence is best-effort: a failure there is logged and
// returned in the response, but the DXF still streams to the caller — a
// storage hiccup should not block the user's download.
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exportSiteMassingDXF, saveSiteMassingDxfToStorage, SiteDxfUnsupportedCountyError } = require('@/lib/development-analysis/site-dxf.js')

interface SubFootprint { kind: 'building' | 'access_drive'; label?: string; ringLngLat: [number, number][] }

interface SingleFamilyCandidate {
  envelopeLngLat: [number, number][]
  footprintLngLat: [number, number][]
  env: { bw: number; bd: number; actualGFA: number; floors: number }
  covPct: number
  fitScale: number
}

interface MultiUnitCandidateBody {
  envelopeLngLat: [number, number][]
  footprintLngLat: [number, number][]
  subFootprints: SubFootprint[]
  layoutType: string
  unitCount: number
  grossFloorAreaSqft: number
  lotCoveragePct: number
  fitScale: number
}

interface DxfRequestBody {
  parcel: { parcel_id: string; address?: string; county: string; boundaryLngLat: [number, number][] }
  zoning: { zone_code: string; district_name?: string }
  candidate: SingleFamilyCandidate | MultiUnitCandidateBody
  runId?: string
  optionId?: string
}

export async function POST(request: NextRequest) {
  let body: DxfRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { parcel, zoning, candidate, runId, optionId } = body
  if (!parcel?.county || !parcel?.boundaryLngLat || !zoning?.zone_code || !candidate?.footprintLngLat) {
    return NextResponse.json({ error: 'parcel.county, parcel.boundaryLngLat, zoning.zone_code, and candidate are required' }, { status: 400 })
  }

  let buf: Buffer
  try {
    buf = exportSiteMassingDXF(parcel, zoning, candidate)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'DXF export failed'
    const status = e instanceof SiteDxfUnsupportedCountyError ? 422 : 500
    return NextResponse.json({ error: message }, { status })
  }

  let persistError: string | null = null
  if (runId && optionId) {
    try {
      const dxfPath: string = await saveSiteMassingDxfToStorage({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        runId, optionId,
        dxfBuffer: buf,
      })
      const supabase = createServiceClient()
      const { error: patchError } = await supabase
        .from('site_massing_options')
        .update({ dxf_path: dxfPath })
        .eq('id', optionId)
        .eq('run_id', runId)
      if (patchError) persistError = `DXF uploaded but dxf_path update failed: ${patchError.message}`
    } catch (e) {
      persistError = e instanceof Error ? e.message : 'DXF storage persistence failed'
    }
  }

  const addrSlug = (parcel.address || parcel.parcel_id).replace(/[^a-z0-9]/gi, '_').substring(0, 40)
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/dxf',
      'Content-Disposition': `attachment; filename="ZoneWise_Massing_${addrSlug}.dxf"`,
      'Content-Length': String(buf.length),
      ...(persistError ? { 'X-Dxf-Persist-Error': persistError.replace(/[\r\n]/g, ' ').slice(0, 200) } : {}),
    },
  })
}
