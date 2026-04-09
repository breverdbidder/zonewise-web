// data/competitors/propzone.ts
// Battle Card #2 — PropZone / Gridics (CRITICAL threat, namesake zoning card competitor)
// Sources (VERIFIED):
//   - docs/plans/PROPZONE-COMPARISON-SPEC.md (cli-anything-biddeed, 2026-03-25)
//   - PropZone sample report: 169 E FLAGLER ST Miami FL 33131
//   - components/explorer/PropZoneCompare.tsx (existing 215-line deep comparison)
//   - app/api/explorer/propzone-intel/route.ts + propzone_intel Supabase table
//   - ClawdBot session Feb 16 2026 — 298 vs 63 KPI analysis
// Honesty Protocol: every claim below is VERIFIED from a dated source.

import type { CompetitorProfile } from '@/types/competitors'

export const propzone: CompetitorProfile = {
  // ── IDENTITY ──────────────────────────────────────────────────────────────
  slug: 'propzone',
  name: 'PropZone / Gridics',
  tagline: 'Zoning property reports for architects, developers, and municipalities',
  domain: 'propzone.gridics.com',
  threat: 'CRITICAL',

  // ── COMPANY CONTEXT (VERIFIED) ────────────────────────────────────────────
  founded_year: 2013,
  funding: '$3M seed + $5M Series A filing (Gridics parent)',
  coverage: 'Per-parcel zoning cards — Miami-Dade, Orlando, Atlanta, Seattle; Florida municipal contracts',
  customer_count: 'Architects, developers, urban planners, municipal gov contracts',

  // ── POSITIONING ───────────────────────────────────────────────────────────
  their_strengths: [
    'Per-parcel zoning property cards with 35+ dimensional fields — architect-grade depth',
    '$650/report pricing targets high-value feasibility studies',
    'Vector-tile overlay on Mapbox GL for interactive zoning boundaries',
    'Municipal contracts provide authoritative zoning data directly from city code',
    'Setbacks include water/riparian (ours does not yet)',
  ],

  their_weaknesses: [
    'Zero AI chatbot — static data display only, no natural-language Q&A',
    'Zero auction intelligence (foreclosures, tax deeds, judgment data)',
    'Zero ML predictions, risk scoring, or bid recommendations',
    'Zero lien/title analysis — cannot surface liens surviving foreclosure',
    'Per-report pricing ($650) does not scale for high-volume investors',
    'No API access for developers at standard tier — gated behind enterprise contracts',
  ],

  our_edge: [
    'AI chatbot at chat.zonewise.ai answers zoning questions in plain English',
    '256,601 auctions + 1,162 foreclosures in production — PropZone has none',
    'Shapira Formula ML predictions score every parcel for investor fit',
    'Complete lien waterfall analysis identifies liens surviving foreclosure',
    '$99/mo flat price vs $650/report — 85%+ cheaper for frequent users',
    'Decoded zoning ("Single-family 7,500 sqft min lot, 35ft max") not raw "R-1" codes',
  ],

  // ── PRICING COMPARISON ────────────────────────────────────────────────────
  pricing: [
    {
      label: 'Single Report',
      competitor_price: '$650 / report',
      zonewise_price: '$99 / mo (unlimited)',
      savings_pct: 85,
    },
    {
      label: 'Professional Firm',
      competitor_price: '$10,000+ / year',
      zonewise_price: '$149 / mo ($1,788 / yr)',
      savings_pct: 82,
    },
    {
      label: 'Enterprise',
      competitor_price: '$24K-48K / year (custom)',
      zonewise_price: '$599 / mo ($7,188 / yr)',
      savings_pct: 75,
    },
  ],

  // ── HEAD-TO-HEAD VERDICT ──────────────────────────────────────────────────
  zonewise_wins: 40,
  competitor_wins: 4,
  ties: 26,
  verdict_line:
    'PropZone sells you a beautiful zoning PDF for $650. ZoneWise gives you the same zoning data plus auctions, liens, ML scoring, and an AI that explains what to do with it — for $99/month unlimited.',

  // ── KPI PARITY MATRIX (26 rows where both platforms cover the field) ──────
  // Sourced from docs/plans/PROPZONE-COMPARISON-SPEC.md "Feature Parity Matrix" table.
  parity_kpi_codes: [
    // Property basics (both use BCPAO)
    'PRO-001', // Parcel ID
    'PRO-002', // Legal Description
    'PRO-003', // Property Address
    'PRO-004', // Property Class
    'PRO-005', // Year Built
    'PRO-006', // Living Area (Sqft)
    'PRO-007', // Lot Size (Sqft)
    'PRO-014', // Assessed Value
    'PRO-015', // Market Value (Appraiser)
    'PRO-017', // Last Sale Date
    'PRO-018', // Last Sale Price
    // Zoning (PropZone's core offering)
    'ZON-001', // Zoning District
    'ZON-002', // Future Land Use
    'ZON-003', // Max Density (Units/Acre)
    'ZON-004', // Min Lot Size
    'ZON-005', // Front Setback
    'ZON-006', // Rear Setback
    'ZON-007', // Side Setback
    'ZON-008', // Max Height (Ft)
    'ZON-009', // Max Lot Coverage (%)
    'ZON-012', // Overlay Districts
    'ZON-018', // Variance/Special Use History
    // Development basics
    'DEV-001', // Buildable Square Footage
    'DEV-002', // FAR (Floor Area Ratio)
    'DEV-011', // Road Frontage
    'DEV-015', // Parking Requirements
  ],

  // ── ZONEWISE ADVANTAGES (40 KPIs PropZone has zero of) ────────────────────
  // These are a curated subset of our 230 exclusive KPIs — the ones most
  // directly relevant to the investor/developer workflow PropZone targets.
  advantage_kpi_codes: [
    // ALL Auction Intelligence (18) — PropZone has none
    'AUC-001', 'AUC-002', 'AUC-003', 'AUC-004', 'AUC-005', 'AUC-006',
    'AUC-007', 'AUC-008', 'AUC-009', 'AUC-010', 'AUC-011', 'AUC-012',
    'AUC-013', 'AUC-014', 'AUC-015', 'AUC-016', 'AUC-017', 'AUC-018',
    // Financial analysis (6) — PropZone has only assessed value
    'FIN-001', // After-Repair Value (ARV)
    'FIN-002', // Max Bid Formula
    'FIN-006', // Projected ROI (Flip)
    'FIN-008', // Cap Rate
    'FIN-017', // Total All-In Cost
    'FIN-018', // BidWise Score
    // Lien & Title (5) — PropZone has zero lien data
    'LIE-012', // Total Lien Waterfall
    'LIE-013', // Liens Surviving Foreclosure
    'LIE-014', // Title Chain Integrity
    'LIE-017', // Open Permits
    'LIE-018', // Lien Buyout Estimate
    // ML Predictions (6) — PropZone has zero ML
    'ML-001', // BidWise Overall Score
    'ML-002', // Bid Recommendation
    'ML-005', // Title/Lien Score
    'ML-008', // Risk Score
    'ML-012', // Key Risk Flags
    'ML-013', // Key Upside Signals
    // HBU Analysis (3) — PropZone has zero HBU analytics
    'HBU-001', // Highest & Best Use
    'HBU-009', // Upzoning Probability
    'HBU-017', // HBU Development ROI
    // Red Flags (2) — investor-critical signals PropZone ignores
    'RED-001', // Judgment Under Market
    'RED-003', // Potential Surplus Claim
  ],

  // ── GAPS (PropZone has, ZoneWise does not yet — honest acknowledgment) ───
  // Flagged for Q2 2026 build per PROPZONE-COMPARISON-SPEC.md Phase 1/2 roadmap.
  gap_kpi_codes: [
    // These kpi_codes do not yet exist in STATIC_KPIS but are tracked as
    // build targets. CompetitorKpiMatrix renders them as "ROADMAP Q2 2026".
    'ZON-WATER-SETBACK',    // Water/riparian setback
    'ZON-MAX-LODGING',      // Max lodging rooms
    'ZON-MAX-OFFICE',       // Max office area
    'ZON-MAX-COMMERCIAL',   // Max commercial area
  ],

  // ── SEO METADATA ──────────────────────────────────────────────────────────
  meta_title: 'ZoneWise vs PropZone (Gridics) — Zoning Intelligence Comparison',
  meta_description:
    'Compare ZoneWise.AI against PropZone/Gridics. Same zoning data, plus auction intelligence, ML predictions, lien analysis, and AI chat — for 85% less.',

  // ── SOURCES (Honesty Protocol) ────────────────────────────────────────────
  sources: [
    {
      label: 'PROPZONE-COMPARISON-SPEC.md — internal parity analysis',
      url: 'https://github.com/breverdbidder/cli-anything-biddeed/blob/main/docs/plans/PROPZONE-COMPARISON-SPEC.md',
      date: '2026-03-25',
    },
    {
      label: 'PropZone sample report — 169 E FLAGLER ST Miami FL 33131',
      url: 'https://d29d8vt2n3bn4j.cloudfront.net/samples/Zoning%20Report%20169%20E%20FLAGLER%20ST%20Miami%20FL%2033131.pdf',
      date: '2026-03-25',
    },
    {
      label: 'propzone_intel Supabase table + scrape pipeline',
      date: '2026-03-25',
    },
    {
      label: 'ClawdBot session: 298 vs 63 KPI competitive analysis',
      date: '2026-02-16',
    },
  ],
}
