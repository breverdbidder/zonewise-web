// src/lib/seo-metadata.ts
// P2B-5: SEOWise — Centralized metadata for all routes
// Import into each page.tsx: export { metadata } from '@/lib/seo-metadata'

import type { Metadata } from 'next';

const BASE_URL = 'https://zonewise.ai';
const SITE_NAME = 'ZoneWise.AI';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

function meta(
  title: string,
  description: string,
  path: string,
  extra?: Partial<Metadata>
): Metadata {
  const url = `${BASE_URL}${path}`;
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    ...extra,
  };
}

export const pageMetadata = {
  home: meta(
    'AI-Powered Zoning Intelligence',
    'AI-powered zoning intelligence for Florida real estate. Explore 67 counties, 262K+ parcels with interactive maps and natural language search.',
    '/'
  ),

  explorer: meta(
    'Zoning Map Explorer',
    'Interactive zoning map explorer. Click any Florida county for instant zoning data, parcel details, and AI-powered analysis.',
    '/explorer'
  ),

  explorerCounty: (county: string) =>
    meta(
      `${county} County Zoning Map`,
      `Explore zoning data for ${county} County, Florida. Interactive map with parcel-level zoning classifications, land use, and demographics.`,
      `/explorer/${county.toLowerCase().replace(/\s+/g, '-')}`
    ),

  pricing: meta(
    'Plans & Pricing',
    'ZoneWise.AI pricing plans. Free explorer access with limited queries. Pro plans from $39/month for full 67-county access.',
    '/pricing'
  ),

  about: meta(
    'About ZoneWise.AI',
    'Built by Everest Capital USA. AI meets 10+ years of Florida real estate expertise. 67 counties, 262K+ parcels, 12-stage intelligence pipeline.',
    '/about'
  ),

  help: meta(
    'Help & FAQ',
    'ZoneWise.AI help center. Frequently asked questions, getting started guides, and support for zoning intelligence tools.',
    '/help'
  ),

  docs: meta(
    'API Documentation',
    'ZoneWise.AI API reference for Pro users. Endpoints, authentication, rate limits, and code examples.',
    '/docs'
  ),

  privacy: meta(
    'Privacy Policy',
    'ZoneWise.AI privacy policy. How we handle your data, cookies, and third-party services.',
    '/privacy'
  ),

  terms: meta(
    'Terms of Service',
    'ZoneWise.AI terms of service. Usage policies, data accuracy disclaimers, and subscription terms.',
    '/terms'
  ),
};

// JSON-LD Breadcrumb generator for explorer drill-down
export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
