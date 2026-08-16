'use client'

import { useState, useRef, useEffect } from 'react'
import type { SiteData } from '@/types/feasibility'
import { COLORS } from '@/lib/feasibility/constants'
import { Card, Badge } from './ui'

interface ExportTabProps {
  site: SiteData
}

const QUICK_PROMPTS = [
  {
    icon: '📄',
    label: 'PDF Feasibility Report',
    prompt: (addr: string) =>
      `Generate a PDF feasibility report for ${addr} comparing garden apartment vs townhome scenarios with full pro forma for each.`,
  },
  {
    icon: '📊',
    label: 'Excel Pro Forma',
    prompt: (addr: string) =>
      `Build an Excel development pro forma for ${addr} with sensitivity tables for cap rate, vacancy, and construction cost.`,
  },
  {
    icon: '🖼️',
    label: 'Investor Deck',
    prompt: (addr: string) =>
      `Create a 10-slide investor presentation for ${addr} including site overview, zoning, market, comps, pro forma, and returns summary.`,
  },
  {
    icon: '📋',
    label: 'IC Memo',
    prompt: (addr: string) =>
      `Draft an investment committee memo for ${addr} with executive summary, site analysis, risk factors, and recommendation.`,
  },
  {
    icon: '🔍',
    label: '128-KPI Property Card',
    prompt: (addr: string) =>
      `Run a full 128-KPI property intelligence analysis on ${addr} including FEMA flood, Census neighborhood scores, and BidDeed scoring.`,
  },
]

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function ExportTab({ site }: ExportTabProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [input])

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return
    setError(null)

    const userMsg: ChatMessage = { role: 'user', content: content.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Request failed (${res.status})`)
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response || 'No response received.' },
      ])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send message'
      setError(msg)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${msg}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* LEFT: Chat interface */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ minHeight: 520 }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base font-bold text-slate-900">Generate Reports</span>
          <Badge text="NLP-Powered" color={COLORS.brand} />
          <Badge text="128 KPIs" color={COLORS.accent} />
        </div>

        {/* Chat messages area */}
        <Card className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 380 }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <div className="text-2xl mb-2">💬</div>
                <div className="text-sm font-semibold text-slate-900 mb-1">
                  Ask ZoneWise anything about this property
                </div>
                <div className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Generate feasibility reports, pro formas, investor decks, and IC memos
                  from a single message. Powered by Claude + 128-KPI engine + FEMA + Census data.
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-50 text-slate-800 border border-slate-200'
                  }`}
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse" />
                  Analyzing with 128-KPI engine...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3 flex gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${site.address}...`}
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 disabled:opacity-50 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold border-none cursor-pointer hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </Card>

        {error && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
            {error}. Make sure you&apos;re signed in at{' '}
            <a href="/login" className="underline">
              /login
            </a>
          </div>
        )}
      </div>

      {/* RIGHT: Quick prompts */}
      <div className="w-full lg:w-[280px] flex-shrink-0">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Quick Generate
        </div>
        <div className="space-y-2">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              onClick={() => sendMessage(qp.prompt(site.address))}
              disabled={loading}
              className="w-full text-left bg-white rounded-lg border border-slate-200 px-3.5 py-3 hover:border-teal-300 hover:bg-teal-50/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-sm font-semibold text-slate-900">
                {qp.icon} {qp.label}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                {qp.prompt(site.address).slice(0, 80)}...
              </div>
            </button>
          ))}
        </div>

        <div
          className="mt-4 rounded-lg p-3"
          style={{ background: COLORS.brandLight, border: `1px solid ${COLORS.brand}30` }}
        >
          <div className="text-[10px] font-semibold mb-1" style={{ color: COLORS.brandDark }}>
            How it works
          </div>
          <div className="text-[11px] text-slate-500 leading-relaxed space-y-1">
            <div>1. Type or pick a prompt</div>
            <div>2. Claude queries 10.5M parcels + 128 KPIs</div>
            <div>3. FEMA flood + Census scores auto-computed</div>
            <div>4. Report generated in seconds</div>
          </div>
        </div>

        <div className="mt-3 text-[10px] text-slate-400 leading-relaxed">
          Full split-screen experience with map artifacts available at{' '}
          <a href="/dashboard" className="text-teal-600 underline">
            /dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
