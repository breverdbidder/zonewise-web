// components/competitors/BattleCardLayout.tsx
// Battle Cards Sprint S0a — top-level page shell for each competitor battle card.
// Server component (no 'use client') so Lighthouse measures clean static HTML.
// Assembles: Hero → Verdict Banner → Positioning → Pricing → KPI Matrix → Sources.

import Link from 'next/link'
import { ThreatBadge } from './ThreatBadge'
import { PricingComparator } from './PricingComparator'
import { CompetitorKpiMatrix } from './CompetitorKpiMatrix'
import type { CompetitorProfile } from '@/types/competitors'

interface Props {
  competitor: CompetitorProfile
}

export function BattleCardLayout({ competitor }: Props) {
  const totalRows =
    competitor.zonewise_wins + competitor.competitor_wins + competitor.ties
  const isStub = competitor.parity_kpi_codes.length === 0 && competitor.advantage_kpi_codes.length === 0

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
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Link
            href="/competitors"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#F59E0B] hover:text-[#FBBF24]"
          >
            ← All competitors
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <ThreatBadge threat={competitor.threat} />
                <span className="text-[11px] font-mono text-slate-400">
                  {competitor.domain}
                </span>
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                ZoneWise.AI <span className="text-[#F59E0B]">vs</span> {competitor.name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-300">
                {competitor.tagline}
              </p>
            </div>

            {!isStub && (
              <div className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-5 text-center backdrop-blur-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Head-to-Head
                </div>
                <div className="mt-2 flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-bold text-[#F59E0B]">
                    {competitor.zonewise_wins}
                  </span>
                  <span className="text-slate-600">/</span>
                  <span className="text-2xl font-semibold text-slate-400">
                    {competitor.competitor_wins}
                  </span>
                  <span className="text-slate-600">/</span>
                  <span className="text-xl text-slate-500">{competitor.ties}</span>
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  ZoneWise / Them / Ties
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-10">
        {isStub ? (
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-8 text-center">
            <p className="text-sm text-amber-300">
              Full battle card in development. Tracked in{' '}
              <code className="rounded bg-slate-900 px-1.5 py-0.5 text-amber-200">
                BATTLE-CARDS-SPRINT-S0-ADDENDUM.md
              </code>
              .
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Threat level: <strong className="text-white">{competitor.threat}</strong> •{' '}
              {totalRows > 0 ? `${totalRows} data points tracked` : 'KPI mapping pending'}
            </p>
          </section>
        ) : (
          <>
            {/* ── VERDICT BANNER ─────────────────────────────────────── */}
            <section
              aria-labelledby="verdict-heading"
              className="rounded-xl border border-[#F59E0B]/30 bg-gradient-to-br from-[#F59E0B]/10 to-transparent p-6"
            >
              <h2 id="verdict-heading" className="sr-only">
                Verdict
              </h2>
              <p className="text-lg leading-relaxed text-slate-200">
                <span aria-hidden="true" className="mr-2 text-[#F59E0B]">“</span>
                {competitor.verdict_line}
                <span aria-hidden="true" className="ml-1 text-[#F59E0B]">”</span>
              </p>
              <p className="mt-3 text-xs text-slate-500">
                — ZoneWise.AI • BidDeed.AI • Everest Capital USA
              </p>
            </section>

            {/* ── POSITIONING (3 columns) ────────────────────────────── */}
            <section
              aria-labelledby="positioning-heading"
              className="grid gap-6 md:grid-cols-3"
            >
              <h2 id="positioning-heading" className="sr-only">
                Positioning
              </h2>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Their Strengths
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {competitor.their_strengths.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden="true" className="text-slate-500">
                        ·
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Their Weaknesses
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {competitor.their_weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden="true" className="text-rose-500">
                        ×
                      </span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-6">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#F59E0B]">
                  Our Edge
                </h3>
                <ul className="space-y-2 text-sm text-slate-200">
                  {competitor.our_edge.map((e, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden="true" className="text-[#F59E0B]">
                        ★
                      </span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* ── PRICING COMPARISON ─────────────────────────────────── */}
            <PricingComparator
              competitorName={competitor.name}
              tiers={competitor.pricing}
            />

            {/* ── KPI PARITY MATRIX ──────────────────────────────────── */}
            <CompetitorKpiMatrix competitor={competitor} />

            {/* ── CTA BANNER ─────────────────────────────────────────── */}
            <section
              className="rounded-xl border border-slate-800 bg-gradient-to-br from-[#1E3A5F] to-[#020617] p-8 text-center"
              aria-labelledby="cta-heading"
            >
              <h2
                id="cta-heading"
                className="text-2xl font-bold text-white sm:text-3xl"
              >
                See how ZoneWise wins on <em className="not-italic text-[#F59E0B]">your</em> parcel
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
                BidDeed.AI foreclosure intelligence + ZoneWise.AI zoning analysis — together
                in one platform, across 67 Florida counties. Start free.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-bold text-[#020617] shadow-lg transition hover:bg-[#FBBF24]"
                >
                  Start for free →
                </Link>
                <Link
                  href="/explorer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                >
                  Explore live map
                </Link>
              </div>
            </section>

            {/* ── SOURCES (Honesty Protocol) ─────────────────────────── */}
            {competitor.sources.length > 0 && (
              <section
                aria-labelledby="sources-heading"
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-6"
              >
                <h2
                  id="sources-heading"
                  className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Sources (Honesty Protocol)
                </h2>
                <ul className="space-y-2 text-xs text-slate-400">
                  {competitor.sources.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-mono text-slate-600">[{s.date}]</span>
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#F59E0B] underline decoration-[#F59E0B]/30 hover:decoration-[#F59E0B]"
                        >
                          {s.label}
                        </a>
                      ) : (
                        <span>{s.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}
