-- Migration 003: Drop legacy insecure increment_query_count and ensure only SEC-004 hardened version exists

-- Drop the old function signature (UUID parameter named session_uuid)
DROP FUNCTION IF EXISTS increment_query_count(UUID);

-- Recreate with hardened version that validates caller identity
CREATE OR REPLACE FUNCTION increment_query_count(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate the caller is the same user (prevents privilege escalation)
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot modify another user query count';
  END IF;

  UPDATE subscriptions
  SET queries_used = queries_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found for user';
  END IF;
END;
$$;

-- Lock down permissions
REVOKE ALL ON FUNCTION increment_query_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_query_count(UUID) TO authenticated;
