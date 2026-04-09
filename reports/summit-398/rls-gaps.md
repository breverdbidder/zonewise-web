# SUMMIT #398 — Supabase RLS Audit (zonewise-web)

**Generated:** 2026-04-09
**Project:** mocerqjnksmhcjzxrewo
**Method:** Codebase migration analysis (READ-ONLY — no prod queries)
**Status:** INFERRED from migration files. Run `SELECT * FROM zw_rls_audit()` for live verification.

---

## Tables WITH RLS Enabled (21 tables)

| Table | RLS | Policies | Notes |
|-------|-----|----------|-------|
| `beta_signups` | YES | 2 | |
| `buy_zone_alerts` | YES | 2 | |
| `chat_feedback` | YES | 0 | **RLS on but no policies — blocks all access** |
| `chat_messages` | YES | 3 | |
| `chat_sessions` | YES | 5 | |
| `cma_reports` | YES | 0 | **RLS on but no policies — blocks all access** |
| `fl_parcels` | YES | 2 | public read + service_role write |
| `onboarding_events` | YES | 2 | |
| `parcel_geometry` | YES | 1 | |
| `price_events` | YES | 2 | |
| `proforma_scenarios` | YES | 4 | |
| `rent_comps` | YES | 1 | |
| `subscriptions` | YES | 4 | |
| `user_dashboards` | YES | 2 | |
| `user_memory` | YES | 2 | |
| `user_preferences` | YES | 2 | |
| `zoning_audit_log` | YES | 2 | |
| `zoning_cache` | YES | 1 | |
| `zoning_districts` | YES | 5 | |
| `zw_sec_events` | YES | 0 | service_role only (intentional) |
| `zw_sec_findings` | YES | 0 | service_role only (intentional) |

## Tables WITHOUT RLS (Gaps)

| Table | RLS | Risk | Recommendation |
|-------|-----|------|----------------|
| `audit_zoning_accuracy` | **NO** | MEDIUM | Enable RLS + add `service_role` write policy |

## Tables Referenced in Issue but NOT in DB

| Table | Status | Notes |
|-------|--------|-------|
| `zw_parcels` | Does not exist | Alias for `fl_parcels` in docs |
| `eg14_*` | Does not exist | No tables with this prefix |
| `nexus_*` | Does not exist | Lives in everest-nexus repo |
| `sentinel_runs` | Not migrated | Referenced in INFRASTRUCTURE.md only |
| `honesty_violations` | Not migrated | Schema in HONESTY-PROTOCOL.md only |
| `daily_action_plans` | Does not exist | |

## Tables with RLS but No Policies (Potential Issues)

These tables have RLS enabled but zero policies, meaning all non-service_role access is blocked:

1. **`chat_feedback`** — If users should be able to insert feedback, needs INSERT policy
2. **`cma_reports`** — If users should read their reports, needs SELECT policy for `auth.uid()`

`zw_sec_events` and `zw_sec_findings` are intentionally service_role-only (security tables).

---

## Recommended Policies

```sql
-- 1. audit_zoning_accuracy: Enable RLS
ALTER TABLE audit_zoning_accuracy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON audit_zoning_accuracy
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_read" ON audit_zoning_accuracy
  FOR SELECT TO anon, authenticated USING (true);

-- 2. chat_feedback: Add user insert policy
CREATE POLICY "users_insert_feedback" ON chat_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

-- 3. cma_reports: Add user read policy
CREATE POLICY "users_read_own_reports" ON cma_reports
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
```

---

## Verification

Run the live audit function (created in SUMMIT #272 D3):
```sql
SELECT * FROM zw_rls_audit();
```
This returns all public tables missing RLS or policies.
