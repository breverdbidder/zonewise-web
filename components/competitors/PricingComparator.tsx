// components/competitors/PricingComparator.tsx
// Battle Cards Sprint S0a — pricing comparison table for battle cards
// Renders 1-3 pricing tiers (Individual, Professional, Enterprise) with
// competitor price, ZoneWise price, and savings percentage.

import type { PricingTier } from '@/types/competitors'

interface Props {
  competitorName: string
  tiers: PricingTier[]
}

export function PricingComparator({ competitorName, tiers }: Props) {
  if (tiers.length === 0) return null

  return (
    <section
      aria-labelledby="pricing-heading"
      className="rounded-xl border border-[rgb(var(--zw-border2))] bg-[rgb(var(--zw-page)/0.4)] p-6"
    >
      <h2
        id="pricing-heading"
        className="mb-1 text-xs font-bold uppercase tracking-wider text-[rgb(var(--zw-ink2))]"
      >
        Pricing comparison
      </h2>
      <p className="mb-5 text-xs text-[rgb(var(--zw-ink2))]">
        Sources: {competitorName} published pricing and ZoneWise.AI plans (
        <a
          href="/pricing"
          className="text-[rgb(var(--zw-brand))] underline decoration-[#1A90FF]/40 hover:decoration-[#1A90FF]"
        >
          /pricing
        </a>
        ).
      </p>

      <div className="overflow-x-auto rounded-lg border border-[rgb(var(--zw-border2))]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[rgb(var(--zw-border2))] bg-[rgb(var(--zw-page)/0.6)]">
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--zw-ink2))]">
                Tier
              </th>
              <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--zw-ink2))]">
                {competitorName}
              </th>
              <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--zw-brand))]">
                ZoneWise.AI
              </th>
              <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                Savings
              </th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier, i) => (
              <tr
                key={tier.label}
                className={`border-b border-[rgb(var(--zw-border2)/0.5)] ${i % 2 === 0 ? 'bg-[rgb(var(--zw-page)/0.3)]' : ''}`}
              >
                <td className="px-4 py-3 font-semibold text-[rgb(var(--zw-ink))]">{tier.label}</td>
                <td className="px-4 py-3 text-right font-mono text-[rgb(var(--zw-ink2))]">{tier.competitor_price}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-[rgb(var(--zw-brand))]">
                  {tier.zonewise_price}
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-400">
                  {tier.savings_pct !== undefined ? `${tier.savings_pct}% cheaper` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
