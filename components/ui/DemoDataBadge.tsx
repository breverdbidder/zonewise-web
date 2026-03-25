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
          background: '#F59E0B1A',
          borderColor: '#F59E0B4D',
          color: '#F59E0B',
          fontFamily: 'monospace',
        }}
      >
        {label}
        {tooltip && (
          <button
            type="button"
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border text-[9px] font-bold leading-none cursor-pointer"
            style={{
              background: '#F59E0B33',
              borderColor: '#F59E0B66',
              color: '#F59E0B',
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
            background: '#1E3A5F',
            color: '#fff',
            border: '1px solid #F59E0B33',
          }}
        >
          {tooltip}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #1E3A5F',
            }}
          />
        </span>
      )}
    </span>
  )
}
