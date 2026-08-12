'use client'

import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { Send, MapPin, Building2, Ruler, ChevronDown, ChevronUp, ExternalLink, ThumbsUp, ThumbsDown, Lock } from 'lucide-react'
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useExternalStoreRuntime,
  useMessage,
  useMessagePartText,
  type AppendMessage,
  type TextMessagePart,
} from '@assistant-ui/react'
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown'
import PropertyCard, { type BcpaoPropertyData } from './PropertyCard'

// ─── Paywall helpers (localStorage) ──────────────────────────────────────────
const PAYWALL_KEY = 'zw_lookups'
const FREE_LIMIT = 3

interface LookupStore { count: number; date: string }

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

function getLookupStore(): LookupStore {
  if (typeof window === 'undefined') return { count: 0, date: getTodayStr() }
  try {
    const raw = localStorage.getItem(PAYWALL_KEY)
    if (!raw) return { count: 0, date: getTodayStr() }
    const parsed: LookupStore = JSON.parse(raw)
    // Reset daily
    if (parsed.date !== getTodayStr()) return { count: 0, date: getTodayStr() }
    return parsed
  } catch {
    return { count: 0, date: getTodayStr() }
  }
}

function isProUser(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('zw_pro') === 'true'
}

function incrementLookup(): number {
  const store = getLookupStore()
  const next = { count: store.count + 1, date: getTodayStr() }
  try { localStorage.setItem(PAYWALL_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return next.count
}

// ─── Paywall modal ────────────────────────────────────────────────────────────
function PaywallModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      // Attempt Stripe checkout with Pro price; fall back to /pricing if unconfigured
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? 'price_pro_monthly' }),
      })
      if (res.ok) {
        const { url } = await res.json()
        if (url) { window.location.href = url; return }
      }
    } catch { /* fall through */ }
    // Fallback: send to pricing page
    window.location.href = '/pricing'
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: 'blur(6px)', background: 'rgba(2,6,23,0.80)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 bg-[#0f1929] border border-slate-700 rounded-2xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Daily limit reached</h2>
            <p className="text-sm text-slate-400 mt-1">
              You&apos;ve used your {FREE_LIMIT} free address lookups for today.
              Upgrade for unlimited access.
            </p>
          </div>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#F59E0B] hover:bg-[#F59E0B]/80 text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Redirecting…' : 'Upgrade to Pro — $15/month'}
          </button>
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

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
    <div
      className="flex items-center gap-1 px-4 py-3"
      role="status"
      aria-live="polite"
      aria-label="ZoneWise AI is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 dark:bg-slate-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

