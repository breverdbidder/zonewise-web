-- ZoneWise.AI — CMA Analyst Agent Output Table
-- Migration: 009_cma_reports.sql
-- Created: 2026-03-19
-- Source: Envelope Squad → CMA Analyst agent (cma_analyst.js)
-- Stores server-computed HBU scenarios for parcels processed by the squad.
-- Client-side hbu-engine.ts is the fallback for unprocessed parcels.

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

-- Index for fast parcel_id lookups
CREATE INDEX IF NOT EXISTS idx_cma_reports_parcel_id ON cma_reports(parcel_id);
CREATE INDEX IF NOT EXISTS idx_cma_reports_computed_at ON cma_reports(computed_at DESC);

-- RLS: authenticated users read, service role writes
ALTER TABLE cma_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cma_reports_read_authenticated" ON cma_reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cma_reports_read_anon" ON cma_reports
  FOR SELECT TO anon USING (true);

CREATE POLICY "cma_reports_insert_service" ON cma_reports
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "cma_reports_update_service" ON cma_reports
  FOR UPDATE TO service_role USING (true);
