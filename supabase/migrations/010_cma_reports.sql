-- Migration: 010_cma_reports.sql
-- Creates cma_reports table for CMA Analyst agent output
-- Deliverable 3: Connect CMA Analyst agent

CREATE TABLE IF NOT EXISTS cma_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_id TEXT NOT NULL,
  hbu_scenarios JSONB NOT NULL,  -- array of HBUScenario objects
  best_use TEXT,
  best_score INTEGER,
  max_bid_amount NUMERIC,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parcel_id)
);

-- Enable RLS
ALTER TABLE cma_reports ENABLE ROW LEVEL SECURITY;

-- Anon can read
CREATE POLICY "cma_reports_anon_read"
  ON cma_reports FOR SELECT
  TO anon
  USING (true);

-- Service role can write
CREATE POLICY "cma_reports_service_write"
  ON cma_reports FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast parcel lookups
CREATE INDEX IF NOT EXISTS idx_cma_reports_parcel_id ON cma_reports(parcel_id);
CREATE INDEX IF NOT EXISTS idx_cma_reports_computed_at ON cma_reports(computed_at DESC);
