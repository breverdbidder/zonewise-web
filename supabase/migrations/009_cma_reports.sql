-- Migration: 009_cma_reports.sql
-- Creates the cma_reports table for CMA Analyst agent output
-- Run via: deploy-migration.yml workflow with migration_file=009_cma_reports.sql

CREATE TABLE IF NOT EXISTS cma_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parcel_id TEXT NOT NULL,
  hbu_scenarios JSONB NOT NULL,  -- array of HBUScenario objects from cma_analyst.js
  best_use TEXT,
  best_score INTEGER,
  max_bid_amount NUMERIC,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parcel_id)
);

-- Index for fast parcel lookup
CREATE INDEX IF NOT EXISTS idx_cma_reports_parcel_id ON cma_reports(parcel_id);

-- Comment
COMMENT ON TABLE cma_reports IS 'CMA Analyst agent output — HBU scenarios and max bid for processed parcels';
