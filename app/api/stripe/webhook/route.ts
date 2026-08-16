import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Dynamic import to avoid build-time initialization
async function getStripe() {
  const Stripe = (await import('stripe')).default
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-09-30.acacia',
  })
}

// Fallback only: primary tier source is session.metadata.tier, set by
// app/api/stripe/checkout. This map covers checkouts created outside that
// flow (e.g. a Stripe Payment Link). Sourced from public.stripe_products
// (live_mode=true) 2026-08-16 — monthly + annual price ids per tier.
const PRICE_ID_TO_TIER: Record<string, string> = {
  'price_1ToWiPKaSTwZgYdf6sCxgRqs': 'investor',
  'price_1ToWiVKaSTwZgYdfbxRGo8hz': 'investor',
  'price_1ToWibKaSTwZgYdfZiWM5fdy': 'pro',
  'price_1ToWigKaSTwZgYdfO4jTa0po': 'pro',
  'price_1ToWinKaSTwZgYdf80Dg54Km': 'proplus',
  'price_1ToWiuKaSTwZgYdfn4cJqqBh': 'proplus',
}

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = await getStripe()
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Reject events with >5min clock skew (replay protection)
  const eventAge = Math.abs(Date.now() / 1000 - event.created)
  if (eventAge > 300) {
    return NextResponse.json({ error: 'Event too old' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.userId
      if (userId) {
        // Primary source: tier set by app/api/stripe/checkout when the
        // session was created. Fallback: derive from the purchased price,
        // for checkouts created outside that flow (e.g. a Payment Link).
        let plan = session.metadata?.tier
        if (!plan) {
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
            const priceId = lineItems.data[0]?.price?.id
            plan = priceId ? PRICE_ID_TO_TIER[priceId] : undefined
          } catch {
            plan = undefined
          }
        }

        if (!plan) {
          console.error(`checkout.session.completed ${session.id}: could not determine plan tier, skipping subscriptions write`)
          break
        }

        const { error } = await supabaseAdmin.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            status: 'active',
            plan,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )
        if (error) {
          console.error(`checkout.session.completed ${session.id}: subscriptions upsert failed: ${error.message}`)
        }
      }
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      await supabaseAdmin.from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
