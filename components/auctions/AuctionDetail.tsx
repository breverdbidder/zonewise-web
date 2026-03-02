'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Auction } from '@/types/auctions'

const AuctionDetailMap = dynamic(() => import('./AuctionDetailMap'), { ssr: false })

interface Props {
  auctionId: string
}

function formatCurrency(val: number | null): string {
  if (val == null) return '—'
  return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatDate(val: string | null): string {
  if (!val) return '—'
  const d = new Date(val + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

function typeLabel(type: string): string {
  switch (type) {
    case 'foreclosure': return 'Foreclosure'
    case 'tax_deed': return 'Tax Deed'
    default: return type
  }
}

function typeBadge(type: string): string {
  switch (type) {
    case 'foreclosure': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    case 'tax_deed': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
    default: return 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
  }
}

function InfoRow({ label, value, mono }: { label: string; value: string | number | null | undefined; mono?: boolean }) {
  const display = value == null || value === '' ? '—' : String(value)
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-slate-400 shrink-0 w-36">{label}</span>
      <span className={`text-sm text-gray-900 dark:text-white text-right ${mono ? 'font-mono text-xs' : ''}`}>
        {display}
      </span>
    </div>
  )
}

export default function AuctionDetail({ auctionId }: Props) {
  const router = useRouter()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/auctions/${auctionId}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Auction not found')
          } else {
            setError('Failed to load auction')
          }
          return
        }
        const data = await res.json()
        setAuction(data)
      } catch {
        setError('Failed to load auction')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [auctionId])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-zw-navy-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-slate-400 text-sm">Loading auction...</p>
        </div>
      </div>
    )
  }

  if (error || !auction) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-500 text-sm">{error || 'Auction not found'}</p>
          <button
            onClick={() => router.push('/auctions')}
            className="text-sm text-zw-navy-500 hover:text-zw-navy-700 dark:text-zw-orange-400 dark:hover:text-zw-orange-300 underline"
          >
            ← Back to Auctions
          </button>
        </div>
      </div>
    )
  }

  const hasCoords = auction.centroid_lat != null && auction.centroid_lng != null
  const daysUntilAuction = auction.auction_date
    ? Math.ceil((new Date(auction.auction_date + 'T00:00:00').getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Back + Header */}
        <div>
          <button
            onClick={() => router.push('/auctions')}
            className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 mb-3 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Auctions
          </button>

          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {auction.property_address || 'No Address'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                {auction.county} County &middot; {auction.case_number}
              </p>
            </div>

            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${typeBadge(auction.auction_type)}`}>
              {typeLabel(auction.auction_type)}
            </span>

            {daysUntilAuction != null && daysUntilAuction >= 0 && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shrink-0">
                {daysUntilAuction === 0 ? 'Today' : daysUntilAuction === 1 ? 'Tomorrow' : `${daysUntilAuction} days`}
              </span>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left column: Property details */}
          <div className="lg:col-span-3 space-y-6">

            {/* Photo */}
            {auction.photo_url && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <img
                  src={auction.photo_url}
                  alt={auction.property_address || 'Property photo'}
                  className="w-full h-64 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}

            {/* Case Details */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                Case Details
              </h2>
              <InfoRow label="Case Number" value={auction.case_number} mono />
              <InfoRow label="Auction Type" value={typeLabel(auction.auction_type)} />
              <InfoRow label="Auction Date" value={formatDate(auction.auction_date)} />
              <InfoRow label="Plaintiff" value={auction.plaintiff} />
              <InfoRow label="Defendant" value={auction.defendant} />
              <InfoRow label="Judgment Amount" value={auction.judgment_amount ? formatCurrency(auction.judgment_amount) : null} />
            </div>

            {/* Property Details */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                Property Details
              </h2>
              <InfoRow label="Owner" value={auction.owner_name} />
              <InfoRow label="Parcel ID" value={auction.parcel_id} mono />
              <InfoRow label="Just Value" value={formatCurrency(auction.just_value)} />
              <InfoRow label="Year Built" value={auction.year_built} />
              <InfoRow label="Living Area" value={auction.total_living_area ? `${auction.total_living_area.toLocaleString()} sqft` : null} />
              <InfoRow label="Lot Size" value={auction.lot_sqft ? `${auction.lot_sqft.toLocaleString()} sqft` : null} />
              <InfoRow label="Vacant Land" value={auction.is_vacant_land ? 'Yes' : 'No'} />
              <InfoRow label="Condo" value={auction.is_condo ? 'Yes' : 'No'} />
            </div>
          </div>

          {/* Right column: Map + Quick Stats */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">Just Value</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(auction.just_value)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">Judgment</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(auction.judgment_amount)}
                </p>
              </div>
              {auction.just_value && auction.judgment_amount && auction.judgment_amount > 0 && (
                <>
                  <div className="col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-slate-400 uppercase">Bid / Value Ratio</p>
                    <p className={`text-lg font-bold mt-1 ${
                      (auction.judgment_amount / auction.just_value) <= 0.6
                        ? 'text-green-600 dark:text-green-400'
                        : (auction.judgment_amount / auction.just_value) <= 0.75
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}>
                      {((auction.judgment_amount / auction.just_value) * 100).toFixed(1)}%
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Mini Map */}
            {hasCoords && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <AuctionDetailMap
                  lat={auction.centroid_lat!}
                  lng={auction.centroid_lng!}
                  label={auction.property_address || 'Property'}
                  type={auction.auction_type}
                />
              </div>
            )}

            {/* Address Status */}
            {auction.address_status && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-400 uppercase mb-1">Address Status</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {auction.address_status.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            {/* Data Freshness */}
            {auction.enriched_at && (
              <p className="text-xs text-gray-400 dark:text-slate-600 text-center">
                Last enriched: {new Date(auction.enriched_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
