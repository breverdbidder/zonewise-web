# PropStream -- Documented Evidence
**Date:** 2026-04-10
**Method:** Public web research (propstream.com, Trustpilot, sitemap analysis), no signup

## Product Overview

PropStream is a real estate investment software platform focused on lead generation, property data aggregation, and marketing tools for investors and agents. It provides nationwide property data with 165+ search filters and 20 pre-built lead lists. The platform emphasizes finding motivated sellers (pre-foreclosures, absentee owners, vacant properties) rather than auction-specific intelligence.

**Sources:**
- https://www.propstream.com (homepage)
- https://www.propstream.com/generating-new-listings-as-an-agent (feature page for agents)
- https://www.propstream.com/help (help center)

## Capability Assessment

| Capability | Status | Evidence | Source |
|---|---|---|---|
| FL parcel data | Y (partial) | Nationwide property data; Tampa FL market analysis published; search by county/city/zip supported. No FL-specific parcel count disclosed. | https://www.propstream.com/news/why-is-tampa-fl-a-top-housing-market-for-2023 |
| Foreclosure auction calendars | N | Pre-foreclosure lead list exists as a filter. Blog article on auction buying explicitly does NOT mention auction calendars, sale dates, or real-time auction data. Platform positions itself for pre-auction due diligence, not auction-day intelligence. | https://www.propstream.com/news/5-things-you-need-to-know-before-buying-a-property-at-auction |
| Tax deed data | N (not documented) | No mention of tax deed lists, tax deed sale dates, or tax deed-specific filters found across sitemap, blog, help center, or feature pages. Pre-foreclosure and tax lien filters exist but tax deed as a distinct category is absent from public documentation. | https://www.propstream.com/sitemap.xml (full crawl, no tax-deed URL found) |
| Max bid formula | N | Analysis Tool requires users to manually input all figures. Blog explicitly states: "Users must obtain this information independently to plug into the Analysis Tool." No automated bid scoring or max bid calculation. | https://www.propstream.com/news/a-step-by-step-guide-to-using-propstreams-analysis-tool |
| Lien position parsing | N | Mortgage data includes loan type, estimated interest rates, and rate type (193M+ data points). Does NOT include lien position hierarchy, lien priority analysis, or judgment amount parsing. | https://www.propstream.com/news/propstreams-new-mortgage-and-interest-rate-data |
| Spatial/choropleth mapping | N (limited) | Has a "Draw Tool" for geographic targeting on a map. No heat maps, choropleth visualization, or spatial analysis documented. Help center and feature pages make no mention of GIS, heat maps, or spatial analytics. | https://www.propstream.com/generating-new-listings-as-an-agent |

## Pricing

| Plan | Monthly | Annual (per month) | Saves/Exports |
|---|---|---|---|
| Essentials | $99 | $81 | 25,000 |
| Pro | $199 | $165 | 50,000 |
| Elite | $699 | $583 | 100,000 |

All plans include 7-day free trial with 50 leads. Pro/Elite include skip tracing and click-to-dial.

**Source:** https://www.propstream.com/pricing

## Third-Party Reviews

### Trustpilot
- **Rating:** 4.1 / 5.0 (229 reviews)
- **Positive:** "Everything is at my fingertips. I do not have to go to all the other websites to research."
- **Negative:** "Marginal improvements to search functions over the years. Filter metrics are still not easily customizable."
- **Notable:** Zero reviews in the sampled set mention foreclosure auction data, auction calendars, or bid scoring as a feature. Reviews focus on lead generation, skip tracing, and customer service.
- **Source:** https://www.trustpilot.com/review/propstream.com

### PropStream Help Center (self-reported features)
- Documented features: PropStream Intelligence (AI research), Lead Automator, BatchDialer, Campaigns, Comps, Skip Tracing, ADU Calculator, Rehab Calculator, Demographics, Mobile App, Postcard Marketing.
- Absent from help center: auction calendars, bid scoring, lien position parsing, heat maps, choropleth mapping, tax deed lists.
- **Source:** https://www.propstream.com/help

## Community Discussion

### PropStream Blog (official)
- Blog post "Quick List Spotlight: Pre-Foreclosures" describes the pre-foreclosure lead list filter but provides no detail on data fields, auction dates, or judgment amounts.
  - **Source:** https://www.propstream.com/news/quick-list-spotlight-pre-foreclosures
- Blog post "5 Things You Need to Know Before Buying a Property at Auction" is educational content, NOT a feature announcement. Mentions Rehab Estimator and Property Tax Tool but no auction calendar or bid scoring.
  - **Source:** https://www.propstream.com/news/5-things-you-need-to-know-before-buying-a-property-at-auction

### Sitemap Analysis
- Full sitemap crawl (https://www.propstream.com/sitemap.xml) reveals zero URLs containing "auction-calendar", "bid-score", "tax-deed", "heat-map", "choropleth", or "lien-position". The platform's public-facing content is centered on lead generation, marketing campaigns, and CRM-style workflows.

## Key Limitations for Foreclosure Auction Use

- **No auction calendars:** PropStream identifies pre-foreclosure leads but does not track or display scheduled foreclosure auction dates, courthouse sale calendars, or auction results. (Source: https://www.propstream.com/news/5-things-you-need-to-know-before-buying-a-property-at-auction)
- **No bid scoring or max bid formula:** The Analysis Tool is a manual-input calculator. Users must independently research ARV, repair costs, and all deal inputs. No automated bid recommendation. (Source: https://www.propstream.com/news/a-step-by-step-guide-to-using-propstreams-analysis-tool -- direct quote: "Users must obtain this information independently")
- **No lien position parsing:** Mortgage data covers loan type and estimated rates but does not parse lien priority, subordinate liens, or judgment amounts from court records. (Source: https://www.propstream.com/news/propstreams-new-mortgage-and-interest-rate-data)
- **No spatial analytics:** The Draw Tool provides geographic search boundaries but no choropleth mapping, heat maps, or zone-based spatial analysis. (Source: https://www.propstream.com/generating-new-listings-as-an-agent)
- **Lead generation focus, not auction intelligence:** The platform's core value proposition is finding and contacting motivated sellers (pre-foreclosure, absentee, vacant). It is designed for the marketing/outreach phase of investing, not the auction-day bid decision. (Source: https://www.propstream.com/help -- feature categories are Intelligence, Lead Automator, BatchDialer, Campaigns, Comps, Skip Tracing)
- **Manual data gap:** Even PropStream's own blog advises auction buyers to research properties independently before bidding, implying the platform does not automate this workflow. (Source: https://www.propstream.com/news/5-things-you-need-to-know-before-buying-a-property-at-auction)
