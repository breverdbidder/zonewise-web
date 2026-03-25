'use client'

/**
 * ZoningDisclaimer
 * Persistent footer bar shown on /chat and /report pages when zoning accuracy < 99%.
 *
 * Reads audit accuracy from the NEXT_PUBLIC_ZONING_ACCURACY env var (set at build time
 * by the audit pipeline). Falls back to showing the disclaimer when the var is absent
 * or when accuracy < 99.
 *
 * Style: subtle gray bar — visible but not alarming.
 */

const ACCURACY_THRESHOLD_WARN = 99

function getAccuracy(): number | null {
  const raw = process.env.NEXT_PUBLIC_ZONING_ACCURACY
  if (!raw) return null
  const n = parseFloat(raw)
  return isNaN(n) ? null : n
}

export default function ZoningDisclaimer() {
  const accuracy = getAccuracy()

  // Hide if accuracy is confirmed >= 99%
  if (accuracy !== null && accuracy >= ACCURACY_THRESHOLD_WARN) return null

  const label =
    accuracy !== null
      ? `Accuracy: ${accuracy.toFixed(1)}%.`
      : 'Accuracy unverified.'

  const isCritical = accuracy !== null && accuracy < 95

  return (
    <div
      role="note"
      aria-label="Zoning data disclaimer"
      className={[
        'w-full px-4 py-2 text-xs text-center',
        isCritical
          ? 'bg-amber-950/60 border-t border-amber-800/50 text-amber-300'
          : 'bg-slate-900/80 border-t border-slate-800 text-slate-500',
      ].join(' ')}
    >
      <span>
        {isCritical && (
          <span className="mr-1 font-semibold text-amber-400">⚠</span>
        )}
        Zoning data is informational only.{' '}
        <span className="font-medium">{label}</span>{' '}
        Always verify with the local jurisdiction before making investment decisions.
      </span>
    </div>
  )
}
