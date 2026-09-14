"use client"

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { ParticleButton } from '@/components/cinematic/ParticleButton'
import { TextScramble } from '@/components/cinematic/TextScramble'

const plans = [
  {
    name: 'Free',
    price: '0',
    prefix: '$',
    description: 'Explore the map. No credit card.',
    cta: 'Start Free',
    href: '/sign-up',
    highlighted: false,
    features: [
      'Statewide Florida choropleth map',
      'Public zoning lookup',
      'AI zoning chatbot (limited)',
      '5 parcel reports per month',
    ],
  },
  // Tier list mirrors /pricing exactly — the two drifted (homepage showed
  // Free+Pro with "Most popular" on Pro while /pricing showed three tiers
  // with "Most popular" on Starter), which is contradictory price anchoring
  // on the same site. Flagged by the 2026-08-20 audit. Change /pricing and
  // this list together.
  {
    name: 'Starter',
    price: '39',
    prefix: '$',
    description: 'For active investors & developers.',
    cta: 'Start Free Trial',
    href: '/sign-up?plan=starter',
    highlighted: true,
    badge: 'Most popular',
    features: [
      'Everything in Free',
      '50 parcel clicks / day',
      'Zoning filters (RU/BU/PUD/AU/IU)',
      'CSV export',
      'Statewide parcel coverage',
    ],
  },
  {
    name: 'Pro',
    price: '99',
    prefix: '$',
    description: 'Full intelligence for active investors.',
    cta: 'Start Pro',
    href: '/sign-up?plan=pro',
    highlighted: false,
    features: [
      '67 counties and growing — nationwide expansion in progress',
      'Unlimited parcel reports',
      'Development feasibility studio',
      'Zoning reports (PDF export)',
      'Deal scoring + max-bid formula',
      'Telegram deal alerts',
      'Priority support',
    ],
  },
]

export function PricingSection() {
  return (
    <section className="bg-[rgb(var(--zw-page))] py-20 sm:py-28" id="pricing">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--zw-ink))] mb-4">Simple pricing</h2>
          <p className="text-[rgb(var(--zw-ink2))]">Start free. Upgrade when you find a deal worth closing.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border transition-shadow duration-500 ${
                plan.highlighted
                  ? 'border-[rgb(var(--zw-brand)/0.5)] bg-[rgb(var(--zw-page))] shadow-[0_0_40px_rgb(var(--zw-brand)/0.12)] hover:shadow-[0_0_64px_rgb(var(--zw-brand)/0.22)]'
                  : 'border-[rgb(var(--zw-border2)/0.6)] bg-[rgb(var(--zw-page)/0.5)]'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[rgb(var(--zw-brand))] text-[rgb(var(--zw-ink))] font-semibold">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-[rgb(var(--zw-ink))]">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-light text-[rgb(var(--zw-ink2))]">{plan.prefix}</span>
                  <TextScramble
                    text={plan.price}
                    trigger="scroll"
                    duration={900}
                    color="white"
                    scramblingColor="rgb(var(--zw-brand) / 0.6)"
                    className="text-4xl font-bold font-sans"
                  />
                  {plan.name !== 'Free' && <span className="text-[rgb(var(--zw-ink2))] text-sm ml-0.5">/month</span>}
                </div>
                <p className="text-sm text-[rgb(var(--zw-ink2))]">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.highlighted ? (
                  <ParticleButton
                    particleType="confetti"
                    particleColor="#1A90FF"
                    variant="primary"
                    className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg"
                    onClick={() => { window.location.href = plan.href }}
                  >
                    {plan.cta}
                  </ParticleButton>
                ) : (
                  <Link
                    href={plan.href}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-[rgb(var(--zw-border2)/0.7)] bg-transparent px-4 py-2.5 text-sm font-medium text-[rgb(var(--zw-ink2))] transition-colors hover:bg-[rgb(var(--zw-elev)/0.3)]"
                  >
                    {plan.cta}
                  </Link>
                )}
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[rgb(var(--zw-ink2))]">
                      <Check className="h-4 w-4 text-[rgb(var(--zw-brand))] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
