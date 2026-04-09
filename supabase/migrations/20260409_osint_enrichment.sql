-- SUMMIT #413: OSINT Enrichment — add osint_json to fl_parcels
-- Stores per-parcel OSINT enrichment data from sub-agent fan-out

ALTER TABLE fl_parcels ADD COLUMN IF NOT EXISTS osint_json JSONB;
ALTER TABLE fl_parcels ADD COLUMN IF NOT EXISTS osint_enriched_at TIMESTAMPTZ;

-- Index for querying enriched vs un-enriched parcels
CREATE INDEX IF NOT EXISTS idx_fl_parcels_osint_enriched
  ON fl_parcels (osint_enriched_at)
  WHERE osint_enriched_at IS NOT NULL;

-- Partial index for auction-linked parcels needing enrichment
CREATE INDEX IF NOT EXISTS idx_fl_parcels_osint_null
  ON fl_parcels (parcel_id)
  WHERE osint_json IS NULL;

COMMENT ON COLUMN fl_parcels.osint_json IS 'OSINT enrichment data: defendant deep-dive, property history, FL DOR cross-ref, MapWise CI scrape results';
COMMENT ON COLUMN fl_parcels.osint_enriched_at IS 'Timestamp of last OSINT enrichment run';
