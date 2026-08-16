// Generates and streams the CAD/DXF export for a selected massing candidate.
// New parallel export path alongside the existing client-side PNG snapshot
// (handleSnapshot in MassingEngine.tsx) — does not touch that code path.
import { NextRequest, NextResponse } from 'next/server'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { exportSiteMassingDXF, SiteDxfUnsupportedCountyError } = require('@/lib/development-analysis/site-dxf.js')

interface DxfRequestBody {
  parcel: { parcel_id: string; address?: string; county: string; boundaryLngLat: [number, number][] }
  zoning: { zone_code: string; district_name?: string }
  candidate: {
    envelopeLngLat: [number, number][]
    footprintLngLat: [number, number][]
    env: { bw: number; bd: number; actualGFA: number; floors: number }
    covPct: number
    fitScale: number
  }
}

export async function POST(request: NextRequest) {
  let body: DxfRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { parcel, zoning, candidate } = body
  if (!parcel?.county || !parcel?.boundaryLngLat || !zoning?.zone_code || !candidate?.footprintLngLat) {
    return NextResponse.json({ error: 'parcel.county, parcel.boundaryLngLat, zoning.zone_code, and candidate are required' }, { status: 400 })
  }

  try {
    const buf: Buffer = exportSiteMassingDXF(parcel, zoning, candidate)
    const addrSlug = (parcel.address || parcel.parcel_id).replace(/[^a-z0-9]/gi, '_').substring(0, 40)
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/dxf',
        'Content-Disposition': `attachment; filename="ZoneWise_Massing_${addrSlug}.dxf"`,
        'Content-Length': String(buf.length),
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'DXF export failed'
    const status = e instanceof SiteDxfUnsupportedCountyError ? 422 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
