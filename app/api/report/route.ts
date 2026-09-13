export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { SECURITY_HEADERS } from '@/lib/validation'
import { getS5ReportPayload } from '@/lib/s5-report'

export type { S5TemplateRow } from '@/lib/s5-report'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const { status, body } = await getS5ReportPayload({
    mcaId: searchParams.get('mca_id') ?? undefined,
    address: searchParams.get('address') ?? undefined,
  })
  return NextResponse.json(body, { status, headers: SECURITY_HEADERS })
}
