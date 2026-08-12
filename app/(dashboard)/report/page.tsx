export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, FileSearch, Lock } from 'lucide-react'
import ZoningReport, { type ZoningReportData } from '@/components/reports/ZoningReport'
import ErrorBoundary from '@/components/ErrorBoundary'
import ZoningDisclaimer from '@/components/ZoningDisclaimer'
import S5Report from '@/components/report/S5Report'
import type { S5TemplateRow } from '@/app/api/report/route'

interface ReportPageProps {
  searchParams: Promise<{ parcel?: string; mca_id?: string; address?: string; print?: string }>
}

function resolveBaseUrl(): string {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL ?? 'https://zonewise.ai'
}

export async function generateMetadata({ searchParams }: ReportPageProps): Promise<Metadata> {
  const { parcel, mca_id: mcaId } = await searchParams
  if (mcaId) {
    return {
      title: `BidDeed S5 Report: ${mcaId} — ZoneWise.AI`,
      description: 'Full BidDeed S5 18-section property intelligence report.',
      robots: 'noindex',
    }
  }
  if (!parcel) return { title: 'Property Zoning Report — ZoneWise.AI' }
  return {
    title: `Zoning Report: ${decodeURIComponent(parcel)} — ZoneWise.AI`,
    description: `Full property zoning report for parcel ${decodeURIComponent(parcel)} in Brevard County, FL`,
    robots: 'noindex',
  }
}

interface S5ApiResponse {
  selected: boolean
  entitled?: boolean
  mca_id?: string
  template: S5TemplateRow[]
  report: Record<string, unknown> | null
  error?: string
}

async function fetchS5Report(params: { mca_id?: string; address?: string }): Promise<S5ApiResponse | null> {
  try {
    const qs = new URLSearchParams(
      params.mca_id ? { mca_id: params.mca_id } : { address: params.address ?? '' }
    )
    const res = await fetch(`${resolveBaseUrl()}/api/report?${qs.toString()}`, { cache: 'no-store' })
    // 404 (address not found) still carries a body worth showing — read it either way.
    const body = await res.json().catch(() => null)
    return body
  } catch {
    return null
  }
}

function S5Picker() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-8 gap-4 min-h-[60vh]">
      <div className="w-14 h-14 rounded-full bg-[#1E3A5F]/10 dark:bg-[#1E3A5F]/30 flex items-center justify-center">
        <FileSearch className="w-7 h-7 text-[#1E3A5F] dark:text-[#F59E0B]" />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a Property Report</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Open a BidDeed S5 report with <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 rounded">?mca_id=</code>,
          or a ZoneWise zoning report with <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 rounded">?parcel=</code>.
        </p>
      </div>
      <Link href="/chat" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#1E3A5F]/80 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to ZoneWise Chat
      </Link>
    </div>
  )
}

function S5Teaser({ mcaId }: { mcaId?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-8 gap-4 min-h-[60vh]">
      <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
        <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pro Report Locked</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          The full 18-section BidDeed S5 report for <span className="font-mono text-xs">{mcaId}</span> requires a ZoneWise
          Pro subscription.
        </p>
      </div>
      <Link href="/pricing" className="px-4 py-2 rounded-lg bg-[#F59E0B] text-[#020617] text-sm font-semibold hover:bg-[#F59E0B]/80 transition-colors">
        Upgrade to Pro
      </Link>
    </div>
  )
}

function S5Pending({ mcaId, message }: { mcaId?: string; message?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-8 gap-4 min-h-[60vh]">
      <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Report Data Pending</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {message || `Could not generate a report for ${mcaId ?? 'this property'} right now.`}
        </p>
      </div>
    </div>
  )
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
  const { parcel, mca_id: mcaId, address, print } = await searchParams

  // BidDeed S5 report (new) — takes priority when present, never collides
  // with the existing ?parcel= ZoneWise zoning report below.
  if (mcaId || address) {
    const s5 = await fetchS5Report({ mca_id: mcaId, address })
    const isPrint = print === '1'

    let body: ReactNode
    if (!s5) {
      body = <S5Pending mcaId={mcaId} message="Report service unavailable — try again shortly." />
    } else if (s5.entitled === false) {
      body = <S5Teaser mcaId={s5.mca_id ?? mcaId} />
    } else if (!s5.report) {
      body = <S5Pending mcaId={s5.mca_id ?? mcaId} message={s5.error} />
    } else {
      body = <S5Report template={s5.template} report={s5.report} />
    }

    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-slate-950 ${isPrint ? 'print-mode' : ''}`}>
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
              <div className="w-6 h-6 rounded bg-[#020617] flex items-center justify-center">
                <span className="text-[#F59E0B] text-xs font-bold">B</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">BidDeed.AI S5 Report</span>
            </div>
          </div>
        )}
        <div className="py-6 px-4">
          <ErrorBoundary>{body}</ErrorBoundary>
        </div>
      </div>
    )
  }

  if (!parcel) {
    return <S5Picker />
  }

  const parcelId = decodeURIComponent(parcel)

  const data = await fetchReportData(parcelId, resolveBaseUrl())

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
