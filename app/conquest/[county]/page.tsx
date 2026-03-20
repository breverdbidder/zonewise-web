import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FL_COUNTIES } from '@/lib/counties'
import { getCountyDetail } from '@/lib/conquest'
import CountyDetailComponent from '@/components/conquest/CountyDetail'

interface PageProps {
  params: Promise<{ county: string }>
}

export async function generateStaticParams() {
  return FL_COUNTIES.map(county => ({ county: county.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { county: slug } = await params
  const countyMeta = FL_COUNTIES.find(c => c.slug === slug)
  if (!countyMeta) return { title: 'Not Found — ZoneWise' }

  return {
    title: `${countyMeta.name} County — Conquest — ZoneWise`,
    description: `Zoning conquest status for ${countyMeta.name} County, Florida.`,
  }
}

export const revalidate = 60

export default async function CountyPage({ params }: PageProps) {
  const { county: slug } = await params
  const detail = await getCountyDetail(slug)

  if (!detail) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CountyDetailComponent detail={detail} />
      </div>
    </main>
  )
}
