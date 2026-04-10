# ZoneWise.AI Bake-Off — Trichotomy Evidence Matrix

**Date:** 2026-04-10
**Author:** Claude (SUMMIT #439 dispatch for Ariel Shapira)
**Method:** Tagged trichotomy — every cell carries a provenance tag

## Tag Legend

| Tag | Meaning | Standard |
|---|---|---|
| **[V]** | VERIFIED — live test with artifacts | Playwright session, screenshots, timing |
| **[D]** | DOCUMENTED — public source with URL | WebFetch or WebSearch, source cited |
| **[I]** | INFERRED — no direct evidence, flagged for Ariel manual verify | Reasoning stated |
| **[N/A]** | Tool does not claim this capability | Confirmed absent from public materials |

---

## Capability Matrix

| Capability | Manus | Reonomy | PropStream | LandGlide | ZoneWise + BidDeed |
|---|---|---|---|---|---|
| **FL parcel data** | [N/A] Generalist agent, no parcel DB | [D] PARTIAL — 54M commercial properties via 3,100+ county assessors. Residential parcels not confirmed. [Source](https://www.reonomy.com/platform/features) | [D] YES (partial) — nationwide property data covers FL. No FL-specific parcel count. [Source](https://www.propstream.com/news/why-is-tampa-fl-a-top-housing-market-for-2023) | [D] YES (basic) — 157M+ parcels, 3,200+ counties. 8 data fields only. [Source](https://landglide.com) | [D] YES — 10.8M FL parcels via FL GIO + county GIS. [Source](zonewise.ai) |
| **Foreclosure auction calendars** | [V] BLOCKED — login wall, no anonymous access. Cannot test. [Artifact](receipts/manus/blocker.md) | [D] NO — "pre-foreclosure stage" is a metadata field on CRE records, not a live auction calendar. [Source](https://www.reonomy.com/blog/post/commercial-real-estate-data) | [D] NO — pre-foreclosure lead list only. Blog says research independently. [Source](https://www.propstream.com/news/5-things-you-need-to-know-before-buying-a-property-at-auction) | [D] NO — word "foreclosure" absent from entire site. [Source](https://landglide.com) | [D] YES — `multi_county_auctions` table, 245K rows, refreshed nightly. [Source](Supabase production DB) |
| **Tax deed data** | [N/A] No real estate data | [D] NO — absent from all pages. [Source](https://www.reonomy.com — full site review) | [D] NO — absent from sitemap, blog, help center. [Source](https://www.propstream.com/sitemap.xml) | [D] NO — absent from entire site. [Source](https://landglide.com) | [D] YES — FC + TD cross-correlation engine. [Source](BidDeed pipeline) |
| **Max bid formula** | [V] BLOCKED — cannot submit prompt. [Artifact](receipts/manus/screenshot.png) | [D] NO — no bid calculator or ARV tool. [Source](https://www.reonomy.com/platform/features) | [D] NO — Analysis Tool is manual input; "users must obtain this information independently." [Source](https://www.propstream.com/news/a-step-by-step-guide-to-using-propstreams-analysis-tool) | [D] NO — no analysis tools of any kind. [Source](https://landglide.com) | [D] YES — Shapira Formula V2: (ARV×70%)−Repairs−$10K−MIN($25K,15%×ARV). [Source](BidDeed scoring engine) |
| **Lien position parsing** | [N/A] No court record access | [D] NO — 42M+ mortgage records but no lien priority analysis. [Source](https://www.reonomy.com/platform/features) | [D] NO — mortgage data covers loan type/rates, not lien hierarchy or judgment amounts. [Source](https://www.propstream.com/news/propstreams-new-mortgage-and-interest-rate-data) | [D] NO — no lien, judgment, or encumbrance data. [Source](https://landglide.com) | [D] YES — case number → lien position → judgment amount extraction. [Source](BidDeed pipeline) |
| **Spatial/choropleth mapping** | [N/A] No map layer | [D] NOT CONFIRMED — no public evidence of mapping interface. [Source](https://www.reonomy.com/platform/features) | [D] NO — "Draw Tool" for geographic search only, no heat maps or analytics. [Source](https://www.propstream.com/generating-new-listings-as-an-agent) | [D] NO — parcel boundary outlines only, no analytical mapping. [Source](https://landglide.com) | [D] YES — Mapbox choropleth, parcel-level zoning overlays. [Source](zonewise.ai/conquest) |
| **Agent orchestration** | [I] YES — autonomous multi-step agent (claimed). Cannot verify depth behind login wall. | [N/A] Not an agent platform | [N/A] Not an agent platform | [N/A] Not an agent platform | [D] YES — 14-agent orchestration pipeline. [Source](BidDeed architecture) |
| **Cross-auction (FC+TD)** | [N/A] No auction data | [D] NO — CRE only. [Source](https://www.reonomy.com) | [D] NO — pre-foreclosure leads only. [Source](https://www.propstream.com) | [D] NO — parcel lookup only. [Source](https://landglide.com) | [D] YES — foreclosure + tax deed correlation across counties. [Source](BidDeed pipeline) |

---

## Summary Scorecard

| Tool | Capabilities (of 8) | Evidence Quality | Category |
|---|---|---|---|
| **Manus** | 1 (agent orchestration, [I]) | 1 [V] blocked, 1 [I], 6 [N/A] | Generalist AI agent |
| **Reonomy** | 0.5 (partial FL CRE parcels) | 7 [D], 1 [N/A] | CRE data platform |
| **PropStream** | 0.5 (partial FL property data) | 7 [D], 1 [N/A] | Lead gen / marketing |
| **LandGlide** | 0.5 (basic FL parcel boundaries) | 7 [D], 1 [N/A] | Consumer parcel lookup app |
| **ZoneWise + BidDeed** | 8/8 | 8 [D] | Foreclosure auction intelligence |

---

## [I] Cells Requiring Ariel Manual Verification

1. **Manus → Agent orchestration [I]**: Manus claims autonomous multi-step execution. Cannot verify complexity/depth without an account. Ariel could test with a free trial (if available) to see how Manus handles the foreclosure scoring prompt.

---

## Evidence Artifacts

| Tool | Artifact Location |
|---|---|
| Manus | `marketing/linkedin/receipts/manus/` — blocker.md, screenshot.png, session.html, timing.json |
| Reonomy | `marketing/linkedin/receipts/reonomy/evidence.md` — 7 source URLs |
| PropStream | `marketing/linkedin/receipts/propstream/evidence.md` — 9 source URLs |
| LandGlide | `marketing/linkedin/receipts/landglide/evidence.md` — 4 source URLs |
