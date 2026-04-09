// components/VercelAnalytics.tsx
// EG14 P8 FIX (Apr 8 2026): Vercel Analytics integration not enabled on this project,
// resulting in /_vercel/insights/script.js returning 404 HTML and console errors.
// PostHog (PostHogProvider in layout.tsx) covers analytics. This component is now a
// no-op until Vercel Analytics is enabled in dashboard. Re-enable by uncommenting below.

'use client';

// import { Analytics } from '@vercel/analytics/react';
// import { SpeedInsights } from '@vercel/speed-insights/next';

export default function VercelAnalytics() {
  // return (<><Analytics /><SpeedInsights /></>);
  return null;
}
