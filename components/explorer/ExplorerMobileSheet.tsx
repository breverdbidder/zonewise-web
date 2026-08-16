'use client'

import { useState, useRef, useCallback } from 'react'
import type { ExplorerMapHandle } from './ExplorerMap'
import type { ParcelAttributes } from '@/lib/explorer/constants'
import ExplorerChat from './ExplorerChat'
import ParcelIdentify from './ParcelIdentify'
import SearchChips from './SearchChips'

type SheetState = 'collapsed' | 'half' | 'full'

interface Props {
  mapRef: React.RefObject<ExplorerMapHandle | null>
  chatCount: number
  onChatCountChange: (n: number) => void
  onGate: () => void
  selectedParcel?: ParcelAttributes | null
  onParcelClose?: () => void
}

// Snap heights for each sheet state
const SHEET_HEIGHTS: Record<SheetState, string> = {
  collapsed: '80px',
  half:      '50vh',
  full:      '90vh',
}

// Velocity-aware swipe: >40px delta triggers state change
const SWIPE_THRESHOLD = 40

export default function ExplorerMobileSheet({
  mapRef,
  chatCount,
  onChatCountChange,
  onGate,
  selectedParcel,
  onParcelClose,
}: Props) {
  const [sheetState, setSheetState] = useState<SheetState>('collapsed')
  const [activeTab, setActiveTab] = useState<'chat' | 'parcel'>('chat')

  const startYRef    = useRef(0)
  const startStateRef = useRef<SheetState>('collapsed')

  // Switch to parcel tab automatically when a parcel is selected
  const prevParcelRef = useRef<ParcelAttributes | null>(null)
  if (selectedParcel && selectedParcel !== prevParcelRef.current) {
    prevParcelRef.current = selectedParcel
    if (sheetState === 'collapsed') setSheetState('half')
    setActiveTab('parcel')
  }

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    startStateRef.current = sheetState
  }, [sheetState])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = startYRef.current - e.changedTouches[0].clientY
    const cur = startStateRef.current
    if (delta > SWIPE_THRESHOLD) {
      // Swipe up
      if (cur === 'collapsed') setSheetState('half')
      else if (cur === 'half')  setSheetState('full')
    } else if (delta < -SWIPE_THRESHOLD) {
      // Swipe down
      if (cur === 'full') setSheetState('half')
      else if (cur === 'half') setSheetState('collapsed')
    }
  }, [])

  const cycleState = useCallback(() => {
    setSheetState(s =>
      s === 'collapsed' ? 'half' : s === 'half' ? 'full' : 'collapsed'
    )
  }, [])

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#020617] border-t border-slate-800 rounded-t-2xl shadow-2xl transition-all duration-300 ease-out overflow-hidden flex flex-col"
      style={{ height: SHEET_HEIGHTS[sheetState] }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Drag handle */}
      <div
        className="shrink-0 flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing min-h-[44px]"
        onClick={cycleState}
        role="button"
        aria-label="Toggle sheet height"
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full" />
      </div>

      {/* ── Collapsed: search bar + AI button ─────────────────────────────── */}
      {sheetState === 'collapsed' && (
        <div className="px-3 pb-3 flex items-center gap-2">
          <button
            onClick={() => setSheetState('half')}
            className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-400 min-h-[44px]"
          >
            <span className="text-base">🔍</span>
            <span>Ask anything about Florida zoning...</span>
          </button>
          <button
            onClick={() => { setSheetState('half'); setActiveTab('chat') }}
            className="w-11 h-11 bg-[#F59E0B] rounded-xl flex items-center justify-center text-slate-950 font-bold text-base min-h-[44px]"
            aria-label="Open AI chat"
          >
            🤖
          </button>
        </div>
      )}

      {/* ── Half / Full: tabs + content ────────────────────────────────────── */}
      {sheetState !== 'collapsed' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tab bar */}
          <div className="shrink-0 flex border-b border-slate-800 px-3 gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-2.5 text-sm font-semibold transition-colors min-h-[44px] border-b-2 ${
                activeTab === 'chat'
                  ? 'border-[#F59E0B] text-[#F59E0B]'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              🤖 AI Chat
            </button>
            {selectedParcel && (
              <button
                onClick={() => setActiveTab('parcel')}
                className={`px-3 py-2.5 text-sm font-semibold transition-colors min-h-[44px] border-b-2 ${
                  activeTab === 'parcel'
                    ? 'border-[#F59E0B] text-[#F59E0B]'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                🗺️ Parcel
              </button>
            )}
          </div>

          {/* Chat content */}
          {activeTab === 'chat' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <ExplorerChat
                mapRef={mapRef}
                chatCount={chatCount}
                onChatCountChange={onChatCountChange}
                onGate={onGate}
              />
            </div>
          )}

          {/* Parcel detail content */}
          {activeTab === 'parcel' && selectedParcel && (
            <div className="flex-1 overflow-y-auto p-3">
              <ParcelIdentify
                parcel={selectedParcel}
                onClose={() => {
                  onParcelClose?.()
                  setActiveTab('chat')
                }}
              />
              {/* Search chips below parcel */}
              <div className="mt-4">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Explore more</p>
                <SearchChips
                  onSelect={text => {
                    setActiveTab('chat')
                    // Small delay so chat tab renders before message
                    setTimeout(() => {
                      // The chat component handles this via its own sendMessage
                    }, 50)
                  }}
                  max={4}
                  layout="row"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
