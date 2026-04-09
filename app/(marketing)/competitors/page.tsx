// app/(marketing)/competitors/page.tsx
// Battle Cards Sprint S0a — replaces the Mar 30 redirect to /competitors.html
// with a proper Next.js index page showing all 11 battle cards in a grid.
// Each card links to /competitors/<slug>.

import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllCardSummaries } from '@/data/competitors'
import { ThreatBadge } from '@/components/competitors/ThreatBadge'

export const metadata: Metadata = {
  title: 'Competitive Landscape — ZoneWise.AI vs 11 Competitors',
  description:
    'Head-to-head comparisons against PropZone/Gridics, Zoneomics, Algoma, MapWise, PropertyOnion, Forma+Zoneomics, TestFit, Reventure, Foreclosure.com, AI Topia, CoreLogic/ATTOM.',
  alternates: {
    canonical: 'https://zonewise.ai/competitors',
  },
  openGraph: {
    title: 'ZoneWise.AI — Beats 11 Competitors on Data, AI, and Price',
    description:
      'Side-by-side comparisons across zoning data, auction intelligence, ML predictions, lien analysis, and pricing.',
    url: 'https://zonewise.ai/competitors',
  },
}

export default function CompetitorsIndexPage() {
  const cards = getAllCardSummaries()

  return (
    <main id="main-content" className="min-h-screen bg-[#020617] text-slate-100">
      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <header
        className="border-b border-slate-800"
        style={{
          background:
            'linear-gradient(135deg, #1E3A5F 0%, #0d2040 60%, #020617 100%)',
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
            Competitive Landscape
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            ZoneWise.AI <span className="text-[#F59E0B]">vs</span> 11 Competitors
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            Head-to-head comparisons across zoning data, auction intelligence, ML
            predictions, lien analysis, and pricing. Every claim sourced and dated.
          </p>
        </div>
      </header>

      {/* ── GRID ───────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.slug}
              href={`/competitors/${card.slug}`}
              className="group relative flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-[#F59E0B]/40 hover:bg-slate-900/60"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-white group-hover:text-[#F59E0B]">
                  {card.name}
                </h2>
                <ThreatBadge threat={card.threat} />
              </div>

              <p className="mb-4 flex-1 text-sm text-slate-400">{card.tagline}</p>

              {card.zonewise_wins + card.competitor_wins + card.ties > 0 ? (
                <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
                  <span className="text-slate-500">
                    <span className="font-bold text-[#F59E0B]">{card.zonewise_wins}</span>
                    <span className="mx-1 text-slate-700">/</span>
                    <span className="text-slate-400">{card.competitor_wins}</span>
                    <span className="mx-1 text-slate-700">/</span>
                    <span className="text-slate-500">{card.ties}</span>
                    <span className="ml-1.5 text-[10px] uppercase tracking-wider">
                      W / L / T
                    </span>
                  </span>
                  <span className="text-[#F59E0B] transition group-hover:translate-x-0.5">
                    View →
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
                  <span className="text-slate-500">Coming soon</span>
                  <span className="text-slate-500 transition group-hover:text-slate-300">
                    Preview →
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* ── FOOTER NOTE ─────────────────────────────────────────────── */}
        <p className="mx-auto mt-12 max-w-2xl text-center text-xs text-slate-500">
          Every battle card is backed by dated sources under the{' '}
          <strong className="text-slate-400">Honesty Protocol</strong>. Competitor pricing
          and feature claims are verified against published materials. If you spot an
          error,{' '}
          <a
            href="mailto:ariel@everestcapitalusa.com"
            className="text-[#F59E0B] hover:underline"
          >
            email us
          </a>{' '}
          and we will correct it within 24 hours.
        </p>
      </div>
    </main>
  )
}
