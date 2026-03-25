import { NextRequest, NextResponse } from 'next/server'
import { buildBcpaoPhotoUrl } from '@/lib/bcpao'
import { parcelIdSchema, SECURITY_HEADERS } from '@/lib/validation'

const BCPAO_GIS_URL =
  'https://gis.brevardfl.gov/gissrv/rest/services/Base_Map/Parcel_New_WKID2881/MapServer/5/query'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const rawParcelId = searchParams.get('parcelId')?.trim()

  const parsed = parcelIdSchema.safeParse(rawParcelId)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parcelId' },
      { status: 400, headers: SECURITY_HEADERS }
    )
  }
  const parcelId = parsed.data

  // Determine query predicate: TaxAcct (pure digits) vs DOR PARCEL_ID
  const isTaxAcct = /^\d+$/.test(parcelId)
  const sanitized = parcelId.replace(/[^0-9A-Za-z \-*.]/g, '')
  const where = isTaxAcct ? `TaxAcct=${sanitized}` : `PARCEL_ID='${sanitized}'`

  const params = new URLSearchParams({
    where,
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
    resultRecordCount: '1',
  })

  try {
    const gisRes = await fetch(`${BCPAO_GIS_URL}?${params}`, {
      headers: { 'User-Agent': 'BidDeed.AI/2.0' },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3600 },
    })

    if (!gisRes.ok) {
      return NextResponse.json({ error: 'BCPAO GIS request failed' }, { status: 502, headers: SECURITY_HEADERS })
    }

    const gisData = await gisRes.json()
    const features = gisData?.features

    if (!Array.isArray(features) || features.length === 0) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404, headers: SECURITY_HEADERS })
    }

    const attrs: Record<string, unknown> = features[0]?.attributes ?? {}

    // Resolve photo URL
    const taxAcct = attrs.TaxAcct != null ? String(attrs.TaxAcct) : null
    const photoUrl = taxAcct && taxAcct.length >= 4 ? buildBcpaoPhotoUrl(taxAcct) : null

    const proxyPhotoUrl = photoUrl ? `/api/bcpao-photo?url=${encodeURIComponent(photoUrl)}` : null

    return NextResponse.json({ ...attrs, photoUrl, proxyPhotoUrl }, { headers: SECURITY_HEADERS })
  } catch (err) {
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.message.includes('timeout'))
    if (isTimeout) {
      return NextResponse.json({ error: 'GIS service timed out' }, { status: 503 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500, headers: SECURITY_HEADERS })
  }
}
