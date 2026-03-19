// components/envelope/HBUSourceBadge.tsx
// Indicates whether HBU scores came from the CMA Analyst agent or client-side engine

interface Props {
  source: 'server' | 'client'
  className?: string
}

/**
 * HBUSourceBadge — Shows "AI-Computed" when using server scores from the
 * CMA Analyst agent, or "Estimated" when using the client-side calculateHBU() fallback.
 */
export default function HBUSourceBadge({ source, className = '' }: Props) {
  if (source === 'server') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#1E3A5F] text-[#F59E0B] border border-[#F59E0B]/30 ${className}`}
        title="HBU scores computed by CMA Analyst agent using full market data"
      >
        <span aria-hidden="true">✦</span>
        AI-Computed
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 ${className}`}
      title="HBU scores estimated client-side — parcel not yet processed by CMA agent"
    >
      <span aria-hidden="true">~</span>
      Estimated
    </span>
  )
}
