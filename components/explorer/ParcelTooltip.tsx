'use client'

// ParcelTooltip.tsx — Accessible tooltip for parcel map features
// Renders a floating tooltip with role="tooltip" and proper aria-describedby linkage.

interface Props {
  id: string
  content: string
  visible: boolean
  x?: number
  y?: number
}

export default function ParcelTooltip({ id, content, visible, x = 0, y = 0 }: Props) {
  if (!visible) return null

  return (
    <div
      id={id}
      role="tooltip"
      aria-live="polite"
      className="absolute z-50 pointer-events-none"
      style={{ left: x, top: y, transform: 'translate(-50%, -110%)' }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200 shadow-lg whitespace-nowrap max-w-[240px]">
        {content}
        {/* Arrow */}
        <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-1.5 overflow-hidden">
          <div className="w-2 h-2 bg-slate-900 border-b border-r border-slate-700 rotate-45 -translate-y-1 mx-auto" />
        </div>
      </div>
    </div>
  )
}
