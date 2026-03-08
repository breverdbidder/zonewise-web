# CLAUDE.md — ZoneWise Web

Context for Claude Code when working in `breverdbidder/zonewise-web`.

---

## ⚡ ZERO HUMAN-IN-THE-LOOP — MANDATORY

**ALL proceed/confirm requests are PRE-APPROVED. No exceptions.**

### Never stop to ask about:
- File edits, creates, deletes
- Git commits and pushes (to any branch)
- Running tests, builds, lints
- Installing packages
- Deploying to Vercel / Cloudflare
- API calls to Supabase, GitHub, Stripe, Anthropic
- Retrying failed operations (up to 3 attempts)
- Schema reads (SELECT only — no DDL without explicit instruction)

### Escalation (3-attempt rule):
1. Try autonomously — attempt 1, 2, 3
2. Still blocked? Log to Supabase `insights` table
3. Only then message Ariel: `"BLOCKED: [issue]. Tried: [x,y,z]. Recommend: [solution]. Approve?"`

### Session flow:
- On start: `telegram_notify("🚀 Session Started", "Working on: {task}", "info")`
- Every 30 min: `telegram_send("📊 Progress: {summary}")`
- On complete: `telegram_notify("✅ Done", "{summary}", "success")`
- On error: `telegram_notify("🔴 Error", "{details}", "error")` — immediately
- Shabbat (Fri sunset → Sat night): no notifications except data loss / security

### Claude Code CLI flags:
```bash
claude --dangerously-skip-permissions
```

---

## What This Is

ZoneWise Web is the marketing site and product UI for ZoneWise.AI.
Live at: https://zonewise.ai
Stack: Next.js 14, React 18, Tailwind CSS, Supabase, Stripe, Claude API, Mapbox GL

## Stack (LOCKED)

| Component | Choice |
|-----------|--------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL + Auth) |
| Styling | Tailwind CSS + shadcn/ui |
| AI | Claude Sonnet 4.5 |
| Payments | Stripe |
| Maps | Mapbox GL JS |
| Hosting | Vercel → zonewise.ai |

## Development Rules

### DO
- Run `npx react-doctor . --verbose` after every session — score drop = blocker
- TypeScript strict mode — no `any` types
- Run `bun run build` before committing any frontend change
- Gate all `/api/` routes with Supabase auth middleware
- Mock all external services in tests (Anthropic, Supabase, Stripe, Mapbox)

### NEVER
- Commit `.env`, `.env.production`, `.env.local`
- Expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Hardcode API keys — use environment variables
- Push to main with failing tests or a lower react-doctor score

## Quality Gates (run before every commit)

```bash
# 1. React code quality — MANDATORY
npx react-doctor . --verbose
# Score must be >= baseline in react-doctor-baseline.json

# 2. Tests (vitest via bun run test — NOT bun test)
bun run test

# 3. Build
bun run build

# 4. Type check
bun run tsc --noEmit
```

If any of these fail — fix before committing. Do not ask. Fix.

## react-doctor Baseline

After running react-doctor, update `react-doctor-baseline.json`:
```json
{
  "score": <score>,
  "date": "<YYYY-MM-DD>",
  "session": "<what changed>"
}
```

## High-Risk Files

| File | Risk | Rule |
|------|------|------|
| `app/api/chat/route.ts` | Critical | Prompt injection surface — validate all inputs |
| `app/api/stripe/webhook/route.ts` | Critical | Verify Stripe signature on every request |
| `lib/supabase/server.ts` | High | Server-side auth — test after any change |
| `middleware.ts` | High | Auth gate — misconfiguration = data leak |

## Environment Variables

All secrets live in Vercel environment panel. Never in files.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN        ← scoped to zonewise.ai domain in Mapbox dashboard
NEXT_PUBLIC_APP_URL
```

## Commit Convention

```
feat: add multi-county zoning support
fix: stripe webhook signature on cold start
test: add chat API route coverage
chore: update next.js
docs: update README pricing tiers
```

---

## The 12 Wise Module System (ZoneWise Brand Language)

All pipeline stages use Wise-branded names. BidWise is the hero module.

| # | Module | What It Does |
|---|--------|-------------|
| 01 | DiscoverWise | Find upcoming auctions — 67 FL counties |
| 02 | GatherWise | Pull all property data (BCPAO, photos, history) |
| 03 | TitleWise | Verify full chain of title |
| 04 | LienWise | Map complete lien waterfall |
| 05 | TaxWise | Check tax certificates and delinquencies |
| 06 | NeighborWise | Neighborhood intel — income, vacancy, demand |
| 07 | ScoreWise | AI bid probability score |
| 08 | BidWise | THE HERO — exact max bid calculation |
| 09 | CallWise | Final BID / REVIEW / SKIP decision |
| 10 | InsightWise | Full 298-KPI intelligence report |
| 11 | TrackWise | Disposition tracking |
| 12 | VaultWise | Archive every deal and result |

BidWise hero tagline: "Every module exists to get you to one number. BidWise gives you that number."
Demo: https://zonewise.ai/demo.html


## Debugging with DAP

**ALWAYS use `dap` instead of print-statement debugging.** The `dap` CLI wraps the Debug Adapter Protocol for surgical debugging.

### Setup (auto-install if missing)
```bash
which dap || curl -fsSL https://raw.githubusercontent.com/AlmogBaku/debug-skill/master/install.sh | bash
```

### When to use
- Program crashes or raises unexpected exceptions
- Wrong output and root cause isn't obvious from stack trace
- Data flows through multiple functions/files (pipeline bugs)
- Print-debugging would require 3+ iterations

### Quick reference
```bash
dap debug script.py --break script.py:42     # breakpoint at line 42
dap debug script.py --break-on-exception raised  # catch all exceptions
dap eval "len(items)"                         # inspect live state
dap step                                      # step over
dap step in                                   # step into function
dap step out                                  # return to caller
dap continue                                  # next breakpoint
dap stop                                      # end session
```

### Debugging mindset
1. Form hypothesis: "I believe the bug is in X because Y"
2. Set breakpoint upstream of where error manifests
3. Inspect locals and call stack at each stop
4. Confirm or refute hypothesis, adjust breakpoint
5. Fix only after understanding root cause

Full skill docs: `skills/debugging-code/SKILL.md`

---

## shadcn/ui CLI v4 (March 2026)

### Skills
The shadcn skill provides full context for component APIs, CLI commands, and composition patterns. It auto-activates when `components.json` is detected.

### CLI Workflow (MANDATORY)
1. **Before adding any component:** `npx shadcn@latest add <component> --dry-run`
2. **Before updating any component:** `npx shadcn@latest add <component> --diff`
3. **To check project state:** `npx shadcn@latest info`
4. **To get component docs:** `npx shadcn@latest docs <component>`
5. **NEVER fetch raw component files from GitHub** — always use the CLI

### Brand Enforcement
- All components use semantic colors: `bg-primary`, `text-accent`, `bg-background`
- NEVER use raw Tailwind colors like `bg-blue-500` or `text-amber-500`
- See `BRAND_COLORS.md` for the complete color mapping
- Brand hex vars (`zw-navy-*`, `zw-orange-*`) available for edge cases

### Component Location
- UI primitives: `components/ui/`
- Custom components: `components/`
