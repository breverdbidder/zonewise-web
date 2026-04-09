// app/(marketing)/competitors/[slug]/page.tsx
// Battle Cards Sprint S0a — dynamic route for /competitors/<slug>
// Server component: no 'use client', pre-renders all 11 cards at build time
// for optimal Lighthouse / LCP / SEO.

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  COMPETITOR_SLUGS,
  getCompetitorBySlug,
} from '@/data/competitors'
import { BattleCardLayout } from '@/components/competitors/BattleCardLayout'

// Pre-render all 11 slugs at build time
export function generateStaticParams() {
  return COMPETITOR_SLUGS.map((slug) => ({ slug }))
}

// Per-competitor SEO metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const competitor = getCompetitorBySlug(slug)
  if (!competitor) {
    return {
      title: 'Competitor not found',
    }
  }
  return {
    title: competitor.meta_title,
    description: competitor.meta_description,
    openGraph: {
      title: competitor.meta_title,
      description: competitor.meta_description,
      url: `https://zonewise.ai/competitors/${competitor.slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: competitor.meta_title,
      description: competitor.meta_description,
    },
    alternates: {
      canonical: `https://zonewise.ai/competitors/${competitor.slug}`,
    },
  }
}

export default async function CompetitorBattleCardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const competitor = getCompetitorBySlug(slug)
  if (!competitor) {
    notFound()
  }
  return <BattleCardLayout competitor={competitor} />
}
