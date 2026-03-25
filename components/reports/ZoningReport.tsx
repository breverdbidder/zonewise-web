'use client'

import { useState } from 'react'
import {
  MapPin,
  Building2,
  Ruler,
  Trees,
  FileText,
  Brain,
  BarChart3,
  Box,
  ExternalLink,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface LotInfo {
  parcel_id: string
  tax_acct: string | null
  address: string
  city: string | null
  zip: string | null
  acres: number | null
  sqft: number | null
  lot_type: string | null
  frontage_length: number | null
  vacant: boolean
  legal_desc: string | null
  subdivision_name: string | null
  plat_book: string | null
  plat_page: string | null
}

interface ExistingProperty {
  building_area_sqft: number | null
  existing_use: string | null
  use_code: string | null
  year_built: number | null
  neighborhood: string | null
  number_of_units: number | null
}

interface ZoningInfo {
  zone_code: string
  zoning_district: string
  zoning_description: string | null
  jurisdiction: string | null
  additional_regulations: string | null
  code_link: string | null
  is_fallback: boolean
}

interface DevCapacity {
  max_building_area_sqft: number | null
  max_height_stories: number | null
  max_height_ft: number | null
  far: number | null
  max_lot_coverage_pct: number | null
  max_building_footprint_sqft: number | null
  min_open_space_sqft: number | null
  residential_density_du_acre: number | null
  max_residential_units: number | null
  max_residential_area_sqft: number | null
  max_lodging_rooms: number | null
  max_lodging_area_sqft: number | null
  max_office_area_sqft: number | null
  max_commercial_area_sqft: number | null
}

interface Setbacks {
  primary_frontage_ft: number | null
  secondary_frontage_ft: number | null
  side_ft: number | null
  rear_ft: number | null
  water_ft: number | null
}

interface UseCategories {
  [category: string]: {
    right: string[]
    warrant: string[]
    exception: string[]
  }
}

interface BcpaoIntel {
  owner_name: string | null
  mailing_address: string | null
  building_value: number | null
  land_value: number | null
  total_assessed_value: number | null
  homestead_exemption: number | null
  subdivision_name: string | null
  millage_code: string | null
  exemption_code: string | null
}

interface MassingPreview {
  interactive_url: string
  static_preview_url: string | null
  description: string
}

export interface ZoningReportData {
  generated_at: string
  parcel_id: string
  photo_url: string | null
  sections: {
    lot_information: LotInfo
    existing_property: ExistingProperty
    zoning_information: ZoningInfo
    development_capacity: DevCapacity | null
    setbacks: Setbacks
    permitted_uses: UseCategories
    maps_visuals: {
      aerial_photo_url: string | null
      zoning_map_url: string | null
      mapbox_static_url: string | null
    }
    ai_analysis: {
      summary: string
      powered_by: string
    }
    bcpao_intelligence: BcpaoIntel
    massing_preview: MassingPreview
    ml_risk_score: {
      note: string
      purchase_probability: number | null
      foreclosure_risk: string | null
      market_trend: string | null
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt$(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtN(n: number | null | undefined, decimals = 0) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(n)
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    timeZone: 'America/New_York',
  }).format(new Date(iso))
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  id,
  icon: Icon,
  title,
  badge,
  children,
  defaultOpen = true,
}: {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  badge?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      id={id}
      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden print:border-0 print:rounded-none print:shadow-none print:break-inside-avoid mb-4 print:mb-2"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/70 transition-colors text-left print:pointer-events-none"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/10 dark:bg-[#1E3A5F]/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-[#1E3A5F] dark:text-[#F59E0B]" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white text-sm">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] font-medium">
              {badge}
            </span>
          )}
        </div>
        <span className="print:hidden">
          {open ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </span>
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </section>
  )
}

// ─── Stat row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-slate-700/50 last:border-0">
      <span className="text-sm text-gray-500 dark:text-slate-400 flex-shrink-0 pr-4">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">{value ?? '—'}</span>
    </div>
  )
}

// ─── Grid stat ────────────────────────────────────────────────────────────────
function GridStat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3">
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{label}</p>
      <p className="text-base font-semibold text-gray-900 dark:text-white leading-tight">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Use badge ────────────────────────────────────────────────────────────────
