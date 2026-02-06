# OPUS 4.6 AGENT TEAMS MISSION: ZoneWise.AI Complete Rebrand & Split-Screen Build

**Mission Duration:** 7 hours (420 minutes)  
**Model:** claude-opus-4-6 (1M context, 128K output, Agent Teams)  
**Authored:** Claude AI Architect (Feb 5, 2026)  
**Repo Primary:** `breverdbidder/zonewise-web` (marketing site at zonewise.ai)  
**Repo Desktop:** `breverdbidder/zonewise-desktop` (Craft Agents fork — app)  
**Traycer Issue:** https://github.com/breverdbidder/zonewise-web/issues/1  
**Branch:** `rebrand/navy-orange-statewide`

---

## MISSION OBJECTIVE

Transform zonewise.ai from an outdated Brevard-only teal zoning tool into a Navy+Orange 67-county Florida real estate intelligence platform. The site must showcase the **Craft Agents OSS split-screen interface** with four integrated panels — multilingual chatbot, Mapbox heatmap, auction calendar, and Reventure-style analytics — all powered by reverse-engineered competitive intelligence from PropertyOnion Maps, Reventure.app, and Gridics.

The rebrand must credit **Ariel Shapira as inventor/founder** and link to **everestcapitalusa.com** as the parent company. Ten existing links from everestcapitalusa.com already point to zonewise.ai and must land on a polished, brand-aligned page.

---

## AGENT TEAMS ARCHITECTURE

Opus 4.6 Agent Teams enables parallel sub-agent execution. The @main agent orchestrates 5 specialized agents that work simultaneously on independent workstreams, converging at integration checkpoints.

```
@main (Orchestrator)
  ├── @brand-agent      → Brand system + globals.css + tailwind + layout.tsx
  ├── @marketing-agent  → Landing page rewrite (page.tsx) + new sections
  ├── @splitscreen-agent → Split-screen PREVIEW MOCKUP component + panel mockups (essential)
  ├── @data-agent       → Reverse engineering data integration + stats
  └── @qa-agent         → Build verification + responsive testing + Lighthouse
```

### Agent Communication Protocol
- Agents share state via filesystem (branch: `rebrand/navy-orange-statewide`)
- @main broadcasts checkpoints every 90 minutes
- Agents commit to feature sub-branches, @main merges
- Conflicts resolved by @main with priority: brand > marketing > splitscreen > data

---

## PHASE 1: CONTEXT BOOT (0–15 min)

**Agent: @main**

```bash
# 1. Clone both repos
git clone https://github.com/breverdbidder/zonewise-web.git
git clone https://github.com/breverdbidder/zonewise-desktop.git

# 2. Create feature branch
cd zonewise-web
git checkout -b rebrand/navy-orange-statewide

# 3. Read critical files
cat docs/BRAND_COLORS.md              # Official palette: Navy #1E3A5F + Orange #F59E0B
cat docs/TRAYCER_SPEC_REBRAND.md      # Complete spec from Traycer Issue #1
cat app/globals.css                    # Current teal CSS variables to replace
cat app/(marketing)/page.tsx           # Current marketing page to rewrite
cat app/layout.tsx                     # Metadata to update

# 4. Read Craft Agents fork for component inventory
cat ../zonewise-desktop/zonewise/README.md
ls ../zonewise-desktop/zonewise/components/web/
ls ../zonewise-desktop/zonewise/components/3d/
cat ../zonewise-desktop/zonewise/components/web/Map.tsx
cat ../zonewise-desktop/zonewise/components/web/AIChatBox.tsx

# 5. Read competitive intelligence
cat ../zonewise-desktop/zonewise/skills/skills-manifest.yaml

# 6. Verify build
npm install && npm run build
```

**Exit Criteria:** All files loaded, build passes, branch created.

---

## PHASE 2: BRAND SYSTEM (15–75 min)

**Agent: @brand-agent**

### 2.1 Replace globals.css `:root` Block

