'use client'

import Link from 'next/link'

export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="w-full max-w-md rounded-xl border border-[#1E3A5F] bg-slate-900/80 p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1E3A5F]">
          <svg className="h-7 w-7 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-white">Report failed to load</h2>
        <p className="mb-6 text-sm text-slate-400">
          {error.message || 'An unexpected error occurred while loading this zoning report.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-[#F59E0B] px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-[#F59E0B]/90"
          >
            Try Again
          </button>
          <Link
            href="/explorer"
            className="rounded-lg border border-[#1E3A5F] px-5 py-2 text-sm font-semibold text-slate-300 transition hover:border-[#F59E0B]/50 hover:text-white"
          >
            Back to Explorer
          </Link>
        </div>
      </div>
    </div>
  )
}
