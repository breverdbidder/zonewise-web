-- ============================================================================
-- ZoneWise.AI Security Hardening Migration (DEPLOYED 2026-02-09)
-- Fixes: SEC-004 (SQL injection), SEC-005 (missing RLS write policies)
-- Executed via Supabase Management API (not workflow)
-- ============================================================================

-- ==========================================================================
-- SEC-005a: RLS Write Policies on zoning_districts
-- ==========================================================================

ALTER TABLE zoning_districts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can insert zoning districts" ON zoning_districts;
DROP POLICY IF EXISTS "Service role can update zoning districts" ON zoning_districts;
DROP POLICY IF EXISTS "Service role can delete zoning districts" ON zoning_districts;
DROP POLICY IF EXISTS "Public can read zoning districts" ON zoning_districts;

CREATE POLICY "Service role can insert zoning districts" ON zoning_districts
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update zoning districts" ON zoning_districts
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete zoning districts" ON zoning_districts
  FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Public can read zoning districts" ON zoning_districts
  FOR SELECT USING (true);

-- ==========================================================================
-- SEC-005b: Audit Log Table + Trigger
-- ==========================================================================

CREATE TABLE IF NOT EXISTS zoning_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id BIGINT,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT DEFAULT current_setting('request.jwt.claims', true)::json->>'sub',
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE zoning_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access audit log" ON zoning_audit_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view audit log" ON zoning_audit_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_zoning_audit_log_changed_at ON zoning_audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_zoning_audit_log_table_name ON zoning_audit_log(table_name);

CREATE OR REPLACE FUNCTION log_zoning_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO zoning_audit_log (table_name, record_id, operation, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO zoning_audit_log (table_name, record_id, operation, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO zoning_audit_log (table_name, record_id, operation, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_zoning_districts_audit ON zoning_districts;
CREATE TRIGGER trg_zoning_districts_audit
  AFTER INSERT OR UPDATE OR DELETE ON zoning_districts
  FOR EACH ROW EXECUTE FUNCTION log_zoning_changes();

-- ==========================================================================
-- SEC-004: Subscriptions table + Secure RPC function
-- ==========================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  query_limit INTEGER NOT NULL DEFAULT 50,
  queries_used INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

DROP FUNCTION IF EXISTS increment_query_count(UUID);

CREATE OR REPLACE FUNCTION increment_query_count(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE subscriptions
  SET queries_used = COALESCE(queries_used, 0) + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No subscription found for user %', p_user_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION increment_query_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_query_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_query_count(UUID) TO service_role;
