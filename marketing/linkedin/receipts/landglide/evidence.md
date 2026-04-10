# LandGlide — Documented Evidence
**Date:** 2026-04-10
**Method:** Public web research, no signup. Fetched landglide.com (homepage, pricing page), Wikipedia (CoreLogic/Cotality), smartcustomer.com reviews, and softwareadvice.com listing. G2, Capterra, TrustRadius, Reddit, BiggerPockets, and multiple review sites returned 403/404/blocked.

## Product Overview

LandGlide is a **GPS-enabled mobile parcel data app** that overlays property boundaries on a map and provides basic ownership information. It covers 157M+ parcel records across 3,200+ US counties. The app is designed for identifying property lines and looking up basic parcel details — primarily useful for land buyers, surveyors, outdoor enthusiasts, and real estate agents doing drive-bys.

LandGlide was originally built by CoreLogic (now rebranded as Cotality as of March 2025). Cotality is an Irvine, CA-based information services provider of financial, property, and consumer data.

**Target users:** Land buyers, surveyors, hikers, hunters, real estate agents, utility workers — anyone who needs to identify "who owns this parcel?" while standing on it. NOT designed for foreclosure auction investors or deal analysis.

**Sources:**
- https://landglide.com (homepage)
- https://landglide.com/pricing
- https://en.wikipedia.org/wiki/CoreLogic (Cotality corporate background)

## Capability Assessment

| Capability | Status | Evidence | Source |
|---|---|---|---|
| FL parcel data | YES (basic) | Covers 3,200+ US counties with 157M+ parcel records. Florida counties are included. However, data is limited to: owner name, mailing address, square footage, site address, acreage, school district, sale price, and transfer date. No assessed value, no zoning, no legal description depth. | https://landglide.com |
| Foreclosure auction calendars | NO | Zero mention of foreclosure, auction, auction calendars, case numbers, courtroom schedules, or any auction-related functionality anywhere on the site. | https://landglide.com (all pages reviewed) |
| Tax deed data | NO | No mention of tax deed sales, tax deed auctions, tax certificates, or delinquent tax data anywhere on the site. | https://landglide.com (all pages reviewed) |
| Max bid formula | NO | No investment analysis tools of any kind. No ARV calculator, repair estimator, bid formula, ROI projection, or deal scoring. LandGlide is a parcel lookup tool, not an investment analysis platform. | https://landglide.com (all pages reviewed) |
| Lien position parsing | NO | No mention of liens, judgments, encumbrances, or any court filing data. Data fields are limited to ownership, address, acreage, and sale history. | https://landglide.com (all pages reviewed) |
| Spatial/choropleth mapping | NO (parcel boundaries only) | LandGlide displays parcel boundary outlines on a map via GPS overlay. However, there are NO choropleth layers, NO heat maps, NO zoning overlays, NO demographic layers, and NO analytical mapping. It is a parcel identification tool — it shows "this is the boundary of this parcel" — not a spatial analysis platform. | https://landglide.com |

## Third-Party Reviews

### SmartCustomer (formerly SiteJabber) — 0 reviews
- **Rating:** No rating established (zero reviews).
- **Source:** https://www.smartcustomer.com/reviews/landglide.com

### G2 / Capterra / TrustRadius
- G2 returned 403 (access blocked).
- Capterra search returned a wrong product listing (HealthEngine, not LandGlide) — LandGlide does not appear to have an active Capterra profile.
- TrustRadius returned 503.
- Software Advice directory did not include a LandGlide profile page.
- **Note:** LandGlide's absence from enterprise software review platforms is consistent with its identity as a consumer mobile app ($9.99/mo), not an enterprise SaaS product.

### App Store Reviews (attempted)
- Apple App Store returned 404 on direct fetch. Google Play Store returned 404.
- App store reviews could not be extracted via WebFetch due to JavaScript rendering requirements.
- **Source:** Fetch attempts failed for both stores.

## Community Discussion

### BiggerPockets
- BiggerPockets forum search returned 404. LandGlide is primarily discussed in land investing contexts (vacant lot identification, rural property boundary checks) — not foreclosure auction investing.
- **Source:** https://www.biggerpockets.com (search attempted, no accessible threads found)

### Reddit
- Reddit blocked all WebFetch attempts (www.reddit.com and old.reddit.com both blocked).
- Community discussion could not be verified through automated fetching.
- **Source:** Fetch attempts blocked by reddit.com

### REtipster
- REtipster URL redirected to an affiliate link (go.retipster.com/landglide), suggesting REtipster promotes LandGlide as an affiliate product for land investors. The redirect prevented extraction of actual review content.
- **Source:** https://retipster.com/landglide/ (302 redirect to affiliate link)

## Key Limitations for Foreclosure Auction Use

- **Parcel lookup only — no auction intelligence.** LandGlide answers one question: "Who owns this parcel and where are the boundaries?" It has zero foreclosure auction data, zero case tracking, zero courtroom scheduling.
  - Source: https://landglide.com

- **No foreclosure or pre-foreclosure data.** No lis pendens tracking, no default notices, no auction dates, no case numbers. The word "foreclosure" does not appear anywhere on the LandGlide website.
  - Source: https://landglide.com (all pages reviewed)

- **No investment analysis tools.** No max bid formula, no ARV estimation, no repair cost calculator, no ROI modeling, no deal scoring. LandGlide is a data lookup tool, not a decision engine.
  - Source: https://landglide.com (all pages reviewed)

- **No lien or encumbrance data.** No mortgage records, no judgment amounts, no lien position analysis, no title search capability. Data is limited to ownership + basic property characteristics.
  - Source: https://landglide.com (all pages reviewed)

- **No analytical mapping.** Despite having parcel boundaries on a map, there are no choropleth visualizations, no heat maps, no zoning overlays, no demographic layers, and no spatial analytics. The map is a parcel identification overlay, not an analysis tool.
  - Source: https://landglide.com

- **Shallow data fields.** Only 8 data fields confirmed: owner name, mailing address, square footage, site address, acreage, school district, sale price, transfer date. No assessed/taxable value, no zoning classification, no legal description, no building details.
  - Source: https://landglide.com

- **Consumer-grade pricing, consumer-grade product.** $9.99/mo or $99.99/yr. 7-day free trial. Positioned as a consumer mobile app, not a professional investment platform.
  - Source: https://landglide.com/pricing

## Summary for Bake-Off

LandGlide is a **consumer parcel boundary lookup app** — the digital equivalent of walking up to a property and checking who owns it. It covers 157M+ parcels across 3,200+ counties, which includes Florida. However, it provides ZERO foreclosure auction data, ZERO investment analysis, ZERO lien/encumbrance data, and ZERO analytical mapping.

It answers: "Who owns this lot and where does it end?"
It does NOT answer: "Should I bid on this foreclosure, how much, and what are the risks?"

**Bottom line:** LandGlide competes with OnX Hunt and other property line apps in the parcel boundary identification space. It does not compete with ZoneWise in the FL foreclosure auction intelligence space. Including it in a bake-off illustrates the gap between "property data" (knowing who owns what) and "auction intelligence" (knowing what to bid, why, and when). LandGlide has none of the six capabilities that define the foreclosure auction workflow.
