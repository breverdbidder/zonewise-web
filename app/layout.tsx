import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { ThemeProvider } from '@/lib/theme-context'
import { OnboardingProvider } from '@/components/onboarding'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://zonewise.ai'),
  title: 'ZoneWise.AI — AI Zoning Intelligence for Florida Real Estate',
  description: 'Every zoning rule, every parcel, every county in Florida. AI-powered property intelligence for investors, developers, and architects. Join the beta.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'ZoneWise.AI — AI Zoning Intelligence for Florida Real Estate',
    description: 'Every zoning rule, every parcel, every county in Florida. AI-powered property intelligence for investors, developers, and architects. Join the beta.',
    siteName: 'ZoneWise.AI',
    url: 'https://www.zonewise.ai',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.zonewise.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZoneWise.AI — AI Zoning Intelligence for Florida Real Estate',
    description: 'Every zoning rule, every parcel, every county in Florida. AI-powered property intelligence for investors, developers, and architects. Join the beta.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ZoneWise.AI',
  },
}

export const viewport: Viewport = {
  themeColor: '#1E3A5F',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('zw-theme') === 'light') {
              document.documentElement.classList.remove('dark');
            }
          } catch(e) {}
        `}} />
      </head>
      <body>
        <ClerkProvider
          appearance={{
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
          }}
        >
          <ThemeProvider>
            <OnboardingProvider>
              {children}
            </OnboardingProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
