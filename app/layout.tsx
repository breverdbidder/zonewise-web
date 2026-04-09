import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import ConditionalClerkProvider from '@/components/ConditionalClerkProvider'
import { ThemeProvider } from '@/lib/theme-context'
import { OnboardingProvider } from '@/components/onboarding'
import dynamic from 'next/dynamic'

// EG14 P2 fix v6 (Apr 9 2026): lazy-load OnboardingTour to defer the 562ms
// hydration long task that Lighthouse v5 flagged on the / route. Tour is
// non-critical UI (overlay/tooltip) — safe to hydrate after first paint.
const OnboardingTour = dynamic(
  () => import('@/components/onboarding').then(m => ({ default: m.OnboardingTour })),
  { ssr: false }
)
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
  title: 'ZoneWise.AI — AI-Powered Auction Intelligence Nationwide',
  description: 'AI-powered zoning and auction intelligence. Live in 67 Florida counties. Expanding to all 50 states. Deal scoring, parcel analysis, and real-time foreclosure data.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'ZoneWise.AI — AI-Powered Auction Intelligence Nationwide',
    description: 'AI-powered zoning and auction intelligence. Live in 67 Florida counties. Expanding to all 50 states. Deal scoring, parcel analysis, and real-time foreclosure data.',
    siteName: 'ZoneWise.AI',
    url: 'https://www.zonewise.ai',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.zonewise.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZoneWise.AI — AI-Powered Auction Intelligence Nationwide',
    description: 'AI-powered zoning and auction intelligence. Live in 67 Florida counties. Expanding to all 50 states. Deal scoring, parcel analysis, and real-time foreclosure data.',
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
              "description": "AI-powered zoning and auction intelligence nationwide. Live in 67 Florida counties, expanding to all 50 states. Parcel analysis, foreclosure tracking, and investment scoring.",
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
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('hydrated');" }} />
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
