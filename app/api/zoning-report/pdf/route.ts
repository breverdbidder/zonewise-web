export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

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
  const parcelId = searchParams.get('parcelId')?.trim()

  if (!parcelId) {
    return NextResponse.json({ error: 'parcelId is required' }, { status: 400 })
  }

  // Redirect to the printable report page with ?print=1
  // The ZoningReport component handles @media print CSS for clean output
  const baseUrl = req.nextUrl.origin
  const reportUrl = `${baseUrl}/report?parcel=${encodeURIComponent(parcelId)}&print=1`

  return NextResponse.redirect(reportUrl, {
    headers: {
      'X-ZoneWise-Parcel': parcelId,
    },
  })
}
