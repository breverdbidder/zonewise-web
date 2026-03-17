'use client'

import { useUser as clerkUseUser, useClerk as clerkUseClerk, useAuth as clerkUseAuth, UserButton } from '@clerk/nextjs'

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export function useSafeUser() {
  if (!CLERK_KEY) {
    return { user: null, isLoaded: true, isSignedIn: false }
  }
  try {
    return clerkUseUser()
  } catch {
    return { user: null, isLoaded: true, isSignedIn: false }
  }
}

export function useSafeClerk() {
  if (!CLERK_KEY) {
    return { signOut: async () => { window.location.href = '/' } } as ReturnType<typeof clerkUseClerk>
  }
  try {
    return clerkUseClerk()
  } catch {
    return { signOut: async () => { window.location.href = '/' } } as ReturnType<typeof clerkUseClerk>
  }
}

export function useSafeAuth() {
  if (!CLERK_KEY) {
    return { getToken: async () => null, isSignedIn: false, userId: null } as unknown as ReturnType<typeof clerkUseAuth>
  }
  try {
    return clerkUseAuth()
  } catch {
    return { getToken: async () => null, isSignedIn: false, userId: null } as unknown as ReturnType<typeof clerkUseAuth>
  }
}

export function SafeUserButton(props: Record<string, any>) {
  if (!CLERK_KEY) return null
  return <UserButton {...props} />
}
