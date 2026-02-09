'use client'

import { useState, useRef, useEffect } from 'react'
import { Message, Artifact, Session } from '@/types'

interface ChatPanelProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  activeSession: Session | null
  artifacts: Artifact[]
  onSelectArtifact: (artifact: Artifact) => void
}

export default function ChatPanel({ messages, onSendMessage, activeSession, artifacts, onSelectArtifact }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return
    onSendMessage(input.trim())
    setInput('')
    setIsTyping(true)
    setTimeout(() => setIsTyping(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) }
  }

  const exampleQueries = [
    { icon: '\u{1F3E0}', text: 'What are the setbacks for R-1 in Jacksonville?' },
    { icon: '\u{1F3E2}', text: 'Can I build a 4-story building in Miami Beach?' },
    { icon: '\u{1F4CA}', text: 'Compare C-1 and C-2 zones in Tampa' },
    { icon: '\u{1F3D8}\uFE0F', text: 'What zones allow multi-family housing in Orlando?' },
    { icon: '\u{1F4CD}', text: 'Show me all residential zones in Florida' },
    { icon: '\u{1F4CB}', text: 'What permits do I need for a home addition in Fort Lauderdale?' }
  ]

  return (
    <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-slate-800 transition-colors">
      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-zw-navy-500 rounded-full animate-pulse" />
          <h2 className="font-medium text-gray-800 dark:text-slate-200">{activeSession?.title || 'New Conversation'}</h2>
        </div>
        <span className="text-xs text-gray-400 dark:text-slate-500 font-mono">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="max-w-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-zw-navy-500/20 to-zw-navy-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zw-navy-500/20">
                <svg className="w-8 h-8 text-zw-navy-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">Florida Real Estate Intelligence</h2>
              <p className="text-gray-500 dark:text-slate-400 mb-8">Query zoning, foreclosures, tax deeds, and more across all 67 Florida counties.</p>
              <div className="grid grid-cols-2 gap-3">
                {exampleQueries.map((query, i) => (
                  <button key={i} onClick={() => setInput(query.text)}
                    className="flex items-start gap-3 p-4 bg-gray-100/70 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700/50 hover:border-zw-navy-300 dark:hover:border-zw-navy-500/30 rounded-xl text-left transition-all group">
                    <span className="text-xl">{query.icon}</span>
                    <span className="text-sm text-gray-600 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100">{query.text}</span>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400 dark:text-slate-500">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-zw-navy-500 rounded-full" /><span>67 Counties</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-zw-navy-500 rounded-full" /><span>298 KPIs</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-zw-navy-500 rounded-full" /><span>10.8M Parcels</span></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-zw-navy-500 to-zw-navy-700 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Z</span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-slate-500">ZoneWise.AI</span>
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-zw-navy-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-bl-md border border-gray-200 dark:border-slate-700'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                  </div>
                  {message.artifacts && message.artifacts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.artifacts.map((artifact) => (
                        <button key={artifact.id} onClick={() => onSelectArtifact(artifact)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-800/50 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-600 dark:text-slate-300 transition-colors">
                          <span>{artifact.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={`mt-1 text-xs text-gray-400 dark:text-slate-500 ${message.role === 'user' ? 'text-right' : ''}`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-zw-navy-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-zw-navy-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-zw-navy-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 transition-colors">
        <form onSubmit={handleSubmit} className="relative">
          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask about real estate across Florida..." rows={1}
            className="w-full px-4 py-3 pr-24 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-zw-navy-500/50 focus:border-zw-navy-500 transition-all" />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <button type="button" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Attach file">
              <svg className="w-5 h-5 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button type="submit" disabled={!input.trim() || isTyping}
              className="p-2 bg-zw-navy-600 hover:bg-zw-navy-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-2">Information for guidance only. Always verify with the local Planning Department.</p>
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
}
