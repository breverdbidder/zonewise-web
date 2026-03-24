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
- [ ] P1-2: AnalyticsWise — Define core funnel in PostHog: landing→explorer→pricing→signup, wire trackEvent calls to posthog.capture()

### Stream A: Code Quality
- [x] P1-3a: CodeWise — tsc --noEmit: 0 errors. Fixed: docs/ excluded from tsconfig (staging file caused false error). Commit: 095a0ef. Mar 24 2026.
- [x] P1-3b: CodeWise — Zero TS errors in codebase. Also fixed: Suspense boundary on PostHogProvider useSearchParams(). Commit: 095a0ef.
- [x] P1-3c: CodeWise — npm run build passes clean: 159 pages generated. ignoreBuildErrors kept due to build worker OOM in local/Vercel env; tsc --noEmit is the enforcement gate. Commit: 095a0ef.

### Stream B: Content
- [x] P1-4: ContentWise — Audited "298 KPIs" claim. VERIFIED REAL: lib/kpi-data.ts has 298 KPI definitions across 17 categories. Backed by /api/kpis endpoint + static fallback. No change needed. Mar 24 2026.

## P2A — Code Quality + Accessibility (1 week)

### A11yWise [STREAM C]
- [ ] P2A-1a: Add role="application" + aria-label to MapCanvas.tsx
- [ ] P2A-1b: Add role="tooltip" + aria-describedby to ParcelTooltip.tsx
- [ ] P2A-1c: Add aria-label to all MapControls buttons
- [ ] P2A-1d: Add role="listbox" + aria-selected to RegionSelector
- [ ] P2A-2a: Run axe-core audit, fix all AA contrast violations in globals.css
- [ ] P2A-2b: Add focus-visible styles: outline 2px solid #F59E0B offset 2px on all interactive elements
- [ ] P2A-3: Integrate useMapKeyboard.ts hook into MapCanvas — arrow pan, +/- zoom, Tab parcels, Enter select, Esc deselect

### CodeWise [STREAM A]
- [ ] P2A-4a: npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom, create vitest.config.ts
- [ ] P2A-4b: Write tests: MapCanvas, ChatInput, ParcelPanel, PricingCards, Hero, chat API route
- [ ] P2A-5: npx husky install, create .husky/pre-commit with tsc --noEmit + vitest run

## P2B — Support + Deploy + SEO (1 week, parallel with P2A)

### SupportWise [STREAM E]
- [ ] P2B-1: Create src/app/help/page.tsx with 10-item FAQ accordion, house brand styling, search filter
- [ ] P2B-2: npm install @reactour/tour, create OnboardingTour.tsx with 5 steps, trigger on first visit
- [ ] P2B-3: Install Crisp widget (pending Ariel providing website ID)

### DeployWise [STREAM F]
- [ ] P2B-4a: Create src/app/api/health/route.ts — env check + Supabase connectivity
- [ ] P2B-4b: Patch deploy-prod.yml with health check + rollback + Telegram alert on failure

### SEOWise [STREAM B]
- [ ] P2B-5a: Create src/lib/seo-metadata.ts with unique metadata for all routes
- [ ] P2B-5b: Update every page.tsx to use route-specific metadata from seo-metadata.ts
- [ ] P2B-5c: Create BreadcrumbJsonLd component for explorer drill-down pages
- [ ] P2B-6: Run Lighthouse SEO on all 8 routes, fix all flagged issues, target ≥95

## P2C — Infrastructure (parallel with P2A/P2B)

### Commander [STREAM F]
- [ ] P2C-1: Create scripts/oauth-health-check.sh, add to sentinel.yml as daily 6AM cron job
- [ ] P2C-2: Create scripts/oauth-refresh.sh (attempt refresh + update GitHub secret + Telegram confirm)

### Sentinel V2 [STREAM F]
- [ ] P2C-3: Add STALE_WORKFLOW_FILTER array to sentinel-patrol.sh, suppress known 422s from Telegram
- [ ] P2C-4: Create sentinel-weekly.yml — Sunday 9AM cron, aggregate sentinel_runs 7d, Telegram summary

## P3 — Full Capability (2-3 weeks, after P2)

- [ ] P3-1a: StitchWise — Install official stitch-skills: npx skills add google-labs-code/stitch-skills --skill stitch-design,react:components,design-md,enhance-prompt,shadcn-ui --global
- [ ] P3-1b: StitchWise — Generate .stitch/DESIGN.md from house brand tokens (Navy/Orange/Dark/Inter)
- [ ] P3-1c: StitchWise — Run stitch-design + react:components on 3 screens (Explorer, Pricing, FAQ)
- [ ] P3-1d: StitchWise — Compare generated vs hand-coded, ship best candidate to production
- [ ] P3-1e: StitchWise — Wire stitch_usage quota tracking (350 free/mo) to Supabase + Telegram alert at 80%
- [ ] P3-1f: StitchWise — Deprecate custom 840 LOC harness → src/legacy/stitchwise-v1/. Remove @google/stitch-sdk refs from SPEC-PATCH.md
- [ ] P3-2: IterateWise — PostHog Feature Flag hero_cta_variant, run 2-week experiment, document in ab_tests table
- [ ] P3-3a: ContentWise — Build live usage counter from Supabase parcel_data count
- [ ] P3-3b: ContentWise — Build testimonial carousel component (content from Ariel)
- [ ] P3-3c: ContentWise — Create case study page: county analysis walkthrough
- [ ] P3-4: SupportWise — Create src/app/docs/page.tsx with API reference, code examples, rate limits
- [ ] P3-5a: QAWise — Add chat streaming E2E test (send query, verify SSE, verify render)
- [ ] P3-5b: QAWise — Add mobile viewport E2E (375px + 768px), verify no horizontal overflow

## ARIEL HITL (< 5 min total)
- [x] Submit sitemap to Google Search Console — VERIFIED + sitemap.xml submitted Mar 24 2026
- [x] Create PostHog project — phc_zUQ...Ts14 in Vercel env + GitHub secret. US Cloud project 35462x.
- [ ] Create Crisp account + provide website ID (before P2B-3)
- [ ] Reach out to 3 beta users for testimonials (before P3-3b)
