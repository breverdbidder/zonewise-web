'use client'

import { useCallback, useState } from 'react'
import { isValidEmail } from '@/lib/gate/client'

// Same inline-field UX as the ZoneWise Voice Assistant email gate
// (components/chat/VoiceZoningAssistant.tsx) — a field + submit next to the
// triggering action, not a modal that interrupts the whole page.
interface EmailGateInlineProps {
  onSubmit: (email: string) => unknown | Promise<unknown>
  ctaLabel?: string
  message?: string
  className?: string
}

export default function EmailGateInline({ onSubmit, ctaLabel = 'Unlock', message, className }: EmailGateInlineProps) {
  const [email, setEmail] = useState('')
  const [err, setErr] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = useCallback(async () => {
    const trimmed = email.trim()
    if (!isValidEmail(trimmed)) {
      setErr(true)
      return
    }
    setErr(false)
    setSubmitting(true)
    await onSubmit(trimmed)
    setSubmitting(false)
  }, [email, onSubmit])

  return (
    <div className={className ?? 'mt-3 flex flex-col gap-1.5 max-w-md'}>
      {message && <p className="text-xs text-[rgb(var(--zw-ink2))]">{message}</p>}
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="your@email.com"
            className="w-full bg-[rgb(var(--zw-page))] border border-[rgb(var(--zw-border2))] rounded px-3 py-2 text-sm text-[rgb(var(--zw-ink2))] placeholder:text-[rgb(var(--zw-ink2))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--zw-brand))]"
          />
          {err && <p className="text-xs text-red-400 mt-1">Enter a valid email to continue.</p>}
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          className="px-4 py-2 rounded bg-[rgb(var(--zw-brand))] hover:bg-[#fbbf24] text-[rgb(var(--zw-ink))] text-sm font-bold disabled:opacity-50 shrink-0"
        >
          {submitting ? '…' : ctaLabel}
        </button>
      </div>
    </div>
  )
}
