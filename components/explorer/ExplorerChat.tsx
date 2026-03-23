'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { FREE_CHAT_MESSAGES } from '@/lib/explorer/constants'
import { handleMapResponse, stripMapActions } from '@/lib/explorer/chat-actions'
import { trackEvent } from '@/lib/explorer/tracking'
import SearchChips from './SearchChips'
import type { ExplorerMapHandle } from './ExplorerMap'

interface Message {
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

interface Props {
  mapRef: React.RefObject<ExplorerMapHandle | null>
  chatCount: number
  onChatCountChange: (n: number) => void
  onGate: () => void
}

export default function ExplorerChat({ mapRef, chatCount, onChatCountChange, onGate }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return

    // Gate check
    if (chatCount >= FREE_CHAT_MESSAGES) {
      onGate()
      return
    }

    const userMsg: Message = { role: 'user', content: text }
    const pendingMsg: Message = { role: 'assistant', content: '', pending: true }
    setMessages(prev => [...prev, userMsg, pendingMsg])
    setInput('')
    setStreaming(true)
    onChatCountChange(chatCount + 1)
    trackEvent({ event: 'chat_message' })

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/explorer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: fullText, pending: true }
          return next
        })
      }

      // Dispatch map actions from full response
      handleMapResponse(fullText, mapRef)

      // Finalize message (strip action commands from display)
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: stripMapActions(fullText) }
        return next
      })
    } catch (err) {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        }
        return next
      })
    } finally {
      setStreaming(false)
    }
  }, [messages, streaming, chatCount, onChatCountChange, onGate, mapRef])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const remaining = Math.max(0, FREE_CHAT_MESSAGES - chatCount)

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-base">🤖</div>
        <div>
          <div className="text-sm font-bold text-white">ZoneWise Explorer AI</div>
          <div className="text-[11px] text-slate-500">Brevard County · 262K parcels</div>
        </div>
        <div className="ml-auto text-[10px] text-slate-600 bg-slate-900 border border-slate-800 rounded px-2 py-1">
          {remaining}/{FREE_CHAT_MESSAGES} free
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="py-6 text-center">
            <div className="text-4xl mb-3 opacity-20">💬</div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[220px] mx-auto">
              Ask about any Brevard property, zone, or market trend.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                msg.role === 'user'
                  ? 'max-w-[85%] bg-amber-500/15 border border-amber-500/25 rounded-xl rounded-tr-sm px-3 py-2 text-sm text-white'
                  : 'max-w-[95%] bg-slate-900 border border-slate-800 rounded-xl rounded-tl-sm px-3 py-2 text-sm text-slate-200'
              }
            >
              {msg.role === 'assistant' ? (
                <>
                  <ReactMarkdown className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                    {msg.content || (msg.pending ? '' : '')}
                  </ReactMarkdown>
                  {msg.pending && (
                    <span className="inline-block w-1.5 h-4 bg-amber-400 animate-pulse ml-0.5 align-middle" />
                  )}
                </>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Chips */}
      {messages.length === 0 && (
        <div className="px-3 pb-2 shrink-0">
          <SearchChips onSelect={sendMessage} max={4} layout="grid" />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={remaining > 0 ? 'Ask anything about Brevard...' : 'Upgrade for unlimited chat'}
            disabled={streaming || remaining === 0}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim() || remaining === 0}
            className="px-3 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-bold hover:brightness-110 disabled:opacity-40 transition-all shrink-0"
          >
            {streaming ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
            ) : '↑'}
          </button>
        </div>
        {remaining === 0 && (
          <p className="text-[11px] text-amber-500/70 mt-1.5 text-center">
            Free limit reached ·{' '}
            <button type="button" onClick={onGate} className="underline">Upgrade to Pro</button>
          </p>
        )}
      </form>
    </div>
  )
}
