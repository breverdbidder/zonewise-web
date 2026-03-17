import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { FL_COUNTIES, getCountyBySlug } from '@/lib/counties'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env vars not configured')
  return createClient(url, key)
}

export async function generateStaticParams() {
  return FL_COUNTIES.map((c) => ({ county: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ county: string }>
}): Promise<Metadata> {
  const { county: slug } = await params
  const county = getCountyBySlug(slug)
  if (!county) return { title: 'County Not Found' }

  return {
    title: `${county.name} County FL Foreclosure Auctions | ZoneWise.AI`,
    description: `Search foreclosure and tax deed auctions in ${county.name} County, Florida. AI-powered investment scoring with 298 KPIs per property. Updated daily.`,
    openGraph: {
      title: `${county.name} County Foreclosure Auctions`,
      description: `Live ${county.name} County FL auction calendar, property details, and AI investment scoring.`,
    },
  }
}

function formatCurrency(val: number | null | undefined): string {
  if (val == null) return '--'
  return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatDate(val: string | null): string {
  if (!val) return '--'
  return new Date(val + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function CountyPage({
  params,
}: {
  params: Promise<{ county: string }>
}) {
  const { county: slug } = await params
  const county = getCountyBySlug(slug)
  if (!county) notFound()

  const supabase = getSupabase()

  const { data: auctions } = await supabase
    .from('multi_county_auctions')
    .select('*')
    .ilike('county', county.name)
    .order('auction_date', { ascending: false, nullsFirst: false })
    .limit(20)

  const { count: totalCount } = await supabase
    .from('multi_county_auctions')
    .select('*', { count: 'exact', head: true })
    .ilike('county', county.name)

  const rows = auctions || []
  const total = totalCount || 0
  const foreclosures = rows.filter((r) => r.auction_type === 'foreclosure').length
  const taxDeeds = rows.filter((r) => r.auction_type === 'tax_deed').length
  const avgValue =
    rows.length > 0
      ? Math.round(
          rows.reduce((s, r) => s + (r.just_value || 0), 0) / rows.filter((r) => r.just_value).length || 1
        )
      : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="mb-10">
          <Link
            href="/auctions"
            className="text-sm text-zw-navy-500 hover:text-zw-navy-600 mb-4 inline-block"
          >
            &larr; All Counties
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {county.name} County, FL
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-400 mt-2">
            Foreclosure &amp; Tax Deed Auction Intelligence
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Total Auctions</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-red-500">{foreclosures}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Foreclosures</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-amber-500">{taxDeeds}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Tax Deeds</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(avgValue)}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Avg Property Value</p>
          </div>
        </div>

        {/* 298 KPIs callout */}
        <div className="bg-zw-navy-500 text-white rounded-lg p-6 mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xl font-bold">298 KPIs Per Property</p>
              <p className="text-sm text-zw-navy-100 mt-1">
                AI-powered zoning analysis, investment scoring, and market intelligence.
              </p>
            </div>
            <Link
              href={`/auctions?county=${encodeURIComponent(county.name)}`}
              className="px-4 py-2 bg-white text-zw-navy-600 font-medium rounded-md text-sm hover:bg-gray-100 transition-colors"
            >
              View All {county.name} Auctions
            </Link>
          </div>
        </div>

        {/* Auction Table */}
        {rows.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Latest Auctions in {county.name} County
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Case #</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Address</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Value</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                  {rows.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-2.5 font-mono text-gray-600 dark:text-slate-400 whitespace-nowrap">
                        <Link href={`/auctions/${a.id}`} className="hover:text-zw-navy-500">
                          {a.case_number}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-gray-900 dark:text-slate-200 max-w-xs truncate">
                        {a.property_address || '--'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={a.auction_type === 'foreclosure' ? 'text-red-500' : 'text-amber-500'}>
                          {a.auction_type === 'foreclosure' ? 'FC' : 'TD'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-900 dark:text-slate-200 whitespace-nowrap">
                        {formatCurrency(a.just_value)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(a.auction_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-slate-400">
              No auctions currently listed for {county.name} County.
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
              Auctions are scraped daily. Check back soon or view all counties.
            </p>
          </div>
        )}

        {/* Other counties */}
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Other Florida Counties
          </h3>
          <div className="flex flex-wrap gap-2">
            {FL_COUNTIES.filter((c) => c.slug !== slug)
              .slice(0, 20)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/foreclosures/${c.slug}`}
                  className="px-3 py-1 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-full text-gray-600 dark:text-slate-400 hover:border-zw-navy-500 hover:text-zw-navy-500 transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            <Link
              href="/auctions"
              className="px-3 py-1 text-xs bg-zw-navy-50 dark:bg-zw-navy-900/20 border border-zw-navy-200 dark:border-zw-navy-800 rounded-full text-zw-navy-600 dark:text-zw-navy-400 font-medium"
            >
              All 67 Counties &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
