// src/app/api/health/route.ts
// P2B-4: DeployWise — Health check endpoint
// Used by post-deploy verification + monitoring

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_MAPBOX_TOKEN',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
];

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: 'ok' | 'fail'; detail?: string }> = {};

  // Check required env vars
  const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
  checks.env = missingEnv.length === 0
    ? { status: 'ok' }
    : { status: 'fail', detail: `Missing: ${missingEnv.join(', ')}` };

  // Check Supabase connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('fl_counties').select('count').limit(1).single();
    checks.supabase = error
      ? { status: 'fail', detail: error.message }
      : { status: 'ok' };
  } catch (e) {
    checks.supabase = { status: 'fail', detail: String(e) };
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  const duration = Date.now() - start;

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
