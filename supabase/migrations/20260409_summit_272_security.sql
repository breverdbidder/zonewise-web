-- SUMMIT #272 D3: Security tables + RLS audit function
-- Additive only — no DROP, no destructive changes

-- ============================================================
-- zw_sec_events: CSP violations, auth anomalies, rate limit abuse
-- ============================================================
CREATE TABLE IF NOT EXISTS public.zw_sec_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  event_type    text NOT NULL,
  severity      text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source        text NOT NULL,
  payload       jsonb DEFAULT '{}',
  user_agent    text,
  ip_hash       text,
  resolved      boolean NOT NULL DEFAULT false
);

ALTER TABLE public.zw_sec_events ENABLE ROW LEVEL SECURITY;

-- service_role full access; anon/authenticated: no access
CREATE POLICY "zw_sec_events_service_role_all"
  ON public.zw_sec_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for querying by type/severity
CREATE INDEX IF NOT EXISTS idx_zw_sec_events_type_severity
  ON public.zw_sec_events (event_type, severity, created_at DESC);

-- ============================================================
-- zw_sec_findings: scanner results (semgrep, gitleaks, trivy, claude, mythos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.zw_sec_findings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovered    timestamptz NOT NULL DEFAULT now(),
  source        text NOT NULL CHECK (source IN ('semgrep', 'gitleaks', 'trivy', 'claude', 'mythos')),
  severity      text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  repo          text NOT NULL,
  file_path     text,
  line_start    integer,
  line_end      integer,
  rule_id       text,
  title         text NOT NULL,
  description   text,
  remediation   text,
  status        text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'triaged', 'fixed', 'accepted_risk', 'false_positive')),
  fixed_at      timestamptz,
  fixed_commit  text
);

ALTER TABLE public.zw_sec_findings ENABLE ROW LEVEL SECURITY;

-- service_role only
CREATE POLICY "zw_sec_findings_service_role_all"
  ON public.zw_sec_findings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_zw_sec_findings_status_severity
  ON public.zw_sec_findings (status, severity, discovered DESC);

CREATE INDEX IF NOT EXISTS idx_zw_sec_findings_repo
  ON public.zw_sec_findings (repo, status);

-- ============================================================
-- zw_rls_audit(): returns public tables missing RLS or policies
-- EG14 #16 passes when this returns 0 rows
-- ============================================================
CREATE OR REPLACE FUNCTION public.zw_rls_audit()
RETURNS TABLE (table_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT c.relname::text AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'  -- ordinary tables only
    AND c.relname NOT LIKE 'pg_%'
    AND c.relname NOT LIKE '_prisma_%'
    AND (
      -- RLS not enabled
      NOT c.relrowsecurity
      OR
      -- RLS enabled but no policies defined
      NOT EXISTS (
        SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.zw_rls_audit() TO service_role;
