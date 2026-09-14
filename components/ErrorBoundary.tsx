'use client'

import React from 'react'
import Link from 'next/link'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center bg-[#0B1119] p-8">
          <div className="w-full max-w-md rounded-xl border border-[#1B2737] bg-slate-900/80 p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B2737]">
              <svg className="h-7 w-7 text-[#1A90FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-white">Something went wrong</h2>
            <p className="mb-6 text-sm text-slate-400">
              An unexpected error occurred. Try refreshing or return to the explorer.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReset}
                className="rounded-lg bg-[#1A90FF] px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-[#1A90FF]/90"
              >
                Try Again
              </button>
              <Link
                href="/explorer"
                className="rounded-lg border border-[#1B2737] px-5 py-2 text-sm font-semibold text-slate-300 transition hover:border-[#1A90FF]/50 hover:text-white"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
