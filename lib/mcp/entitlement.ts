// Server-side Pro entitlement check for MCP tools — same source of truth as
// app/api/report/route.ts checkProEntitlement() / app/api/zoning-chat/route.ts,
// parameterized by an already-verified Clerk userId (MCP tools authenticate via
// OAuth bearer token through withMcpAuth, not the cookie-based auth() session
// those two routes use, so the userId is passed in rather than re-derived).
// Never trust a client-supplied entitlement flag — this always re-checks
// ADMIN_USER_IDS + subscriptions server-side.
import { createClient } from '@supabase/supabase-js'

export async function checkProEntitlementForUser(userId: string | null | undefined): Promise<boolean> {
  try {
    if (!userId) return false

    const adminIds = (process.env.ADMIN_USER_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (adminIds.includes(userId)) return true

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    return !!data
  } catch {
    return false
  }
}
