import type { DataSource } from '@/lib/development-analysis/types'

interface SourceBadgeProps {
  source: DataSource
}

export function SourceBadge({ source }: SourceBadgeProps) {
  if (source === 'server') {
    return (
      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-green-900/40 text-green-300 border border-green-800/30">
        AI-Computed
      </span>
    )
  }
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-gray-800/60 text-gray-400 border border-gray-700/30">
      Estimated
    </span>
  )
}
