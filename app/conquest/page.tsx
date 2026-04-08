import { Metadata } from 'next'
import { getCountyOverview, getFlParcelsCount } from '@/lib/conquest'
import StatsRow from '@/components/conquest/StatsRow'
import CountyGrid from '@/components/conquest/CountyGrid'

export const metadata: Metadata = {
  title: 'Conquest Dashboard — ZoneWise',
  description: 'Florida statewide zoning conquest — 67 counties, live parcel data from fl_parcels.',
}

// Revalidate every 60 seconds for near-real-time updates
export const revalidate = 60

export default async function ConquestPage() {
  const [counties, totalFlParcels] = await Promise.all([
    getCountyOverview(),
    getFlParcelsCount(),
  ])

  const totalZoned = counties.reduce((sum, c) => sum + c.zoned_parcels, 0)
  const conqueredCount = counties.filter(c => c.conquered).length

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
        {/* Page header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ background: 'rgba(30, 58, 95, 0.8)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
            >
              🗺️
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Conquest Dashboard</h1>
              <p className="text-slate-400 text-sm">Florida statewide zoning coverage · 67 counties · {(totalFlParcels / 1_000_000).toFixed(1)}M parcels</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <StatsRow
          totalCounties={counties.length}
          totalParcels={totalFlParcels}
          countiesConquered={conqueredCount}
          totalZoned={totalZoned}
        />

        {/* County grid */}
        <CountyGrid initialData={counties} />
      </div>
    </main>
  )
}
