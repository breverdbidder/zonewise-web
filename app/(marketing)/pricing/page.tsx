import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import PricingTracker from '@/components/PricingTracker'

export const metadata: Metadata = pageMetadata.pricing

// ── Tier definitions ──────────────────────────────────────────────────────────
const TIERS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Explore the market — no card needed',
    features: [
      'Choropleth heatmap (all 27 ZIPs)',
      '5 parcel clicks / day',
      '3 AI chat messages / day',
      'Basic zoning overlay',
      'Mobile app access',
    ],
    cta: 'Explore Now',
    ctaHref: '/explore',
    ctaStyle: 'navy' as const,
    badge: null,
  },
  {
    name: 'Starter',
    monthlyPrice: 39,
    annualPrice: 32,
    description: 'For active investors & developers',
    features: [
      'Everything in Free',
      '50 parcel clicks / day',
      '20 AI chat messages / day',
      'Zoning filters (RU/BU/PUD/AU/IU)',
      'CSV export',
      'Statewide parcel coverage',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/sign-up?plan=starter',
    ctaStyle: 'orange' as const,
    badge: 'Most Popular',
  },
  {
    name: 'Pro',
    monthlyPrice: 99,
    annualPrice: 82,
    description: 'For teams, municipalities & power users',
    features: [
      'Everything in Starter',
      'Unlimited parcel clicks',
      'Unlimited AI chat',
      'API access (REST + MCP)',
      'Bulk parcel analysis',
      'AI zoning chatbot widget',
      'Custom county integrations',
      'Dedicated support',
    ],
    cta: 'Start Free Trial',
    ctaHref: '/sign-up?plan=pro',
    ctaStyle: 'navy' as const,
    badge: null,
  },
] as const

// ── Component ─────────────────────────────────────────────────────────────────
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <PricingTracker source="direct" />
      {/* Nav */}
      <nav className="h-14 flex items-center px-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#1E3A5F] to-[#2d5a8f] flex items-center justify-center">
            <span className="text-white text-xs font-bold">Z</span>
          </div>
          <span className="text-sm font-semibold text-white">
            ZoneWise<span className="text-[#F59E0B]">.AI</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/explore" className="text-sm text-slate-400 hover:text-white transition-colors">
            Explore
          </Link>
          <Link
            href="/sign-up"
            className="text-sm bg-[#F59E0B] text-slate-950 px-4 py-2 rounded-lg font-bold hover:brightness-110 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-12 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E3A5F]/40 border border-[#1E3A5F]/60 rounded-full text-xs text-slate-400 mb-6">
          <span className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-pulse" />
          Early access — lock in founder pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Start free. The choropleth heatmap is{' '}
          <span className="text-[#F59E0B] font-semibold">always free</span>
          {' '}— no login required.
        </p>
      </section>

      {/* Annual toggle note */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 text-sm text-slate-500">
          <span className="line-through">Monthly pricing shown</span>
          <span className="bg-[#1E3A5F]/60 border border-[#1E3A5F] text-[#F59E0B] text-xs px-2 py-0.5 rounded font-semibold">
            Annual billing saves 2 months
          </span>
        </span>
      </div>

      {/* Pricing cards */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          {TIERS.map(tier => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                tier.badge
                  ? 'bg-[#1E3A5F]/30 border-2 border-[#1E3A5F] shadow-xl shadow-[#1E3A5F]/20'
                  : 'bg-slate-900/50 border border-slate-800'
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-slate-950 text-xs px-4 py-1 rounded-full font-bold whitespace-nowrap">
                  {tier.badge}
                </span>
              )}

              {/* Tier header */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{tier.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">
                    {tier.monthlyPrice === 0 ? '$0' : `$${tier.monthlyPrice}`}
                  </span>
                  {tier.monthlyPrice > 0 && (
                    <span className="text-slate-500 text-sm mb-1.5">/mo</span>
                  )}
                </div>
                {tier.annualPrice > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    or ${tier.annualPrice}/mo billed annually
                  </p>
                )}
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 flex-1 mb-8">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <svg
                      className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={tier.ctaHref}
                className={`block text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                  tier.ctaStyle === 'orange'
                    ? 'bg-[#F59E0B] text-slate-950 hover:brightness-110'
                    : tier.monthlyPrice === 0
                    ? 'bg-[#1E3A5F] text-white hover:bg-[#2d5a8f]'
                    : 'border border-[#1E3A5F] text-[#F59E0B] hover:bg-[#1E3A5F]/30'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ / trust row */}
        <div className="max-w-3xl mx-auto px-4 mt-16 grid sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: '🔒', title: 'No credit card for Free', body: 'Explore the heatmap + parcels without signing up.' },
            { icon: '🔄', title: 'Cancel anytime', body: 'No contracts, no cancellation fees. Ever.' },
            { icon: '🏡', title: 'Brevard County focus', body: '262K+ parcels, 27 ZIPs, live Zillow data daily.' },
          ].map(item => (
            <div key={item.title} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// Vercel rebuild trigger
