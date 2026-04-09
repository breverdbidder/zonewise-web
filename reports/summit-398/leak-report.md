# SUMMIT #398 — Credential Leak Report (zonewise-web)

**Generated:** 2026-04-09
**Scanner:** Manual grep (gitleaks/trufflehog unavailable in sandbox)
**Repo:** breverdbidder/zonewise-web
**Status:** VERIFIED — credentials found in working tree and git history

---

## CRITICAL — Live Secrets in Working Tree

### 1. Supabase SERVICE_ROLE_KEY (FULL KEY)
- **File:** `run-migration.sh:3` and `run-migration.sh:7`
- **Commit introduced:** `d479830` (2026-02-17) — "feat: add API route for onboarding migration + docs"
- **Key fingerprint:** ends `...Tqp9nE`
- **Severity:** CRITICAL — service_role bypasses RLS, grants full DB access
- **Action:** CRED-ROTATE-REQUIRED — rotate key in Supabase dashboard immediately

### 2. Supabase Management Token (sbp_)
- **File:** `INFRASTRUCTURE.md:124`
- **Commit introduced:** `f30c981` (2026-03-20) — "docs: add INFRASTRUCTURE.md"
- **Token:** `sbp_****REDACTED****` (rotated 2026-04-09, SUMMIT #411)
- **Severity:** CRITICAL — management API token allows project-level operations
- **Action:** CRED-ROTATE-REQUIRED — regenerate in Supabase dashboard > Account > Access Tokens

---

## HIGH — Secrets in Git History (not in current tree)

### 3. Hetzner IP (87.99.129.125)
- **Files:** Multiple (.env.local, CLAUDE.md, workflows, docs)
- **Status:** Informational — IP is referenced as infrastructure, not a secret per se
- **Note:** ~20+ references across history. IP exposure increases attack surface.
- **Action:** Consider restricting Hetzner firewall to known IPs only

---

## INFORMATIONAL — Regex Patterns (Not Leaks)

- `security-checks.yml:34` — contains ghp_/sbp_ regex patterns for scanning (expected)
- `tests/security/secrets.test.ts:9` — contains ghp_ regex pattern for testing (expected)

---

## Fingerprints Searched

| Fingerprint | Found in Tree | Found in History |
|---|---|---|
| `ghp_*` | NO (only regex patterns) | YES (scanner regex only) |
| `sbp_*` | **YES** — INFRASTRUCTURE.md | YES |
| `Tqp9nE` (service role) | **YES** — run-migration.sh | YES |
| `ka7hRmVuhuVe` | NO | NO |
| `Everest18` | NO | NO |
| `sd_24e8` | NO | NO |
| `87.99.129.125` | YES (docs/config) | YES |

---

## Remediation Priority

1. **IMMEDIATE** — Remove `run-migration.sh` from repo (contains full service role key)
2. **IMMEDIATE** — Redact `sbp_` token from `INFRASTRUCTURE.md`
3. **IMMEDIATE** — Rotate both credentials in Supabase dashboard
4. **POST-ROTATE** — Run `git filter-repo` or BFG to scrub history (requires force-push)
5. **HARDENING** — Enable GitHub secret scanning + push protection
