'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CreditCard, ExternalLink, Check, Loader2 } from 'lucide-react'

/**
 * /settings/billing — previously 404 while linked from the app sidebar, so a
 * customer who wanted to manage a subscription hit a dead page.
 *
 * Tiers mirror public.mcp_subscription_tiers (free / investor 99 / pro 199 /
 * proplus 299 / enterprise). Entitlement counts are deliberately NOT printed
 * here: the tier table and tier spec disagree on investor S5 allowance, and
 * publishing a number we cannot honour is worse than publishing none.
 *
 * priceId values sourced from public.stripe_products.stripe_price_id_monthly
 * (live_mode=true), queried 2026-08-16 — not invented.
 */

const TIERS = [
  { id: 'free', name: 'Free', price: '$0', blurb: 'Explore any Florida parcel.', priceId: null },
  {
    id: 'investor',
    name: 'Standard',
    price: '$99',
    blurb: 'Core feasibility for one operator.',
    priceId: 'price_1ToWiPKaSTwZgYdf6sCxgRqs',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$199',
    blurb: 'For operators sourcing deals.',
    priceId: 'price_1ToWibKaSTwZgYdfZiWM5fdy',
  },
  {
    id: 'proplus',
    name: 'Pro Plus',
    price: '$299',
    blurb: 'High-volume county coverage.',
    priceId: 'price_1ToWinKaSTwZgYdf80Dg54Km',
  },
]

export default function BillingPage() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  async function handleSubscribe(tierId: string, priceId: string) {
    setCheckoutError(null)
    setLoadingTier(tierId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, tier: tierId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Could not start checkout')
      }
      window.location.href = data.url
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Could not start checkout')
      setLoadingTier(null)
    }
  }

  return (
    <div className="min-h-full bg-[#020617] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[#F59E0B]">
          <CreditCard className="h-3.5 w-3.5" /> Billing
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Plan &amp; billing
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
          Manage your subscription, payment method and invoices. Billing is handled by Stripe —
          we never store card details.
        </p>

        <div className="mt-8 rounded-lg border p-6" style={{ background: '#0d1829', borderColor: 'rgba(30,58,95,0.6)' }}>
          <h2 className="text-sm font-semibold text-white">Manage subscription</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
            Update your card, change plan, download invoices, or cancel — all from the Stripe
            customer portal.
          </p>
          <Link
            href="/api/stripe/portal"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#F59E0B] px-5 py-2.5 text-sm font-bold text-[#160900] transition-shadow hover:shadow-[0_0_24px_rgba(245,158,11,0.45)]"
          >
            Open billing portal <ExternalLink className="h-4 w-4" />
          </Link>
          <p className="mt-3 font-mono text-[11px] text-slate-500">
            No active subscription? Pick a plan below to get started.
          </p>
        </div>

        <h2 className="mt-12 text-sm font-semibold text-white">Plans</h2>
        {checkoutError && (
          <p className="mt-3 text-[13px] text-red-400">{checkoutError}</p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border p-5"
              style={{ background: '#0d1829', borderColor: 'rgba(30,58,95,0.6)' }}
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#F59E0B]">
                {t.name}
              </div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-white">
                {t.price}
                {t.price !== '$0' && <span className="ml-1 text-xs font-normal text-slate-500">/mo</span>}
              </div>
              <p className="mt-2 text-[13px] text-slate-400">{t.blurb}</p>
              {t.priceId && (
                <button
                  type="button"
                  disabled={loadingTier !== null}
                  onClick={() => handleSubscribe(t.id, t.priceId!)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#F59E0B] px-4 py-2 text-[13px] font-bold text-[#160900] transition-shadow hover:shadow-[0_0_24px_rgba(245,158,11,0.45)] disabled:opacity-60"
                >
                  {loadingTier === t.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    `Subscribe to ${t.name}`
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border p-5" style={{ background: '#0d1829', borderColor: 'rgba(245,158,11,0.28)' }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#F59E0B]">Enterprise</div>
          <div className="mt-1 text-lg font-bold text-white">Custom</div>
          <p className="mt-2 text-[13px] text-slate-400">
            Org-wide access with volume county coverage and founder-led support.
          </p>
          <a
            href="mailto:ariel@everestcapitalusa.com?subject=ZoneWise%20Enterprise"
            className="mt-4 inline-flex items-center gap-2 rounded-md border px-4 py-2 text-[13px] font-semibold text-slate-200 transition-colors hover:border-[#F59E0B]/50 hover:text-white"
            style={{ borderColor: '#1E293B' }}
          >
            Contact sales <Check className="h-3.5 w-3.5" />
          </a>
        </div>

        <p className="mt-10 font-mono text-[11px] text-slate-600">
          Questions about an invoice? <Link href="/help" className="text-[#F59E0B]">Visit help</Link>
        </p>
      </div>
    </div>
  )
}
