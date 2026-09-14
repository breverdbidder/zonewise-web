import type { Metadata } from 'next'
import ZoningChatbot from '@/components/chat/ZoningChatbot'
import VoiceZoningAssistant from '@/components/chat/VoiceZoningAssistant'
import ErrorBoundary from '@/components/ErrorBoundary'
import ZoningDisclaimer from '@/components/ZoningDisclaimer'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Zoning Assistant | ZoneWise.AI',
  description: 'Ask ZoneWise AI about Brevard County zoning codes, permitted uses, setbacks, height limits, and more.',
}

export default function ZoningChatPage() {
  return (
    <div className="flex h-full flex-col bg-[rgb(var(--zw-page))] overflow-y-auto">
      {/* Bold voice assistant banner -- the primary entry point */}
      <VoiceZoningAssistant />

      {/* Dify migration notice */}
      <Card className="mx-4 mt-3 border-[rgb(var(--zw-brand)/0.2)] bg-[rgb(var(--zw-brand)/0.05)] p-3">
        <div className="flex items-center gap-2 text-xs text-[rgb(var(--zw-brand))]">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>Coming soon:</strong> Advanced multi-agent chat powered by Dify.AI — with memory, tool use, and multi-county context.
          </span>
          <Badge variant="outline" className="ml-auto border-[rgb(var(--zw-brand)/0.3)] text-[rgb(var(--zw-brand))] text-[10px]">
            Dify
          </Badge>
        </div>
      </Card>

      {/* Existing zoning chatbot */}
      <div className="shrink-0 border-b border-[rgb(var(--zw-border2))] bg-[rgb(var(--zw-page)/0.8)] px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-[rgb(var(--zw-ink2))]">AI Zoning Assistant</h1>
          <p className="text-xs text-[rgb(var(--zw-ink2))]">Brevard County · Structured RAG · Cited answers · Gemini Flash</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[rgb(var(--zw-border2))] bg-[rgb(var(--zw-card)/0.6)] px-2 py-1 font-mono text-xs text-[rgb(var(--zw-ink2))]">
            🏛 Zoning
          </span>
          <span className="rounded border border-emerald-800 bg-emerald-900/30 px-2 py-1 font-mono text-xs text-emerald-400">
            ✓ Own Data
          </span>
        </div>
      </div>

      <ErrorBoundary>
        <ZoningChatbot />
      </ErrorBoundary>
      <ZoningDisclaimer />
    </div>
  )
}
