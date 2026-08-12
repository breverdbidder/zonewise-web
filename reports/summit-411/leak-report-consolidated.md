# SUMMIT #411 — Consolidated Leak Report (6 repos)
Generated: 2026-04-09 (Phase B1 — full re-audit)

## Summary
- **6 repos audited** — all cloned and fully scanned (history + HEAD)
- **4 CRITICAL findings** (hardcoded secrets on HEAD or in history)
- **3 MEDIUM findings** (partial key references, token in report file)
- **2 LOW findings** (Mapbox token fragment — acceptable per CLAUDE.md)
- **Multiple INFO** (regex patterns in tests/CI, RLS policy docs — expected)

## Findings by Repo

### cli-anything-biddeed

| Pattern | Found In | Severity | Location |
|---------|----------|----------|----------|
| `Tqp9nE` (full service_role JWT) | **HEAD** | **CRITICAL** | `.github/workflows/apply-summit-verifications-migration.yml:37` — full `eyJhbGciOi...Tqp9nE` hardcoded in workflow file |
| `sbp_<REDACTED>...` (full mgmt token) | **HEAD** | **CRITICAL** | `docs/ZONEWISE_INFRASTRUCTURE.md:124` — full Supabase management token in docs |
| `Tqp9nE` (fragment refs) | HEAD | MEDIUM | `envelope/CLAUDE.md`, `envelope/dev-intel-dispatch/CLAUDE.md`, `docs/ZONEWISE_INFRASTRUCTURE.md`, multiple plan docs — "ends ...Tqp9nE" |
| `ghp_<REDACTED>` (partial PAT) | HEAD | MEDIUM | `youtube/transcripts/...10-cli-tools-claude-code.md:30`, `docs/CODER-ADOPTION.md:140` — partial PAT4 reference |
| `Everest18` | history | LOW | 3 commits (n8n setup workflows, now disabled) |
| `service_role` | HEAD | INFO | Multiple workflow files — RLS policy references (expected) |

### zonewise-web (this repo)

| Pattern | Found In | Severity | Location |
|---------|----------|----------|----------|
| `sbp_<REDACTED>` (full token) | **HEAD** | **CRITICAL** | `reports/summit-411/phase-a-rotation-report.md:47` — full management token in git search command example |
| `Tqp9nE` (full JWT) | history | **CRITICAL** | Commits d479830, a00b746, af5bebd etc. — full service_role JWT in `run-migration.sh` (removed from HEAD) |
| `Tqp9nE` (fragment refs) | HEAD | MEDIUM | `.dev-intel-dispatch/CLAUDE.md`, `.claude/tasks/sprint7-completion.md`, `INFRASTRUCTURE.md` — fragment references |
| `sbp_` | history | HIGH | Multiple commits had full management token pre-redaction |
| `ka7hRmVuhuVe`, `Everest18`, `sd_24e8` | history | INFO | SUMMIT #398 security scan references only |

### zonewise-desktop

| Pattern | Found In | Severity | Location |
|---------|----------|----------|----------|
| `Tqp9nE` (full service_role JWT) | history only | **HIGH** | Commits 24283d0, 38079db — full JWT hardcoded as `SUPABASE_KEY` in `artifacts/zonewise-map.html`. Removed from HEAD. |
| `ghp_`, `sbp_` | HEAD | FALSE POSITIVE | `security-checks.yml`, `secrets.test.ts` — regex patterns for secret scanning only |
| `service_role` | HEAD | INFO | `CREDENTIAL_ROTATION_CHECKLIST.md`, checkpoint docs — placeholder `[service_role_key]` |

### everest-nexus

| Pattern | Found In | Severity | Location |
|---------|----------|----------|----------|
| `service_role` | HEAD | INFO | `docs/EVEREST-NEXUS-PLAN.md:64` — RLS policy docs ("anon SELECT, service_role ALL") |
| All others | — | **CLEAN** | No secrets in history or HEAD |

### hermes-agent

| Pattern | Found In | Severity | Location |
|---------|----------|----------|----------|
| `ghp_` | HEAD + history | INFO | 19 commits — all documentation examples, `.env.example` placeholders, security skill references. No real tokens. |
| All others | — | **CLEAN** | No secrets in history or HEAD |

### everest-vault

