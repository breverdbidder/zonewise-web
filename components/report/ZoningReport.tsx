'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Building2,
  FileText,
  Ruler,
  BarChart3,
  Layers,
  Eye,
  Brain,
  Box,
  DollarSign,
  TrendingUp,
  Download,
  Share2,
  ExternalLink,
  Home,
  ChevronRight,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ZoningReportData {
  parcel_id: string
  lot_sqft: number | null
  lot_acres: number | null
  lot_type: string | null
  frontage_ft: number | null
  is_vacant: boolean | null
  legal_description: string | null
  building_area_sqft: number | null
  use_code: string | null
  use_description: string | null
  year_built: number | null
  subdivision: string | null
  owner_name: string | null
  owner_address: string | null
  land_value: number | null
  building_value: number | null
  total_assessed_value: number | null
  homestead: boolean | null
  last_sale_date: string | null
  last_sale_price: number | null
  zone_code: string | null
  zone_district: string | null
  zone_description: string | null
  jurisdiction: string | null
  municipal_code_url: string | null
  far: number | null
  max_height_ft: number | null
  lot_coverage_pct: number | null
  open_space_pct: number | null
  residential_density_du_acre: number | null
  max_building_area: number | null
  max_footprint: number | null
  max_units: number | null
  front_setback_ft: number | null
  side_setback_ft: number | null
  rear_setback_ft: number | null
  corner_setback_ft: number | null
  water_setback_ft: number | null
  permitted_uses: PermittedUse[]
  aerial_photo_url: string | null
  zoning_map_url: string | null
  ai_summary: string | null
  median_home_value: number | null
  population_density: number | null
  vacancy_rate: number | null
}

interface PermittedUse {
  use_name: string
  category: string
  permission_type: 'by_right' | 'conditional' | 'not_permitted'
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function currency(val: number | null | undefined): string {
  if (val == null) return '—'
  return '$' + Math.round(val).toLocaleString()
}

function num(val: number | null | undefined, decimals = 0): string {
  if (val == null) return '—'
  return val.toFixed(decimals)
}

function sqft(val: number | null | undefined): string {
  if (val == null) return '—'
  return Math.round(val).toLocaleString() + ' sq ft'
}

function str(val: unknown): string {
  if (val == null || val === '') return '—'
  return String(val).trim()
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  icon,
  title,
  children,
  id,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  id?: string
}) {
  return (
    <section id={id} className="rounded-2xl border border-slate-700/60 overflow-hidden print:border-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-3 bg-[#1E3A5F]/80 border-b border-slate-700/60 print:bg-blue-950">
        <span className="text-[#F59E0B]">{icon}</span>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-slate-800/50 last:border-0 print:border-slate-200">
      <span className="text-slate-400 text-sm shrink-0 print:text-slate-600">{label}</span>
      <span className="text-slate-100 text-sm text-right break-all print:text-slate-900">{value}</span>
    </div>
  )
}

function HighlightRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-slate-800/50 last:border-0 print:border-slate-200">
      <span className="text-slate-400 text-sm shrink-0 print:text-slate-600">{label}</span>
      <div className="text-right">
        <span className="text-[#F59E0B] font-semibold text-sm">{value}</span>
        {sub && <span className="block text-xs text-slate-500 print:text-slate-500">{sub}</span>}
      </div>
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">{children}</div>
}

// ─── Permission badge ──────────────────────────────────────────────────────────
function PermissionBadge({ type }: { type: PermittedUse['permission_type'] }) {
  if (type === 'by_right') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 print:bg-green-100 print:text-green-800">
        By Right
      </span>
    )
  }
  if (type === 'conditional') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 print:bg-yellow-100 print:text-yellow-800">
        Conditional
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 print:bg-red-100 print:text-red-800">
      Not Permitted
    </span>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
export function ZoningReportSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-slate-800 rounded-xl w-1/2" />
      <div className="h-6 bg-slate-800 rounded w-1/3" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-700/60 overflow-hidden">
          <div className="h-11 bg-[#1E3A5F]/80" />
          <div className="px-5 py-4 space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-4 bg-slate-800 rounded w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────
