-- ============================================================================
-- ZoneWise.AI Security Hardening Migration
-- Fixes: SEC-004 (SQL injection), SEC-005 (missing RLS write policies)
-- ============================================================================

-- ==========================================================================
-- SEC-004: Fix increment_query_count — parameterized SECURITY DEFINER
-- ==========================================================================

-- Drop the old insecure function
DROP FUNCTION IF EXISTS increment_query_count(UUID);

-- Recreate with SECURITY DEFINER, search_path lock, and NOT FOUND check
CREATE OR REPLACE FUNCTION increment_query_count(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found BOOLEAN;
BEGIN
  UPDATE subscriptions
  SET queries_used = COALESCE(queries_used, 0) + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  GET DIAGNOSTICS v_found = ROW_COUNT;

  IF NOT v_found OR v_found IS NULL THEN
    RAISE EXCEPTION 'No subscription found for user %', p_user_id;
  END IF;
END;
$$;

-- Add queries_used column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'queries_used'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN queries_used INTEGER DEFAULT 0;
  END IF;
END;
$$;

-- Restrict who can call this function
REVOKE ALL ON FUNCTION increment_query_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_query_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_query_count(UUID) TO service_role;

-- ==========================================================================
-- SEC-005: Add RLS write policies on zoning_districts
-- ==========================================================================

-- Enable RLS if not already enabled
ALTER TABLE zoning_districts ENABLE ROW LEVEL SECURITY;

-- Drop existing write policies if any (idempotent)
DROP POLICY IF EXISTS "Service role can insert zoning districts" ON zoning_districts;
DROP POLICY IF EXISTS "Service role can update zoning districts" ON zoning_districts;
DROP POLICY IF EXISTS "Service role can delete zoning districts" ON zoning_districts;

-- Only service_role can write to zoning_districts
CREATE POLICY "Service role can insert zoning districts" ON zoning_districts
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update zoning districts" ON zoning_districts
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete zoning districts" ON zoning_districts
  FOR DELETE USING (auth.role() = 'service_role');

-- ==========================================================================
-- SEC-005: Audit log for zoning district changes
-- ==========================================================================

CREATE TABLE IF NOT EXISTS zoning_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT DEFAULT current_setting('request.jwt.claims', true)::json->>'sub',
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log (service_role only)
ALTER TABLE zoning_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access audit log" ON zoning_audit_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view audit log" ON zoning_audit_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger function for audit logging
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

-- Attach trigger to zoning_districts
DROP TRIGGER IF EXISTS trg_zoning_districts_audit ON zoning_districts;
CREATE TRIGGER trg_zoning_districts_audit
  AFTER INSERT OR UPDATE OR DELETE ON zoning_districts
  FOR EACH ROW EXECUTE FUNCTION log_zoning_changes();

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_zoning_audit_log_changed_at ON zoning_audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_zoning_audit_log_table_name ON zoning_audit_log(table_name);
