# SUMMIT: Explorer V2 — Restore Missing Parcel Features

## PROBLEM
ExplorerV2 stripped valuable parcel detail that was in the original BrevardExplorer:
1. Owner info (OWNER_NAME1, OWNER_NAME2, SUBDIVISION_NAME, MILLAGE_CODE, HOMESTEAD)
2. Zoning code per parcel (not shown anywhere in parcel detail)
3. Zoning legend in sidebar
4. Map popup on parcel click (popupHtml with ZoneWise + BCPAO links)

## WHAT TO RESTORE

### 1. ParcelPanel in ExplorerV2.tsx — add these after the grid:
```
- Owner block: OWNER_NAME1, OWNER_NAME2, SUBDIVISION_NAME, MILLAGE_CODE, Homestead yes/no
- Zoning block: Show parcel's zone code with colored badge using getZoningColor()
- The BCPAO link and ZoneWise.AI Analysis link are already there - keep them
```

### 2. ExplorerMap.tsx — restore map popup on parcel click
The original BrevardExplorer had a mapbox Popup with popupHtml() showing key parcel info.
Restore this popup in ExplorerMap's click handler. Use the popupHtml pattern from BrevardExplorer.tsx.

### 3. Zoning legend
Add a collapsible zoning legend panel showing zone code colors using ZONING_LABELS and getZoningColor from constants.ts

## DO NOT CHANGE
- The style switching (Streets/Satellite/Light tabs) — these now work
- The choropleth heatmap layer
- The conversion gate (5 clicks, 3 chats)
- The split-screen layout
- The mobile bottom sheet

## BRAND
Navy #1E3A5F, Orange #F59E0B, bg #020617

## AFTER
npx tsc --noEmit and npm run build must pass