export function ZoningReportError({ parcelId, message }: { parcelId: string; message: string }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
      <div className="text-red-400 text-4xl mb-3">!</div>
      <h2 className="text-white font-semibold text-lg mb-1">Report Failed</h2>
      <p className="text-slate-400 text-sm mb-2">Could not generate zoning report for parcel <code className="text-[#F59E0B]">{parcelId}</code>.</p>
      <p className="text-slate-500 text-xs">{message}</p>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
interface ZoningReportProps {
  data: ZoningReportData
  parcelId: string
}

export default function ZoningReport({ data, parcelId }: ZoningReportProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // silently fail
    }
  }

  // Group permitted uses by category
  const usesByCategory = data.permitted_uses.reduce<Record<string, PermittedUse[]>>((acc, use) => {
    const cat = use.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(use)
    return acc
  }, {})

  return (
    <div
      className="min-h-screen font-[Inter,sans-serif] print:bg-white"
      style={{ background: '#020617', color: '#f8fafc' }}
    >
      {/* ── Header bar ── */}
      <div className="sticky top-0 z-30 border-b border-slate-700/60 bg-[#020617]/90 backdrop-blur-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/explorer" className="text-[#F59E0B] hover:text-amber-300 shrink-0">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </Link>
            <span className="text-slate-400 text-sm truncate">
              Zoning Report —{' '}
              <code className="text-[#F59E0B] font-mono text-xs">{parcelId}</code>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-amber-500 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Report body ── */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* Title */}
        <div className="mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight print:text-slate-900">
            ZoneWise Property Report
          </h1>
          <p className="text-slate-400 text-sm mt-1 print:text-slate-600">
            Parcel ID:{' '}
            <code className="text-[#F59E0B] font-mono">{parcelId}</code>
            {data.jurisdiction && (
              <> &mdash; {data.jurisdiction}</>
            )}
          </p>
        </div>

        {/* 1. LOT INFORMATION */}
        <Section icon={<MapPin className="w-4 h-4" />} title="Lot Information" id="lot">
          <TwoCol>
            <Row label="Parcel ID" value={str(parcelId)} />
            <Row label="Lot Area (Acres)" value={data.lot_acres != null ? num(data.lot_acres, 4) : '—'} />
            <Row label="Lot Area (Sq Ft)" value={sqft(data.lot_sqft)} />
            <Row label="Lot Type / Use" value={str(data.lot_type)} />
            <Row label="Frontage (est.)" value={data.frontage_ft != null ? `${data.frontage_ft} ft` : '—'} />
            <Row label="Vacant" value={data.is_vacant === true ? 'Yes' : data.is_vacant === false ? 'No' : '—'} />
          </TwoCol>
          {data.legal_description && (
            <div className="mt-3 pt-3 border-t border-slate-800/50">
              <p className="text-slate-400 text-xs mb-1">Legal Description</p>
              <p className="text-slate-300 text-xs break-all print:text-slate-700">{data.legal_description}</p>
            </div>
          )}
        </Section>

        {/* 2. EXISTING PROPERTY */}
        <Section icon={<Home className="w-4 h-4" />} title="Existing Property Details" id="property">
          <TwoCol>
            <Row label="Building Area" value={sqft(data.building_area_sqft)} />
            <Row label="Use Code" value={data.use_code ? `${data.use_code}${data.use_description ? ' — ' + data.use_description : ''}` : '—'} />
            <Row label="Year Built" value={str(data.year_built)} />
            <Row label="Subdivision" value={str(data.subdivision)} />
          </TwoCol>
        </Section>

        {/* 3. ZONING INFORMATION */}
        <Section icon={<Layers className="w-4 h-4" />} title="Zoning Information" id="zoning">
          <TwoCol>
            <Row label="Zone Code" value={str(data.zone_code)} />
            <Row label="District" value={str(data.zone_district)} />
            <Row label="Jurisdiction" value={str(data.jurisdiction)} />
          </TwoCol>
          {data.zone_description && (
            <div className="mt-3 pt-3 border-t border-slate-800/50">
              <p className="text-slate-400 text-xs mb-1">Description</p>
              <p className="text-slate-300 text-sm print:text-slate-700">{data.zone_description}</p>
            </div>
          )}
          {data.municipal_code_url && (
            <div className="mt-3">
              <a
                href={data.municipal_code_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#F59E0B] hover:text-amber-300 text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Municipal Code
              </a>
            </div>
          )}
        </Section>

        {/* 4. DEVELOPMENT CAPACITY */}
        <Section icon={<BarChart3 className="w-4 h-4" />} title="Development Capacity" id="capacity">
          <TwoCol>
            <HighlightRow
              label="Max Building Area"
              value={data.max_building_area != null ? Math.round(data.max_building_area).toLocaleString() + ' sq ft' : '—'}
              sub={data.far != null ? `FAR ${data.far}` : undefined}
            />
            <HighlightRow
              label="Max Footprint"
              value={data.max_footprint != null ? Math.round(data.max_footprint).toLocaleString() + ' sq ft' : '—'}
              sub={data.lot_coverage_pct != null ? `${data.lot_coverage_pct}% coverage` : undefined}
            />
            <HighlightRow
              label="Max Units"
              value={data.max_units != null ? Math.round(data.max_units).toString() : '—'}
              sub={data.residential_density_du_acre != null ? `${data.residential_density_du_acre} du/acre` : undefined}
            />
            <Row label="Max Height" value={data.max_height_ft != null ? `${data.max_height_ft} ft` : '—'} />
            <Row label="FAR" value={str(data.far)} />
            <Row label="Lot Coverage" value={data.lot_coverage_pct != null ? `${data.lot_coverage_pct}%` : '—'} />
            <Row label="Open Space" value={data.open_space_pct != null ? `${data.open_space_pct}%` : '—'} />
            <Row label="Density (du/acre)" value={str(data.residential_density_du_acre)} />
          </TwoCol>
        </Section>

        {/* 5. SETBACKS */}
        <Section icon={<Ruler className="w-4 h-4" />} title="Setbacks" id="setbacks">
          <TwoCol>
            <Row label="Front" value={data.front_setback_ft != null ? `${data.front_setback_ft} ft` : '—'} />
            <Row label="Side" value={data.side_setback_ft != null ? `${data.side_setback_ft} ft` : '—'} />
            <Row label="Rear" value={data.rear_setback_ft != null ? `${data.rear_setback_ft} ft` : '—'} />
            <Row label="Corner (2nd Frontage)" value={data.corner_setback_ft != null ? `${data.corner_setback_ft} ft` : '—'} />
            <Row label="Water / Riparian" value={data.water_setback_ft != null ? `${data.water_setback_ft} ft` : '—'} />
          </TwoCol>
        </Section>

        {/* 6. ALLOWED USES */}
        {data.permitted_uses.length > 0 && (
          <Section icon={<FileText className="w-4 h-4" />} title="Allowed Uses" id="uses">
            <div className="space-y-4">
              {Object.entries(usesByCategory).map(([category, uses]) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 print:text-slate-600">
                    {category}
                  </p>
                  <div className="space-y-1.5">
                    {uses.map((use, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 py-1 border-b border-slate-800/40 last:border-0 print:border-slate-200">
                        <span className="text-slate-300 text-sm print:text-slate-700">{use.use_name}</span>
                        <PermissionBadge type={use.permission_type} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> By Right
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Conditional
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" /> Not Permitted
              </span>
            </div>
          </Section>
        )}

        {/* 7. MAPS & VISUALS */}
        <Section icon={<Eye className="w-4 h-4" />} title="Maps & Visuals" id="maps">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Aerial photo */}
            <div>
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Aerial Photo (BCPAO)</p>
              {data.aerial_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.aerial_photo_url}
                  alt={`Aerial photo for parcel ${parcelId}`}
                  className="w-full h-48 object-cover rounded-xl border border-slate-700"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement
                    target.style.display = 'none'
                    const placeholder = target.nextElementSibling as HTMLElement
                    if (placeholder) placeholder.style.display = 'flex'
                  }}
                />
              ) : null}
              <div
                className="w-full h-48 rounded-xl border border-slate-700 bg-slate-800 items-center justify-center text-slate-500 text-sm"
                style={{ display: data.aerial_photo_url ? 'none' : 'flex' }}
              >
                No photo available
              </div>
            </div>
            {/* Zoning map placeholder */}
            <div>
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Zoning Map</p>
              {data.zoning_map_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.zoning_map_url}
                  alt="Zoning map"
                  className="w-full h-48 object-cover rounded-xl border border-slate-700"
                />
              ) : (
                <div className="w-full h-48 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center flex-col gap-2 text-slate-500 text-sm">
                  <Layers className="w-8 h-8 text-slate-600" />
                  <span>Map not available</span>
                  <Link
                    href={`/explorer?parcel=${encodeURIComponent(parcelId)}`}
                    className="text-[#F59E0B] hover:text-amber-300 text-xs underline underline-offset-2"
                  >
                    Open in Explorer
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* 8. AI ZONING ANALYSIS */}
        <Section icon={<Brain className="w-4 h-4" />} title="AI Zoning Analysis" id="ai">
          {data.ai_summary ? (
            <div>
              <p className="text-slate-200 text-sm leading-relaxed print:text-slate-800">{data.ai_summary}</p>
              <p className="text-slate-600 text-xs mt-3">
                Generated by Gemini Flash &mdash; AI analysis for informational purposes only. Verify with local planning department.
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">
              AI analysis unavailable for this parcel. Configure <code className="text-slate-400">GEMINI_API_KEY</code> to enable.
            </p>
          )}
        </Section>

        {/* 9. 3D MASSING PREVIEW */}
        <Section icon={<Box className="w-4 h-4" />} title="3D Massing Preview" id="massing">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-slate-300 text-sm mb-1">
                Visualize the maximum buildable envelope for this parcel in 3D.
              </p>
              <p className="text-slate-500 text-xs">
                Based on FAR {str(data.far)}, {data.max_height_ft ?? '—'}ft max height, and {data.lot_coverage_pct ?? '—'}% lot coverage.
              </p>
            </div>
            <Link
              href={`/massing?parcel=${encodeURIComponent(parcelId)}`}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-amber-500 text-white text-sm font-semibold transition-colors print:hidden"
            >
              <Box className="w-4 h-4" />
              Open 3D View
            </Link>
          </div>
        </Section>

        {/* 10. OWNER & VALUATION */}
        <Section icon={<DollarSign className="w-4 h-4" />} title="Owner & Valuation Intelligence" id="valuation">
          <TwoCol>
            <Row label="Owner" value={str(data.owner_name)} />
            <Row label="Mailing Address" value={str(data.owner_address)} />
            <Row label="Land Value" value={currency(data.land_value)} />
            <Row label="Building Value" value={currency(data.building_value)} />
            <HighlightRow label="Total Assessed Value" value={currency(data.total_assessed_value)} />
            <Row label="Homestead" value={data.homestead === true ? 'Yes' : data.homestead === false ? 'No' : '—'} />
            <Row label="Last Sale Date" value={str(data.last_sale_date)} />
            <Row label="Last Sale Price" value={currency(data.last_sale_price)} />
          </TwoCol>
        </Section>

        {/* 11. MARKET CONTEXT */}
        <Section icon={<TrendingUp className="w-4 h-4" />} title="Market Context" id="market">
          <TwoCol>
            <Row label="Median Home Value" value={currency(data.median_home_value)} />
            <Row label="Population Density" value={data.population_density != null ? `${Math.round(data.population_density).toLocaleString()} / sq mi` : '—'} />
            <Row label="Vacancy Rate" value={data.vacancy_rate != null ? `${(data.vacancy_rate * 100).toFixed(1)}%` : '—'} />
          </TwoCol>
          <p className="text-slate-600 text-xs mt-3">
            Market context data enrichment coming soon. Data sourced from US Census / ACS.
          </p>
        </Section>

        {/* Action bar */}
        <div className="flex items-center gap-3 pt-2 pb-8 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-amber-500 text-white font-semibold text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Link copied!' : 'Share Report'}
          </button>
          <Link
            href={`/massing?parcel=${encodeURIComponent(parcelId)}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#1E3A5F]/80 text-white font-semibold text-sm transition-colors"
          >
            <Box className="w-4 h-4" />
            3D Massing
          </Link>
        </div>

      </main>
    </div>
  )
}
