import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const BCPAO_PARCEL = 'https://gis.brevardfl.gov/gissrv/rest/services/Base_Map/Parcel_New_WKID102100/MapServer/5/query'

interface ParcelData {
  PARCEL_ID: string; PROPERTY_ID: string; STREET_NUMBER: string; STREET_DIRECTION_PREFIX: string
  STREET_NAME: string; STREET_TYPE: string; CITY: string; ZIP_CODE: string
  OWNER_NAME1: string; OWNER_NAME2: string; BLDG_VALUE: number; LAND_VALUE: number
  HOMESTEAD_VALUE: number; LIV_AREA: number; ACRES: number; USE_CODE_DESCRIPTION: string
  SUBDIVISION_NAME: string; MILLAGE_CODE: string; LEGAL_DESC: string; EXEMPTION_CODE: string
  USE_CODE: string; PLAT_BOOK: string; PLAT_PAGE: string; TOWNSHIP: string; RANGE: string; SECTION: string
}

async function fetchParcel(parcelId: string): Promise<ParcelData | null> {
  try {
    const cleanId = decodeURIComponent(parcelId).trim()
    const params = new URLSearchParams({
      where: `PARCEL_ID='${cleanId}'`,
      outFields: '*',
      returnGeometry: 'false',
      f: 'json',
    })
    const res = await fetch(`${BCPAO_PARCEL}?${params}`, { next: { revalidate: 3600 } })
    const data = await res.json()
    if (data.features?.length) return data.features[0].attributes
    return null
  } catch { return null }
}

function fmt(n: number | string | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : n
  if (v == null || isNaN(v as number)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v as number)
}

function fmtN(n: number | string | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : n
  if (v == null || isNaN(v as number)) return '—'
  return new Intl.NumberFormat('en-US').format(v as number)
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Parcel ${decodeURIComponent(id)} — ZoneWise.AI`,
    description: `Property intelligence for parcel ${decodeURIComponent(id)} in Brevard County, FL`,
  }
}

export default async function ParcelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parcel = await fetchParcel(id)

  if (!parcel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-white mb-2">Parcel Not Found</h1>
          <p className="text-sm text-slate-400 mb-6">
            Could not find parcel <span className="font-mono text-zw-orange">{decodeURIComponent(id)}</span> in BCPAO records.
          </p>
          <Link href="/explorer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-zw-orange/15 border border-zw-orange/30 text-zw-orange rounded-md text-sm font-bold hover:bg-zw-orange/25 transition-colors">
            ← Back to Explorer
          </Link>
        </div>
      </div>
    )
  }

  const addr = [parcel.STREET_NUMBER, parcel.STREET_DIRECTION_PREFIX, parcel.STREET_NAME, parcel.STREET_TYPE].filter(Boolean).join(' ').trim()
  const totalValue = (parcel.BLDG_VALUE || 0) + (parcel.LAND_VALUE || 0)

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

        {/* Back nav */}
        <Link href="/explorer" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-zw-orange transition-colors mb-4">
          ← Back to Explorer
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{addr || 'Unknown Address'}</h1>
          <p className="text-sm text-slate-400 mt-1">{(parcel.CITY || '').trim()}, FL {parcel.ZIP_CODE || ''}</p>
          <p className="text-xs text-slate-500 font-mono mt-1">Parcel: {parcel.PARCEL_ID}</p>
        </div>

        {/* Value cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Value', value: fmt(totalValue), accent: true },
            { label: 'Building', value: fmt(parcel.BLDG_VALUE) },
            { label: 'Land', value: fmt(parcel.LAND_VALUE) },
            { label: 'Living Area', value: `${fmtN(parcel.LIV_AREA)} sqft` },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-4 border ${s.accent ? 'bg-zw-orange/10 border-zw-orange/30' : 'bg-slate-900 border-slate-800'}`}>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{s.label}</div>
              <div className={`text-lg font-bold font-mono ${s.accent ? 'text-zw-orange' : 'text-white'}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Details grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Property Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">🏠 Property Details</h2>
            <dl className="space-y-2">
              {[
                ['Use', (parcel.USE_CODE_DESCRIPTION || '').trim()],
                ['Use Code', parcel.USE_CODE],
                ['Acres', parcel.ACRES ? `${Number(parcel.ACRES).toFixed(2)} ac` : '—'],
                ['Subdivision', parcel.SUBDIVISION_NAME || '—'],
                ['Millage Code', parcel.MILLAGE_CODE || '—'],
                ['Homestead', parcel.HOMESTEAD_VALUE > 0 ? `Yes — ${fmt(parcel.HOMESTEAD_VALUE)}` : 'No'],
                ['Exemption', (parcel.EXEMPTION_CODE || '').trim() || 'None'],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between text-xs">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-slate-300 font-mono text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Owner Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">👤 Owner Information</h2>
            <dl className="space-y-2">
              {[
                ['Owner', parcel.OWNER_NAME1 || '—'],
                ['Co-Owner', parcel.OWNER_NAME2 || '—'],
                ['Township', parcel.TOWNSHIP || '—'],
                ['Range', parcel.RANGE || '—'],
                ['Section', parcel.SECTION || '—'],
                ['Plat Book/Page', `${parcel.PLAT_BOOK || '—'} / ${parcel.PLAT_PAGE || '—'}`],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between text-xs">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-slate-300 font-mono text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Legal Description */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 mb-6">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">📜 Legal Description</h2>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">{parcel.LEGAL_DESC || '—'}</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <a href={`https://www.bcpao.us/PropertySearch/#/account/${parcel.PROPERTY_ID}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/25 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-500/20 transition-colors">
            📋 BCPAO Full Record
          </a>
          <Link href="/explorer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zw-orange/10 border border-zw-orange/25 text-zw-orange rounded-lg text-sm font-semibold hover:bg-zw-orange/20 transition-colors">
            🗺️ Back to Explorer
          </Link>
        </div>

      </div>
    </div>
  )
}
