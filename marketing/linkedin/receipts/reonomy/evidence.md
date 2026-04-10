# Reonomy — Documented Evidence
**Date:** 2026-04-10
**Method:** Public web research, no signup. Fetched reonomy.com (homepage, platform, solutions, pricing, blog/data pages), altusgroup.com/reonomy, getapp.com reviews, and slashdot.org listing.

## Product Overview

Reonomy is a **commercial real estate (CRE) data platform** owned by Altus Group (acquired November 2021). It provides property intelligence across 54M+ commercial properties in the US, with 68M+ transactions, 42M+ mortgage records, 5.2M+ companies, and 30M+ owner/contact records. The platform uses AI/ML to standardize fragmented property data via a universal identifier ("Reonomy ID"). It integrates with 3,100+ county assessors and has exclusive partnerships with CoreLogic and BlackKnight.

**Target users:** Appraisers, brokers, developers, investors, lenders, service providers, tax professionals, and facility managers. Focused on **commercial** real estate — not residential foreclosure auction investors.

**Sources:**
- https://www.reonomy.com
- https://www.altusgroup.com/reonomy
- https://www.reonomy.com/platform/features

## Capability Assessment

| Capability | Status | Evidence | Source |
|---|---|---|---|
| FL parcel data | PARTIAL | Covers 3,100+ counties nationwide (all FL counties included by implication) but focused on **commercial** properties only (54M commercial, not residential). No FL-specific tooling. | https://www.reonomy.com/platform/features |
| Foreclosure auction calendars | NO | Tracks "pre-foreclosure stage" and "auction dates" as **data fields** on commercial properties, but does NOT provide a live auction calendar, bid-ready auction feed, or courtroom-level scheduling. This is metadata on property records, not an auction tool. | https://www.reonomy.com/blog/post/commercial-real-estate-data |
| Tax deed data | NO | No mention of tax deed sales, tax deed auctions, or tax certificate data anywhere on the site, platform pages, solutions, or blog. | All pages fetched — no results |
| Max bid formula | NO | No bid calculator, ARV analysis, repair estimation, or investment formula of any kind. Platform is a data/search tool, not an investment analysis tool. | All pages fetched — no results |
| Lien position parsing | NO | Tracks mortgage/loan data (42M+ mortgage records, lender info, loan maturity dates) but no lien position parsing, lien priority analysis, or judgment amount extraction. | https://www.reonomy.com/platform/features |
| Spatial/choropleth mapping | NOT CONFIRMED | No mapping, choropleth, heat map, or spatial analysis features documented on any public page. Platform offers 200+ search filters and list-based results. No map-based interface confirmed from public materials. | https://www.reonomy.com/platform/features, /platform/map-search (no content) |

## Third-Party Reviews

### GetApp — 4.2/5 (32 reviews)
- **Ease of Use:** 4.3/5 | **Features:** 4.2/5 | **Value for Money:** 4.0/5
- **Praise:** "Superior" ownership data compared to competitors. Loan maturity date tracking valued. Portfolio cross-referencing useful.
- **Complaints:** Predatory billing practices (charged $1,000+ after cancellation). Missing sales data in some regions. Some properties absent from database despite local knowledge. No CRM integration. Lacks team collaboration features.
- **Foreclosure/auction mentions:** None in any review.
- **Source:** https://www.getapp.com/real-estate-software/a/reonomy/reviews/

### Slashdot Software Directory
- **Reviews:** Zero user reviews ("Be the first to provide a review").
- **Description:** "Machine learning to consolidate fragmented property information." Founded 2013. Free trial available. Base package with volume-based discounts.
- **Source:** https://slashdot.org/software/p/Reonomy/

### G2 / Capterra / TrustRadius
- G2 returned 403 (access blocked).
- Capterra returned 404 (page not found — listing may have been removed or restructured).
- TrustRadius returned 503 (service unavailable).
- **Note:** Inability to access these review platforms is itself notable — Reonomy's third-party review footprint appears thin for a platform of its claimed scale.

## Community Discussion

### BiggerPockets
- Search for "reonomy" on BiggerPockets forums returned 404 on attempted threads. Reonomy is not a commonly discussed tool in the residential foreclosure investing community — its CRE focus puts it outside the typical BiggerPockets audience.
- **Source:** https://www.biggerpockets.com (search attempted, no accessible threads found)

### Reddit
- Reddit (r/CommercialRealEstate, r/realestateinvesting) blocked by WebFetch. Community discussion could not be verified.
- **Source:** Fetch attempts blocked by reddit.com

## Key Limitations for Foreclosure Auction Use

- **Commercial-only focus.** 54M commercial properties. Residential foreclosure auctions (the ZoneWise target market) are outside Reonomy's core dataset. No residential parcel-level data confirmed.
  - Source: https://www.reonomy.com, https://www.altusgroup.com/reonomy

- **No live auction calendar.** Pre-foreclosure "stage" and "auction dates" are metadata fields on property records — not a real-time auction calendar with case numbers, courtroom assignments, or bid deadlines.
  - Source: https://www.reonomy.com/blog/post/commercial-real-estate-data

- **No investment analysis tools.** No max bid formula, ARV calculator, repair estimator, or ROI projections. Reonomy is a data lookup platform, not an investment decision engine.
  - Source: All product pages reviewed

- **No tax deed or lien position data.** Tax deed auctions and lien priority parsing are absent. Mortgage data exists but is not parsed into lien positions.
  - Source: All product pages reviewed

- **No confirmed mapping/spatial tools.** Despite covering 3,100+ counties, no public evidence of map-based search, choropleth visualization, or parcel boundary rendering.
  - Source: https://www.reonomy.com/platform/features, /platform/map-search

- **Opaque pricing.** No public pricing. "Contact sales" only. GetApp reviewers cite high annual commitments.
  - Source: https://www.reonomy.com/pricing

- **Data accuracy concerns.** GetApp reviewers report missing properties and missing sales data in certain regions.
  - Source: https://www.getapp.com/real-estate-software/a/reonomy/reviews/

## Summary for Bake-Off

Reonomy is a **strong CRE data platform** for commercial property ownership lookup, loan tracking, and deal sourcing. It is **not a foreclosure auction tool**. It has no bid scoring, no live auction feeds, no tax deed data, no lien parsing, and no spatial/choropleth mapping confirmed from public sources. Its pre-foreclosure data is limited to metadata fields (stage + auction date) on commercial properties — not the real-time, residential, courtroom-level auction intelligence that ZoneWise provides.

**Bottom line:** Reonomy competes with CoStar and REIS in the CRE data space. It does not compete with ZoneWise in the FL foreclosure auction intelligence space. Including it in a bake-off highlights that general CRE platforms lack the specialized tooling foreclosure investors need.
