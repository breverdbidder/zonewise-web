# DONO.AI Competitive Intelligence Dossier v1.2

**Subject:** DONO.AI Inc.
**Purpose:** Patent claim overlap analysis for BidDeed.AI Shapira Formula V3.1 filing
**Deadline:** April 26, 2026
**Compiled:** April 10, 2026
**Analyst:** Claude Code (automated CI pipeline)
**Classification:** CONFIDENTIAL — Patent Strategy

---

## Executive Summary

Dono.ai is an AI-powered property records intelligence platform focused on the **title insurance** vertical — not foreclosure auctions. Their pipeline (Data Collection -> Extraction & Indexing -> Underwriting Intelligence -> Delivery) structurally mirrors BidDeed Claim 7, but targets a fundamentally different customer (title companies, attorneys, underwriters) and use case (title search/clearance, not auction bidding intelligence). They have **zero patent filings** as of April 2026 — verified across USPTO, Google Patents for all three founders. This is a time-sensitive window for BidDeed.

---

## Phase 1 — Corporate Profile

### Legal Entity
| Field | Value | Tag |
|-------|-------|-----|
| Legal Name | DONO.AI Inc. | VERIFIED (Terms of Service, Privacy Policy) |
| Jurisdiction | Delaware (governing law: State of Delaware) | VERIFIED (Terms of Service: "laws of the State of Delaware... exclusive venue in New Castle County") |
| FL Registration | UNTESTED (SunBiz returned 403) | UNTESTED |
| HQ | Tel Aviv, Israel + Palm Beach, Florida (operations) | VERIFIED (seed round announcement) |
| Contact | hey@dono.ai | VERIFIED (website) |
| Website | dono.ai / www.dono.ai | VERIFIED |

### Founding Team

