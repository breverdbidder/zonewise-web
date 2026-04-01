"use client"

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles } from 'lucide-react'
import { HeroProperty3D } from '@/components/cinematic/HeroProperty3D'
import { ParticleButton } from '@/components/cinematic/ParticleButton'
import { TextScramble } from '@/components/cinematic/TextScramble'
import { KineticMarquee } from '@/components/cinematic/KineticMarquee'

const HERO_MARQUEE_ITEMS = [
  'Nationwide Coverage',
  '67 Counties Live',
  'All 50 States Planned',
  'Real-Time Auction Data',
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#020617]">
      <HeroProperty3D className="min-h-[85vh] flex items-center justify-center py-24 sm:py-32">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#1E3A5F 1px, transparent 1px), linear-gradient(to right, #1E3A5F 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <Badge
            variant="outline"
            className="mb-6 border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]"
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            Powering Everest Capital USA — 10 years Brevard foreclosure investing
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.05] tracking-tight">
            AI-Powered Auction Intelligence<br />
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
              onClick={() => { window.location.href = '/sign-up' }}
            >
              Start for free <ArrowRight className="ml-2 h-4 w-4 inline" />
            </ParticleButton>
            <Link
              href="/explorer"
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl text-sm font-medium border transition-colors"
              style={{ borderColor: 'rgba(100,120,150,0.4)', color: 'rgba(200,210,220,0.85)' }}
            >
              Explore live map
            </Link>
          </div>
        </div>
      </HeroProperty3D>

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
