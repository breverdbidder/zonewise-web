# House Brand — BidDeed.AI + ZoneWise.AI

## Colors
| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| Primary (Navy) | `#1E3A5F` | `213 54% 24%` | Headers, primary buttons, navigation |
| Accent (Orange) | `#F59E0B` | `38 92% 50%` | CTAs, highlights, interactive elements |
| Background | `#020617` | `222.2 84% 4.9%` | App background, dark surfaces |
| Foreground | `#F1F5F9` | `210 40% 96%` | Body text on dark backgrounds |
| Muted | `#1E293B` | `217.2 32.6% 17.5%` | Secondary surfaces, borders |

## Typography
| Token | Font | Fallbacks |
|-------|------|-----------|
| Sans | Inter | -apple-system, BlinkMacSystemFont, sans-serif |
| Mono | JetBrains Mono | SF Mono, Consolas, monospace |

## Radius
Default: `0.5rem`

## shadcn Semantic Mapping
- `bg-primary` → Navy #1E3A5F
- `bg-accent` → Orange #F59E0B
- `bg-background` → Slate-950 #020617
- `bg-muted` → Slate-800 #1E293B
- `text-primary-foreground` → White
- `text-muted-foreground` → Slate-400

## Rules
- NEVER use raw Tailwind colors (`bg-blue-500`, `text-amber-500`) in UI components
- ALWAYS use semantic classes (`bg-primary`, `text-accent`, `bg-background`)
- Brand hex vars (`zw-navy-*`, `zw-orange-*`) are available for edge cases
- Both BidDeed.AI and ZoneWise.AI repos MUST use identical brand tokens
