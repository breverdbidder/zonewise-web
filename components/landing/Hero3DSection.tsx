'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles } from 'lucide-react'
import { ParticleButton } from '@/components/cinematic/ParticleButton'
import { TextScramble } from '@/components/cinematic/TextScramble'
import { KineticMarquee } from '@/components/cinematic/KineticMarquee'
import { HeroCornerCard } from './HeroCornerCard'

const Photorealistic3DViewer = dynamic(
  () => import('@/components/maps/Photorealistic3DViewer'),
  { ssr: false }
)

const HERO_MARQUEE_ITEMS = [
  'Nationwide Coverage',
  '67 Counties Live',
  'All 50 States Planned',
  'Real-Time Auction Data',
]

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

export function Hero3DSection() {
  const [data, setData] = useState<FeaturedParcelResponse>(FALLBACK_DATA)
  const [viewerReady, setViewerReady] = useState(false)

  useEffect(() => {
    fetch('/api/parcels/featured')
      .then((r) => r.json())
      .then((d: FeaturedParcelResponse) => {
        if (d?.parcel) {
          // Defensive merge — API may omit biddeed/zonewise on fallback,
          // but HeroCornerCard reads .status on both. Keep FALLBACK_DATA
          // shape stable to prevent TypeError: undefined.status.
          setData({
            fallback: d.fallback ?? true,
            parcel: { ...FALLBACK_DATA.parcel, ...d.parcel },
            biddeed: d.biddeed ?? FALLBACK_DATA.biddeed,
            zonewise: d.zonewise ?? FALLBACK_DATA.zonewise,
          })
        }
      })
      .catch(() => {
        // Keep fallback data
      })
  }, [])

  return (
    <section className="relative overflow-hidden bg-[#020617]">
      {/* 3D Viewer — full-bleed hero background */}
      <div className="relative min-h-[85vh]">
        {/* CesiumJS 3D Tiles Viewer */}
        <div className="absolute inset-0 z-0">
          <Photorealistic3DViewer
            parcelId={data.parcel.parcel_id}
            lat={data.parcel.lat}
            lng={data.parcel.lng}
            zoom={600}
          />
        </div>

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
            <Badge
              variant="outline"
              className="mb-6 border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]"
            >
              <Sparkles className="mr-1.5 h-3 w-3" />
              Powering Everest Capital USA — 10 years Brevard foreclosure investing
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
              AI-Powered Auction Intelligence
              <br />
              <span className="text-[#F59E0B]">Nationwide</span>
            </h1>

            <div className="mb-4 flex justify-center">
              <TextScramble
                text="245K AUCTIONS · 10.8M PARCELS · 67 COUNTIES"
                trigger="scroll"
                className="text-xs sm:text-sm tracking-widest"
                color="rgba(245,158,11,0.7)"
                scramblingColor="rgba(255,255,255,0.15)"
              />
            </div>

            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-400 mb-10">
              Live in 67 Florida counties. Expanding to all 50 states. Zoning analysis,
              development envelopes, and deal scoring — built by a Brevard County investor.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <ParticleButton
                particleType="confetti"
                particleColor="#F59E0B"
                variant="primary"
                className="px-8 py-3 text-base font-semibold"
                onClick={() => {
                  window.location.href = '/sign-up'
                }}
              >
                Start for free <ArrowRight className="ml-2 h-4 w-4 inline" />
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
            </div>
          </div>
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
