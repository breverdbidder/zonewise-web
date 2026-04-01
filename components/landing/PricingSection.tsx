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
      'Brevard County choropleth map',
      'Public zoning lookup',
      'AI zoning chatbot (limited)',
      '5 auction records/month',
    ],
  },
  {
    name: 'Pro',
    price: '99',
    prefix: '$',
    description: 'Full intelligence for active investors.',
    cta: 'Start Pro',
    href: '/sign-up?plan=pro',
    highlighted: true,
    badge: 'Most popular',
    features: [
      '67 counties and growing — nationwide expansion in progress',
      'Unlimited auction records',
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
    <section className="bg-[#020617] py-20 sm:py-28" id="pricing">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple pricing</h2>
          <p className="text-slate-400">Start free. Upgrade when you find a deal worth closing.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border transition-shadow duration-500 ${
                plan.highlighted
                  ? 'border-[#F59E0B]/50 bg-slate-900 shadow-[0_0_40px_rgba(245,158,11,0.12)] hover:shadow-[0_0_64px_rgba(245,158,11,0.22)]'
                  : 'border-[#1E3A5F]/60 bg-slate-900/50'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#F59E0B] text-slate-900 font-semibold">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-light text-slate-400">{plan.prefix}</span>
                  <TextScramble
                    text={plan.price}
                    trigger="scroll"
                    duration={900}
                    color="white"
                    scramblingColor="rgba(245,158,11,0.6)"
                    className="text-4xl font-bold font-sans"
                  />
                  {plan.name !== 'Free' && <span className="text-slate-400 text-sm ml-0.5">/month</span>}
                </div>
                <p className="text-sm text-slate-400">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.highlighted ? (
                  <ParticleButton
                    particleType="confetti"
                    particleColor="#F59E0B"
                    variant="primary"
                    className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg"
                    onClick={() => { window.location.href = plan.href }}
                  >
                    {plan.cta}
                  </ParticleButton>
                ) : (
                  <Link
                    href={plan.href}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-[#1E3A5F]/70 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-[#1E3A5F]/30"
                  >
                    {plan.cta}
                  </Link>
                )}
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-[#F59E0B] shrink-0" />
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
