'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { STATIC_KPIS, type KPI } from '@/lib/kpi-data'

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Property':      { bg: 'rgba(59,130,246,.15)',  text: '#60A5FA' },
  'Zoning':        { bg: 'rgba(34,197,94,.15)',   text: '#4ADE80' },
  'Auction':       { bg: 'rgba(239,68,68,.15)',   text: '#F87171' },
  'Financial':     { bg: 'rgba(245,158,11,.15)',  text: '#FCD34D' },
  'Liens':         { bg: 'rgba(239,68,68,.15)',   text: '#F87171' },
  'ML':            { bg: 'rgba(167,139,250,.15)', text: '#A78BFA' },
  'Physical':      { bg: 'rgba(100,116,139,.15)', text: '#94A3B8' },
  'Investment':    { bg: 'rgba(34,197,94,.15)',   text: '#4ADE80' },
  'Demographics':  { bg: 'rgba(6,182,212,.15)',   text: '#22D3EE' },
  'Market':        { bg: 'rgba(249,115,22,.15)',  text: '#FB923C' },
  'Comps':         { bg: 'rgba(20,184,166,.15)',  text: '#2DD4BF' },
  'HBU':           { bg: 'rgba(99,102,241,.15)',  text: '#818CF8' },
  'CMA':           { bg: 'rgba(217,70,239,.15)',  text: '#E879F9' },
  'Risk':          { bg: 'rgba(239,68,68,.15)',   text: '#F87171' },
  'Red Flags':     { bg: 'rgba(244,63,94,.15)',   text: '#FB7185' },
  'Development':   { bg: 'rgba(132,204,22,.15)',  text: '#A3E635' },
  'Environmental': { bg: 'rgba(34,197,94,.15)',   text: '#4ADE80' },
}

