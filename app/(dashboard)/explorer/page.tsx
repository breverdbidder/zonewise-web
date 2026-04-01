import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo-metadata'
import ExplorerLoader from '@/components/explorer/ExplorerLoader'

export const metadata: Metadata = pageMetadata.explorer

export default function ExplorerPage() {
  return (
    <div className="bg-[#020617] h-full">
      <ExplorerLoader />
    </div>
  )
}
