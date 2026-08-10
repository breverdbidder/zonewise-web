# ZONEWISE.AI — SINGLE SOURCE OF TRUTH

> **This file is the authoritative infrastructure map for ZoneWise.AI.**
> Last updated: 2026-03-20
> Updated by: Claude AI Architect
> Deployed to: zonewise-web, zonewise (monorepo), biddeed-brain

---

## 1. DOMAIN & HOSTING

| Domain | Provider | Project | Notes |
|--------|----------|---------|-------|
| **zonewise.ai** | Vercel Pro | `zonewise-web` (prj_EaXgEO6WDoSpCeLhuCemtbPr6e8E) | PRIMARY — all traffic |
| **www.zonewise.ai** | Vercel Pro | `zonewise-web` (prj_EaXgEO6WDoSpCeLhuCemtbPr6e8E) | Redirects to zonewise.ai |
| **zonewise.app** | Vercel | `zonewise-desktop` | Desktop app viewer |

### Vercel Account
- **Team:** team_UEds2qBzyD9e7rOrX8aakj9K (ariel-shapira-s-projects)
- **Plan:** Pro ($20/mo)
- **Token secret:** `VERCEL_TOKEN` in GitHub repo secrets

### CRITICAL: Vercel Project IDs
| Project Name | Project ID | Has Custom Domain? | Status |
|---|---|---|---|
| **zonewise-web** | `prj_EaXgEO6WDoSpCeLhuCemtbPr6e8E` | ✅ zonewise.ai + www | **ACTIVE — THIS IS PRODUCTION** |
| zonewise-ai | `prj_B478bSAAf0yLnY3owbhN7a1W7mQs` | ❌ only .vercel.app | **DEPRECATED — DO NOT USE** |

> ⚠️ **NEVER deploy to or promote from `zonewise-ai` (prj_B478bSAAf...).** It has no custom domain. All deploys go through `zonewise-web` only.

---

## 2. GITHUB REPOSITORIES

### Active Repos (use these)

| Repo | Purpose | Deploys To | Status |
|------|---------|------------|--------|
| **zonewise-web** | Next.js 16 marketing + product UI | Vercel → zonewise.ai | ✅ PRIMARY |
| **zonewise-scraper-v4** | ZoneWise V4 scraper (Firecrawl→Gemini→Claude) | Modal.com / Hetzner | ✅ ACTIVE |
| **zonewise-agents** | NLP backend (FastAPI + LangGraph) | Render → zonewise-agents.onrender.com | ✅ ACTIVE |
| **zonewise-modal** | 67-county scraper (AgentQL + Playwright) | Modal.com serverless | ✅ ACTIVE |
| **zonewise-desktop** | CraftAgents desktop app viewer | Vercel → zonewise.app | ✅ ACTIVE |
| **zonewise** | Monorepo — scripts, migrations, pipeline | N/A (reference) | ✅ ACTIVE |
| **zonewise-gtm** | Go-to-market strategy docs | N/A (docs only) | ✅ ACTIVE |

### Deprecated Repos (DO NOT USE)

| Repo | Reason | Replacement |
|------|--------|-------------|
| zonewise-skills | Replaced by zonewise-lobster | zonewise-desktop |
| zonewise-lobster | Moltbot experiment, abandoned | zonewise-desktop |
| zonewise-rebrand-mission | One-time rebrand task, completed | zonewise-web |
| zonewise-traycer-specs | Spec generation, completed | zonewise-web/docs |
| zonewise-agent-teams | Agent Teams experiment | cli-anything-biddeed |
| zonewise-marketing-plan | Static doc, superseded | zonewise-gtm |
| zonewise-landing | One-off AI landing page | zonewise-web |
| zonewise-loans | Loan app experiment | Paused |

---

## 3. DEPLOYMENT PIPELINE

