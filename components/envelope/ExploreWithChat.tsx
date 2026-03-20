'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import ChatWidget from '@/components/ChatWidget'

const DevIntelTab = dynamic(
  () => import('./DevIntelTab').then(m => ({ default: m.DevIntelTab })),
  { ssr: false }
)

// Extract Brevard parcel ID from assistant message text
function extractParcelId(text: string): string | null {
  const match = text.match(/\b(\d{2}-\d{2}-\d{2}-\d{2}-\d{5}\.\d)\b/)
  return match ? match[1] : null
}

interface ExploreWithChatProps {
  className?: string
}

export function ExploreWithChat({ className = '' }: ExploreWithChatProps) {
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)

  const handleAssistantMessage = useCallback((content: string) => {
    const parcelId = extractParcelId(content)
    if (parcelId) setSelectedParcelId(parcelId)
  }, [])

  return (
    <div className={`flex h-full w-full overflow-hidden ${className}`}>
      {/* Desktop: 40/60 split — chat left, DevIntel right */}
      <div className="hidden lg:flex w-[40%] min-w-[360px] max-w-[480px] flex-col border-r border-slate-800 overflow-hidden">
        <ChatWidget onAssistantMessage={handleAssistantMessage} />
      </div>

      {/* DevIntelTab — always visible */}
      <div className="flex-1 overflow-hidden">
        <DevIntelTab
          externalSelectedParcel={selectedParcelId}
          onParcelSelect={(p) => setSelectedParcelId(p?.id ?? null)}
        />
      </div>

      {/* Mobile: floating chat button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowChat(v => !v)}
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg transition-all"
          style={{ background: '#1E3A5F', color: '#F59E0B' }}
          aria-label={showChat ? 'Close chat' : 'Open chat'}
        >
          {showChat ? '✕' : '💬'}
        </button>
      </div>

      {/* Mobile: chat overlay */}
      {showChat && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col bg-slate-950">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-sm font-medium text-slate-200">ZoneWise AI</span>
            <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatWidget onAssistantMessage={(content) => {
              handleAssistantMessage(content)
              setShowChat(false)
            }} />
          </div>
        </div>
      )}
    </div>
  )
}
