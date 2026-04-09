import Link from 'next/link'

interface OwnerIntelData {
  case_number: string
  defendant: string
  county: string
  classification: 'DISTRESSED_HOMEOWNER' | 'INVESTOR' | 'CORPORATE' | 'ESTATE' | 'UNKNOWN'
  confidence_score: number
  match_count: number
  total_portfolio_value: number
  is_homestead: boolean
  is_out_of_state: boolean
  is_corporate: boolean
  owner_state: string
  days_since_last_sale: number | null
  auction_date: string
  judgment_amount: number | null
  plaintiff: string
  parcels_owned: Array<{
    pin: string
    addr: string
    city: string
    val: number
    luse: string
    sqft: number | null
    year: number | null
  }>
}

interface Props {
  identifier: string
}

const CLASSIFICATION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  DISTRESSED_HOMEOWNER: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', label: 'Distressed Homeowner' },
  INVESTOR:             { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', label: 'Investor' },
  CORPORATE:            { bg: 'bg-[#1E3A5F]/30 border-[#1E3A5F]/50', text: 'text-blue-300', label: 'Corporate' },
  ESTATE:               { bg: 'bg-purple-500/15 border-purple-500/30', text: 'text-purple-400', label: 'Estate' },
  UNKNOWN:              { bg: 'bg-slate-500/15 border-slate-500/30', text: 'text-slate-400', label: 'Unknown' },
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtN(n: number | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US').format(n)
}

async function fetchOwnerIntel(identifier: string): Promise<OwnerIntelData | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const res = await fetch(
      `${baseUrl}/api/owner-intel/${encodeURIComponent(identifier)}`,
      { next: { revalidate: 300 } }
    )

    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function OwnerIntelPanel({ identifier }: Props) {
  const data = await fetchOwnerIntel(identifier)

  if (!data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          🔍 Owner Intelligence
        </h2>
        <p className="text-xs text-slate-500">
          No OSINT match found for this parcel/case. Owner intelligence is available for
          auction defendants with matches in the FL property database.
        </p>
      </div>
    )
  }

  const style = CLASSIFICATION_STYLES[data.classification] ?? CLASSIFICATION_STYLES.UNKNOWN
  const confidencePct = Math.round(data.confidence_score * 100)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          🔍 Owner Intelligence
        </h2>
        <span className="text-[10px] text-slate-500 font-mono">{data.case_number}</span>
      </div>

      {/* Classification Badge */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold border ${style.bg} ${style.text}`}>
          {style.label}
        </span>
        <span className="text-xs text-slate-400">
          {data.defendant}
        </span>
      </div>

      {/* Confidence Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500">Confidence</span>
          <span className="text-slate-300 font-mono">{confidencePct}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5">
          <div
            className="bg-[#F59E0B] h-1.5 rounded-full transition-all"
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Parcels Owned', value: fmtN(data.match_count), accent: false },
          { label: 'Total Value', value: fmt(data.total_portfolio_value), accent: true },
          { label: 'Out-of-State', value: data.is_out_of_state ? '✓ Yes' : '✗ No', accent: false },
          { label: 'Homestead', value: data.is_homestead ? '✓ Yes' : '✗ No', accent: false },
        ].map(s => (
          <div key={s.label} className={`rounded-md p-3 border ${s.accent ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30' : 'bg-slate-800/50 border-slate-700/50'}`}>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">{s.label}</div>
            <div className={`text-sm font-bold font-mono ${s.accent ? 'text-[#F59E0B]' : 'text-white'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Context Row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mb-4 border-t border-slate-800 pt-3">
        {data.auction_date && (
          <span>Auction: <span className="text-slate-300 font-mono">{data.auction_date}</span></span>
        )}
        {data.plaintiff && (
          <span>Plaintiff: <span className="text-slate-300">{data.plaintiff}</span></span>
        )}
        {data.days_since_last_sale != null && (
          <span>Last Sale: <span className="text-slate-300 font-mono">{data.days_since_last_sale}d ago</span></span>
        )}
        {data.owner_state && (
          <span>State: <span className="text-slate-300 font-mono">{data.owner_state}</span></span>
        )}
      </div>

      {/* Portfolio Table */}
      {data.parcels_owned.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            Portfolio ({data.parcels_owned.length} parcels)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left py-1.5 pr-2 font-medium">PIN</th>
                  <th className="text-left py-1.5 pr-2 font-medium">Address</th>
                  <th className="text-left py-1.5 pr-2 font-medium">City</th>
                  <th className="text-right py-1.5 pr-2 font-medium">Value</th>
                  <th className="text-left py-1.5 pr-2 font-medium">Use</th>
                  <th className="text-right py-1.5 pr-2 font-medium">Sqft</th>
                  <th className="text-right py-1.5 font-medium">Year</th>
                </tr>
              </thead>
              <tbody>
                {data.parcels_owned.map((p, i) => (
                  <tr key={`${p.pin}-${i}`} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-1.5 pr-2">
                      <Link
                        href={`/parcel/${encodeURIComponent(p.pin)}`}
                        className="text-[#F59E0B] hover:underline font-mono"
                      >
                        {p.pin}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-2 text-slate-300">{p.addr || '—'}</td>
                    <td className="py-1.5 pr-2 text-slate-400">{p.city || '—'}</td>
                    <td className="py-1.5 pr-2 text-right text-slate-300 font-mono">{p.val ? fmt(p.val) : '—'}</td>
                    <td className="py-1.5 pr-2 text-slate-400 font-mono">{p.luse || '—'}</td>
                    <td className="py-1.5 pr-2 text-right text-slate-400 font-mono">{fmtN(p.sqft)}</td>
                    <td className="py-1.5 text-right text-slate-400 font-mono">{p.year ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Honesty Footer */}
      <p className="text-[10px] text-slate-600 leading-relaxed border-t border-slate-800 pt-3">
        Classified via owner_osint.py from auction_owner_intel table. Confidence reflects
        name-match strength + owner state agreement. Not a substitute for professional due diligence.
      </p>
    </div>
  )
}
