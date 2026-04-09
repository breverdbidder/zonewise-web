# SUMMIT #411 — RLS Gaps Report (READ-ONLY Audit)
Generated: 2026-04-09
Project: mocerqjnksmhcjzxrewo

## Summary
- **9 tables** accessible to anon role (no RLS or permissive SELECT policy)
- **0 confirmed write gaps** (all INSERT attempts returned 400, not 201)
- **Action:** DO NOT enable RLS — this is a READ-ONLY audit per issue spec

## Tables with Anon READ Access (RLS Gaps)

| Table | Anon SELECT | Anon INSERT | Severity | Notes |
|-------|-------------|-------------|----------|-------|
| county_jurisdictions | YES (0 rows) | NO (400) | LOW | Empty table |
| activities | YES (0 rows) | NO (400) | MEDIUM | Activity logs — should be auth-gated |
| daily_metrics | YES (0 rows) | NO (400) | LOW | Metrics data — read-only is acceptable |
| beta_signups | YES (0 rows) | NO (400) | MEDIUM | PII (emails) — needs RLS |
| security_events | YES | NO (400) | HIGH | Security audit trail readable by anon |
| user_profiles | YES | NO (400) | HIGH | User PII — needs RLS urgently |
| subscriptions | YES | NO (400) | HIGH | Billing data — needs RLS |
| chat_sessions | YES | NO (400) | MEDIUM | Chat history — should be user-scoped |
| chat_messages | YES | NO (400) | MEDIUM | Chat content — should be user-scoped |

## Tables with RLS Properly Enforced

| Table | Status |
|-------|--------|
| fl_counties | Protected (206 partial) |
| county_conquest_status | Protected (206 partial) |
| zoning_assignments | Protected (206 partial) |
| multi_county_auctions | Protected (206 partial) |
| insights | Protected (206 partial) |
| fl_parcels | Protected (500 — likely schema issue) |
| cma_reports | Protected (206 partial) |

## Recommendations (DO NOT IMPLEMENT — READ-ONLY AUDIT)

1. **P0 — user_profiles, subscriptions, security_events:** Enable RLS with `auth.uid()` policies
2. **P1 — chat_sessions, chat_messages:** Enable RLS scoped to `user_id = auth.uid()`
3. **P1 — beta_signups:** Enable RLS or move to a non-public schema
4. **P2 �� activities, daily_metrics:** Consider RLS or accept public read access for dashboard
5. **P2 — county_jurisdictions:** Empty table, low risk but should have RLS when populated

## Methodology
- Tested with anon key via PostgREST API
- SELECT tested via `?limit=0` with `Prefer: count=exact`
- INSERT tested via POST with dummy payload (`{"_test_rls": true}`)
- 400 response = schema validation, not RLS block (write policy may still be open)
