'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const STARTER_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm ZoneWise AI. I can analyze any Florida property — zoning, liens, auction history, comparable sales, and your max bid. What property are you looking at?",
    timestamp: new Date(),
  },
]

const SUGGESTED_PROMPTS = [
  'Analyze 1234 Brevard Ave, Melbourne FL',
  'Show foreclosures in Miami-Dade this week',
  'What is the zoning for parcel 24-37-01-00',
  'Compare auctions in Hillsborough vs Pinellas',
]

export default function AppShellPage() {
  const [messages, setMessages] = useState<Message[]>(STARTER_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text?: string) => {
    const content = text || input.trim()
    if (!content) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Analyzing "${content}"...\n\nFor full AI analysis with 298 KPIs, auction history, lien waterfall, and BidWise score, please connect your account.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden">

      {/* Mobile tab switcher */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-[#162D4A] border-t border-slate-700/50">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat' ? 'text-zw-orange border-t-2 border-zw-orange' : 'text-slate-400'
          }`}
        >
          AI Chat
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'map' ? 'text-zw-orange border-t-2 border-zw-orange' : 'text-slate-400'
          }`}
        >
          Map
        </button>
      </div>

      {/* LEFT: Chat Panel — 380px fixed on desktop */}
      <div
        className={`
          flex flex-col w-full md:w-[380px] md:flex-shrink-0
          bg-[#162D4A] border-r border-slate-700/50
          md:flex
          ${activeTab === 'chat' ? 'flex' : 'hidden md:flex'}
        `}
      >
        {/* Chat header */}
        <div className="shrink-0 px-4 py-3 border-b border-slate-700/50 bg-[#1E3A5F]/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold text-white">AI Analyst</h1>
              <p className="text-xs text-slate-400 mt-0.5">67 Counties · 245K Auctions · AI-Powered</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400">Live</span>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex gap-3 mt-3">
            <Link
              href="/chat"
              className="text-xs text-slate-400 hover:text-zw-orange transition-colors border border-slate-600 hover:border-zw-orange/40 px-2 py-1 rounded"
            >
              Full Chat →
            </Link>
            <Link
              href="/explorer"
              className="text-xs text-slate-400 hover:text-zw-orange transition-colors border border-slate-600 hover:border-zw-orange/40 px-2 py-1 rounded"
            >
              Explorer →
            </Link>
            <Link
              href="/auctions"
              className="text-xs text-slate-400 hover:text-zw-orange transition-colors border border-slate-600 hover:border-zw-orange/40 px-2 py-1 rounded"
            >
              Calendar →
            </Link>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-zw-orange text-white'
                  : 'bg-zw-navy text-white border border-zw-orange/30'
              }`}>
                {msg.role === 'user' ? 'U' : 'Z'}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zw-orange/20 text-white border border-zw-orange/20'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/50'
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-zw-navy border border-zw-orange/30 flex items-center justify-center text-xs font-bold text-white">Z</div>
              <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p)}
                className="text-xs bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:border-zw-orange/40 hover:text-zw-orange px-3 py-1.5 rounded-full transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="shrink-0 px-4 py-3 border-t border-slate-700/50 bg-[#162D4A]">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any Florida property..."
              rows={1}
              className="flex-1 bg-slate-800/60 border border-slate-600/50 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-zw-orange/50 focus:ring-1 focus:ring-zw-orange/20 transition-colors"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="bg-zw-orange hover:bg-zw-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-all duration-200 hover:scale-105 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">Press Enter to send · Shift+Enter for newline</p>
        </div>
      </div>

      {/* RIGHT: Map Panel — flex */}
      <div
        className={`
          flex-1 relative
          md:flex
          ${activeTab === 'map' ? 'flex' : 'hidden md:flex'}
          flex-col bg-slate-900
          pb-16 md:pb-0
        `}
      >
        {/* Map header */}
        <div className="shrink-0 px-6 py-3 border-b border-slate-700/50 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-200">Florida Auction Map</h2>
            <span className="text-xs bg-zw-orange/10 text-zw-orange border border-zw-orange/20 px-2 py-0.5 rounded-full">67 Counties</span>
          </div>
          <div className="flex gap-2">
            <Link
              href="/explorer"
              className="text-xs bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              Full Explorer →
            </Link>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="flex-1 relative overflow-hidden">
          {/* Animated grid background */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(30,58,95,0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(30,58,95,0.5) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Simulated county dots */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-80 h-96">
              {/* Simulate Florida county clusters */}
              {[
                { x: 20, y: 5, r: 4, h: true },   // Panhandle
                { x: 35, y: 8, r: 3, h: false },
                { x: 55, y: 3, r: 3, h: false },
                { x: 70, y: 20, r: 5, h: true },   // NE FL
                { x: 60, y: 35, r: 6, h: true },   // Central
                { x: 45, y: 40, r: 5, h: false },
                { x: 30, y: 50, r: 5, h: true },   // Tampa Bay
                { x: 55, y: 55, r: 4, h: false },
                { x: 70, y: 50, r: 5, h: true },   // East Coast
                { x: 25, y: 65, r: 4, h: false },
                { x: 40, y: 70, r: 3, h: false },
                { x: 60, y: 70, r: 4, h: true },   // Palm Beach
                { x: 30, y: 80, r: 5, h: true },   // Fort Myers
                { x: 55, y: 82, r: 6, h: true },   // Broward/Miami
                { x: 35, y: 92, r: 3, h: false },  // South
                { x: 20, y: 95, r: 2, h: false },  // Keys
              ].map((dot, i) => (
                <div
                  key={i}
                  className={`absolute rounded-full transition-all duration-300 ${
                    dot.h
                      ? 'bg-zw-orange/80 animate-pulse'
                      : 'bg-zw-navy/60'
                  }`}
                  style={{
                    left: `${dot.x}%`,
                    top: `${dot.y}%`,
                    width: `${dot.r * 6}px`,
                    height: `${dot.r * 6}px`,
                    animationDelay: `${i * 200}ms`,
                    boxShadow: dot.h ? '0 0 12px rgba(245,158,11,0.4)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Center overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-8 py-6">
              <div className="w-12 h-12 bg-zw-navy/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-zw-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Map Loading</h3>
              <p className="text-slate-400 text-sm mb-4">Interactive Mapbox choropleth<br />67 Florida counties</p>
              <Link
                href="/explorer"
                className="inline-flex items-center gap-2 bg-zw-orange hover:bg-zw-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors pointer-events-auto"
              >
                Open Full Explorer
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Map controls overlay */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            {['+', '−', '⊕'].map((ctrl, i) => (
              <button
                key={i}
                className="w-9 h-9 bg-slate-800/80 border border-slate-700/50 text-slate-300 hover:text-white hover:border-zw-orange/30 rounded-lg flex items-center justify-center text-sm font-bold transition-colors backdrop-blur-sm"
              >
                {ctrl}
              </button>
            ))}
          </div>

          {/* County info overlay */}
          <div className="absolute top-4 right-4 bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-3 backdrop-blur-sm">
            <div className="text-xs text-slate-400 mb-2">Active Auctions</div>
            <div className="space-y-1">
              {[
                { county: 'Miami-Dade', count: 234 },
                { county: 'Broward', count: 189 },
                { county: 'Hillsborough', count: 156 },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-300">{c.county}</span>
                  <span className="text-zw-orange font-bold">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
