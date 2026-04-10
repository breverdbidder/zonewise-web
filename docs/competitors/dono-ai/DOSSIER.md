# Dono.ai Competitive Intelligence Dossier
## CI Protocol v1.2 | SUMMIT #444 | 2026-04-10

---

## Company Overview

| Field | Value | Confidence |
|-------|-------|------------|
| Legal Name | DONO.AI Inc. | VERIFIED |
| Domain | dono.ai | VERIFIED |
| Founded | 2023 | VERIFIED (LinkedIn) |
| HQ | West Palm Beach, FL 33411 (7750 Okeechobee Blvd) | VERIFIED (LinkedIn) |
| R&D Center | Tel Aviv-Yafo, Israel | VERIFIED (LinkedIn) |
| Category | AI Property Records Intelligence | VERIFIED |
| Target Market | Title companies, underwriters, real estate professionals | VERIFIED |
| Employees | 11-50 (LinkedIn classification), 186 connections | VERIFIED |
| Contact | hey@dono.ai | VERIFIED |

## Funding

| Round | Amount | Date | Source | Confidence |
|-------|--------|------|--------|------------|
| Pre-seed | ~$3.7M | ~2024 | Inferred from $10.2M total | INFERRED |
| Seed | $6.5M | Feb 2026 | dono.ai blog | VERIFIED |
| **Total** | **$10.2M** | - | Lead: Link Ventures; lool VC, Alumni Ventures | VERIFIED |

## Leadership Team

| Name | Role | Patent Search | Patents Found | Confidence |
|------|------|--------------|---------------|------------|
| Tali Gross | CEO & Co-Founder | DONE | 0 | VERIFIED |
| Ron Likvornik | CTO | NOT DONE | Unknown | UNTESTED |
| Eyal Stern | COO | NOT DONE | Unknown | UNTESTED |
| David Bokor | Title Ops Manager | NOT DONE | N/A | VERIFIED |
| Avichay Nissenbaum | Team Member | NOT DONE | N/A | INFERRED |
| Tony Saigh | Team Member | NOT DONE | N/A | INFERRED |
| Anthony Nalbone | Team Member | NOT DONE | N/A | INFERRED |
| Paul Carroll | Team Member | NOT DONE | N/A | INFERRED |

## Architecture: 4-Stage Pipeline (Prior Art Critical)

```
Data Collection → Extraction & Indexing → Underwriting Intelligence → Delivery
     ↓                    ↓                        ↓                     ↓
 Counties,           AI-powered              Title expertise        API, file
 title plants,       document parsing,       encoded in AI,         exchange, or
 proprietary         indexing                adapts to standards    direct access
 sources
```

**Maps to BidDeed Claims:**
- Claim 7 (Data Pipeline): Stages 1, 2, 4 overlap with our 12-stage Everest pipeline
- Claim 9 (AI Intelligence): Stage 3 (Underwriting Engine) overlaps with our deal scoring

## Product Features (35 mapped)

### Data Collection
- Multi-county data access (self-serve)
- Title plant integration
- Proprietary data sources
- Nationwide coverage (all 50 states)

### AI Capabilities
- AI document extraction & indexing (1,700+ records/hour)
- Underwriting Intelligence Engine
- Ask Dono (NLP interface for title examination)
- Chain-of-title analysis automation
- Expert human verification loop (100% accuracy guarantee)

### Title Production
- End-to-end title production (order entry → commitment)
- Report generation with verification
- Title plant management
- 4-hour average full property search
- 2,000+ reports daily (87% time reduction)

### Integrations
- SoftPro Sync (recently launched)
- API delivery
- File exchange
- Direct platform access

### Tech Stack
- Website: Webflow
- Analytics: Google Analytics (GA-R62208G8FC), GTM (GTM-KVGF3XMZ)
- Lead Gen: Apollo.io, RB2B visitor tracking
- Fonts: Google Fonts (Merriweather, Great Vibes, Open Sans)

## Regulatory & Recognition

| Item | Date | Significance |
|------|------|-------------|
| American Eagle Title Insurance approval | Unknown | Establishes title insurance partner credibility |
| HousingWire TECH100 2026 | 2026 | Industry recognition |
| CATIC approval (NC attorneys) | Nov 19, 2025 | **PRIOR ART DATE — corrected from Aug 14** |
| ALTA publication | Nov 6, 2025 | **PRIOR ART DATE — extraction/indexing announcement** |
| Qualia Marketplace listing | Nov 19, 2025 | 3 service tiers: Search, Search Plus, Examination |
| SoftPro Sync launch | Mar 23, 2026 | 700+ counties, FL/NC/AR |
| Forbes, VentureBeat, Axios, Inman features | Various | Press coverage |

## Patent Landscape

**Critical Finding: ZERO patents filed by Dono.ai (VERIFIED across blog/website/LinkedIn; UNTESTED on USPTO PAIR)**

