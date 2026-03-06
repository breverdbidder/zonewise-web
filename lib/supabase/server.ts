import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client for server-side data operations.
 * Authentication is now handled by Clerk — this client is used
 * for database queries only, using the service role key for
 * server-side operations or anon key for RLS-protected queries.
 */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server operations')
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  )
}

/**
 * Create a Supabase client with anon key for RLS-protected queries.
 * When using Clerk, pass the Clerk userId to filter data.
 */
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}

// Legacy export for backwards compatibility during migration
export async function createClient() {
  return createAnonClient()
}
