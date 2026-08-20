'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#1E3A5F',
    colorDanger: '#dc2626',
    colorSuccess: '#16a34a',
    colorWarning: '#F59E0B',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  elements: {
    formButtonPrimary: 'bg-[#1E3A5F] hover:bg-[#2a5280] text-white',
    card: 'shadow-lg border border-slate-700',
    headerTitle: 'text-white',
    headerSubtitle: 'text-slate-400',
    socialButtonsBlockButton: 'border-slate-600 text-slate-300 hover:bg-slate-800',
    // placeholder: explicitly styled — the live Clerk card renders its light
    // theme despite baseTheme:dark, and the dark input's default placeholder
    // was near-invisible on it (dark-on-dark, flagged in the 2026-08-20 audit).
    formFieldInput: 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-400',
    footerActionLink: 'text-[#F59E0B] hover:text-[#fbbf24]',
    userButtonAvatarBox: 'w-7 h-7',
  },
}

// The shared dev instance is named "My Application" in Clerk's dashboard, so
// stock cards can render "Sign in to My Application". Renaming the instance
// would mis-title the OTHER property (biddeed shares this pool), so each site
// overrides the strings locally instead.
const clerkLocalization = {
  signIn: {
    start: {
      title: 'Sign in to ZoneWise.AI',
      subtitle: 'Welcome back! Please sign in to continue',
    },
  },
  signUp: {
    start: {
      title: 'Create your ZoneWise.AI account',
      subtitle: 'One account works across ZoneWise.AI and BidDeed.AI',
    },
  },
}

export default function ConditionalClerkProvider({
  children,
  nonce,
}: {
  children: React.ReactNode
  /**
   * CSP nonce from middleware (x-nonce). REQUIRED: script-src uses
   * 'strict-dynamic', which makes host allowlists inert — Clerk's injected
   * scripts are only trusted if they carry the nonce. Without this the sign-up
   * form renders but every Clerk request is blocked and Continue does nothing.
   */
  nonce?: string
}) {
  // If Clerk publishable key is not set, render children without ClerkProvider
  // This prevents the entire app from freezing when Clerk isn't configured
  if (!CLERK_KEY) {
    return <>{children}</>
  }

  return (
    <ClerkProvider appearance={clerkAppearance} localization={clerkLocalization} nonce={nonce}>
      {children}
    </ClerkProvider>
  )
}