Remove ALL teal variables. Replace with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Navy primary */
  --navy-50: #E8F4FD;
  --navy-100: #C5DEF0;
  --navy-200: #8FBDDE;
  --navy-300: #5A9CC9;
  --navy-400: #2D6FA0;
  --navy-500: #1E3A5F;
  --navy-600: #1E3A5F;
  --navy-700: #152A45;
  --navy-800: #0E1D30;
  --navy-900: #07111C;
  
  /* Orange accent */
  --orange-300: #FCD34D;
  --orange-400: #FBBF24;
  --orange-500: #F59E0B;
  --orange-600: #D97706;
  --orange-700: #B45309;
  
  /* Slate neutrals */
  --slate-50: #f8fafc;
  --slate-100: #f1f5f9;
  --slate-200: #e2e8f0;
  --slate-300: #cbd5e1;
  --slate-400: #94a3b8;
  --slate-500: #64748b;
  --slate-600: #475569;
  --slate-700: #334155;
  --slate-800: #1e293b;
  --slate-900: #0f172a;
  
  /* Semantic mapping */
  --background: #FFFFFF;
  --foreground: #1e293b;
  --primary: var(--navy-500);
  --primary-foreground: white;
  --accent: var(--orange-500);
  --accent-foreground: white;
  --muted: var(--slate-100);
  --muted-foreground: var(--slate-500);
  --border: var(--slate-200);
  --ring: var(--navy-400);
  
  /* Zoning status colors */
  --permitted: #10B981;
  --conditional: #F59E0B;
  --prohibited: #EF4444;
}

/* Dark mode override */
.dark {
  --background: var(--navy-900);
  --foreground: var(--slate-100);
  --primary: var(--orange-500);
  --muted: var(--navy-800);
  --muted-foreground: var(--slate-400);
  --border: var(--navy-700);
}
```

### 2.2 Update tailwind.config.ts

```typescript
const config = {
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#E8F4FD', 100: '#C5DEF0', 200: '#8FBDDE',
          300: '#5A9CC9', 400: '#2D6FA0', 500: '#1E3A5F',
          600: '#1E3A5F', 700: '#152A45', 800: '#0E1D30', 900: '#07111C',
        },
        brand: {
          orange: '#F59E0B',
          'orange-dark': '#D97706',
          'orange-light': '#FBBF24',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  }
}
```

### 2.3 Update layout.tsx Metadata

```typescript
export const metadata: Metadata = {
  title: "ZoneWise.AI — Florida's AI-Powered Real Estate Intelligence",
  description: "Foreclosure auctions, tax deed sales, zoning intelligence, and ML predictions across 67 Florida counties. 298 KPIs. Founded by Ariel Shapira. Powering Everest Capital USA.",
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'ZoneWise.AI' },
}

export const viewport: Viewport = {
  themeColor: '#1E3A5F',
  width: 'device-width', initialScale: 1, maximumScale: 1,
}
```

**Commit:** `feat(brand): Navy+Orange design system — globals.css, tailwind, layout metadata`

---

## PHASE 3: MARKETING PAGE REWRITE (75–240 min)

**Agent: @marketing-agent**

Complete rewrite of `app/(marketing)/page.tsx`. Every `teal` reference eliminated. All copy updated to reflect 67-county statewide platform with distressed assets as core.

### 3.1 Header

```tsx
<header className="border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur z-50">
  <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-navy-500 rounded-lg flex items-center justify-center">
        <span className="text-brand-orange font-bold text-sm">Z</span>
      </div>
      <span className="text-xl font-bold text-navy-500">ZoneWise<span className="text-brand-orange">.AI</span></span>
    </div>
    <nav className="flex items-center gap-6">
      <a href="#edge" className="text-gray-600 hover:text-navy-500 hidden sm:block">Our Edge</a>
      <a href="#platform" className="text-gray-600 hover:text-navy-500 hidden sm:block">Platform</a>
      <a href="#pricing" className="text-gray-600 hover:text-navy-500 hidden sm:block">Pricing</a>
      <Link href="/login" className="text-gray-600 hover:text-navy-500">Login</Link>
      <Link href="/signup" className="bg-navy-500 text-white px-4 py-2 rounded-lg hover:bg-navy-700 transition-colors">
        Request Access
      </Link>
    </nav>
  </div>
