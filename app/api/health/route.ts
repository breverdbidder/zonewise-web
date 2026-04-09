// app/api/health/route.ts
// Cleanup Apr 9 2026: switched Supabase ping from anon key to service role key.
// Anon key returns 401 on /rest/v1/ swagger root; SRK works. Server-side route
// is safe — SRK never reaches the client.

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

  // Check required client-side env vars
  const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
  checks.env =
    missingEnv.length === 0
      ? { status: 'ok' }
      : { status: 'fail', detail: `Missing: ${missingEnv.join(', ')}` };

  // Supabase connectivity — ping REST endpoint with SERVICE ROLE KEY (server-side only)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      checks.supabase = { status: 'fail', detail: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' };
    } else {
      // Ping the REST root which returns the swagger spec when authorized.
      // Service role key has full read access to this endpoint.
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
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
