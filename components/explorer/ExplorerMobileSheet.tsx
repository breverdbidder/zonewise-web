'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { ExplorerMapHandle } from './ExplorerMap'
import ExplorerChat from './ExplorerChat'
import { EXPLORER_CHIPS } from '@/lib/explorer/constants'

type SheetState = 'collapsed' | 'half' | 'full'

interface Props {
  mapRef: React.RefObject<ExplorerMapHandle | null>
  chatCount: number
  onChatCountChange: (n: number) => void
  onGate: () => void
}

const SHEET_HEIGHTS: Record<SheetState, string> = {
  collapsed: '80px',
  half:      '50vh',
  full:      '85vh',
}

export default function ExplorerMobileSheet({ mapRef, chatCount, onChatCountChange, onGate }: Props) {
  const [state, setState] = useState<SheetState>('collapsed')
  const startYRef = useRef(0)
  const startStateRef = useRef<SheetState>('collapsed')
  const sheetRef = useRef<HTMLDivElement>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    startStateRef.current = state
  }, [state])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = startYRef.current - e.changedTouches[0].clientY
    const cur = startStateRef.current
    if (delta > 50) {
      // swipe up
      if (cur === 'collapsed') setState('half')
      else if (cur === 'half') setState('full')
    } else if (delta < -50) {
      // swipe down
      if (cur === 'full') setState('half')
      else if (cur === 'half') setState('collapsed')
    }
  }, [])

  return (
    <div
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950 border-t border-slate-800 rounded-t-2xl shadow-2xl transition-all duration-300 ease-out overflow-hidden flex flex-col"
      style={{ height: SHEET_HEIGHTS[state] }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Drag handle */}
      <div
        className="shrink-0 flex items-center justify-center pt-3 pb-2 cursor-grab"
        onClick={() => setState(s => s === 'collapsed' ? 'half' : s === 'half' ? 'full' : 'collapsed')}
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full" />
      </div>

      {/* Collapsed: search bar + chips */}
      {state === 'collapsed' && (
        <div className="px-3 pb-3 flex items-center gap-2">
          <button
            onClick={() => setState('half')}
            className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-500"
          >
            <span className="text-base">🔍</span>
            <span>Ask anything about Brevard...</span>
          </button>
          <button
            onClick={() => setState('half')}
            className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-bold text-base"
          >
            🤖
          </button>
        </div>
      )}

      {/* Half / Full: show chat */}
      {state !== 'collapsed' && (
        <div className="flex-1 overflow-hidden">
          <ExplorerChat
            mapRef={mapRef}
            chatCount={chatCount}
            onChatCountChange={onChatCountChange}
            onGate={onGate}
          />
        </div>
      )}
    </div>
  )
}
