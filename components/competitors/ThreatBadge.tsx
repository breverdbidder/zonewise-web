// components/competitors/ThreatBadge.tsx
// Battle Cards Sprint S0a — shared threat level badge
// CRITICAL = red, HIGH = orange (house brand), MEDIUM = amber, LOW = slate

import type { ThreatLevel } from '@/types/competitors'

interface Props {
  threat: ThreatLevel
  className?: string
}

const THREAT_STYLES: Record<ThreatLevel, { bg: string; border: string; text: string }> = {
  CRITICAL: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#F87171' },
  HIGH:     { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#F59E0B' },
  MEDIUM:   { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#FBBF24' },
  LOW:      { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', text: '#94A3B8' },
}

export function ThreatBadge({ threat, className = '' }: Props) {
  const style = THREAT_STYLES[threat]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${className}`}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
      }}
      aria-label={`Threat level: ${threat}`}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: style.text }}
      />
      {threat}
    </span>
  )
}