**Corrected 2026-08-10 (issue #18573) — the diagram below was wrong for 4+ months
and nobody noticed because the actual mechanism kept working anyway.**

### How code reaches zonewise.ai (CANONICAL — verified 2026-08-10)

```
Developer pushes to breverdbidder/zonewise-web (main branch)
    ↓
Vercel GitHub App Integration auto-builds ("source": "git" in Vercel API)
    ↓
Push is to the Production Branch (main) → deployment target = production
    ↓
zonewise.ai LIVE  (typically READY within 1-10 min of the push)
```

This is **Vercel's native git integration**, configured at the Vercel project
level (Project → Git), not a GitHub Actions workflow. It requires no CI step
at all — it is triggered directly by the GitHub webhook Vercel's GitHub App
receives on every push, independent of what's enabled/disabled in
`.github/workflows/`.

**`deploy-prod.yml` was disabled (`disabled_manually`) on 2026-04-09 and
stayed disabled for 4+ months (rediscovered via issue #18573).** Verified via
the Vercel deployments API cross-referenced against `git log` on main
(2026-04-09 → 2026-08-10): every commit landing on main in that window has a
matching Vercel deployment with `"source":"git"` and, for the final commit of
each push burst, `"target":"production"` + `"state":"READY"`. There is no gap
where a commit reached main and never deployed. Confirmed live for the
issue-#18568 floor-plan commit `4ffeb6a`: Vercel's native integration deployed
it to production at `2026-08-10T16:45:06Z`, seven minutes *before* that
issue's manual `verify-and-deploy.yml` dispatch (`16:52:51Z`) — the manual
dispatch was a no-op re-deploy of an already-live commit, not the thing that
made it live.

**Conclusion: `deploy-prod.yml` was redundant, not broken.** When it was
active, every push produced *two* production deployments of the same commit —
Vercel's own `git`-source build (fast, always wins the race) followed minutes
later by `deploy-prod.yml`'s `cli`-source `vercel deploy --prebuilt --prod`
re-deploying the identical commit. Disabling it on 2026-04-09 removed a
duplicate build, not the deploy path. It has been left disabled. Do not
re-enable it — it would resume racing the native integration for no benefit.
If you need a manual/emergency re-deploy path, use `promote-now.yml` or
`verify-and-deploy.yml` (both `workflow_dispatch`-only, unaffected by this).

### Authorized Workflows (keep these)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **(Vercel native git integration)** | push to main | **CANONICAL** — builds + deploys to production automatically. Configured in Vercel project settings, not a `.github/workflows/*.yml` file. |
| **promote-now.yml** | manual only | Emergency: promote latest READY to production |
| **verify-and-deploy.yml** | manual only | Verify domain + force a redeploy + smoke test /explorer, /pricing |
| **ci.yml** | push | Lint + type check |
| **security-checks.yml** | push | Security scan |
| **webhook_notify.yml** | push + manual | Telegram notifications |

### Workflows intentionally disabled (do not re-enable)

| Workflow | Disabled | Reason |
|----------|----------|--------|
| **deploy-prod.yml** | 2026-04-09 | Redundant with Vercel's native git integration — see above |

### Workflows to DELETE (stale/one-off)

```
add-domain-to-vite.yml          ← one-off domain fix
check-deploy.yml                ← diagnostic, done
check-vercel-deploy.yml         ← diagnostic, done
claude-code-explorer-v2.yml     ← one-off Claude Code dispatch
deploy-biddeed.yml              ← BidDeed Cloudflare, wrong repo
deploy-explorer-now.yml         ← one-off explorer deploy
deploy-explorer.yml             ← superseded by deploy-prod
deploy-loans.yml                ← loans experiment, paused
deploy-michael.yml              ← Michael app, wrong repo
deploy-migration.yml            ← one-off migration
deploy-onboarding.yml           ← one-off onboarding
deploy.yml                      ← old deploy, superseded
fix-vercel-framework.yml        ← one-off fix
fix-vercel-project.yml          ← one-off fix
install-skills.yml              ← skills experiment
plan-enforcement-agent.yml      ← experiment
react-doctor.yml                ← one-off diagnostic
sync-gateway-secrets.yml        ← gateway sync, move to cli-anything
upstream-health.yml             ← health check, move to cli-anything
vercel-diag.yml                 ← diagnostic, done
```

---

## 4. SUPABASE

| Setting | Value |
|---------|-------|
| **Project Ref** | mocerqjnksmhcjzxrewo |
| **URL** | https://mocerqjnksmhcjzxrewo.supabase.co |
| **Plan** | Pro (paid) |
| **Anon Key** | ends in ...klKQDw |
| **Service Role** | ends in ...Tqp9nE |
| **Management Token** | ROTATED — see Supabase dashboard (leaked in commit f30c981, rotated 2026-04-09) |

### Key Tables

| Table | Rows | Purpose |
|-------|------|---------|
| sample_properties | 351K+ | Brevard parcels with zoning |
| zoning_assignments | 262K+ | Parcel→zone mappings |
| zoning_districts | 265+ | District definitions with DIMS |
| ims_permits | 16K+ | Palm Bay building permits |
| historical_auctions | 1,393 | Foreclosure auction history |
| activities | — | User activity tracking |
| daily_metrics | — | Platform metrics |
| insights | — | AI insights + YouTube transcripts |
| beta_signups | — | Beta waitlist |
| sentinel_runs | — | Everest Sentinel health checks |

---

## 5. EXTERNAL SERVICES

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| **Clerk** (v7) | Auth (signup/login) | Vercel env vars |
| **Mapbox** | Map tiles + geocoding | Token: pk.eyJ1...4RPrkTf84GL1-clmhmCnTw |
| **Stripe** | Payments | Vercel env vars (STRIPE_*) |
| **Anthropic** | AI chat backend | Vercel env var (ANTHROPIC_API_KEY) |
| **Supadata** | YouTube transcript API | Key: sd_3c7a57546da7893f9ae3056a664d5dc9 |
| **Render** | zonewise-agents backend | Auto-deploy from zonewise-agents repo |
| **Modal.com** | Serverless scraping | zonewise-modal repo |
| **Hetzner** | Persistent compute (87.99.129.125) | SSH via GHA secrets |

---

## 6. RULES

1. **ONE Vercel project:** `prj_EaXgEO6WDoSpCeLhuCemtbPr6e8E` (zonewise-web). Never touch zonewise-ai project.
2. **ONE deploy mechanism:** Vercel's native git integration. Runs on every push to main. No manual deploys needed. `deploy-prod.yml` is intentionally disabled (redundant) — see Section 3.
3. **ONE Supabase project:** mocerqjnksmhcjzxrewo. All tables here. No second project.
4. **ONE source repo for the website:** breverdbidder/zonewise-web. Period.
5. **Deprecated repos stay read-only.** Never push to them. Never deploy from them.
6. **This file is updated whenever infrastructure changes.** If it's not in this file, it doesn't exist.

---

## 7. QUICK REFERENCE

```bash
# Deploy to production (automatic on every push to main):
# Vercel native git integration — no GitHub Actions step required or involved.
# deploy-prod.yml is disabled on purpose (redundant); do not re-enable.

# Emergency promote (if deploy-prod fails):
# GitHub Actions → promote-now.yml → promotes latest READY to production

# Check live site:
curl -sI https://zonewise.ai | grep 'x-vercel-id'

# Vercel project dashboard:
# https://vercel.com/ariel-shapira-s-projects/zonewise-web

# Supabase dashboard:
# https://supabase.com/dashboard/project/mocerqjnksmhcjzxrewo
```
