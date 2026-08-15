# META-PROMPT v3 — ZoneWise.AI Web Surface (SSOT)

**Date:** August 15, 2026
**Supersedes:** `ZONEWISE_LANDING_REDESIGN_METAPROMPT.md` (v1, Aug 10) and
`ZONEWISE_LANDING_METAPROMPT_v2.md` (v2, Aug 15). Both are folded in below —
this file is the only one that needs to be read.
**Companion code:** `scripts/audit-site.mjs` in `breverdbidder/zonewise-web`.

---

## 0. WHY v3 EXISTS

v1 set the positioning. v2 added competitive research and the operator moat.
Neither prevented the two failures that actually shipped on Aug 15:

1. A landing rebuild was verified at **1400px desktop only**. Four of seven
   `/feasibility` tabs were broken on mobile — content squeezed into 19–76px
   columns — and nobody knew until the founder opened it on a phone.
2. The dashboard shell was **not scrollable at all** on touch devices. 1,081px
   of report content sat clipped in an `overflow-hidden` box. This was
   misdiagnosed three times as a WebGL performance problem and "fixed" twice
   without ever being reproduced.

The lesson is not "test more." It is: **a claim of "verified" is only valid for
the exact viewport, route, and view that was measured.** v3 encodes that as a
gate, not a suggestion.

---

## 1. THE ONE-LINE BRIEF (from v2, unchanged)

> ZoneWise.AI is what TestFit.io and Algoma would be if they had been built by a
> developer who spent 20 years buying, entitling, and building the sites himself
> — instead of by software people selling to developers.

---

## 2. POSITIONING SSOT — NON-NEGOTIABLE

### 2.1 What ZoneWise.AI is
Nationwide **zoning intelligence and feasibility studies**, sold to **developers
and investors**. Florida (all 67 counties) is the completed MVP and the proof —
not the ceiling. The platform is built for all 50 states.

### 2.2 What must never appear on zonewise.ai
- **Foreclosure. Tax deed. Auction.** Any of the three, anywhere: hero, features,
  pricing, footer, onboarding tour copy, `<title>`, meta description, JSON-LD
  structured data, or API-driven strings. This belongs on **BidDeed.AI's** hero.
  *Standing directive since Aug 10; violated at least four separate times since,
  most recently inside the onboarding tour and the schema.org FAQ block — both
  places nobody thought to look.*
- **"Brevard County" as headline geography.** Naming it shrinks a nationwide
  platform to one county and damages fundraising conversations. **Exception:**
  Brevard is permitted inside the case-study provenance line
  (`Recorded, Brevard County Clerk`), where it is *evidence*, not positioning.
- **"10 years."** The figure is **20 years**.
- **Unverifiable hard numbers.** See §6.

### 2.3 Surfaces that carry copy and get missed
Audit all of these, not just visible page text:
`<title>` · meta description · Open Graph · JSON-LD (`SoftwareApplication`,
`Organization`, `FAQPage`) · onboarding tour steps · empty/error states ·
API response strings rendered into UI · pricing feature bullets · marquee items.

---

## 3. HARD TECHNICAL CONSTRAINTS

### 3.1 No second R3F canvas
Mounting a second `@react-three/fiber` `<Canvas>` on the landing page took
zonewise.ai **down** on Aug 15 with
`TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')`.

Root cause is **still unconfirmed.** Three hypotheses were investigated and
disproven:
- *"bun.lock is missing r3f/drei/gsap"* — true, but **`vercel.json` sets
  `installCommand: npm install --legacy-peer-deps`**, so Vercel uses
  `package-lock.json`, which has all of them at a coherent React 18 set
  (`@react-three/fiber@8.18.0`, `react-reconciler@0.27.0`, `react@18.3.1`).
  `bun.lock` is dead weight and never read at deploy.
- *"version conflict in the lockfile"* — no, versions are coherent.
- *"two canvases conflict"* — plausible but unproven; note that
  `HeroProperty3D.tsx` exists but is **never mounted**, so there is currently
  **no working WebGL canvas anywhere in production** to compare against.

Remaining lead: `--legacy-peer-deps` silences peer conflicts, and Next 16.1.6
with React 18.3.1 is an unusual pairing (Next 16 normally expects React 19).

**Rule until proven otherwise: no new `<Canvas>` reaches production without a
preview deploy that demonstrates it mounting cleanly.** `components/cinematic/
ParcelIntelligenceCanvas.tsx` and `ParcelIntelligenceSection.tsx` exist in the
repo, are **not mounted**, and do not work as written.

### 3.2 WebGL is expensive — justify every surface
Measured on `/feasibility`: one Mapbox GL context cost **~1.9s of main-thread
blocking** (software rendering; less with a GPU, still non-trivial). Non-
interactive map imagery uses `StaticMapPreview` (Mapbox Static Images API, zero
WebGL). Reserve live `MapboxMap` for views where the user actually pans/zooms.

