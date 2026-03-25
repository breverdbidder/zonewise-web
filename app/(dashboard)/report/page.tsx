export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import ZoningReport, { type ZoningReportData } from '@/components/reports/ZoningReport'
import ErrorBoundary from '@/components/ErrorBoundary'
import ZoningDisclaimer from '@/components/ZoningDisclaimer'

interface ReportPageProps {
  searchParams: Promise<{ parcel?: string; print?: string }>
}

export async function generateMetadata({ searchParams }: ReportPageProps): Promise<Metadata> {
  const { parcel } = await searchParams
  if (!parcel) return { title: 'Property Zoning Report — ZoneWise.AI' }
  return {
    title: `Zoning Report: ${decodeURIComponent(parcel)} — ZoneWise.AI`,
    description: `Full property zoning report for parcel ${decodeURIComponent(parcel)} in Brevard County, FL`,
    robots: 'noindex',
  }
}

async function fetchReportData(parcelId: string, origin: string): Promise<ZoningReportData | null> {
  try {
    const url = `${origin}/api/zoning-report?parcelId=${encodeURIComponent(parcelId)}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const { parcel, print } = await searchParams

  if (!parcel) {
    notFound()
  }

  const parcelId = decodeURIComponent(parcel)

  // For server-side rendering, construct absolute URL using a known base
  // Vercel provides VERCEL_URL; fall back to production URL
  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL ?? 'https://zonewise.ai'

  const data = await fetchReportData(parcelId, baseUrl)

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-8 gap-6">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Report Unavailable
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Could not generate a zoning report for parcel{' '}
            <span className="font-mono text-xs bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {parcelId}
            </span>
            . The parcel may not exist in BCPAO records.
          </p>
        </div>
        <Link
          href="/chat"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#1E3A5F]/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to ZoneWise Chat
        </Link>
      </div>
    )
  }

  const isPrint = print === '1'

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-950 ${isPrint ? 'print-mode' : ''}`}>
      {/* Nav bar (hidden in print) */}
      {!isPrint && (
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between print:hidden">
          <Link
            href="/chat"
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#1E3A5F] flex items-center justify-center">
              <span className="text-white text-xs font-bold">Z</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">ZoneWise.AI</span>
          </div>
        </div>
      )}

      {/* Report content */}
      <ErrorBoundary>
        <ZoningReport data={data} />
      </ErrorBoundary>

      {/* Accuracy disclaimer — hidden when accuracy >= 99% */}
      {!isPrint && <ZoningDisclaimer />}
    </div>
  )
}