// ─── Context card (right panel) ───────────────────────────────────────────────
function ContextCard({
  parcel,
  zoning,
  onViewPropertyDetails,
}: {
  parcel?: ParcelData
  zoning?: ZoningData
  onViewPropertyDetails?: (parcelId: string) => void
}) {
  const [showAllUses, setShowAllUses] = useState(false)

  if (!parcel && !zoning) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
        <div className="w-14 h-14 rounded-full bg-[#1E3A5F]/20 flex items-center justify-center">
          <Building2 className="w-7 h-7 text-[#1E3A5F]" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-slate-300">No parcel selected</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Ask about an address or zone code to see details here</p>
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
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{parcel.address}</p>
              {parcel.city && <p className="text-xs text-gray-500 dark:text-slate-400">{parcel.city}, FL</p>}
            </div>
          </div>
          {parcel.acres && (
            <p className="text-xs text-gray-500 dark:text-slate-400 ml-6">
              {parcel.acres} acres · {Math.round(parcel.acres * 43560).toLocaleString()} sq ft
            </p>
          )}
          {parcel.use_description && (
            <p className="text-xs text-gray-500 dark:text-slate-400 ml-6">Current use: {parcel.use_description}</p>
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
            <span className="text-xs text-gray-600 dark:text-slate-300 leading-tight">{zoning.zone_name}</span>
          </div>

          {zoning.jurisdiction && (
            <p className="text-xs text-gray-400 dark:text-slate-500">📍 {zoning.jurisdiction}</p>
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
              <p className="text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5" />
                Permitted Uses
              </p>
              <ul className="space-y-1">
                {displayedUses.map((u, i) => (
                  <li key={i} className="text-xs text-gray-500 dark:text-slate-400 flex items-start gap-1.5">
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

          {/* View Property Details + Zoning Report + 3D Massing */}
          {parcel && (
            <div className="flex flex-col gap-1.5">
              {onViewPropertyDetails && (
                <button
                  onClick={() => onViewPropertyDetails(parcel.parcel_id)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#F59E0B]/80 text-white text-xs font-semibold transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  View Property Details
                </button>
              )}
              <a
                href={`/report?parcel=${encodeURIComponent(parcel.parcel_id)}`}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Full Zoning Report
              </a>
              <a
                href={`/massing?address=${encodeURIComponent(parcel.address)}`}
                className="flex items-center gap-1.5 text-xs text-[#F59E0B] hover:text-[#F59E0B]/80 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View 3D Massing Model
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-100/60 dark:bg-slate-800/60 rounded px-2.5 py-2">
      <p className="text-xs text-gray-400 dark:text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

// ─── assistant-ui message rendering (safe markdown, no dangerouslySetInnerHTML) ──
const MARKDOWN_COMPONENTS = {
  p: (props: any) => <p className="mt-2 first:mt-0" {...props} />,
  strong: (props: any) => <strong className="font-semibold" {...props} />,
  code: (props: any) => <code className="font-mono text-xs bg-black/10 dark:bg-white/10 rounded px-1 py-0.5" {...props} />,
  ul: (props: any) => <ul className="space-y-0.5 my-1 list-disc list-inside ml-3" {...props} />,
  ol: (props: any) => <ol className="space-y-0.5 my-1 list-decimal list-inside ml-3" {...props} />,
  li: (props: any) => <li {...props} />,
  a: (props: any) => <a className="text-[#F59E0B] underline hover:text-[#F59E0B]/80" target="_blank" rel="noopener noreferrer" {...props} />,
}

function AssistantMarkdownText() {
  return <MarkdownTextPrimitive components={MARKDOWN_COMPONENTS} />
}

function UserPlainText() {
  const { text } = useMessagePartText()
  return <>{text}</>
}

// ─── Per-message actions (feedback + property details), threaded via context ──
// assistant-ui's ThreadPrimitive.Messages renders AssistantMessage/UserMessage as
// stable module-level components (identity must stay constant across renders, or
// the thread remounts every keystroke) — so per-message handlers that close over
// component state are passed down via context instead of props.
type FeedbackStatus = 'idle' | 'negative-expand' | 'submitted'

interface FeedbackState {
  status: FeedbackStatus
  text: string
}

interface ChatActions {
  feedbackMap: Record<string, FeedbackState>
  onThumbsUp: (id: string) => void
  onThumbsDown: (id: string) => void
  onTextChange: (id: string, text: string) => void
  onSubmitNegative: (id: string) => void
  onViewPropertyDetails: (parcelId: string) => void
}

const ChatActionsContext = createContext<ChatActions | null>(null)

function useChatActions(): ChatActions {
  const ctx = useContext(ChatActionsContext)
  if (!ctx) throw new Error('ChatActionsContext missing — must render inside ZoningChatbot')
  return ctx
}

// ─── Feedback buttons component ───────────────────────────────────────────────
function FeedbackButtons({
  messageId,
  state,
  onThumbsUp,
  onThumbsDown,
  onTextChange,
  onSubmitNegative,
}: {
  messageId: string
  state: FeedbackState
  onThumbsUp: (id: string) => void
  onThumbsDown: (id: string) => void
  onTextChange: (id: string, text: string) => void
  onSubmitNegative: (id: string) => void
}) {
  if (state.status === 'submitted') {
    return (
      <p className="text-xs text-gray-400 dark:text-slate-500 px-1 mt-1">
        Thanks for your feedback
      </p>
    )
  }

  return (
    <div className="px-1 mt-1 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onThumbsUp(messageId)}
          title="Good response"
          className="flex items-center gap-1 px-2 py-1 rounded border border-[#1E3A5F]/40 text-[#1E3A5F] dark:text-slate-400 dark:border-slate-600 hover:bg-[#1E3A5F]/10 transition-colors text-xs"
        >
          <ThumbsUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => onThumbsDown(messageId)}
          title="Bad response"
          className="flex items-center gap-1 px-2 py-1 rounded border border-[#1E3A5F]/40 text-[#1E3A5F] dark:text-slate-400 dark:border-slate-600 hover:bg-[#1E3A5F]/10 transition-colors text-xs"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>

      {state.status === 'negative-expand' && (
        <div className="flex items-end gap-1.5">
          <input
            type="text"
            value={state.text}
            onChange={e => onTextChange(messageId, e.target.value)}
            placeholder="What went wrong? (optional)"
            maxLength={200}
            className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:border-[#1E3A5F]/60"
            autoFocus
          />
          <button
            onClick={() => onSubmitNegative(messageId)}
            className="shrink-0 px-2.5 py-1.5 rounded bg-[#1E3A5F] text-white text-xs hover:bg-[#1E3A5F]/80 transition-colors"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}

// ─── assistant-ui message components ───────────────────────────────────────────
function AssistantMessage() {
  const id = useMessage((s) => s.id)
  const custom = useMessage((s) => s.metadata.custom) as {
    citations?: Citation[]
    parcel?: ParcelData
    zoning?: ZoningData
  }
  const { feedbackMap, onThumbsUp, onThumbsDown, onTextChange, onSubmitNegative, onViewPropertyDetails } = useChatActions()

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] space-y-1">
        <MessagePrimitive.Root className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-tl-sm">
          <MessagePrimitive.Parts components={{ Text: AssistantMarkdownText }} />
        </MessagePrimitive.Root>

        {/* Citations */}
        {custom.citations && custom.citations.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {custom.citations.map((c, i) => (
              <span
                key={i}
                title={c.detail}
                className="text-xs px-2 py-0.5 rounded-full bg-[#1E3A5F]/60 text-gray-600 dark:text-slate-300 border border-[#1E3A5F]/40 cursor-default"
              >
                📋 {c.source}
              </span>
            ))}
          </div>
        )}

        {/* View Property Details + Zoning Report buttons */}
        {custom.parcel && (
          <div className="px-1 flex flex-wrap gap-1.5">
            <button
              onClick={() => onViewPropertyDetails(custom.parcel!.parcel_id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#F59E0B]/80 text-white text-xs font-semibold transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              View Property Details
            </button>
            <a
              href={`/report?parcel=${encodeURIComponent(custom.parcel.parcel_id)}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Full Zoning Report
            </a>
          </div>
        )}

        <FeedbackButtons
          messageId={id}
          state={feedbackMap[id] ?? { status: 'idle', text: '' }}
          onThumbsUp={onThumbsUp}
          onThumbsDown={onThumbsDown}
          onTextChange={onTextChange}
          onSubmitNegative={onSubmitNegative}
        />
      </div>
    </div>
  )
}

function UserMessage() {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-1">
        <MessagePrimitive.Root className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words bg-[#F59E0B] text-white rounded-tr-sm">
          <MessagePrimitive.Parts components={{ Text: UserPlainText }} />
        </MessagePrimitive.Root>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ZoningChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID())
  const [contextParcel, setContextParcel] = useState<ParcelData | undefined>()
  const [contextZoning, setContextZoning] = useState<ZoningData | undefined>()
  const [contextPanelOpen, setContextPanelOpen] = useState(true)
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackState>>({})
  const [showPaywall, setShowPaywall] = useState(false)

  // Property card modal
  const [propertyCardData, setPropertyCardData] = useState<BcpaoPropertyData | null>(null)
  const [propertyCardParcelId, setPropertyCardParcelId] = useState<string>('')
  const [propertyCardLoading, setPropertyCardLoading] = useState(false)

  // Post-payment bypass: if redirected back with ?success=true, mark user as pro
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      localStorage.setItem('zw_pro', 'true')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    // Paywall check — block if daily address lookup limit reached (and not a pro user)
    const pro = isProUser()
    const store = getLookupStore()
    if (!pro && store.count >= FREE_LIMIT) {
      setShowPaywall(true)
      return
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res = await fetch('/api/zoning-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, isPro: pro }),
      })

      const data = await res.json()

      // Handle server-side paywall gate
      if (data.paywall === true) {
        setIsLoading(false)
        setShowPaywall(true)
        return
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response ?? data.error ?? 'No response.',
        citations: data.citations,
        parcel: data.parcel,
        zoning: data.zoning,
      }

      setMessages(prev => [...prev, assistantMsg])

      if (data.sessionId && !sessionId) setSessionId(data.sessionId as string)
      if (data.parcel) {
        setContextParcel(data.parcel)
        // Count successful address lookups toward daily paywall limit
        incrementLookup()
      }
      if (data.zoning) setContextZoning(data.zoning)
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again in a moment.",
      }])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, sessionId])

  const fetchPropertyCard = useCallback(async (parcelId: string) => {
    setPropertyCardParcelId(parcelId)
    setPropertyCardLoading(true)
    setPropertyCardData(null)
    try {
      const res = await fetch(`/api/bcpao-lookup?parcelId=${encodeURIComponent(parcelId)}`)
      const data = await res.json()
      if (res.ok) {
        setPropertyCardData(data)
      }
    } catch {
      // fail silently — modal won't open
    } finally {
      setPropertyCardLoading(false)
    }
  }, [])

  // ── Feedback helpers ───────────────────────────────────────────────────────
  const submitFeedback = useCallback(async (
    messageId: string,
    rating: 'positive' | 'negative',
    feedbackText?: string,
  ) => {
    const msg = messages.find(m => m.id === messageId)
    if (!msg) return
    // find the user query just before this message
    const msgIndex = messages.findIndex(m => m.id === messageId)
    const userMsg = msgIndex > 0 ? messages[msgIndex - 1] : null

    setFeedbackMap(prev => ({ ...prev, [messageId]: { status: 'submitted', text: '' } }))

    try {
      await fetch('/api/chat-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          query:        userMsg?.content ?? '',
          response:     msg.content,
          rating,
          feedbackText: feedbackText?.trim() || undefined,
          parcelId:     msg.parcel?.parcel_id,
          zoneCode:     msg.zoning?.zone_code,
          municipality: msg.zoning?.jurisdiction ?? undefined,
        }),
      })
    } catch {
      // fire-and-forget — UI already shows "thanks"
    }
  }, [messages, sessionId])

  const handleThumbsUp = useCallback((id: string) => {
    submitFeedback(id, 'positive')
  }, [submitFeedback])

  const handleThumbsDown = useCallback((id: string) => {
    setFeedbackMap(prev => ({
      ...prev,
      [id]: { status: 'negative-expand', text: prev[id]?.text ?? '' },
    }))
  }, [])

  const handleFeedbackTextChange = useCallback((id: string, text: string) => {
    setFeedbackMap(prev => ({ ...prev, [id]: { ...prev[id], text } }))
  }, [])

  const handleSubmitNegative = useCallback((id: string) => {
    const text = feedbackMap[id]?.text ?? ''
    submitFeedback(id, 'negative', text)
  }, [feedbackMap, submitFeedback])

  const runtime = useExternalStoreRuntime<Message>({
    messages,
    isRunning: isLoading,
    isDisabled: isLoading,
    convertMessage: (m) => ({
      role: m.role,
      id: m.id,
      content: m.content,
      metadata: { custom: { citations: m.citations, parcel: m.parcel, zoning: m.zoning } },
    }),
    onNew: async (message: AppendMessage) => {
      const textPart = message.content.find((p): p is TextMessagePart => p.type === 'text')
      if (textPart?.text) await sendMessage(textPart.text)
    },
  })

  const chatActions: ChatActions = {
    feedbackMap,
    onThumbsUp: handleThumbsUp,
    onThumbsDown: handleThumbsDown,
    onTextChange: handleFeedbackTextChange,
    onSubmitNegative: handleSubmitNegative,
    onViewPropertyDetails: fetchPropertyCard,
  }

  return (
    <ChatActionsContext.Provider value={chatActions}>
    <AssistantRuntimeProvider runtime={runtime}>
    <div className="flex h-full gap-0 overflow-hidden">
      {/* ── Left panel: Chat ── */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 dark:border-slate-800">
        {/* Messages area */}
        <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" autoScroll>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E3A5F] to-[#1E3A5F]/60 flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#F59E0B] text-2xl font-bold">Z</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ZoneWise AI</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Florida zoning intelligence for Brevard County</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-xs px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-100/60 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 hover:border-[#F59E0B]/40 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-gray-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm">
                <TypingIndicator />
              </div>
            </div>
          )}
        </ThreadPrimitive.Viewport>

        {/* Input bar */}
        <div className="shrink-0 border-t border-gray-200 dark:border-slate-800 p-3">
          <ComposerPrimitive.Root className="flex items-end gap-2 bg-gray-100 dark:bg-slate-800 rounded-xl px-3 py-2">
            <ComposerPrimitive.Input
              rows={1}
              placeholder="Ask about zoning in Brevard County..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 resize-none outline-none min-h-[24px] max-h-32 leading-6"
            />
            <ComposerPrimitive.Send
              aria-label="Send message"
              className="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#F59E0B] hover:bg-[#F59E0B]/80"
            >
              <Send className="w-4 h-4 text-white" />
            </ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 text-center">
            Answers sourced from Supabase · Brevard County zoning data
          </p>
        </div>
      </div>

      {/* ── Right panel: Context card ── */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 bg-gray-50/50 dark:bg-slate-900/50">
        <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Parcel Context</span>
          <button
            onClick={() => setContextPanelOpen(!contextPanelOpen)}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
          >
            {contextPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        {contextPanelOpen && (
          <div className="flex-1 overflow-hidden">
            <ContextCard
              parcel={contextParcel}
              zoning={contextZoning}
              onViewPropertyDetails={fetchPropertyCard}
            />
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
            <div className="absolute bottom-10 right-0 w-72 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden" style={{ maxHeight: '60vh' }}>
              <ContextCard
                parcel={contextParcel}
                zoning={contextZoning}
                onViewPropertyDetails={fetchPropertyCard}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Property card loading skeleton overlay ── */}
      {propertyCardLoading && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ backdropFilter: 'blur(6px)', background: 'rgba(2,6,23,0.75)' }}
        >
          <div className="w-full sm:w-[560px] max-h-[85dvh] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-t-2xl sm:rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="h-44 bg-gray-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-2/3" />
            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/3" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded" />
              <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-5/6" />
              <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-4/6" />
            </div>
          </div>
        </div>
      )}

      {/* ── Property card modal ── */}
      {propertyCardData && !propertyCardLoading && (
        <PropertyCard
          data={propertyCardData}
          parcelId={propertyCardParcelId}
          onClose={() => setPropertyCardData(null)}
        />
      )}

      {/* ── Paywall modal ── */}
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </div>
    </AssistantRuntimeProvider>
    </ChatActionsContext.Provider>
  )
}
