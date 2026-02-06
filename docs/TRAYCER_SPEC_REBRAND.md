# 🏷️ ZoneWise.AI Website Rebrand — Complete Spec

**Repo:** `breverdbidder/zonewise-web`  
**Label:** `traycer`  
**Priority:** P0 — CRITICAL (everestcapitalusa.com links here)  
**Sprint:** Feb 5–12, 2026  
**Owner:** Ariel (PM) → Claude AI (Architect) → Traycer → Claude Code → Greptile (QA)

---

## 1. PROBLEM STATEMENT

The live site at [zonewise.ai](https://zonewise.ai) is stuck on the **OLD pre-rebrand version**:

| Element | LIVE (OLD ❌) | TARGET (REBRANDED ✅) |
|---------|-------------|----------------------|
| **Primary Color** | Teal `#0D9488` / `#0f766e` | Navy `#1E3A5F` |
| **Accent Color** | Teal highlights | Orange `#F59E0B` |
| **Background** | Dark slate `#020617` (CSS) / White (marketing) | White primary, Navy dark sections |
| **Font** | DM Sans | Inter (per brand guide) |
| **Theme Color (meta)** | `#0D9488` (teal) | `#1E3A5F` (navy) |
| **Geographic Scope** | "Brevard County" only | "67 Florida Counties" statewide |
| **Headline** | "Brevard County Zoning Intelligence Platform" | "Florida's AI-Powered Real Estate Intelligence Platform" |
| **Tagline** | "Query setbacks, building heights..." (zoning only) | "Distressed Assets Decoded. For Everyone. Everywhere." |
| **Stats Bar** | 301 Districts / 10K+ Polygons / 17 Jurisdictions / 56 Codes | 67 Counties / 298 KPIs / 10.8M Parcels / AI + ML |
| **Features** | Zoning queries only | Zoning + Foreclosure + Tax Deed + ML Predictions + HBU |
| **Founder Credit** | None | "Founded by Ariel Shapira" |
| **Everest Capital Link** | None | Link to everestcapitalusa.com |
| **Logo Icon** | Teal "Z" square | Navy/Orange brand mark |
| **CTA Buttons** | `bg-teal-600` | `bg-[#1E3A5F]` with `hover:bg-[#152A45]` |
| **Pricing** | $0 / $29 / $99 (old tiers) | TBD — keep structure, update colors |
| **Product Positioning** | "Zoning Intelligence Platform" | "AI-Powered Real Estate Intelligence" (Agentic AI ecosystem) |
| **Split-Screen Preview** | Not shown | Show split-screen UI mockup (per PRD V4) |

---

## 2. FILES TO MODIFY

### 2.1 CRITICAL — Marketing Landing Page
**File:** `app/(marketing)/page.tsx`

Changes:
- [ ] Replace ALL `teal-600` → custom navy class or `[#1E3A5F]`
- [ ] Replace ALL `teal-400` → `[#F59E0B]` (orange for accent/stats)
- [ ] Replace ALL `teal-100` → `[#E8F4FD]` (light blue background)
- [ ] Replace ALL `teal-700` → `[#152A45]` (dark navy hover)
- [ ] Replace `bg-slate-800` stats bar → `bg-[#1E3A5F]`
- [ ] Update hero headline: "Brevard County Zoning" → "Florida's AI-Powered Real Estate"
- [ ] Update hero subtitle: Add full platform description
- [ ] Update stats: 67 Counties / 298 KPIs / 10.8M Parcels / AI + ML
- [ ] Update features section: Add foreclosure, tax deed, ML, HBU alongside zoning
- [ ] Add "Founded by Ariel Shapira" with link to [everestcapitalusa.com](https://everestcapitalusa.com)
- [ ] Add "Powering [Everest Capital USA](https://everestcapitalusa.com)" to footer
- [ ] Update logo icon: Navy background with orange "Z" accent
- [ ] Update pricing card accent: `border-teal-600` → `border-[#1E3A5F]`
- [ ] Update CTA: "Start Free - 25 Queries" → "Request Early Access" or keep with updated colors
- [ ] Add split-screen UI preview section showing Map + Chat layout

### 2.2 Global Styles
**File:** `app/globals.css`

Changes:
- [ ] Replace entire `:root` CSS variable block:
  ```css
  :root {
    /* Primary brand */
    --navy-50: #E8F4FD;
    --navy-100: #C5DEF0;
    --navy-200: #8FBDDE;
    --navy-300: #5A9CC9;
    --navy-400: #2D6FA0;
    --navy-500: #1E3A5F;
    --navy-600: #1E3A5F;  /* PRIMARY */
    --navy-700: #152A45;
    --navy-800: #0E1D30;
    --navy-900: #07111C;
    
    /* Orange accent */
    --orange-400: #FBBF24;
    --orange-500: #F59E0B;  /* ACCENT */
    --orange-600: #D97706;
    
    /* Semantic */
    --background: #FFFFFF;
    --foreground: #1E293B;
    --primary: var(--navy-600);
    --primary-foreground: white;
    --accent: var(--orange-500);
    --muted: #F1F5F9;
    --muted-foreground: #64748B;
    --border: #E2E8F0;
    --ring: var(--navy-500);
  }
  ```
- [ ] Remove all teal CSS variable references
- [ ] Update selection color: `teal-600` → navy
- [ ] Update focus ring: `teal-500` → navy
- [ ] Update scrollbar colors to match navy theme

### 2.3 Layout Metadata
**File:** `app/layout.tsx`

Changes:
- [ ] Title: "ZoneWise.AI - Brevard County Zoning Intelligence" → "ZoneWise.AI - Florida's AI-Powered Real Estate Intelligence"
- [ ] Description: Update to include foreclosure, tax deed, zoning, ML
- [ ] themeColor: `#0D9488` → `#1E3A5F`
- [ ] Font: Verify Inter is loaded (currently DM Sans in globals.css)

### 2.4 Brand Documentation
**File:** `docs/BRAND_COLORS.md`

- [x] Already correct (Navy #1E3A5F + Orange #F59E0B) — NO CHANGES NEEDED

### 2.5 Tailwind Config
**File:** `tailwind.config.ts`

Changes:
- [ ] Add custom colors to extend theme:
  ```js
  colors: {
    navy: {
      50: '#E8F4FD', 100: '#C5DEF0', 200: '#8FBDDE',
      300: '#5A9CC9', 400: '#2D6FA0', 500: '#1E3A5F',
      600: '#1E3A5F', 700: '#152A45', 800: '#0E1D30',
      900: '#07111C',
    },
    brand: {
      orange: '#F59E0B',
      'orange-dark': '#D97706',
      'orange-light': '#FBBF24',
    }
  }
  ```

---

## 3. NEW CONTENT — MARKETING PAGE STRUCTURE

### 3.1 Header
```
[Navy Z icon with orange accent] ZoneWise.AI    |  Features  Pricing  Login  [Request Access →]
```

### 3.2 Hero Section
```
HEADLINE:   Florida's AI-Powered
            Real Estate Intelligence

SUBTITLE:   Foreclosure auctions. Tax deed sales. Zoning intelligence.
            298 KPIs across 67 Florida counties — powered by machine learning.

CTA:        [Request Early Access]  (navy button, orange hover glow)

FOUNDED:    Founded by Ariel Shapira · Powering Everest Capital USA
```

### 3.3 Stats Bar (Navy background, orange numbers)
```
67          298         10.8M       AI + ML
Counties    KPIs        Parcels     Predictions
```

### 3.4 "Our Edge" Section (NEW)
```
THE ENGINE BEHIND 20 YEARS OF DISTRESSED ASSET SUCCESS

Born from two decades of buying at Florida foreclosure sales and tax deed
auctions — both at the courthouse and online — ZoneWise.AI turns hard-won
experience into an AI and machine learning engine that delivers an unfair
advantage.

[Icon] Foreclosure Intelligence    [Icon] Tax Deed Analysis
AI-powered lien priority,          Delinquent certificate detection,
title search, bid calculation      surplus identification, cost modeling

[Icon] Zoning & Land Use           [Icon] ML Predictions
67-county coverage, setbacks,      XGBoost auction outcome probability,
permitted uses, HBU analysis       price predictions, risk scoring
```

### 3.5 "How It Works" — Split-Screen Preview
```
[Screenshot/mockup of split-screen UI]

LEFT PANEL: Chat Interface          RIGHT PANEL: Map + Reports
"What can I build at                [Mapbox choropleth with
123 Main St, Melbourne?"            property overlay + data card]

Ask in plain English →  AI analyzes 298 KPIs →  Get verified intelligence
```

### 3.6 Pricing (Updated colors, same structure)
Keep Free / Pro / Team tiers but update:
- All teal → navy/orange
- Border accent: orange
- "Popular" badge: navy background

### 3.7 Footer
```
© 2026 ZoneWise.AI · Founded by Ariel Shapira
Powering Everest Capital USA (link)
Terms · Privacy · Disclaimer
```

---

## 4. EVERESTCAPITALUSA.COM IMPACT

Once zonewise.ai is rebranded, the following links on everestcapitalusa.com will correctly display the new brand:

| Location on ECU site | Link | Status |
|---------------------|------|--------|
| Home — AI service card | zonewise.ai | ✅ Will auto-update |
| Home — Due Diligence strip | zonewise.ai | ✅ Will auto-update |
| About — Ariel bio paragraph | zonewise.ai | ✅ Will auto-update |
| About — Credential box | zonewise.ai | ✅ Will auto-update |
| About — Ariel card | zonewise.ai | ✅ Will auto-update |
| Services — 01 Distressed Assets | zonewise.ai | ✅ Will auto-update |
| Services — 04 ZoneWise.AI section | zonewise.ai | ✅ Will auto-update |
| Footer — brand description | zonewise.ai | ✅ Will auto-update |
| Footer — badge | zonewise.ai | ✅ Will auto-update |

**No changes needed on everestcapitalusa.com** — the links are already correct. The rebrand is purely a zonewise-web deployment issue.

**HOWEVER** — after the rebrand, we should verify that the visual identity (navy + orange) is harmonious with everestcapitalusa.com's navy + gold theme. The navy primary is identical (`#1E3A5F`), so they will feel like sibling brands.

---

## 5. DEPLOYMENT CHECKLIST

### Current Hosting
- **Platform:** Render (Express server) behind Cloudflare proxy
- **Headers confirmed:** `x-render-origin-server: Render`, `x-powered-by: Express`, `cf-ray` present
- **Alternative:** Vercel deployment was attempted but paused (vercel.json exists)
- **Cloudflare Pages:** Attempted but abandoned (API routes incompatible)

### Deployment Steps
1. [ ] Make all code changes in feature branch `rebrand/navy-orange-statewide`
2. [ ] Local build verification: `npm run build` passes
3. [ ] Push to branch, create PR
4. [ ] Merge to main
5. [ ] Verify auto-deploy to Render (or manual deploy if needed)
6. [ ] Verify zonewise.ai loads with new brand
7. [ ] Verify all 10 links from everestcapitalusa.com land correctly
8. [ ] Test responsive (mobile, tablet, desktop)
9. [ ] Lighthouse audit (performance, accessibility)

### Environment Variables (Already configured per checkpoint)
```
NEXT_PUBLIC_SUPABASE_URL=https://mocerqjnksmhcjzxrewo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...klKQDw
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
NEXT_PUBLIC_APP_URL=https://zonewise.ai
ANTHROPIC_API_KEY=[configured]
```

---

## 6. ACCEPTANCE CRITERIA

- [ ] Zero teal/cyan visible anywhere on marketing page
- [ ] Navy `#1E3A5F` is primary brand color throughout
- [ ] Orange `#F59E0B` is accent color (stats, CTAs, highlights)
- [ ] "67 Florida Counties" replaces "Brevard County" in all copy
- [ ] "Founded by Ariel Shapira" visible on page
- [ ] Link to everestcapitalusa.com present
- [ ] Stats show: 67 Counties / 298 KPIs / 10.8M Parcels / AI + ML
- [ ] Features include: Foreclosure + Tax Deed + Zoning + ML
- [ ] Responsive on mobile (375px+)
- [ ] Build passes with zero errors
- [ ] All existing routes still work (/login, /signup, /terms, /privacy, /disclaimer)

---

## 7. OUT OF SCOPE (Future Sprints)

- Dashboard/app UI rebrand (only marketing page in this sprint)
- Stripe pricing changes
- New authentication flows
- Actual data pipeline for 67 counties (separate sprint)
- Split-screen app build (this sprint only adds a preview/mockup)
- Logo design finalization (use text mark for now)

---

## 8. REFERENCES

| Document | Location |
|----------|----------|
| Brand Colors (Official) | `zonewise-web/docs/BRAND_COLORS.md` |
| PRD V4 (Latest) | `zonewise/docs/PRD_V4_COMPLETE.md` |
| PRD V3 (Split-Screen) | `zonewise/docs/PRD_V3.md` |
| PRS V4 | `zonewise/docs/PRS_V4_COMPLETE.md` |
| Reventure.app CI | Past chat: Reventure reverse engineering |
| Deployment Checkpoint | `zonewise-web/docs/CHECKPOINT_2026-01-27.md` |
| Logo Discussion | Past chat: Logo design critique Jan 29 |
| Color Revert Decision | Past chat: Revert to Navy + Orange Jan 29 |
| Everest Capital Site | [everestcapitalusa.com](https://everestcapitalusa.com) |
