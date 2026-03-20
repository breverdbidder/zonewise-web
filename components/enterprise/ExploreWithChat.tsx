'use client'

import { useState, useRef, useEffect } from 'react'
import { DevIntelTab } from '@/components/envelope/DevIntelTab'
import type { Parcel } from '@/lib/development-analysis/types'

const NAVY = '#1E3A5F'
const ORANGE = '#F59E0B'
const SLATE = '#020617'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// Extract parcel ID from text (format: XX-XX-XX-XX-XXXXX.X)
function extractParcelId(text: string): string | null {
  const match = text.match(/\b(\d{2}-\d{2}-\d{2}-\d{2}-\d{5}\.\d)\b/)
  return match ? match[1] : null
}

// Extract height intent from message: "what if height was 80ft" → 80
export function extractHeightIntent(text: string): number | null {
  const match = text.match(/height\s+(?:was|is|=|to)?\s*(\d+)\s*(?:ft|feet)?/i)
  return match ? parseInt(match[1]) : null
}

// Parse compare intent: "compare X and Y" → [X, Y]
export function extractCompareIntent(text: string): boolean {
  return /compare\s+.+\s+and\s+/i.test(text)
}

const EXAMPLE_PROMPTS = [
  "Show envelope for 625 Ocean St",
  "What's the HBU for commercial zones?",
  "Compare 625 Ocean and 1200 S Patrick",
  "What if height was 80ft?",
]

interface ExploreWithChatProps {
  initialParcelId?: string
}

export default function ExploreWithChat({ initialParcelId }: ExploreWithChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(initialParcelId || null)
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [mobileTab, setMobileTab] = useState<'explore' | 'chat'>('explore')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const content = text || input.trim()
    if (!content || isTyping) return

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Check for parcel ID in user message first
    const userParcelId = extractParcelId(content)
    if (userParcelId) {
      setSelectedParcelId(userParcelId)
      setMobileTab('explore')
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const responseText = data.response || data.content || 'Unable to process request.'
      const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: responseText }
      setMessages(prev => [...prev, assistantMsg])

      // Extract parcel from AI response
      const aiParcelId = extractParcelId(responseText)
      if (aiParcelId) {
        setSelectedParcelId(aiParcelId)
        setMobileTab('explore')
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex overflow-hidden" style={{ background: SLATE }}>
      {/* Mobile tab bar */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-20 flex border-b border-gray-800" style={{ background: SLATE }}>
        <button
          onClick={() => setMobileTab('explore')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${mobileTab === 'explore' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-500'}`}
        >
          ◇ Explore
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${mobileTab === 'chat' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-500'}`}
        >
          💬 Chat
        </button>
      </div>

      {/* Left panel: Chat — desktop always visible, mobile conditional */}
      <div
        className={`w-full md:w-[380px] md:max-w-[40%] flex-shrink-0 flex flex-col border-r border-gray-800 ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`}
        style={{ background: SLATE }}
      >
        {/* Chat header */}
        <div className="h-12 px-4 flex items-center gap-2 border-b border-gray-800 shrink-0">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: ORANGE }} />
          <span className="text-sm font-semibold text-white">ZoneWise Chat</span>
          {selectedParcel && (
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded truncate max-w-[140px]" style={{ background: `${NAVY}cc`, color: ORANGE }}>
              {selectedParcel.address}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 md:pt-3 pt-12">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className="text-3xl mb-2 opacity-50">◇</div>
              <p className="text-xs text-gray-500 mb-4">Ask about a parcel or development scenario</p>
              <div className="space-y-1.5">
                {EXAMPLE_PROMPTS.map(q => (
                  <button key={q} onClick={() => handleSend(q)}
                    className="block w-full text-left text-[11px] text-gray-400 hover:text-white px-3 py-2 rounded-lg border border-gray-700/50 hover:border-amber-500/30 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-5 h-5 rounded mr-1.5 mt-0.5 shrink-0 flex items-center justify-center" style={{ background: NAVY }}>
                  <span style={{ color: ORANGE, fontSize: 9, fontWeight: 900 }}>Z</span>
                </div>
              )}
              <div
                className="max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                style={{
                  background: m.role === 'user' ? NAVY : '#1e293b',
                  color: '#f8fafc',
                  borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                }}
              >
                {m.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="w-5 h-5 rounded mr-1.5 shrink-0 flex items-center justify-center" style={{ background: NAVY }}>
                <span style={{ color: ORANGE, fontSize: 9, fontWeight: 900 }}>Z</span>
              </div>
              <div className="px-3 py-2.5 rounded-xl" style={{ background: '#1e293b' }}>
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: ORANGE, animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-800 shrink-0">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a parcel or development..."
              rows={1}
              className="flex-1 bg-gray-800/80 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 resize-none focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="px-3 rounded-lg text-xs font-bold disabled:opacity-30 transition-colors shrink-0"
              style={{ background: NAVY, color: ORANGE }}
            >
              →
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-2">For guidance only. Verify with local Planning Dept.</p>
        </div>
      </div>

      {/* Right panel: DevIntelTab — desktop always visible, mobile conditional */}
      <div
        className={`flex-1 overflow-y-auto ${mobileTab === 'explore' ? 'flex flex-col' : 'hidden md:flex md:flex-col'} md:pt-0 pt-10`}
      >
        <DevIntelTab
          externalSelectedParcel={selectedParcelId}
          onParcelSelect={p => {
            setSelectedParcel(p)
            if (p) setSelectedParcelId(p.id)
          }}
        />
      </div>
    </div>
  )
}
