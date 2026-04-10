-- CI Dossier Protocol v1.2 — Additional Tables
-- SUMMIT #444: Phase 0 Bootstrap
-- 5 new tables (5 existing tables already in production)

-- Team members / founders
CREATE TABLE IF NOT EXISTS ci_dossier_team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id uuid REFERENCES ci_dossiers(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text,
  linkedin_url text,
  patent_search_done boolean DEFAULT false,
  patent_count integer DEFAULT 0,
  patent_details jsonb,
  background_notes text,
  created_at timestamptz DEFAULT now()
);

-- Funding rounds
CREATE TABLE IF NOT EXISTS ci_dossier_funding (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id uuid REFERENCES ci_dossiers(id) ON DELETE CASCADE,
  round_type text,
  amount_usd bigint,
  date date,
  investors text[],
  source_url text,
  confidence text CHECK (confidence IN ('VERIFIED', 'INFERRED', 'UNTESTED')),
  created_at timestamptz DEFAULT now()
);

-- Regulatory filings
CREATE TABLE IF NOT EXISTS ci_dossier_regulatory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id uuid REFERENCES ci_dossiers(id) ON DELETE CASCADE,
  filing_type text,
  jurisdiction text,
  status text,
  filing_date date,
  approval_date date,
  source_url text,
  prior_art_relevance text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Change detection events
CREATE TABLE IF NOT EXISTS ci_dossier_change_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id uuid REFERENCES ci_dossiers(id) ON DELETE CASCADE,
  url text NOT NULL,
  change_type text CHECK (change_type IN ('content', 'new_page', 'removed', 'pricing', 'feature')),
  diff_summary text,
  screenshot_before text,
  screenshot_after text,
  detected_at timestamptz DEFAULT now()
);

-- Protocol checkpoints (Phase 0 bootstrap tracking)
CREATE TABLE IF NOT EXISTS ci_protocol_checkpoints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  checkpoint_id text NOT NULL UNIQUE,
  checkpoint_name text NOT NULL,
  phase integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'green', 'red', 'skipped')),
  evidence_url text,
  verified_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ci_team_dossier ON ci_dossier_team_members(dossier_id);
CREATE INDEX IF NOT EXISTS idx_ci_changes_dossier ON ci_dossier_change_events(dossier_id);
CREATE INDEX IF NOT EXISTS idx_ci_checkpoints_status ON ci_protocol_checkpoints(status);

-- RLS
ALTER TABLE ci_dossier_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_dossier_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_dossier_regulatory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_dossier_change_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_protocol_checkpoints ENABLE ROW LEVEL SECURITY;

-- Service role policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ci_team_service') THEN
    CREATE POLICY ci_team_service ON ci_dossier_team_members FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ci_funding_service') THEN
    CREATE POLICY ci_funding_service ON ci_dossier_funding FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ci_regulatory_service') THEN
    CREATE POLICY ci_regulatory_service ON ci_dossier_regulatory FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ci_changes_service') THEN
    CREATE POLICY ci_changes_service ON ci_dossier_change_events FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ci_checkpoints_service') THEN
    CREATE POLICY ci_checkpoints_service ON ci_protocol_checkpoints FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
