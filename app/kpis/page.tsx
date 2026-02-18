'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'


interface KPI {
  kpi_code: string
  kpi_name: string
  category: string
  subcategory: string | null
  description: string | null
  data_source: string | null
  is_exclusive: boolean
  competitive_source: string | null
  ui_panel: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  'Property': 'bg-blue-100 text-blue-800',
  'Zoning': 'bg-emerald-100 text-emerald-800',
  'Auction': 'bg-red-100 text-red-800',
  'Financial': 'bg-amber-100 text-amber-800',
  'Liens': 'bg-rose-100 text-rose-800',
  'ML': 'bg-violet-100 text-violet-800',
  'Physical': 'bg-slate-100 text-slate-800',
  'Investment': 'bg-green-100 text-green-800',
  'Demographics': 'bg-cyan-100 text-cyan-800',
  'Market': 'bg-orange-100 text-orange-800',
  'Comps': 'bg-teal-100 text-teal-800',
  'HBU': 'bg-indigo-100 text-indigo-800',
  'CMA': 'bg-fuchsia-100 text-fuchsia-800',
  'Risk': 'bg-red-100 text-red-800',
  'Red Flags': 'bg-pink-100 text-pink-800',
  'Development': 'bg-lime-100 text-lime-800',
  'Environmental': 'bg-emerald-100 text-emerald-800',
}

export default function KPIsPage() {
  const [kpis, setKPIs] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [showExclusiveOnly, setShowExclusiveOnly] = useState(false)

  useEffect(() => {
    async function loadKPIs() {
      try {
        const res = await fetch('/api/kpis')
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        setKPIs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KPIs')
      } finally {
        setLoading(false)
      }
    }
    loadKPIs()
  }, [])

  const categories = ['All', ...Array.from(new Set(kpis.map(k => k.category)))]

  const filteredKPIs = kpis.filter(kpi => {
    const matchesCategory = selectedCategory === 'All' || kpi.category === selectedCategory
    const matchesSearch = searchTerm === '' ||
      kpi.kpi_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kpi.kpi_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (kpi.subcategory && kpi.subcategory.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesExclusive = !showExclusiveOnly || kpi.is_exclusive
    return matchesCategory && matchesSearch && matchesExclusive
  })

  const totalKPIs = kpis.length
  const exclusiveKPIs = kpis.filter(k => k.is_exclusive).length
  const categoryCount = new Set(kpis.map(k => k.category)).size

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="border-b sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zw-navy rounded-lg flex items-center justify-center relative">
              <span className="text-white font-bold">Z</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-zw-orange rounded-full" />
            </div>
            <span className="text-xl font-bold text-slate-800">ZoneWise.AI</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/#how" className="text-gray-600 hover:text-slate-800 hidden sm:block text-sm">How It Works</Link>
            <span className="text-zw-navy font-medium text-sm hidden sm:block">298 KPIs</span>
            <Link href="/#pricing" className="text-gray-600 hover:text-slate-800 hidden sm:block text-sm">Pricing</Link>
            <a href="/#beta-signup" className="bg-zw-navy text-white px-4 py-2 rounded-lg hover:bg-zw-navy-700 text-sm font-medium transition-colors">
              Join the Beta
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-zw-navy font-medium tracking-wide text-sm mb-4 uppercase">The ZoneWise Advantage</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-[1.1] tracking-tight">
            {totalKPIs || 298} KPIs.<br />
            <span className="text-zw-navy">{categoryCount || 17} Categories.</span><br />
            <span className="text-zw-orange">3x PropertyOnion.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            The most comprehensive real estate intelligence framework in Florida.
            Every metric an investor needs &mdash; from zoning setbacks to ML predictions.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-zw-navy">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">{totalKPIs || 298}</p>
            <p className="text-slate-300 text-sm mt-1">Total KPIs</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">{exclusiveKPIs || 200}+</p>
            <p className="text-slate-300 text-sm mt-1">Exclusive to ZoneWise</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">{categoryCount || 17}</p>
            <p className="text-slate-300 text-sm mt-1">Categories</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-zw-orange">3x</p>
            <p className="text-slate-300 text-sm mt-1">vs PropertyOnion</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-zw-navy/20 border-t-zw-navy rounded-full animate-spin mb-4" />
              <p className="text-lg text-gray-500">Loading {totalKPIs || 298} KPIs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="text-zw-navy underline">Try again</button>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-gray-100">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search KPIs by name, code, or subcategory..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zw-navy focus:border-transparent text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={showExclusiveOnly}
                        onChange={(e) => setShowExclusiveOnly(e.target.checked)}
                        className="w-4 h-4 text-zw-navy rounded border-gray-300 focus:ring-zw-navy"
                      />
                      <span className="text-sm font-medium text-gray-700">Exclusive only</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedCategory === cat
                            ? 'bg-zw-navy text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-zw-navy/30'
                        }`}
                      >
                        {cat}
                        {cat !== 'All' && (
                          <span className="ml-1 opacity-60">
                            ({kpis.filter(k => k.category === cat).length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results Info */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-slate-800">{filteredKPIs.length}</span> of{' '}
                  <span className="font-semibold text-slate-800">{totalKPIs}</span> KPIs
                </p>
              </div>

              {/* KPI Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">KPI Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Subcategory</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredKPIs.map((kpi) => (
                        <tr key={kpi.kpi_code} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-mono font-bold text-zw-navy">
                            {kpi.kpi_code}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {kpi.kpi_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[kpi.category] || 'bg-gray-100 text-gray-800'}`}>
                              {kpi.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {kpi.subcategory || '\u2014'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                            {kpi.data_source || '\u2014'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {kpi.is_exclusive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zw-navy/10 text-zw-navy">
                                ZW Exclusive
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                Shared
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredKPIs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">No KPIs match your filters</p>
                  <button
                    onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setShowExclusiveOnly(false) }}
                    className="text-zw-navy underline text-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-zw-navy">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Get access to all {totalKPIs || 298} KPIs
          </h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Join the beta and start making data-driven real estate decisions with the most comprehensive KPI framework in Florida.
          </p>
          <a href="/#beta-signup" className="inline-block bg-white text-zw-navy px-8 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors">
            Join the Beta
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-zw-navy-800 text-slate-400">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-zw-navy rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">Z</span>
              </div>
              <span className="text-white font-medium">ZoneWise.AI</span>
            </div>
            <div className="flex gap-8 text-sm">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
          <p className="text-center text-xs mt-6 text-slate-500">
            &copy; 2026 ZoneWise.AI &mdash; The AI for Real Estate Intelligence.
          </p>
        </div>
      </footer>
    </div>
  )
}
