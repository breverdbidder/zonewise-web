'use client'

import { useState } from 'react'

interface BetaOverlayProps {
  message?: string
  children: React.ReactNode
}

export default function BetaOverlay({
  message = 'Coming Soon — Using Sample Data',
  children,
}: BetaOverlayProps) {
  const [dismissed, setDismissed] = useState(false)

  return (
    <div className="relative">
      {children}
      {!dismissed && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-20 rounded-lg"
          style={{ background: 'rgba(2, 6, 23, 0.72)', backdropFilter: 'blur(2px)' }}
        >
          <div
            className="rounded-xl px-6 py-5 flex flex-col items-center gap-3 max-w-xs text-center shadow-xl"
            style={{ background: 'rgb(var(--zw-elev))', border: '1px solid rgb(var(--zw-brand)/0.301961)' }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgb(var(--zw-brand)/0.101961)', color: 'rgb(var(--zw-brand))', border: '1px solid rgb(var(--zw-brand)/0.301961)' }}
            >
              Beta
            </span>
            <p className="text-[13px] font-semibold text-[rgb(var(--zw-ink))] leading-snug m-0">{message}</p>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-[11px] font-medium px-4 py-1.5 rounded-full transition-colors cursor-pointer border-none"
              style={{ background: 'rgb(var(--zw-brand))', color: 'rgb(var(--zw-brand-ink)))' }}
            >
              Show data anyway
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
