import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Inter, JetBrains_Mono } from 'next/font/google'
import ConditionalClerkProvider from '@/components/ConditionalClerkProvider'
import { ThemeProvider } from '@/lib/theme-context'
import { OnboardingProvider, OnboardingTour } from '@/components/onboarding'
// REVERTED Apr 9 2026: lazy-load via next/dynamic broke Vercel build at
// commits 79547534 → 8fab12a7 → 3ab06f1c. 14/14 EG14 lock was already
// achieved without this optimization (next.config optimizePackageImports
// took perf 85→95 alone). Restoring static import to unblock Vercel deploys.
import SkipToContent from '@/components/SkipToContent'
import VercelAnalytics from '@/components/VercelAnalytics'
import PostHogProvider from '@/components/PostHogProvider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

// EG14 P2 fix (Apr 8 2026): self-host fonts via next/font/google to eliminate
// render-blocking @import url(fonts.googleapis.com) in globals.css.
// Saves ~2000ms render-blocking; pushes FCP 3.0s→~1.5s, LCP 3.7s→~2.5s.
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-jetbrains',
  fallback: ['SF Mono', 'Monaco', 'Andale Mono', 'monospace'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://zonewise.ai'),
  title: 'ZoneWise.AI — Nationwide Zoning Intelligence & Feasibility',
  description: 'AI-powered zoning intelligence and feasibility studies for developers and investors. All 67 Florida counties live, built for all 50 states.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'ZoneWise.AI — Nationwide Zoning Intelligence & Feasibility',
    description: 'AI-powered zoning intelligence and feasibility studies for developers and investors. All 67 Florida counties live, built for all 50 states.',
    siteName: 'ZoneWise.AI',
    url: 'https://www.zonewise.ai',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.zonewise.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZoneWise.AI — Nationwide Zoning Intelligence & Feasibility',
    description: 'AI-powered zoning intelligence and feasibility studies for developers and investors. All 67 Florida counties live, built for all 50 states.',
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://mocerqjnksmhcjzxrewo.supabase.co" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
        {/* EG14 P8 fix: removed broken /icons/icon-192.png ref. Next.js auto-generates from app/icon.tsx */}
        <meta name="google-site-verification" content="TREUQBk_PqAKP2IlfQh7WImMFNbXA68tWNq8fvbZCX0" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "ZoneWise.AI",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "description": "AI-powered zoning intelligence and feasibility studies for developers and investors. Live in all 67 Florida counties, built for all 50 states. Parcel analysis, foreclosure tracking, and investment scoring.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Everest Capital USA",
              "url": "https://everestcapitalusa.com",
              "logo": "https://zonewise.ai/icon.png",
              "description": "Florida real estate investment firm building ZoneWise.AI — an agentic AI platform for zoning intelligence and development feasibility.",
              "founder": {
                "@type": "Person",
                "name": "Ariel Shapira"
              },
              "foundingLocation": {
                "@type": "Place",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Satellite Beach",
                  "addressRegion": "FL",
                  "addressCountry": "US"
                }
              },
              "sameAs": [
                "https://biddeed.ai",
                "https://zonewise.ai",
                "https://github.com/breverdbidder"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Everest Capital USA",
              "description": "AI-powered real estate intelligence serving all 67 Florida counties. Zoning analysis, capacity and massing, and development feasibility.",
              "url": "https://zonewise.ai",
              "telephone": "+1-321-831-9757",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Satellite Beach",
                "addressRegion": "FL",
                "postalCode": "32937",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 28.1764,
                "longitude": -80.5901
              },
              "areaServed": {
                "@type": "State",
                "name": "Florida",
                "containedInPlace": {
                  "@type": "Country",
                  "name": "US"
                }
              },
              "priceRange": "$0 - $99/mo"
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is ZoneWise.AI?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ZoneWise.AI is an agentic AI ecosystem built by Everest Capital USA for zoning compliance, development feasibility, and parcel analysis across all 67 Florida counties. It pairs with BidDeed.AI for auction-specific intelligence."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How many Florida counties does ZoneWise.AI cover?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ZoneWise.AI covers all 67 Florida counties, including 369 jurisdictions and 5,950 zoning districts encompassing 10.8 million parcels statewide."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does ZoneWise.AI help with development feasibility?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ZoneWise.AI integrates with BidDeed.AI to provide live foreclosure auction tracking, automated deal scoring, judgment analysis, and max bid calculations using the formula: (ARV × 70%) - Repairs - $10K - MIN($25K, 15% × ARV)."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What zoning information can I look up on ZoneWise.AI?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can look up zoning classifications, permitted uses, setbacks, lot coverage, height restrictions, and development feasibility for any parcel in Florida. Free choropleth maps show zoning districts color-coded by use type for every county."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is ZoneWise.AI free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ZoneWise.AI offers a free tier with choropleth zoning maps, basic parcel lookups, and county-level auction summaries. The Pro tier at $99/month includes AI chat assistant, detailed zoning reports, auction deal scoring, and feasibility analysis."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What is a choropleth zoning map?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A choropleth zoning map is an interactive, color-coded map that visualizes zoning districts across a county. Each color represents a different zoning classification (residential, commercial, industrial, agricultural, etc.), making it easy to identify land use patterns at a glance."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does BidDeed.AI relate to ZoneWise.AI?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "BidDeed.AI is the foreclosure auction intelligence engine that powers ZoneWise.AI's auction features. While ZoneWise.AI focuses on zoning and parcel intelligence, BidDeed.AI handles auction data scraping, deal scoring, and investment analysis. Both are built by Everest Capital USA."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What data sources does ZoneWise.AI use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ZoneWise.AI combines data from the Florida Geographic Information Office (FL GIO) covering 10.8 million parcels, county-level GIS systems, court records for foreclosure data, and property appraiser databases. Data is updated daily through automated pipelines."
                  }
                }
              ]
            })
          }}
        />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('zw-theme') === 'light') {
              document.documentElement.classList.remove('dark');
            }
          } catch(e) {}
        `}} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('hydrated');" }} />
        <noscript><style>{"[style*='opacity: 0'],[style*='opacity:0']{opacity:1!important;transform:none!important;}"}</style></noscript>
      </head>
      <body>
        <SkipToContent />
        <VercelAnalytics />
        <ConditionalClerkProvider>
          <PostHogProvider>
            <ThemeProvider>
              <OnboardingProvider>
                <OnboardingTour />
                <main id="main-content">
                  {children}
                </main>
                <Toaster position="bottom-right" theme="dark" />
              </OnboardingProvider>
            </ThemeProvider>
          </PostHogProvider>
        </ConditionalClerkProvider>
      </body>
    </html>
  )
}
