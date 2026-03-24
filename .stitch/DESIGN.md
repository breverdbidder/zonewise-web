# ZoneWise Design System

> Auto-extracted from globals.css + tailwind.config.ts + component audit
> Last updated: March 24, 2026

## Brand Identity
- **Product:** ZoneWise.AI — Florida parcel & zoning intelligence
- **Tagline:** "Know every parcel. Win every deal."

## Color Tokens

### Primary Palette
| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Navy | #1E3A5F | zw-navy / zw-navy-600 | Primary brand, headers, CTAs |
| Orange | #F59E0B | zw-orange / zw-orange-400 | CTAs, highlights, active states |
| Dark | #020617 | slate-950 | Page background, dark surfaces |

### Extended Palette (from globals.css)

#### Navy Scale (--navy-*)
| Token | Hex | Usage |
|-------|-----|-------|
| --navy-50 | #E8F4FD | Lightest tint, hover overlays |
| --navy-100 | #C5DFEF | Light backgrounds |
| --navy-200 | #9DC6E0 | Borders on light bg |
| --navy-300 | #7099C0 | Subtle text |
| --navy-400 | #4A6F9A | `prose strong`, gradient text, status indicator |
| --navy-500 | #2A4F7A | Status-online dot, medium surfaces |
| --navy-600 | #1E3A5F | **Primary brand color**, selection background |
| --navy-700 | #162D4A | Pressed/active state |
| --navy-800 | #0F2035 | Deep surfaces |
| --navy-900 | #07111C | Near-black navy |

#### Orange Scale (--orange-*)
| Token | Hex | Usage |
|-------|-----|-------|
| --orange-50 | #FEF3C7 | Orange tint backgrounds |
| --orange-100 | #FDE68A | Light badge backgrounds |
| --orange-200 | #FCD34D | Subtle highlights |
| --orange-300 | #FBBF24 | Warning states |
| --orange-400 | #F59E0B | **Primary accent**, focus rings, CTAs |
| --orange-500 | #D97706 | Hover state for orange CTAs |
| --orange-600 | #B45309 | Pressed orange |

#### Slate Scale (--slate-*)
| Token | Hex | Usage |
|-------|-----|-------|
| --slate-400 | #94a3b8 | Nav links, meta text, muted labels |
| --slate-500 | #64748b | Placeholder text |
| --slate-600 | #475569 | Secondary borders |
| --slate-700 | #334155 | Scrollbar thumb, card dividers, map ctrl hover |
| --slate-800 | #1e293b | Card/input backgrounds, skeleton base |
| --slate-900 | #0f172a | Scrollbar track, nav background |
| --slate-950 | #020617 | Page background (--background) |

#### shadcn Semantic Tokens (HSL — used via hsl(var(--token)))
| Token | HSL Value | Resolved Color | Usage |
|-------|-----------|----------------|-------|
| --background | 222.2 84% 4.9% | ~#020617 | Body background |
| --foreground | 210 40% 96% | ~#f1f5f9 | Default text |
| --card | 222.2 47.4% 11.2% | ~#131f30 | Card surface |
| --primary | 213 54% 24% | ~#1E3A5F | Primary button bg |
| --accent | 38 92% 50% | ~#F59E0B | Accent / orange |
| --muted | 217.2 32.6% 17.5% | ~#1e293b | Muted surfaces |
| --muted-foreground | 215 20.2% 65.1% | ~#94a3b8 | Muted text |
| --border | 217.2 32.6% 17.5% | ~#1e293b | Default border |
| --destructive | 0 62.8% 30.6% | ~#7f1d1d | Error states |
| --ring | 213 54% 34% | ~#2a4f7a | Focus ring (shadcn) |
| --radius | 0.5rem | 8px | Base border radius |

#### Chart Colors
| Token | Usage |
|-------|-------|
| --chart-1 | Navy (primary data) |
| --chart-2 | Orange (secondary data) |
| --chart-3 | Green (positive/success) |
| --chart-4 | Blue (informational) |
| --chart-5 | Purple (additional series) |

## Typography
- **Font Family:** Inter (Google Fonts, weights 300–900) — body, UI
- **Mono Font:** JetBrains Mono (weights 400–600) — code, pre, .font-mono
- **Scale:**
  - Heading 1: text-4xl / text-5xl font-bold tracking-tight (letter-spacing: -0.02em)
  - Heading 2: text-3xl font-semibold
  - Heading 3: text-xl font-semibold
  - Body: text-base / text-sm
  - Caption: text-xs text-slate-400
  - Nav links: text-sm #94A3B8

## Spacing
- Base unit: 4px (Tailwind default)
- Common patterns: p-4, p-6, p-8, gap-4, gap-6
- Card padding: p-4 (compact) / p-6 (standard)
- Section padding: py-16 px-4
- Nav height: 64px (h-16)
- Nav horizontal padding: px-6 (24px)
- Max content width: max-w-[1280px] mx-auto

