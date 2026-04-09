# SUMMIT #398 — Dependency Vulnerability Matrix (zonewise-web)

**Generated:** 2026-04-09
**Scanner:** npm audit
**Total:** 7 vulnerabilities (0 critical, 5 high, 1 moderate, 1 low)

---

## HIGH Severity

| Package | Severity | Advisory | Fix Available |
|---------|----------|----------|---------------|
| `@clerk/backend` 3.0.0-3.2.2 | HIGH | [GHSA-gjxx-92w9-8v8f](https://github.com/advisories/GHSA-gjxx-92w9-8v8f) — SSRF in clerkFrontendApiProxy leaks secret keys | `npm audit fix` |
| `lodash` ≤4.17.23 | HIGH | [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) — Code Injection via `_.template` | `npm audit fix` |
| `picomatch` ≤2.3.1 | HIGH | [GHSA-3v7f-55p6-f55p](https://github.com/advisories/GHSA-3v7f-55p6-f55p) — Method Injection + ReDoS | `npm audit fix` |
| `rollup` 4.0.0-4.58.0 | HIGH | [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc) — Arbitrary File Write via Path Traversal | `npm audit fix` |
| `vite` 7.0.0-7.3.1 | HIGH | [GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9) — Path Traversal + WebSocket file read | `npm audit fix` |

## MODERATE Severity

| Package | Severity | Advisory | Fix Available |
|---------|----------|----------|---------------|
| `next` 16.0.0-beta.0 - 16.1.6 | MODERATE | Multiple: CSRF bypass, HTTP smuggling, disk cache DoS | `npm audit fix --force` (breaks semver) |

## LOW Severity

| Package | Severity | Advisory | Fix Available |
|---------|----------|----------|---------------|
| `qs` 6.7.0-6.14.1 | LOW | [GHSA-w7fw-mjwx-w883](https://github.com/advisories/GHSA-w7fw-mjwx-w883) — arrayLimit bypass DoS | `npm audit fix` |

---

## Remediation

Patch-level fixes (no breaking changes):
```bash
npm audit fix
```

This resolves: @clerk/backend, lodash, picomatch, rollup, vite, qs (6 of 7).

**next** requires `npm audit fix --force` which upgrades to 16.2.3 (outside declared range). Recommend testing before applying.
