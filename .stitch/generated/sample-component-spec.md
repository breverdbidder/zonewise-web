# Sample Component Spec: ParcelCard

## Purpose
Display key information for a single Florida parcel in the Explorer panel.

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| parcelId | string | yes | FL GIO parcel ID |
| address | string | yes | Street address |
| zoning | string | yes | Zoning code (e.g., R1, C2) |
| acreage | number | no | Lot size in acres |
| owner | string | no | Owner name from tax records |
| onClick | () => void | no | Called when card is selected |

## Visual Spec
- Container: bg-slate-800 border border-slate-700 rounded-xl p-4
- Zoning badge: bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full
- Address: text-white font-medium text-sm
- Meta info: text-slate-400 text-xs
- Hover: border-orange-500/50 transition

## States
- Default: border-slate-700
- Hover: border-orange-500/50
- Selected: border-orange-500 bg-slate-700
- Loading: skeleton shimmer (bg-slate-700 animate-pulse)

## Accessibility
- role="button" with tabIndex={0}
- aria-label="{address} - {zoning} zone"
- onKeyDown: Enter/Space to select
