import Stripe from 'stripe'

// Initialize Stripe only if key is available (prevents build errors)
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})
