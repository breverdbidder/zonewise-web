import type { Metadata } from 'next'
import { ExploreWithChat } from '@/components/envelope/ExploreWithChat'

export const metadata: Metadata = {
  title: 'Development Intelligence — ZoneWise.AI',
  description: '3D buildable envelope, HBU analysis, and max bid calculator for Brevard County parcels.',
}

export default function ExplorePage() {
  return <ExploreWithChat />
}
