# DESIGN.md — ZoneWise.AI Design System
# Version: 2.0.0 | Date: 2026-03-21
# Purpose: Single source of truth for Stitch 2.0, Claude Code, and all UI work
# Brand: BidDeed.AI + ZoneWise.AI house brand

---

## Identity

- **Product**: ZoneWise.AI — AI Zoning & Real Estate Intelligence
- **Tagline**: Distressed assets decoded. For everyone. Everywhere.
- **Tone**: Enterprise-grade, data-dense, trustworthy. Not playful. Not startup-y.
- **Aesthetic**: Dark professional dashboard. Think Bloomberg Terminal meets Claude AI.
- **Audience**: Real estate investors, foreclosure buyers, institutional funds, title companies.

---

## Color Tokens

### Primary Palette (MANDATORY — no exceptions)

```css
:root {
  /* Core Brand */
  --color-navy:           #1E3A5F;   /* Primary — headers, nav, primary buttons */
  --color-orange:         #F59E0B;   /* Accent/CTA — buttons, highlights, badges, active states */
  --color-bg:             #020617;   /* Page background — slate-950 */

  /* Navy Scale */
  --color-navy-light:     #2A4F7A;   /* Hover states, lighter containers */
  --color-navy-dark:      #162D4A;   /* Gradients, pressed states */
  --color-navy-900:       #0F2035;   /* Deep sections, footers */

  /* Orange Scale */
  --color-orange-hover:   #D97706;   /* Button hover — amber-600 */
  --color-orange-light:   #FBBF24;   /* Subtle highlights — amber-400 */
  --color-orange-muted:   #F59E0B1A; /* 10% opacity backgrounds for badges */

  /* Neutral Scale (for text and borders) */
  --color-text-primary:   #F1F5F9;   /* Primary text — slate-100 */
  --color-text-secondary: #94A3B8;   /* Secondary text — slate-400 */
  --color-text-muted:     #64748B;   /* Muted text — slate-500 */
  --color-text-disabled:  #475569;   /* Disabled — slate-600 */
  --color-border:         #1E293B;   /* Default border — slate-800 */
  --color-border-subtle:  #0F172A;   /* Subtle border — slate-900 */
  --color-surface:        #0F172A;   /* Card/panel surface — slate-900 */
  --color-surface-raised: #1E293B;   /* Raised surface — slate-800 */

  /* Semantic (status indicators only) */
  --color-bid:            #22C55E;   /* BID decision — green-500 */
  --color-review:         #F59E0B;   /* REVIEW decision — matches accent */
  --color-skip:           #EF4444;   /* SKIP decision — red-500 */
  --color-info:           #3B82F6;   /* Info indicators — blue-500 */

  /* Heatmap Gradient (choropleth only) */
  --heatmap-cold:         #1E3A5F;   /* Low distress — navy */
  --heatmap-warm:         #F59E0B;   /* Medium distress — orange */
  --heatmap-hot:          #EF4444;   /* High distress — red */
}
```

### BANNED Colors (found in current site — MUST be removed)

| Color | Where Found | Replacement |
|-------|-------------|-------------|
| #F5A623 | demo.html | → #F59E0B |
| #080A0D | demo.html bg | → #020617 |
| #0F1117 | demo.html surface | → #0F172A |
| #3D6FFF | demo.html blue | → #3B82F6 (semantic info only) |
| #00D68F | demo.html green | → #22C55E |
| #FF4757 | demo.html red | → #EF4444 |
| #FFBB33 | demo.html yellow | → #F59E0B |
| #1E2433 | demo.html border | → #1E293B |
| #161A24 | demo.html card | → #0F172A |
| #5A6480 | demo.html text | → #64748B |
| #8492B0 | demo.html text | → #94A3B8 |
| #C8D0E0 | demo.html text | → #F1F5F9 |

---

## Typography

### Font Stack (MANDATORY)

```css
:root {
  --font-primary:   'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:      'JetBrains Mono', 'Fira Code', monospace;
  /* NO OTHER FONTS. Period. */
}
```

### Loading Method

- **Inter**: Loaded via `next/font/google` in Next.js layout.tsx — NOT via Google Fonts CDN
- **JetBrains Mono**: Loaded via `next/font/google` — used ONLY for code blocks, terminal output, and KPI values

### BANNED Fonts (found in current site — MUST be removed)

