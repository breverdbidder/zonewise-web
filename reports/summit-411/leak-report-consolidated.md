# SUMMIT #411 — Consolidated Leak Report (6 repos)
Generated: 2026-04-09

## Summary
- **6 repos targeted, 5 fully audited** (hermes-agent: disk constraints during scan)
- **HIGH findings: 3** (service_role key fragments in history across 2 repos)
- **MEDIUM findings: 2** (sbp_ references in CLAUDE.md/docs, not actual tokens)
- **LOW/FALSE POSITIVE: 8** (regex patterns in test files, doc references)

## Findings by Repo

### cli-anything-biddeed
| Pattern | Found In | Severity | Location | Notes |
|---------|----------|----------|----------|-------|
| `Tqp9nE` (service_role) | History | **HIGH** | 10 commits (e.g. 7a11db0e, 811905bd, fcdff068) | Service role key fragment in migration scripts, INFRASTRUCTURE.md, deploy scripts |
| `sbp_` | History | MEDIUM | 8 commits | References in CLAUDE.md plugin config, migration workflows — likely config docs not actual tokens |
| `ghp_` | History | LOW | 4 commits (96f58612, 959b06e5) | Pre-commit hooks, test patterns — likely regex not actual PATs |
| `Everest18` | History | LOW | 3 commits (79040ef6) | n8n setup workflow — Mapbox token fragment, public token |
| `service_role` | History | INFO | 16+ commits | References in migration/workflow files — contextual, not token values |

### everest-nexus
| Pattern | Found In | Severity | Location | Notes |
|---------|----------|----------|----------|-------|
| `service_role` | HEAD + History | INFO | docs/EVEREST-NEXUS-PLAN.md | RLS policy documentation only — "anon SELECT, service_role ALL" |
| All others | — | CLEAN | — | No secret fingerprints found |

### hermes-agent
| Pattern | Found In | Severity | Location | Notes |
|---------|----------|----------|----------|-------|
| — | — | INCOMPLETE | — | Disk full during scan. Repo cloned (126MB) but history search not completed |

### everest-vault
| Pattern | Found In | Severity | Location | Notes |
|---------|----------|----------|----------|-------|
| `service_role` | History | INFO | 1 commit (2416bbd) | mempalace hooks reference — contextual |
| All others | — | CLEAN | — | No secret fingerprints found |

### dify-zonewise
| Pattern | Found In | Severity | Location | Notes |
|---------|----------|----------|----------|-------|
| `ghp_` | History | LOW | 3 commits | MCP config migration commits — likely regex patterns |
| All others | — | CLEAN | — | No secret fingerprints on HEAD or in history |

### zonewise-desktop
| Pattern | Found In | Severity | Location | Notes |
|---------|----------|----------|----------|-------|
| `Tqp9nE` (service_role) | History | **HIGH** | 2 commits (24283d0, 38079db) | Real service_role key in Supabase integration code |
| `ghp_` | HEAD | FALSE POSITIVE | security-checks.yml, secrets.test.ts | Regex patterns for secret scanning — not actual tokens |
| `sbp_` | HEAD | FALSE POSITIVE | security-checks.yml, secrets.test.ts | Regex patterns for secret scanning — not actual tokens |
| `service_role` | HEAD | INFO | CREDENTIAL_ROTATION_CHECKLIST.md, checkpoint docs | Documentation references, placeholder `[service_role_key]` |

## Action Items

### P0 — Requires History Scrub
1. **cli-anything-biddeed**: Run `git filter-repo --replace-text` for `Tqp9nE` service_role JWT (10 commits)
2. **zonewise-desktop**: Run `git filter-repo --replace-text` for `Tqp9nE` service_role JWT (2 commits)

### P1 — Requires Manual Scan
3. **hermes-agent**: Re-run full audit when disk space available

### P2 — Monitor Only
4. **cli-anything-biddeed**: `sbp_` references appear to be config documentation, not actual tokens — verify manually
5. **dify-zonewise**: `ghp_` references in MCP config — verify these are patterns not real PATs

## Methodology
- Clone each repo via `git clone`
- `git log --all -S 'PATTERN' --oneline` for history search
- `grep -rn 'PATTERN'` on HEAD for current file scan
- Patterns tested: `ghp_`, `sbp_`, `Tqp9nE`, `ka7hRmVuhuVe`, `Everest18`, `sd_24e8`, `service_role`
