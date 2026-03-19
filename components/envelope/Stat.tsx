'use client'

export interface StatProps {
  label: string
  value: string | number
  unit?: string
}

export function Stat({ label, value, unit = '' }: StatProps) {
  return (
    <div className="bg-gray-800/60 rounded-lg px-2 py-1.5 text-center min-w-0">
      <div className="text-[9px] text-gray-400 truncate">{label}</div>
      <div className="text-xs sm:text-sm font-bold text-white">
        {value}
        {unit && <span className="text-[9px] text-gray-400 ml-0.5">{unit}</span>}
      </div>
    </div>
  )
}

export default Stat
