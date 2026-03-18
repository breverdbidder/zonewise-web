# ZONEWISE.AI EXPLORER V2 — FULL SPEC
## Reventure-Style Choropleth + NLP Chatbot + 262K Parcels

**Status**: SPEC (ready for Claude Code)  
**Date**: March 18, 2026  
**Route**: `/explorer` (replace current implementation)  
**Priority**: SHIP THIS WEEK

---

## ARCHITECTURE: SPLIT-SCREEN EXPLORER

```
┌──────────────────────────────────────────────────────────────────────┐
│ Z ZoneWise.AI    Dashboard  [Explorer]  Auctions  Feasibility    👤 │
├────────────────────────────────┬─────────────────────────────────────┤
│                                │ [Streets▾] [Satellite] [3D]        │
│  🤖 AI CHAT PANEL (LEFT)      │                                     │
│  ─────────────────────────     │        MAP PANEL (RIGHT)           │
│  💬 "What zoning is at         │                                     │
│      798 Ocean Dr?"            │   ┌─ Choropleth (zoom 9-12) ─┐    │
│                                │   │  ZIP colored by median    │    │
│  🗺️ That property is zoned    │   │  home value. Click ZIP    │    │
│  RU-1-11 (Residential) in     │   │  to drill down.           │    │
│  Satellite Beach. Building     │   └──────────────────────────┘    │
│  value $165K, land $154K.      │                                     │
│  [View on map] [Full report]   │   ┌─ Parcels (zoom 15+) ────┐    │
│                                │   │  BCPAO boundaries +      │    │
│  SUGGESTED QUERIES:            │   │  zoning overlay +         │    │
│  ┌──────────┐ ┌──────────┐    │   │  click → parcel detail    │    │
│  │🏠 Address │ │📍 Zoning │    │   └──────────────────────────┘    │
│  └──────────┘ └──────────┘    │                                     │
│  ┌──────────┐ ┌──────────┐    │   LAYERS: ☑Parcels ☑Zoning        │
│  │🔥 Heatmap│ │⚖️ Auction│    │           ☐FLU ☐Heatmap ☐Flood   │
│  └──────────┘ └──────────┘    │                                     │
│                                │   LEGEND: ■RU ■BU ■PUD ■AU ■IU   │
├────────────────────────────────┴─────────────────────────────────────┤
│ 262K parcels | 32 ZIPs | Zoom 14 | Brevard County, FL              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## MOBILE LAYOUT (Bottom Sheet Pattern)

```
┌──────────────────────────┐
│ Z ZoneWise.AI       [≡]  │
├──────────────────────────┤
│ 🔍 Ask anything...       │
├──────────────────────────┤
│                          │
│    MAP (60% height)      │
│    Choropleth or parcels │
│    depending on zoom     │
│                          │
│               [+][-][📍] │
├──────────────────────────┤
│ ◉Parcels ◉Zoning ○Heat  │  ← Horizontal pill toggles
├━━━━━━━━━━━━━━━━━━━━━━━━━━┤
│ ▲ SWIPE UP               │  ← Bottom sheet (draggable)
│                          │
│ 💬 Recent: "Show RU-1    │
│    parcels near Viera"   │
│                          │
│ 🏠 Address  📍 Zoning    │  ← Chip shortcuts
│ 🔥 Heatmap  ⚖️ Auctions  │
└──────────────────────────┘
```

---

## COMPONENT ARCHITECTURE

### Files to Create/Modify

```
app/(dashboard)/explorer/page.tsx          ← Update: import ExplorerV2
components/explorer/
  ├── ExplorerV2.tsx                       ← NEW: Main split-screen layout
  ├── ExplorerMap.tsx                      ← NEW: Mapbox with choropleth + parcels + zoom-adaptive
  ├── ExplorerChat.tsx                     ← NEW: NLP chat panel with map-sync
  ├── ExplorerMobileSheet.tsx              ← NEW: Bottom sheet for mobile
  ├── ChoroplethLayer.tsx                  ← NEW: ZIP-level heatmap from Zillow/Census
  ├── ParcelIdentify.tsx                   ← NEW: Click-to-identify popup
  ├── LayerControls.tsx                    ← NEW: Toggles + zoning filter
  ├── ZoningLegend.tsx                     ← NEW: Color legend
  ├── SearchChips.tsx                      ← NEW: Quick-action chips
  ├── BrevardExplorer.tsx                  ← KEEP as fallback
  ├── ExplorerLoader.tsx                   ← UPDATE: load ExplorerV2
  ├── constants.ts                         ← UPDATE: add Zillow URLs, ZIP codes
  └── explorer-styles.css                  ← UPDATE: popup + mobile styles
lib/explorer/
  ├── constants.ts                         ← UPDATE: add choropleth config
  ├── zillow.ts                            ← NEW: Zillow CSV fetch + parse
  ├── choropleth.ts                        ← NEW: ZIP boundary GeoJSON + color scale
  └── chat-actions.ts                      ← NEW: Map actions from chat commands
