'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useClickTracker } from './ClickTracker'
import HybridPreview from './HybridPreview'
import BuyBoxForm from './BuyBoxForm'

const COUNTIES_KEY = 'zw_clicked_counties'

export default function ConversionModal() {
  const { isModal, resetClicks } = useClickTracker()
  const [counties, setCounties] = useState<string[]>([])

  useEffect(() => {
    if (isModal) {
      const stored = sessionStorage.getItem(COUNTIES_KEY)
      if (stored) {
        try {
          setCounties(JSON.parse(stored) as string[])
        } catch {
          setCounties([])
        }
      }
    }
  }, [isModal])

  if (!isModal) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 50, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-5xl mx-4 rounded-xl overflow-hidden"
        style={{
          background: '#020617',
          border: '1px solid #F59E0B',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Close button */}
        <button
          onClick={resetClicks}
          className="absolute top-4 right-4 flex items-center justify-center rounded-full z-10"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <X size={16} />
        </button>

        {/* Split layout */}
        <div className="flex" style={{ minHeight: 0, flex: 1, overflow: 'hidden' }}>
          {/* Left 60% — HybridPreview */}
          <div
            className="overflow-y-auto"
            style={{
              flex: '0 0 60%',
              borderRight: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <HybridPreview counties={counties} />
          </div>

          {/* Right 40% — BuyBoxForm */}
          <div
            className="overflow-y-auto"
            style={{ flex: '0 0 40%' }}
          >
            <BuyBoxForm />
          </div>
        </div>
      </div>
    </div>
  )
}
