// app/(marketing)/competitors/page.tsx
// Battle Cards Sprint S0a — replaces the Mar 30 redirect to /competitors.html
// with a proper Next.js index page showing all 11 battle cards in a grid.
// Each card links to /competitors/<slug>.

import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllCardSummaries } from '@/data/competitors'
import { ThreatBadge } from '@/components/competitors/ThreatBadge'

export const metadata: Metadata = {
  title: 'Competitive Landscape — ZoneWise.AI vs 10 Competitors',
  description:
    'Head-to-head comparisons against PropZone/Gridics, Zoneomics, Algoma, MapWise, Forma+Zoneomics, TestFit, Reventure, Foreclosure.com, AI Topia, CoreLogic/ATTOM.',
  alternates: {
    canonical: 'https://zonewise.ai/competitors',
  },
  openGraph: {
    title: 'ZoneWise.AI — Beats 10 Competitors on Data, AI, and Price',
    description:
      'Side-by-side comparisons across zoning data, auction intelligence, ML predictions, lien analysis, and pricing.',
    url: 'https://zonewise.ai/competitors',
  },
}

export default function CompetitorsIndexPage() {
  const cards = getAllCardSummaries()

  return (
    <main id="main-content" className="min-h-screen bg-[rgb(var(--zw-page))] text-[rgb(var(--zw-ink))]">
      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <header
        className="border-b border-[rgb(var(--zw-border2))]"
        style={{
          background:
            'linear-gradient(135deg, rgb(var(--zw-elev)) 0%, #0d2040 60%, rgb(var(--zw-page)) 100%)',
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--zw-brand)/0.3)] bg-[rgb(var(--zw-brand)/0.1)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--zw-brand))]">
            Competitive Landscape
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-[rgb(var(--zw-ink))] sm:text-5xl lg:text-6xl">
            ZoneWise.AI <span className="text-[rgb(var(--zw-brand))]">vs</span> 10 Competitors
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[rgb(var(--zw-ink2))]">
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
              className="group relative flex flex-col rounded-xl border border-[rgb(var(--zw-border2))] bg-[rgb(var(--zw-page)/0.4)] p-6 transition hover:border-[rgb(var(--zw-brand)/0.4)] hover:bg-[rgb(var(--zw-page)/0.6)]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-[rgb(var(--zw-ink))] group-hover:text-[rgb(var(--zw-brand))]">
                  {card.name}
                </h2>
                <ThreatBadge threat={card.threat} />
              </div>

              <p className="mb-4 flex-1 text-sm text-[rgb(var(--zw-ink2))]">{card.tagline}</p>

              {card.zonewise_wins + card.competitor_wins + card.ties > 0 ? (
                <div className="flex items-center justify-between border-t border-[rgb(var(--zw-border2))] pt-4 text-xs">
                  <span className="text-[rgb(var(--zw-ink2))]">
                    <span className="font-bold text-[rgb(var(--zw-brand))]">{card.zonewise_wins}</span>
                    <span className="mx-1 text-[rgb(var(--zw-ink))]">/</span>
                    <span className="text-[rgb(var(--zw-ink2))]">{card.competitor_wins}</span>
                    <span className="mx-1 text-[rgb(var(--zw-ink))]">/</span>
                    <span className="text-[rgb(var(--zw-ink2))]">{card.ties}</span>
                    <span className="ml-1.5 text-[10px] uppercase tracking-wider">
                      W / L / T
                    </span>
                  </span>
                  <span className="text-[rgb(var(--zw-brand))] transition group-hover:translate-x-0.5">
                    View →
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between border-t border-[rgb(var(--zw-border2))] pt-4 text-xs">
                  <span className="text-[rgb(var(--zw-ink2))]">Coming soon</span>
                  <span className="text-[rgb(var(--zw-ink2))] transition group-hover:text-[rgb(var(--zw-ink2))]">
                    Preview →
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* ── FOOTER NOTE ─────────────────────────────────────────────── */}
        <p className="mx-auto mt-12 max-w-2xl text-center text-xs text-[rgb(var(--zw-ink2))]">
          Every battle card is backed by dated sources under the{' '}
          <strong className="text-[rgb(var(--zw-ink2))]">Honesty Protocol</strong>. Competitor pricing
          and feature claims are verified against published materials. If you spot an
          error,{' '}
          <a
            href="mailto:ariel@everestcapitalusa.com"
            className="text-[rgb(var(--zw-brand))] hover:underline"
          >
            email us
          </a>{' '}
          and we will correct it within 24 hours.
        </p>
      </div>
    </main>
  )
}
