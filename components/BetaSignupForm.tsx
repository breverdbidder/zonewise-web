'use client'

import { useState } from 'react'

export default function BetaSignupForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message || 'You\'re on the list!')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
        placeholder="you@example.com"
        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-zw-navy focus:border-transparent"
        disabled={status === 'loading'}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-zw-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-zw-orange/90 transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {status === 'loading' ? 'Joining...' : 'Get Beta Access'}
      </button>
      {status === 'success' && (
        <p className="sm:absolute sm:bottom-0 sm:translate-y-full text-emerald-600 text-sm mt-2 sm:mt-0 sm:pt-2">{message}</p>
      )}
      {status === 'error' && (
        <p className="sm:absolute sm:bottom-0 sm:translate-y-full text-red-500 text-sm mt-2 sm:mt-0 sm:pt-2">{message}</p>
      )}
    </form>
  )
}
