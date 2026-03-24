// app/help/page.tsx
// P2B-1: SupportWise — FAQ page

import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo-metadata';
import HelpContent from './HelpContent';

export const metadata: Metadata = pageMetadata.help;

export default function HelpPage() {
  return <HelpContent />;
}
