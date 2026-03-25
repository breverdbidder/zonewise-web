-- ZoneWise.AI — CP5: Water Setback + Lodging Intelligence Columns
-- Migration: 20260325_add_water_setback_lodging_columns.sql

-- Add water setback columns to zone_standards (if table exists)
-- These columns store municipality-specific waterfront setback requirements
ALTER TABLE zone_standards
  ADD COLUMN IF NOT EXISTS setback_water NUMERIC,
  ADD COLUMN IF NOT EXISTS setback_waterfront_type TEXT;

-- Add lodging permitted use columns to zone_standards
ALTER TABLE zone_standards
  ADD COLUMN IF NOT EXISTS lodging_hotel TEXT DEFAULT 'not_permitted',
  ADD COLUMN IF NOT EXISTS lodging_motel TEXT DEFAULT 'not_permitted',
  ADD COLUMN IF NOT EXISTS lodging_vacation_rental TEXT DEFAULT 'not_permitted',
  ADD COLUMN IF NOT EXISTS lodging_str TEXT DEFAULT 'not_permitted',
  ADD COLUMN IF NOT EXISTS lodging_bnb TEXT DEFAULT 'not_permitted',
  ADD COLUMN IF NOT EXISTS lodging_notes TEXT;

-- Add water proximity columns to zoning_cache
ALTER TABLE zoning_cache
  ADD COLUMN IF NOT EXISTS setback_water_ft NUMERIC,
  ADD COLUMN IF NOT EXISTS waterfront_type TEXT,
  ADD COLUMN IF NOT EXISTS water_body_name TEXT;

-- Seed known Brevard County municipality water setbacks
-- Sources: Satellite Beach LDC §22-87, Melbourne LDC §40-12, Cocoa Beach §34-62
INSERT INTO zone_standards (jurisdiction_slug, zone_code, setback_water, setback_waterfront_type)
VALUES
  ('satellite-beach', 'GU',  25, 'seawall'),
  ('satellite-beach', 'R-1', 25, 'seawall'),
  ('satellite-beach', 'C-1', 30, 'seawall'),
  ('melbourne',       'R-1', 20, 'canal'),
  ('melbourne',       'R-2', 20, 'canal'),
  ('melbourne',       'C-1', 25, 'canal'),
  ('cocoa-beach',     'R-1', 25, 'ocean/river'),
  ('cocoa-beach',     'C-1', 35, 'ocean/river'),
  ('brevard-county',  'GU',  20, 'general waterway')
ON CONFLICT (jurisdiction_slug, zone_code)
DO UPDATE SET
  setback_water = EXCLUDED.setback_water,
  setback_waterfront_type = EXCLUDED.setback_waterfront_type;

-- Seed lodging permissions for common Brevard zones
UPDATE zone_standards SET
  lodging_hotel          = 'conditional',
  lodging_motel          = 'conditional',
  lodging_vacation_rental= 'not_permitted',
  lodging_str            = 'not_permitted',
  lodging_bnb            = 'conditional',
  lodging_notes          = 'Conditional use permit required. Satellite Beach Code §22-165'
WHERE jurisdiction_slug = 'satellite-beach' AND zone_code = 'GU';

UPDATE zone_standards SET
  lodging_hotel          = 'permitted',
  lodging_motel          = 'permitted',
  lodging_vacation_rental= 'permitted',
  lodging_str            = 'conditional',
  lodging_bnb            = 'permitted',
  lodging_notes          = 'STR requires annual license per Brevard County Ord. 2023-15'
WHERE jurisdiction_slug = 'cocoa-beach' AND zone_code = 'C-1';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zone_standards_water ON zone_standards(jurisdiction_slug, zone_code) WHERE setback_water IS NOT NULL;
