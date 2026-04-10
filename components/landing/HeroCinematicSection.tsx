'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles } from 'lucide-react'
import { ParticleButton } from '@/components/cinematic/ParticleButton'
import { TextScramble } from '@/components/cinematic/TextScramble'
import { KineticMarquee } from '@/components/cinematic/KineticMarquee'
import { HeroCornerCard } from './HeroCornerCard'

const HERO_MARQUEE_ITEMS = [
  'Nationwide Coverage',
  '67 Counties Live',
  'All 50 States Planned',
  'Real-Time Auction Data',
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
      'radial-gradient(ellipse 60% 50% at 65% 55%, rgba(245,158,11,0.35) 0%, rgba(30,58,95,0.6) 40%, #020617 80%)',
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
      'radial-gradient(ellipse 45% 45% at 50% 45%, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0.1) 25%, rgba(30,58,95,0.5) 50%, #020617 85%)',
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
      'radial-gradient(ellipse 35% 40% at 70% 40%, rgba(245,158,11,0.45) 0%, rgba(30,58,95,0.7) 35%, #020617 75%)',
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
      'radial-gradient(ellipse 50% 55% at 55% 65%, rgba(245,158,11,0.3) 0%, rgba(245,158,11,0.15) 20%, rgba(30,58,95,0.55) 45%, #020617 80%)',
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
      'radial-gradient(ellipse 55% 35% at 35% 35%, rgba(245,158,11,0.35) 0%, rgba(30,58,95,0.6) 40%, #020617 80%)',
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
      'radial-gradient(ellipse 30% 30% at 40% 45%, rgba(245,158,11,0.4) 0%, transparent 60%), radial-gradient(ellipse 30% 30% at 60% 50%, rgba(245,158,11,0.3) 0%, transparent 60%), radial-gradient(ellipse 80% 80% at 50% 50%, rgba(30,58,95,0.5) 0%, #020617 80%)',
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
      'radial-gradient(ellipse 40% 40% at 65% 30%, rgba(245,158,11,0.38) 0%, rgba(30,58,95,0.65) 40%, #020617 78%)',
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
      'radial-gradient(ellipse 25% 20% at 60% 40%, rgba(245,158,11,0.3) 0%, transparent 50%), radial-gradient(ellipse 20% 25% at 40% 60%, rgba(245,158,11,0.25) 0%, transparent 50%), radial-gradient(ellipse 20% 15% at 55% 70%, rgba(245,158,11,0.2) 0%, transparent 50%), radial-gradient(ellipse 90% 90% at 50% 50%, rgba(30,58,95,0.45) 0%, #020617 85%)',
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
  biddeed: { status: 'No active auction', auction_type: null, sale_date: null, opening_bid: null },
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
    <section className="relative overflow-hidden bg-[#020617]">
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
              'radial-gradient(circle, #F59E0B 0.8px, transparent 0.8px)',
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
              'radial-gradient(ellipse 90% 85% at 50% 45%, transparent 10%, rgba(2,6,23,0.5) 55%, rgba(2,6,23,0.92) 100%)',
          }}
        />

        {/* Grid overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(#1E3A5F 1px, transparent 1px), linear-gradient(to right, #1E3A5F 1px, transparent 1px)',
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
                className="mb-6 border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]"
              >
                <Sparkles className="mr-1.5 h-3 w-3" />
                Powering Everest Capital USA — 10 years Brevard foreclosure investing
              </Badge>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Score every Florida foreclosure
              <br />
              + tax deed auction.
              <br />
              <span className="text-[#F59E0B]">Before anyone else bids.</span>
            </motion.h1>

            <motion.div
              className="mb-4 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <TextScramble
                text="245K AUCTIONS · 10.8M PARCELS · 67 COUNTIES"
                trigger="scroll"
                className="text-xs sm:text-sm tracking-widest"
                color="rgba(245,158,11,0.7)"
                scramblingColor="rgba(255,255,255,0.15)"
              />
            </motion.div>

            <motion.p
              className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-400 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              ZoneWise.AI maps the opportunity. BidDeed.AI wins the auction.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <ParticleButton
                particleType="confetti"
                particleColor="#F59E0B"
                variant="primary"
                className="px-8 py-3 text-base font-semibold"
                onClick={() => {
                  window.location.href = '/explorer'
                }}
              >
                5 free choropleth clicks <ArrowRight className="ml-2 h-4 w-4 inline" />
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
              className="w-1.5 h-1.5 rounded-full transition-all duration-500"
              style={{
                background: i === current ? '#F59E0B' : 'rgba(255,255,255,0.2)',
                width: i === current ? '24px' : '6px',
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Corner card — BidDeed + ZoneWise pairing */}
        <HeroCornerCard
          parcel={data.parcel}
          biddeed={data.biddeed}
          zonewise={data.zonewise}
        />
      </div>

      {/* Kinetic marquee band below hero */}
      <div className="border-y border-[#1E3A5F]/40 bg-[#020617]">
        <KineticMarquee
          items={HERO_MARQUEE_ITEMS}
          speed={0.45}
          direction="left"
          variant="outline"
          separator="•"
          className="bg-transparent"
          textClassName="text-white/30"
        />
      </div>
    </section>
  )
}
