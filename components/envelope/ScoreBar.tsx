'use client'

const GREEN = '#22c55e'
const ORANGE = '#F59E0B'
const RED = '#ef4444'

export interface ScoreBarProps {
  score: number
  label: string
}

export function ScoreBar({ score, label }: ScoreBarProps) {
  const color = score >= 85 ? GREEN : score >= 70 ? ORANGE : RED
  return (
    <div
      className="flex items-center gap-2"
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label} score: ${score}`}
    >
      <span className="text-[10px] text-gray-400 w-14 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold w-7 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  )
}

export default ScoreBar
