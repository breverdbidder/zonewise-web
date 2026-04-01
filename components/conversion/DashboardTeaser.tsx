'use client'

import React from 'react'
import { Lock } from 'lucide-react'
import { useClickTracker } from './ClickTracker'

interface DashboardTeaserProps {
  onCTAClick?: () => void
}

export default function DashboardTeaser({ onCTAClick }: DashboardTeaserProps) {
  const { isTeaser, clickCount } = useClickTracker()
  const filledDots = Math.min(clickCount, 5)

  return (
    <div
      className="fixed top-0 right-0 h-full z-40 flex items-center"
      style={{
        transform: isTeaser ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          width: '280px',
          height: '100%',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: 'rgba(30, 58, 95, 0.85)',
          borderLeft: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          gap: '1.25rem',
        }}
      >
        {/* Lock icon */}
        <div className="flex justify-center">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: '56px',
              height: '56px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
            }}
          >
            <Lock size={24} color="#F59E0B" />
          </div>
        </div>

        {/* Heading */}
        <h3
          className="text-center font-semibold"
          style={{ color: '#FFFFFF', fontSize: '1.125rem', lineHeight: '1.4' }}
        >
          Unlock Full Dashboard
        </h3>

        {/* Subtitle */}
        <p
          className="text-center text-sm"
          style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}
        >
          You&apos;re 2 clicks away from your personalized deal dashboard
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: i < filledDots ? '#F59E0B' : 'rgba(255,255,255,0.2)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={onCTAClick}
          className="w-full font-semibold rounded-lg py-3 text-sm"
          style={{
            background: '#F59E0B',
            color: '#020617',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
        >
          See Your Dashboard Preview
        </button>
      </div>
    </div>
  )
}
