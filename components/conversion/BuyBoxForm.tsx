'use client'

import React, { useState } from 'react'
import { MapPin } from 'lucide-react'

const TOP_COUNTIES = [
  'Brevard', 'Miami-Dade', 'Broward', 'Palm Beach', 'Hillsborough',
  'Orange', 'Pinellas', 'Duval', 'Lee', 'Sarasota',
]

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Land']
const ZONING_CODES = ['R-1', 'R-2', 'C-1', 'C-2', 'I-1']
const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'instant', label: 'Instant' },
]

interface FormState {
  counties: string[]
  minPrice: string
  maxPrice: string
  propertyTypes: string[]
  zoningCodes: string[]
  alertEmail: boolean
  telegramHandle: string
  frequency: string
}

export default function BuyBoxForm() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    counties: [],
    minPrice: '',
    maxPrice: '',
    propertyTypes: [],
    zoningCodes: [],
    alertEmail: true,
    telegramHandle: '',
    frequency: 'daily',
  })

  function toggleItem(field: 'counties' | 'propertyTypes' | 'zoningCodes', value: string) {
    setForm((prev) => {
      const arr = prev[field]
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }

  async function handleSubscribe() {
    setLoading(true)
    try {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // silently fail for now
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    // Control-boundary fix (issue #20109 pattern): resting border was
    // rgba(255,255,255,0.15) (~1.3:1 vs bg, fails WCAG 2.1 SC 1.4.11).
    // hsl(217.2 20% 45%) is the fixed --input token from app/globals.css
    // (~3.82:1 vs background) — hardcoded here since this component uses
    // inline styles, not Tailwind classes, so border-input doesn't apply.
    border: '1px solid hsl(217.2, 20%, 45%)',
    borderRadius: '6px',
    color: '#FFFFFF',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    // Resting (inactive) border fixed from rgba(255,255,255,0.15) to the
    // --input token equivalent (hsl(217.2 20% 45%), ~3.82:1 vs background)
    // per issue #20109 pattern — active state (amber) untouched.
    border: active ? '1px solid rgb(var(--zw-brand))' : '1px solid hsl(217.2, 20%, 45%)',
    background: active ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
    color: active ? 'rgb(var(--zw-brand))' : 'rgba(255,255,255,0.7)',
    transition: 'all 0.15s',
    userSelect: 'none',
  })

  return (
    <div
      className="flex flex-col h-full"
      style={{ color: '#FFFFFF', padding: '2rem', background: 'rgba(2, 6, 23, 0.6)' }}
    >
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className="flex items-center justify-center rounded-full text-xs font-bold"
                style={{
                  width: '28px',
                  height: '28px',
                  flexShrink: 0,
                  background: s <= step ? 'rgb(var(--zw-brand))' : 'rgba(255,255,255,0.1)',
                  color: s <= step ? 'rgb(var(--zw-page))' : 'rgba(255,255,255,0.5)',
                }}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    background: s < step ? 'rgb(var(--zw-brand))' : 'rgba(255,255,255,0.1)',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {step === 1 && 'Step 1 of 3 — Geography'}
          {step === 2 && 'Step 2 of 3 — Deal Criteria'}
          {step === 3 && 'Step 3 of 3 — Alert Preferences'}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold" style={{ color: 'rgb(var(--zw-brand))' }}>Select Counties</h3>
            <div className="flex flex-wrap gap-2">
              {TOP_COUNTIES.map((county) => (
                <button
                  key={county}
                  style={chipStyle(form.counties.includes(county))}
                  onClick={() => toggleItem('counties', county)}
                >
                  {county}
                </button>
              ))}
            </div>

            <h3 className="font-semibold mt-2" style={{ color: 'rgb(var(--zw-brand))' }}>Map View</h3>
            <div
              className="rounded-lg flex items-center justify-center gap-2"
              style={{
                height: '160px',
                background: 'rgb(var(--zw-elev))',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.875rem',
              }}
            >
              <MapPin size={16} color="rgba(245, 158, 11, 0.5)" />
              Interactive map coming soon
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold" style={{ color: 'rgb(var(--zw-brand))' }}>Price Range</h3>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="$0"
                  style={inputStyle}
                  value={form.minPrice}
                  onChange={(e) => setForm((p) => ({ ...p, minPrice: e.target.value }))}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="$500,000"
                  style={inputStyle}
                  value={form.maxPrice}
                  onChange={(e) => setForm((p) => ({ ...p, maxPrice: e.target.value }))}
                />
              </div>
            </div>

            <h3 className="font-semibold" style={{ color: 'rgb(var(--zw-brand))' }}>Property Types</h3>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  style={chipStyle(form.propertyTypes.includes(type))}
                  onClick={() => toggleItem('propertyTypes', type)}
                >
                  {type}
                </button>
              ))}
            </div>

            <h3 className="font-semibold" style={{ color: 'rgb(var(--zw-brand))' }}>Zoning Codes</h3>
            <div className="flex flex-wrap gap-2">
              {ZONING_CODES.map((code) => (
                <button
                  key={code}
                  style={chipStyle(form.zoningCodes.includes(code))}
                  onClick={() => toggleItem('zoningCodes', code)}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold" style={{ color: 'rgb(var(--zw-brand))' }}>Alert Channels</h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm((p) => ({ ...p, alertEmail: !p.alertEmail }))}
                style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: '999px',
                  background: form.alertEmail ? 'rgb(var(--zw-brand))' : 'rgba(255,255,255,0.15)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: form.alertEmail ? '21px' : '3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    transition: 'left 0.2s',
                  }}
                />
              </div>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Email alerts
              </span>
            </label>

            <div>
              <label className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Telegram Handle (optional)
              </label>
              <input
                type="text"
                placeholder="@username"
                style={inputStyle}
                value={form.telegramHandle}
                onChange={(e) => setForm((p) => ({ ...p, telegramHandle: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Alert Frequency
              </label>
              <select
                style={{ ...inputStyle, appearance: 'none' }}
                value={form.frequency}
                onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-4">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
          >
            Back
          </button>
        )}

        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'rgb(var(--zw-brand))', color: 'rgb(var(--zw-brand-ink))', border: 'none', cursor: 'pointer' }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: loading ? 'rgba(245, 158, 11, 0.5)' : 'rgb(var(--zw-brand))',
              color: 'rgb(var(--zw-brand-ink))',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Redirecting...' : 'Subscribe for $99/mo'}
          </button>
        )}
      </div>
    </div>
  )
}
