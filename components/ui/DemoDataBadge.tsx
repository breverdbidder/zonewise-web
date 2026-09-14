'use client'

import { useState } from 'react'

interface DemoDataBadgeProps {
  label?: string
  tooltip?: string
}

export default function DemoDataBadge({
  label = 'Sample Data',
  tooltip,
}: DemoDataBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <span className="relative inline-flex items-center gap-1 ml-2">
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider"
        style={{
          background: '#1A90FF1A',
          borderColor: '#1A90FF4D',
          color: '#1A90FF',
          fontFamily: 'monospace',
        }}
      >
        {label}
        {tooltip && (
          <button
            type="button"
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border text-[9px] font-bold leading-none cursor-pointer"
            style={{
              background: '#1A90FF33',
              borderColor: '#1A90FF66',
              color: '#1A90FF',
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            aria-label="Sample data explanation"
          >
            i
          </button>
        )}
      </span>
      {tooltip && showTooltip && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-48 rounded-lg px-3 py-2 text-[11px] leading-relaxed shadow-lg pointer-events-none"
          style={{
            background: '#1B2737',
            color: '#fff',
            border: '1px solid #1A90FF33',
          }}
        >
          {tooltip}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #1B2737',
            }}
          />
        </span>
      )}
    </span>
  )
}
