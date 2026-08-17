'use client'

import { useEffect, useState } from 'react'

/**
 * Platform coverage numbers, derived from the county SSOT — never hardcoded.
 *
 * Why this exists: /explorer shipped "36 FL Counties · 4M+ parcels" hardcoded in
 * two components while the homepage said 67 counties / 10.8M parcels. Anyone
 * clicking from marketing into the product watched our claimed coverage halve.
 * Real numbers now come from v_zonewise_headline_stats via /api/stats.
 *
 * Search surface (this hook): counties_with_parcels / parcels_total — parcel
 * search works across all 67 counties. The map/geometry subset is smaller and
 * still growing during beta; it is exposed separately and must not be quoted as
 * the platform's overall coverage.
 */

// Last known SSOT values, used only until /api/stats answers, so the UI never
// paints a number lower than reality. Server side refreshes hourly via pg_cron.
const FALLBACK: PlatformStats = { counties: 67, parcels: 10514611 }

export interface PlatformStats {
  counties: number
  parcels: number
}

let inflight: Promise<PlatformStats | null> | null = null

function loadStats(): Promise<PlatformStats | null> {
  if (inflight) return inflight
  inflight = fetch('/api/stats')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d) return null
      const counties = Number(d.counties)
      const parcels = Number(d.parcels_total ?? d.fl_parcels)
      // /api/stats returns a degraded payload rather than failing when the DB
      // is unreachable. Never overwrite good fallbacks with that.
      if (counties > 0 && parcels > 1_000_000) return { counties, parcels }
      return null
    })
    .catch(() => null)
  return inflight
}

export function usePlatformStats(): PlatformStats {
  const [stats, setStats] = useState<PlatformStats>(FALLBACK)

  useEffect(() => {
    let cancelled = false
    loadStats().then((d) => {
      if (!cancelled && d) setStats(d)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return stats
}

export function formatParcels(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n.toLocaleString()
}
