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
      <div className="w-full max-w-md rounded-xl border border-[rgb(var(--zw-border2))] bg-[rgb(var(--zw-page)/0.8)] p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--zw-elev))]">
          <svg className="h-7 w-7 text-[rgb(var(--zw-brand))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[rgb(var(--zw-ink))]">Report failed to load</h2>
        <p className="mb-6 text-sm text-[rgb(var(--zw-ink2))]">
          {error.message || 'An unexpected error occurred while loading this zoning report.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-[rgb(var(--zw-brand))] px-5 py-2 text-sm font-semibold text-[rgb(var(--zw-ink))] transition hover:bg-[rgb(var(--zw-brand)/0.9)]"
          >
            Try Again
          </button>
          <Link
            href="/explorer"
            className="rounded-lg border border-[rgb(var(--zw-border2))] px-5 py-2 text-sm font-semibold text-[rgb(var(--zw-ink2))] transition hover:border-[rgb(var(--zw-brand)/0.5)] hover:text-[rgb(var(--zw-ink))]"
          >
            Back to Explorer
          </Link>
        </div>
      </div>
    </div>
  )
}