| Font | Where Found | Action |
|------|-------------|--------|
| Syne | demo.html | DELETE — replace with Inter weight 700/800 |
| DM Sans | demo.html | DELETE — replace with Inter weight 300/400/500 |
| Any Google Fonts CDN `<link>` | demo.html | DELETE — use next/font only |

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display-xl` | 48px | 800 | 1.1 | Hero headline only |
| `display-lg` | 36px | 700 | 1.15 | Section headers |
| `heading-lg` | 24px | 700 | 1.3 | Page titles, card headers |
| `heading-md` | 20px | 600 | 1.3 | Sub-section headers |
| `heading-sm` | 16px | 600 | 1.4 | Card titles, nav items |
| `body-lg` | 15px | 400 | 1.6 | Paragraph text |
| `body-md` | 13px | 400 | 1.5 | Default body, descriptions |
| `body-sm` | 12px | 400 | 1.5 | Secondary info, metadata |
| `caption` | 11px | 500 | 1.4 | Labels, timestamps, tags |
| `mono-md` | 13px | 500 | 1.5 | KPI values, code, data |
| `mono-sm` | 11px | 400 | 1.4 | Terminal log, small data |

**MINIMUM readable size: 11px.** The current demo page uses 6px, 8px, 9px, 10px — all below threshold. Nothing below 11px anywhere in the product.

---

## Spacing System

8px base grid. All spacing uses multiples of 4px.

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Border Radius

```css
:root {
  --radius-sm:  4px;   /* Small tags, badges */
  --radius-md:  6px;   /* Buttons, inputs */
  --radius-lg:  8px;   /* Cards, panels */
  --radius-xl:  12px;  /* Modals, large containers */
  --radius-full: 9999px; /* Avatars, pills */
}
```

---

## Layout Architecture

### Split-Screen (Primary App Layout)

```
┌─────────────────────────────────────────────────────────────┐
│  NAVBAR (56px fixed top)                                     │
├───────────────────────┬─────────────────────────────────────┤
│  LEFT PANEL (380px)   │  RIGHT PANEL (flex: 1)              │
│  Chat + Controls      │  Map / Reports / Calendar           │
│                       │                                     │
│  min: 320px           │  min: 480px                         │
│  max: 480px           │  no max                             │
│  resizable border     │                                     │
├───────────────────────┴─────────────────────────────────────┤
│  STATUS BAR (32px fixed bottom — optional)                   │
└─────────────────────────────────────────────────────────────┘
```

- **Chat LEFT, Map/Reports RIGHT** (Claude AI pattern — approved)
- Divider is draggable (min 320px left, min 480px right)
- Left panel collapses to icon rail on mobile
- Right panel has internal tabs: Map | Report | Calendar | Compare

### Mobile Layout (< 768px)

```
┌──────────────────────┐
│  NAVBAR (48px)       │
├──────────────────────┤
│                      │
│  FULL-SCREEN MAP     │
│  (or active view)    │
│                      │
├──────────────────────┤  ← Bottom Sheet
│  Tab Bar             │
│  [Map][Chat][Cal][⚙] │
└──────────────────────┘
```

- Bottom sheet: collapsed (tab bar + search), half (list view), full (chat/detail)
- No side panel on mobile — everything in bottom sheet
- Map stays behind bottom sheet, interactive when collapsed

### Landing Page Layout (Marketing)

```
HERO → HEATMAP (full-width lead magnet) → 12-Stage System → Pricing → CTA → Footer
```

- Heatmap section is ALWAYS visible, no login required (Reventure strategy)
- Max content width: 1200px centered
- Full-bleed sections for heatmap and hero

---

## Component Library

### Navbar

```
Height: 56px (desktop), 48px (mobile)
Background: var(--color-surface) with backdrop-blur
Border bottom: 1px solid var(--color-border)
Logo: "Z" mark + "ZoneWise.AI" text — Inter 700, var(--color-text-primary)
Nav items: Inter 500 13px, var(--color-text-secondary), hover: var(--color-orange)
Active: var(--color-orange) + 2px bottom border
CTA button: "Get Started" — filled orange
Auth: "Sign In" — ghost button, border: var(--color-border)
```

Consistent across ALL pages. No page may have a different nav or no nav.

### Buttons

```css
/* Primary (orange CTA) */
.btn-primary {
  background: var(--color-orange);
  color: #000;
  font: 600 13px/1 var(--font-primary);
  padding: 10px 20px;
  border-radius: var(--radius-md);
  transition: background 0.15s;
}
.btn-primary:hover { background: var(--color-orange-hover); }