## Border Radius
- Base `--radius`: 0.5rem (8px)
- Cards: rounded-xl (12px)
- Buttons: rounded-lg (8px via --radius)
- Inputs: rounded-md (6px via calc(--radius - 2px))
- Small elements: rounded-sm (4px via calc(--radius - 4px))
- Badges/dots: rounded-full
- Map controls: border-radius 8px

## Animations
| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| fadeIn | 0.3s | ease-out | General reveal |
| slideUp | 0.3s | ease-out | Chat messages, modals |
| slideIn | 0.3s | ease-out | Sidebar panels |
| skeleton | 1.5s | ease-in-out infinite | Loading states |
| accordion-down/up | 0.2s | ease-out | Radix accordion |
| bounce | custom | — | Micro-interactions |
| button hover | 0.15s | ease | All buttons (global) |
| card-hover lift | 0.2s | ease | .card-hover: translateY(-2px) |

## Utility Classes
| Class | Definition |
|-------|-----------|
| .glass | rgba(15,23,42,0.8) + backdrop-blur(12px) |
| .gradient-text | linear-gradient(135deg, navy-400→navy-600), bg-clip text |
| .card-hover | transition 0.2s + hover: translateY(-2px) + shadow navy 25% |
| .skeleton | shimmer gradient slate-800→slate-700→slate-800, 200% bg-size |
| .prose | slate-300 text, 1.7 line-height, structured typography |

## Component Patterns

### Button
```
Primary:   bg-primary text-primary-foreground shadow hover:bg-primary/90
           h-9 px-4 py-2 rounded-md text-sm font-medium
           (Large: h-10 px-8 rounded-md)

Brand CTA: bg-[#F59E0B] text-[#020617] px-[18px] py-2 rounded-lg font-semibold text-sm
           (Navbar Get Started pattern)

Destructive: bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90
Outline:     border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground
Ghost:       hover:bg-accent hover:text-accent-foreground
Link:        text-primary underline-offset-4 hover:underline
Icon:        h-9 w-9 (square)
```

### Card
```
bg-slate-800 border border-slate-700 rounded-xl p-6
Hover variant: .card-hover — translateY(-2px) + box-shadow
```

### Input
```
bg-slate-800 border border-slate-600 text-white rounded-md px-4 py-2
Placeholder: color var(--slate-500)
Focus ring:  outline 2px solid #F59E0B, outline-offset 2px (*:focus-visible global)
```

### Badge / Zoning Tag
```
bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full font-medium
```

### Navbar
```
Background:    #0F172A (slate-900)
Border-bottom: 1px solid #1E293B (slate-800)
Height:        64px, sticky top-0, z-index 50
Logo mark:     32x32 bg-[#1E3A5F] rounded-[8px] + 8x8 orange dot (top-right)
Nav links:     #94A3B8 text-sm, no underline
CTA button:    bg-[#F59E0B] text-[#020617] px-[18px] py-2 rounded-lg font-semibold
```

### Skeleton Loading
```
.skeleton class: shimmer gradient slate-800→slate-700, 1.5s infinite
Inline: bg-slate-700 animate-pulse (Tailwind animate-pulse)
```

### Map Controls (Mapbox)
```
bg-slate-800 border border-slate-700 rounded-[8px]
Buttons: transparent bg, hover: slate-700
Icons: filter: invert(1)
```

### Scrollbar
```
Width: 8px | Track: slate-900 | Thumb: slate-700 rounded | Hover: slate-600
```

### Glass Panel
```
.glass: rgba(15,23,42,0.8) backdrop-blur(12px) -webkit-backdrop-filter(12px)
```

## Responsive Breakpoints
| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile | < 768px | session-sidebar: fixed, slides in from left |
| Tablet | < 1024px | artifact-panel: fixed, slides in from right |
| Desktop | 1024px+ | Both panels inline |

## Accessibility
- Focus ring: 2px solid #F59E0B, outline-offset 2px (global *:focus-visible)
- Selection: bg navy-600 / white text
- Light mode override: .bg-white / .bg-slate-50 surfaces get slate-800 text (prevents invisible text)
- Reduced motion: opacity/transform animations suppressed via prefers-reduced-motion
- Hydration safety: force-visible keyframe after 4s if JS fails

## Deprecated
- **@_davideast/stitch-mcp** — DEPRECATED as of March 24, 2026. Package was abandoned upstream.
  Original refs lived in docs/plans/DESIGNWISE-SPEC.md, DESIGNWISE-TODO.md, DESIGNWISE-FIRE.md.
  Those files moved to docs/legacy/ on March 24, 2026.
  Replacement: google-labs-code/stitch-skills (Apache-2.0, official Agent Skills standard).
  See: docs/legacy/DESIGNWISE-SPEC.md for archived spec with full @_davideast MCP config.
