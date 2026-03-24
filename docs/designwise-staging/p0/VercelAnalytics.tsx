// src/components/VercelAnalytics.tsx
// P0-3: AnalyticsWise — Vercel Analytics
// Install: npm install @vercel/analytics @vercel/speed-insights

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
