import { describe, it, expect } from 'vitest'
import * as fs from 'fs'

describe('SEC-004: SQL Injection Prevention', () => {
  const migration = fs.readFileSync('supabase/migrations/002_security_hardening.sql', 'utf-8')

  it('uses SECURITY DEFINER on RPC functions', () => {
    expect(migration).toMatch(/SECURITY DEFINER/i)
  })

  it('locks search_path on RPC functions', () => {
    expect(migration).toMatch(/SET search_path\s*=\s*public/i)
  })

  it('revokes public access on sensitive functions', () => {
    expect(migration).toMatch(/REVOKE ALL.*FROM PUBLIC/i)
  })

  it('uses parameterized function (UUID type)', () => {
    expect(migration).toMatch(/increment_query_count\(.*UUID\)/i)
  })

  it('grants execute only to authenticated and service_role', () => {
    expect(migration).toMatch(/GRANT EXECUTE.*TO authenticated/i)
    expect(migration).toMatch(/GRANT EXECUTE.*TO service_role/i)
  })

  it('checks ROW_COUNT after update (NOT FOUND protection)', () => {
    expect(migration).toMatch(/GET DIAGNOSTICS.*ROW_COUNT/i)
    expect(migration).toMatch(/RAISE EXCEPTION.*No subscription/i)
  })
})

describe('SEC-004: Migration 003 - Legacy RPC Removal', () => {
  const migration003 = fs.readFileSync('supabase/migrations/003_drop_legacy_rpc.sql', 'utf-8')

  it('drops legacy function signature', () => {
    expect(migration003).toMatch(/DROP FUNCTION IF EXISTS increment_query_count\(UUID\)/i)
  })

  it('validates caller identity with auth.uid()', () => {
    expect(migration003).toMatch(/auth\.uid\(\)\s+IS DISTINCT FROM\s+p_user_id/i)
  })

  it('raises exception on unauthorized access', () => {
    expect(migration003).toMatch(/RAISE EXCEPTION\s+'Access denied/i)
  })

  it('uses SECURITY DEFINER with locked search_path', () => {
    expect(migration003).toMatch(/SECURITY DEFINER/i)
    expect(migration003).toMatch(/SET search_path\s*=\s*public/i)
  })

  it('revokes public access and grants only to authenticated', () => {
    expect(migration003).toMatch(/REVOKE ALL.*FROM PUBLIC/i)
    expect(migration003).toMatch(/GRANT EXECUTE.*TO authenticated/i)
  })
})

describe('SEC-005: RLS Write Policies', () => {
  const migration = fs.readFileSync('supabase/migrations/002_security_hardening.sql', 'utf-8')

  it('enables RLS on zoning_districts', () => {
    expect(migration).toMatch(/ALTER TABLE zoning_districts ENABLE ROW LEVEL SECURITY/i)
  })

  it('adds INSERT policy restricted to service_role', () => {
    expect(migration).toMatch(/FOR INSERT.*WITH CHECK.*service_role/is)
  })

  it('adds UPDATE policy restricted to service_role', () => {
    expect(migration).toMatch(/FOR UPDATE.*USING.*service_role/is)
  })

  it('adds DELETE policy restricted to service_role', () => {
    expect(migration).toMatch(/FOR DELETE.*USING.*service_role/is)
  })

  it('allows public SELECT on zoning_districts', () => {
    expect(migration).toMatch(/FOR SELECT.*USING\s*\(true\)/is)
  })

  it('creates audit log table', () => {
    expect(migration).toMatch(/CREATE TABLE.*zoning_audit_log/i)
  })

  it('audit log has required columns', () => {
    expect(migration).toMatch(/table_name\s+TEXT/i)
    expect(migration).toMatch(/record_id/i)
    expect(migration).toMatch(/operation\s+TEXT/i)
    expect(migration).toMatch(/old_data\s+JSONB/i)
    expect(migration).toMatch(/new_data\s+JSONB/i)
    expect(migration).toMatch(/changed_by/i)
    expect(migration).toMatch(/changed_at/i)
  })

  it('creates audit trigger on zoning_districts', () => {
    expect(migration).toMatch(/CREATE TRIGGER.*trg_zoning_districts_audit/i)
    expect(migration).toMatch(/AFTER INSERT OR UPDATE OR DELETE/i)
  })

  it('audit log table has RLS enabled', () => {
    expect(migration).toMatch(/ALTER TABLE zoning_audit_log ENABLE ROW LEVEL SECURITY/i)
  })

  it('creates subscriptions table with RLS', () => {
    expect(migration).toMatch(/CREATE TABLE.*subscriptions/i)
    expect(migration).toMatch(/ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY/i)
  })

  it('subscriptions restricted to own user', () => {
    expect(migration).toMatch(/auth\.uid\(\)\s*=\s*user_id/i)
  })
})
