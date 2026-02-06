# CLAUDE CODE MISSION LAUNCH — ZoneWise.AI Rebrand

## IMMEDIATE ACTIONS

You are Claude Code (Opus 4.6) executing a 7-hour autonomous session.

### Step 0: Read Your Mission Files
```bash
cd ~/zonewise-web  # or wherever the repo is cloned
cat docs/OPUS_4.6_MISSION_ZONEWISE_REBRAND.md   # 673-line mission prompt
cat docs/TRAYCER_SPEC_REBRAND.md                 # Traycer spec
cat docs/BRAND_COLORS.md                         # Color reference
```

### Step 1: Create Feature Branch
```bash
git checkout -b rebrand/navy-orange-statewide
```

### Step 2: Install Dependencies & Verify Build
```bash
npm install
npm run build  # Must pass BEFORE starting changes
```

### Step 3: Execute the 6-Phase Traycer Plan

---

## TRAYCER AUTO-GENERATED PLAN (Execute This)

Source: https://github.com/breverdbidder/zonewise-traycer-specs/issues/1#issuecomment-1

### Phase 1: Color System Foundation

**1.1 tailwind.config.ts** — Add navy (50-900) & orange (300-700) palettes, REMOVE all teal
**1.2 app/globals.css** — Replace entire :root block. Kill all --teal-* variables. Navy/orange semantic vars. Font: Inter (not DM Sans).

### Phase 2: Metadata & Theme

**2.1 app/layout.tsx** — Title: "ZoneWise.AI - Florida's AI-Powered Real Estate Intelligence". Theme color: #1E3A5F. Description: 67 counties, foreclosure, tax deed, zoning, ML, Opus 4.6. Font: Inter via next/font/google.

### Phase 3: Marketing Page Reconstruction (BIGGEST PHASE)

**3.1 Header** — Sticky navy bg, white text, orange accent dot in logo
**3.2 Hero** — "Florida's AI-Powered Real Estate Intelligence" + "Distressed Assets Decoded. For Everyone. Everywhere." + Orange badge "Powering Everest Capital USA" → https://everestcapitalusa.com + "Founded by Ariel Shapira, Inventor & Founder"
**3.3 Stats Bar** — Navy bg, orange numbers: 67 Counties | 298 KPIs | 10.8M Parcels | AI+ML
**3.4 "Our Edge" Feature Cards** — 4-card grid: Foreclosure Intelligence 🏛️, Tax Deed Analysis 📜, Zoning & Land Use 🏗️, ML Predictions 🤖
**3.5 Origin Story** — "Built by a Florida Real Estate Veteran" with Ariel's 20+ years experience
**3.6 SplitScreenPreview.tsx** — NEW FILE at components/SplitScreenPreview.tsx:
```
┌──────────────────────┬───────────────────────────────────────────┐
│                      │  [🗺️ MAP] [📅 CALENDAR] [📊 ANALYTICS]   │
│  🤖 MULTILINGUAL     ├───────────────────────────────────────────│
│     NLP CHATBOT      │  Panel 1: Static Mapbox heatmap image     │
│  EN | ES | HE | RU   │  Panel 2: Static auction calendar grid    │
│                      │  Panel 3: Static KPI metric cards         │
└──────────────────────┴───────────────────────────────────────────┘
```
- Left: 40% width, navy bg, static chat messages, language toggle (useState)
- Right: 60% width, tab switching with CSS transitions
- MOCKUP ONLY — no live API calls, no Mapbox tiles, no Supabase queries
- Responsive: stack vertically on mobile (375px+)

**3.7 Pricing** — Update existing pricing colors only (navy borders, orange featured plan)
**3.8 Footer** — Navy bg. "Founded by Ariel Shapira · Powering Everest Capital USA" with link. Navigation: About, Terms, Privacy, Disclaimer.

### Phase 4: Content Replacement

Global search & replace:
- `#0D9488` → `#1E3A5F` (verify each)
- `bg-teal-*` → `bg-navy-*`, `text-teal-*` → `text-navy-*`, `border-teal-*` → `border-navy-*`
- `var(--teal-*)` → `var(--navy-*)`
- "Brevard County" → "67 Florida Counties"
- Verify routes: /, /login, /signup, /terms, /privacy, /disclaimer

### Phase 5: Quality Assurance

- `grep -ri "teal\|cyan\|0D9488" --include="*.tsx" --include="*.css" --include="*.ts"` → Must return ZERO
- `npm run build` → Must pass with 0 errors
- Verify: "Founded by Ariel Shapira" visible
- Verify: everestcapitalusa.com linked in hero AND footer
- Verify: Stats 67/298/10.8M/AI+ML present
- Verify: Split-screen preview renders, tabs switch, language toggle works

### Phase 6: Deploy & Validate

```bash
git add -A
git commit -m "feat: complete rebrand — navy+orange, 67 counties, founder credit, split-screen preview"
git push origin rebrand/navy-orange-statewide
```

Then create PR → merge to main → auto-deploy to Render → verify zonewise.ai live.

---

## CRITICAL RULES (NON-NEGOTIABLE)

1. **ZERO teal/cyan** in final output — grep verify
2. **Navy #1E3A5F** is ONLY primary color
3. **Orange #F59E0B** is ONLY accent color
4. **"Brevard County"** appears NOWHERE in marketing copy
5. **Ariel Shapira** credited as "Inventor & Founder"
6. **everestcapitalusa.com** linked in hero AND footer
7. **All routes** must work: /, /login, /signup, /terms, /privacy, /disclaimer
8. **npm run build** must pass with 0 errors
9. **No new dependencies** without justification
10. **Commit early, commit often** — descriptive messages

## FILES TO MODIFY

| File | Action |
|------|--------|
| `tailwind.config.ts` | Add navy/orange palettes, remove teal |
| `app/globals.css` | Replace :root vars, Inter font, kill teal |
| `app/layout.tsx` | Metadata, theme color, Inter font |
| `app/(marketing)/page.tsx` | COMPLETE REWRITE — hero through footer |
| `components/SplitScreenPreview.tsx` | NEW FILE — 4-panel mockup |

## REPO & AUTH

- **Repo:** `breverdbidder/zonewise-web`
- **GitHub PAT:** Use stored GitHub Secrets or local git credentials
- **Branch:** `rebrand/navy-orange-statewide`
- **Deploy target:** Render (auto-deploys from main)
- **Live URL:** https://zonewise.ai

## REFERENCE REPOS

- `breverdbidder/zonewise-desktop` — Craft Agents fork with existing components (AIChatBox.tsx, MapboxSatellite.tsx, BuildingEnvelope.tsx, KPI calculator, report generator, 12 skills)
- `breverdbidder/zonewise-traycer-specs` — Traycer specs + plans
- `breverdbidder/brevard-bidder-landing` — Everest Capital USA site (cross-link target)

## SUCCESS CRITERIA

When complete, zonewise.ai should:
- Look like a $10M funded PropTech startup
- Navy + orange throughout, zero teal
- Credit Ariel Shapira prominently
- Link to Everest Capital USA
- Show 67-county Florida scope
- Display polished split-screen preview of the platform
- Pass Lighthouse >90 on all metrics
- All 10 links from everestcapitalusa.com land on brand-aligned content
