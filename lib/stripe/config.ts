export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    queries: 25,
    features: ['Basic zoning lookup', 'Email support']
  },
  pro: {
    name: 'Pro',
    price: 29,
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
    queries: 500,
    features: ['Interactive map', 'PDF exports', 'API access', 'Priority support']
  },
  team: {
    name: 'Team',
    price: 99,
    priceId: process.env.STRIPE_PRICE_TEAM_MONTHLY,
    queries: 2000,
    features: ['5 team members', 'Custom reports', 'Dedicated support', 'Everything in Pro']
  }
}
