import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import ChatWidget from '@/components/ChatWidget'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Chat · ZoneWise.AI',
  description: 'Ask ZoneWise AI about any Florida property, zoning rule, or auction across all 67 counties.',
}

export default async function ChatPage() {
  // Clerk middleware protects this route — auth() provides the token
  let token: string | null = null
  try {
    const { getToken } = await auth()
    token = await getToken()
  } catch {
    // Clerk not configured — proceed without auth token
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

      {/* Full-height chat widget */}
      <div className="flex-1 overflow-hidden p-4">
        <ChatWidget authToken={token || undefined} />
      </div>
    </div>
  )
}
