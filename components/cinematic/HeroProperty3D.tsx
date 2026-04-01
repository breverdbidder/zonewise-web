"use client"

import React, { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'

// Dynamically import the Canvas component with SSR disabled.
// This prevents @react-three/fiber from being included in the server bundle,
// which eliminates the ReactCurrentBatchConfig hydration crash in Next.js.
const HeroProperty3DCanvas = dynamic(
  () => import('./HeroProperty3DCanvas'),
  { ssr: false }
)

// ── CSS floating UI cards (BID / SKIP / price) ────────────────────

interface BadgesProps {
  show: boolean
}

function FloatingUI({ show }: BadgesProps) {
  return (
    <>
      {/* BID badge — right */}
      <div
        className="absolute z-20 pointer-events-none transition-all duration-700"
        style={{
          top: '28%',
          right: '7%',
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateX(50px)',
          animation: show ? 'heroFloat 3s ease-in-out infinite' : 'none',
        }}
      >
        <div style={{
          background: '#16a34a',
          color: '#fff',
          borderRadius: '8px',
          padding: '8px 18px',
          fontWeight: 700,
          fontSize: '13px',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '0 4px 20px rgba(22,163,74,0.55)',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
        }}>
          ✓ BID
        </div>
      </div>

      {/* SKIP badge — left */}
      <div
        className="absolute z-20 pointer-events-none transition-all duration-700 delay-150"
        style={{
          top: '40%',
          left: '6%',
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateX(-50px)',
          animation: show ? 'heroFloat 3.5s ease-in-out infinite 0.6s' : 'none',
        }}
      >
        <div style={{
          background: '#dc2626',
          color: '#fff',
          borderRadius: '8px',
          padding: '8px 18px',
          fontWeight: 700,
          fontSize: '13px',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: '0 4px 20px rgba(220,38,38,0.55)',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
        }}>
          ✗ SKIP
        </div>
      </div>

      {/* Price card — bottom right */}
      <div
        className="absolute z-20 pointer-events-none transition-all duration-700 delay-300"
        style={{
          bottom: '28%',
          right: '6%',
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(30px)',
          animation: show ? 'heroFloat 4s ease-in-out infinite 1.1s' : 'none',
        }}
      >
        <div style={{
          background: 'rgba(2,6,23,0.88)',
          border: '1px solid rgba(245,158,11,0.45)',
          borderRadius: '10px',
          padding: '10px 18px',
          fontFamily: 'Inter, system-ui, sans-serif',
          backdropFilter: 'blur(10px)',
          textAlign: 'center',
          boxShadow: '0 8px 28px rgba(0,0,0,0.65)',
          minWidth: '115px',
          whiteSpace: 'nowrap',
        }}>
          <div style={{ color: 'rgba(148,163,184,0.7)', fontSize: '9px', letterSpacing: '1.5px', marginBottom: '3px', textTransform: 'uppercase' }}>
            Opening Bid
          </div>
          <div style={{ color: '#F59E0B', fontSize: '24px', fontWeight: 800, lineHeight: 1 }}>
            $184K
          </div>
          <div style={{ color: '#22c55e', fontSize: '11px', fontWeight: 600, marginTop: '3px' }}>
            ↑ $42K below ARV
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main exported component ───────────────────────────────────────

interface HeroProperty3DProps {
  className?: string
  children?: React.ReactNode
}

export function HeroProperty3D({ className, children }: HeroProperty3DProps) {
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const [showUI, setShowUI] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)
    setMounted(true)

    if (!mobile) {
      // Show floating UI after entrance animation completes
      const t = setTimeout(() => setShowUI(true), 1800)

      gsap.registerPlugin(ScrollTrigger)
      const trigger = ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top 70%',
        onEnter: () => setShowUI(true),
      })

      return () => {
        clearTimeout(t)
        trigger.kill()
      }
    }
  }, [])

  // SSR + mobile: gradient fallback with children
  if (!mounted || isMobile) {
    return (
      <div
        className={cn('relative overflow-hidden', className)}
        style={{
          background: 'radial-gradient(ellipse 110% 90% at 65% 55%, rgba(30,58,95,0.92) 0%, rgba(2,6,23,1) 65%)',
        }}
      >
        {children && <div className="relative z-10">{children}</div>}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Float keyframes */}
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
      `}</style>

      {/* R3F Canvas — full-bleed background, dynamically imported (no SSR) */}
      <HeroProperty3DCanvas />

      {/* Radial vignette — preserves text readability over 3D scene */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 90% 85% at 50% 45%, transparent 10%, rgba(2,6,23,0.45) 65%, rgba(2,6,23,0.88) 100%)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(#1E3A5F 1px, transparent 1px), linear-gradient(to right, #1E3A5F 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          opacity: 0.025,
          zIndex: 6,
          pointerEvents: 'none',
        }}
      />

      {/* Floating UI cards */}
      <FloatingUI show={showUI} />

      {/* Hero text content */}
      {children && (
        <div className="relative z-30">{children}</div>
      )}
    </div>
  )
}
