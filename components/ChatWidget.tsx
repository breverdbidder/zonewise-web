'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { useSafeAuth } from '@/lib/safe-clerk'

// ── Types ────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Artifact {
  id: string
  type: 'map' | 'table' | 'report'
  title: string
  data: any
  metadata?: {
    coordinates?: [number, number]
    jurisdiction?: string
    county?: string
    zoom?: number
    photoUrl?: string
    kpiCount?: string
  }
}

interface ChatWidgetProps {
  /** Override the API endpoint */
  apiEndpoint?: string
  /** Auth token — if omitted, widget fetches it from Supabase session */
  authToken?: string
  /** Called whenever the assistant produces a new message */
  onAssistantMessage?: (content: string) => void
}

const CHIPS = [
  { icon: '🏠', text: 'What are the zoning rules for RS-2 in Satellite Beach, FL?' },
  { icon: '📍', text: 'Analyze the property at 1247 Oak Ridge Dr, Melbourne FL 32940' },
  { icon: '⚖️', text: 'What liens survive a foreclosure sale vs a tax deed sale in Florida?' },
  { icon: '📊', text: 'Compare C-1 vs C-2 zoning in Brevard County' },
  { icon: '🗺️', text: 'What are permitted uses for PUD zoning in Palm Bay?' },
  { icon: '💰', text: 'Show me the top Brevard County zip codes for real estate investing' },
]

const PIPELINE = [
  'Jurisdiction lookup · 67 FL counties',
  'Parcel data · BCPAO / FDOR',
  'Zoning district pull',
  'Permitted uses check',
  'FEMA Flood Zone · NFHL',
  'Census ACS neighborhood data',
  '128 KPI computation',
  'Claude Sonnet · AI synthesis',
]

// ── Artifact renderers ───────────────────────────────────────
function KpiCard({ data }: { data: any }) {
  const p = data?.primary || data?.parcels?.[0]
  const kpi = data?.kpiSummary
  if (!p) return null

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
        <div className="text-sm font-medium text-slate-100">{p.address}</div>
        <div className="mt-1 font-mono text-xs text-slate-400">{p.county} County · {p.parcelId}</div>
      </div>
      {kpi && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Just Value', val: p.justValue ? `$${Number(p.justValue).toLocaleString()}` : '—' },
              { label: 'Living Area', val: p.livingArea ? `${Number(p.livingArea).toLocaleString()} sf` : '—' },
              { label: 'Year Built', val: p.yearBuilt || '—' },
            ].map(m => (
              <div key={m.label} className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-center">
                <div className="font-mono text-sm text-amber-400">{m.val}</div>
                <div className="mt-1 text-xs text-slate-400">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber-400">Investment Intelligence</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                ['Grade', kpi.grade],
                ['Risk', kpi.riskLevel],
                ['Cap Rate', kpi.capRate],
                ['Monthly Rent', kpi.monthlyRent ? `$${Number(kpi.monthlyRent).toLocaleString()}` : null],
                ['Zone', kpi.zoneCode],
                ['Flood Zone', kpi.floodZone],
                ['Walkability', kpi.walkabilityScore != null ? `${kpi.walkabilityScore}/100` : null],
                ['Max Bid', kpi.maxBid ? `$${Number(kpi.maxBid).toLocaleString()}` : null],
              ].map(([k, v]) => v ? (
                <div key={k as string} className="flex justify-between">
                  <span className="text-xs text-slate-400">{k}</span>
                  <span className="font-mono text-xs text-slate-200">{v}</span>
                </div>
              ) : null)}
            </div>
            {kpi.kpiCount && (
              <div className="mt-2 font-mono text-xs text-slate-600">{kpi.kpiCount} KPIs populated</div>
            )}
          </div>
        </>
      )}
      {data?.metadata?.photoUrl && (
        <div className="overflow-hidden rounded-lg border border-slate-700">
          <img src={data.metadata.photoUrl} alt="Aerial view" className="h-36 w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        </div>
      )}
    </div>
  )
}

