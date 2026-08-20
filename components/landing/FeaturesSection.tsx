"use client"

import { Map, Ruler, Layers, MessageSquare, FileText, Building2 } from 'lucide-react'
import { StickyCards } from '@/components/cinematic/StickyCards'
import { KineticMarquee } from '@/components/cinematic/KineticMarquee'

// Product spine: zoning intelligence + feasibility. No auction, foreclosure or
// tax-deed content on this surface — that belongs to BidDeed.AI.
// Every module listed here must be demonstrable in a live demo.
const features = [
  {
    icon: Map,
    title: 'Parcel & Site Discovery',
    description:
      'Search 10.5M+ Florida parcels by address, by criteria, or by drawing a boundary on the map. Every county in the state, one interface.',
  },
  {
    icon: Ruler,
    title: 'Zoning Intelligence',
    description:
      'Permitted uses, setbacks, height limits and FAR resolved per parcel — and cited back to the governing code, so you can check the answer rather than trust it.',
  },
  {
    icon: Building2,
    title: 'Capacity & Massing',
    description:
      'Buildable envelope and unit yield from the controls that actually apply to the site. Compare scenarios before committing design fees.',
  },
  {
    icon: Layers,
    title: 'GIS & Utilities',
    description:
      'Flood, wetlands, future land use and utility service area on one map. Central water and sewer availability changes the legal envelope and the septic bedroom cap — so we surface it up front.',
  },
  {
    icon: MessageSquare,
    title: 'AI Analyst',
    description:
      'Ask in plain language. Cited answers on what a parcel permits, drawn from our own zoning pipeline rather than a general-purpose model guessing at code.',
  },
  {
    icon: FileText,
    title: 'Feasibility Reports',
    description:
      'One-click PDF with highest-and-best-use analysis, comparable sales, and legal lot coverage — formatted to survive an investment committee.',
  },
]

const MARQUEE_ITEMS = [
  'Zoning Intelligence',
  'Feasibility Studies',
  '67 Counties Live',
  'Built for All 50 States',
]

export function FeaturesSection() {
  return (
    <section className="bg-[#020617] py-0 sm:py-0 overflow-hidden">
      {/* Kinetic marquee band */}
      <div className="border-y border-[#1E3A5F]/30 py-2 mb-16">
        <KineticMarquee
          items={MARQUEE_ITEMS}
          speed={0.4}
          direction="left"
          variant="outline"
          className="bg-transparent"
          textClassName="text-[rgba(255,255,255,0.4)]"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:pb-28">
        <div className="mb-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Feasibility in one search
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Enter an address. Get the zoning, the envelope, the constraints and the numbers —
            before you spend a dollar on design.
          </p>
        </div>

        {/* Sticky cards for first 4 features */}
        <div className="mb-12">
          <StickyCards
            cards={features.slice(0, 4).map((f, i) => ({
              num: `0${i + 1}`,
              title: f.title,
              description: f.description,
            }))}
          />
        </div>

        {/* Remaining 2 features as flat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {features.slice(4).map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl p-8 border transition-all duration-300 hover:border-[#F59E0B]/40 hover:shadow-[0_0_28px_rgba(245,158,11,0.1)]"
              style={{ background: '#0d1829', borderColor: 'rgba(30,58,95,0.5)' }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F] transition-colors group-hover:bg-[#F59E0B]/10">
                <f.icon className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
