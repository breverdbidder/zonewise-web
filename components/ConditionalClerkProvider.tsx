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
    formFieldInput: 'bg-slate-800 border-slate-600 text-white',
    footerActionLink: 'text-[#F59E0B] hover:text-[#fbbf24]',
    userButtonAvatarBox: 'w-7 h-7',
  },
}

export default function ConditionalClerkProvider({ children }: { children: React.ReactNode }) {
  // If Clerk publishable key is not set, render children without ClerkProvider
  // This prevents the entire app from freezing when Clerk isn't configured
  if (!CLERK_KEY) {
    return <>{children}</>
  }

  return (
    <ClerkProvider appearance={clerkAppearance}>
      {children}
    </ClerkProvider>
  )
}
