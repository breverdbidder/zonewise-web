# SUMMIT #411 — CodeQL + Dependabot Rollout Status
Generated: 2026-04-09

| Repo | CodeQL | Dependabot | Secret Scanning | Push Protection | PR |
|------|--------|------------|-----------------|-----------------|-----|
| cli-anything-biddeed | Added (JS/TS+Python) | Added (npm+pip+actions) | Enabled | Enabled | [#414](https://github.com/breverdbidder/cli-anything-biddeed/pull/414) |
| everest-nexus | Added (JS/TS+Python) | Added (npm+pip+actions) | Enabled | Enabled | [#3](https://github.com/breverdbidder/everest-nexus/pull/3) |
| hermes-agent | Added (JS/TS+Python) | Added (pip+actions) | Enabled | Enabled | [#1](https://github.com/breverdbidder/hermes-agent/pull/1) |
| everest-vault | Added (Python) | Added (pip+actions) | N/A (private, no GHAS) | N/A (private, no GHAS) | [#2](https://github.com/breverdbidder/everest-vault/pull/2) |
| dify-zonewise | Added (JS/TS+Python) | Existed | Enabled | Enabled | [#1](https://github.com/breverdbidder/dify-zonewise/pull/1) |
| zonewise-desktop | Added (JS/TS+Python) | Existed | Enabled | Enabled | [#7](https://github.com/breverdbidder/zonewise-desktop/pull/7) |
| zonewise-web | Existed | Existed | Enabled | Enabled | N/A (already configured) |

## Notes
- **everest-vault** is a private repo without GitHub Advanced Security — secret scanning and push protection are not available on free/team plans for private repos.
- **zonewise-web** already had both CodeQL and Dependabot configured — no changes needed.
- **dify-zonewise** and **zonewise-desktop** already had Dependabot — only CodeQL was added.
- All CodeQL workflows include language-appropriate matrix: Python repos get `python` in the matrix, JS/TS repos get `javascript-typescript`.
- All Dependabot configs include `github-actions` ecosystem monitoring.
- Branch used: `security/codeql-dependabot-411` across all repos.
