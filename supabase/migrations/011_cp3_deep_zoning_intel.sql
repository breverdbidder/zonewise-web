-- CP3: Deep Zoning Intel Migration
-- Date: 2026-03-25
-- Adds: municipal_code_url to zoning_assignments, compatibility views for API

-- ─── Step 1: Add municipal_code_url to zoning_assignments ────────────────────
ALTER TABLE zoning_assignments ADD COLUMN IF NOT EXISTS municipal_code_url TEXT;

-- ─── Step 2: Update municipal_code_url by jurisdiction ───────────────────────
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/satellite_beach/codes/code_of_ordinances' WHERE jurisdiction = 'satellite_beach' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/melbourne/codes/code_of_ordinances' WHERE jurisdiction = 'melbourne' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/palm_bay/codes/code_of_ordinances' WHERE jurisdiction = 'palm_bay' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/cocoa_beach/codes/code_of_ordinances' WHERE jurisdiction = 'cocoa_beach' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/brevard_county/codes/code_of_ordinances' WHERE jurisdiction = 'brevard_county' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/cocoa/codes/code_of_ordinances' WHERE jurisdiction = 'cocoa' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/titusville/codes/code_of_ordinances' WHERE jurisdiction = 'titusville' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/rockledge/codes/code_of_ordinances' WHERE jurisdiction = 'rockledge' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/west_melbourne/codes/code_of_ordinances' WHERE jurisdiction = 'west_melbourne' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/indialantic/codes/code_of_ordinances' WHERE jurisdiction = 'indialantic' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/indian_harbour_beach/codes/code_of_ordinances' WHERE jurisdiction = 'indian_harbour_beach' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/cape_canaveral/codes/code_of_ordinances' WHERE jurisdiction = 'cape_canaveral' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/malabar/codes/code_of_ordinances' WHERE jurisdiction = 'malabar' AND municipal_code_url IS NULL;
UPDATE zoning_assignments SET municipal_code_url = 'https://library.municode.com/fl/brevard_county/codes/code_of_ordinances' WHERE jurisdiction = 'merritt_island' AND municipal_code_url IS NULL;

-- ─── Step 3: Create zone_standards compatibility view ────────────────────────
-- The API queries zone_standards by zone_code but the DB uses zoning_district_id FK
CREATE OR REPLACE VIEW zone_standards_by_code AS
SELECT 
  zs.id,
  zd.code AS zone_code,
  j.name AS jurisdiction_name,
  zs.min_lot_sqft,
  zs.min_lot_width_ft,
  zs.max_height_ft,
  zs.max_stories,
  zs.front_setback_ft,
  zs.side_setback_ft,
  zs.rear_setback_ft,
  zs.corner_setback_ft,
  zs.max_lot_coverage_pct AS lot_coverage_pct,
  zs.max_impervious_pct,
  zs.max_far AS far,
  zs.max_density_du_acre AS residential_density_du_acre,
  zs.min_open_space_pct AS open_space_pct,
  zs.parking_per_unit,
  zs.parking_per_1000sf,
  zs.source_url,
  zs.scraped_at
FROM zone_standards zs
JOIN zoning_districts zd ON zs.zoning_district_id = zd.id
JOIN jurisdictions j ON zd.jurisdiction_id = j.id;

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON zone_standards_by_code TO anon, authenticated;

-- ─── Step 4: Create permitted_uses_by_code view ───────────────────────────────
-- The API queries permitted_uses by zone_code but the DB uses zoning_district_id FK
CREATE OR REPLACE VIEW permitted_uses_by_code AS
SELECT 
  pu.id,
  zd.code AS zone_code,
  j.name AS jurisdiction,
  CASE 
    WHEN pu.is_commercial THEN 'commercial'
    WHEN pu.is_industrial THEN 'industrial'
    WHEN pu.is_single_family OR pu.is_multi_family OR pu.is_adu THEN 'residential'
    WHEN pu.is_home_occupation THEN 'residential'
    ELSE COALESCE(pu.use_category, 'general')
  END AS category,
  pu.use_description AS use_name,
  CASE 
    WHEN pu.use_type = 'permitted' AND NOT pu.requires_special_permit AND NOT pu.requires_public_hearing THEN 'by_right'
    WHEN pu.use_type IN ('conditional', 'special_exception', 'special_use') 
      OR pu.requires_special_permit 
      OR pu.requires_public_hearing
      OR pu.requires_site_plan_review THEN 'conditional'
    WHEN pu.use_type = 'prohibited' THEN 'not_permitted'
    ELSE 'conditional'
  END AS permission_type,
  pu.special_conditions AS notes
FROM permitted_uses pu
JOIN zoning_districts zd ON pu.zoning_district_id = zd.id
JOIN jurisdictions j ON zd.jurisdiction_id = j.id;

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON permitted_uses_by_code TO anon, authenticated;

-- ─── Step 5: Create zoning_districts compatibility view ──────────────────────
-- The API queries zoning_districts by zone_code and expects zone_district/zone_description
CREATE OR REPLACE VIEW zoning_districts_by_code AS
SELECT 
  zd.id,
  zd.code AS zone_code,
  zd.name AS zone_district,
  zd.description AS zone_description,
  zd.category,
  zd.ordinance_section,
  j.name AS jurisdiction_name,
  j.id AS jurisdiction_id,
  j.state
FROM zoning_districts zd
JOIN jurisdictions j ON zd.jurisdiction_id = j.id;

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON zoning_districts_by_code TO anon, authenticated;

-- ─── Step 6: Create indexes for performance ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_zoning_assignments_jurisdiction ON zoning_assignments(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_zoning_assignments_municipal_code ON zoning_assignments(municipal_code_url) WHERE municipal_code_url IS NOT NULL;
