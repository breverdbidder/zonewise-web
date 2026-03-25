-- ZoneWise.AI — Phase 1: Zoning Accuracy Audit Table
-- Migration: 20260325_create_audit_zoning_accuracy.sql

CREATE TABLE IF NOT EXISTS audit_zoning_accuracy (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id        TEXT NOT NULL,
  address          TEXT,
  db_zone_code     TEXT,
  chatbot_zone_code TEXT,
  bcpao_zone_code  TEXT,
  match_chatbot    BOOLEAN,
  match_bcpao      BOOLEAN,
  fabricated       BOOLEAN DEFAULT FALSE,
  audit_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes            TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_zoning_accuracy_parcel_id ON audit_zoning_accuracy(parcel_id);
CREATE INDEX IF NOT EXISTS idx_audit_zoning_accuracy_audit_date ON audit_zoning_accuracy(audit_date);
