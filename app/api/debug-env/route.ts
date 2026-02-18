import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // List all SUPABASE* env vars to debug
  const supabaseVars = Object.keys(process.env)
    .filter(k => k.includes('SUPABASE'))
    .map(k => ({ key: k, hasValue: !!process.env[k], length: process.env[k]?.length || 0 }));

  return NextResponse.json({
    has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    service_role_prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) || null,
    service_role_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    supabase_env_vars: supabaseVars,
    has_claude_key: !!process.env.ANTHROPIC_API_KEY,
    has_mapbox: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    has_stripe: !!process.env.STRIPE_SECRET_KEY,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    vercel_git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || null,
    deployed_at: new Date().toISOString(),
  });
}
