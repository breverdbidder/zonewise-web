import type { Metadata } from 'next'
import ZoningChatbot from '@/components/chat/ZoningChatbot'
import ErrorBoundary from '@/components/ErrorBoundary'
import ZoningDisclaimer from '@/components/ZoningDisclaimer'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Zoning Assistant | ZoneWise.AI',
  description: 'Ask ZoneWise AI about Brevard County zoning codes, permitted uses, setbacks, height limits, and more. Cited answers from our own Supabase data.',
}

export default function ZoningChatPage() {
  return (
    <div className="flex h-full flex-col bg-[#020617]">
      {/* Page header */}
      <div className="shrink-0 border-b border-slate-800 bg-slate-900/80 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-slate-200">AI Zoning Assistant</h1>
          <p className="text-xs text-slate-500">Brevard County · Structured RAG · Cited answers · Gemini Flash</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono text-xs text-slate-400">
            🏛 Zoning
          </span>
          <span className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono text-xs text-slate-400">
            📋 Permitted Uses
          </span>
          <span className="rounded border border-emerald-800 bg-emerald-900/30 px-2 py-1 font-mono text-xs text-emerald-400">
            ✓ Own Data
          </span>
        </div>
      </div>

      {/* Full-height chatbot */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          <ZoningChatbot />
        </ErrorBoundary>
      </div>

      {/* Accuracy disclaimer — hidden when accuracy >= 99% */}
      <ZoningDisclaimer />
    </div>
  )
}