Note the distinction that cost hours on Aug 15: **lazy-loading a map does not
defer its WebGL context.** `dynamic(() => import(...))` defers the *download*;
the context is created when the component *mounts*. If it mounts above the fold,
you have saved nothing.

### 3.3 The dashboard shell scroll contract
`app/(dashboard)/layout.tsx` is an `h-screen` app shell. Its inner wrapper **must
be `overflow-y-auto`**, not `overflow-hidden` — on mobile no child pane supplies
its own scroll, and content taller than the shell becomes unreachable. Any change
to that wrapper must be re-verified on a touch viewport.

### 3.4 Responsive layout: the fixed-width sidebar trap
**This is the bug behind the broken tabs.** `LodgingTab`, `MarketTab`,
`CompsTab`, and `CapacityTab` each use:

```jsx
<div className="flex gap-5">
  <aside className="w-[300px]">…</aside>   {/* or w-[260px] */}
  <main>…</main>
</div>
```

On a 393px viewport the sidebar claims 300px and the main column collapses to
~33px — one word per line, thousands of pixels tall. **Rule:** any `flex` row
with a fixed-width `w-[Npx]` child must carry a stacking breakpoint
(`flex-col lg:flex-row`, and `w-full lg:w-[300px]` on the sidebar).

### 3.5 Brand tokens (DESIGN.md, unchanged from v2)
```
Void (page bg)   #020617    Navy (surfaces)  #1E3A5F
Amber (accent)   #F59E0B    Success          #10B981
Text             #F8FAFC / #94A3B8 / #64748B      Border  #1E293B
Display/body     Inter (800/700/600/400, tight tracking on display)
Data             JetBrains Mono + tabular-nums — every $, SF, FAR, parcel ID
Radius           4–8px only. Pills (9999px) forbidden.
```
No gradients on buttons. No colored text for body emphasis — use weight 600.
Institutional restraint: a Bloomberg terminal that went to design school.

---

## 4. AUDIENCE — TWO ICPs, ONE PAGE (from v2)

**Developers / builders:** can I build here, how much, does it pencil.
FAR, setbacks, unit mix, yield, entitlement risk.

**Investors / capital allocators:** is this worth acquiring, what is HBU, what is
the downside. Provenance, defensibility, IC-memo durability.

The bridge — and the page's central argument — is that **Ariel is both.**

---

## 5. COMPETITIVE POSITIONING (researched Aug 15, from v2)

**TestFit.io** — Dallas, $20M Series A, 6,200+ users. *"Automate Site Plans."*
Site/Parking Solver, pro forma, CAD/Revit export, large logo wall, hard ROI
quotes. **Attack:** it optimizes the building after you have committed to the
site. It never tells you whether to buy the land.

**Algoma.co** — *"Enter an address and your complete feasibility is ready in
under 60 seconds."* 7 modules, 50-state site search, generative capacity,
renderings, ~$350/mo. Flagship proof: *"the 47 units an architect missed"*
(Everhome Living, Englewood FL, +$27.7M). **Attack:** CA-deep / FL-empty, and
the case study is a client's project — they never carried the risk.

**The wedge:** both answer *"what can I build here?"* ZoneWise answers that **and**
*"is this site worth acquiring at all?"* — with twenty years of principal-side
scar tissue encoded, plus a patent. Never name competitors on the page.

---

## 6. THE MOAT — everestcapitalusa.com

Competitors' credibility is customer logos. ZoneWise's is **the founder's own
closed book.**

Verified: Everest Capital USA, Titusville FL, statewide. 50+ years combined
development experience. **20 years** in Florida distressed assets, courthouse and
online. **Vertically integrated** — licensed FL General Contractor in-house
(Mariam Shapira, qualifier), so cost assumptions come from invoices actually
paid. Broker: Property360. Ariel holds a **14-claim provisional patent**.

**Hundreds of closed transactions.** The 13 projects displayed on
everestcapitalusa.com are **illustrative only — the tip of the iceberg.**

### Flagship case study — Lakewood (live on the landing page)
1581 & 1591 Lakewood Dr NE, Palm Bay. Two vacant lots, **$20,100** basis →
read together, the parcels supported a materially denser use → entitled to a
**16-unit** multifamily development pad → sold **$320,000**, **4 yr 3 mo**.
Parcel 28-37-22-01-5-5, recorded Brevard County Clerk.

This is the direct answer to Algoma's Englewood study, and a stronger one:
their 47 units were on a client's site; Lakewood was our capital and our risk.

Supporting (use sparingly): 1380 Elmira Ave NW — $28,800 → quiet title →
ground-up 5BR/5BA + ADU → **$483,000**. 1548 Rainsville St SE — $5,330 →
**$398,600**. 211 District St SE — $8,800 → **$387,500**.

**Framing rule:** present these as *entitlement and development* outcomes. The
acquisition method is incidental on this surface.

### Copy rules
1. **Verifiable or omit.** "Hundreds of closings" is defensible because it is
   true and unquantified. "347 closings" invites a diligence request.