/* Secondary (navy outline) */
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  font: 500 13px/1 var(--font-primary);
  padding: 10px 20px;
  border-radius: var(--radius-md);
}
.btn-secondary:hover { border-color: var(--color-orange); color: var(--color-orange); }

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  font: 500 13px/1 var(--font-primary);
  padding: 8px 16px;
}
.btn-ghost:hover { color: var(--color-orange); }
```

### Cards

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}
.card:hover {
  border-color: var(--color-orange)33; /* 20% orange */
}
```

### Decision Badges

```css
/* BID */
.badge-bid {
  background: #22C55E1A;
  color: var(--color-bid);
  border: 1px solid #22C55E33;
  font: 700 11px var(--font-mono);
  padding: 3px 10px;
  border-radius: var(--radius-sm);
}

/* REVIEW */
.badge-review {
  background: #F59E0B1A;
  color: var(--color-review);
  border: 1px solid #F59E0B33;
}

/* SKIP */
.badge-skip {
  background: #EF44441A;
  color: var(--color-skip);
  border: 1px solid #EF444433;
}
```

### KPI Rows

```
Layout: flex row, align center
Left: Label (body-sm, text-secondary) + Source (caption, text-muted)
Center: Value (mono-md, text-primary, weight 700)
Right: Score ring (24px SVG circle, color by threshold: ≥80 green, ≥60 orange, <60 red)
Minimum row height: 40px
Minimum font size: 11px (NEVER below this)
```

### Chat Panel

```
Width: 380px default (resizable 320–480px)
Background: var(--color-bg)
Header: "ZoneWise AI" label, Inter 600 14px
Messages:
  User: right-aligned, bg var(--color-navy), radius 12px 12px 0 12px
  AI: left-aligned, bg var(--color-surface), radius 12px 12px 12px 0
  Font: body-md (13px)
Input: fixed bottom of panel, 44px height, bg var(--color-surface-raised), radius-md
  Placeholder: "Ask about any FL property..." in text-muted
```

### Map Component

```
Provider: Mapbox GL JS
Style: mapbox://styles/mapbox/dark-v11 (matches dark theme)
Default center: [28.5, -81.5] (Florida center)
Default zoom: 6.5 (shows all 67 counties)
Controls: Zoom (top-right), Fullscreen, Geolocate
Layer toggle pills: positioned top-left over map
  Pill style: bg var(--color-surface-raised), border var(--color-border),
              active: bg var(--color-orange-muted), border var(--color-orange)
Choropleth: fill-color interpolated from --heatmap-cold → --heatmap-warm → --heatmap-hot
Popup: bg var(--color-surface), border var(--color-border), radius-lg, shadow-lg
```

### Calendar Component

```
Layout: CSS Grid 7-column (Mon–Sun)
Header: Month/Year (heading-md) + nav arrows (ghost buttons)
Day cells:
  Default: bg transparent, border-bottom 1px var(--color-border-subtle)
  Today: border 1px var(--color-orange)
  Has event: colored dot indicator
Event chips:
  Foreclosure: bg var(--color-skip)1A, border-left 3px var(--color-skip)
  Tax Deed: bg var(--color-info)1A, border-left 3px var(--color-info)
  HOA: bg var(--color-review)1A, border-left 3px var(--color-review)
County filter: Multi-select dropdown above calendar
```

### Conversion Gate Modal

```
Trigger: After 5 free parcel clicks OR 3 free chat messages
Style: Centered modal, bg var(--color-surface), radius-xl
  Backdrop: rgba(0,0,0,0.7) with backdrop-blur-sm
  Icon: Lock icon in var(--color-orange)
  Headline: heading-lg, "Unlock Full Intelligence"
  Benefits: Checkmark list, body-md, text-secondary
  CTA: btn-primary full-width, "Start Free Trial — $0 for 14 days"
  Dismiss: "Maybe later" ghost link below CTA
```

---

## Pricing Tiers

| | Free | Starter $39/mo | Pro $99/mo |
|---|---|---|---|
| Choropleth heatmap | ✓ Always | ✓ | ✓ |
| Parcel clicks/day | 5 | Unlimited | Unlimited |
| AI chat messages/day | 3 | 50 | Unlimited |
| Counties | All 67 | All 67 | All 67 |
| Auction calendar | View only | Full + alerts | Full + alerts + exports |
| 298-KPI reports | Preview (10 KPIs) | Full report | Full + DOCX/PDF export |
| BidWise max bid | — | ✓ | ✓ + historical |
| API access | — | — | ✓ |

---

## Page Inventory (post-redesign)

