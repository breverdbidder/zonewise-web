import { NextResponse } from 'next/server'

/**
 * @deprecated OAuth callbacks are now handled by Clerk.
 * This route redirects to dashboard for backwards compatibility.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/dashboard`)
}