function UseBadge({ type, label }: { type: 'right' | 'warrant' | 'exception'; label: string }) {
  const styles = {
    right: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/40',
    warrant: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/40',
    exception: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-700/40',
  }
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${styles[type]}`}>
      {label}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ZoningReport({ data }: { data: ZoningReportData }) {
  const s = data.sections

  function handleDownloadPdf() {
    window.print()
  }

  function handleShare() {
    const url = `${window.location.origin}/report?parcel=${encodeURIComponent(data.parcel_id)}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => alert('Report link copied to clipboard!'))
        .catch(() => prompt('Copy this link:', url))
    } else {
      prompt('Copy this link:', url)
    }
  }

  const lot = s.lot_information
  const ep = s.existing_property
  const zi = s.zoning_information
  const dc = s.development_capacity
  const sb = s.setbacks
  const ai = s.ai_analysis
  const bp = s.bcpao_intelligence
  const mp = s.massing_preview

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 font-sans print:px-0 print:py-0 print:max-w-none">

      {/* ── Print header ─────────────────────────────────────────────────── */}
      <div className="hidden print:flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <p className="text-lg font-bold text-[#1E3A5F]">ZoneWise.AI</p>
          <p className="text-xs text-gray-500">Property Zoning Report</p>
        </div>
        <p className="text-xs text-gray-400">Report Prepared On: {fmtDate(data.generated_at)}</p>
      </div>

      {/* ── Report Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 print:mb-4">
        {/* Photo */}
        {s.maps_visuals.aerial_photo_url && (
          <div className="w-full sm:w-48 h-36 sm:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 print:w-40 print:h-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.maps_visuals.aerial_photo_url}
              alt={`BCPAO photo of ${lot.address}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget
                target.style.display = 'none'
              }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {lot.address}
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                {[lot.city, 'FL', lot.zip].filter(Boolean).join(' ')}
                {lot.subdivision_name && ` · ${lot.subdivision_name}`}
              </p>
            </div>
            <div className="flex gap-2 print:hidden flex-shrink-0">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E3A5F] text-[#1E3A5F] dark:border-[#F59E0B] dark:text-[#F59E0B] text-xs font-medium hover:bg-[#1E3A5F]/5 dark:hover:bg-[#F59E0B]/5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#1E3A5F]/10 dark:bg-[#1E3A5F]/20 text-[#1E3A5F] dark:text-blue-300 font-medium">
              <MapPin className="w-3 h-3" />
              {zi.zone_code}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
              {lot.acres != null ? `${lot.acres.toFixed(2)} ac` : '—'}
            </span>
            {lot.vacant && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                Vacant Land
              </span>
            )}
            {zi.is_fallback && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                <Info className="w-3 h-3" />
                Estimated Zoning
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 dark:text-slate-500 mt-3 print:hidden">
            Report Prepared On: {fmtDate(data.generated_at)}
          </p>
        </div>
      </div>

      {/* ── Section 8: AI Analysis (first — most valuable) ────────────────── */}
      <Section id="ai-analysis" icon={Brain} title="AI Zoning Analysis" badge="ZoneWise Advantage" defaultOpen={true}>
        <div className="space-y-3">
          <div className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#1E3A5F]/3 dark:bg-slate-800/60 rounded-lg p-4">
            {ai.summary}
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
            <Brain className="w-3 h-3" />
            Powered by {ai.powered_by}. For informational purposes only.
          </p>
        </div>
      </Section>

      {/* ── Section 1: Lot Information ────────────────────────────────────── */}
      <Section id="lot-information" icon={MapPin} title="Lot Information">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <GridStat label="Parcel ID" value={<span className="font-mono text-xs">{lot.parcel_id}</span>} />
          <GridStat label="Lot Size" value={lot.acres != null ? `${lot.acres.toFixed(3)} acres` : '—'} sub={lot.sqft ? `${fmtN(lot.sqft)} sq ft` : undefined} />
          <GridStat label="Frontage" value={lot.frontage_length ? `${fmtN(lot.frontage_length)} ft` : '—'} />
        </div>
        <div className="space-y-0.5">
          <StatRow label="Use Code" value={lot.lot_type} />
          <StatRow label="Vacant" value={lot.vacant ? 'Yes' : 'No'} />
          <StatRow label="Subdivision" value={lot.subdivision_name} />
          {lot.plat_book && <StatRow label="Plat Book / Page" value={`${lot.plat_book} / ${lot.plat_page}`} />}
          {lot.legal_desc && (
            <div className="pt-2">
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Legal Description</p>
              <p className="text-xs text-gray-600 dark:text-slate-300 font-mono bg-gray-50 dark:bg-slate-800/60 rounded p-2 leading-relaxed">
                {lot.legal_desc}
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* ── Section 2: Existing Property ─────────────────────────────────── */}
      <Section id="existing-property" icon={Building2} title="Existing Property">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <GridStat label="Building Area" value={ep.building_area_sqft ? `${fmtN(ep.building_area_sqft)} sq ft` : '—'} />
          <GridStat label="Year Built" value={ep.year_built ?? '—'} />
          <GridStat label="Units" value={ep.number_of_units ?? '—'} />
        </div>
        <div className="mt-3 space-y-0.5">
          <StatRow label="Existing Use" value={ep.existing_use} />
          <StatRow label="Use Code" value={ep.use_code} />
          <StatRow label="Neighborhood" value={ep.neighborhood} />
        </div>
      </Section>

      {/* ── Section 3: Zoning Information ────────────────────────────────── */}
      <Section id="zoning-information" icon={FileText} title="Zoning Information">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <GridStat label="Zone Code" value={zi.zone_code} />
          <GridStat label="District" value={zi.zoning_district} />
          <GridStat label="Jurisdiction" value={zi.jurisdiction} />
        </div>
        {zi.zoning_description && (
          <p className="text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 mb-3">
            {zi.zoning_description}
          </p>
        )}
        <div className="space-y-0.5">
          {zi.additional_regulations && (
            <StatRow label="Additional Regulations" value={zi.additional_regulations} />
          )}
          {zi.code_link && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500 dark:text-slate-400">Code Reference</span>
              <a
                href={zi.code_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#F59E0B] hover:underline flex items-center gap-1"
              >
                View Code <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
        {zi.is_fallback && (
          <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Zoning data is estimated based on use code. Verify with Brevard County for official zoning confirmation.
          </div>
        )}
      </Section>

      {/* ── Section 4: Development Capacity ──────────────────────────────── */}
      {dc && (
        <Section id="development-capacity" icon={BarChart3} title="Development Capacity">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <GridStat
              label="Max Building Area"
              value={dc.max_building_area_sqft ? `${fmtN(dc.max_building_area_sqft)} sq ft` : '—'}
              sub={dc.far ? `FAR ${dc.far}` : undefined}
            />
            <GridStat
              label="Max Height"
              value={dc.max_height_ft ? `${dc.max_height_ft} ft` : '—'}
              sub={dc.max_height_stories ? `${dc.max_height_stories} stories` : undefined}
            />
            <GridStat
              label="Max Lot Coverage"
              value={dc.max_lot_coverage_pct ? `${dc.max_lot_coverage_pct}%` : '—'}
              sub={dc.max_building_footprint_sqft ? `${fmtN(dc.max_building_footprint_sqft)} sq ft` : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Residential</p>
              <div className="space-y-0.5">
                <StatRow label="Density" value={dc.residential_density_du_acre ? `${dc.residential_density_du_acre} du/acre` : '—'} />
                <StatRow label="Max Units" value={dc.max_residential_units ?? '—'} />
                <StatRow label="Max Residential Area" value={dc.max_residential_area_sqft ? `${fmtN(dc.max_residential_area_sqft)} sq ft` : '—'} />
                <StatRow label="Max Lodging Rooms" value={dc.max_lodging_rooms ?? '—'} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Commercial</p>
              <div className="space-y-0.5">
                <StatRow label="Max Office Area" value={dc.max_office_area_sqft ? `${fmtN(dc.max_office_area_sqft)} sq ft` : '—'} />
                <StatRow label="Max Commercial Area" value={dc.max_commercial_area_sqft ? `${fmtN(dc.max_commercial_area_sqft)} sq ft` : '—'} />
                <StatRow label="Min Open Space" value={dc.min_open_space_sqft ? `${fmtN(dc.min_open_space_sqft)} sq ft` : '—'} />
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Calculated from lot size × zoning standards. Verify with county before development.
          </p>
        </Section>
      )}

      {/* ── Section 5: Setbacks ───────────────────────────────────────────── */}
      <Section id="setbacks" icon={Ruler} title="Setbacks">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <GridStat label="Primary Frontage" value={sb.primary_frontage_ft ? `${sb.primary_frontage_ft} ft` : '—'} />
          <GridStat label="Secondary Frontage" value={sb.secondary_frontage_ft ? `${sb.secondary_frontage_ft} ft` : '—'} />
          <GridStat label="Side" value={sb.side_ft ? `${sb.side_ft} ft` : '—'} />
          <GridStat label="Rear" value={sb.rear_ft ? `${sb.rear_ft} ft` : '—'} />
          <GridStat label="Waterfront" value={sb.water_ft ? `${sb.water_ft} ft` : '—'} />
        </div>
      </Section>

      {/* ── Section 6: Permitted Uses ─────────────────────────────────────── */}
      {Object.keys(s.permitted_uses).length > 0 && (
        <Section id="permitted-uses" icon={CheckCircle} title="Allowed Uses" defaultOpen={false}>
          <div className="mb-3 flex gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> By Right
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Warrant / Conditional
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Special Exception
            </span>
          </div>
          <div className="space-y-4">
            {Object.entries(s.permitted_uses).map(([category, uses]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  {category}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {uses.right.map((u) => (
                    <UseBadge key={u} type="right" label={u} />
                  ))}
                  {uses.warrant.map((u) => (
                    <UseBadge key={u} type="warrant" label={u} />
                  ))}
                  {uses.exception.map((u) => (
                    <UseBadge key={u} type="exception" label={u} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Section 9: BCPAO Property Intelligence ───────────────────────── */}
      <Section id="bcpao-intelligence" icon={FileText} title="BCPAO Property Intelligence" badge="ZoneWise Advantage">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <GridStat label="Building Value" value={fmt$(bp.building_value)} />
          <GridStat label="Land Value" value={fmt$(bp.land_value)} />
          <GridStat label="Total Assessed" value={fmt$(bp.total_assessed_value)} />
        </div>
        <div className="space-y-0.5">
          <StatRow label="Owner" value={bp.owner_name} />
          <StatRow label="Mailing Address" value={bp.mailing_address} />
          <StatRow label="Homestead Exemption" value={fmt$(bp.homestead_exemption)} />
          <StatRow label="Subdivision" value={bp.subdivision_name} />
          <StatRow label="Millage Code" value={bp.millage_code} />
          <StatRow label="Exemption Code" value={bp.exemption_code} />
        </div>
      </Section>

      {/* ── Section 10: 3D Massing Preview ───────────────────────────────── */}
      <Section id="massing-preview" icon={Box} title="3D Massing Preview" badge="ZoneWise Advantage" defaultOpen={false}>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">{mp.description}</p>
            <a
              href={mp.interactive_url}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E3A5F] hover:bg-[#1E3A5F]/80 text-white text-sm font-medium transition-colors print:hidden"
            >
              <Box className="w-4 h-4" />
              Open Interactive 3D Model
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
          {mp.static_preview_url ? (
            <div className="w-full sm:w-48 h-36 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mp.static_preview_url} alt="3D massing preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full sm:w-48 h-36 rounded-lg bg-[#1E3A5F]/10 dark:bg-slate-800 flex flex-col items-center justify-center gap-2">
              <Box className="w-10 h-10 text-[#1E3A5F]/40 dark:text-slate-500" />
              <span className="text-xs text-gray-400 dark:text-slate-500 text-center px-2">
                3D preview available in interactive mode
              </span>
            </div>
          )}
        </div>
      </Section>

      {/* ── Section 11: ML Risk Score ─────────────────────────────────────── */}
      <Section id="ml-risk-score" icon={BarChart3} title="ML Risk Score" badge="Coming Soon" defaultOpen={false}>
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/60 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
          <div>
            <p className="font-medium text-gray-700 dark:text-slate-300">BidDeed.AI Integration</p>
            <p className="text-xs mt-0.5">Purchase probability, foreclosure risk indicators, and market trend analysis coming soon.</p>
          </div>
        </div>
      </Section>

      {/* ── Section 7: Maps ───────────────────────────────────────────────── */}
      <Section id="maps-visuals" icon={Trees} title="Maps & Visuals" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">Aerial Photo</p>
            {s.maps_visuals.aerial_photo_url ? (
              <div className="rounded-lg overflow-hidden h-48 bg-slate-200 dark:bg-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.maps_visuals.aerial_photo_url}
                  alt="Aerial photo"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.parentElement!.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-gray-400">Photo unavailable</div>' }}
                />
              </div>
            ) : (
              <div className="rounded-lg h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-gray-400">
                No aerial photo available
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">Zoning Map</p>
            <div className="rounded-lg h-48 bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-2">
              <MapPin className="w-8 h-8 text-gray-300 dark:text-slate-600" />
              <span className="text-xs text-gray-400 dark:text-slate-500">Zoning map overlay</span>
              <a
                href={`https://maps.brevardfl.gov/?parcel=${encodeURIComponent(lot.parcel_id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#F59E0B] hover:underline flex items-center gap-1"
              >
                View on Brevard GIS <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-500 print:mt-4">
        <p className="font-semibold text-gray-600 dark:text-slate-400 mb-1">Disclaimer</p>
        <p>
          This report is prepared for informational purposes only and does not constitute legal, zoning, financial, or investment advice.
          Zoning information is based on publicly available Brevard County data and may not reflect recent amendments.
          Development capacity calculations are estimates based on recorded zoning standards and actual lot dimensions.
          Always verify with the applicable jurisdiction before making investment or development decisions.
        </p>
        <p className="mt-2">
          Report generated by ZoneWise.AI | zonewise.ai | Powered by Brevard County public data
        </p>
      </div>

      {/* ── Print footer ─────────────────────────────────────────────────── */}
      <div className="hidden print:block mt-4 pt-4 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
        <span>ZoneWise.AI — Property Zoning Report</span>
        <span>Parcel: {lot.parcel_id}</span>
      </div>
    </div>
  )
}
