import type { Metadata, Viewport } from 'next'
import ConditionalClerkProvider from '@/components/ConditionalClerkProvider'
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "ZoneWise.AI",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "description": "AI-powered zoning and real estate intelligence for all 67 Florida counties. Parcel analysis, foreclosure tracking, and investment scoring.",
              "url": "https://zonewise.ai",
              "author": {
                "@type": "Organization",
                "name": "Everest Capital USA",
                "url": "https://everestcapitalusa.com"
              },
              "offers": {
                "@type": "AggregateOffer",
                "lowPrice": "0",
                "highPrice": "99",
                "priceCurrency": "USD"
              }
            })
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('zw-theme') === 'light') {
              document.documentElement.classList.remove('dark');
            }
          } catch(e) {}
        `}} />
      </head>
      <body>
        <ConditionalClerkProvider>
          <ThemeProvider>
            <OnboardingProvider>
              {children}
            </OnboardingProvider>
          </ThemeProvider>
        </ConditionalClerkProvider>
      </body>
    </html>
  )
}
