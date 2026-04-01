"use client"

import { Map, Gavel, Building2, MessageSquare, FileText, Activity } from 'lucide-react'
import { StickyCards } from '@/components/cinematic/StickyCards'
import { KineticMarquee } from '@/components/cinematic/KineticMarquee'

const features = [
  {
    icon: Map,
    title: 'Smart Choropleth Maps',
    description: 'Interactive choropleth map of 10.8M+ parcels and growing. Zoning overlays, ZHVI heatmaps, and neighborhood comps at a glance.',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat Analyst',
    description: 'Cited answers on permitted uses, setbacks, and height limits from our own Supabase-backed RAG pipeline.',
  },
  {
    icon: Activity,
    title: 'Price Monitoring Alerts',
    description: 'Real-time auction price tracking across all covered counties. Custom Telegram alerts when deals match your criteria.',
  },
  {
    icon: Gavel,
    title: 'Compounding Intelligence',
    description: 'Every query, alert, and analysis feeds the model. The platform gets smarter the more you use it.',
  },
  {
    icon: FileText,
    title: 'Zoning Reports',
    description: 'One-click PDF zoning reports with HBU analysis, comp sales, and legal lot coverage.',
  },
  {
    icon: Building2,
    title: 'Deal Scoring',
    description: 'Max-bid formula: (ARV×70%)−Repairs−$10K−MIN($25K,15%×ARV). Scored against live auction data.',
  },
]

const MARQUEE_ITEMS = [
  'Nationwide Coverage',
  '67 Counties Live',
  'All 50 States Planned',
  'Real-Time Auction Data',
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
            Everything a serious investor needs
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Built by a licensed FL broker and GC with 10+ years in Brevard County foreclosures. Now expanding nationwide.
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
