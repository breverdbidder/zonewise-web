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

export default function ChatPanel({
  messages,
  onSendMessage,
  activeSession,
  artifacts,
  onSelectArtifact
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
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
    
    // Simulate typing indicator
    setTimeout(() => setIsTyping(false), 2000)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }
  
  const exampleQueries = [
    { icon: '🏠', text: 'What are the setbacks for R-1 in Satellite Beach?' },
    { icon: '🏢', text: 'Can I build a 4-story building in Melbourne Beach?' },
    { icon: '📊', text: 'Compare C-1 and C-2 zones in Palm Bay' },
    { icon: '🏘️', text: 'What zones allow multi-family housing in Cocoa Beach?' },
    { icon: '📍', text: 'Show me all residential zones in Brevard County' },
    { icon: '📋', text: 'What permits do I need for a home addition in Titusville?' }
  ]
  
  return (
    <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
      {/* Chat Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          <h2 className="font-medium text-slate-200">
            {activeSession?.title || 'New Conversation'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            {messages.length} messages
          </span>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="max-w-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-teal-500/20">
                <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-100 mb-2">
                Brevard County Zoning Intelligence
              </h2>
              <p className="text-slate-400 mb-8">
                Query setbacks, building heights, permitted uses, and more across all 17 jurisdictions.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {exampleQueries.map((query, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(query.text)}
                    className="flex items-start gap-3 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-teal-500/30 rounded-xl text-left transition-all group"
                  >
                    <span className="text-xl">{query.icon}</span>
                    <span className="text-sm text-slate-300 group-hover:text-slate-100">
                      {query.text}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full" />
                  <span>301 Districts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full" />
                  <span>10,092 Polygons</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full" />
                  <span>17 Jurisdictions</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {messages.map((message, idx) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Z</span>
                      </div>
                      <span className="text-xs text-slate-500">ZoneWise.AI</span>
                    </div>
                  )}
                  
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-teal-600 text-white rounded-br-md'
                        : 'bg-slate-800 text-slate-100 rounded-bl-md border border-slate-700'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                  
                  {/* Artifact indicators */}
                  {message.artifacts && message.artifacts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.artifacts.map((artifact) => (
                        <button
                          key={artifact.id}
                          onClick={() => onSelectArtifact(artifact)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
                        >
                          <ArtifactIcon type={artifact.type} />
                          <span>{artifact.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className={`mt-1 text-xs text-slate-500 ${message.role === 'user' ? 'text-right' : ''}`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Z</span>
                  </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about zoning in Brevard County..."
            rows={1}
            className="w-full px-4 py-3 pr-24 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <button
              type="button"
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Attach file"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-slate-500 mt-2">
          ⚠️ Information for guidance only. Always verify with the local Planning Department.
        </p>
      </div>
    </div>
  )
}

function ArtifactIcon({ type }: { type: string }) {
  switch (type) {
    case 'map':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    case 'table':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    case 'report':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
  }
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date)
}
