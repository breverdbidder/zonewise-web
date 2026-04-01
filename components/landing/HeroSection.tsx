import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#020617] py-24 sm:py-32">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
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
          AI Zoning &amp; Foreclosure<br />
          <span className="text-[#F59E0B]">Intelligence</span> for Florida
        </h1>

        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-400 mb-10">
          245K+ auction records. 10.8M FL parcels. Zoning analysis, development
          envelopes, and deal scoring — all in one platform built by a Brevard
          County investor.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="bg-[#F59E0B] text-slate-900 hover:bg-[#D97706] font-semibold px-8"
            asChild
          >
            <Link href="/sign-up">
              Start for free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            asChild
          >
            <Link href="/explorer">Explore live map</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