export default function KPIsPage() {
  const [kpis, setKPIs] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [showExclusiveOnly, setShowExclusiveOnly] = useState(false)

  useEffect(() => {
    async function loadKPIs() {
      try {
        const res = await fetch('/api/kpis')
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        if (!Array.isArray(data) || data.length === 0) throw new Error('No data returned')
        setKPIs(data)
      } catch {
        // Fallback to static KPI data
        setKPIs(STATIC_KPIS)
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
    <div style={{ minHeight: '100vh', background: '#020617', color: '#F1F5F9' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #1E293B', position: 'sticky', top: 0, background: 'rgba(2,6,23,.97)', backdropFilter: 'blur(8px)', zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: '#1E3A5F', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 16 }}>Z</span>
              <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#F59E0B', borderRadius: '50%' }} />
            </div>
            <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 18 }}>ZoneWise.AI</span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link href="/#how" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14 }}>How It Works</Link>
            <span style={{ color: '#F59E0B', fontWeight: 600, fontSize: 14 }}>298 KPIs</span>
            <Link href="/#pricing" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14 }}>Pricing</Link>
            <a href="/#beta-signup" style={{ background: '#F59E0B', color: '#020617', padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Join the Beta</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '64px 24px 48px', background: 'linear-gradient(180deg, #0F172A 0%, #020617 100%)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#F59E0B', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 12 }}>The ZoneWise Advantage</p>
          <h1 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-.03em', marginBottom: 20, color: '#F1F5F9' }}>
            {totalKPIs || 298} KPIs.<br />
            <span style={{ color: '#1E3A5F' }}>{categoryCount || 17} Categories.</span><br />
            <span style={{ color: '#F59E0B' }}>3x PropertyOnion.</span>
          </h1>
          <p style={{ fontSize: 17, color: '#94A3B8', maxWidth: 560, margin: '0 auto', lineHeight: 1.72 }}>
            The most comprehensive real estate intelligence framework in Florida. Every metric an investor needs — from zoning setbacks to ML predictions.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: '#1E3A5F', padding: '20px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { v: totalKPIs || 298,         label: 'Total KPIs' },
            { v: `${exclusiveKPIs || 200}+`, label: 'Exclusive to ZoneWise' },
            { v: categoryCount || 17,       label: 'Categories' },
            { v: '3x',                       label: 'vs PropertyOnion' },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: 36, fontWeight: 800, color: '#F59E0B', margin: 0 }}>{s.v}</p>
              <p style={{ color: '#94A3B8', fontSize: 13, margin: '4px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section style={{ padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 0' }}>
              <div style={{ width: 48, height: 48, border: '4px solid rgba(245,158,11,.2)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
              <p style={{ fontSize: 16, color: '#64748B' }}>Loading {totalKPIs || 298} KPIs...</p>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div style={{ background: '#0F172A', borderRadius: 12, padding: 24, marginBottom: 24, border: '1px solid #1E293B' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <input
                        type="text"
                        placeholder="Search KPIs by name, code, or subcategory..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', background: '#020617',
                          border: '1px solid #1E293B', borderRadius: 8, color: '#F1F5F9',
                          fontSize: 14, outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={showExclusiveOnly}
                        onChange={e => setShowExclusiveOnly(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#F59E0B' }}
                      />
                      <span style={{ fontSize: 14, color: '#94A3B8' }}>Exclusive only</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', transition: 'all .2s',
                          background: selectedCategory === cat ? '#F59E0B' : '#1E293B',
                          color: selectedCategory === cat ? '#020617' : '#94A3B8',
                          border: selectedCategory === cat ? 'none' : '1px solid #334155',
                        }}
                      >
                        {cat}
                        {cat !== 'All' && (
                          <span style={{ marginLeft: 4, opacity: 0.7 }}>
                            ({kpis.filter(k => k.category === cat).length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results count */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                  Showing <strong style={{ color: '#F1F5F9' }}>{filteredKPIs.length}</strong> of{' '}
                  <strong style={{ color: '#F1F5F9' }}>{totalKPIs}</strong> KPIs
                </p>
              </div>

              {/* KPI Table */}
              <div style={{ background: '#0F172A', borderRadius: 12, border: '1px solid #1E293B', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#1E293B' }}>
                        {['Code', 'KPI Name', 'Category', 'Subcategory', 'Source', 'Status'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKPIs.map((kpi, idx) => {
                        const cc = CATEGORY_COLORS[kpi.category] ?? { bg: 'rgba(100,116,139,.15)', text: '#94A3B8' }
                        return (
                          <tr key={kpi.kpi_code} style={{ borderTop: '1px solid #1E293B', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)' }}>
                            <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>{kpi.kpi_code}</span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#F1F5F9' }}>{kpi.kpi_name}</td>
                            <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: cc.bg, color: cc.text }}>{kpi.category}</span>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>{kpi.subcategory ?? '—'}</td>
                            <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>{kpi.data_source ?? '—'}</td>
                            <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                              {kpi.is_exclusive ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: 'rgba(245,158,11,.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,.2)' }}>ZW Exclusive</span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: '#1E293B', color: '#64748B' }}>Shared</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredKPIs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
                  <p style={{ fontSize: 16, marginBottom: 8 }}>No KPIs match your filters</p>
                  <button
                    onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setShowExclusiveOnly(false) }}
                    style={{ color: '#F59E0B', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
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
      <section style={{ padding: '64px 24px', background: '#1E3A5F' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#F1F5F9', marginBottom: 12 }}>
            Get access to all {totalKPIs || 298} KPIs
          </h2>
          <p style={{ color: '#94A3B8', marginBottom: 32, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 32px' }}>
            Join the beta and start making data-driven real estate decisions with the most comprehensive KPI framework in Florida.
          </p>
          <a href="/#beta-signup" style={{ display: 'inline-block', background: '#F59E0B', color: '#020617', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
            Join the Beta
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#020617', borderTop: '1px solid #1E293B', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, background: '#1E3A5F', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 13 }}>Z</span>
              </div>
              <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14 }}>ZoneWise.AI</span>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              <Link href="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link>
              <Link href="/terms" style={{ color: '#64748B', textDecoration: 'none' }}>Terms</Link>
              <Link href="/privacy" style={{ color: '#64748B', textDecoration: 'none' }}>Privacy</Link>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginTop: 24 }}>
            © 2026 ZoneWise.AI — The AI for Real Estate Intelligence.
          </p>
        </div>
      </footer>
    </div>
  )
}
