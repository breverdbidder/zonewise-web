/**
 * Runtime environment variable validation.
 * Throws immediately if a required env var is missing,
 * making configuration errors fail fast at startup.
 */

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optionalEnv(key: string): string | undefined {
  return process.env[key] || undefined
}

export const env = {
  clerk: {
    publishableKey: optionalEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
    secretKey: optionalEnv('CLERK_SECRET_KEY'),
  },
  supabase: {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: optionalEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  anthropic: {
    apiKey: requireEnv('ANTHROPIC_API_KEY'),
  },
  stripe: {
    secretKey: requireEnv('STRIPE_SECRET_KEY'),
    webhookSecret: requireEnv('STRIPE_WEBHOOK_SECRET'),
  },
  mapbox: {
    token: optionalEnv('NEXT_PUBLIC_MAPBOX_TOKEN'),
  },
  app: {
    url: optionalEnv('NEXT_PUBLIC_APP_URL'),
  },
} as const
