-- ZoneWise.AI — Chat Feedback Loop
-- Migration: 20260325_create_chat_feedback.sql

CREATE TABLE IF NOT EXISTS chat_feedback (
  id             BIGSERIAL PRIMARY KEY,
  session_id     TEXT        NOT NULL,
  query          TEXT        NOT NULL,
  response       TEXT        NOT NULL,
  rating         TEXT        NOT NULL CHECK (rating IN ('positive', 'negative')),
  feedback_text  TEXT,
  parcel_id      TEXT,
  zone_code      TEXT,
  municipality   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_feedback_created_at ON chat_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_feedback_rating     ON chat_feedback(rating);

-- RLS
ALTER TABLE chat_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_feedback_insert_anon
  ON chat_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