- Tali Gross (CEO): 0 patents found [VERIFIED]
- Ron Likvornik (CTO): **UNTESTED** — needs manual USPTO PAIR check
- Eyal Stern (COO): **UNTESTED** — needs manual USPTO PAIR check
- DONO.AI Inc. corporate: **UNTESTED** — needs manual USPTO PAIR check
- No patent or IP strategy mentioned in $6.5M seed round announcement [VERIFIED]
- No patent mentions across any of 7 blog posts [VERIFIED]

**Assessment:** Patent race is WINNABLE. Dono has no IP moat despite $10.2M funding and operational product. However, **manual USPTO PAIR/TESS browser check is REQUIRED** before relying on this for V3.1 filing. WebFetch cannot scrape USPTO due to client-side rendering.

**Key differentiation:** Dono has ZERO foreclosure/distressed property features. Their Underwriting Intelligence Engine evaluates title defects for clean conveyance — NOT foreclosure investment viability. Our claims should emphasize: auction date tracking, bid calculation (ARV formulas), lien position analysis, surplus/deficit modeling, competitive bidder intelligence.

## Prior Art Risk Assessment

### Claim 7 (Data Collection Pipeline)
- **Risk: MEDIUM-HIGH**
- Dono's 4-stage pipeline (Collection → Extraction → Underwriting → Delivery) predates our filing
- CATIC approval Nov 19, 2025 + ALTA publication Nov 6, 2025 establish prior art dates under 35 USC 102(a)(1) — 5+ months before our April 26, 2026 priority
- 700+ county adapters (VCAP, Odyssey, Register of Deeds systems)
- **NOTE:** Aug 14, 2025 date from issue brief is UNVERIFIED — could not be found in any public source. Confirmed date is Nov 19, 2025.
- **Mitigation:** Our pipeline is foreclosure-auction-specific with 12 stages; Dono is title-production-focused. The generic "Collection → Extraction → Underwriting → Delivery" pattern could be argued as obvious — claims must be domain-specific.

### Claim 9 (AI Intelligence Engine)
- **Risk: MEDIUM**
- Dono's Underwriting Intelligence Engine + Ask Dono NLP overlap
- **Mitigation:** Our deal scoring (ARV×70%-Repairs-$10K-MIN($25K,15%×ARV)) is foreclosure-specific

### Recommended Claim 7 Narrowing
Focus on foreclosure-auction-specific elements:
1. Court docket monitoring and case number tracking
2. Auction date extraction and calendar management
3. Multi-county parallel scraping with county-specific adapters
4. Distressed property valuation (ARV-based, not title-production-based)

### Recommended Claim 9 Narrowing
Focus on investor decision support:
1. Max bid formula computation
2. Auction-specific risk scoring
3. Comparable sales analysis for distressed properties
4. Investment return projection

## Competitive Comparison

| Dimension | Dono.ai | BidDeed.AI | Winner |
|-----------|---------|------------|--------|
| Market Focus | Title companies | Foreclosure investors | Different markets |
| Coverage | Nationwide (50 states) | Florida (67 counties) | Dono |
| Data Pipeline | 4-stage | 12-stage Everest | BidDeed (depth) |
| AI Features | Underwriting + NLP | Deal scoring + alerts | Dono (breadth) |
| Funding | $10.2M total ($6.5M seed) | Bootstrapped | Dono |
| Patents | 0 | In progress (V3.1) | BidDeed (if filed first) |
| Team Size | 11-50 | Solo founder | Dono |
| Processing Speed | 1,700 records/hr | Real-time scraping | Different metrics |
| Accuracy | 100% (human verified) | ML-assisted | Dono |
| Pricing | Demo required | Scout Pass model | Unknown |

## Gaps in Recon (v1.2 compliance)

1. Ron Likvornik patent search not completed
2. Eyal Stern patent search not completed
3. Israeli Hebrew sources (Calcalistech) not mined
4. YouTube founder interview content not transcribed
5. CATIC approval exact documentation not located
6. Pricing tier details not discovered (behind demo wall)
7. JS bundle deep mining for hidden API endpoints not done
8. Wayback Machine historical analysis not done
9. Job postings analysis for tech stack clues not done
10. GitHub/open-source contributions not checked

## Action Items for Patent V3.1

1. **URGENT:** Narrow Claim 7 to foreclosure-auction-specific pipeline elements
2. **URGENT:** Narrow Claim 9 to investor decision support (not general underwriting)
3. **PRIORITY:** Complete Ron Likvornik + Eyal Stern patent searches
4. **PRIORITY:** Document CATIC approval date as prior art evidence
5. File provisional by April 26, 2026 deadline

---

*Generated: 2026-04-10 | Protocol: CI Dossier v1.2 | Source: SUMMIT #444*
