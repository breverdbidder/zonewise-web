import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: 'ZoneWise Explorer — Brevard County Choropleth Heatmap',
  description: 'Explore Brevard County Florida property data with Zillow ZHVI choropleth heatmap. Browse 262K+ parcels, filter by zoning, analyze auction opportunities. Free — no login required.',
  openGraph: {
    title: 'ZoneWise Explorer',
    description: 'Choropleth heatmap for Brevard County Florida. Free to explore.',
    images: ['/og-explorer.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

// ExplorerV2 uses Mapbox GL — must be client-side only
const ExplorerV2 = dynamic(
  () => import('@/components/explorer/ExplorerV2'),
  { ssr: false, loading: () => (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#94A3B8' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Loading Explorer…</p>
      </div>
    </div>
  )}
)

export default function ExplorerPage() {
  return <ExplorerV2 />
}
