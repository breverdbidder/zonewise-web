'use client'

import dynamic from 'next/dynamic'
import { Component, type ReactNode } from 'react'

// Error boundary catches client-side JS crashes in ExplorerV2
class ExplorerErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-950">
          <div className="text-center max-w-md px-6">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-white mb-2">Explorer failed to load</h2>
            <p className="text-sm text-slate-400 mb-4">
              {this.state.error.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg font-medium text-sm hover:bg-amber-400 transition-colors"
            >
              Reload Page
            </button>
            <details className="mt-4 text-left">
              <summary className="text-xs text-slate-600 cursor-pointer">Technical details</summary>
              <pre className="mt-2 text-xs text-slate-600 overflow-auto max-h-32 bg-slate-900 p-2 rounded">
                {this.state.error.stack}
              </pre>
            </details>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const ExplorerV2 = dynamic(() => import('@/components/explorer/ExplorerV2'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-950">
      <div className="text-center">
        <div className="text-4xl animate-spin inline-block mb-3">◐</div>
        <p className="text-sm text-slate-400">Loading Explorer V2...</p>
        <p className="text-xs text-slate-600 mt-1">262K+ parcels · Choropleth · AI Chat</p>
      </div>
    </div>
  ),
})

export default function ExplorerLoader() {
  return (
    <ExplorerErrorBoundary>
      <ExplorerV2 />
    </ExplorerErrorBoundary>
  )
}
