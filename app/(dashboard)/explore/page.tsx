import type { Metadata } from 'next'
import { ExploreWithChat } from '@/components/envelope/ExploreWithChat'

export const metadata: Metadata = {
  title: 'Development Intelligence — ZoneWise.AI',
  description: 'Explore Brevard County parcels with 3D building envelopes, HBU analysis, and max bid calculator.',
}

export default function ExplorePage() {
  return <ExploreWithChat />
}
