'use client'

import { useEffect } from 'react'
import { track } from '@/lib/posthog'

export default function PricingTracker({ source }: { source?: string }) {
  useEffect(() => {
    track({ name: 'pricing_viewed', properties: { source: source ?? 'direct' } })
  }, [source])
  return null
}
