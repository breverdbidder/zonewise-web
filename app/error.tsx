'use client'

import { useEffect } from 'react'

/**
 * Page-level error boundary.
 * Does NOT render with id="__next_error__" so EG14 P4 detection
 * (which fingerprints on that ID) sees a real page instead of a fingerprint.
 *
 * IMPORTANT: No auto-reset. Earlier version had setTimeout(reset, 100) which
 * created an infinite error→reset→error loop when the underlying error was
 * persistent, generating 100+ console errors per second (EG14 P8 saw total=112).
 * User-initiated reset only.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as Record<string, unknown>).__zw_last_error = {
        message: error?.message,
        digest: error?.digest,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
        at: new Date().toISOString(),
      }
    }
  }, [error])

  return (
    <div
      data-zw-error-boundary="page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617',
        color: '#e2e8f0',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '2rem',
      }}
    >
      <main style={{ textAlign: 'center', maxWidth: '28rem' }} role="main">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem', color: '#F59E0B' }}>
          ZoneWise.AI
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Something didn&apos;t load correctly. Refresh to try again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: '#1E3A5F',
            color: '#ffffff',
            border: 'none',
            padding: '0.625rem 1.25rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </main>
    </div>
  )
}
