/**
 * API Route: Run Onboarding Migration
 * Path: /api/migrations/onboarding
 * 
 * This endpoint runs the onboarding_events table migration
 * Only callable by admins or during deployment
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Require admin secret to run migrations
    const adminSecret = process.env.ADMIN_SECRET || process.env.ENRICH_SECRET
    if (!adminSecret) {
      return NextResponse.json({ error: 'Admin secret not configured' }, { status: 503 })
    }
    const body = await request.clone().json().catch(() => ({}))
    if (body.secret !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Get Supabase credentials from env
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Run migration SQL
    const migrationSQL = `
      -- Create onboarding_events table
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

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_onboarding_events_session_id ON onboarding_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_onboarding_events_event_name ON onboarding_events(event_name);
      CREATE INDEX IF NOT EXISTS idx_onboarding_events_timestamp ON onboarding_events(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_onboarding_events_completed ON onboarding_events(completed) WHERE completed = TRUE;

      -- Enable RLS
      ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

      -- RLS Policies
      DROP POLICY IF EXISTS "Allow insert onboarding events" ON onboarding_events;
      CREATE POLICY "Allow insert onboarding events" ON onboarding_events
        FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Allow read onboarding events" ON onboarding_events;
      CREATE POLICY "Allow read onboarding events" ON onboarding_events
        FOR SELECT USING (true);

      -- Create analytics view
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
    `

    // Execute migration (note: this uses rpc which may not work for DDL)
    // Better to use supabase.from() but that's for data, not DDL
    // We'll need to use the raw SQL execution
    const { error } = await supabase.rpc('exec_sql', { query: migrationSQL })

    if (error) {
      console.error('Migration error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          note: 'Migration may need to be run manually via Supabase Dashboard'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Onboarding migration completed successfully'
    })
    
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

// Allow GET to check if migration is needed
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ migrationNeeded: true, reason: 'No credentials' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Try to query the table
    const { error } = await supabase
      .from('onboarding_events')
      .select('count')
      .limit(1)

    if (error && error.message.includes('does not exist')) {
      return NextResponse.json({ migrationNeeded: true })
    }

    return NextResponse.json({ migrationNeeded: false, tableExists: true })
    
  } catch (error) {
    return NextResponse.json({ migrationNeeded: true, error: String(error) })
  }
}