2. **Precision over hype.** "All 67 Florida counties live" + "built for all 50
   states" (architecture, not coverage). Never claim nationwide *coverage*.
3. Active voice. Sentence case. No exclamation marks. No "revolutionary."
4. Mono for every number, Inter for every sentence.
5. Speak the user's vocabulary — setbacks, FAR, yield, entitlement, pro forma —
   not "data pipeline, RAG, ML model." The AI is the mechanism, not the pitch.
6. **Every listed module must be demonstrable in a live demo.** An investor who
   finds a listed feature missing does more damage than a shorter list ever would.
7. Read each line back: *could TestFit or Algoma put this exact sentence on their
   site?* If yes, rewrite it around the operator moat.

---

## 7. CURRENT PAGE ARCHITECTURE (live)

`LandingNavbar` → `HeroCinematicSection` → `StatsSection` → `FeaturesSection`
→ **`CaseStudySection`** → `AudienceSection` → `OperatorSection` →
`PricingSection` → `CTASection` → `LandingFooter`

Hero: *"Every parcel. Every zoning rule. Feasibility in one search."*
Eyebrow: *"Built by a developer with 20 years and hundreds of closings — not by a
software company."* CTA: **5 free parcel reports**.
Stats: 10.8M parcels · 67 counties · 50 states · 20 yrs.
Features: 7 zoning/feasibility modules (discovery, zoning intelligence, capacity
& massing, GIS & utilities, AI analyst, feasibility reports).

Motion is **framer-motion / CSS only**. Reusable pieces live in
`components/cinematic/`: `KineticMarquee`, `StickyCards`, `TextMaskReveal`,
`ZoomParallax`, `CurtainReveal`, `ParticleButton`, `MeshGradientBg`.
`TextScramble` was **removed from the hero** — it rendered visible garbage
characters on load, which reads as broken in a screenshot or a demo.

The onboarding tour is now **opt-in via `?tour=1`** — it previously auto-opened a
full-screen modal 800ms after load on every dashboard route, over live demos.

---

## 8. THE AUDIT GATE — MANDATORY BEFORE CLAIMING "DONE"

Run `node scripts/audit-site.mjs --shots`. It walks **every route and every
in-page tab at four viewports** (320 / 393 / 768 / 1440) and fails on:

| Check | Severity | Catches |
|---|---|---|
| horizontal overflow | BLOCKER | layout escaping viewport |
| unscrollable overflowing container | BLOCKER | the frozen-scroll bug |
| squeezed text column (<110px) | BLOCKER | fixed-width flex sidebars |
| banned positioning terms | BLOCKER | SSOT drift |
| JS / console errors | BLOCKER | crashes |
| sub-12px body text | WARN | mobile legibility |
| tap targets <44px | WARN | touch usability |

Exit code is non-zero on any blocker, so it can gate CI.

### Rules that are not optional
1. **Mobile first, at 320px.** Desktop-only verification is not verification.
2. **Every tab is a distinct view.** Skipping tabs is precisely how four broken
   tabs shipped.
3. **Reproduce before diagnosing.** Three wrong root causes on Aug 15 all came
   from theorising against files instead of reproducing the symptom. If the
   symptom cannot be reproduced, say so rather than shipping a guess.
4. **Ask which device and which page** when a user reports a problem, before
   measuring anything.
5. **Verify the string actually changed.** A `replace()` whose pattern does not
   match is a silent no-op that still produces a successful-looking commit. Assert
   the new value is present before reporting success.
6. **State the scope of any claim.** "Verified on Pixel 5 at /feasibility Summary
   tab" — never a bare "verified."

---

## 9. DEPLOYMENT

`breverdbidder/zonewise-web` → push to `main` → GitHub Actions `deploy-prod.yml`
→ Vercel (**account "Ariel Shapira's projects"**, *not* the MCP-connected
`everestcapital8` one — the MCP Vercel tools 404 on this project). Verify prod via
Supabase RPC `vercel_get_prod_deployment(project_slug)`. Build ≈ 4–5 minutes.

Push from chat via Supabase RPC `gh_push_files_handler` — note it requires
`content_base64`, not `content`.

**Preview-branch discipline is the standing instruction** (Ariel, Aug 15). The
RPCs available from chat can only write files to an **existing** branch — they
cannot create branches or tags, and cannot delete files. Someone must create the
preview branch once; until then every chat-driven change is a direct production
edit, which is how the site went down.

Known repo debris to clean up: `.github/workflows/sync-lockfile.yml` (added on a
false premise, manual-dispatch only, harmless but wrong) and the two unmounted
`ParcelIntelligenceCanvas/Section` components.

---

## 10. THE TEST

Ariel opens zonewise.ai on a **phone**, in front of Maurice and Robert Kodsi.
Within ten seconds they understand:

1. This is nationwide zoning intelligence and feasibility software.
2. It was built by someone who has done this with his own money, hundreds of times.
3. Florida is finished, and it is the proof — not the ceiling.

And every tab they touch scrolls, fits, and reads correctly.
If any of that fails, it is not done.
