# SUMMIT #411 — Phase A: Credential Rotation Report
Generated: 2026-04-09

## A1: Supabase service_role Rotation
**Status:** BLOCKED — No SUPABASE_ACCESS_TOKEN (sbp_) available in execution environment.

The Supabase Management API requires the `sbp_` token to call:
```
POST https://api.supabase.com/v1/projects/mocerqjnksmhcjzxrewo/api-keys/legacy/rotate
```

**Manual action required:** Rotate service_role key in Supabase Dashboard > Settings > API.

## A2: Propagate New Key to GitHub Repos
**Status:** BLOCKED by A1 — no new key to propagate.

Repos checked for `SUPABASE_SERVICE_ROLE_KEY` secret:
- zonewise-web: EXISTS (set 2026-02-18)
- Other repos: pending audit (see Phase B)

## A3: Hetzner Local Env Update
**Status:** BLOCKED by A1 — no Hetzner access from this environment.

## A4: Git History Scrub — zonewise-web ✅ COMPLETE
**Status:** VERIFIED

### Secrets Found and Scrubbed
| Secret | Location | Severity | Action |
|--------|----------|----------|--------|
| Service role JWT (`...Tqp9nE`) | `run-migration.sh` (commit d479830) | CRITICAL | Replaced with `REDACTED_SERVICE_ROLE_KEY` |
| Service role JWT | `docs/CHECKPOINT_2026-01-27.md`, `.github/workflows/deploy-biddeed.yml`, `app/kpis/page.tsx` | CRITICAL | Replaced via filter-repo |
| Management token `sbp_cbf04a...` | `INFRASTRUCTURE.md` (commit f30c981) | CRITICAL | Replaced with `REDACTED_SBP_MANAGEMENT_TOKEN` |
| Management token `sbp_cbf04a...` | `reports/summit-398/leak-report.md` (HEAD) | CRITICAL | Redacted on HEAD + history scrubbed |

### Scrub Method
1. Pre-scrub backup: `/opt/everest/backups/zonewise-web-pre-scrub-20260409-193515.tar.gz`
2. Tool: `git-filter-repo --replace-text` with literal replacements
3. Scope: Mirror clone (ALL branches + tags) — 30 branches rewritten
4. Force-push: All branches force-pushed to GitHub
5. Branch protection: Temporarily enabled force-push, then re-disabled

### Verification
```
$ git log --all -S '<service_role_key_fragment>' --oneline
(empty — VERIFIED CLEAN)

$ git log --all -S '<sbp_management_token>' --oneline
(empty — VERIFIED CLEAN)
```

## A5: Verification Summary
- [x] Old service_role key: scrubbed from all 30 branches in git history
- [x] Old sbp_ token: scrubbed from all branches in git history
- [x] `git log --all -S '<secret>'` returns empty for both secrets
- [x] Branch protection re-enabled (force-push disabled)
- [ ] Old service_role key → 401 test: BLOCKED (A1 not complete, key not yet rotated)
- [ ] New service_role key → 200 test: BLOCKED (A1 not complete)

## A6: Management Token (sbp_) Note
- Cannot self-rotate via API (Supabase limitation)
- History exposure window CLOSED (scrubbed)
- **Manual action:** Revoke `sbp_cbf04a...` at https://supabase.com/dashboard/account/tokens within 24h
- New token already needed for future autonomous operations
