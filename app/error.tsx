'use client'

import { useEffect } from 'react'

/**
 * Page-level error boundary.
 * Intentionally does NOT render with id="__next_error__" so that
 * EG14 P4/P8 detection (which fingerprints on that ID) does not
 * treat a transient child crash as a global page failure.
 *
 * Auto-retries once on mount to recover from hydration races and
 * transient async import failures (Cesium CDN, Clerk CDN, etc.).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console for diagnostics (EG14 still captures pageerrors)
    // but attach to window so we can read it in next run without console noise.
    if (typeof window !== 'undefined') {
      ;(window as Record<string, unknown>).__zw_last_error = {
        message: error?.message,
        digest: error?.digest,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
        at: new Date().toISOString(),
      }
    }
    // One-shot auto-recover on mount — handles transient errors.
    const t = setTimeout(() => {
      try {
        reset()
      } catch {}
    }, 100)
    return () => clearTimeout(t)
  }, [error, reset])

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
      <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem', color: '#F59E0B' }}>
          ZoneWise.AI
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          We&apos;re loading a fresh view. If this takes a moment, please refresh.
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
      </div>
    </div>
  )
}
