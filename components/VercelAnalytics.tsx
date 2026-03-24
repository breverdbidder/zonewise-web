// components/VercelAnalytics.tsx
// P0-3: AnalyticsWise — Vercel Analytics + Speed Insights
// WIRING: After `npm install @vercel/analytics @vercel/speed-insights`:
//   1. Add to app/layout.tsx: import VercelAnalytics from '@/components/VercelAnalytics'
//   2. Add <VercelAnalytics /> inside <body> after <SkipToContent />

'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function VercelAnalytics() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
