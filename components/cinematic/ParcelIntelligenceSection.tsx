"use client"

import React, { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const ParcelIntelligenceCanvas = dynamic(() => import('./ParcelIntelligenceCanvas'), {
  ssr: false,
})

const BEATS = [
  {
    eyebrow: '01 — Smart Choropleth Maps',
    title: 'Every parcel, scored before you bid.',
    body: 'ZoneWise maps zoning overlays, ZHVI heatmaps, and neighborhood comps across 10.8M+ parcels — the cluster you see extrude is what our engine flags for a closer look.',
  },
  {
    eyebrow: '02 — Compounding Intelligence',
    title: 'From wireframe to verdict in one scroll.',
    body: 'Zoning reports, deal scoring, and live auction priors converge into one read: bid, review, or skip — before the gavel, not after.',
  },
]

export function ParcelIntelligenceSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    setMounted(true)
  }, [])

  // Mobile / no-JS fallback: static navy gradient with the two beats stacked normally,
  // no scroll-scrub — keeps the section legible and light on low-bandwidth connections.
  if (!mounted || isMobile) {
    return (
      <section
        className="relative py-24 px-4"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 30%, rgba(30,58,95,0.55) 0%, #020617 70%)',
        }}
      >
        <div className="mx-auto max-w-xl space-y-8">
          {BEATS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl p-8 border"
              style={{ background: '#0d1829', borderColor: 'rgba(30,58,95,0.5)' }}
            >
              <div
                className="text-xs uppercase tracking-widest mb-3 font-medium"
                style={{ color: '#F59E0B', letterSpacing: '0.1em' }}
              >
                {b.eyebrow}
              </div>
              <h3 className="text-white font-semibold text-2xl mb-3 tracking-tight">{b.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section ref={wrapperRef} className="relative h-[280vh] bg-[#020617]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <ParcelIntelligenceCanvas scrollTriggerEl={wrapperRef.current} />

        {/* Vignette for text legibility, matching HeroProperty3D convention */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 20%, rgba(2,6,23,0.55) 70%, rgba(2,6,23,0.92) 100%)',
            zIndex: 5,
          }}
        />

        {/* Beat 1 — left card, visible in the extrusion phase */}
        <div className="absolute z-20 left-6 sm:left-16 top-1/3 -translate-y-1/2 max-w-md pointer-events-none">
          <div
            className="rounded-2xl p-8 border backdrop-blur-md"
            style={{ background: 'rgba(13,24,41,0.72)', borderColor: 'rgba(245,158,11,0.2)' }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-3 font-medium"
              style={{ color: '#F59E0B', letterSpacing: '0.1em' }}
            >
              {BEATS[0].eyebrow}
            </div>
            <h3 className="text-white font-semibold text-2xl sm:text-3xl mb-3 tracking-tight">
              {BEATS[0].title}
            </h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{BEATS[0].body}</p>
          </div>
        </div>

        {/* Beat 2 — right card, visible in the dashboard phase */}
        <div className="absolute z-20 right-6 sm:right-16 bottom-1/4 max-w-md pointer-events-none">
          <div
            className="rounded-2xl p-8 border backdrop-blur-md"
            style={{ background: 'rgba(13,24,41,0.72)', borderColor: 'rgba(245,158,11,0.2)' }}
          >
            <div
              className="text-xs uppercase tracking-widest mb-3 font-medium"
              style={{ color: '#F59E0B', letterSpacing: '0.1em' }}
            >
              {BEATS[1].eyebrow}
            </div>
            <h3 className="text-white font-semibold text-2xl sm:text-3xl mb-3 tracking-tight">
              {BEATS[1].title}
            </h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{BEATS[1].body}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
