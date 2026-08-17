'use client'

import { usePlatformStats, formatParcels } from '@/lib/explorer/usePlatformStats'

/**
 * Marketing-surface stat renderers. Server components can render these directly.
 *
 * Every county/parcel number on the site must come through here or the hook, so
 * marketing and product can never disagree again — /explorer once claimed
 * "36 FL Counties · 4M+ parcels" while the homepage claimed 67 / 10.8M.
 */

export function PlatformParcels() {
  const { parcels } = usePlatformStats()
  return <>{formatParcels(parcels)}</>
}

export function PlatformCounties() {
  const { counties } = usePlatformStats()
  return <>{counties}</>
}
