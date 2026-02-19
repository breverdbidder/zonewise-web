-- ZoneWise.AI — Feasibility Platform Tables
-- Migration: 20260218_add_feasibility_tables.sql
-- Issue: #23

-- Zoning data cache (API responses from Zoneomics or manual entry)
CREATE TABLE IF NOT EXISTS zoning_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  zone_code TEXT,
  zone_district TEXT,
  zone_type TEXT,
  permitted_uses JSONB DEFAULT '[]'::jsonb,
  max_height_ft NUMERIC,
  max_far NUMERIC,
  max_lot_coverage NUMERIC,
  setback_front_ft NUMERIC,
  setback_rear_ft NUMERIC,
  setback_side_ft NUMERIC,
  max_density_units_acre NUMERIC,
  parking_ratio NUMERIC,
  overlay_districts JSONB DEFAULT '[]'::jsonb,
  raw_response JSONB,
  county TEXT,
  municipality TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Parcel geometry from BCPAO / county appraiser
CREATE TABLE IF NOT EXISTS parcel_geometry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  boundary_geojson JSONB,
  lot_area_sqft NUMERIC,
  lot_area_acres NUMERIC,
  buildable_area_sqft NUMERIC,
  parcel_id TEXT,
  source TEXT DEFAULT 'bcpao',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rent comp results
CREATE TABLE IF NOT EXISTS rent_comps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_address TEXT NOT NULL,
  comp_name TEXT,
  comp_address TEXT,
  units INTEGER,
  year_built INTEGER,
  occupancy NUMERIC,
  studio_rent NUMERIC,
  one_br_rent NUMERIC,
  two_br_rent NUMERIC,
  three_br_rent NUMERIC,
  distance_miles NUMERIC,
  source TEXT DEFAULT 'manual',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved pro forma scenarios
CREATE TABLE IF NOT EXISTS proforma_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  address TEXT NOT NULL,
  scenario_name TEXT DEFAULT 'Default',
  total_units INTEGER,
  unit_mix JSONB,
  vacancy_pct NUMERIC,
  opex_pct NUMERIC,
  cap_rate NUMERIC,
  construction_psf NUMERIC,
  soft_cost_pct NUMERIC,
  -- Computed outputs (cached for fast retrieval)
  noi NUMERIC,
  stabilized_value NUMERIC,
  total_dev_cost NUMERIC,
  profit NUMERIC,
  yield_on_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_zoning_cache_address ON zoning_cache(address);
CREATE INDEX IF NOT EXISTS idx_zoning_cache_county ON zoning_cache(county);
CREATE INDEX IF NOT EXISTS idx_parcel_geometry_address ON parcel_geometry(address);
CREATE INDEX IF NOT EXISTS idx_rent_comps_subject ON rent_comps(subject_address);
CREATE INDEX IF NOT EXISTS idx_proforma_user ON proforma_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_proforma_address ON proforma_scenarios(address);

-- RLS policies
ALTER TABLE zoning_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_geometry ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_comps ENABLE ROW LEVEL SECURITY;
ALTER TABLE proforma_scenarios ENABLE ROW LEVEL SECURITY;

-- Zoning cache: readable by all authenticated users
CREATE POLICY "zoning_cache_read" ON zoning_cache
  FOR SELECT TO authenticated USING (true);

-- Parcel geometry: readable by all authenticated users
CREATE POLICY "parcel_geometry_read" ON parcel_geometry
  FOR SELECT TO authenticated USING (true);

-- Rent comps: readable by all authenticated users
CREATE POLICY "rent_comps_read" ON rent_comps
  FOR SELECT TO authenticated USING (true);

-- Pro forma: users can only see/edit their own scenarios
CREATE POLICY "proforma_read_own" ON proforma_scenarios
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "proforma_insert_own" ON proforma_scenarios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "proforma_update_own" ON proforma_scenarios
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "proforma_delete_own" ON proforma_scenarios
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
