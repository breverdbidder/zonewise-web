import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found — ZoneWise.AI',
  description: 'The page you were looking for could not be found.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020617',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#e2e8f0',
      }}
    >
      {/* Logo / Brand */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#F59E0B',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}
        >
          ZoneWise.AI
        </div>
      </div>

      {/* 404 Number */}
      <div
        style={{
          fontSize: '8rem',
          fontWeight: 900,
          lineHeight: 1,
          color: '#1E3A5F',
          marginBottom: '1.5rem',
          letterSpacing: '-0.04em',
        }}
        aria-hidden="true"
      >
        404
      </div>

      {/* Heading */}
      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#f1f5f9',
          marginBottom: '0.75rem',
          textAlign: 'center',
        }}
      >
        Page not found
      </h1>

      {/* Description */}
      <p
        style={{
          fontSize: '1rem',
          color: '#94a3b8',
          maxWidth: '400px',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: '2.5rem',
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Head back to the dashboard to continue your foreclosure research.
      </p>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.75rem 1.75rem',
            background: '#F59E0B',
            color: '#020617',
            fontWeight: 700,
            fontSize: '0.95rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
          }}
        >
          Go Home
        </Link>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.75rem 1.75rem',
            background: '#1E3A5F',
            color: '#f1f5f9',
            fontWeight: 600,
            fontSize: '0.95rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            border: '1px solid #2a4f7a',
          }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  )
}
