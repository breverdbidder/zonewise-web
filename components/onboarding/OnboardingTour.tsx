'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface TourStep {
  title: string
  description: string
  icon: string
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: '🗺️',
    title: 'Welcome to ZoneWise',
    description:
      'Explore 10.8M Florida parcels with AI-powered zoning intelligence. Every county. Every parcel. Every zoning rule — at your fingertips.',
  },
  {
    icon: '📍',
    title: 'Map Explorer',
    description:
      'Click any parcel on the map to see zoning, ownership, and valuation data. Pan and zoom to explore all 67 Florida counties.',
  },
  {
    icon: '💬',
    title: 'Chat with ZoneWise AI',
    description:
      'Ask natural language questions about any property or zone. Try: "Show me R1 zones in Brevard near water" or "What are the setbacks for C-2 in Palm Bay?"',
  },
  {
    icon: '🔧',
    title: 'Layer Controls',
    description:
      'Toggle data layers to customize your view: zoning districts, parcel boundaries, jurisdictions, FEMA flood zones, and more.',
  },
  {
    icon: '🚀',
    title: 'Get Full Access',
    description:
      'Unlock unlimited queries, advanced analytics, 128-KPI property scoring, and foreclosure auction tracking. Upgrade to Pro and move faster than every other investor.',
  },
]

const STORAGE_KEY = 'zonewise_tour_complete'

export function OnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY)
      if (!done) {
        // Small delay so layout renders first
        const t = setTimeout(() => setVisible(true), 800)
        return () => clearTimeout(t)
      }
    } catch {
      // localStorage blocked — don't show tour
    }
  }, [])

  const dismiss = useCallback((completed: boolean) => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, completed ? 'done' : 'skipped')
    } catch {
      // ignore
    }
  }, [])

  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      dismiss(true)
    }
  }, [step, dismiss])

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  if (!visible) return null

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
        onClick={() => dismiss(false)}
        aria-hidden="true"
      />

      {/* Tour card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Onboarding step ${step + 1} of ${TOUR_STEPS.length}`}
        className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm mx-4"
        style={{ maxWidth: '380px' }}
      >
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e3a5f',
            borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(30,58,95,0.4)',
            padding: '28px 24px 20px',
          }}
        >
          {/* Step counter + skip */}
          <div className="flex items-center justify-between mb-5">
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#475569',
                letterSpacing: '0.08em',
              }}
            >
              STEP {step + 1} / {TOUR_STEPS.length}
            </span>
            <button
              onClick={() => dismiss(false)}
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#64748b',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#94a3b8')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = '#64748b')}
            >
              Skip tour ✕
            </button>
          </div>

          {/* Icon */}
          <div
            style={{
              fontSize: '40px',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            {current.icon}
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#f1f5f9',
              marginBottom: '10px',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            {current.title}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: '14px',
              color: '#94a3b8',
              lineHeight: 1.6,
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            {current.description}
          </p>

          {/* Progress dots */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '20px',
            }}
          >
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                style={{
                  width: i === step ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === step ? '#f59e0b' : '#1e3a5f',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {step > 0 && (
              <button
                onClick={prev}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '8px',
                  border: '1px solid #1e3a5f',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  const el = e.target as HTMLElement
                  el.style.borderColor = '#2d5a8f'
                  el.style.color = '#cbd5e1'
                }}
                onMouseLeave={e => {
                  const el = e.target as HTMLElement
                  el.style.borderColor = '#1e3a5f'
                  el.style.color = '#94a3b8'
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={next}
              style={{
                flex: 2,
                padding: '10px 0',
                borderRadius: '8px',
                border: 'none',
                background: '#f59e0b',
                color: '#020617',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'filter 0.15s ease',
              }}
              onMouseEnter={e => ((e.target as HTMLElement).style.filter = 'brightness(1.1)')}
              onMouseLeave={e => ((e.target as HTMLElement).style.filter = 'none')}
            >
              {isLast ? 'Get Started →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
