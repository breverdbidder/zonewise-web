import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Site Feasibility | ZoneWise.AI',
  description: 'AI-powered site feasibility analysis for real estate investors',
}

export default function FeasibilityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Google Fonts for feasibility UI */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
