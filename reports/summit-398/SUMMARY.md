# SUMMIT #398 — Security Hardening Summary (zonewise-web)

**Date:** 2026-04-09 | **Trigger:** Post-Mythos threat assessment

## Findings

1. **CRITICAL — 2 live credentials in working tree** (FIXED)
   - Supabase SERVICE_ROLE_KEY in `run-migration.sh` → removed, uses env var now
   - Supabase management token (sbp_) in `INFRASTRUCTURE.md` → redacted
   - Both need rotation in Supabase dashboard — CRED-ROTATE-REQUIRED

2. **7 dependency vulnerabilities** (6 FIXED, 1 remaining)
   - `npm audit fix` resolved: @clerk/backend, lodash, picomatch, rollup, vite, qs
   - Remaining: `next` moderate (CSRF + smuggling) — needs semver-breaking upgrade

3. **RLS coverage: 21/22 tables secured** (1 gap)
   - `audit_zoning_accuracy` missing RLS
   - `chat_feedback` and `cma_reports` have RLS but no user policies

4. **CodeQL added** — weekly + on push/PR, javascript-typescript
5. **Dependabot already configured** — daily npm + weekly GHA

## Actions Required (Human)

- [ ] Rotate Supabase service role key in dashboard
- [ ] Rotate Supabase management token (sbp_)
- [ ] Enable GitHub secret scanning + push protection
- [ ] Consider `git filter-repo` to scrub history
- [ ] Upgrade `next` to 16.2.3 after testing
- [ ] Apply RLS policies from rls-gaps.md

## Deliverables

- `reports/summit-398/leak-report.md` — credential exposure audit
- `reports/summit-398/rls-gaps.md` — Supabase RLS gap analysis
- `reports/summit-398/vuln-matrix.md` — dependency vulnerability matrix
- `reports/summit-398/codeql-rollout-status.md` — CodeQL + Dependabot status
- `reports/summit-398/SUMMARY.md` — this file
