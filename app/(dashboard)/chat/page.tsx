import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import ChatWidget from '@/components/ChatWidget'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Chat · ZoneWise.AI',
  description: 'Ask ZoneWise AI about any Florida property, zoning rule, or auction across all 67 counties.',
}

export default async function ChatPage() {
  // Server-side auth check — same pattern as all protected pages
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?redirectedFrom=/chat')
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      {/* Page header */}
      <div className="shrink-0 border-b border-slate-800 bg-slate-900/80 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-slate-200">AI Analyst</h1>
          <p className="text-xs text-slate-500">67 FL Counties · 10.5M Parcels · 128 KPIs · Claude Sonnet</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono text-xs text-slate-400">
            ⚖️ Foreclosure
          </span>
          <span className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono text-xs text-slate-400">
            🏛 Tax Deed
          </span>
        </div>
      </div>

      {/* Full-height chat widget — token passed server-side, no client guessing */}
      <div className="flex-1 overflow-hidden p-4">
        <ChatWidget authToken={session.access_token} />
      </div>
    </div>
  )
}
