import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Pricing — ZoneWise.AI',
  description: 'Start free. Unlock full Florida foreclosure intelligence with Starter $39/mo or Pro $99/mo.',
  openGraph: {
    title: 'ZoneWise.AI Pricing',
    description: 'Free tier with 5 parcel clicks/day. Starter $39/mo. Pro $99/mo unlimited.',
    images: ['/og-pricing.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    sub: 'No credit card needed',
    badge: null,
    features: [
      'Choropleth heatmap — all ZIPs',
      '5 parcel clicks/day',
      '3 AI chat messages/day',
      'Basic zoning overlay',
      'Auction calendar view',
    ],
    cta: 'Explore Now',
    ctaHref: '/explorer',
    ctaStyle: 'secondary',
  },
  {
    name: 'Starter',
    price: '$39',
    period: '/mo',
    sub: 'For serious investors',
    badge: null,
    features: [
      'Everything in Free',
      '50 parcel clicks/day',
      '50 AI chat messages/day',
      'Zoning filters & overlays',
      'Auction calendar + alerts',
      'Export CSV reports',
    ],
    cta: 'Start Starter',
    ctaHref: '/sign-up?plan=starter',
    ctaStyle: 'secondary',
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/mo',
    sub: 'Full platform — no limits',
    badge: 'Most Popular',
    features: [
      'Everything in Starter',
      'Unlimited parcel clicks',
      'Unlimited AI chat',
      'Full 67-county heatmap',
      'PDF deal analysis reports',
      'BidWise score + auction intel',
      'API access',
    ],
    cta: 'Go Pro',
    ctaHref: '/sign-up?plan=pro',
    ctaStyle: 'primary',
  },
]

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ paddingTop: 80, paddingBottom: 24, textAlign: 'center', padding: '80px 24px 32px' }}>
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#F59E0B', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 16 }}>
          PRICING
        </p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, color: '#F1F5F9', lineHeight: 1.1, letterSpacing: '-.02em', marginBottom: 16 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 480, margin: '0 auto' }}>
          Start free. Upgrade when you need more.
        </p>
      </section>

      {/* Tiers */}
      <section style={{ padding: '32px 24px 80px' }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          alignItems: 'start',
        }}>
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              style={{
                position: 'relative',
                background: tier.ctaStyle === 'primary' ? '#0F1F35' : '#0B1321',
                border: `2px solid ${tier.ctaStyle === 'primary' ? '#1E3A5F' : '#1E293B'}`,
                borderRadius: 20,
                padding: '32px 28px',
                boxShadow: tier.ctaStyle === 'primary' ? '0 0 40px rgba(30,58,95,0.4)' : 'none',
              }}
            >
              {tier.badge && (
                <span style={{
                  position: 'absolute',
                  top: -14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#F59E0B',
                  color: '#020617',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 16px',
                  borderRadius: 99,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {tier.badge}
                </span>
              )}

              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>
                {tier.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 44, fontWeight: 800, color: '#F1F5F9', lineHeight: 1 }}>{tier.price}</span>
                {tier.period && <span style={{ fontSize: 16, color: '#64748B' }}>{tier.period}</span>}
              </div>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>{tier.sub}</p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#CBD5E1' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaHref}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '14px 0',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  transition: 'filter 0.15s',
                  ...(tier.ctaStyle === 'primary'
                    ? { background: '#F59E0B', color: '#020617' }
                    : { background: '#1E3A5F', color: '#F1F5F9' }),
                }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ nudge */}
        <p style={{ textAlign: 'center', marginTop: 48, fontSize: 14, color: '#475569' }}>
          Questions?{' '}
          <a href="mailto:ariel@everestcapitalusa.com" style={{ color: '#F59E0B', textDecoration: 'none' }}>
            Email us
          </a>
          {' · '}
          <Link href="/explorer" style={{ color: '#94A3B8', textDecoration: 'none' }}>
            Try it free →
          </Link>
        </p>
      </section>

      <Footer />
    </div>
  )
}
