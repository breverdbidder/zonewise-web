'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlatformParcels, PlatformCounties } from '@/components/PlatformStat'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles } from 'lucide-react'
import { ParticleButton } from '@/components/cinematic/ParticleButton'
import { KineticMarquee } from '@/components/cinematic/KineticMarquee'

const HERO_MARQUEE_ITEMS = [
  'Zoning Intelligence',
  '67 Counties Live',
  'Built for All 50 States',
  'Feasibility Studies',
]

/**
 * Ken Burns slide config — each slide defines a start/end transform
 * for the slow pan+zoom effect. The background is a CSS gradient that
 * simulates a choropleth heatmap view of Florida counties.
 */
const SLIDES = [
  {
    // Wide Florida peninsula — warm clusters in SE
    gradient:
      'radial-gradient(ellipse 60% 50% at 65% 55%, rgb(var(--zw-brand)/0.35) 0%, rgb(var(--zw-border2) / 0.6) 40%, rgb(var(--zw-page)) 80%)',
    scaleFrom: 1,
    scaleTo: 1.15,
    xFrom: '0%',
    xTo: '-3%',
    yFrom: '0%',
    yTo: '-2%',
  },
  {
    // Central FL hotspot — orange glow radiating from center
    gradient:
      'radial-gradient(ellipse 45% 45% at 50% 45%, rgb(var(--zw-brand) / 0.4) 0%, rgb(var(--zw-brand) / 0.1) 25%, rgb(var(--zw-border2) / 0.5) 50%, rgb(var(--zw-page)) 85%)',
    scaleFrom: 1.05,
    scaleTo: 1.2,
    xFrom: '2%',
    xTo: '-1%',
    yFrom: '1%',
    yTo: '-3%',
  },
  {
    // Brevard County focus — tight cluster on east coast
    gradient:
      'radial-gradient(ellipse 35% 40% at 70% 40%, rgb(var(--zw-brand) / 0.45) 0%, rgb(var(--zw-border2) / 0.7) 35%, rgb(var(--zw-page)) 75%)',
    scaleFrom: 1.1,
    scaleTo: 1.25,
    xFrom: '-2%',
    xTo: '1%',
    yFrom: '-1%',
    yTo: '2%',
  },
  {
    // South Florida spread — Miami-Dade corridor
    gradient:
      'radial-gradient(ellipse 50% 55% at 55% 65%, rgb(var(--zw-brand) / 0.3) 0%, rgb(var(--zw-brand) / 0.15) 20%, rgb(var(--zw-border2) / 0.55) 45%, rgb(var(--zw-page)) 80%)',
    scaleFrom: 1,
    scaleTo: 1.18,
    xFrom: '1%',
    xTo: '-2%',
    yFrom: '-2%',
    yTo: '1%',
  },
  {
    // Panhandle sweep — northwest FL
    gradient:
      'radial-gradient(ellipse 55% 35% at 35% 35%, rgb(var(--zw-brand) / 0.35) 0%, rgb(var(--zw-border2) / 0.6) 40%, rgb(var(--zw-page)) 80%)',
    scaleFrom: 1.05,
    scaleTo: 1.15,
    xFrom: '-1%',
    xTo: '3%',
    yFrom: '2%',
    yTo: '-1%',
  },
  {
    // Multi-cluster — Tampa + Orlando dual glow
    gradient:
      'radial-gradient(ellipse 30% 30% at 40% 45%, rgb(var(--zw-brand) / 0.4) 0%, transparent 60%), radial-gradient(ellipse 30% 30% at 60% 50%, rgb(var(--zw-brand) / 0.3) 0%, transparent 60%), radial-gradient(ellipse 80% 80% at 50% 50%, rgb(var(--zw-border2) / 0.5) 0%, rgb(var(--zw-page)) 80%)',
    scaleFrom: 1,
    scaleTo: 1.12,
    xFrom: '0%',
    xTo: '-2%',
    yFrom: '0%',
    yTo: '-2%',
  },
  {
    // Northeast FL — Jacksonville area glow
    gradient:
      'radial-gradient(ellipse 40% 40% at 65% 30%, rgb(var(--zw-brand) / 0.38) 0%, rgb(var(--zw-border2) / 0.65) 40%, rgb(var(--zw-page)) 78%)',
    scaleFrom: 1.08,
    scaleTo: 1.22,
    xFrom: '2%',
    xTo: '-1%',
    yFrom: '1%',
    yTo: '-2%',
  },
  {
    // Full state wide view — scattered heat
    gradient:
      'radial-gradient(ellipse 25% 20% at 60% 40%, rgb(var(--zw-brand) / 0.3) 0%, transparent 50%), radial-gradient(ellipse 20% 25% at 40% 60%, rgb(var(--zw-brand) / 0.25) 0%, transparent 50%), radial-gradient(ellipse 20% 15% at 55% 70%, rgb(var(--zw-brand) / 0.2) 0%, transparent 50%), radial-gradient(ellipse 90% 90% at 50% 50%, rgb(var(--zw-border2) / 0.45) 0%, rgb(var(--zw-page)) 85%)',
    scaleFrom: 1,
    scaleTo: 1.1,
    xFrom: '-1%',
    xTo: '1%',
    yFrom: '-1%',
    yTo: '1%',
  },
]

