# Everest Stack Inventory v1 — GitHub Secret Mining Discoveries

**Date:** April 10, 2026
**Source:** GitHub secrets across 7 key repos (cli-anything-biddeed, biddeed-ai, biddeed-ai-ui, zonewise-web, zonewise-scraper-v4, cliproxy-gateway, tax-insurance-optimizer)
**Impact:** 18 new capabilities discovered, 6 integrated into CI Dossier Protocol v1.2
**Total v1.2 marginal cost:** $0/month (all capabilities already paid)

---

## Discovery Summary

| # | Secret Key | Repos Found | Category | CI Protocol Impact |
|---|-----------|-------------|----------|--------------------|
| 1 | STITCH_API_KEY | 2 | Design System | v1.1: Checkpoints 2.17-2.20, 11.6-11.8 |
| 2 | EXA_API_KEY | 3 | Neural Search | v1.2: Checkpoint 6.15 |
| 3 | BUILTWITH_API_KEY | 1 | Tech Stack Detection | v1.2: Checkpoint 7.12 |
| 4 | GREPTILE_API_KEY | 3 | Code Intelligence | v1.2: Checkpoint 6.19 |
| 5 | LINKEDIN_LI_AT | 1 | Social Data | v1.2: Checkpoint 6.16 |
| 6 | LINKEDIN_SESSION_JSON | 1 | Social Data | v1.2: Checkpoint 6.16 |
| 7 | APIFY_API_TOKEN | 2 | Web Scraping | v1.2: Checkpoints 6.17-6.18 |
| 8 | SUPADATA_API_KEY | 1 | Multi-Service Scraping | Available, not yet integrated |
| 9 | WATCH_TOKEN | 1 | Session Telemetry | Claude Watch (internal tool) |
| 10 | NVIDIA_NIM_API_KEY | 1 | LLM Backend | Additional inference capacity |
| 11 | OPENROUTER_API_KEY | 1 | LLM Backend | Multi-model routing |
| 12 | BROWSERLESS_API_KEY | 1 | Hosted Chrome | Alternative to Playwright local |
| 13 | AGENTQL_API_KEY | 1 | AI Data Extraction | Structured data from unstructured sources |
| 14 | MODAL_TOKEN_ID | 1 | Serverless Compute | GPU + Python serverless |
| 15 | MODAL_TOKEN_SECRET | 1 | Serverless Compute | GPU + Python serverless |
| 16 | DIFY_API_KEY | 1 | LLMOps | Self-hosted LLM orchestration |
| 17 | FIGMA_API_TOKEN | 1 | Design | Figma API access |
| 18 | NEXT_PUBLIC_POSTHOG_KEY | 1 | Product Analytics | Event tracking + feature flags |
| 19 | PEXELS_API_KEY | 1 | Stock Imagery | Free stock photos/videos |

---

## v1.2 Protocol Integrations (6 New Checkpoints)

### 6.15 — Exa Neural Search
- **Replaces:** SerpAPI / Tavily references in v1.0
- **Capability:** AI-native semantic search across the web
- **Use case:** Company + founder + product term discovery with neural relevance ranking
- **Cost:** Already paid (EXA_API_KEY active in 3 repos)

### 6.16 — LinkedIn Authenticated Session
- **Capability:** Deep founder profiles beyond public view (employment history, education, skills, endorsements)
- **Use case:** Phase 6 founder enrichment beyond basic LinkedIn scraping
- **Auth:** LINKEDIN_LI_AT + LINKEDIN_SESSION_JSON cookies
- **Risk:** Session cookie rotation required; respect LinkedIn ToS

### 6.17 — Apify Instagram Scraper
- **Capability:** Instagram profile metrics (followers, posts, engagement rate, recent content)
- **Use case:** Competitor social media intelligence in Phase 6
- **Actor:** apify/instagram-scraper

### 6.18 — Apify LinkedIn Company Scraper
- **Capability:** Company page data (employee count by function, specialties, recent posts, growth signals)
- **Use case:** Phase 6 employee + company intelligence
- **Actor:** apify/linkedin-company-scraper

### 6.19 — Greptile Code Intelligence
- **Capability:** AI-powered codebase analysis for public GitHub repos
- **Use case:** Phase 6 technical intelligence for competitors with public repos
- **Limitation:** Only applicable to open-source competitors
- **Cost:** Already paid (GREPTILE_API_KEY active in 3 repos)

### 7.12 — BuiltWith Authoritative Tech Stack
- **Capability:** Complete technology profile with first/last detected dates, categories, market share
- **Use case:** Phase 7 tech stack fingerprinting — authoritative source superseding inference
- **Impact:** BREAKTHROUGH — eliminates guesswork from 7.1-7.11 inference-based detection
- **Cost:** Already paid (BUILTWITH_API_KEY active)

---

## Capabilities Not Yet Integrated (Future Protocol Versions)

| Key | Potential Use | Estimated Protocol Phase |
|-----|--------------|------------------------|
| SUPADATA_API_KEY | Video + web scraping 4-service API | Phase 2, 6 |
| BROWSERLESS_API_KEY | Hosted Chrome for screenshot capture | Phase 2 alternative |
| AGENTQL_API_KEY | AI structured data extraction from competitor sites | Phase 3, 4 |
| MODAL_TOKEN_ID/SECRET | GPU compute for ML-heavy analysis | Phase 9 |
| FIGMA_API_TOKEN | Competitor Figma file analysis (if public) | Phase 2 |
| NEXT_PUBLIC_POSTHOG_KEY | Our own product analytics | Not CI-related |
| PEXELS_API_KEY | Stock imagery for deliverables | Phase 11 |
| NVIDIA_NIM_API_KEY | Additional LLM inference | All phases |
| OPENROUTER_API_KEY | Multi-model routing | All phases |
| DIFY_API_KEY | Self-hosted LLM orchestration | Pipeline automation |

---

## License & Security Notes

- All API keys are stored as GitHub encrypted secrets
- No keys are committed to source code
- Session cookies (LinkedIn) require periodic rotation
- Apify usage subject to their fair use policy
- BuiltWith data is commercially licensed — do not redistribute raw API responses

---

**Version:** 1.0
**Date:** April 10, 2026
**Related:** CI-DOSSIER-CHECKPOINT-PROTOCOL-v1.2.md, issue #445
