// app/api/health/route.ts
// P2B-4: DeployWise — Health check endpoint
// Uses anon key + REST ping — no table dependency

import { NextResponse } from 'next/server';

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_MAPBOX_TOKEN',
];

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: 'ok' | 'fail'; detail?: string }> = {};

  // Check required env vars
  const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
  checks.env =
    missingEnv.length === 0
      ? { status: 'ok' }
      : { status: 'fail', detail: `Missing: ${missingEnv.join(', ')}` };

  // Supabase connectivity — ping REST endpoint with anon key
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      checks.supabase = { status: 'fail', detail: 'Missing Supabase env vars' };
    } else {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        signal: AbortSignal.timeout(5000),
      });
      checks.supabase = res.ok
        ? { status: 'ok' }
        : { status: 'fail', detail: `HTTP ${res.status}` };
    }
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
