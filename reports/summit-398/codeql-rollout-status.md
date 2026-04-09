# SUMMIT #398 — CodeQL + Dependabot Rollout Status (zonewise-web)

**Generated:** 2026-04-09

---

## CodeQL

| Item | Status |
|------|--------|
| Workflow file | `.github/workflows/codeql.yml` — ADDED |
| Language | `javascript-typescript` |
| Schedule | Weekly Monday 6am UTC + on push/PR to main |
| Query suite | `security-and-quality` |
| Permissions | `security-events: write`, `contents: read` |

**Note:** CodeQL requires GitHub Advanced Security (free for public repos, paid for private). If this repo is private, verify the org has GHAS enabled.

## Dependabot

| Item | Status |
|------|--------|
| Config file | `.github/dependabot.yml` — ALREADY EXISTS |
| npm updates | Daily, grouped by security-critical + dev |
| GitHub Actions updates | Weekly |
| Labels | `dependencies`, `security`, `ci` |
| Reviewer | `breverdbidder` |
| Semver guard | next major updates ignored |

**Verdict:** Dependabot config is solid. No changes needed.

## Secret Scanning

| Item | Status | Action |
|------|--------|--------|
| GitHub secret scanning | Needs verification | Enable in repo Settings → Code security |
| Push protection | Needs verification | Enable alongside secret scanning |

## Pre-existing Security Workflow

`.github/workflows/security-checks.yml` already runs:
- `npm audit` on push/PR
- Secret pattern scanning (ghp_, sk-, sbp_, JWT patterns)
- Test suite execution

**Recommendation:** Keep both `security-checks.yml` (fast, custom) and `codeql.yml` (deep, GitHub-native). They complement each other.
