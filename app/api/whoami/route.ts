import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'

// TEMPORARY debug route — added Aug 14 2026 to retrieve the founder's Clerk
// user ID for the ADMIN_USER_IDS entitlement override. Safe to delete once
// no longer needed: only returns the calling user's own identity, requires
// an authenticated session, and reveals nothing about other users.
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  const user = await currentUser()
  return NextResponse.json({
    authenticated: true,
    userId,
    primaryEmail: user?.primaryEmailAddress?.emailAddress ?? null,
  })
}
