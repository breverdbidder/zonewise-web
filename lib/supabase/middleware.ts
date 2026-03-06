/**
 * @deprecated Supabase middleware is no longer used for authentication.
 * Auth is handled by Clerk's clerkMiddleware() in middleware.ts.
 * This file is kept for backwards compatibility during migration.
 */

import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } })
  // Auth is now handled by Clerk — return null user to prevent breaking
  // any code that still references this during migration
  return { response, user: null }
}
