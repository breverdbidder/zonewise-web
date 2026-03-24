# DesignWise Squad Remediation — TODO.md
# Target: All agents → 8.5+ (85% safeguard benchmark)
# Dispatch: March 23, 2026
# Executor: Claude Code autonomous sessions

## P0 — Quick Wins (< 2h total) [PARALLEL]

- [x] P0-1: A11yWise — Add SkipToContent.tsx component, import in layout.tsx, add id="main-content" to main wrapper
- [ ] P0-2: A11yWise — Run Lighthouse CLI on zonewise.ai (DEFERRED to Hetzner Chrome headless)
- [x] P0-3: AnalyticsWise — @vercel/analytics + @vercel/speed-insights added to package.json, VercelAnalytics wired into layout.tsx
- [x] P0-4: SEOWise — app/sitemap.ts (1099B) + public/robots.txt already exist with sitemap ref. GSC submission = ARIEL HITL.

## P1 — Unblock Dependencies (1-2 days) [PARALLEL STREAMS] ← 🔥 ACTIVE

### Stream D: Analytics
- [x] P1-1: AnalyticsWise — posthog-js installed, lib/posthog.ts + components/PostHogProvider.tsx created, layout.tsx wrapped. Commit: 77352c1. Mar 24 2026.
- [x] P1-2: AnalyticsWise — trackEvent dual-fires to Supabase + PostHog. Explorer opened, parcel_clicked, chat_query_sent, pricing_viewed, signup_clicked all wired. Commit: bf0b2fd. Mar 24 2026.

### Stream A: Code Quality
- [x] P1-3a: CodeWise — tsc --noEmit: 0 errors. Fixed: docs/ excluded from tsconfig (staging file caused false error). Commit: 095a0ef. Mar 24 2026.
- [x] P1-3b: CodeWise — Zero TS errors in codebase. Also fixed: Suspense boundary on PostHogProvider useSearchParams(). Commit: 095a0ef.
- [x] P1-3c: CodeWise — npm run build passes clean: 159 pages generated. ignoreBuildErrors kept due to build worker OOM in local/Vercel env; tsc --noEmit is the enforcement gate. Commit: 095a0ef.

### Stream B: Content
- [x] P1-4: ContentWise — Audited "298 KPIs" claim. VERIFIED REAL: lib/kpi-data.ts has 298 KPI definitions across 17 categories. Backed by /api/kpis endpoint + static fallback. No change needed. Mar 24 2026.

## P2A — Code Quality + Accessibility (1 week)

### A11yWise [STREAM C]
- [x] P2A-1a: Add role="application" + aria-label to ExplorerMap.tsx (MapCanvas equivalent). Commit: d3fbf34. Mar 24 2026.
- [ ] P2A-1b: Add role="tooltip" + aria-describedby to ParcelTooltip.tsx
- [ ] P2A-1c: Add aria-label to all MapControls buttons
- [ ] P2A-1d: Add role="listbox" + aria-selected to RegionSelector
- [ ] P2A-2a: Run axe-core audit, fix all AA contrast violations in globals.css
- [x] P2A-2b: Add focus-visible styles: outline 2px solid #F59E0B offset 2px on all interactive elements. Commit: 9513508. Mar 24 2026.
- [x] P2A-3: Create lib/hooks/useMapKeyboard.ts — arrow pan, +/- zoom, Tab parcels, Enter select, Esc deselect. Commit: d3fbf34. Mar 24 2026.

### CodeWise [STREAM A]
- [ ] P2A-4a: npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom, create vitest.config.ts
- [ ] P2A-4b: Write tests: MapCanvas, ChatInput, ParcelPanel, PricingCards, Hero, chat API route
- [ ] P2A-5: npx husky install, create .husky/pre-commit with tsc --noEmit + vitest run

## P2B — Support + Deploy + SEO (1 week, parallel with P2A)

### SupportWise [STREAM E]
- [x] P2B-1: Create app/help/page.tsx + HelpContent.tsx — 10-item FAQ accordion, 6 categories, search/filter, house brand. Commit: 7bd901b. Mar 24 2026.
- [ ] P2B-2: npm install @reactour/tour, create OnboardingTour.tsx with 5 steps, trigger on first visit
- [ ] P2B-3: Install Crisp widget (pending Ariel providing website ID)

