---
pattern: "src/components/**"
---
# ZoneWise Component Rules

- HOUSE BRAND: Navy #1E3A5F, Orange #F59E0B, Inter font, bg #020617
- Source of truth: globals.css + BRAND_COLORS.md
- Mapbox token: pk.eyJ1...4RPrkTf84GL1-clmhmCnTw (everest18). NOT URL-restricted
- Map components: always set initial viewport to Florida center (28.5, -81.5)
- Conquest dashboard lives at zonewise.ai/conquest — never move this route
- Tailwind core utilities only. No compiler-dependent classes
- Loading states: skeleton shimmer matching navy/slate palette
