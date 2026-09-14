import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo-metadata'
import Link from 'next/link'
import PricingTracker from '@/components/PricingTracker'
import { PlatformParcels } from '@/components/PlatformStat'

export const metadata: Metadata = pageMetadata.pricing

// ── Tier definitions ──────────────────────────────────────────────────────────
const TIERS = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Explore the market — no card needed',
    features: [
      'Choropleth heatmap (all 67 counties)',
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
    <div className="min-h-screen bg-[rgb(var(--zw-page))] text-[rgb(var(--zw-ink))]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <PricingTracker source="direct" />
      {/* Nav */}
      <nav className="h-14 flex items-center px-6 border-b border-[rgb(var(--zw-border2))]">
        <Link href="/" className="flex items-center gap-2 min-h-11">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[rgb(var(--zw-elev))] to-[rgb(var(--zw-elev))] flex items-center justify-center">
            <span className="text-[rgb(var(--zw-ink))] text-xs font-bold">Z</span>
          </div>
          <span className="text-sm font-semibold text-[rgb(var(--zw-ink))]">
            ZoneWise<span className="text-[rgb(var(--zw-brand))]">.AI</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/explore" className="text-sm text-[rgb(var(--zw-ink2))] hover:text-[rgb(var(--zw-ink))] transition-colors flex items-center min-h-11">
            Explore
          </Link>
          <Link
            href="/sign-up"
            className="text-sm bg-[rgb(var(--zw-brand))] text-[rgb(var(--zw-ink))] px-4 py-2 rounded-lg font-bold hover:brightness-110 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-12 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--zw-elev)/0.4)] border border-[rgb(var(--zw-border2)/0.6)] rounded-full text-xs text-[rgb(var(--zw-ink2))] mb-6">
          <span className="w-1.5 h-1.5 bg-[rgb(var(--zw-brand))] rounded-full animate-pulse" />
          Early access — lock in founder pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-[rgb(var(--zw-ink))] mb-4 tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-[rgb(var(--zw-ink2))] text-lg max-w-xl mx-auto">
          Start free. The choropleth heatmap is{' '}
          <span className="text-[rgb(var(--zw-brand))] font-semibold">always free</span>
          {' '}— no login required.
        </p>
      </section>

      {/* Annual toggle note */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 text-sm text-[rgb(var(--zw-ink2))]">
          <span className="line-through">Monthly pricing shown</span>
          <span className="bg-[rgb(var(--zw-elev)/0.6)] border border-[rgb(var(--zw-border2))] text-[rgb(var(--zw-brand))] text-xs px-2 py-0.5 rounded font-semibold">
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
                  ? 'bg-[rgb(var(--zw-elev)/0.3)] border-2 border-[rgb(var(--zw-border2))] shadow-xl shadow-[#1B2737]/20'
                  : 'bg-[rgb(var(--zw-page)/0.5)] border border-[rgb(var(--zw-border2))]'
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[rgb(var(--zw-brand))] text-[rgb(var(--zw-ink))] text-xs px-4 py-1 rounded-full font-bold whitespace-nowrap">
                  {tier.badge}
                </span>
              )}

              {/* Tier header */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[rgb(var(--zw-ink))] mb-1">{tier.name}</h3>
                <p className="text-sm text-[rgb(var(--zw-ink2))] mb-4">{tier.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-[rgb(var(--zw-ink))]">
                    {tier.monthlyPrice === 0 ? '$0' : `$${tier.monthlyPrice}`}
                  </span>
                  {tier.monthlyPrice > 0 && (
                    <span className="text-[rgb(var(--zw-ink2))] text-sm mb-1.5">/mo</span>
                  )}
                </div>
                {tier.annualPrice > 0 && (
                  <p className="text-xs text-[rgb(var(--zw-ink2))] mt-1">
                    or ${tier.annualPrice}/mo billed annually
                  </p>
                )}
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 flex-1 mb-8">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[rgb(var(--zw-ink2))]">
                    <svg
                      className="w-4 h-4 text-[rgb(var(--zw-brand))] mt-0.5 flex-shrink-0"
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
                    ? 'bg-[rgb(var(--zw-brand))] text-[rgb(var(--zw-ink))] hover:brightness-110'
                    : tier.monthlyPrice === 0
                    ? 'bg-[rgb(var(--zw-elev))] text-[rgb(var(--zw-ink))] hover:bg-[rgb(var(--zw-elev))]'
                    : 'border border-[rgb(var(--zw-border2))] text-[rgb(var(--zw-brand))] hover:bg-[rgb(var(--zw-elev)/0.3)]'
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
            { icon: '🏡', title: '67-county Florida coverage', body: <><PlatformParcels /> parcels statewide, live data daily.</> },
          ].map(item => (
            <div key={item.title} className="bg-[rgb(var(--zw-page)/0.5)] border border-[rgb(var(--zw-border2))] rounded-xl p-5">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h4 className="text-sm font-bold text-[rgb(var(--zw-ink))] mb-1">{item.title}</h4>
              <p className="text-xs text-[rgb(var(--zw-ink2))] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// Vercel rebuild trigger
