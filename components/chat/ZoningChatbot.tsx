'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, MapPin, Building2, Ruler, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Citation {
  source: string
  detail: string
}

interface ParcelData {
  parcel_id: string
  address: string
  acres: number | null
  use_code: string | null
  use_description: string | null
  city: string | null
}

interface ZoningData {
  zone_code: string
  zone_name: string
  jurisdiction: string | null
  standards: Record<string, unknown>
  permitted_uses: { use_description: string; use_type: string }[]
  isFallback: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  parcel?: ParcelData
  zoning?: ZoningData
  isLoading?: boolean
}

// ─── Example prompts ──────────────────────────────────────────────────────────
const EXAMPLE_PROMPTS = [
  'What can I build at 2680 Donna Dr?',
  'What does R-1A zoning allow?',
  'Compare SFR vs MFR-CONDO districts',
  'Can I build a duplex in BU-1?',
  'What is the max height in PUD zones?',
  'What is FAR?',
]

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

// ─── Context card (right panel) ───────────────────────────────────────────────
function ContextCard({ parcel, zoning }: { parcel?: ParcelData; zoning?: ZoningData }) {
  const [showAllUses, setShowAllUses] = useState(false)

  if (!parcel && !zoning) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
        <div className="w-14 h-14 rounded-full bg-[#1E3A5F]/20 flex items-center justify-center">
          <Building2 className="w-7 h-7 text-[#1E3A5F]" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300">No parcel selected</p>
          <p className="text-xs text-slate-500 mt-1">Ask about an address or zone code to see details here</p>
        </div>
      </div>
    )
  }

  const s = zoning?.standards ?? {}
  const std = (key: string) => {
    const val = s[key] ?? s[key.replace('_ft', '')] ?? s[key.replace('_pct', '')]
    return val !== null && val !== undefined ? val : null
  }

  const uses = zoning?.permitted_uses ?? []
  const displayedUses = showAllUses ? uses : uses.slice(0, 10)

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Parcel header */}
      {parcel && (
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{parcel.address}</p>
              {parcel.city && <p className="text-xs text-slate-400">{parcel.city}, FL</p>}
            </div>
          </div>
          {parcel.acres && (
            <p className="text-xs text-slate-400 ml-6">
              {parcel.acres} acres · {Math.round(parcel.acres * 43560).toLocaleString()} sq ft
            </p>
          )}
          {parcel.use_description && (
            <p className="text-xs text-slate-400 ml-6">Current use: {parcel.use_description}</p>
          )}
        </div>
      )}

      {/* Zone badge */}
      {zoning && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#1E3A5F] text-white text-xs font-bold font-mono">
              {zoning.zone_code}
            </span>
            <span className="text-xs text-slate-300 leading-tight">{zoning.zone_name}</span>
          </div>

          {zoning.jurisdiction && (
            <p className="text-xs text-slate-500">📍 {zoning.jurisdiction}</p>
          )}

          {zoning.isFallback && (
            <p className="text-xs text-amber-500/80 bg-amber-500/10 px-2 py-1 rounded">
              ⚠ Estimated controls — verify with local jurisdiction
            </p>
          )}

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 gap-2">
            {std('max_height_ft') !== null && (
              <MetricTile label="Max Height" value={`${std('max_height_ft')} ft`} />
            )}
            {std('max_stories') !== null && (
              <MetricTile label="Stories" value={String(std('max_stories'))} />
            )}
            {std('max_lot_coverage_pct') !== null && (
              <MetricTile label="Lot Coverage" value={`${std('max_lot_coverage_pct')}%`} />
            )}
            {std('max_far') !== null && (
              <MetricTile label="Max FAR" value={String(std('max_far'))} />
            )}
            {std('front_setback_ft') !== null && (
              <MetricTile label="Front Setback" value={`${std('front_setback_ft')} ft`} />
            )}
            {std('rear_setback_ft') !== null && (
              <MetricTile label="Rear Setback" value={`${std('rear_setback_ft')} ft`} />
            )}
            {std('side_setback_ft') !== null && (
              <MetricTile label="Side Setback" value={`${std('side_setback_ft')} ft`} />
            )}
            {std('max_density_du_acre') !== null && Number(std('max_density_du_acre')) > 0 && (
              <MetricTile label="Max Density" value={`${std('max_density_du_acre')} du/ac`} />
            )}
          </div>

          {/* Permitted uses */}
          {uses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5" />
                Permitted Uses
              </p>
              <ul className="space-y-1">
                {displayedUses.map((u, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                    <span className="text-[#F59E0B] shrink-0 mt-0.5">·</span>
                    {u.use_description}
                  </li>
                ))}
              </ul>
              {uses.length > 10 && (
                <button
                  onClick={() => setShowAllUses(!showAllUses)}
                  className="mt-1.5 text-xs text-[#F59E0B] hover:underline flex items-center gap-1"
                >
                  {showAllUses ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> +{uses.length - 10} more</>}
                </button>
              )}
            </div>
          )}

          {/* 3D Massing link */}
          {parcel && (
            <a
              href={`/massing?address=${encodeURIComponent(parcel.address)}`}
              className="flex items-center gap-1.5 text-xs text-[#F59E0B] hover:text-[#F59E0B]/80 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View 3D Massing Model
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/60 rounded px-2.5 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  if (message.isLoading) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-slate-800 rounded-2xl rounded-tl-sm">
          <TypingIndicator />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] space-y-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-[#F59E0B] text-white rounded-tr-sm'
              : 'bg-slate-800 text-slate-100 rounded-tl-sm'
          }`}
          dangerouslySetInnerHTML={isUser ? undefined : { __html: formatMarkdown(message.content) }}
        >
          {isUser ? message.content : undefined}
        </div>

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {message.citations.map((c, i) => (
              <span
                key={i}
                title={c.detail}
                className="text-xs px-2 py-0.5 rounded-full bg-[#1E3A5F]/60 text-slate-300 border border-[#1E3A5F]/40 cursor-default"
              >
                📋 {c.source}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Simple markdown formatter ────────────────────────────────────────────────
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-3 list-disc list-inside">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="space-y-0.5 my-1">$&</ul>')
    .replace(/\[Source: ([^\]]+)\]/g, '<span class="text-xs text-slate-500 italic">[Source: $1]</span>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/^(.+)$/, '<p>$1</p>')
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ZoningChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [contextParcel, setContextParcel] = useState<ParcelData | undefined>()
  const [contextZoning, setContextZoning] = useState<ZoningData | undefined>()
  const [contextPanelOpen, setContextPanelOpen] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    const loadingMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', isLoading: true }
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/zoning-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      })

      const data = await res.json()

      const assistantMsg: Message = {
        id: loadingMsg.id,
        role: 'assistant',
        content: data.response ?? data.error ?? 'No response.',
        citations: data.citations,
        parcel: data.parcel,
        zoning: data.zoning,
      }

      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? assistantMsg : m))

      if (data.sessionId && !sessionId) setSessionId(data.sessionId)
      if (data.parcel) setContextParcel(data.parcel)
      if (data.zoning) setContextZoning(data.zoning)
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id
          ? { ...m, content: 'Request failed. Please try again.', isLoading: false }
          : m
      ))
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [isLoading, sessionId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* ── Left panel: Chat ── */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-slate-800">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E3A5F] to-[#1E3A5F]/60 flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#F59E0B] text-2xl font-bold">Z</span>
                </div>
                <h2 className="text-lg font-semibold text-white">ZoneWise AI</h2>
                <p className="text-sm text-slate-400 mt-1">Florida zoning intelligence for Brevard County</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-xs px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-[#F59E0B]/40 hover:text-white transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t border-slate-800 p-3">
          <div className="flex items-end gap-2 bg-slate-800 rounded-xl px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about zoning in Brevard County..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none min-h-[24px] max-h-32 leading-6"
              style={{ overflowY: input.split('\n').length > 4 ? 'auto' : 'hidden' }}
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#F59E0B] hover:bg-[#F59E0B]/80"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 text-center">
            Answers sourced from Supabase · Brevard County zoning data
          </p>
        </div>
      </div>

      {/* ── Right panel: Context card ── */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 bg-slate-900/50">
        <div className="shrink-0 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parcel Context</span>
          <button
            onClick={() => setContextPanelOpen(!contextPanelOpen)}
            className="text-slate-500 hover:text-slate-300"
          >
            {contextPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        {contextPanelOpen && (
          <div className="flex-1 overflow-hidden">
            <ContextCard parcel={contextParcel} zoning={contextZoning} />
          </div>
        )}
      </div>

      {/* ── Mobile context card (collapsible below chat) ── */}
      {(contextParcel || contextZoning) && (
        <div className="lg:hidden fixed bottom-20 right-4 z-10">
          <button
            onClick={() => setContextPanelOpen(!contextPanelOpen)}
            className="px-3 py-2 rounded-xl bg-[#1E3A5F] text-white text-xs font-medium shadow-lg flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            {contextZoning?.zone_code ?? 'Zone Info'}
            {contextPanelOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          {contextPanelOpen && (
            <div className="absolute bottom-10 right-0 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden" style={{ maxHeight: '60vh' }}>
              <ContextCard parcel={contextParcel} zoning={contextZoning} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
