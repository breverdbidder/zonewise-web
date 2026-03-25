export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { parcelIdSchema, SECURITY_HEADERS } from '@/lib/validation'

/**
 * GET /api/zoning-report/pdf?parcelId=XXXXX
 *
 * Generates a PDF by fetching the zoning report JSON, then using the
 * browser's print-to-PDF capability via a redirect to the print-ready
 * report page. For server-side generation, this route returns a 302
 * to the printable HTML report which clients can print-to-PDF.
 *
 * For full puppeteer-based PDF generation, deploy with a Node.js runtime
 * and add `puppeteer` to dependencies. The current implementation uses
 * a print-redirect approach that works on Vercel Edge/serverless.
 */
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

  try {
    // Redirect to the printable report page with ?print=1
    // The ZoningReport component handles @media print CSS for clean output
    const baseUrl = req.nextUrl.origin
    const reportUrl = `${baseUrl}/report?parcel=${encodeURIComponent(parcelId)}&print=1`

    return NextResponse.redirect(reportUrl, {
      headers: {
        ...SECURITY_HEADERS,
        'X-ZoneWise-Parcel': parcelId,
      },
    })
  } catch (err) {
    console.error('[zoning-report/pdf] error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500, headers: SECURITY_HEADERS })
  }
}
