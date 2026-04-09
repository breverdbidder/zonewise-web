#!/bin/bash
# Run Supabase migration directly
# SECURITY: Service role key removed — use SUPABASE_SERVICE_ROLE_KEY env var
# Original key was leaked in commit d479830, rotated 2026-04-09

SQL_FILE="migrations/20260217_add_onboarding_events.sql"
SUPABASE_URL="https://mocerqjnksmhcjzxrewo.supabase.co"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY env var}"

echo "Creating onboarding_events table..."

# Create table via raw SQL (simplified)
curl -X POST "${SUPABASE_URL}/rest/v1/rpc" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d @- << 'SQLEOF'
{
  "query": "CREATE TABLE IF NOT EXISTS onboarding_events (id BIGSERIAL PRIMARY KEY, session_id TEXT NOT NULL, event_name TEXT NOT NULL, event_data JSONB DEFAULT '{}'::jsonb, timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), user_id TEXT, county_selected TEXT, first_query TEXT, completed BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());"
}
SQLEOF

echo "Migration attempt complete"
