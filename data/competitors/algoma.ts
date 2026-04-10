// data/competitors/algoma.ts
// Battle Card #1 — Algoma (LOW threat, parallel-market feasibility + construction)
// Patent-correlated: maps 12 Shapira Formula V3.1 claims against Algoma's capabilities.
// Sources (VERIFIED):
//   - Algoma.co product page and demo (reviewed Apr 10 2026)
//   - Shapira Formula V3.1 Invention Disclosure — 12 patent claims
//   - Issue #421 (cli-anything-biddeed) — patent-correlated battle card spec
// Honesty Protocol: every claim below is VERIFIED from a dated source.

import type { CompetitorProfile } from '@/types/competitors'

export const algoma: CompetitorProfile = {
  // ── IDENTITY ──────────────────────────────────────────────────────────────
  slug: 'algoma',
  name: 'Algoma',
  tagline: 'Turn any address into a feasibility overview with native 3D massing',
  domain: 'algoma.co',
  threat: 'LOW',

  // ── COMPANY CONTEXT (VERIFIED) ────────────────────────────────────────────
  coverage: 'Feasibility + construction intelligence for commercial developers',
  customer_count: 'Commercial & residential developers, lenders',

  // ── POSITIONING ───────────────────────────────────────────────────────────
  their_strengths: [
    'Construction feasibility analysis with 3D massing visualization',
    'Site constraint assessment and building code compliance checks',
    'Pro forma financial modeling for new development projects',
    'Zoning compliance checking for commercial lenders and institutional buyers',
    'Entitlement risk assessment for pre-acquisition due diligence',
  ],

  their_weaknesses: [
    'Zero foreclosure or auction intelligence — no FC/TD data pipeline',
    'Zero ML deal scoring, bid recommendations, or ARV estimation',
    'No lien/title analysis — cannot surface liens surviving foreclosure',
    'Serves developers (post-acquisition), not investors (pre-acquisition)',
    'Enterprise pricing gates out individual investors entirely',
    'No agentic architecture — traditional request-response web app',
  ],

  our_edge: [
    'Parallel market: Algoma serves developers post-acquisition, we serve investors pre-acquisition',
    '245K+ auction records with daily refresh — Algoma has zero auction data',
    'Shapira Formula ML pipeline scores every parcel for investor fit (Claim 2)',
    '14-agent orchestration runs autonomously without human intervention (Claim 1)',
    'Cross-auction intelligence correlates FC + TD for dual-exposure opportunities (Claim 9)',
    'Potential integration partner, not direct competitor — acquisition → feasibility handoff',
  ],

  // ── PRICING COMPARISON ────────────────────────────────────────────────────
  pricing: [
    {
      label: 'Individual User',
      competitor_price: 'Enterprise only (no self-serve)',
      zonewise_price: '$99 / mo (unlimited)',
    },
    {
      label: 'Professional',
      competitor_price: 'Custom enterprise pricing',
      zonewise_price: '$149 / mo ($1,788 / yr)',
    },
  ],

  // ── HEAD-TO-HEAD VERDICT ──────────────────────────────────────────────────
  // Parallel market: different domains, so wins/losses reflect capability overlap areas only
  zonewise_wins: 28,
  competitor_wins: 5,
  ties: 8,
  verdict_line:
    'Algoma and BidDeed.AI don\'t compete — they complement. Algoma answers "Can I build on this site profitably?" after acquisition. BidDeed.AI answers "Should I acquire this distressed property?" before the auction. Our 12 patent claims protect capabilities Algoma has no reason to build — and if they ever pivoted, they\'d face both our data moat (245K+ records) and our IP moat (12 claims).',

  // ── KPI PARITY MATRIX ─────────────────────────────────────────────────────
  // Minimal overlap since different market segments
  parity_kpi_codes: [
    'ZON-001', // Zoning District
    'ZON-002', // Future Land Use
    'ZON-003', // Max Density
    'ZON-005', // Front Setback
    'ZON-006', // Rear Setback
    'ZON-007', // Side Setback
    'ZON-008', // Max Height
    'ZON-009', // Max Lot Coverage
  ],

  // ── ZONEWISE ADVANTAGES (Algoma has zero of these) ────────────────────────
  advantage_kpi_codes: [
    // Auction Intelligence (18) — Patent Claims 1, 9, 12
    'AUC-001', 'AUC-002', 'AUC-003', 'AUC-004', 'AUC-005', 'AUC-006',
    'AUC-007', 'AUC-008', 'AUC-009', 'AUC-010', 'AUC-011', 'AUC-012',
    'AUC-013', 'AUC-014', 'AUC-015', 'AUC-016', 'AUC-017', 'AUC-018',
    // Financial analysis (6) — Patent Claims 2, 6
    'FIN-001', // ARV — Claim 7 (CMA Agent)
    'FIN-002', // Max Bid Formula — Claim 2 (Shapira Formula RL Engine)
    'FIN-006', // Projected ROI
    'FIN-008', // Cap Rate
    'FIN-017', // Total All-In Cost
    'FIN-018', // BidWise Score — Claim 8 (XGBoost ML Pipeline)
    // ML Predictions (4) — Patent Claims 5, 8
    'ML-001', // BidWise Overall Score
    'ML-002', // Bid Recommendation
    'ML-008', // Risk Score
    'ML-012', // Key Risk Flags
  ],

  // ── GAPS (Algoma has, ZoneWise does not) ──────────────────────────────────
  // These are construction/feasibility-specific — different domain entirely
  gap_kpi_codes: [
    'DEV-3D-MASSING',      // 3D massing visualization
    'DEV-CONSTRUCTION-EST', // Construction cost estimation
    'DEV-ENTITLEMENT',      // Entitlement risk scoring
    'DEV-BUILDING-CODE',    // Building code compliance
    'DEV-PRO-FORMA',        // Development pro forma modeling
  ],

  // ── SEO METADATA ──────────────────────────────────────────────────────────
  meta_title: 'ZoneWise vs Algoma — Feasibility vs Auction Intelligence',
  meta_description:
    'Compare ZoneWise.AI/BidDeed.AI against Algoma. Parallel markets: Algoma does construction feasibility, BidDeed.AI does foreclosure auction intelligence. 12 patent claims protect our moat.',

  // ── SOURCES (Honesty Protocol) ────────────────────────────────────────────
  sources: [
    {
      label: 'Algoma.co product page — feasibility + 3D massing review',
      url: 'https://algoma.co',
      date: '2026-04-10',
    },
    {
      label: 'Shapira Formula V3.1 Invention Disclosure — 12 patent claims',
      date: '2026-04-10',
    },
    {
      label: 'Issue #421 — patent-correlated battle card specification',
      url: 'https://github.com/breverdbidder/cli-anything-biddeed/issues/421',
      date: '2026-04-10',
    },
  ],
}
