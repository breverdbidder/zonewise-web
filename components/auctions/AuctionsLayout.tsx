'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import AuctionSummaryCards from './AuctionSummaryCards'
import AuctionFilters from './AuctionFilters'
import AuctionTable from './AuctionTable'
import type { Auction, AuctionSummary, AuctionsResponse, ViewMode } from '@/types/auctions'

// Dynamic imports — these components require window, break SSR
const AuctionMap = dynamic(() => import('./AuctionMap'), { ssr: false })
const AuctionCalendar = dynamic(() => import('./AuctionCalendar'), { ssr: false })
import AuctionSpreadsheet from './AuctionSpreadsheet'

export default function AuctionsLayout() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [summary, setSummary] = useState<AuctionSummary | null>(null)
  const [total, setTotal] = useState(0)

  const [selectedCounty, setSelectedCounty] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedZoning, setSelectedZoning] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)

  const counties = summary
    ? Object.keys(summary.by_county).sort()
    : []

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([fetchSummary(), fetchAuctions()])
      } catch (err) {
        console.error('Init failed:', err)
        setError('Failed to load auction data')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!loading) fetchAuctions()
  }, [selectedCounty, selectedType, selectedZoning])

  async function fetchSummary() {
    try {
      const res = await fetch('/api/auctions/summary')
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err)
    }
  }

  async function fetchAuctions() {
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (selectedCounty) params.set('county', selectedCounty)
      if (selectedType) params.set('type', selectedType)
      if (selectedZoning) params.set('zoning_category', selectedZoning)

      const res = await fetch(`/api/auctions?${params}`)
      if (res.ok) {
        const json: AuctionsResponse = await res.json()
        setAuctions(json.data)
        setTotal(json.total)
      }
    } catch (err) {
      console.error('Failed to fetch auctions:', err)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-zw-navy-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">Loading auctions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-500 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-blue-500 underline">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Auction Intelligence</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {total} auctions across {counties.length} Florida counties
          </p>
        </div>

        <AuctionSummaryCards summary={summary} loading={false} />

        <AuctionFilters
          counties={counties}
          selectedCounty={selectedCounty}
          selectedType={selectedType}
          selectedZoning={selectedZoning}
          viewMode={viewMode}
          onCountyChange={setSelectedCounty}
          onTypeChange={setSelectedType}
          onZoningChange={setSelectedZoning}
          onViewModeChange={setViewMode}
        />

        {viewMode === 'table' && (
          <AuctionTable
            auctions={auctions}
            loading={false}
            onSelectAuction={(auction) => router.push(`/auctions/${auction.id}`)}
          />
        )}
        {viewMode === 'map' && (
          <AuctionMap
            auctions={auctions}
            loading={false}
            onSelectAuction={setSelectedAuction}
          />
        )}
        {viewMode === 'calendar' && (
          <AuctionCalendar
            auctions={auctions}
            loading={false}
            onSelectAuction={(auction) => router.push(`/auctions/${auction.id}`)}
          />
        )}
        {viewMode === 'spreadsheet' && (
          <AuctionSpreadsheet
            auctions={auctions}
            loading={false}
            onSelectAuction={(auction) => router.push(`/auctions/${auction.id}`)}
          />
        )}

        {selectedAuction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAuction(null)}>
            <div
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedAuction.property_address || 'No Address'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {selectedAuction.county} County &middot; {selectedAuction.case_number}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAuction(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Type</p>
                  <p className={`font-medium ${selectedAuction.auction_type === 'foreclosure' ? 'text-red-500' : 'text-amber-500'}`}>
                    {selectedAuction.auction_type === 'foreclosure' ? 'Foreclosure' : 'Tax Deed'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Auction Date</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedAuction.auction_date
                      ? new Date(selectedAuction.auction_date + 'T00:00:00').toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Just Value</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedAuction.just_value
                      ? '$' + selectedAuction.just_value.toLocaleString()
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Year Built</p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedAuction.year_built || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Plaintiff</p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedAuction.plaintiff || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Defendant</p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedAuction.defendant || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Living Area</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedAuction.total_living_area
                      ? selectedAuction.total_living_area.toLocaleString() + ' sqft'
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-slate-400">Parcel ID</p>
                  <p className="text-gray-900 dark:text-white font-mono text-xs">{selectedAuction.parcel_id || '—'}</p>
                </div>
              </div>

              {selectedAuction.is_vacant_land && (
                <div className="mt-4 px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-md">
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    This parcel is classified as <span className="font-medium text-gray-700 dark:text-slate-300">vacant land</span> with no situs address.
                  </p>
                </div>
              )}

              {selectedAuction.address_status && (
                <div className="mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Status: {selectedAuction.address_status.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