app/api/explorer/
  ├── chat/route.ts                        ← NEW: Claude API for explorer chat
  ├── zillow/route.ts                      ← NEW: Cached Zillow data endpoint
  └── parcels/route.ts                     ← NEW: BCPAO proxy for parcel search
```

---

## FEATURE SPEC

### 1. NLP CHATBOT (Left Panel)

**Existing code to reuse**: `components/ChatWidget.tsx` + `lib/ai/claude.ts`

**System prompt additions**:
```
You are the ZoneWise Explorer AI. You can:
1. Search parcels by address → respond with map coordinates + parcel data
2. Filter by zoning type → "Show me all RU-1 parcels near Viera"
3. Show heatmap → "Show median home values by ZIP"
4. Find auctions → "What foreclosures are coming up in Satellite Beach?"
5. Analyze neighborhoods → "Compare 32937 vs 32940 for investment"

When responding, include ACTION commands the frontend can parse:
- [MAP:FLY lat,lng,zoom] → fly map to location
- [MAP:HIGHLIGHT parcel_id] → highlight parcel
- [MAP:CHOROPLETH metric] → switch choropleth metric
- [MAP:FILTER zoning_code] → filter zoning overlay
- [MAP:LAYER toggle_id on|off] → toggle layer
```

**Chat chips (suggested queries)**:
```typescript
const EXPLORER_CHIPS = [
  { icon: '🏠', text: 'What is the zoning at 798 Ocean Dr, Satellite Beach?' },
  { icon: '📍', text: 'Show me RU-1 residential parcels in Merritt Island' },
  { icon: '🔥', text: 'Show median home values heatmap by ZIP code' },
  { icon: '⚖️', text: 'What foreclosure auctions are coming up in Brevard?' },
  { icon: '💰', text: 'Best ZIP codes for investment in Brevard County' },
  { icon: '🏗️', text: 'Where can I build multi-family in Palm Bay?' },
]
```

**Chat → Map sync**: When AI responds with [MAP:*] commands, the frontend parses them and executes map actions (fly to, highlight, filter, toggle layers).

### 2. CHOROPLETH HEATMAP (Reventure-Style)

**Data source**: Zillow Research FREE CSVs (already documented in reventure-clone-v2)

**ZIP codes for Brevard County** (FIPS 12009):
```
32754, 32780, 32796, 32901, 32903, 32904, 32905, 32907, 32908, 32909,
32920, 32922, 32925, 32926, 32927, 32931, 32934, 32935, 32937, 32940,
32949, 32950, 32951, 32952, 32953, 32955, 32976
```

**Metrics to visualize** (dropdown selector):
- Median Home Value (ZHVI) — DEFAULT
- Median Rent (ZORI)
- Inventory (for-sale listings)
- Days on Market
- Price Cuts %
- YoY Value Change %

**Color scale**: Blue (low) → Green → Yellow → Orange → Red (high)
Matches Reventure.app exactly.

**ZIP boundary source**: Census TIGER/Line via Mapbox `mapbox://mapbox.boundaries-pos4-v4` OR pre-loaded GeoJSON from Census API.

**Implementation**:
```typescript
// Fetch Zillow ZHVI for Brevard ZIPs
const ZHVI_URL = 'https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv'

// Parse CSV, filter to Brevard ZIPs, get latest month
// Join with ZIP boundary GeoJSON
// Render as fill-color layer on Mapbox with data-driven styling
```

**Zoom behavior**:
- Zoom 9-12: Choropleth fills entire ZIPs, prominent
- Zoom 13-14: Choropleth fades to 30% opacity, zoning appears
- Zoom 15+: Choropleth off, parcels + zoning visible

### 3. ZOOM-ADAPTIVE LAYERS

```typescript
map.on('zoom', () => {
  const z = map.getZoom()
  
  // Choropleth: prominent at county, fades at street
  map.setPaintProperty('choropleth-fill', 'fill-opacity',
    z < 12 ? 0.6 : z < 14 ? 0.3 : 0.1)
  
  // Zoning: invisible at county, subtle at neighborhood, full at street
  map.setLayoutProperty('zoning-layer', 'visibility', z >= 12 ? 'visible' : 'none')
  map.setPaintProperty('zoning-layer', 'raster-opacity',
    z < 13 ? 0.15 : z < 15 ? 0.35 : 0.55)
  
  // Parcels: only at street level
  map.setLayoutProperty('parcels-layer', 'visibility', z >= 14 ? 'visible' : 'none')
  
  // 3D buildings: zoom 14+
  if (map.getLayer('zw-3d-buildings'))
    map.setLayoutProperty('zw-3d-buildings', 'visibility', z >= 14 ? 'visible' : 'none')
})
```

### 4. ZONING FILTER