const SLIDE_DURATION = 6000 // ms per slide

interface FeaturedParcelResponse {
  fallback: boolean
  parcel: {
    parcel_id: string
    address: string | null
    city: string | null
    zip: string | null
    lat: number
    lng: number
    co_no: number
    dor_uc: string | null
    just_value: number | null
  }
  biddeed: {
    status: string
    auction_type: string | null
    sale_date: string | null
    opening_bid: number | null
  }
  zonewise: {
    status: string
    zoning_code: string | null
    jurisdiction: string | null
  }
}

const FALLBACK_DATA: FeaturedParcelResponse = {
  fallback: true,
  parcel: {
    parcel_id: '05-25-36-00-00100.0-0001.00',
    address: '1234 Palm Bay Rd NE',
    city: 'Palm Bay',
    zip: '32905',
    lat: 28.0345,
    lng: -80.5887,
    co_no: 5,
    dor_uc: '0100',
    just_value: 185000,
  },
  biddeed: { status: 'Not currently listed', auction_type: null, sale_date: null, opening_bid: null },
  zonewise: { status: 'Not assigned', zoning_code: null, jurisdiction: null },
}

export function HeroCinematicSection() {
  const [current, setCurrent] = useState(0)
  const [data, setData] = useState<FeaturedParcelResponse>(FALLBACK_DATA)

  // Cycle slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length)
    }, SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [])

  // Fetch featured parcel
  useEffect(() => {
    fetch('/api/parcels/featured')
      .then((r) => r.json())
      .then((d: FeaturedParcelResponse) => {
        if (d?.parcel) {
          setData({
            fallback: d.fallback ?? true,
            parcel: { ...FALLBACK_DATA.parcel, ...d.parcel },
            biddeed: d.biddeed ?? FALLBACK_DATA.biddeed,
            zonewise: d.zonewise ?? FALLBACK_DATA.zonewise,
          })
        }
      })
      .catch(() => {})
  }, [])

  const slide = SLIDES[current]

  return (
    <section className="relative overflow-x-hidden bg-[rgb(var(--zw-page))]">
      <div className="relative min-h-[85vh]">
        {/* Ken Burns animated background layers */}
        <AnimatePresence mode="sync">
          <motion.div
            key={current}
            className="absolute inset-[-15%] z-0"
            initial={{
              opacity: 0,
              scale: slide.scaleFrom,
              x: slide.xFrom,
              y: slide.yFrom,
            }}
            animate={{
              opacity: 1,
              scale: slide.scaleTo,
              x: slide.xTo,
              y: slide.yTo,
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.5, ease: 'easeInOut' },
              scale: { duration: SLIDE_DURATION / 1000, ease: 'linear' },
              x: { duration: SLIDE_DURATION / 1000, ease: 'linear' },
              y: { duration: SLIDE_DURATION / 1000, ease: 'linear' },
            }}
            style={{ background: slide.gradient }}
          />
        </AnimatePresence>

        {/* Dot grid overlay — simulates parcel-level data density */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgb(var(--zw-brand)) 0.8px, transparent 0.8px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Hero poster fallback (for SEO / no-JS) */}
        <noscript>
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero/hero-poster.svg"
              alt="ZoneWise.AI Florida foreclosure auction heatmap"
              fill
              className="object-cover"
              priority
            />
          </div>
        </noscript>

        {/* Radial vignette for text readability */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 90% 85% at 50% 45%, transparent 10%, rgb(var(--zw-page) / 0.5) 55%, rgb(var(--zw-page) / 0.92) 100%)',
          }}
        />

        {/* Grid overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgb(var(--zw-elev)) 1px, transparent 1px), linear-gradient(to right, rgb(var(--zw-elev)) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Hero text content */}
        <div className="relative z-20 flex items-center justify-center min-h-[85vh] py-24 sm:py-32">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Badge
                variant="outline"
                className="mb-6 border-[rgb(var(--zw-brand)/0.3)] bg-[rgb(var(--zw-brand)/0.1)] text-[rgb(var(--zw-brand))]"
              >
                <Sparkles className="mr-1.5 h-3 w-3" />
                Built by a developer with 20 years and hundreds of closings — not by a software company
              </Badge>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[rgb(var(--zw-ink))] mb-6 leading-[1.05] tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Every parcel.
              <br />
              Every zoning rule.
              <br />
              <span className="text-[rgb(var(--zw-brand))]">Feasibility in one search.</span>
            </motion.h1>

            <motion.div
              className="mb-4 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <span
                className="font-mono text-xs sm:text-sm tracking-widest tabular-nums"
                style={{ color: 'rgb(var(--zw-brand) / 0.7)' }}
              >
                <PlatformParcels /> PARCELS · <PlatformCounties /> COUNTIES · 50-STATE ARCHITECTURE
              </span>
            </motion.div>

            <motion.p
              className="mx-auto max-w-2xl text-lg sm:text-xl text-[rgb(var(--zw-ink2))] mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Zoning intelligence and feasibility studies for developers and investors. All 67 Florida counties live — built to run in all 50 states.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <ParticleButton
                particleType="confetti"
                particleColor="#1A90FF"
                variant="primary"
                className="px-8 py-3 text-base font-semibold"
                onClick={() => {
                  window.location.href = '/explorer'
                }}
              >
                5 free parcel reports <ArrowRight className="ml-2 h-4 w-4 inline" />
              </ParticleButton>
              <Link
                href="/explorer"
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl text-sm font-medium border transition-colors"
                style={{
                  borderColor: 'rgba(100,120,150,0.4)',
                  color: 'rgba(200,210,220,0.85)',
                }}
              >
                Explore live map
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="flex items-center justify-center h-11 w-6 -my-[19px]"
              aria-label={`Go to slide ${i + 1}`}
            >
              <span
                className="block h-1.5 rounded-full transition-all duration-500"
                style={{
                  background: i === current ? 'rgb(var(--zw-brand))' : 'rgba(255,255,255,0.2)',
                  width: i === current ? '24px' : '6px',
                }}
              />
            </button>
          ))}
        </div>

      </div>

      {/* Kinetic marquee band below hero */}
      <div className="border-y border-[rgb(var(--zw-border2)/0.4)] bg-[rgb(var(--zw-page))]">
        <KineticMarquee
          items={HERO_MARQUEE_ITEMS}
          speed={0.45}
          direction="left"
          variant="outline"
          separator="•"
          className="bg-transparent"
          textClassName="text-[rgb(var(--zw-ink))]/30"
        />
      </div>
    </section>
  )
}
