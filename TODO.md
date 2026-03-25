# ZoneWise Web — TODO

## CP5 — Feasibility Intelligence (Mar 25, 2026)
- [x] Task 1: Water setback detection in SiteTab ZoningReport — branch feat/cp5-feasibility
- [x] Task 2: Lodging/STR zoning intelligence — LodgingTab.tsx
- [x] Task 3: Market Context Panel — MarketContext.tsx with demographics + Market Score 1-10
- [ ] Migration: run 20260325_add_water_setback_lodging_columns.sql on prod Supabase
- [ ] Replace demo data with live Supabase queries (Issue #23)

## ACTIVE SPRINT (Mar 2026)

### P0 — Production
- [ ] Audit and delete dead GitHub Actions workflows (dns-debug, vinext-*, fix-*)
- [ ] Verify Vercel deployment pipeline is clean (5 projects!)
- [ ] Update brand colors to house brand (Navy #1E3A5F, Orange #F59E0B)

### P1 — Features
- [ ] Implement split-screen chat UI (chat left, artifacts right)
- [ ] Add NLP chatbot interface for zoning queries
- [ ] Connect to zonewise-agents API for live data

### P2 — Testing
- [ ] Run Playwright e2e tests in CI
- [ ] Add visual regression tests for key pages
- [ ] Security audit on exposed API routes

## COMPLETED
- [x] Next.js site deployed to Vercel
- [x] .claude/ structure with skills, commands, rules, tasks
- [x] CI workflow configured
- [x] Security checks workflow active