Dropdown in layer controls:
```typescript
const ZONING_FILTERS = [
  { value: 'all', label: 'All Zones' },
  { value: 'RU', label: 'Residential (RU)' },
  { value: 'BU', label: 'Business (BU)' },
  { value: 'PUD', label: 'Planned Unit (PUD)' },
  { value: 'AU', label: 'Agriculture (AU)' },
  { value: 'IU', label: 'Industrial (IU)' },
  { value: 'TU', label: 'Tourist (TU)' },
]
```

When a filter is selected, query BCPAO Zoning MapServer with a `where` clause on the ZONING field and render only matching polygons as a vector layer (separate from the raster tiles).

### 5. CONVERSION FUNNEL (Free → Paid)

**Free tier** (no login):
- Choropleth heatmap (all ZIPs)
- 5 parcel clicks/day
- 3 chat messages/day
- Basic zoning overlay

**Pro tier** ($29/mo):
- Unlimited parcel clicks
- Unlimited chat
- Zoning filters
- Export CSV/PDF
- Auction calendar integration
- Historical trends
- Comparable sales

**Gate behavior**:
```
After 5 parcel clicks → modal: "Unlock unlimited parcel intelligence — Start Free Trial"
After 3 chat messages → modal: "Continue the conversation — Upgrade to Pro"
```

The choropleth heatmap is the LEAD MAGNET — always free, always visible. It hooks users visually (like Reventure). Parcel-level detail is the CONVERSION trigger.

### 6. MOBILE BOTTOM SHEET

Use `@gorhom/bottom-sheet` pattern (CSS-only implementation):
- Default: collapsed (shows search bar + layer pills)
- Swipe up: shows chat + parcel detail
- Full screen: shows full chat history

### 7. SEARCH CAPABILITIES

The search bar and chat support:
- **Address**: "798 Ocean Dr Satellite Beach" → geocode → fly to → identify parcel
- **City**: "Cocoa Beach" → fly to city bounds
- **ZIP**: "32937" → fly to ZIP, show choropleth highlight
- **Zoning**: "RU-1-11" → filter zoning layer
- **Parcel ID**: "27 3701-50-4-12" → direct BCPAO lookup
- **Auction**: "foreclosures this month" → query Supabase auction table
- **Natural language**: "Where are the cheapest homes in Brevard?" → AI + choropleth

---

## DATA PIPELINE

### Zillow ETL (GitHub Action, weekly)

```yaml
# .github/workflows/zillow-etl.yml
name: Zillow Data ETL
on:
  schedule:
    - cron: '0 6 * * 1'  # Monday 6AM UTC
  workflow_dispatch:
jobs:
  etl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node scripts/fetch-zillow.js
      - run: node scripts/process-choropleth.js
      # Output: public/data/brevard-zillow.json (ZIP → latest metrics)
```

### Static Data Files

```
public/data/
  ├── brevard-zillow.json        ← Zillow metrics by ZIP (updated weekly)
  ├── brevard-zip-boundaries.json ← GeoJSON ZIP boundaries (static)
  └── brevard-cities.json        ← City boundaries (static)
```

---

## EXISTING CODE TO REUSE

| Source | File | Use In |
|--------|------|--------|
| zonewise-web | `components/ChatWidget.tsx` | ExplorerChat.tsx base |
| zonewise-web | `lib/ai/claude.ts` | Chat API handler |
| zonewise-web | `components/SplitScreenPreview.tsx` | Layout pattern |
| zonewise-web | `components/explorer/BrevardExplorer.tsx` | Map setup, BCPAO tiles |
| zonewise-web | `lib/explorer/constants.ts` | BCPAO endpoints, types |
| biddeed-housing-map | `src/components/Map.jsx` | Choropleth pattern |
| reventure-clone-v2 | `docs/ZILLOW_DATA_SOURCES.md` | All Zillow CSV URLs |
| reventure-clone-v2 | `scripts/fetch_zillow_data.js` | ETL script base |

---

## BRAND COMPLIANCE

- Navy: #1E3A5F (primary)
- Orange: #F59E0B (accent/CTA)
- Font: Inter (already loaded)
- Background: #020617 (slate-950)
- Cards: #0F172A with #1E293B borders
- Map style: streets-v12 (colored, NOT dark)
- Popups: dark theme (already implemented)

---

## HANDOFF TO CLAUDE CODE

```bash
# Session command:
cd zonewise-web && git pull

# Priority order:
# 1. Zoom-adaptive zoning (kill purple overload) — 15 min
# 2. Choropleth heatmap with Zillow data — 2 hr
# 3. NLP chat panel (split-screen) — 2 hr
# 4. Mobile bottom sheet — 1 hr
# 5. Conversion gate (free → paid modal) — 30 min
# 6. Zoning type filter — 30 min

# Test: Open zonewise.ai/explorer on desktop AND mobile
# Verify: Choropleth at county zoom, parcels at street zoom
# Verify: Chat sends message, AI responds, map flies to location
```
