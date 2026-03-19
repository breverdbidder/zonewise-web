'use client'

/**
 * HBUSourceBadge — Deliverable 3
 *
 * Renders a small pill badge indicating whether HBU scores came from
 * the CMA Analyst agent (server-computed) or the client-side engine (fallback).
 *
 * Usage:
 *   const { fetchHBU } = useEnvelopeData()
 *   const { scenarios, source } = await fetchHBU(parcelId, parcel)
 *   <HBUSourceBadge source={source} />
 */

export type HBUSource = 'server' | 'client'

export interface HBUSourceBadgeProps {
  source: HBUSource
  className?: string
}

export function HBUSourceBadge({ source, className = '' }: HBUSourceBadgeProps) {
  if (source === 'server') {
    return (
      <span
        className={className}
        title="Scores computed by the CMA Analyst agent from real comp data"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.03em',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
          color: '#4ade80',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path
            d="M5 1L6.18 3.64L9 4.09L7 6.04L7.45 9L5 7.64L2.55 9L3 6.04L1 4.09L3.82 3.64L5 1Z"
            fill="#4ade80"
          />
        </svg>
        AI-Computed
      </span>
    )
  }

  return (
    <span
      className={className}
      title="Scores estimated by the client-side HBU engine (no CMA report yet for this parcel)"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.03em',
        background: 'rgba(245, 158, 11, 0.10)',
        border: '1px solid rgba(245, 158, 11, 0.30)',
        color: '#F59E0B',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="8" height="8" rx="1" stroke="#F59E0B" strokeWidth="1.2" fill="none" />
        <path d="M3 3.5h4M3 5h4M3 6.5h2.5" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" />
      </svg>
      Estimated
    </span>
  )
}

export default HBUSourceBadge