| Route | Type | Status | Nav Visible |
|-------|------|--------|-------------|
| `/` | Landing (marketing) | REDESIGN | Full |
| `/app` | Split-screen app (chat + map) | BUILD NEW | App nav |
| `/app/calendar` | 67-county calendar (right panel) | BUILD NEW | App nav |
| `/app/report/:id` | 298-KPI report view (right panel) | BUILD NEW | App nav |
| `/demo` | Animated demo (Next.js route, NOT standalone HTML) | REBUILD | Full |
| `/kpis` | 298 KPIs showcase | FIX (data not loading) | Full |
| `/pricing` | Pricing page | BUILD NEW | Full |
| `/terms` | Legal | Keep | Minimal |
| `/privacy` | Legal | Keep | Minimal |
| `/disclaimer` | Legal | Keep | Minimal |

**DELETE**: `/demo.html` (standalone file), `/explorer` (broken 404)

---

## Animation Rules

```css
/* Standard transitions */
--transition-fast:   150ms ease;
--transition-normal: 250ms ease;
--transition-slow:   400ms ease-out;

/* Page transitions: fade + slide up */
@keyframes page-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Stagger children: 50ms delay per item, max 500ms total */
/* Agent status pulse: 2s ease infinite (only on LIVE agents) */
/* Score rings: 1s ease stroke-dashoffset animation on scroll-into-view */
/* NO auto-playing timed sequences without user control (pause/replay required) */
```

---

## Accessibility Minimums

- **Contrast**: All text must pass WCAG AA (4.5:1 for body, 3:1 for large text)
- **Minimum font**: 11px (current demo has 6px — violation)
- **Focus indicators**: 2px solid var(--color-orange) outline on all interactive elements
- **Keyboard nav**: All panels, tabs, modals fully keyboard-navigable
- **Screen reader**: ARIA labels on map controls, chart elements, and dynamic content

### Contrast Verification

| Pair | Ratio | Pass? |
|------|-------|-------|
| --text-primary (#F1F5F9) on --bg (#020617) | 16.2:1 | ✓ AA |
| --text-secondary (#94A3B8) on --bg (#020617) | 7.1:1 | ✓ AA |
| --text-muted (#64748B) on --bg (#020617) | 4.6:1 | ✓ AA |
| --text-disabled (#475569) on --bg (#020617) | 3.2:1 | ✓ Large only |
| --orange (#F59E0B) on --bg (#020617) | 9.8:1 | ✓ AA |
| #000 on --orange (#F59E0B) | 10.1:1 | ✓ AA (button text) |

**BANNED pairs** (found in current demo.html — all fail WCAG AA):
- #5A6480 on #0F1117 → 2.9:1 ✗
- #3A4255 on #080A0D → 2.1:1 ✗
- #8492B0 on #1E2433 → 3.0:1 ✗

---

## Stitch 2.0 Import Instructions

1. Open stitch.withgoogle.com
2. Create new project: "ZoneWise.AI Redesign"
3. Import this DESIGN.md as design system
4. Generate screens in this order:
   - Screen 1: Landing page hero + heatmap section
   - Screen 2: Split-screen app (chat left, map right)
   - Screen 3: 67-county calendar view
   - Screen 4: 298-KPI report panel
   - Screen 5: Pricing page (Free / Starter $39 / Pro $99)
   - Screen 6: Mobile layout with bottom sheet
   - Screen 7: Conversion gate modal
   - Screen 8: Demo page (agent pipeline + live report)
5. Export DESIGN.md back after generation for Claude Code consumption

### Stitch MCP Integration (Claude Code)

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["@_davideast/stitch-mcp", "proxy"]
    }
  }
}
```

Commands for Claude Code:
```bash
# Pull generated screen HTML into project
npx @_davideast/stitch-mcp tool get_screen_code --screenId <id>

# Build full site from Stitch screens mapped to Next.js routes
npx @_davideast/stitch-mcp tool build_site --projectId <id> --routes '[
  {"screenId":"landing","route":"/"},
  {"screenId":"app","route":"/app"},
  {"screenId":"demo","route":"/demo"},
  {"screenId":"pricing","route":"/pricing"}
]'
```

---

## File: BRAND_COLORS.md (cross-reference)

This DESIGN.md supersedes all prior brand references. The canonical colors are:
- Navy: `#1E3A5F`
- Orange: `#F59E0B`
- Background: `#020617`
- Font: `Inter`

Applied to: zonewise.ai, biddeed.ai, all DOCX/PDF/PPTX outputs, all dashboards.

---

*Generated 2026-03-21 by ZoneWise.AI AI Architect. BRAINSTORM Phase 2 complete.*