</header>
```

### 3.2 Hero Section

```tsx
<section className="py-24 bg-gradient-to-b from-slate-50 to-white">
  <div className="max-w-4xl mx-auto px-4 text-center">
    <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
      Powering Everest Capital USA
    </div>
    <h1 className="text-4xl sm:text-6xl font-bold text-navy-500 mb-6 leading-tight">
      Florida&apos;s AI-Powered<br/>
      <span className="text-brand-orange">Real Estate Intelligence</span>
    </h1>
    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
      Foreclosure auctions. Tax deed sales. Zoning intelligence.
      298 KPIs across 67 Florida counties — powered by machine learning
      and 20 years of distressed asset expertise.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link href="/signup" className="inline-block bg-navy-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-navy-700 transition-colors">
        Request Early Access
      </Link>
      <a href="#platform" className="inline-block border-2 border-navy-500 text-navy-500 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-navy-50 transition-colors">
        See the Platform
      </a>
    </div>
    <p className="text-sm text-gray-500 mt-6">
      Founded by <a href="https://everestcapitalusa.com" target="_blank" rel="noopener" className="text-navy-500 font-medium hover:underline">Ariel Shapira</a> · Inventor & Solo Founder
    </p>
  </div>
</section>
```

### 3.3 Stats Bar (Navy background, orange numbers)

```tsx
<section className="py-12 bg-navy-500">
  <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    <div><p className="text-3xl font-bold text-brand-orange">67</p><p className="text-slate-300">Florida Counties</p></div>
    <div><p className="text-3xl font-bold text-brand-orange">298</p><p className="text-slate-300">Unique KPIs</p></div>
    <div><p className="text-3xl font-bold text-brand-orange">10.8M</p><p className="text-slate-300">Parcels Covered</p></div>
    <div><p className="text-3xl font-bold text-brand-orange">AI + ML</p><p className="text-slate-300">Predictions Engine</p></div>
  </div>
