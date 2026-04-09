import { NextResponse } from 'next/server'
import { STATIC_KPIS } from '@/lib/kpi-data'

// STATIC_KPIS is the single source of truth for all KPI definitions (308 codes).
// Previously this route queried Supabase `zonewise_kpis` table, but it drifted
// behind the TS file (missing OWN-001..010), returning 298 instead of 308.
// Option A per SUMMIT #406: make the TS file authoritative, remove Supabase dependency.

export async function GET() {
  return NextResponse.json(STATIC_KPIS, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
