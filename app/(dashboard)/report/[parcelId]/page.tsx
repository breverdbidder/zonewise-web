import type { Metadata } from 'next'
import ZoningReport, {
  ZoningReportSkeleton,
  ZoningReportError,
  type ZoningReportData,
} from '@/components/report/ZoningReport'
import OwnerIntelPanel from '@/components/parcel/OwnerIntelPanel'
import { Suspense } from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'

interface Props {
  params: Promise<{ parcelId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { parcelId: raw } = await params
  const parcelId = decodeURIComponent(raw)
  return {
    title: `Zoning Report — ${parcelId} | ZoneWise.AI`,
    description: `Full zoning report for parcel ${parcelId}: development capacity, setbacks, permitted uses, AI analysis, and owner intelligence.`,
  }
}

async function fetchReport(parcelId: string): Promise<{ data: ZoningReportData | null; error: string | null }> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const res = await fetch(
      `${baseUrl}/api/zoning-report?parcelId=${encodeURIComponent(parcelId)}`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { data: null, error: body?.error ?? `HTTP ${res.status}` }
    }

    const data = await res.json()
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function ReportContent({ parcelId }: { parcelId: string }) {
  const { data, error } = await fetchReport(parcelId)

  if (error || !data) {
    return <ZoningReportError parcelId={parcelId} message={error ?? 'No data returned'} />
  }

  return <ZoningReport data={data} parcelId={parcelId} />
}

export default async function ReportPage({ params }: Props) {
  const { parcelId: raw } = await params
  const parcelId = decodeURIComponent(raw)

  return (
    <ErrorBoundary>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Suspense fallback={<ZoningReportSkeleton />}>
          <ReportContent parcelId={parcelId} />
        </Suspense>

        <Suspense fallback={
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 animate-pulse">
            <div className="h-4 bg-slate-800 rounded w-40 mb-3" />
            <div className="h-8 bg-slate-800 rounded w-60" />
          </div>
        }>
          <OwnerIntelPanel identifier={parcelId} />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}