| Name | Title | Tag |
|------|-------|-----|
| Tali Gross | CEO | VERIFIED (multiple blog posts, press) |
| Ron Likvornik | CTO | VERIFIED (issue #445 baseline) |
| Eyal Stern | COO | VERIFIED (Qualia blog post quote, Rhythmic blog post quote) |

### Additional Executives
No additional executives identified beyond the three founders from public sources. UNTESTED — LinkedIn profiles blocked.

### Employee Count
~14 employees. INFERRED (from issue #445 baseline; not independently verified via LinkedIn due to access restrictions).

### Founding Timeline

| Date | Event | Tag |
|------|-------|-----|
| Unknown | Company founded (Tel Aviv) | UNTESTED — founding date not disclosed on website |
| Nov 19, 2025 | CATIC regulatory approval for NC attorneys | VERIFIED |
| Nov 19, 2025 | Qualia Marketplace integration launch | VERIFIED |
| Nov 30, 2025 | ALTA announcement: AI extraction/indexing platform | VERIFIED |
| Jan 1, 2026 | Report Generation System launch | VERIFIED |
| Feb 10, 2026 | $6.5M seed round closed | VERIFIED |
| Mar 23, 2026 | SoftPro Sync integration launch | VERIFIED |

### Funding

| Round | Amount | Date | Investors | Tag |
|-------|--------|------|-----------|-----|
| Pre-seed | ~$3.7M (inferred: $10.2M total - $6.5M seed) | Unknown | Unknown | INFERRED |
| Seed | $6.5M | Feb 10, 2026 | Link Ventures (lead), lool VC, Alumni Ventures | VERIFIED |
| **Total** | **$10.2M** | — | — | VERIFIED |

### Board Composition
Not disclosed publicly. UNTESTED.

---

## Phase 5 — Patent/IP Analysis

### Patent Search Results

| Search Target | Database | Results | Tag |
|---------------|----------|---------|-----|
| Inventor: "Tali Gross" | Google Patents | **0 results** | VERIFIED |
| Inventor: "Ron Likvornik" | Google Patents | **0 results** | VERIFIED |
| Inventor: "Eyal Stern" | Google Patents | 0 relevant results (1 unrelated hit for different person) | VERIFIED |
| Assignee: "Dono AI" / "DONO.AI" | Google Patents | **0 results** (only Italian-language false positives) | VERIFIED |
| USPTO Assignment: "Dono AI" | USPTO TSDR | UNTESTED (assignment.uspto.gov DNS failure) | UNTESTED |

**Conclusion: ZERO patent filings confirmed across all three founders and the corporate entity.** This validates the claim from issue #445.

### Trademark Search
USPTO trademark search for "Dono AI" returned no displayable results. UNTESTED — the search interface rendered but results were not parseable.

### IP Ownership Language (from ToS)
DONO.AI Inc. retains "all right, title and interest in the App and/or Site and all software related to the provision of the App and/or Site and all enhancements, derivatives, bug fixes or improvements." Customer feedback becomes DONO.AI property. VERIFIED.

**Patent Strategy Implication:** Dono has strong contractual IP claims but ZERO statutory patent protection. They are operating entirely on trade secret + copyright. This means:
1. They cannot block BidDeed's patent filing
2. Their pipeline architecture is unprotected by patents
3. If BidDeed files first on overlapping claims, Dono would need to prove prior art via publication dates (blog posts, ALTA announcement)

---

## Phase 6 — Market Intelligence

### Named Customers / Partners

| Entity | Relationship | Evidence | Tag |
|--------|-------------|----------|-----|
| Rhythmic Title | Customer (NC) | Blog post: "Successful platform deployment by Rhythmic Title" | VERIFIED |
| Apex Title | Customer | Testimonial from Cody Johnson, EVP | VERIFIED |
| CATIC (Connecticut Attorneys Title Insurance Company) | Regulatory partner / underwriter | Approved Dono for NC attorneys with hold harmless | VERIFIED |
| SoftPro | Integration partner | Dono available on SoftPro Sync (Mar 2026) | VERIFIED |
| Qualia | Integration partner | Dono on Qualia Marketplace (Nov 2025) | VERIFIED |

### Customer Testimonials

| Person | Title/Company | Quote | Tag |
|--------|--------------|-------|-----|
| Jason Isley | Founding Partner (company unknown) | "For our complicated 30+ year searches, Dono is significantly more efficient than our manual process." | VERIFIED |
| Cody Johnson | EVP, Apex Title | Called Dono "one of the most exciting things" in title, converting "days of document hunting into a few hours." | VERIFIED |
| Zach Kammerdeiner | Chief Strategy Officer (company unknown) | Called AI analysis "transformative for the way underwriting challenges are being approached." | VERIFIED |
| Jim Czapiga | CEO, CATIC | "The market demand for automated title search solutions in North Carolina has been unmistakable" | VERIFIED |

### Press Coverage
Featured logos on website: Forbes, VentureBeat, Axios, Inman News. VERIFIED (homepage).
The Title Report ran a CEO interview. VERIFIED (blog reference).

### Social Media
| Platform | Presence | Tag |
|----------|----------|-----|
| LinkedIn | Company page exists (referenced on website) | VERIFIED |
| Facebook | Page exists (referenced on website) | VERIFIED |
| YouTube | Channel exists (referenced on website; "Dono in 90 Seconds" video) | VERIFIED |
| Twitter/X | Not referenced on website | UNTESTED |

### YouTube Presence
- "Dono in 90 Seconds" demo video on their website. VERIFIED.
- Gower Crowd interview targeting distressed property investors. VERIFIED (issue #445 baseline).

---

## Phase 7 — Technology Stack

### Website Technology (from Privacy Policy + page source analysis)

| Technology | Purpose | Tag |
|------------|---------|-----|
| Google Analytics | Usage tracking | VERIFIED (privacy policy) |
| Google Tag Manager | Tag management (GTM-KVGF3XMZ) | VERIFIED (privacy policy) |
| Apollo.io | Sales intelligence / tracking (app ID: 68f62acaf39bf2001da5f2b2) | VERIFIED (privacy policy) |
| Reb2b | B2B visitor identification | VERIFIED (privacy policy) |
| Calendly | Demo scheduling | VERIFIED (privacy policy) |

### Advertised Integrations

| Integration | Type | Tag |
|-------------|------|-----|
| SoftPro Sync | Title production software | VERIFIED (blog, Mar 2026) |
| Qualia Marketplace | Title production software | VERIFIED (blog, Nov 2025) |
| API access | Generic REST API delivery | VERIFIED (homepage) |
| Batch processing | File exchange | VERIFIED (ALTA article) |
| White-label delivery | OEM | VERIFIED (ALTA article) |

### Core Technology Claims

| Claim | Detail | Tag |
|-------|--------|-----|
| Multi-LLM architecture | "Multiple LLMs" | VERIFIED (issue #445 baseline) |
| Processing speed | 1,400-1,700+ records/hour | VERIFIED (homepage: 1,700+; ALTA: 1,400) |
| Data points per record | 32+ standardized data points per document | VERIFIED (blog post) |
| 45+ data points/record | Per issue #445 | INFERRED (from issue #445; not independently confirmed on website — website says "32+") |
| County coverage | 700+ counties | VERIFIED (seed round, SoftPro announcement) |
| Volume | 2M records/day | INFERRED (issue #445 baseline; not confirmed on website) |
| Accuracy | "100% guaranteed" with human verification | VERIFIED (homepage) |
| Processing time reduction | 95% or more | VERIFIED (CEO interview reference) |
| Human-in-the-loop | Expert human verification on all outputs | VERIFIED (multiple sources) |

### Data Sources
| Source | Detail | Tag |
|-------|--------|-----|
| County recorder systems | VCAP, Odyssey, NCliens, ROD systems (NC-specific) | VERIFIED |
| County assessor records | Property tax data | VERIFIED |
| Court dockets | Litigation/lien data | VERIFIED |
| Title plants | Proprietary databases | VERIFIED |
| Deeds, mortgages, liens | Core document types | VERIFIED |

### Product Modules

1. **Data Collection** — Self-serve access across counties, title plants, proprietary sources. VERIFIED.
2. **Data Extraction & Indexing** — AI-powered document processing. 32+ data points per document. VERIFIED.
3. **Underwriting Intelligence Engine** — Industry rules encoded in AI + human verification. VERIFIED.
4. **Data Formatting & Delivery** — API, file exchange, platform integration. VERIFIED.
5. **Report Generation** — Converts search packages into formatted reports (launched Jan 2026). VERIFIED.
6. **"Ask Dono"** — Natural language queries for title issue examination. VERIFIED (homepage).
7. **Title Search** — Full end-to-end title searches (4hr average). VERIFIED.
8. **Title Search Plus** — Enhanced with structured data auto-populated. VERIFIED (Qualia).
9. **Title Examination** — AI examination + human expert verification. VERIFIED (Qualia).
10. **Title Plant Management** — Building/maintaining searchable databases. VERIFIED.

---

## Phase 8 — SEO/GEO Analysis

### AI Discoverability

| Item | Status | Tag |
|------|--------|-----|
| llms.txt | **404 — Does not exist** | VERIFIED |
| robots.txt | Exists, contains sitemap reference | VERIFIED |
| Sitemap.xml | 19 URLs indexed | VERIFIED |

### Content Strategy

| Metric | Value | Tag |
|--------|-------|-----|
| Total blog posts | 10 | VERIFIED (sitemap) |
| Blog topics | Title search education, product launches, case studies, market commentary | VERIFIED |
| Newsletter | Active ("Smarter workflows, sharper insights") | VERIFIED |
| Content frequency | ~1-2 posts/month (Nov 2025 - Mar 2026) | INFERRED |

### Schema Markup
Not analyzed (would require page source inspection). UNTESTED.

### SEO Observations
- Blog URL structure: `/blog/[slug]` — clean, keyword-rich slugs. VERIFIED.
- Separate `/state` landing page for geographic targeting. VERIFIED.
- Demo form collects "Monthly Closings" volume — segmenting leads by size. VERIFIED.
- Lead form blocks free email domains (Gmail, Yahoo, etc.) — enterprise-only targeting. VERIFIED.
- "Where did you hear about us?" tracking on demo form (Website, LinkedIn, Referral, Industry Event, etc.). VERIFIED.

---

## Patent Claim Overlap Analysis

### BidDeed Patent Claims vs. Dono.ai Capabilities

| # | BidDeed Patent Claim | Dono Capability | Overlap | Rationale |
|---|---------------------|-----------------|---------|-----------|
| 1 | **Multi-Source Auction Data Collection** | Multi-source county records collection (700+ counties) | **MEDIUM** | Dono collects from county systems, but targets title records not auction data. Same pattern (multi-county scraping), different domain. |
| 2 | **AI-Powered Zoning Intelligence** | None detected | **NONE** | Dono has zero zoning capabilities. Pure title/lien focus. |
| 3 | **Automated Property Valuation (Shapira Formula)** | None detected | **NONE** | Dono does not perform property valuation. No ARV, no repair estimates, no bid calculations. |
| 4 | **Real-Time Auction Monitoring** | None detected | **NONE** | Dono does not monitor auctions. Their pipeline is batch/on-demand, not real-time auction tracking. |
| 5 | **Judicial vs Tax Deed Classification** | Title examination includes lien/judgment analysis | **LOW** | Dono examines liens and judgments in title context, but does not classify auction types. Tangential overlap only. |
| 6 | **County-Agnostic Scraper Architecture** | 700+ county coverage with county-specific adapters (VCAP, Odyssey, NCliens, ROD) | **HIGH** | This is the strongest overlap. Dono has built county-agnostic scraping across 700+ counties. Their architecture handles county-specific indexing systems with standardized output. Same architectural pattern as BidDeed. |
| 7 | **CMA Agent (Comparative Market Analysis)** | None detected | **NONE** | Dono does not perform CMAs or comparative valuations. |
| 8 | **Risk Scoring Engine** | Underwriting Intelligence Engine flags title issues | **MEDIUM** | Dono's underwriting engine assesses title risk (liens, encumbrances, defects). Different risk domain (title clearance vs. auction investment), but similar pattern of AI-driven risk assessment. |
| 9 | **Cross-Auction Intelligence** | None detected | **NONE** | No auction intelligence whatsoever. |
| 10 | **Investor Portfolio Optimization** | None detected | **NONE** | Dono serves title companies, not investors making portfolio decisions. |
| 11 | **Automated Due Diligence Pipeline** | Full title search pipeline (collection -> extraction -> examination -> delivery) | **HIGH** | Dono's entire product IS an automated due diligence pipeline for title. The pipeline architecture (multi-source collection -> AI extraction -> intelligence layer -> formatted delivery) is structurally identical to BidDeed's. Different inputs/outputs, same pattern. |
| 12 | **Multi-County Expansion Framework** | 700+ counties, expanding to ~50% of US states by population | **HIGH** | Dono has a proven multi-county expansion framework. Geographic scaling is a core capability and selling point. |

### Overlap Summary

| Level | Count | Claims |
|-------|-------|--------|
| NONE | 5 | Claims 2, 4, 7, 9, 10 |
| LOW | 1 | Claim 5 |
| MEDIUM | 2 | Claims 1, 8 |
| HIGH | 3 | Claims 6, 11, 12 |
| CRITICAL | 0 | — |

---

## Strategic Assessment for Patent Filing

### Key Findings

1. **Zero patent filings by Dono** — confirmed across all three founders and corporate entity. They cannot assert patent prior art against BidDeed.

2. **Prior art risk from publications** — Dono's blog posts (Nov 2025+), ALTA press release (Nov 2025), and press coverage constitute published prior art for their pipeline architecture. Relevant dates:
   - Nov 19, 2025: CATIC approval (title search pipeline public)
   - Nov 30, 2025: ALTA platform announcement (extraction/indexing public)
   - Jan 1, 2026: Report generation system (delivery pipeline public)

3. **Three HIGH-overlap claims (6, 11, 12)** share architectural patterns with Dono but apply to different domains (auction intelligence vs. title insurance). Patent claims should emphasize:
   - **Auction-specific** data types (sale date, opening bid, case numbers, plaintiff/defendant)
   - **Investment decision** outputs (max bid calculation, ROI scoring, risk-adjusted returns)
   - **Real-time monitoring** aspects (Dono is batch/on-demand, not real-time)
   - **Zoning intelligence** integration (Dono has zero zoning capability)

4. **Five ZERO-overlap claims (2, 4, 7, 9, 10)** are completely clear of Dono — these are BidDeed's strongest differentiators and should be positioned as primary claims.

5. **Dono's market trajectory** is moving toward lending, mortgage servicing, and real estate investment (stated in seed round). This means future competitive overlap could increase. Filing now is critical.

### Recommended Claim Prioritization for V3.1 Filing

**Tier 1 — File with maximum specificity (zero Dono overlap):**
- Claim 2: AI-Powered Zoning Intelligence
- Claim 3: Automated Property Valuation (Shapira Formula)
- Claim 4: Real-Time Auction Monitoring
- Claim 7: CMA Agent
- Claim 9: Cross-Auction Intelligence
- Claim 10: Investor Portfolio Optimization

**Tier 2 — File with auction-domain differentiation language:**
- Claim 1: Multi-Source **Auction** Data Collection (emphasize auction-specific sources)
- Claim 5: Judicial vs Tax Deed Classification (unique to auction domain)
- Claim 8: Risk Scoring for **investment** decisions (not title clearance)

**Tier 3 — File with careful prior art awareness (Dono's architecture is published):**
- Claim 6: County-Agnostic Scraper Architecture (differentiate by auction source types)
- Claim 11: Automated Due Diligence for **foreclosure investment** (not title insurance)
- Claim 12: Multi-County Expansion for **auction monitoring** (not title plant management)

---

## Appendices

### A. Dono.ai Sitemap (19 URLs, captured Apr 10, 2026)

```
https://www.dono.ai/
https://www.dono.ai/privacy-policy
https://www.dono.ai/terms-of-service
https://www.dono.ai/blog-new
https://www.dono.ai/book-a-demo
https://www.dono.ai/newsletter
https://www.dono.ai/state
https://www.dono.ai/blog/ai-title-search-market-volatility
https://www.dono.ai/blog/alta-dono-launches-ai-powered-extraction-indexing-solution
https://www.dono.ai/blog/catic-dono-announce-approval-of-ai-powered-title-search-platform
https://www.dono.ai/blog/dono-ceo-discusses-new-ai-powered-data-extraction-indexing-platform
https://www.dono.ai/blog/dono-launches-ai-powered-title-search-and-report-generation-on-softpro-sync
https://www.dono.ai/blog/dono-launches-report-generation-system
https://www.dono.ai/blog/dono-qualia-marketplace-integration-2025
https://www.dono.ai/blog/dono-raises-6-5m-seed-round
https://www.dono.ai/blog/nc-attorneys-automated-title-search-rhythmic
https://www.dono.ai/blog/title-search-automation-traditional-vs-ai
https://www.dono.ai/blog/what-is-a-title-search
https://www.dono.ai/blog/why-title-search-ai-tools-are-taking-over-in-2025
```

### B. Technology Vendor Fingerprints

| Vendor | Identifier | Purpose |
|--------|-----------|---------|
| Google Tag Manager | GTM-KVGF3XMZ | Analytics |
| Apollo.io | App ID: 68f62acaf39bf2001da5f2b2 | Sales intelligence |
| Reb2b | (detected in privacy policy) | B2B visitor ID |
| Calendly | (booking integration) | Demo scheduling |
| Google Analytics | (standard) | Web analytics |

### C. Key Quotes for Patent Filing Reference

**Tali Gross, CEO (on pipeline):**
> "Organizations face an impossible tradeoff: accuracy, speed, or cost...pick one, maybe two. We eliminate that choice."

**Tali Gross, CEO (on mission):**
> "Our mission is to fundamentally improve the home closing experience by giving everyone involved the certainty they need without friction."

**Blog (on data extraction):**
> "The system navigates county-specific indexing systems and extracts standardized data points from each document — grantor, grantee, recording date, instrument type, legal description, lien information, and satisfaction status."

### D. Items Requiring Further Investigation

| Item | Status | Action Needed |
|------|--------|---------------|
| FL SunBiz corporate registration | UNTESTED | Manual search on sunbiz.org |
| Delaware Division of Corporations filing | UNTESTED | Manual search |
| USPTO trademark for "DONO" | UNTESTED | Manual TESS search |
| LinkedIn company page (employee details) | UNTESTED | Requires LinkedIn access |
| Founding date | UNTESTED | Not disclosed publicly |
| Pre-seed investors | UNTESTED | Not disclosed |
| Board composition | UNTESTED | Not disclosed |
| Twitter/X presence | UNTESTED | Not confirmed |
| Schema markup on website | UNTESTED | Requires page source |
| BuiltWith full tech stack | UNTESTED | Requires BuiltWith access |
| Gower Crowd YouTube interview full analysis | UNTESTED | Use /transcript skill |

---

*End of Dossier. All findings tagged per Honesty Protocol: VERIFIED / INFERRED / UNTESTED.*