function ZoneTable({ data }: { data: any }) {
  const districts: any[] = data?.districts || (data?.zoneCode ? [data] : [])
  if (!districts.length) return null
  return (
    <div className="overflow-hidden rounded-lg border border-slate-700">
      <div className="border-b border-slate-700 bg-slate-800/60 px-3 py-2 font-mono text-xs uppercase tracking-widest text-slate-400">
        Zoning Districts
      </div>
      <div className="divide-y divide-slate-700/50">
        {districts.map((d: any, i: number) => (
          <div key={i} className="p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="rounded bg-blue-900/30 border border-blue-500/20 px-1.5 py-0.5 font-mono text-xs text-blue-300">
                {d.zoneCode || d.code}
              </span>
              <span className="text-sm text-slate-200">{d.zoneName || d.name}</span>
            </div>
            <div className="text-xs text-slate-400">{d.jurisdiction} · {d.county} County</div>
            {(d.maxHeight || d.setbacks) && (
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                {d.maxHeight && <div className="flex justify-between text-xs"><span className="text-slate-400">Max Height</span><span className="font-mono text-slate-300">{d.maxHeight} ft</span></div>}
                {d.coverage && <div className="flex justify-between text-xs"><span className="text-slate-400">Coverage</span><span className="font-mono text-slate-300">{d.coverage}%</span></div>}
                {d.far && <div className="flex justify-between text-xs"><span className="text-slate-400">FAR</span><span className="font-mono text-slate-300">{d.far}</span></div>}
                {d.setbacks?.front && <div className="flex justify-between text-xs"><span className="text-slate-400">Front Setback</span><span className="font-mono text-slate-300">{d.setbacks.front} ft</span></div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ArtifactPanel({ artifact }: { artifact: Artifact | null }) {
  if (!artifact) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="text-4xl opacity-20">🗺️</div>
        <div className="font-semibold text-slate-400">Property Intelligence Panel</div>
        <p className="max-w-xs text-sm text-slate-600 leading-relaxed">
          Ask about any Florida property, zoning district, or county. Analysis appears here automatically.
        </p>
        <div className="mt-2 flex flex-col gap-2 w-full max-w-sm">
          {['Ask about any FL parcel or address', 'Get 128-KPI property intelligence', 'View zoning rules + permitted uses', 'FEMA flood zone + Census data'].map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2 text-xs text-slate-400">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-700 font-mono text-xs text-slate-600">{i+1}</span>
              {s}
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs uppercase tracking-widest text-slate-400">
          {artifact.type === 'table' ? '📊 Analysis' : artifact.type === 'map' ? '🗺️ Map' : '📄 Report'}
        </div>
        {artifact.metadata?.jurisdiction && (
          <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-400">
            {artifact.metadata.jurisdiction}
          </span>
        )}
      </div>
      <div className="font-semibold text-slate-200 text-sm">{artifact.title}</div>
      {artifact.type === 'table' && artifact.data?.parcels && <KpiCard data={artifact.data} />}
      {artifact.type === 'table' && artifact.data?.districts && !artifact.data?.parcels && <ZoneTable data={artifact.data} />}
      {artifact.type === 'map' && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 text-center">
          <div className="text-2xl mb-2">🗺️</div>
          <div className="text-sm text-slate-400">Map: {artifact.title}</div>
          {artifact.metadata?.coordinates && (
            <div className="mt-1 font-mono text-xs text-slate-600">
              {artifact.metadata.coordinates[1].toFixed(4)}, {artifact.metadata.coordinates[0].toFixed(4)}
            </div>
          )}
          <a href={`https://www.google.com/maps?q=${artifact.metadata?.coordinates?.[1]},${artifact.metadata?.coordinates?.[0]}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-500/40 hover:text-amber-400 transition-colors">
            Open in Maps →
          </a>
        </div>
      )}
    </div>
  )
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <h3 key={i} className="font-semibold text-slate-100 mt-2">{line.slice(2)}</h3>
        if (line.startsWith('## ')) return <h4 key={i} className="font-medium text-slate-200 mt-1.5">{line.slice(3)}</h4>
        if (line.startsWith('- ') || line.startsWith('• ')) return (
          <div key={i} className="flex gap-2">
            <span className="text-amber-400 shrink-0 mt-0.5">·</span>
            <span dangerouslySetInnerHTML={{ __html: sanitizeFormattedHtml(formatInline(line.slice(2))) }} />
          </div>
        )
        if (line.match(/^\d+\.\s/)) return (
          <div key={i} className="flex gap-2">
            <span className="font-mono text-xs text-slate-400 shrink-0 mt-0.5">{line.match(/^(\d+)/)?.[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: sanitizeFormattedHtml(formatInline(line.replace(/^\d+\.\s/, ''))) }} />
          </div>
        )
        if (line.trim() === '') return <div key={i} className="h-1" />
        return <p key={i} dangerouslySetInnerHTML={{ __html: sanitizeFormattedHtml(formatInline(line)) }} />
      })}
    </div>
  )
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="font-mono text-xs bg-slate-800 rounded px-1 py-0.5 text-amber-300">$1</code>')
    .replace(/⚠️/g, '<span class="text-amber-400">⚠️</span>')
    .replace(/✅/g, '<span class="text-emerald-400">✅</span>')
    .replace(/❌/g, '<span class="text-red-400">❌</span>')
}

// formatInline only ever emits these tags/attrs — scope DOMPurify to exactly
// that allow-list so any raw HTML in message content can't smuggle in a
// <script>/<img onerror> etc.
function sanitizeFormattedHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'code', 'span'],
    ALLOWED_ATTR: ['class'],
  })
}

// ── Main ChatWidget ──────────────────────────────────────────
export default function ChatWidget({ apiEndpoint = '/api/chat', authToken: propToken, onAssistantMessage }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null)
  const [pipeline, setPipeline] = useState<number>(-1)
  const [activeTab, setActiveTab] = useState<'analysis' | 'pipeline' | 'about'>('analysis')
  const [sessionId] = useState(() => crypto.randomUUID())
  const [sessionToken, setSessionToken] = useState<string | null>(propToken || null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pipelineRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Clerk auth — token managed automatically via cookies ──
  const { getToken, isSignedIn } = useSafeAuth()

  useEffect(() => {
    if (propToken) return // already provided
    // Clerk manages auth via cookies — just check sign-in status
    if (isSignedIn) {
      getToken().then(token => { if (token) setSessionToken(token) })
    }
  }, [propToken, isSignedIn])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const animatePipeline = useCallback(() => {
    setPipeline(0)
    let step = 0
    pipelineRef.current = setInterval(() => {
      step++
      if (step >= PIPELINE.length) {
        clearInterval(pipelineRef.current!)
        setPipeline(PIPELINE.length)
      } else {
        setPipeline(step)
      }
    }, 380)
  }, [])

  const send = useCallback(async (text?: string) => {
    const userText = text ?? input.trim()
    if (!userText || loading) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    setMessages(newMessages)
    setLoading(true)
    animatePipeline()

    try {
      // Get fresh Clerk token
      let token = sessionToken
      if (!token && isSignedIn) {
        token = await getToken() || null
        if (token) setSessionToken(token)
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        credentials: 'include', // Clerk reads auth cookies
        body: JSON.stringify({ messages: newMessages, sessionId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        // If 401, try to refresh and retry once
        if (res.status === 401) {
          const newToken = await getToken({ skipCache: true })
          if (newToken) {
            setSessionToken(newToken)
            const retry = await fetch(apiEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` },
              credentials: 'include',
              body: JSON.stringify({ messages: newMessages, sessionId }),
            })
            if (retry.ok) {
              const retryData = await retry.json()
              const assistantMsg: Message = { role: 'assistant', content: retryData.response || '' }
              setMessages(prev => [...prev, assistantMsg])
              if (retryData.artifacts?.length) {
                const best = retryData.artifacts.find((a: Artifact) => a.type === 'table') || retryData.artifacts[0]
                setActiveArtifact(best)
                setActiveTab('analysis')
              }
              return
            }
          }
          throw new Error('Please sign in to use the AI chat.')
        }
        throw new Error(err.error || `Error ${res.status}`)
      }

      const data = await res.json()
      const assistantContent = data.response || ''
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }])
      onAssistantMessage?.(assistantContent)
      if (data.artifacts?.length) {
        const best = data.artifacts.find((a: Artifact) => a.type === 'table') || data.artifacts[0]
        setActiveArtifact(best)
        setActiveTab('analysis')
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}` }])
    } finally {
      setLoading(false)
      if (pipelineRef.current) clearInterval(pipelineRef.current)
      setPipeline(-1)
    }
  }, [input, loading, messages, apiEndpoint, sessionId, sessionToken, animatePipeline])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const authReady = !!sessionToken

  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 font-sans">

      {/* ── LEFT: Chat ── */}
      <div className="flex w-[420px] min-w-[360px] flex-col border-r border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2.5 border-b border-slate-800 bg-slate-900/80 px-4 py-3 shrink-0">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <span className="ml-1 font-mono text-xs text-slate-400">ZoneWise AI · Florida Real Estate</span>
          <div className={`ml-auto flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs ${authReady ? 'border-amber-500/20 bg-amber-500/5 text-amber-400' : 'border-slate-700 bg-slate-800/50 text-slate-400'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${authReady ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
            {authReady ? 'LIVE · Claude Sonnet' : 'Connecting…'}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 scroll-smooth">
          {messages.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
              <div className="mb-1 font-semibold text-slate-200">ZoneWise AI 🏛</div>
              <p className="mb-4 text-sm text-slate-400 leading-relaxed">
                Ask me anything about Florida zoning, parcels, foreclosures, or tax deed auctions across all 67 counties.
              </p>
              <div className="flex flex-col gap-2">
                {CHIPS.map((c, i) => (
                  <button key={i} onClick={() => send(c.text)}
                    className="flex items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2.5 text-left text-xs text-slate-400 transition-all hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-slate-200">
                    <span className="text-base">{c.icon}</span>
                    {c.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-500 font-bold text-xs text-slate-900">Z</div>
              )}
              <div className={`max-w-[86%] rounded-xl px-3 py-2.5 ${m.role === 'user'
                ? 'rounded-br-sm bg-[#1E3A5F]/70 border border-[#1E3A5F] text-slate-100'
                : 'rounded-bl-sm border border-slate-700/60 bg-slate-800/50 text-slate-300'}`}>
                {m.role === 'assistant' ? <MessageContent content={m.content} /> : (
                  <p className="text-sm leading-relaxed">{m.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-500 font-bold text-xs text-slate-900">Z</div>
              <div className="rounded-xl rounded-bl-sm border border-slate-700/60 bg-slate-800/50 px-4 py-3">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-slate-800 bg-slate-900/70 p-3">
          <div className="flex items-end gap-2">
            <textarea ref={textareaRef} rows={1} value={input} onChange={autoResize} onKeyDown={handleKey}
              disabled={loading}
              placeholder="Ask about any FL property, zoning, or auction…"
              className="flex-1 resize-none rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-amber-500/40 focus:bg-slate-800 disabled:opacity-50 max-h-[120px]" />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-slate-900 transition hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm">
              →
            </button>
          </div>
          <p className="mt-2 text-center font-mono text-xs text-slate-700">
            67 FL Counties · 10.5M Parcels · 128 KPIs · Powered by Claude AI
          </p>
        </div>
      </div>

      {/* ── RIGHT: Intel Panel ── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-950">
        <div className="flex shrink-0 gap-1 border-b border-slate-800 bg-slate-900/40 px-3 pt-2">
          {(['analysis', 'pipeline', 'about'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`rounded-t-lg border-b-2 px-4 py-2 font-mono text-xs capitalize transition ${activeTab === tab
                ? 'border-amber-500 text-amber-400 bg-slate-950'
                : 'border-transparent text-slate-400 hover:text-slate-300'}`}>
              {tab}
            </button>
          ))}
          {activeArtifact && (
            <div className="ml-auto flex items-center gap-1.5 py-2 font-mono text-xs text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {activeArtifact.title.slice(0, 40)}{activeArtifact.title.length > 40 ? '…' : ''}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'analysis' && <ArtifactPanel artifact={activeArtifact} />}

          {activeTab === 'pipeline' && (
            <div className="p-4 space-y-2">
              <div className="mb-4 font-mono text-xs uppercase tracking-widest text-slate-600">Analysis Pipeline</div>
              {PIPELINE.map((step, i) => {
                const isDone = pipeline > i
                const isActive = pipeline === i
                return (
                  <div key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                    isDone ? 'border-emerald-500/20 bg-emerald-500/5' :
                    isActive ? 'border-amber-500/30 bg-amber-500/5' :
                    'border-slate-800 bg-slate-900/30 opacity-40'}`}>
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-mono ${
                      isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      isActive ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-600'}`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={`text-sm ${isDone ? 'text-slate-300' : isActive ? 'text-amber-300' : 'text-slate-600'}`}>{step}</span>
                    {isActive && (
                      <div className="ml-auto flex gap-1">
                        {[0,1,2].map(j => (
                          <div key={j} className="h-1 w-1 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                        ))}
                      </div>
                    )}
                    {isDone && <span className="ml-auto font-mono text-xs text-slate-600">done</span>}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="p-4 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                <div className="mb-2 font-semibold text-slate-200">ZoneWise AI</div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Florida real estate intelligence across all 67 counties. 10.5M+ parcels, 5,395 zoning districts, 128-KPI scoring.
                </p>
              </div>
              {[
                { label: 'Counties', val: '67 Florida' },
                { label: 'Parcels', val: '10.5M+' },
                { label: 'Zoning Districts', val: '5,395' },
                { label: 'KPIs per Property', val: '128' },
                { label: 'Data Sources', val: 'FDOR · BCPAO · FEMA · Census' },
                { label: 'AI Model', val: 'Claude Sonnet' },
                { label: 'Auction Coverage', val: '⚖️ Foreclosure + 🏛 Tax Deed' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                  <span className="text-xs text-slate-400">{r.label}</span>
                  <span className="font-mono text-xs text-slate-300">{r.val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