### DeployWise [STREAM F]
- [x] P2B-4a: Enhance app/api/health/route.ts — env check (4 vars) + Supabase connectivity + 503 on fail. Commit: 8f19228. Mar 24 2026.
- [ ] P2B-4b: Patch deploy-prod.yml with health check + rollback + Telegram alert on failure

### SEOWise [STREAM B]
- [x] P2B-5a: Create lib/seo-metadata.ts with unique metadata for 9 routes + breadcrumbJsonLd. Commit: 7bd901b. Mar 24 2026.
- [x] P2B-5b: Update explorer, pricing, privacy, terms pages to use route-specific metadata. Commit: 7b2c24d. Mar 24 2026.
- [ ] P2B-5c: Create BreadcrumbJsonLd component for explorer drill-down pages
- [ ] P2B-6: Run Lighthouse SEO on all 8 routes, fix all flagged issues, target ≥95

## P2C — Infrastructure (parallel with P2A/P2B)

### Commander [STREAM F]
- [ ] P2C-1: Create scripts/oauth-health-check.sh, add to sentinel.yml as daily 6AM cron job
- [ ] P2C-2: Create scripts/oauth-refresh.sh (attempt refresh + update GitHub secret + Telegram confirm)

### Sentinel V2 [STREAM F]
- [x] P2C-3: Create scripts/sentinel-patrol.sh with STALE_WORKFLOW_FILTER (9 stale workflows), suppress 422s from Telegram. Commit: ad4d3ed. Mar 24 2026.
- [ ] P2C-4: Create sentinel-weekly.yml — Sunday 9AM cron, aggregate sentinel_runs 7d, Telegram summary

## P3 — Full Capability (2-3 weeks, after P2)

- [ ] P3-1a: StitchWise — Install official stitch-skills: npx skills add google-labs-code/stitch-skills --skill stitch-design,react:components,design-md,enhance-prompt,shadcn-ui --global
- [ ] P3-1b: StitchWise — Generate .stitch/DESIGN.md from house brand tokens (Navy/Orange/Dark/Inter)
- [ ] P3-1c: StitchWise — Run stitch-design + react:components on 3 screens (Explorer, Pricing, FAQ)
- [ ] P3-1d: StitchWise — Compare generated vs hand-coded, ship best candidate to production
- [ ] P3-1e: StitchWise — Wire stitch_usage quota tracking (350 free/mo) to Supabase + Telegram alert at 80%
- [x] P3-1f: StitchWise — @_davideast/stitch-mcp refs archived in DESIGN.md with DEPRECATED notice. SPEC-PATCH.md did not exist. Commit: see P6 cleanup. Mar 24 2026.
- [x] P3-2: IterateWise — PostHog Feature Flag hero_cta_variant (50/50 split, 2 weeks). lib/experiments.ts + HeroCTA.tsx. Create flag in PostHog UI: hero_cta_variant, 50% challenger. Commit: 3e58a3c. Mar 24 2026.
- [x] P3-3a: ContentWise — StatsCounter.tsx + /api/stats. Queries county_conquest_status + zoning_assignments, 1h cache, skeleton loading. Wired to homepage. Commit: 088583c. Mar 24 2026.
- [ ] P3-3b: ContentWise — Build testimonial carousel component (content from Ariel)
- [ ] P3-3c: ContentWise — Create case study page: county analysis walkthrough
- [x] P3-4: SupportWise — app/docs/page.tsx: full API reference, dark theme, auth/endpoints/rate-limits/curl+Python+JS examples. Footer + help links added. Commit: 2be943c. Mar 24 2026.
- [x] P3-5a: QAWise — tests/e2e/chat-streaming.spec.ts: 5 tests covering explorer load, input, send/response, counter, chips. Commit: aed92bd. Mar 24 2026.
- [x] P3-5b: QAWise — tests/e2e/mobile.spec.ts: 375px + 768px viewports, 4 routes, overflow checks, tap target sizes. Commit: aed92bd. Mar 24 2026.

## ARIEL HITL (< 5 min total)
- [x] Submit sitemap to Google Search Console — VERIFIED + sitemap.xml submitted Mar 24 2026
- [x] Create PostHog project — phc_zUQ...Ts14 in Vercel env + GitHub secret. US Cloud project 35462x.
- [ ] Create Crisp account + provide website ID (before P2B-3)
- [ ] Reach out to 3 beta users for testimonials (before P3-3b)
