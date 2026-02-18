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
