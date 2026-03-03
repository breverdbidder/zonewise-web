-- 008_zoning_columns.sql
-- Add zoning intelligence columns to multi_county_auctions
-- These columns are populated by the /api/admin/enrich-zoning endpoint

ALTER TABLE multi_county_auctions
  ADD COLUMN IF NOT EXISTS dor_use_code text,
  ADD COLUMN IF NOT EXISTS zoning_category text,
  ADD COLUMN IF NOT EXISTS zone_code text,
  ADD COLUMN IF NOT EXISTS municipality text;

-- Index for zoning category filter
CREATE INDEX IF NOT EXISTS idx_mca_zoning_category ON multi_county_auctions (zoning_category);

-- Index for DOR code lookups
CREATE INDEX IF NOT EXISTS idx_mca_dor_use_code ON multi_county_auctions (dor_use_code);

-- Comment for documentation
COMMENT ON COLUMN multi_county_auctions.dor_use_code IS 'Florida DOR use code from fl_parcels (e.g. 001=SFR)';
COMMENT ON COLUMN multi_county_auctions.zoning_category IS 'High-level category: RES, COM, IND, AGR, INST, MISC';
COMMENT ON COLUMN multi_county_auctions.zone_code IS 'Municipal zone code from fl_parcels';
COMMENT ON COLUMN multi_county_auctions.municipality IS 'Municipality name from fl_parcels';
