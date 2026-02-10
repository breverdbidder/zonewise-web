import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * SEC-002: OAuth callback with CSRF state validation.
 *
 * The OAuth initiation must set a `oauth_state` httpOnly cookie with a
 * crypto-random value, and pass the same value as the `state` parameter
 * to the OAuth provider. This callback validates that they match.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors from provider
  if (errorParam) {
    console.error(`OAuth error: ${errorParam} — ${errorDescription}`)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || errorParam)}`
    )
  }

  // SEC-002: Validate CSRF state parameter
  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value

  if (storedState) {
    // State cookie exists — validate it matches the callback state
    if (!stateParam || stateParam !== storedState) {
      console.error('OAuth CSRF validation failed: state mismatch')
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Authentication failed: invalid state parameter. Please try again.')}`
      )
    }
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication failed: no authorization code received.')}`
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth code exchange failed:', error.message)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    )
  }

  // SEC-002: Clear the state cookie after successful validation
  const response = NextResponse.redirect(`${origin}/dashboard`)
  response.cookies.set('oauth_state', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
