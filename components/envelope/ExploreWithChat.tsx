'use client'

/**
 * ExploreWithChat — Split-screen layout for Development Intelligence
 *
 * Desktop (>1024px): 40/60 split — AI Chatbot left | DevIntelTab right
 * Mobile: full-screen DevIntelTab with floating chat button
 *
 * Chat intents wired to right panel:
 *   "show envelope for {address}" → load parcel detail view
 *   "compare {X} and {Y}"         → activate comparison mode
 *   "what if height was {N}"      → adjust height slider
 *   "what's the HBU for {addr}"   → load parcel, HBU tab focus
 */

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { DevIntelTab } from '@/components/envelope/DevIntelTab'

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false })

// ── Intent types ──────────────────────────────────────────────
type ChatIntent =
  | { type: 'parcel'; address: string }
  | { type: 'compare' }
  | { type: 'height'; value: number }
  | null

// ── Parse intent from free-text user message ──────────────────
function extractIntent(msg: string): ChatIntent {
  const lower = msg.toLowerCase().trim()

  // "what if height was N" / "set height to N ft" / "height 80ft"
  const heightMatch = lower.match(
    /(?:what\s+if\s+)?(?:the\s+)?height\s+(?:was|is|to|=)?\s*(\d+)\s*(?:ft|feet|')?/i
  ) || lower.match(/(?:set\s+)?height\s+(?:to\s+)?(\d+)/i)
  if (heightMatch) return { type: 'height', value: Math.min(300, Math.max(10, parseInt(heightMatch[1]))) }

  // "compare X and Y" / "compare these" / "comparison mode"
  if (lower.includes('compare') || lower.includes('comparison')) {
    return { type: 'compare' }
  }

  // "show envelope for {addr}" / "what can I build at {addr}" / "HBU for {addr}"
  const parcelPatterns = [
    /show\s+(?:me\s+)?(?:the\s+)?(?:envelope\s+for|parcel|envelope)\s+(.+)/i,
    /what\s+can\s+(?:i|we)\s+build\s+(?:at|on)\s+(.+)/i,
    /(?:analyze|analysis|check)\s+(?:the\s+)?(?:property\s+(?:at\s+)?)?(.+)/i,
    /(?:hbu|highest\s+and\s+best\s+use)\s+(?:for|of|at)\s+(.+)/i,
    /load\s+(?:parcel|envelope|property)\s+(?:for|at)?\s+(.+)/i,
  ]
  for (const pattern of parcelPatterns) {
    const m = lower.match(pattern)
    if (m?.[1]) return { type: 'parcel', address: m[1].trim().replace(/[?!.,]+$/, '') }
  }

  return null
}

// ── Main component ────────────────────────────────────────────
export interface ExploreWithChatProps {
  initialParcelId?: string
}

export function ExploreWithChat({ initialParcelId }: ExploreWithChatProps) {
  // Shared chat→panel state
  const [chatAddress, setChatAddress] = useState<string | null>(null)
  const [chatCompareActivate, setChatCompareActivate] = useState(false)
  const [chatHeightOverride, setChatHeightOverride] = useState<number | null>(null)

  // Mobile chat panel visibility
  const [mobileChatOpen, setMobileChatOpen] = useState(false)

  // Track compare activation — toggle on/off
  const compareToggleRef = useRef(false)

  const handleUserMessage = useCallback((msg: string) => {
    const intent = extractIntent(msg)
    if (!intent) return

    if (intent.type === 'parcel') {
      setChatAddress(intent.address)
      setChatCompareActivate(false)
      // Reset after a tick so the effect fires on re-sends of same address
      setTimeout(() => setChatAddress(null), 100)
    } else if (intent.type === 'compare') {
      compareToggleRef.current = !compareToggleRef.current
      setChatCompareActivate(compareToggleRef.current)
    } else if (intent.type === 'height') {
      setChatHeightOverride(intent.value)
    }
  }, [])

  return (
    <>
      {/* ── DESKTOP: 40/60 split ──────────────────────────────── */}
      <div className="hidden lg:flex h-screen overflow-hidden" style={{ background: '#020617' }}>
        {/* Left: Chat panel (40%) */}
        <div className="w-[40%] min-w-[340px] max-w-[520px] flex flex-col border-r border-slate-800/60 overflow-hidden">
          <ChatWidget
            apiEndpoint="/api/chat"
            onUserMessage={handleUserMessage}
          />
        </div>

        {/* Right: DevIntelTab (60%) */}
        <div className="flex-1 overflow-y-auto">
          <DevIntelTab
            initialParcelId={initialParcelId}
            chatSelectedAddress={chatAddress}
            chatCompareActivate={chatCompareActivate}
            chatHeightOverride={chatHeightOverride}
          />
        </div>
      </div>

      {/* ── MOBILE: full-screen DevIntelTab + floating chat button ── */}
      <div className="lg:hidden relative" style={{ background: '#020617', minHeight: '100svh' }}>
        <DevIntelTab
          initialParcelId={initialParcelId}
          chatSelectedAddress={chatAddress}
          chatCompareActivate={chatCompareActivate}
          chatHeightOverride={chatHeightOverride}
        />

        {/* Floating chat button */}
        {!mobileChatOpen && (
          <button
            onClick={() => setMobileChatOpen(true)}
            aria-label="Open AI chat"
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-4 py-3 shadow-2xl text-sm font-semibold transition-transform hover:scale-105 active:scale-95"
            style={{ background: '#F59E0B', color: '#020617' }}
          >
            <span className="text-lg">Z</span>
            <span>Ask AI</span>
          </button>
        )}

        {/* Mobile chat sheet */}
        {mobileChatOpen && (
          <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#020617' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="font-semibold text-white text-sm">ZoneWise AI</span>
              <button
                onClick={() => setMobileChatOpen(false)}
                className="text-slate-400 hover:text-white text-lg leading-none"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWidget
                apiEndpoint="/api/chat"
                onUserMessage={(msg) => {
                  handleUserMessage(msg)
                  // Close sheet and let DevIntelTab respond
                  setTimeout(() => setMobileChatOpen(false), 300)
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default ExploreWithChat
