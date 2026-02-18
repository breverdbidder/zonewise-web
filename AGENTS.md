# AGENTS.md — ZoneWise Web

This file defines the working protocol for AI coding agents in `zonewise-web`.  
**Scope:** entire repository.

## Project Identity

ZoneWise Web is the marketing site and product UI for ZoneWise.AI.  
**Stack:** Next.js 14, Tailwind CSS, Supabase, Stripe, Claude API, Mapbox GL  
**Live:** https://zonewise.ai

## Rules for Agents

### ✅ DO
- Use TypeScript strict mode — no `any` types
- Run `bun run build` before considering any frontend change done
- Use Supabase client from `lib/supabase/` — never import directly
- Gate all `/api/` routes with Supabase auth middleware
- Test with `bun test` (Vitest) before committing
- Keep Mapbox token in Vercel environment variables only

### ❌ NEVER
- Commit `.env`, `.env.production`, `.env.local` — use Vercel env panel
- Expose `SUPABASE_SERVICE_ROLE_KEY` to the browser (use `NEXT_PUBLIC_` prefix only for public values)
- Hardcode pricing values — they live in Stripe dashboard + `lib/stripe/plans.ts`
- Push to `main` without passing CI

## High-Risk Surfaces

| Path | Risk | Why |
|------|------|-----|
| `app/api/chat/` | Critical | Proxies Claude API — prompt injection surface |
| `app/api/stripe/` | Critical | Payment webhook — signature verification required |
| `lib/supabase/server.ts` | High | Server-side auth — changes affect all protected routes |
| `middleware.ts` | High | Auth gate for dashboard — misconfiguration = data leak |

## Testing

```bash
bun test                    # unit tests (Vitest)
bun run build               # build check
bun run lint                # ESLint
```

## Commit Convention

```
feat: add parcel boundary overlay to map
fix: stripe webhook signature validation on cold start
chore: update next.js to 14.x
docs: update README with new pricing tiers
```

---

## react-doctor — MANDATORY Quality Gate

**This is non-negotiable. Every Claude Code session that modifies React/Next.js code MUST run this before committing.**

### Step 1: Run the scan
```bash
npx react-doctor . --verbose
```

### Step 2: Check the score
- Score went **up or stayed same** → proceed to commit
- Score went **down** → fix the regressions before committing. Do not push a lower score.
- First run ever → save the score as baseline (see Step 4)

### Step 3: Install the skill (first time only)
```bash
npx skills add millionco/react-doctor
```
This installs 47+ React best-practice rules into the agent context so they apply automatically on every session.

### Step 4: Save/update the baseline
After each session, update `react-doctor-baseline.json` in repo root:
```json
{
  "score": <current_score>,
  "date": "<YYYY-MM-DD>",
  "session": "<brief description of what changed>"
}
```

### What react-doctor checks
- Security: XSS vectors, unsafe dangerouslySetInnerHTML, missing input sanitization
- Performance: unnecessary re-renders, missing memo/callback, large bundle imports
- Correctness: hook rule violations, missing deps in useEffect, key prop issues
- Architecture: prop drilling depth, component size, dead code

### Rules
- A react-doctor score drop is a **merge blocker** — same weight as a failing test
- `react-doctor-baseline.json` must be committed alongside any score change
- If react-doctor is not installed: `npm install -g react-doctor` then re-run
