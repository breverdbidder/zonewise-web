import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Explore the map. No credit card.',
    cta: 'Start exploring',
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
    price: '$99',
    description: 'Full intelligence for active investors.',
    cta: 'Start Pro',
    href: '/sign-up?plan=pro',
    highlighted: true,
    badge: 'Most popular',
    features: [
      'All 67 FL counties',
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
              className={`relative border ${
                plan.highlighted
                  ? 'border-[#F59E0B]/50 bg-slate-900'
                  : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#F59E0B] text-slate-900 font-semibold">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.name !== 'Free' && <span className="text-slate-400 text-sm">/month</span>}
                </div>
                <p className="text-sm text-slate-400">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className={`w-full font-semibold ${
                    plan.highlighted
                      ? 'bg-[#F59E0B] text-slate-900 hover:bg-[#D97706]'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
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
