'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

const DISCLOSURE_VERSION = 'v1-2026-08-15'

export default function SmsConsentOnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!phone.trim()) {
      setError('Enter a phone number, or choose Skip below.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/consent/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          consent,
          disclosureVersion: DISCLOSURE_VERSION,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Could not save your preference. Try again.')
      }
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSkip() {
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#0f172a', borderRadius: '12px', padding: '32px', border: '1px solid #1e293b' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          Stay in the loop
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}. Want text alerts for matching deals?
          Totally optional — you can also do this later from account settings.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>
            Mobile number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px',
              border: '1px solid #334155', backgroundColor: '#1e293b',
              color: '#f8fafc', fontSize: '14px', marginBottom: '16px',
            }}
          />

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: '3px' }}
            />
            <span style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.5 }}>
              I agree to receive SMS text messages from ZoneWise.AI about auctions, deals, and
              account updates. Message &amp; data rates may apply. Message frequency varies.
              Consent is not a condition of using ZoneWise.AI. Reply STOP to opt out, HELP for help.
            </span>
          </label>

          {error && (
            <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={submitting || !consent}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none',
                backgroundColor: consent ? '#F59E0B' : '#334155',
                color: consent ? '#020617' : '#64748b',
                fontWeight: 600, fontSize: '14px',
                cursor: consent && !submitting ? 'pointer' : 'not-allowed',
              }}
            >
              {submitting ? 'Saving...' : 'Save & continue'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              style={{
                padding: '10px 16px', borderRadius: '8px',
                border: '1px solid #334155', backgroundColor: 'transparent',
                color: '#94a3b8', fontSize: '14px', cursor: 'pointer',
              }}
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
