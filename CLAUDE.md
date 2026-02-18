# CLAUDE.md — ZoneWise Web

Context for Claude Code when working in `breverdbidder/zonewise-web`.

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

# 2. Tests
bun test

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

## Escalation Protocol

1. Try to solve autonomously (3 attempts minimum)
2. If still blocked, log to Supabase `insights` table
3. Only then surface to Ariel: "BLOCKED: [issue]. Tried: [x]. Recommend: [y]. Approve?"