| Pattern | Found In | Severity | Location |
|---------|----------|----------|----------|
| `service_role` | history | INFO | 1 commit (2416bbd) — mempalace hooks reference, contextual only |
| All others | — | **CLEAN** | No secrets in history or HEAD |

### dify-zonewise

| Pattern | Found In | Severity | Location |
|---------|----------|----------|----------|
| `ghp_` | history | INFO | 3 commits — all placeholder values (`ghp_<REDACTED>`) in MCP config templates |
| All others | — | **CLEAN** | No secrets in history or HEAD |

## Critical Findings Detail

### CRITICAL-1: Full Service Role JWT on HEAD (cli-anything-biddeed)
- **File:** `.github/workflows/apply-summit-verifications-migration.yml:37`
- **What:** Complete `eyJ<REDACTED_JWT>` hardcoded
- **Risk:** Anyone with repo read access has full service_role access to Supabase project `mocerqjnksmhcjzxrewo`
- **Fix:** Replace with `${{ secrets.SUPABASE_SERVICE_KEY }}`, rotate key

### CRITICAL-2: Full Supabase Management Token on HEAD (cli-anything-biddeed)
- **File:** `docs/ZONEWISE_INFRASTRUCTURE.md:124`
- **What:** `sbp_<REDACTED>` — full management API token
- **Risk:** Full management API access (create/delete projects, manage billing)
- **Fix:** Redact from file, revoke at https://supabase.com/dashboard/account/tokens

### CRITICAL-3: Full sbp_ Token in Report (zonewise-web)
- **File:** `reports/summit-411/phase-a-rotation-report.md:47`
- **What:** Full management token included in git search command example
- **Risk:** Token exposed to anyone with repo read access
- **Fix:** Redact from report file

### CRITICAL-4: Service Role JWT in Git History (zonewise-desktop + zonewise-web)
- **Repos:** zonewise-desktop (commits 24283d0, 38079db), zonewise-web (commit d479830 etc.)
- **What:** Full JWT was hardcoded in source files, now removed from HEAD
- **Risk:** Recoverable from git history by anyone who clones
- **Fix:** Key rotation is the only complete mitigation (BFG scrub optional after rotation)

## Recommendations

### Immediate (within 24h)
1. **ROTATE the Supabase service_role key** — exposed in plaintext across 3 repos. This single action neutralizes CRITICAL-1, CRITICAL-4, and all history-based exposures.
2. **REVOKE `sbp_<REDACTED>` management token** at Supabase dashboard — exposed on HEAD in 2 repos.
3. **Replace hardcoded JWT** in `cli-anything-biddeed/.github/workflows/apply-summit-verifications-migration.yml` with `${{ secrets.SUPABASE_SERVICE_KEY }}`.
4. **Redact full sbp_ token** from `zonewise-web/reports/summit-411/phase-a-rotation-report.md` line 47.
5. **Redact full sbp_ token** from `cli-anything-biddeed/docs/ZONEWISE_INFRASTRUCTURE.md` line 124.

### Short-term (within 1 week)
6. **Audit all GHA workflows** in cli-anything-biddeed for hardcoded credentials — use GitHub Secrets exclusively.
7. **Run BFG Repo-Cleaner** on all 3 affected repos if desired (optional if keys are rotated).
8. **Redact partial PAT reference** (`ghp_<REDACTED>`) from cli-anything-biddeed docs.

### Ongoing
9. **Deploy pre-commit secret scanning** to all 6 repos — cli-anything-biddeed has `pre-bash-commit-quality.js` but it clearly didn't catch the workflow file.
10. **Enable GitHub Secret Scanning** org-wide for `breverdbidder`.
11. **Policy:** Never put real tokens in reports, docs, or CLAUDE.md — use `REDACTED` or `$ENV_VAR` references.

## Methodology
- Cloned each repo via `git clone` with PAT authentication
- History search: `git log --all -S 'PATTERN' --oneline` for each fingerprint
- HEAD search: `grep -rn 'PATTERN'` across `.ts`, `.js`, `.sh`, `.md`, `.yml`, `.yaml`, `.env*`, `.json`, `.html`
- Patterns: `ghp_`, `sbp_`, `Tqp9nE`, `ka7hRmVuhuVe`, `Everest18`, `sd_24e8`, `service_role`
- All cloned repos cleaned up after audit (`rm -rf /tmp/audit-*`)