</section>
```

### 3.4 "Our Edge" Section (NEW — distressed assets origin story)

```tsx
<section id="edge" className="py-20">
  <div className="max-w-5xl mx-auto px-4">
    <div className="text-center mb-16">
      <h2 className="text-3xl font-bold text-navy-500 mb-4">The Engine Behind 20 Years of Success</h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Born from two decades of buying distressed assets at Florida courthouse auctions
        and online tax deed sales. ZoneWise.AI turns hard-won experience into an
        unfair advantage.
      </p>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { icon: '⚖️', title: 'Foreclosure Intelligence', desc: 'AI-powered lien priority analysis, title search automation, and max bid calculation across every Florida county.' },
        { icon: '📜', title: 'Tax Deed Analysis', desc: 'Delinquent certificate detection, surplus identification, and cost modeling for online tax deed auctions statewide.' },
        { icon: '🗺️', title: 'Zoning & Land Use', desc: '67-county coverage with setbacks, permitted uses, HBU analysis, and 3D building envelope visualization.' },
        { icon: '🤖', title: 'ML Predictions', desc: 'XGBoost auction outcome probability, price predictions, risk scoring, and composite investment grades.' },
      ].map((item, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-200 transition-all">
          <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center mb-4 text-2xl">{item.icon}</div>
          <h3 className="font-semibold text-navy-500 mb-2">{item.title}</h3>
          <p className="text-gray-600 text-sm">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

### 3.5 Split-Screen Platform Preview (NEW — @splitscreen-agent builds this)

See Phase 4 below. This section renders the `<SplitScreenPreview />` component.

```tsx
<section id="platform" className="py-20 bg-slate-50">
  <div className="max-w-6xl mx-auto px-4">
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-navy-500 mb-4">See the Data. Talk to the Expert.</h2>
      <p className="text-lg text-gray-600">
        Four integrated panels powered by the Craft Agents framework — chat, map, calendar, and analytics working together.
      </p>
    </div>
    <SplitScreenPreview />
  </div>
</section>
```

### 3.6 Pricing (Updated colors only)

Replace every `teal-*` with `navy-*` / `brand-orange`. Keep tier structure ($0/$29/$99).
- Border accent on "Popular": `border-navy-500`
- Badge: `bg-navy-500`
- CTA button: `bg-navy-500 hover:bg-navy-700`

### 3.7 Footer

```tsx
<footer className="py-12 bg-navy-900 text-slate-400">
  <div className="max-w-5xl mx-auto px-4">
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <p className="text-white font-semibold">ZoneWise.AI</p>
        <p className="text-sm">Founded by <a href="https://everestcapitalusa.com" target="_blank" rel="noopener" className="text-brand-orange hover:underline">Ariel Shapira</a></p>
        <p className="text-sm">Powering <a href="https://everestcapitalusa.com" target="_blank" rel="noopener" className="text-brand-orange hover:underline">Everest Capital USA</a></p>
      </div>
      <div className="flex gap-6 text-sm">
        <Link href="/terms" className="hover:text-white">Terms</Link>
        <Link href="/privacy" className="hover:text-white">Privacy</Link>
        <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
      </div>
    </div>
    <p className="text-center text-xs mt-6">
      © 2026 ZoneWise.AI · Distressed Assets Decoded. For Everyone. Everywhere.
    </p>
  </div>
</footer>
```

**Commit:** `feat(marketing): Complete landing page rewrite — 67 counties, founder credit, Navy+Orange`

---

## PHASE 4: SPLIT-SCREEN PREVIEW COMPONENT (75–240 min, parallel with Phase 3)

**Agent: @splitscreen-agent**

Build a visual preview **mockup** component for the marketing page showing the 4-panel architecture. This is a **static/animated showcase** — NOT a functional app — that demonstrates the interface to visitors and drives signups. It is an essential part of this rebrand; visitors clicking from everestcapitalusa.com need to immediately see what ZoneWise.AI does.

**Implementation approach:**
- Static images or CSS illustrations for the map panel (NOT live Mapbox tiles)
- Hardcoded sample conversation for the chat panel (NOT live Claude API)
- Static calendar grid with sample auction dates (NOT live RealForeclose data)
- Hardcoded metric cards with real Florida numbers (NOT live Supabase queries)
- Framer Motion or CSS transitions for tab switching and entrance animations
- Think of it as an **interactive hero image** — polished, animated, credibility-building

### 4.1 Architecture: Craft Agents Fork + 4 Panels

The production app lives in `zonewise-desktop` (Craft Agents OSS fork). The marketing page shows an interactive preview of:

```
┌──────────────────────────────────────────────────────────────────────┐
│ ZoneWise.AI                                              🌐 EN ▾    │
├──────────────────────┬───────────────────────────────────────────────┤
│                      │  ┌─────────┬──────────┬──────────┐           │
│  🤖 AI CHATBOT       │  │ 🗺️ MAP  │ 📅 CAL   │ 📊 STATS │  ← tabs  │
│  (Multilingual NLP)  │  ├─────────┴──────────┴──────────┤           │
│                      │  │                                │           │
│  "¿Qué puedo         │  │  [Active Panel Content]        │           │
│   construir aquí?"   │  │                                │           │
│                      │  │  MAP: Mapbox heatmap with      │           │
│  ZoneWise: Based on  │  │  PropertyOnion-style property  │           │
│  R-1 zoning in       │  │  overlays and choropleth       │           │
│  Satellite Beach...  │  │                                │           │
│                      │  │  CAL: Auction calendar from    │           │
│  [Suggested actions] │  │  RealForeclose with ML scores  │           │
│  · View 3D Envelope  │  │                                │           │
│  · Check HBU         │  │  STATS: Reventure-style        │           │
│  · Run CMA           │  │  analytics with Zillow data    │           │
│                      │  │                                │           │
├──────────────────────┤  │                                │           │
│  🎤 Type or speak... │  └────────────────────────────────┘           │
└──────────────────────┴───────────────────────────────────────────────┘
```

### 4.2 Component File: `app/components/SplitScreenPreview.tsx`

Build as a client component with tab switching between the 3 right panels. Left panel always shows the chatbot conversation. Use Tailwind + navy/orange brand colors.

**Panel 1 — Mapbox Heatmap (PropertyOnion Maps):**
- Static satellite map image with colored property overlay
- Legend: BID (green) / REVIEW (orange) / SKIP (red)
- Property cards with ML scores
- Source: Reverse-engineered from PropertyOnion's Google Maps overlay

**Panel 2 — Calendar View (Auction Calendar):**
- Monthly calendar grid showing auction dates
- Color-coded dots: Foreclosure (navy), Tax Deed (orange)
- Upcoming auctions sidebar with property counts
- Source: RealForeclose calendar structure

**Panel 3 — Reventure Analytics (Market Intelligence):**
- Choropleth mini-map (heatmap by ZIP code)
- Metric cards: Median Value, Inventory, Days on Market, Cap Rate
- Trend sparklines (5-year)
- Source: Zillow Research free CSV data pipeline

**Chatbot Panel (always visible, left side):**
- Multilingual: EN/ES/HE/RU language toggle
- Example conversation in selected language
- Suggested action chips
- Source: Craft Agents AIChatBox.tsx architecture

### 4.3 Reverse Engineering Integration Points

| Feature | Source | Status in Repo |
|---------|--------|----------------|
| Mapbox satellite + 3D | `zonewise-desktop/zonewise/components/web/MapboxSatellite.tsx` | ✅ Built |
| AI Chat interface | `zonewise-desktop/zonewise/components/web/AIChatBox.tsx` | ✅ Built |
| 3D Building envelope | `zonewise-desktop/zonewise/components/3d/BuildingEnvelope.tsx` | ✅ Built |
| Sun/Shadow analysis | `zonewise-desktop/zonewise/components/web/SunShadowAnalysis.tsx` | ✅ Built |
| PropertyOnion Maps heatmap | Reverse-engineered overlay pattern | 🔨 Build |
| RealForeclose calendar | Scraped auction schedule | 🔨 Build |
| Reventure choropleth | Zillow CSV + Mapbox GL | 🔨 Build |
| Multilingual NLP | Claude API + i18n | 🔨 Build |
| 298 KPI engine | `zonewise-desktop/zonewise/services/kpiCalculator.ts` | ✅ Built |

### 4.4 Language Support (Multilingual Chatbot)

```typescript
const LANGUAGES = {
  en: { label: 'English', flag: '🇺🇸', example: 'What can I build at 123 Main St?' },
  es: { label: 'Español', flag: '🇪🇸', example: '¿Qué puedo construir en 123 Main St?' },
  he: { label: 'עברית', flag: '🇮🇱', example: 'מה אני יכול לבנות ב-123 מיין סט?' },
  ru: { label: 'Русский', flag: '🇷🇺', example: 'Что я могу построить на 123 Main St?' },
  pt: { label: 'Português', flag: '🇧🇷', example: 'O que posso construir em 123 Main St?' },
  zh: { label: '中文', flag: '🇨🇳', example: '我可以在123 Main St建什么？' },
}
```

**Commit:** `feat(preview): Split-screen preview component — 4 panels, multilingual, reverse-engineered`

---

## PHASE 5: DATA INTEGRATION & STATS (240–330 min)

**Agent: @data-agent**

### 5.1 Verify Real Data Points for Marketing

All stats on the marketing page must be factual:

| Stat | Source | Verified Value |
|------|--------|----------------|
| 67 Counties | Florida county count | ✅ 67 |
| 298 KPIs | PRD_V4_COMPLETE.md KPI framework | ✅ 298 |
| 10.8M Parcels | Florida GIO statewide parcel data | ✅ 10.8M |
| 20 Years | Ariel's distressed asset experience | ✅ Since ~2005 |
| 12 Skills | zonewise-desktop/zonewise/skills/ | ✅ 12 directories |

### 5.2 Create Supabase Stats API

```sql
-- Create view for marketing page stats (pulls from actual data)
CREATE OR REPLACE VIEW marketing_stats AS
SELECT
  67 as county_count,
  298 as kpi_count,
  10800000 as parcel_count,
  (SELECT COUNT(*) FROM multi_county_auctions WHERE auction_date >= CURRENT_DATE) as upcoming_auctions,
  (SELECT COUNT(DISTINCT county) FROM multi_county_auctions) as active_counties;
```

### 5.3 PropertyOnion Maps Data Layer

Document the reverse-engineered map overlay approach:

```typescript
// PropertyOnion uses Google Maps with custom tile overlay
// ZoneWise uses Mapbox GL with GeoJSON feature layers
// Key difference: We use BCPAO/county GIS parcel boundaries (free)
// PropertyOnion uses proprietary tile server

interface PropertyOverlay {
  parcel_id: string;
  geometry: GeoJSON.Polygon;       // From county GIS API
  ml_score: number;                // Our XGBoost prediction
  recommendation: 'BID' | 'REVIEW' | 'SKIP';
  color: string;                   // Green/Orange/Red
  auction_date: string;
  judgment_amount: number;
}
```

**Commit:** `feat(data): Stats verification, Supabase views, PropertyOnion map data layer`

---

## PHASE 6: QA & DEPLOYMENT (330–390 min)

**Agent: @qa-agent**

### 6.1 Build Verification

```bash
cd zonewise-web
npm run build              # Must pass with 0 errors
npm run lint               # Must pass
```

### 6.2 Visual QA Checklist

- [ ] Zero teal/cyan anywhere (grep -r "teal" --include="*.tsx" --include="*.css")
- [ ] Navy #1E3A5F confirmed as primary (check rendered header, buttons, footer)
- [ ] Orange #F59E0B confirmed as accent (check stats bar, badges, links)
- [ ] "Founded by Ariel Shapira" visible on page
- [ ] Link to everestcapitalusa.com clickable and opens new tab
- [ ] "67 Florida Counties" in hero (not "Brevard County")
- [ ] Stats show: 67 / 298 / 10.8M / AI+ML
- [ ] Split-screen preview renders with all 4 panels
- [ ] Tab switching works (Map → Calendar → Stats)
- [ ] Multilingual toggle works (EN/ES/HE/RU)
- [ ] All existing routes work: /login, /signup, /terms, /privacy, /disclaimer
- [ ] Responsive: 375px (mobile), 768px (tablet), 1440px (desktop)
- [ ] No console errors in browser

### 6.3 Lighthouse Targets

| Metric | Target |
|--------|--------|
| Performance | > 90 |
| Accessibility | > 95 |
| Best Practices | > 90 |
| SEO | > 95 |

### 6.4 Cross-Reference with everestcapitalusa.com

Open all 10 links from ECU site and verify they land on a branded page:
1. Home AI service card → zonewise.ai ✓
2. Home Due Diligence strip → zonewise.ai ✓  
3. About Ariel bio → zonewise.ai ✓
4. About credential box → zonewise.ai ✓
5. About Ariel card → zonewise.ai ✓
6. Services 01 → zonewise.ai ✓
7. Services 04 → zonewise.ai ✓
8. Footer description → zonewise.ai ✓
9. Footer badge → zonewise.ai ✓
10. Differentiator strip → zonewise.ai ✓

### 6.5 Deploy

```bash
# Merge feature branch
git checkout main
git merge rebrand/navy-orange-statewide

# Push (auto-deploys to Render)
git push origin main

# Verify live
curl -sI https://zonewise.ai | grep "200"
```

**Commit:** `chore(qa): Build verification, Lighthouse audit, deployment`

---

## PHASE 7: DOCUMENTATION & CHECKPOINT (390–420 min)

**Agent: @main**

### 7.1 Update CLAUDE.md

Create `zonewise-web/CLAUDE.md` with project context for future Claude Code sessions.

### 7.2 Close Traycer Issue #1

Comment on issue with:
- Summary of all changes
- Before/after screenshots (if possible)
- Lighthouse scores
- Links verified

### 7.3 Supabase Checkpoint

```sql
INSERT INTO claude_context_checkpoints (project, checkpoint_type, data)
VALUES ('zonewise-web', 'rebrand_complete', '{
  "date": "2026-02-06",
  "branch": "rebrand/navy-orange-statewide",
  "changes": ["globals.css", "page.tsx", "layout.tsx", "tailwind.config.ts", "SplitScreenPreview.tsx"],
  "colors": {"primary": "#1E3A5F", "accent": "#F59E0B"},
  "stats": {"counties": 67, "kpis": 298, "parcels": "10.8M"},
  "founder": "Ariel Shapira",
  "parent_company": "Everest Capital USA",
  "issue_closed": "#1"
}');
```

---

## PARALLEL EXECUTION TIMELINE

```
TIME    @brand    @marketing    @splitscreen    @data    @qa
─────   ───────   ──────────    ────────────    ─────    ────
0:00    BOOT ──────────────────────────────────────────────>
0:15    CSS/TW    ·····         ·····           ·····    ·····
0:45    layout    Hero          Tab component   Stats    ·····
1:15    DONE ✓    Edge section  Map panel       API      ·····
1:30    ·····     Stats bar     Calendar panel  Overlay  ·····
2:00    ·····     Platform §    Reventure panel KPIs     ·····
2:30    ·····     Pricing       Chatbot panel   Verify   ·····
3:00    ·····     Footer        Integration     DONE ✓   Build
3:30    ·····     DONE ✓        DONE ✓          ·····    Visual QA
4:00    ·····     ·····         ·····           ·····    Lighthouse
4:30    ·····     ·····         ·····           ·····    Responsive
5:00    ─── INTEGRATION MERGE (@main) ──────────────────────>
5:30    ─── CONFLICT RESOLUTION + FINAL BUILD ──────────────>
6:00    ─── DEPLOYMENT TO RENDER ───────────────────────────>
6:15    ─── VERIFY LIVE + ECU CROSS-LINKS ──────────────────>
6:30    ─── DOCUMENTATION + CHECKPOINT ─────────────────────>
7:00    ═══ MISSION COMPLETE ═══════════════════════════════>
```

---

## CRITICAL RULES

1. **ZERO teal/cyan in final output.** `grep -r "teal" --include="*.tsx" --include="*.css"` must return 0 results.
2. **Navy #1E3A5F is the ONLY primary color.** No variations, no approximations.
3. **Orange #F59E0B is the ONLY accent color.** Matches Everest Capital USA gold family.
4. **"Brevard County" appears NOWHERE** in marketing copy. Always "67 Florida Counties" or "Florida statewide."
5. **Ariel Shapira credited as "Inventor & Founder"** — not "developer" or "creator."
6. **everestcapitalusa.com linked** in hero AND footer.
7. **All 10 ECU links verified** after deployment.
8. **Build must pass** — zero errors, zero warnings.
9. **No new dependencies** without justification. Use existing Next.js + Tailwind + Mapbox stack.
10. **Commit early, commit often.** Feature sub-branches merged by @main.

---

## CREDENTIALS

All credentials available via GitHub Secrets and `.env` files. Refer to:
- `zonewise-web/.env.example` for required environment variables
- `zonewise-web/docs/CHECKPOINT_2026-01-27.md` for Supabase/Mapbox setup
- GitHub repository secrets for PAT, Supabase keys, Mapbox token

---

*Mission authored by Claude AI Architect for Opus 4.6 Agent Teams execution.*  
*ZoneWise.AI — Distressed Assets Decoded. For Everyone. Everywhere.*
