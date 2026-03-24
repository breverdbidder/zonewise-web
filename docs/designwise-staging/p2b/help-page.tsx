// src/app/help/page.tsx
// P2B-1: SupportWise — FAQ page with accordion
// House brand: Navy #1E3A5F, Orange #F59E0B, Dark #020617

import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo-metadata';
import HelpContent from './HelpContent';

export const metadata: Metadata = pageMetadata.help;

export default function HelpPage() {
  return <HelpContent />;
}
