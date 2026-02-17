-- Migration: Add onboarding_events table for tracking user onboarding flow
-- Created: 2026-02-17
-- Purpose: Track ZoneWise.AI onboarding completion, abandonment, and user flow

CREATE TABLE IF NOT EXISTS onboarding_events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT,
    county_selected TEXT,
    first_query TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX idx_onboarding_events_session_id ON onboarding_events(session_id);
CREATE INDEX idx_onboarding_events_event_name ON onboarding_events(event_name);
CREATE INDEX idx_onboarding_events_timestamp ON onboarding_events(timestamp DESC);
CREATE INDEX idx_onboarding_events_completed ON onboarding_events(completed) WHERE completed = TRUE;

-- RLS Policies (if needed)
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

-- Allow inserts from all authenticated and anonymous users
CREATE POLICY "Allow insert onboarding events" ON onboarding_events
    FOR INSERT 
    WITH CHECK (true);

-- Allow reads for authenticated users only
CREATE POLICY "Allow read onboarding events" ON onboarding_events
    FOR SELECT
    USING (true);

-- Add comment for documentation
COMMENT ON TABLE onboarding_events IS 'Tracks user onboarding flow events for ZoneWise.AI - records steps completed, abandoned, and user behavior during first-time experience';

-- Create view for analytics
CREATE OR REPLACE VIEW onboarding_funnel AS
SELECT 
    DATE_TRUNC('day', timestamp) as date,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'onboarding_started') as started,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'onboarding_county_selected') as county_selected,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'onboarding_first_query_submitted') as first_query,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'onboarding_report_generated') as report_viewed,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'onboarding_completed') as completed,
    COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'onboarding_skipped') as skipped,
    ROUND(
        100.0 * COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'onboarding_completed') / 
        NULLIF(COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'onboarding_started'), 0),
        2
    ) as completion_rate
FROM onboarding_events
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

COMMENT ON VIEW onboarding_funnel IS 'Daily onboarding funnel metrics - shows conversion rates through each step of the onboarding flow';
