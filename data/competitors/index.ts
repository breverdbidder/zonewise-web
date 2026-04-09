// data/competitors/index.ts
// Battle Cards Sprint S0a — competitor registry
// The 11 competitors locked Mar 30 2026 + MapWise added Apr 3 2026.
// Each competitor's full profile lives in its own file and is imported here.
// S0b-S0e progressively fill in full profiles for all 11.

import type { CompetitorProfile, ThreatLevel } from '@/types/competitors'
import { propzone } from './propzone'

// ── COMPETITOR SLUGS (locked) ───────────────────────────────────────────────
export const COMPETITOR_SLUGS = [
  'algoma',           // #1 CRITICAL  — S0c (next, pending approval)
  'propzone',         // #2 CRITICAL  — S0b SHIPPED (full profile below)
  'zoneomics',        // #3 CRITICAL
  'mapwise',          // #11 HIGH     — S0d (namesake threat, added Apr 3)
  'propertyonion',    // #4 HIGH
  'forma-zoneomics',  // #5 HIGH
  'testfit',          // #6 MEDIUM
  'reventure',        // #7 MEDIUM
  'foreclosure-com',  // #8 MEDIUM (PAIRING RULE — BidDeed.AI domain)
  'ai-topia',         // #9 LOW
  'corelogic-attom',  // #10 LOW
] as const

export type CompetitorSlug = typeof COMPETITOR_SLUGS[number]

// ── STUB PROFILES for S0c-S0e (title/threat only, full content TBD) ──────
// Each stub renders a "Coming soon" banner with threat badge and the
// positioning line Ariel already approved in BATTLE-CARDS-SPRINT-S0-ADDENDUM.md.
// As each card is built, replace its stub with a full import.
function stub(
  slug: string,
  name: string,
  tagline: string,
  threat: ThreatLevel,
  domain: string,
): CompetitorProfile {
  return {
    slug,
    name,
    tagline,
    domain,
    threat,
    their_strengths: [],
    their_weaknesses: [],
    our_edge: [],
    pricing: [],
    zonewise_wins: 0,
    competitor_wins: 0,
    ties: 0,
    verdict_line: `Full battle card pending review — tracked in BATTLE-CARDS-SPRINT-S0-ADDENDUM.md`,
    parity_kpi_codes: [],
    advantage_kpi_codes: [],
    gap_kpi_codes: [],
    meta_title: `ZoneWise vs ${name} — Coming Soon`,
    meta_description: `ZoneWise.AI head-to-head analysis against ${name}. Full battle card in development.`,
    sources: [],
  }
}

// ── REGISTRY: 11 profiles ────────────────────────────────────────────────
export const COMPETITORS: Record<CompetitorSlug, CompetitorProfile> = {
  propzone,
  algoma: stub(
    'algoma',
    'Algoma',
    'Turn any address into a feasibility overview with native 3D massing',
    'CRITICAL',
    'algoma.co',
  ),
  zoneomics: stub(
    'zoneomics',
    'Zoneomics',
    'Zoning data for 10,000+ cities, 100M+ parcels — Autodesk Forma integration',
    'CRITICAL',
    'zoneomics.com',
  ),
  mapwise: stub(
    'mapwise',
    'MapWise',
    '26-year FL incumbent GIS map viewer for real estate professionals',
    'HIGH',
    'mapwise.com',
  ),
  propertyonion: stub(
    'propertyonion',
    'PropertyOnion',
    '130 KPIs for FL real estate investors — foreclosure overlap',
    'HIGH',
    'propertyonion.com',
  ),
  'forma-zoneomics': stub(
    'forma-zoneomics',
    'AutoDesk Forma + Zoneomics',
    'Architect-grade 3D building envelope with national zoning overlay',
    'HIGH',
    'autodesk.com/products/forma',
  ),
  testfit: stub(
    'testfit',
    'TestFit',
    'Real estate feasibility automation for developers',
    'MEDIUM',
    'testfit.io',
  ),
  reventure: stub(
    'reventure',
    'Reventure',
    'Lead-gen flywheel for FL real estate market intelligence',
    'MEDIUM',
    'reventure.app',
  ),
  'foreclosure-com': stub(
    'foreclosure-com',
    'Foreclosure.com',
    'Direct BidDeed.AI competitor — national foreclosure listings',
    'MEDIUM',
    'foreclosure.com',
  ),
  'ai-topia': stub(
    'ai-topia',
    'AI Topia',
    'AI-first property analysis platform — low traction',
    'LOW',
    'aitopia.com',
  ),
  'corelogic-attom': stub(
    'corelogic-attom',
    'CoreLogic / ATTOM',
    'Enterprise property data giants — wholesale data licensing',
    'LOW',
    'corelogic.com',
  ),
}

// ── CARD SUMMARIES for index page ────────────────────────────────────────
export function getAllCardSummaries() {
  return COMPETITOR_SLUGS.map((slug) => {
    const c = COMPETITORS[slug]
    return {
      slug: c.slug,
      name: c.name,
      threat: c.threat,
      tagline: c.tagline,
      zonewise_wins: c.zonewise_wins,
      competitor_wins: c.competitor_wins,
      ties: c.ties,
    }
  })
}

export function getCompetitorBySlug(slug: string): CompetitorProfile | null {
  if ((COMPETITOR_SLUGS as readonly string[]).includes(slug)) {
    return COMPETITORS[slug as CompetitorSlug]
  }
  return null
}
