'use client'

import { useEffect } from 'react'

/**
 * Root-level error boundary (wraps <html>/<body>).
 * No auto-reset. User-initiated only. See app/error.tsx for rationale.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as Record<string, unknown>).__zw_last_global_error = {
        message: error?.message,
        digest: error?.digest,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
        at: new Date().toISOString(),
      }
    }
  }, [error])

  return (
    <html lang="en">
      <body
        data-zw-error-boundary="global"
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgb(var(--zw-page))',
          color: 'rgb(var(--zw-ink))',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem',
        }}
      >
        <main style={{ textAlign: 'center', maxWidth: '28rem' }} role="main">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem', color: 'rgb(var(--zw-brand))' }}>
            ZoneWise.AI
          </h1>
          <p style={{ color: 'rgb(var(--zw-ink2))', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Something didn&apos;t load correctly. Refresh to try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: 'rgb(var(--zw-elev))',
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
      </body>
    </html>
  )
}
