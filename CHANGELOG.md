# Changelog

All notable changes to ZoneWise.AI web are documented here.

---

## [Unreleased]

### Added
- Pro Forma Studio (`/proforma`) — development financial modeling engine (cost, revenue, NOI, cap-rate-implied value, leverage, cash-on-cash, multi-year DCF IRR, equity multiple) plus an Algoma-style before/after outcome report with a real downloadable PDF. Every number ships with its formula. See `PROJECT_STATE.json` CP6.

### In Progress
- Multi-county expansion beyond Brevard
- Improved AI chat with zoning code citations

---

## [1.0.0] — 2026-01-27

### Added
- AI chat interface for zoning queries (Claude Sonnet 4.5)
- 10,092 GIS polygons for Brevard County
- 17 jurisdictions, 301 districts, 56 unique zone codes
- Stripe subscriptions (Free/Pro/Team/Enterprise)
- Email, Google, GitHub auth via Supabase
- PWA support (installable on mobile)
- Mapbox GL interactive zoning map
- Terms, Privacy, Disclaimer pages
- Deploy pipeline via Vercel

---

[Unreleased]: https://github.com/breverdbidder/zonewise-web/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/breverdbidder/zonewise-web/releases/tag/v1.0.0
