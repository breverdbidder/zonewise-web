# ZoneWise Web — TODO

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

## CP4 (April 2026) — feat/cp4-april
- [x] TASK 1: Zoning Map Overlay Layer — GeoJSON fill layer from BCPAO FeatureService, category-colored (RU/BU/PUD/AU/IU), toggle in LayerControls, ZoningLegend
- [x] TASK 2: PDF Parcel Report Download — "Download Report" button in ParcelDetail opens printable ZoningReport page (browser Print → PDF)
- [x] TASK 3: PropZone Competitive Comparison — PropZoneCompare.tsx tab in ParcelDetail, queries propzone_intel table, side-by-side comparison with advantage scoring

## COMPLETED
- [x] Next.js site deployed to Vercel
- [x] .claude/ structure with skills, commands, rules, tasks
- [x] CI workflow configured
- [x] Security checks workflow active
