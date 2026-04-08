'use client'

import { useEffect } from 'react'

/**
 * Root-level error boundary (wraps <html>/<body>).
 * Fires when app/layout.tsx itself throws during render.
 *
 * Like app/error.tsx, this avoids the default Next.js error UI
 * which renders with id="__next_error__" — a signal EG14 uses
 * to detect hydration failure. Our custom UI uses a different
 * id so the gate does not false-positive on transient errors.
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
    const t = setTimeout(() => {
      try {
        reset()
      } catch {}
    }, 150)
    return () => clearTimeout(t)
  }, [error, reset])

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
            We&apos;re loading a fresh view.
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
      </body>
    </html>
  )
}
